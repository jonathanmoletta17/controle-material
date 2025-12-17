# Prompt de Comando: Protocolo de Refatoração "Antigravity"

**Role:** Atue como **Antigravity**, um Arquiteto de Software Sênior e Engenheiro de DevOps especializado em refatoração de sistemas legados e otimização de performance.

**Contexto do Projeto:** Aplicação Web de Controle de Manutenção (React + Node.js + Drizzle ORM + SQLite/PostgreSQL Ready).

---

## Instruções de Execução

Você deve executar uma refatoração cirúrgica e completa no projeto, seguindo rigorosamente as fases abaixo. Seu foco é **Qualidade**, **Robustez** e **Manutenibilidade**.

### FASE 1: Análise e Limpeza (Essentialism)
1.  **Auditoria de Dependências:** Analise o `package.json`. Remova qualquer dependência que não esteja sendo importada ou usada no código fonte.
2.  **Dead Code Elimination:** Identifique e remova funções, variáveis e arquivos não utilizados.
3.  **Desacoplamento:** Remova lógica de negócio de dentro dos componentes UI (React) e mova para *hooks* customizados ou *services*.
4.  **Estrutura de Pastas:** Reorganize a estrutura `client/src` e `server` para agrupar funcionalidades por domínio (Feature-based folder structure) ao invés de por tipo técnico.

### FASE 2: Robustez e Blindagem (Defensive Programming)
1.  **Tratamento de Erros Global:**
    *   **Backend:** Implemente um middleware de erro centralizado no Express que capture exceções assíncronas e erros de validação Zod, retornando respostas HTTP padronizadas (RFC 7807).
    *   **Frontend:** Implemente `ErrorBoundaries` no React para evitar que a tela branca (White Screen of Death) ocorra em falhas de componentes.
2.  **Validação Estrita:** Garanta que todas as rotas de API validem *inputs* e *outputs* usando os schemas do Drizzle/Zod definidos em `shared/schema.ts`.
3.  **Tipagem Forte:** Elimine qualquer uso de `any` no TypeScript. Use *Generics* e *Utility Types* para garantir segurança de tipos entre Frontend e Backend.

### FASE 3: Estratégia de Testes (Quality Assurance)
Implemente uma suíte de testes do zero, pois o projeto carece disso:
1.  **Unitários (Vitest):** Crie testes para todas as funções utilitárias e regras de negócio no backend.
2.  **Integração (Supertest/Vitest):** Crie testes para as rotas da API (`server/routes.ts`), validando sucesso (200), erros de validação (400) e erros de servidor (500).
3.  **Componentes (React Testing Library):** Teste os componentes críticos (`ItemsTable`, `MovementTimeline`) garantindo que renderizam corretamente com dados mockados.

### FASE 4: Documentação e Métricas
1.  **Code Documentation:** Adicione JSDoc para todas as funções exportadas e interfaces complexas.
2.  **Relatório de Qualidade:** Ao final, gere um relatório contendo:
    *   Cobertura de testes (% de linhas/funções).
    *   Complexidade Ciclomática (identifique pontos quentes que precisam de simplificação).
    *   Lista de melhorias de performance aplicadas.

---

## Critérios de Aceite (Definition of Done)
*   [ ] O build (`npm run build`) deve ocorrer sem nenhum *warning*.
*   [ ] O linter (`npm run check`) deve passar sem erros.
*   [ ] Todos os novos testes devem passar (`npm test`).
*   [ ] Nenhuma funcionalidade existente (CRUD de itens, Timeline de movimentação) deve ser quebrada.
*   [ ] O código deve estar pronto para escalar (ex: fácil migração para PostgreSQL).

**Inicie a execução pela FASE 1. Aguardo o plano de ação detalhado.**
