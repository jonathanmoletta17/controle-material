import { sql } from "drizzle-orm";
import { pgTable, text, integer, doublePrecision, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const SETORES = [
  "ELETRICA",
  "MARCENARIA",
  "HIDRAULICA",
  "REFRIGERACAO",
  "PEDREIROS",
  "PINTORES"
] as const;

export type Setor = typeof SETORES[number];

export const STATUS_ESTOQUE = [
  "Estoque OK",
  "Baixo Estoque",
  "Desativado"
] as const;

export type StatusEstoque = typeof STATUS_ESTOQUE[number];

export const TIPOS_MOVIMENTO = [
  "RETIRADA_MANUTENCAO", // Saída do estoque para uso (requer chamado)
  "RETORNO_MANUTENCAO", // Devolução ao estoque (requer chamado)
  "ENTRADA_PATRIMONIO", // Entrada nova no patrimônio
  "PEDIDO_PATRIMONIO", // Transferência Patrimônio -> Estoque Manutenção
  "ADIANTAMENTO_MANUTENCAO", // Entrada direta no estoque manutenção
  "RETIRADA_CONSERVACAO" // Retirada pela equipe de conservação
] as const;

export type TipoMovimento = typeof TIPOS_MOVIMENTO[number];

export const items = pgTable("items", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  setor: text("setor").notNull(),
  codigoGce: text("codigo_gce").notNull(),
  itemNome: text("item_nome").notNull(),
  estoqueMinimo: integer("estoque_minimo").notNull().default(0),
  estoqueAtual: integer("estoque_atual").notNull().default(0),
  patrimonioAtual: integer("patrimonio_atual").notNull().default(0),
  statusEstoque: text("status_estoque").notNull().default("Estoque OK"),
  validadeValorReferencia: timestamp("validade_valor_referencia"), // Anteriormente Data Referencia
  ata: text("ata"),
  validadeAta: timestamp("validade_ata"),
  dataAtualizacao: timestamp("data_atualizacao"),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").notNull().default(true),
});

export const movimentos = pgTable("movimentos", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  quantidade: integer("quantidade").notNull(),
  responsavel: text("responsavel"),
  numeroChamado: text("numero_chamado"),
  setor: text("setor"), // Classificação da demanda
  ata: text("ata"),
  validadeAta: timestamp("validade_ata"),
  numeroPedido: text("numero_pedido"),
  validadeValorReferencia: timestamp("validade_valor_referencia"), // Novo nome para data_referencia
  valorUnitarioRef: doublePrecision("valor_unitario_ref"),
  dataMovimento: timestamp("data_movimento").notNull().defaultNow(),
  observacoes: text("observacoes"),
  usuarioAd: text("usuario_ad"),
  requerente: text("requerente"),
  nomeChamado: text("nome_chamado"),
});

export const itemsRelations = relations(items, ({ many }) => ({
  movimentos: many(movimentos),
}));

export const movimentosRelations = relations(movimentos, ({ one }) => ({
  item: one(items, {
    fields: [movimentos.itemId],
    references: [items.id],
  }),
}));

export const insertItemSchema = createInsertSchema(items, {
  validadeValorReferencia: z.coerce.date().nullable().optional(),
  validadeAta: z.coerce.date().nullable().optional(),
  dataAtualizacao: z.coerce.date().optional(),
}).omit({
  id: true,
  statusEstoque: true,
});

export const insertMovimentoSchema = createInsertSchema(movimentos, {
  validadeValorReferencia: z.coerce.date().nullable().optional(),
  validadeAta: z.coerce.date().nullable().optional(),
  dataMovimento: z.coerce.date().optional(),
}).omit({
  id: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertMovimento = z.infer<typeof insertMovimentoSchema>;
export type Movimento = typeof movimentos.$inferSelect;

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("manutencao"),
});

export const responsaveis = pgTable("responsaveis", {
  id: text("id").primaryKey().$defaultFn(() => uuidv4()),
  nome: text("nome").notNull(),
  idFuncional: text("id_funcional").notNull(),
  ativo: boolean("ativo").notNull().default(true),
});

export const insertResponsavelSchema = createInsertSchema(responsaveis).omit({
  id: true,
});

export type InsertResponsavel = z.infer<typeof insertResponsavelSchema>;
export type Responsavel = typeof responsaveis.$inferSelect;

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
