import {
  type Item,
  type InsertItem,
  type Movimento,
  type InsertMovimento,
  items,
  movimentos,
} from "@shared/schema";
import { db } from "../../db";
import { eq, sql, and, gte, lte, getTableColumns } from "drizzle-orm";

class InventoryService {
  async getFilteredMovements(filters: {
    startDate?: string; // Expect ISO string from query
    endDate?: string;
    tipo?: string;
    setor?: string;
    itemId?: string;
  }): Promise<(Movimento & { itemNome: string; codigoGce: string })[]> {
    const conditions = [];

    if (filters.startDate) {
      conditions.push(gte(movimentos.dataMovimento, new Date(filters.startDate)));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(movimentos.dataMovimento, end));
    }
    if (filters.tipo) {
      conditions.push(eq(movimentos.tipo, filters.tipo));
    }
    if (filters.setor) {
      conditions.push(eq(movimentos.setor, filters.setor));
    }
    if (filters.itemId) {
      conditions.push(eq(movimentos.itemId, filters.itemId));
    }

    const result = await db
      .select({
        id: movimentos.id,
        itemId: movimentos.itemId,
        tipo: movimentos.tipo,
        quantidade: movimentos.quantidade,
        responsavel: movimentos.responsavel,
        numeroChamado: movimentos.numeroChamado,
        setor: movimentos.setor,
        ata: movimentos.ata,
        numeroPedido: movimentos.numeroPedido,
        validadeValorReferencia: movimentos.validadeValorReferencia,
        valorUnitarioRef: movimentos.valorUnitarioRef,
        dataMovimento: movimentos.dataMovimento,
        observacoes: movimentos.observacoes,
        usuarioAd: movimentos.usuarioAd,
        itemNome: items.itemNome,
        codigoGce: items.codigoGce,
      })
      .from(movimentos)
      .leftJoin(items, eq(movimentos.itemId, items.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${movimentos.dataMovimento} DESC`);

    return result as (Movimento & { itemNome: string; codigoGce: string })[];
  }

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
    // 1. Validation: Non-negative values
    if ((insertItem.estoqueAtual || 0) < 0) throw new Error("Estoque Atual não pode ser negativo");
    if ((insertItem.estoqueMinimo || 0) < 0) throw new Error("Estoque Mínimo não pode ser negativo");
    if ((insertItem.patrimonioAtual || 0) < 0) throw new Error("Patrimônio Atual não pode ser negativo");

    // 2. Uniqueness: Codigo GCE (unless ADIANTAMENTO)
    if (insertItem.codigoGce.toUpperCase() !== "ADIANTAMENTO") {
      const existingGce = await db.select().from(items).where(eq(items.codigoGce, insertItem.codigoGce)).limit(1);
      if (existingGce.length > 0) {
        throw new Error(`Já existe um item com o Código GCE: ${insertItem.codigoGce}`);
      }
    }

    // 3. Uniqueness: Nome do Item
    const existingName = await db.select().from(items).where(eq(items.itemNome, insertItem.itemNome)).limit(1);
    if (existingName.length > 0) {
      throw new Error(`Já existe um item com o Nome: ${insertItem.itemNome}`);
    }

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

    let quantidadeAlteracaoEstoque = 0;
    let quantidadeAlteracaoPatrimonio = 0;

    // Helper para validar campos obrigatórios
    const requireField = (field: any, name: string) => {
      if (!field && field !== 0) throw new Error(`Campo obrigatório: ${name}`);
    };

    switch (insertMovimento.tipo) {
      case "RETIRADA_MANUTENCAO":
        // Saída do estoque para uso
        requireField(insertMovimento.numeroChamado, "Número do Chamado");
        requireField(insertMovimento.setor, "Setor");
        requireField(insertMovimento.responsavel, "Responsável");

        if (item.estoqueAtual < Math.abs(insertMovimento.quantidade)) {
          throw new Error(`Estoque de Manutenção insuficiente (${item.estoqueAtual}) para esta retirada.`);
        }
        quantidadeAlteracaoEstoque = -Math.abs(insertMovimento.quantidade);
        break;

      case "RETORNO_MANUTENCAO":
        // Devolução ao estoque
        requireField(insertMovimento.numeroChamado, "Número do Chamado (Referência)");
        quantidadeAlteracaoEstoque = Math.abs(insertMovimento.quantidade);
        break;

      case "ENTRADA_PATRIMONIO":
        // Entrada nova no patrimônio
        // Lógica de atualização de metadados (ATA / Data Referência)
        const updateData: any = {};

        // Se o movimento trouxe ATA, atualiza o item (seja para preencher ou corrigir)
        if (insertMovimento.ata) {
          updateData.ata = insertMovimento.ata;
        }

        // Se o movimento trouxe Validade Valor Referência, atualiza o item
        if (insertMovimento.validadeValorReferencia) {
          updateData.validadeValorReferencia = insertMovimento.validadeValorReferencia;
        }

        // Se o movimento trouxe Validade ATA, atualiza o item
        if (insertMovimento.validadeAta) {
          updateData.validadeAta = insertMovimento.validadeAta;
        }

        if (Object.keys(updateData).length > 0) {
          await this.updateItem(item.id, updateData);
        }

        quantidadeAlteracaoPatrimonio = Math.abs(insertMovimento.quantidade);
        break;

      case "PEDIDO_PATRIMONIO":
        // Transfere de Patrimônio para Manutenção
        if (item.patrimonioAtual < Math.abs(insertMovimento.quantidade)) {
          throw new Error(`Estoque de Patrimônio insuficiente (${item.patrimonioAtual}) para atender este pedido.`);
        }
        quantidadeAlteracaoPatrimonio = -Math.abs(insertMovimento.quantidade);
        quantidadeAlteracaoEstoque = Math.abs(insertMovimento.quantidade);
        break;

      case "ADIANTAMENTO_MANUTENCAO":
        // Entrada direta no estoque de manutenção
        quantidadeAlteracaoEstoque = Math.abs(insertMovimento.quantidade);
        break;

      default:
        throw new Error(`Tipo de movimento inválido: ${insertMovimento.tipo}`);
    }

    const novoEstoque = item.estoqueAtual + quantidadeAlteracaoEstoque;
    const novoPatrimonio = item.patrimonioAtual + quantidadeAlteracaoPatrimonio;

    let quantidadeRegistrada = Math.abs(insertMovimento.quantidade);

    const [movimento] = await db
      .insert(movimentos)
      .values({
        ...insertMovimento,
        quantidade: quantidadeRegistrada,
        dataMovimento: insertMovimento.dataMovimento || new Date(),
      })
      .returning();

    await this.updateItem(insertMovimento.itemId, {
      estoqueAtual: novoEstoque,
      patrimonioAtual: novoPatrimonio,
    });

    return movimento;
  }

  async getRecentMovements(limit: number = 100): Promise<(Movimento & { itemNome: string; codigoGce: string })[]> {
    const result = await db
      .select({
        id: movimentos.id,
        itemId: movimentos.itemId,
        tipo: movimentos.tipo,
        quantidade: movimentos.quantidade,
        responsavel: movimentos.responsavel,
        numeroChamado: movimentos.numeroChamado,
        setor: movimentos.setor,
        ata: movimentos.ata,
        numeroPedido: movimentos.numeroPedido,
        validadeValorReferencia: movimentos.validadeValorReferencia,
        valorUnitarioRef: movimentos.valorUnitarioRef,
        dataMovimento: movimentos.dataMovimento,
        observacoes: movimentos.observacoes,
        usuarioAd: movimentos.usuarioAd,
        itemNome: items.itemNome,
        codigoGce: items.codigoGce,
      })
      .from(movimentos)
      .leftJoin(items, eq(movimentos.itemId, items.id))
      .orderBy(sql`${movimentos.dataMovimento} DESC`)
      .limit(limit);

    return result as (Movimento & { itemNome: string; codigoGce: string })[];
  }

  async getAllMovements(): Promise<(Movimento & { itemNome: string; codigoGce: string })[]> {
    const result = await db
      .select({
        id: movimentos.id,
        itemId: movimentos.itemId,
        tipo: movimentos.tipo,
        quantidade: movimentos.quantidade,
        responsavel: movimentos.responsavel,
        numeroChamado: movimentos.numeroChamado,
        setor: movimentos.setor,
        ata: movimentos.ata,
        numeroPedido: movimentos.numeroPedido,
        validadeValorReferencia: movimentos.validadeValorReferencia,
        valorUnitarioRef: movimentos.valorUnitarioRef,
        dataMovimento: movimentos.dataMovimento,
        observacoes: movimentos.observacoes,
        usuarioAd: movimentos.usuarioAd,
        itemNome: items.itemNome,
        codigoGce: items.codigoGce,
      })
      .from(movimentos)
      .leftJoin(items, eq(movimentos.itemId, items.id))
      .orderBy(sql`${movimentos.dataMovimento} DESC`);

    return result as (Movimento & { itemNome: string; codigoGce: string })[];
  }

  async getAlerts(): Promise<Item[]> {
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    return db
      .select()
      .from(items)
      .where(
        sql`${items.ativo} = false 
        OR ${items.estoqueAtual} <= ${items.estoqueMinimo}
        OR (${items.validadeValorReferencia} IS NOT NULL AND ${items.validadeValorReferencia} <= ${threeMonthsFromNow})
        OR (${items.validadeAta} IS NOT NULL AND ${items.validadeAta} <= ${threeMonthsFromNow})`
      );
  }
}

export const inventoryService = new InventoryService();
