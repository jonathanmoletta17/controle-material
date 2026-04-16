import os
import time
import re
import psycopg2
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv
from datetime import datetime

# Carrega variáveis de ambiente
load_dotenv()
print("Script scrape_atas_vigentes.py iniciado...")

# GCE Credentials
ORG = os.getenv("GCE_ORG")
MATRICULA = os.getenv("GCE_MATRICULA")
PASSWORD = os.getenv("GCE_PASSWORD")
TARGET_URL = "https://gce.intra.rs.gov.br/Atas/ItemAta/ListarTodosItensAtaVigente"
LOGIN_URL = "https://gce.intra.rs.gov.br/Atas/ItemAta/ListarTodosItensAtaVigente" # Usando a mesma URL de login do outro script por garantia

# Database Credentials
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

def get_db_connection():
    host = DB_HOST
    port = DB_PORT
    
    # Se estiver rodando localmente (fora do docker) e o host for 'db', 
    # ajusta para localhost e a porta externa exposta (ex: 5434)
    if host == 'db' and not os.path.exists('/.dockerenv'):
        print("Aviso: Rodando fora do Docker. Redirecionando conexão do banco para localhost:5434")
        host = 'localhost'
        port = os.getenv("DB_EXTERNAL_PORT", "5434")

    return psycopg2.connect(
        host=host,
        port=port,
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASS
    )

def parse_currency(value):
    if not value or value.strip() == '':
        return None
    try:
        # Remove R$ e espaços
        clean = value.replace('R$', '').strip()
        # Remove pontos de milhar e troca vírgula decimal por ponto
        clean = clean.replace('.', '').replace(',', '.')
        return float(clean)
    except:
        return None

def parse_date(value):
    if not value or value.strip() == '':
        return None
    try:
        # Esperado: dd/mm/yyyy
        return datetime.strptime(value.strip(), '%d/%m/%Y').strftime('%Y-%m-%d')
    except:
        return None

