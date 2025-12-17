import { Router, Request, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { inventoryService } from "../inventory/inventory.service";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/import", upload.single("file"), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const results = {
      success: true,
      imported: 0,
      errors: 0,
      details: [] as Array<{
        row: number;
        setor?: string;
        codigo?: string;
        error?: string;
        status: "success" | "error" | "warning";
      }>,
    };

    const setorMapping: Record<string, string> = {
      "ELÉTRICA": "ELETRICA",
      "ELETRICA": "ELETRICA",
      "MARCENARIA": "MARCENARIA",
      "HIDRÁULICA": "HIDRAULICA",
      "HIDRAULICA": "HIDRAULICA",
      "REFRIGERAÇÃO": "REFRIGERACAO",
      "REFRIGERACAO": "REFRIGERACAO",
      "PEDREIROS": "PEDREIROS",
      "PINTORES": "PINTORES",
      "FOLHA7": "HIDRAULICA",
      "Folha7": "HIDRAULICA",
    };

    const columnMapping: Record<string, string> = {
      "CÓDIGO GCE": "codigoGce",
      "CODIGO GCE": "codigoGce",
      "Código GCE": "codigoGce",
      "ITEM": "itemNome",
      "Item": "itemNome",
      "Estoque Mínimo": "estoqueMinimo",
      "Estoque Minimo": "estoqueMinimo",
      "ESTOQUE MÍNIMO": "estoqueMinimo",
      "Manut.": "estoqueAtual",
      "MANUT.": "estoqueAtual",
      "Manut": "estoqueAtual",
      "Ent.Inicial": "entradaInicial",
      "ENT.INICIAL": "entradaInicial",
      "Patrim.inic.": "patrimonioInicial",
      "PATRIM.INIC.": "patrimonioInicial",
      "Patrim.est.": "patrimonioAtual",
      "PATRIM.EST.": "patrimonioAtual",
      "Pedido Patrim.": "pedidoPatrimonio",
      "PEDIDO PATRIM.": "pedidoPatrimonio",
      "V.REF": "valorReferencia",
      "V.Ref": "valorReferencia",
      "Valor de Ref": "valorReferencia",
      "ATA": "ata",
      "COMPRA": "compra",
      "N.PEDIDO": "numeroPedido",
      "N. PEDIDO": "numeroPedido",
    };

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rawData = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 });

      if (rawData.length < 2) continue;

      let headerRowIndex = 0;
      for (let i = 0; i < Math.min(10, rawData.length); i++) {
        const row = rawData[i];
        if (Array.isArray(row)) {
          const rowStr = row.join(" ").toUpperCase();
          if (rowStr.includes("CÓDIGO GCE") || rowStr.includes("CODIGO GCE") || rowStr.includes("ITEM")) {
            headerRowIndex = i;
            break;
          }
        }
      }

      const headers = rawData[headerRowIndex] as string[];
      if (!headers || headers.length === 0) continue;

      const mappedSetor = setorMapping[sheetName.toUpperCase()] || null;
      if (!mappedSetor) continue;

      for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i] as any[];
        if (!row || row.length === 0) continue;

        try {
          const itemData: any = {
            setor: mappedSetor,
            ativo: true,
          };

          headers.forEach((header, index) => {
            if (!header) return;
            const cleanHeader = String(header).trim();
            const mappedField = columnMapping[cleanHeader];

            if (mappedField && row[index] !== undefined && row[index] !== null && row[index] !== "") {
              let value = row[index];

              if (["estoqueMinimo", "estoqueAtual", "entradaInicial", "patrimonioInicial", "patrimonioAtual", "pedidoPatrimonio"].includes(mappedField)) {
                value = parseInt(String(value)) || 0;
              } else if (mappedField === "valorReferencia") {
                value = parseFloat(String(value).replace(",", ".")) || null;
              } else {
                value = String(value).trim();
              }

              itemData[mappedField] = value;
            }
          });

          if (!itemData.codigoGce || !itemData.itemNome) {
            continue;
          }

          const statusCol = headers.findIndex(h =>
            String(h).toLowerCase().includes("status") ||
            String(h).toLowerCase().includes("situação") ||
            String(h).toLowerCase().includes("situacao")
          );

          if (statusCol !== -1 && row[statusCol]) {
            const statusValue = String(row[statusCol]).toLowerCase();
            if (statusValue.includes("desativado") || statusValue.includes("descontinuado")) {
              itemData.ativo = false;
            }
          }

          // Check if item already exists
          const existingItem = await inventoryService.getItemByCodigo(itemData.codigoGce);

          if (existingItem) {
            // Update existing item
            await inventoryService.updateItem(existingItem.id, itemData);
            results.imported++; // Count as imported/updated
            results.details.push({
              row: i + 1,
              setor: mappedSetor,
              codigo: itemData.codigoGce,
              status: "success", // or "updated"
            });
          } else {
            // Create new item
            await inventoryService.createItem(itemData);
            results.imported++;
            results.details.push({
              row: i + 1,
              setor: mappedSetor,
              codigo: itemData.codigoGce,
              status: "success",
            });
          }

        } catch (error: any) {
          results.errors++;
          results.details.push({
            row: i + 1,
            error: error.message || "Erro ao importar linha",
            status: "error",
          });
        }
      }
    }

    results.success = results.errors === 0;
    res.json(results);
  } catch (error) {
    console.error("Error importing file:", error);
    res.status(500).json({
      success: false,
      error: "Failed to import file",
      imported: 0,
      errors: 1,
      details: []
    });
  }
});

export const importRoutes = router;
