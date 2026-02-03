import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Override DATABASE_URL for local execution if needed
// The .env file has postgresql://postgres:postgres@db:5432/material_control
// We need postgresql://postgres:postgres@localhost:5434/material_control for running from host
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("@db:5432")) {
    console.log("Detected Docker address in DATABASE_URL. Switching to localhost:5434 for local script execution.");
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@db:5432", "@localhost:5434");
}

const FILE_PATH = path.join(process.cwd(), 'attached_assets', 'estoque_patrimonio.xls');

async function syncPatrimonio() {
    // Dynamic import to ensure env vars are set first
    const { db } = await import('../server/db');
    const { items, movimentos } = await import('../shared/schema');
    const { eq } = await import('drizzle-orm');

    console.log(`Starting sync from file: ${FILE_PATH}`);

    if (!fs.existsSync(FILE_PATH)) {
        console.error(`File not found: ${FILE_PATH}`);
        process.exit(1);
    }

    try {
        const workbook = XLSX.readFile(FILE_PATH);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON (Header is on line 5 => index 4)
        const data = XLSX.utils.sheet_to_json(worksheet, { range: 4 });

        console.log(`Found ${data.length} rows in sheet "${sheetName}".`);

        if (data.length === 0) {
            console.warn("Sheet is empty.");
            process.exit(0);
        }

        // User said lines 6 and 7 should be ignored.
        // range: 4 means Header is Line 5.
        // data[0] is Line 6.
        // data[1] is Line 7.
        // So we start processing from data[2].

        if (data.length < 3) {
            console.warn("Not enough data rows (expecting at least 3 to skip garbage lines).");
            process.exit(0);
        }

        // Use a valid row to detect headers? Or just iterate and try to find keys.
        // Let's inspect data[2] (Line 8) to see keys.
        const sampleRow = data[2] as any;
        console.log("Sample row (Line 8) keys:", Object.keys(sampleRow));

        // Find the specific keys using fuzzy match if needed, or strict.
        // "Item Material" and "Saldo Físico"
        let keyItem = "Item Material";
        let keySaldo = "Saldo Físico";

        // Try to find actual keys in sampleRow that match
        const keys = Object.keys(sampleRow);
        const foundItem = keys.find(k => k.toLowerCase().includes("item material"));
        const foundSaldo = keys.find(k => k.toLowerCase().includes("saldo") && k.toLowerCase().includes("sico")); // avoid encoding issues

        if (foundItem) keyItem = foundItem;
        if (foundSaldo) keySaldo = foundSaldo;

        console.log(`Using keys: Item="${keyItem}", Saldo="${keySaldo}"`);

        const validData = data.slice(2);
        let updatedCount = 0;
        let skippedCount = 0;
        let errorsCount = 0;
        let orphansCount = 0;

        // 1. Fetch ALL items from DB to create a Lookup Map
        const allDbItems = await db.select().from(items);
        const dbItemsMap = new Map<string, typeof allDbItems[0]>();

        // Track which items were "touched" by the Excel file
        const touchedItemIds = new Set<string>();

        // Only care about items that currently have stock > 0 in DB
        // But we map all by GCE for lookup
        for (const item of allDbItems) {
            dbItemsMap.set(item.codigoGce, item);
        }

        console.log(`Loaded ${allDbItems.length} items from DB.`);

        // 2. Process Excel Data
        for (const row of validData as any[]) {
            const codigoGce = String(row[keyItem] || "").trim();
            const saldoFisicoRaw = row[keySaldo];

            let saldoFisico = 0;
            if (typeof saldoFisicoRaw === 'number') {
                saldoFisico = saldoFisicoRaw;
            } else if (typeof saldoFisicoRaw === 'string') {
                saldoFisico = parseFloat(saldoFisicoRaw);
            }

            const newStock = Math.floor(saldoFisico);

            if (!codigoGce) {
                skippedCount++;
                continue;
            }

            const item = dbItemsMap.get(codigoGce);

            if (item) {
                touchedItemIds.add(item.id);

                const currentStock = item.patrimonioAtual || 0;
                const diff = newStock - currentStock;

                if (diff !== 0) {
                    // Generate Adjustment Movement (Positive or Negative)
                    await db.insert(movimentos).values({
                        itemId: item.id,
                        tipo: "ENTRADA_PATRIMONIO",
                        quantidade: diff, // Can be positive or negative
                        observacoes: diff > 0
                            ? "Ajuste automático (Entrada) via sync excel"
                            : "Ajuste automático (Saída/Correção) via sync excel",
                        dataMovimento: new Date(),
                        responsavel: "Sistema (Sync)",
                    });
                    console.log(`[Item ${codigoGce}] Generated Adjustment: ${diff > 0 ? '+' : ''}${diff}`);

                    await db.update(items)
                        .set({ patrimonioAtual: newStock })
                        .where(eq(items.id, item.id));
                    updatedCount++;
                }
            } else {
                skippedCount++;
            }
        }

        // 3. Process Orphans (Items in DB with stock > 0 but NOT in Excel)
        const itemsWithStock = allDbItems.filter(i => (i.patrimonioAtual || 0) > 0);

        console.log(`Checking ${itemsWithStock.length} items with positive stock for orphans...`);

        for (const item of itemsWithStock) {
            if (!touchedItemIds.has(item.id)) {
                // This item exists in DB, has stock, but was NOT in the Excel file.
                // It must be zeroed out.
                const currentStock = item.patrimonioAtual!;
                const diff = -currentStock; // diff is negative to zero it out

                await db.insert(movimentos).values({
                    itemId: item.id,
                    tipo: "ENTRADA_PATRIMONIO",
                    quantidade: diff,
                    observacoes: "Ajuste automático (Zeramento de Órfão) - Item não encontrado no Excel oficial",
                    dataMovimento: new Date(),
                    responsavel: "Sistema (Sync)",
                });

                await db.update(items)
                    .set({ patrimonioAtual: 0 })
                    .where(eq(items.id, item.id));

                console.log(`[Item ${item.codigoGce}] Orphaned item zeroed out. Removed ${currentStock} units.`);
                orphansCount++;
            }
        }

        console.log("------------------------------------------------");
        console.log(`Sync Completed.`);
        console.log(`Updated Items (Excel Match): ${updatedCount}`);
        console.log(`Orphaned Items Zeroed: ${orphansCount}`);
        console.log(`Skipped in Excel (Not in DB): ${skippedCount}`);
        console.log(`Errors: ${errorsCount}`);

    } catch (error) {
        console.error("Error processing file:", error);
        process.exit(1);
    }
}

syncPatrimonio();
