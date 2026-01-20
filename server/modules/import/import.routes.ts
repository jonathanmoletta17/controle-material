import { Router, Request, Response } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { inventoryService } from "../inventory/inventory.service";

import { v4 as uuidv4 } from "uuid";

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
        row?: number;
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
      "Patrim.est.": "patrimonioAtual",
      "PATRIM.EST.": "patrimonioAtual",
      "V.REF": "validadeValorReferencia",
      "V.Ref": "validadeValorReferencia",
      "Valor de Ref": "validadeValorReferencia",
      "ATA": "ata",
    };

    // Map to aggregate items by GCE code
    // Key: codigoGce (or unique ADIANTAMENTO key)
    // Value: Item data
    const consolidatedItems = new Map<string, any>();
    const processingErrors: Array<any> = [];

    // 1. Read ALL sheets and Aggregate
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

      // REFACTOR: Ignore sheet name for sector mapping. Force UNIFICADO.
      const mappedSetor = "UNIFICADO";

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

              if (["estoqueMinimo", "estoqueAtual", "patrimonioAtual"].includes(mappedField)) {
                // SANITIZATION: Parse int and enforce non-negative BEFORE usage
                const parsedVal = parseInt(String(value)) || 0;
                value = Math.max(0, parsedVal);
              } else if (mappedField === "validadeValorReferencia") {
                // Parse Date (Excel Serial or String)
                if (typeof value === 'number') {
                  // Excel Serial Date
                  const date = new Date(Math.round((value - 25569) * 86400 * 1000));
                  value = isNaN(date.getTime()) ? null : date;
                } else {
                  // String format (e.g. DD/MM/YYYY)
                  const parts = String(value).split('/');
                  if (parts.length === 3) {
                    const date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    value = isNaN(date.getTime()) ? null : date;
                  } else {
                    value = null;
                  }
                }
              } else {
                value = String(value).trim();
              }

              itemData[mappedField] = value;
            }
          });

          if (!itemData.codigoGce || !itemData.itemNome) {
            continue;
          }

          // Check for status row to set active state
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

          // --- Aggregation Logic ---
          let uniqueKey = itemData.codigoGce;
          if (uniqueKey.toUpperCase() === "ADIANTAMENTO") {
            uniqueKey = `ADIANTAMENTO-${uuidv4().substring(0, 8)}`;
          } else {
            uniqueKey = uniqueKey.trim();
          }

          if (consolidatedItems.has(uniqueKey)) {
            // MERGE DUPLICATE
            const existing = consolidatedItems.get(uniqueKey);

            // Sum numeric values
            existing.estoqueAtual = (existing.estoqueAtual || 0) + (itemData.estoqueAtual || 0);
            existing.estoqueMinimo = (existing.estoqueMinimo || 0) + (itemData.estoqueMinimo || 0);
            existing.patrimonioAtual = (existing.patrimonioAtual || 0) + (itemData.patrimonioAtual || 0);

            // Logic for static fields (e.g., ValorRef, ATA):
            // "defined per item" -> We trust the spreadsheet row.
            if (!existing.validadeValorReferencia && itemData.validadeValorReferencia) existing.validadeValorReferencia = itemData.validadeValorReferencia;
            if (!existing.ata && itemData.ata) existing.ata = itemData.ata;

          } else {
            // NEW ENTRY
            consolidatedItems.set(uniqueKey, itemData);
          }

        } catch (error: any) {
          processingErrors.push({
            row: i + 1,
            error: error.message || "Erro ao processar linha",
            status: "error",
          });
        }
      }
    }

    // 2. Persist Unified Data
    for (const [key, itemData] of consolidatedItems) {
      try {
        // If it was a generated key for adiantamento, revert the search key to the original "ADIANTAMENTO" string or keep separate?
        // Actually, for DB storage, we want the field 'codigoGce' to be "ADIANTAMENTO" if that was the input.
        // But for 'getItemByCodigo' logic, we need to be careful.
        // If we search by "ADIANTAMENTO", we find *one* of them.
        // Since we are doing a FULL import which likely is a "State Reset" or "Update All",
        // handling Adiantamento updates is tricky if we don't have IDs.
        // Current logic: Create New if not found.
        // But for Adiantamento, we ALWAYS create new? Or try to match?
        // Since we have no unique ID for Adiantamento lines in Excel, assume we always CREATE them if they don't look like duplicates?
        // Or simpler: We treat this import as "Upsert by GCE".
        // For Adiantamento: We just insert them as new items (or update if we could somehow link them, but we can't).
        // Safest for Adiantamento: Insert as new if we can't match strictly.
        // HOWEVER, to avoid infinite duplication on multiple imports, we usually need an ID.
        // Given constraints: We will treat Adiantamento as "Create New" or "Update if exact match"?
        // Let's rely on standard upsert for GCE, and "Create" for Adiantamento.

        const isAdiantamento = key.startsWith("ADIANTAMENTO-") && itemData.codigoGce.toUpperCase().includes("ADIANTAMENTO");

        if (isAdiantamento) {
          // Always create new entry for Adiantamento to avoid merging dissimilar items
          await inventoryService.createItem(itemData);
          results.imported++;
          results.details.push({ codigo: "ADIANTAMENTO", status: "success", setor: itemData.setor });
        } else {
          // Standard Item
          const existingItem = await inventoryService.getItemByCodigo(itemData.codigoGce);
          if (existingItem) {
            await inventoryService.updateItem(existingItem.id, itemData);
            results.imported++;
          } else {
            await inventoryService.createItem(itemData);
            results.imported++;
            results.details.push({ codigo: itemData.codigoGce, status: "success", setor: itemData.setor });
          }
        }
      } catch (e: any) {
        results.errors++;
        results.details.push({ codigo: itemData.codigoGce, error: e.message, status: "error" });
      }
    }

    results.success = results.errors === 0;
    // Add processing errors if any
    if (processingErrors.length > 0) {
      results.details.push(...processingErrors);
      results.errors += processingErrors.length;
    }

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
