
import "dotenv/config";
import { db } from "../server/db";
import { items, SETORES } from "../shared/schema";
import { sql } from "drizzle-orm";

async function seedData() {
  console.log("Iniciando populacao de dados de exemplo...");

  try {
    // Verificar se ja existem dados
    const existingItems = await db.select({ count: sql<number>`count(*)` }).from(items);
    if (Number(existingItems[0].count) > 0) {
      console.log("O banco de dados ja contem itens. Pulando seed.");
      process.exit(0);
    }

    const sampleItems = [
      {
        codigoGce: "ELET-001",
        itemNome: "Lampada LED 9W",
        setor: "ELETRICA",
        estoqueAtual: 50,
        estoqueMinimo: 10,
        entradaInicial: 50,
        ativo: true,
        observacoes: "Marca Philips"
      },
      {
        codigoGce: "ELET-002",
        itemNome: "Fio 2.5mm Preto (Rolo 100m)",
        setor: "ELETRICA",
        estoqueAtual: 5,
        estoqueMinimo: 8,
        entradaInicial: 10,
        ativo: true,
        observacoes: "Baixo estoque simulado"
      },
      {
        codigoGce: "HIDR-001",
        itemNome: "Tubo PVC 25mm (Barra 6m)",
        setor: "HIDRAULICA",
        estoqueAtual: 20,
        estoqueMinimo: 5,
        entradaInicial: 20,
        ativo: true
      },
      {
        codigoGce: "HIDR-002",
        itemNome: "Joelho 90 PVC 25mm",
        setor: "HIDRAULICA",
        estoqueAtual: 100,
        estoqueMinimo: 20,
        entradaInicial: 100,
        ativo: true
      },
      {
        codigoGce: "MARC-001",
        itemNome: "Dobradiça 35mm Curva",
        setor: "MARCENARIA",
        estoqueAtual: 30,
        estoqueMinimo: 10,
        entradaInicial: 30,
        ativo: true
      },
      {
        codigoGce: "PINT-001",
        itemNome: "Tinta Acrilica Branca 18L",
        setor: "PINTORES",
        estoqueAtual: 2,
        estoqueMinimo: 5,
        entradaInicial: 5,
        ativo: true
      }
    ];

    console.log(`Inserindo ${sampleItems.length} itens...`);
    
    await db.insert(items).values(sampleItems);
    
    console.log("Dados inseridos com sucesso!");
  } catch (error) {
    console.error("Erro ao popular dados:", error);
  } finally {
    process.exit(0);
  }
}

seedData();
