import os
import time
import re
import psycopg2
from playwright.sync_api import sync_playwright
from dotenv import load_dotenv

# Carrega variáveis de ambiente
load_dotenv()
print("Script update_atas.py iniciado...")

# GCE Credentials
ORG = os.getenv("GCE_ORG")
MATRICULA = os.getenv("GCE_MATRICULA")
PASSWORD = os.getenv("GCE_PASSWORD")
SEARCH_URL = "https://gce.intra.rs.gov.br/Itens/Solicitacao/ConsultaGeralItens"

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

def update_atas():
    # 1. Conecta ao banco para buscar itens
    try:
        if not all([ORG, MATRICULA, PASSWORD]):
            print("ERRO CRÍTICO: Credenciais GCE (ORG, MATRICULA, PASSWORD) não encontradas no ambiente.")
            return

        print("Conectando ao banco de dados...")
        conn = get_db_connection()
        cur = conn.cursor()
        # Assume-se que a tabela é 'items' e tem os campos 'id', 'codigo_gce', 'ata', 'validade_ata', 'valor_unitario_ata'
        cur.execute("SELECT id, codigo_gce FROM items WHERE codigo_gce IS NOT NULL")
        items = cur.fetchall()
        print(f"Encontrados {len(items)} itens para verificar.")
    except Exception as e:
        print(f"Erro ao conectar ao banco de dados ou buscar itens: {e}")
        return

    with sync_playwright() as p:
        # Inicia o navegador (Headless True por padrão no Docker)
        is_headless = os.getenv("HEADLESS", "true").lower() == "true"
        browser = p.chromium.launch(headless=is_headless)
        context = browser.new_context()
        page = context.new_page()

        # Login
        print(f"Navegando para {SEARCH_URL}...")
        page.goto(SEARCH_URL)

        try:
            # Espera carregar ou detecta login
            print("Aguardando carregamento da página...")
            page.wait_for_selector("#login, #textoPesquisaItem", timeout=30000)
            
            if page.locator("#login").is_visible():
                print("Tela de login detectada. Realizando login...")
                
                # Preenche os campos com seletores mais específicos para evitar ambiguidade
                # O portal GCE possui múltiplos elementos com o mesmo ID para diferentes tipos de login
                print("Preenchendo credenciais...")
                page.locator('input#login[placeholder="Organização"]').fill(ORG)
                page.locator('input#matricula[placeholder="Matrícula"]').fill(MATRICULA)
                
                # Tenta preencher a senha e verifica se foi preenchida
                password_selector = 'input#password[placeholder="Senha"]'
                page.wait_for_selector(password_selector, timeout=10000)
                password_field = page.locator(password_selector)
                password_field.fill(PASSWORD)
                
                # Pequena pausa para garantir que o sistema processou o preenchimento
                time.sleep(1)
                
                if not password_field.input_value():
                    print("ERRO CRÍTICO: Campo de senha não foi preenchido corretamente.")
                    browser.close()
                    return

                print("Campos preenchidos. Enviando formulário...")
                page.screenshot(path="debug_before_login.png")
                page.click('#btnLogin')
                page.wait_for_timeout(5000)
                page.screenshot(path="login_after_btn.png")
                page.goto(SEARCH_URL)
                # Valida se o login teve sucesso procurando pelo campo de pesquisa
                print("Aguardando validação de login...")
                try:
                    page.wait_for_selector("#textoPesquisaItem", timeout=20000)
                    print("Login realizado com sucesso!")
                except:
                    print("ERRO: Falha ao validar login. O campo de pesquisa não apareceu.")
                    page.screenshot(path="login_failed.png")
                    browser.close()
                    return
            else:
                print("Já logado ou campo de pesquisa já visível.")
        except Exception as e:
            print(f"Erro crítico durante o processo de login: {e}")
            page.screenshot(path="login_error.png")
            browser.close()
            return

        for item_id, codigo_gce in items:
            print(f"\n--- Processando Item GCE: {codigo_gce} ---")
            
            # Variáveis para coleta de dados
            ata_num = None
            validade_ata = None
            valor_unitario_ata = None
            valor_unitario_referencia = None
            validade_valor_referencia = None
            
            try:
                # 0. Valida o formato do código GCE
                if not codigo_gce or not re.match(r"^\d{4}\.\d{4}\.\d{6}$", str(codigo_gce).strip()):
                    print(f"Ignorando item '{codigo_gce}': Formato inválido.")
                    continue

                # Navega para a tela de busca
                page.goto(SEARCH_URL)
                
                # Aguarda o campo de pesquisa estar pronto
                page.wait_for_selector("#textoPesquisaItem", timeout=10000)
                
                # 1. Busca o código GCE
                print(f"Pesquisando código {codigo_gce}...")
                search_input = page.locator("#textoPesquisaItem")
                search_input.fill(str(codigo_gce))
                page.keyboard.press("Enter")
                
                # 2. Aguarda o resultado e dá clique duplo
                try:
                    # Espera aparecer um item selecionável
                    item_selector = f"li:has-text('{codigo_gce}')"
                    page.wait_for_selector(item_selector, timeout=15000)
                    
                    target_item = page.locator(item_selector).first
                    if target_item.is_visible():
                        print(f"Item encontrado. Abrindo detalhes...")
                        target_item.dblclick()
                        # Pequeno delay para garantir carregamento do detalhe
                        time.sleep(1)
                    else:
                        print(f"AVISO: Código {codigo_gce} não encontrado.")
                        continue
                except:
                    print(f"AVISO: Item {codigo_gce} não apareceu ou erro ao clicar.")
                    continue

                # 2.A. Coleta o Nome do Modificador (Nome Real do Item)
                # O usuário pediu para ler o value do input #NomeModificador após abrir os detalhes
                item_nome_real = None
                try:
                    nome_selector = "#NomeModificador"
                    page.wait_for_selector(nome_selector, timeout=5000)
                    item_nome_real = page.locator(nome_selector).get_attribute("value")
                    
                    if item_nome_real:
                        print(f"Nome do Item detectado: {item_nome_real}")
                    else:
                        print("AVISO: Campo NomeModificador vazio.")
                except Exception as e:
                     print(f"AVISO: Não foi possível ler o NomeModificador: {e}")

                # 3. Coleta Validade do Valor de Referência (comum a todos os casos)
                try:
                    page.wait_for_selector("#DataValidadeVuma", timeout=5000)
                    # Tenta pegar pelo value ou input_value
                    raw_val = page.locator("#DataValidadeVuma").first.get_attribute("value")
                    if not raw_val:
                        raw_val = page.locator("#DataValidadeVuma").first.input_value()
                        
                    if raw_val and "/" in raw_val:
                        # Formato: "23/08/2025 00:00:00" -> "2025-08-23"
                        d, m, rest = raw_val.split("/")
                        y = rest.split(" ")[0]
                        validade_valor_referencia = f"{y}-{m}-{d}"
                except Exception as e:
                    print(f"DEBUG: Não foi possível capturar validade de referência: {e}")
                
                # 4. Coleta Valor Unitário de Referência (comum a todos os casos)
                try:
                    page.wait_for_selector("#ValorVumaGlobal", timeout=5000)
                    # Tenta pegar pelo value ou input_value
                    valor_unitario_referencia = page.locator("#ValorVumaGlobal").first.input_value()
                    # Converte formato brasileiro (ex: 2.315,31) para SQL (2315.31)
                    
                    valor_unitario_referencia = valor_unitario_referencia.replace(".", "").replace(",", ".")
                    valor_unitario_referencia = float(valor_unitario_referencia)
                    valor_unitario_referencia = round(valor_unitario_referencia, 2)            
                except Exception as e:
                    print(f"DEBUG: Não foi possível capturar validade de referência: {e}")

                # 5. Verifica se há Ata Vigente
                page.wait_for_selector("#ItemAtaVigente", timeout=15000)
                ata_vigente = page.locator("#ItemAtaVigente").input_value()
                print(f"Ata Vigente? {ata_vigente}")

                if ata_vigente == "Sim":
                    print("Consultando Atas Vigentes...")
                    page.click("#btnAtasVigentes")
                    
                    # Extrai detalhes da tabela de Atas
                    try:
                        # Espera a tabela carregar e pega a primeira linha de dados
                        page.wait_for_selector("tr.odd, tr.even", timeout=12000)
                        row = page.locator("tr.odd, tr.even").first
                        cells = row.locator("td").all_text_contents()
                        
                        if len(cells) >= 5:
                            ata_num = cells[0].strip()
                            validade_ata_raw = cells[2].strip()
                            valor_unitario_raw = cells[4].strip()

                            # Converte data brasileira (DD/MM/YYYY) para ISO (YYYY-MM-DD)
                            try:
                                d, m, y = validade_ata_raw.split("/")
                                validade_ata = f"{y}-{m}-{d}"
                            except Exception as e:
                                print(f"AVISO: Falha ao converter data '{validade_ata_raw}': {e}")
                                validade_ata = None # Define como None se falhar

                            # Converte formato brasileiro (ex: 2.315,31) para SQL (2315.31)
                            valor_unitario_ata = valor_unitario_raw.replace(".", "").replace(",", ".")
                        else:
                            print(f"AVISO: Linha da tabela de atas para {codigo_gce} incompleta.")
                    except Exception as ext_err:
                        print(f"ERRO DE EXTRAÇÃO (Tabela de Atas): {ext_err}")
                else:
                    ata_num = 'Sem Ata Vigente'

                # 6. Atualiza o banco de dados com os dados coletados
                print(f"Atualizando DB: Nome={item_nome_real}, Ata={ata_num}, Validade={validade_ata}, Valor Ata={valor_unitario_ata}, Validade Ref={validade_valor_referencia}, Valor Ref={valor_unitario_referencia}")
                try:
                    # Prepara a query dinamicamente se tiver nome ou não (para não sobrescrever com None se falhar a leitura)
                    if item_nome_real:
                         cur.execute("""
                            UPDATE items 
                            SET item_nome = %s, ata = %s, validade_ata = %s, valor_unitario_ata = %s, validade_valor_referencia = %s, valor_unitario_referencia = %s
                            WHERE id = %s
                        """, (item_nome_real, ata_num, validade_ata, valor_unitario_ata, validade_valor_referencia, valor_unitario_referencia, item_id))
                    else:
                        cur.execute("""
                            UPDATE items 
                            SET ata = %s, validade_ata = %s, valor_unitario_ata = %s, validade_valor_referencia = %s, valor_unitario_referencia = %s
                            WHERE id = %s
                        """, (ata_num, validade_ata, valor_unitario_ata, validade_valor_referencia, valor_unitario_referencia, item_id))
                        
                    conn.commit()
                    if cur.rowcount > 0:
                        print(f"Item {codigo_gce} atualizado com sucesso.")
                    else:
                        print(f"AVISO: Nenhuma linha atualizada para o ID {item_id}.")
                except Exception as db_err:
                    print(f"ERRO DE BANCO: {db_err}")
                    conn.rollback()

            except Exception as e:
                print(f"Falha geral ao processar item {codigo_gce}: {e}")
                try:
                    conn.rollback()
                except:
                    pass
                page.screenshot(path=f"debug_ata_{codigo_gce}.png")
            
            # 7. Retorna para a tela de busca ao final do loop
            finally:
                page.goto(SEARCH_URL)
                
        print("\nProcessamento concluído.")
        browser.close()
        cur.close()
        conn.close()

if __name__ == "__main__":
    if not all([ORG, MATRICULA, PASSWORD, DB_NAME, DB_USER, DB_PASS]):
        print("ERRO: Verifique se todas as variáveis GCE e DB estão no seu arquivo .env")
    else:
        update_atas()
