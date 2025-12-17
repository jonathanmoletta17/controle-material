# Estudo de Viabilidade e Planejamento: Migração SQLite para PostgreSQL

## 1. Objetivo
Migrar a camada de persistência de dados do sistema "Controle de Material" de **SQLite** (banco baseado em arquivo local) para **PostgreSQL** (banco cliente-servidor robusto), visando maior consistência, suporte a concorrência e integridade de dados.

## 2. Benefícios da Migração
*   **Concorrência Real:** O SQLite bloqueia o arquivo inteiro durante escritas. O PostgreSQL suporta múltiplas conexões simultâneas de leitura e escrita sem travamentos (MVCC), essencial se mais de uma pessoa usar o sistema.
*   **Tipagem Forte (Enums):** Resolve definitivamente os problemas de tipagem encontrados recentemente (ex: `Setor` e `TipoMovimento`). O PostgreSQL possui tipos `ENUM` nativos, impedindo que strings inválidas sejam salvas no banco.
*   **Segurança de Dados:** Separa o banco da aplicação. Se o servidor da aplicação cair ou o arquivo for deletado acidentalmente, o banco de dados permanece seguro em seu próprio processo/servidor.
*   **Tipos de Dados Avançados:** Suporte nativo a JSONB (útil para guardar atributos flexíveis de materiais), Arrays e datas com timezone preciso.

## 3. Impacto Técnico no Código (Drizzle ORM)

Como já utilizamos o Drizzle ORM, a migração é facilitada, mas exige refatoração na definição do Schema.

### 3.1. Dependências (`package.json`)
*   **Remover:** `better-sqlite3`, `@types/better-sqlite3`.
*   **Adicionar:** `pg` (driver oficial), `@types/pg`.

### 3.2. Definição do Schema (`shared/schema.ts`)
A sintaxe deve mudar de `sqlite-core` para `pg-core`.

**De (SQLite):**
```typescript
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const items = sqliteTable("items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  setor: text("setor").notNull(), // Apenas texto, sem validação de banco
  // ...
});
```

**Para (PostgreSQL):**
```typescript
import { pgTable, serial, text, pgEnum, integer } from "drizzle-orm/pg-core";

// Criação de Enums Nativos (Garante integridade)
export const setorEnum = pgEnum("setor_enum", ["ELETRICA", "MARCENARIA", ...]);

export const items = pgTable("items", {
  id: serial("id").primaryKey(), // 'serial' para auto-incremento
  setor: setorEnum("setor").notNull(), // Validação forte no banco
  // ...
});
```

### 3.3. Conexão (`server/db.ts`)
A inicialização do banco muda de arquivo local para URL de conexão.

**Novo padrão:**
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
```

## 4. Infraestrutura Necessária

### 4.1. Ambiente Local (Desenvolvimento)
Para rodar o PostgreSQL localmente no Windows, temos duas opções:
1.  **Docker (Recomendado):** Subir um container Postgres. É limpo, isolado e fácil de ligar/desligar.
    *   *Comando:* `docker run --name pg-controle -e POSTGRES_PASSWORD=admin -p 5432:5432 -d postgres`
2.  **Instalação Nativa:** Instalar o PostgreSQL para Windows.

### 4.2. Variáveis de Ambiente
Necessário criar um arquivo `.env` (que já deve ser ignorado no git) contendo:
`DATABASE_URL=postgres://postgres:admin@localhost:5432/controle_material`

## 5. Estratégia de Migração de Dados (ETL)

Como já existem dados no SQLite, não podemos simplesmente trocar o banco.

1.  **Script de Extração:** Ler todos os dados do SQLite (`items` e `movimentos`).
2.  **Script de Transformação:**
    *   Converter datas (SQLite usa string/num, Postgres usa Timestamp).
    *   Converter booleanos (SQLite usa 0/1, Postgres usa true/false).
    *   Validar Enums (garantir que "Eletrica" vire "ELETRICA" para bater com o Enum).
3.  **Script de Carga:** Inserir em lote no PostgreSQL recém-criado.

## 6. Plano de Execução (Roadmap)

1.  [ ] Subir instância PostgreSQL local (Docker).
2.  [ ] Criar branch git `feature/migration-postgres`.
3.  [ ] Alterar `shared/schema.ts` para usar tipos do Postgres.
4.  [ ] Gerar migration do Drizzle (`drizzle-kit generate`).
5.  [ ] Aplicar schema no Postgres (`drizzle-kit push` ou `migrate`).
6.  [ ] Criar script temporário para migrar dados de `sqlite.db` -> Postgres.
7.  [ ] Alterar `server/db.ts` para conectar no Postgres.
8.  [ ] Testar fluxo completo (CRUD de itens e movimentações).
9.  [ ] Merge para `main`.

## 7. Conclusão
A migração é **altamente recomendada**. Embora adicione a complexidade de gerenciar um servidor de banco de dados, ela resolve a fragilidade atual de tipos e prepara a aplicação para múltiplos usuários e relatórios complexos futuros.
