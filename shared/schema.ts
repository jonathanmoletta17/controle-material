import { sql } from "drizzle-orm";
import { pgTable, text, integer, doublePrecision, boolean, timestamp, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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
  "entrada",
  "saida",
  "retorno",
  "ajuste",
  "patrimonio",
  "compra"
] as const;

export type TipoMovimento = typeof TIPOS_MOVIMENTO[number];

export const items = pgTable("items", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  setor: text("setor").notNull(),
  codigoGce: text("codigo_gce").notNull(),
  itemNome: text("item_nome").notNull(),
  estoqueMinimo: integer("estoque_minimo").notNull().default(0),
  estoqueAtual: integer("estoque_atual").notNull().default(0),
  entradaInicial: integer("entrada_inicial").notNull().default(0),
  patrimonioInicial: integer("patrimonio_inicial").notNull().default(0),
  patrimonioAtual: integer("patrimonio_atual").notNull().default(0),
  pedidoPatrimonio: integer("pedido_patrimonio").notNull().default(0),
  statusEstoque: text("status_estoque").notNull().default("Estoque OK"),
  valorReferencia: doublePrecision("valor_referencia"),
  ata: text("ata"),
  compra: text("compra"),
  numeroPedido: text("numero_pedido"),
  dataGeral: timestamp("data_geral"),
  dataEntradaPatrimonio: timestamp("data_entrada_patrimonio"),
  dataSaida: timestamp("data_saida"),
  dataRetorno: timestamp("data_retorno"),
  dataAtualizacao: timestamp("data_atualizacao"),
  dataCompra: timestamp("data_compra"),
  observacoes: text("observacoes"),
  ativo: boolean("ativo").notNull().default(true),
});

export const movimentos = pgTable("movimentos", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  tipo: text("tipo").notNull(),
  quantidade: integer("quantidade").notNull(),
  responsavel: text("responsavel"),
  origem: text("origem"),
  destino: text("destino"),
  ata: text("ata"),
  numeroPedido: text("numero_pedido"),
  valorUnitarioRef: doublePrecision("valor_unitario_ref"),
  dataMovimento: timestamp("data_movimento").notNull().defaultNow(),
  observacoes: text("observacoes"),
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

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  statusEstoque: true,
});

export const insertMovimentoSchema = createInsertSchema(movimentos).omit({
  id: true,
});

export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertMovimento = z.infer<typeof insertMovimentoSchema>;
export type Movimento = typeof movimentos.$inferSelect;

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
