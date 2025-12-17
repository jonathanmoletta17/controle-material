import {
  type Item,
  type InsertItem,
  type Movimento,
  type InsertMovimento,
  items,
  movimentos,
} from "@shared/schema";
import { db } from "../../db";
import { eq, sql } from "drizzle-orm";

class InventoryService {
  private calculateStatus(estoqueAtual: number, estoqueMinimo: number, ativo: boolean): "Estoque OK" | "Baixo Estoque" | "Desativado" {
    if (!ativo) return "Desativado";
    if (estoqueAtual <= estoqueMinimo) return "Baixo Estoque";
    return "Estoque OK";
  }

  async getAllItems(): Promise<Item[]> {
    return db.select().from(items).orderBy(items.setor, items.codigoGce);
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getItemByCodigo(codigo: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.codigoGce, codigo));
    return item || undefined;
  }

  async createItem(insertItem: InsertItem): Promise<Item> {
    const status = this.calculateStatus(
      insertItem.estoqueAtual || 0,
      insertItem.estoqueMinimo || 0,
      insertItem.ativo ?? true
    );

    const [item] = await db
      .insert(items)
      .values({
        ...insertItem,
        statusEstoque: status,
        dataAtualizacao: new Date(),
      })
      .returning();
    return item;
  }

  async updateItem(id: string, updateData: Partial<InsertItem>): Promise<Item | undefined> {
    const existing = await this.getItem(id);
    if (!existing) return undefined;

    const estoqueAtual = updateData.estoqueAtual ?? existing.estoqueAtual;
    const estoqueMinimo = updateData.estoqueMinimo ?? existing.estoqueMinimo;
    const ativo = updateData.ativo ?? existing.ativo;

    const status = this.calculateStatus(estoqueAtual, estoqueMinimo, ativo);

    const [item] = await db
      .update(items)
      .set({
        ...updateData,
        statusEstoque: status,
        dataAtualizacao: new Date(),
      })
      .where(eq(items.id, id))
      .returning();
    return item || undefined;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    return result.length > 0;
  }

  async getMovimentos(itemId: string): Promise<Movimento[]> {
    return db
      .select()
      .from(movimentos)
      .where(eq(movimentos.itemId, itemId))
      .orderBy(sql`${movimentos.dataMovimento} DESC`);
  }

  async createMovimento(insertMovimento: InsertMovimento): Promise<Movimento> {
    const item = await this.getItem(insertMovimento.itemId);
    if (!item) {
      throw new Error("Item nao encontrado");
    }

    let quantidadeAlteracao = insertMovimento.quantidade;
    
    if (insertMovimento.tipo === "saida") {
      quantidadeAlteracao = -Math.abs(insertMovimento.quantidade);
    } else if (insertMovimento.tipo === "entrada" || insertMovimento.tipo === "compra" || insertMovimento.tipo === "retorno") {
      quantidadeAlteracao = Math.abs(insertMovimento.quantidade);
    }

    const novoEstoque = item.estoqueAtual + quantidadeAlteracao;

    const [movimento] = await db
      .insert(movimentos)
      .values({
        ...insertMovimento,
        quantidade: quantidadeAlteracao,
        dataMovimento: insertMovimento.dataMovimento || new Date(),
      })
      .returning();

    await this.updateItem(insertMovimento.itemId, {
      estoqueAtual: novoEstoque,
    });

    return movimento;
  }

  async getAlerts(): Promise<Item[]> {
    return db
      .select()
      .from(items)
      .where(
        sql`${items.ativo} = false OR ${items.estoqueAtual} <= ${items.estoqueMinimo}`
      );
  }
}

export const inventoryService = new InventoryService();
