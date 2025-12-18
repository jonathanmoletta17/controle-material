import { test, expect } from '@playwright/test';
import { db } from '../../server/db';
import { items } from '../../shared/schema';

test.describe('Gerenciamento de Inventário', () => {
  test.beforeEach(async ({ page }) => {
    // Limpar banco de dados antes de cada teste APENAS se estiver em modo de teste explícito
    // Para evitar deletar dados de produção acidentalmente
    if (process.env.NODE_ENV === 'test' || process.env.FORCE_DB_CLEAN === 'true') {
      await db.delete(items);
    }
    await page.goto('/');
  });

  test('deve criar um novo item com sucesso', async ({ page }) => {
    // Navegar para lista de itens
    await page.click('a[href="/items"]');
    await expect(page).toHaveURL('/items');

    // Abrir modal de criação
    await page.click('[data-testid="button-add-item"]');
    
    // Preencher formulário
    await page.fill('[data-testid="input-codigo-gce"]', '1.2.3.4');
    
    // Select no Shadcn UI é um pouco diferente
    await page.click('[data-testid="select-setor"]');
    await page.getByRole('option', { name: 'Eletrica' }).click();

    await page.fill('[data-testid="input-item-nome"]', 'Item de Teste Playwright');
    await page.fill('[data-testid="input-estoque-atual"]', '10');
    await page.fill('[data-testid="input-estoque-minimo"]', '5');
    await page.fill('[data-testid="input-entrada-inicial"]', '10');
    await page.fill('[data-testid="input-patrimonio-inicial"]', '0');

    // Submeter formulário
    await page.click('[data-testid="button-submit"]');

    // Verificar se o item aparece na lista
    // Esperar pelo toast ou pelo fechamento do modal
    await expect(page.getByText('Item de Teste Playwright')).toBeVisible();
  });

  test('deve validar campos obrigatórios', async ({ page }) => {
    await page.goto('/items');
    await page.click('[data-testid="button-add-item"]');
    
    // Tentar salvar sem preencher nada
    await page.click('[data-testid="button-submit"]');
    
    // Verificar mensagens de erro (assumindo que o Shadcn Form mostra erros)
    // O texto exato depende da implementação do Zod/Form, mas geralmente "String must contain at least 1 character(s)" ou "Required"
    // Vamos verificar se ainda estamos no modal (botão salvar ainda visível)
    await expect(page.locator('[data-testid="button-submit"]')).toBeVisible();
  });

  test('deve buscar itens na tabela', async ({ page }) => {
    // Criar um item via banco para testar busca
    await db.insert(items).values({
      codigoGce: '9.9.9.9',
      itemNome: 'Item Busca Específico',
      setor: 'ELETRICA',
      estoqueAtual: 10,
      estoqueMinimo: 5,
      ativo: true
    });

    await page.reload();
    await page.goto('/items');

    await page.fill('[data-testid="input-search"]', 'Busca Específico');
    await expect(page.getByText('Item Busca Específico')).toBeVisible();
  });
});
