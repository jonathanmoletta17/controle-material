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
    return psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
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
        
        # --- SCRAPING LOOP ---
        current_page = 1
        has_next_page = True
        total_updated = 0
        
        while has_next_page:
            print(f"\n--- Processando Página {current_page} ---")
            
                print("DEBUG: Página carregada. Capturando HTML...", flush=True)
                # Screenshot for visual debug
                page.screenshot(path="debug_table_before.png")
                
                with open("debug_page_source.html", "w", encoding="utf-8") as f:
                    f.write(page.content())
                
                print("DEBUG: HTML salvo. Buscando tabela...", flush=True)

                # Wait for table
                page.wait_for_selector("table tbody tr", timeout=20000)
                
                # Get all rows
                rows = page.locator("table tbody tr").all()
                print(f"Encontradas {len(rows)} linhas na tabela.", flush=True)

                with open("debug_cells.txt", "w", encoding="utf-8") as f:
                    for i, row in enumerate(rows):
                        cells = row.locator("td").all_text_contents()
                        f.write(f"DEBUG ROW {i}: {cells}\n")
                        print(f"DEBUG ROW {i}: {cells}", flush=True)

                        # TENTATIVA DE MAPEAMENTO (Ajustar baseada no output real se falhar)
                    # Exemplo hipotético de colunas:
                    # 0: Código Elemento? 
                    # 1: Código Item (GCE)? -> formato 0000.0000.000000
                    # 2: Descrição?
                    # 3: Nº Ata?
                    # 4: Validade?
                    # 5: Valor?
                    
                    codigo_gce = None
                    ata_num = None
                    validade = None
                    valor = None

                    # Procura o código GCE nas células
                    for cell in cells:
                        cell = cell.strip()
                        if re.match(r"^\d{4}\.\d{4}\.\d{6}$", cell):
                            codigo_gce = cell
                            break
                    
                    if not codigo_gce:
                        continue # Pula se não achar código GCE

                    # Assume posições relativas ou procura padrões para os outros dados
                    # Assumindo que Ata tem formato XXXX/XXXX ou similar, ou é apenas um número
                    # Assumindo Validade é data dd/mm/yyyy
                    # Assumindo Valor tem R$ ou vírgula
                    
                    # IMPLEMENTAÇÃO ROBUSTA: Varrer células
                    for cell in cells:
                        txt = cell.strip()
                        if txt == codigo_gce: continue
                        
                        # Data (Validade)
                        if re.match(r"^\d{2}/\d{2}/\d{4}$", txt):
                            validade = parse_date(txt)
                        
                        # Valor (contém R$ ou formato moeda) -- Cuidado para não confundir com outros valores
                        elif "R$" in txt or re.match(r"^\d{1,3}(\.\d{3})*,\d{2}$", txt):
                             # Se já pegamos um valor, talvez seja melhor não sobrescrever ou usar lógica específica
                             # Normalmente o valor unitário da ata é o que queremos
                             if not valor: 
                                 valor = parse_currency(txt)
                        
                        # Ata (difícil padronizar, mas geralmente é curta e tem ano)
                        # Ex: 0123/2024. Vamos pegar o que sobrar ou usar índice fixo se descoberta a estrutura
                        # Por enquanto, vou confiar na ordem se o usuário confirmar, mas vou tentar mapear indices fixos
                        # Baseado no pedido "atualizar a ata mais recente", deve ser um campo explícito.
                    
                    # REFINANDO COM ÍNDICES FIXOS (Mais seguro se a tabela for padrão)
                    # Vou usar os índices baseados no debug ou assumir o padrão mais comum.
                    # Se falhar, o log vai mostrar.
                    # Vamos chutar índices comuns:
                    # Col 0: Codigo GCE? ou Col 1.
                    # Vamos tentar pegar indices baseados na primeira linha detectada (logica 1.0)
                    # Vou assumir que:
                    # Codigo GCE é o identificador.
                    # Precisamos do numero da ATA e Validade.
                    
                    # ESTRATÉGIA MELHOR:
                    # Se achamos o Código GCE na coluna I,
                    # Ata costuma estar próxima.
                    # Validade é data.
                    # Vamos tentar pegar a string que parece uma Ata.
                    
                    # Para a primeira versão, vamos tentar identificar colunas pelo cabeçalho?
                    # Não, o Playwright pega tbody direto.
                    # Vamos pegar índices fixos baseados num layout comum de "Listar Itens".
                    # Geralmente: Item, Descricao, Unidade, Preço, Ata, Validade, Fornecedor
                    
                    # Se eu não tenho certeza das colunas, vou logar as células e tentar inferir no loop
                    # Mas para "funcionar" agora, vou tentar pegar:
                    # Codigo = Regex GCE
                    # Data = Regex Data
                    # Ata = Célula que não é data, nem valor, nem código, nem descrição longa?
                    
                    # Vamos simplificar:
                    # Se encontrou código GCE.
                    # Atualiza no banco.
                    
                    if codigo_gce:
                        # Tenta achar a ata e validade nas outras colunas
                         # Pega a data (validade)
                        dates = [c for c in cells if re.match(r"^\d{2}/\d{2}/\d{4}$", c.strip())]
                        validade_str = dates[0] if dates else None
                        validade_db = parse_date(validade_str)

                        # Pega o valor
                        money = [c for c in cells if "R$" in c or re.match(r"^\d+,\d{2}$", c.strip())]
                        valor_db = None
                        if money:
                             valor_db = parse_currency(money[0])

                        # Pega a Ata (geralmente tem barra e ano, ex 123/2023)
                        atas = [c for c in cells if "/" in c and not re.match(r"^\d{2}/\d{2}/\d{4}$", c.strip()) and len(c) < 20]
                        ata_db = atas[0].strip() if atas else None

                        if ata_db and validade_db:
                            try:
                                cur = conn.cursor()
                                # Atualiza items
                                cur.execute("""
                                    UPDATE items 
                                    SET ata = %s, validade_ata = %s, valor_unitario_ata = %s
                                    WHERE codigo_gce = %s
                                """, (ata_db, validade_db, valor_db, codigo_gce))
                                if cur.rowcount > 0:
                                    total_updated += 1
                                conn.commit()
                                cur.close()
                            except Exception as db_err:
                                print(f"Erro DB ao atualizar {codigo_gce}: {db_err}")
                                conn.rollback()

                # --- PAGINATION ---
                # Clica no próximo número
                next_page = current_page + 1
                
                # Procura link com o texto do próximo número
                # Seletor: a.paginate_button >> text="2" (estrito)
                next_link = page.locator(f"a.paginate_button:text-is('{next_page}')")
                
                if next_link.count() > 0 and next_link.is_visible():
                    print(f"Indo para página {next_page}...")
                    # --- DEBUG LIMIT ---
                    if current_page >= 1:
                        print("DEBUG: Limite de 1 página atingido. Parando.")
                        has_next_page = False
                        break
                    # -------------------
                    next_link.click()
                    # Espera a tabela atualizar (loading ou mudança de linha)
                    # Um jeito simples é esperar que o botão da página atual mude de classe ou desapareça/fique disabled
                    # Ou esperar um pequeno tempo fixo + verificação
                    time.sleep(2) # Espera simples por segurança
                    current_page += 1
                else:
                    print("Próxima página não encontrada. Fim da paginação.")
                    has_next_page = False
                    
            except Exception as e:
                print(f"Erro na página {current_page}: {e}")
                has_next_page = False

        print(f"Processamento finalizado. Total de itens atualizados: {total_updated}")
        conn.close()
        browser.close()

if __name__ == "__main__":
    scrape_atas()
