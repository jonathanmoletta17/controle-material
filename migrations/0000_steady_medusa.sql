CREATE TABLE IF NOT EXISTS "items" (
	"id" text PRIMARY KEY NOT NULL,
	"setor" text NOT NULL,
	"codigo_gce" text,
	"origem_gce" text DEFAULT 'GCE' NOT NULL,
	"item_nome" text NOT NULL,
	"estoque_minimo" integer DEFAULT 0 NOT NULL,
	"estoque_atual" integer DEFAULT 0 NOT NULL,
	"patrimonio_atual" integer DEFAULT 0 NOT NULL,
	"status_estoque" text DEFAULT 'Estoque OK' NOT NULL,
	"validade_valor_referencia" timestamp,
	"ata" text,
	"validade_ata" timestamp,
	"data_atualizacao" timestamp,
	"observacoes" text,
	"imagem_url" text,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "movimentos" (
	"id" text PRIMARY KEY NOT NULL,
	"item_id" text NOT NULL,
	"tipo" text NOT NULL,
	"quantidade" integer NOT NULL,
	"responsavel" text,
	"numero_chamado" text,
	"setor" text,
	"ata" text,
	"validade_ata" timestamp,
	"numero_pedido" text,
	"validade_valor_referencia" timestamp,
	"valor_unitario_ref" double precision,
	"data_real" timestamp DEFAULT now(),
	"data_movimento" timestamp DEFAULT now() NOT NULL,
	"observacoes" text,
	"usuario_ad" text,
	"requerente" text,
	"nome_chamado" text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "responsaveis" (
	"id" text PRIMARY KEY NOT NULL,
	"nome" text NOT NULL,
	"id_funcional" text NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"role" text DEFAULT 'manutencao' NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "items" ALTER COLUMN "codigo_gce" DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "origem_gce" text NOT NULL DEFAULT 'GCE';
--> statement-breakpoint
UPDATE "items" SET "origem_gce" = 'ADIANTAMENTO', "codigo_gce" = NULL WHERE UPPER("codigo_gce") = 'ADIANTAMENTO';
--> statement-breakpoint
UPDATE "items" SET "origem_gce" = 'DESCONTINUADO', "codigo_gce" = NULL WHERE UPPER("codigo_gce") = 'DESCONTINUADO';
--> statement-breakpoint
UPDATE "items" SET "origem_gce" = 'EMPRESTIMO', "codigo_gce" = NULL WHERE UPPER("codigo_gce") IN ('EMPRESTIMO', 'EMPRÉSTIMO');
--> statement-breakpoint
UPDATE "items" SET "origem_gce" = 'ARQUITETURA', "codigo_gce" = NULL WHERE UPPER("codigo_gce") LIKE '%ARQUITETURA%';
--> statement-breakpoint
UPDATE "items" SET "origem_gce" = 'USADOS', "codigo_gce" = NULL WHERE UPPER("codigo_gce") = 'USADOS';
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "movimentos" ADD CONSTRAINT "movimentos_item_id_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."items"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;