def scrape_atas():
    if not all([ORG, MATRICULA, PASSWORD]):
        print("ERRO CRÍTICO: Credenciais GCE não encontradas.")
        return

    conn = None
    try:
        conn = get_db_connection()
        print("Conexão com banco de dados estabelecida.")
    except Exception as e:
        print(f"Erro ao conectar ao banco: {e}")
        return

    with sync_playwright() as p:
        is_headless = os.getenv("HEADLESS", "true").lower() == "true"
        browser = p.chromium.launch(headless=is_headless)
        context = browser.new_context()
        page = context.new_page()

        # --- LOGIN LOGIC (Reused) ---
        print(f"Acessando página de login...")
        page.goto(LOGIN_URL)
        
        try:
            print("Aguardando carregamento...")
            page.wait_for_selector("#login, #textoPesquisaItem", timeout=30000)
            
            if page.locator("#login").is_visible():
                print("Realizando login...")
                page.locator('input#login[placeholder="Organização"]').fill(ORG)
                page.locator('input#matricula[placeholder="Matrícula"]').fill(MATRICULA)
                
                password_selector = 'input#password[placeholder="Senha"]'
                page.wait_for_selector(password_selector, timeout=10000)
                page.locator(password_selector).fill(PASSWORD)
                
                time.sleep(1)
                page.click('#btnLogin')
                page.wait_for_timeout(5000) # Wait for redirect
                
                # Verifica se logou
                if page.locator("#login").is_visible():
                     print("ERRO: Login falhou (ainda na tela de login).")
                     browser.close()
                     return
                print("Login realizado.")
            else:
                 print("Já estava logado.")

        except Exception as e:
            print(f"Erro no login: {e}")
            browser.close()
            return

        # --- NAVIGATE TO TARGET PAGE ---
        print(f"Navegando para: {TARGET_URL}")
        page.goto(TARGET_URL)
        
        # --- SCRAPING BULK PROCESSING VIA PAGINATION ---
        try:
            print("Iniciando varredura com paginação...")
            updates = []
            page_num = 1
            
            while True:
                print(f"--- Processando Página {page_num} ---")
                
                # Aguarda o aviso de "Processando..." sumir
                processing_locator = page.locator("#dtTodosItensAtaVigente_processing")
                if processing_locator.is_visible():
                    processing_locator.wait_for(state="hidden", timeout=60000)
                
                time.sleep(1) # Extra stability for DataTables JS redraw
                
                # Vamos buscar todas as linhas rendered na página atual
                rows = page.locator("table tbody tr").all()
                print(f"Encontradas {len(rows)} linhas na página {page_num}.")
                
                for i, row in enumerate(rows):
                    # Extrai texto bruto (células)
                    cells = row.locator("td").all_text_contents()
                    
                    if len(cells) < 5: 
                        continue

                    codigo_gce = None
                    
                    # Encontra Codigo GCE formatado (ex: 0000.0000.000000)
                    for cell in cells:
                        cell = cell.strip()
                        if re.match(r"^\d{4}\.\d{4}\.\d{6}$", cell):
                            codigo_gce = cell
                            break
                            
                    if not codigo_gce:
                        continue
                    
                    # Coleta Validade do Final da Linha
                    possible_date = cells[-1].strip()
                    if re.match(r"^\d{2}/\d{2}/\d{4}$", possible_date):
                        validade_str = possible_date
                    else:
                        dates = [c for c in cells if re.match(r"^\d{2}/\d{2}/\d{4}$", c.strip())]
                        validade_str = dates[-1] if dates else None
                        
                    validade_db = parse_date(validade_str)
                    
                    # Coleta Valor (Money)
                    money = [c for c in cells if "R$" in c or re.match(r"^\d+,\d{2}$", c.strip())]
                    valor_db = None
                    if money:
                        valor_db = parse_currency(money[0])
                        
                    # Coleta Número da ATA ignorando Datas
                    atas = [c for c in cells if "/" in c and not re.match(r"^\d{2}/\d{2}/\d{4}$", c.strip()) and len(c) < 20]
                    ata_db = atas[0].strip() if atas else None
                    
                    if ata_db and validade_db:
                        # Monta pacote (val, valUnitario, ident, ident) 
                        updates.append((validade_db, valor_db, codigo_gce, ata_db))

                # --- Paginação ---
                # Acha o número da próxima página (ex: se estamos na 1, procura o botão "2").
                # Isso é muito mais seguro do que um XPath absoluto (que pode quebrar) ou xpath fixo de posição a[2]
                next_page_str = str(page_num + 1)
                next_button = page.locator(f"xpath=//a[contains(@class, 'paginate_button') and text()='{next_page_str}']")
                
                # Se o botão não existir, ou se chegamos na última página e por algum motivo ele ficou invisível:
                if next_button.count() == 0 or not next_button.first.is_visible():
                    print(f"Fim da paginação (botão '{next_page_str}' não encontrado). Última página atingida: {page_num}")
                    break
                
                # Clica na próxima página e aguarda a transição
                print("Indo para a próxima página...")
                next_button.click(force=True)
                
                # Espera 1s para o site acusar que está "processando" e volta ao loop, que aguardará o processando sumir
                time.sleep(1)
                
                page_num += 1

            # --- BULK Pushing para o BD ---
            print(f"\nExtração concluída com sucesso! Varremos {page_num} páginas. Gerados {len(updates)} pacotes de atualização.")
            print("Executando injeção em lote no banco local...")
            
            if updates:
                total_updated = 0
                cur = conn.cursor()
                try:
                    # Prepara a query de UPDATE
                    query = """
                        UPDATE items 
                        SET validade_ata = %s, valor_unitario_ata = %s
                        WHERE codigo_gce = %s AND ata = %s
                    """
                    
                    # Vamos varrendo um por um e comittando ao final. 
                    for update in updates:
                        cur.execute(query, update)
                        if cur.rowcount > 0:
                            total_updated += int(cur.rowcount)
                            
                    conn.commit()
                    print(f"==> OPERAÇÃO CONCLUÍDA: {total_updated} linhas efetivamente corrigidas e ativadas no banco local <==")
                except Exception as db_err:
                    print(f"Erro CRÍTICO no momento do commit em massa: {db_err}")
                    conn.rollback()
                finally:
                    cur.close()
            else:
                print("Nenhum dado qualificado de Data ou ATA foi detectado para efetuar update nas listagens.")
                
        except Exception as e:
            print(f"Erro na varredura HTML ou interação de paginação: {e}")

        if conn:
            conn.close()
        browser.close()

if __name__ == "__main__":
    scrape_atas()
