import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import * as XLSX from 'xlsx';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Importação de Dados', () => {
  const tempFilePath = path.join(__dirname, 'temp_import_test.xlsx');

  test.beforeAll(() => {
    // Criar um arquivo Excel temporário para teste
    const data = [
      ["CÓDIGO GCE", "ITEM", "SETOR", "ESTOQUE MÍNIMO", "MANUT.", "V.REF"],
      ["IMP-001", "Item Importado 1", "ELETRICA", "5", "20", "50.00"],
      ["IMP-002", "Item Importado 2", "HIDRAULICA", "3", "15", "30.00"]
    ];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "Planilha1");
    XLSX.writeFile(wb, tempFilePath);
  });

  test.afterAll(() => {
    // Limpar arquivo
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('deve importar arquivo Excel corretamente', async ({ page }) => {
    await page.goto('/import');
    
    // Upload do arquivo
    // Nota: O input type="file" geralmente está escondido em componentes customizados, 
    // mas o Playwright consegue lidar setando no input.
    // O código do ImportPage.tsx tem um input ref={fileInputRef} type="file" style={{ display: "none" }}
    
    // Precisamos fazer o locator achar o input hidden
    // Usando o data-testid que vimos no componente
    const fileInput = page.locator('[data-testid="input-file"]');
    await fileInput.setInputFiles(tempFilePath);
    
    // O código do ImportPage mostra um card com o nome do arquivo e botão "Importar" após seleção
    await expect(page.locator(`text=${path.basename(tempFilePath)}`).first()).toBeVisible();
    
    // Clica em Importar (data-testid="button-import")
    await page.click('[data-testid="button-import"]');
    
    // Espera processamento e resultado
    // ImportPage mostra "Importacao Concluida"
    await expect(page.locator('text=Importacao Concluida').first()).toBeVisible({ timeout: 15000 });
    
    // Verifica números
    await expect(page.locator('text=2').first()).toBeVisible(); // 2 itens importados
    await expect(page.locator('p', { hasText: 'Itens importados' })).toBeVisible();
  });
});
