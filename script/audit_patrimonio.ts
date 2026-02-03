import XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { ne, gt, and } from 'drizzle-orm';

// Load environment variables
dotenv.config();

// Override DATABASE_URL for local execution if needed
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes("@db:5432")) {
    console.log("Detected Docker address in DATABASE_URL. Switching to localhost:5434 for local script execution.");
    process.env.DATABASE_URL = process.env.DATABASE_URL.replace("@db:5432", "@localhost:5434");
}

const INPUT_FILE = path.join(process.cwd(), 'attached_assets', 'estoque_patrimonio.xls');
const OUTPUT_FILE = path.join(process.cwd(), 'audit_orphans.xlsx');

async function auditPatrimonio() {
    // Dynamic import
    const { db } = await import('../server/db');
    const { items } = await import('../shared/schema');

    console.log(`Starting Audit...`);
    console.log(`Input: ${INPUT_FILE}`);

    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`File not found: ${INPUT_FILE}`);
        process.exit(1);
    }

    try {
        // 1. Read Excel
        const workbook = XLSX.readFile(INPUT_FILE);
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Header Line 5 (index 4), skip lines 6, 7 (index 5, 6). Start data at index 7.
        const data = XLSX.utils.sheet_to_json(worksheet, { range: 4 });

        if (data.length < 3) {
            console.error("Not enough data rows in Excel.");
            process.exit(1);
        }

        // Logic from sync_patrimonio.ts
        const sampleRow = data[2] as any;
        const keys = Object.keys(sampleRow);
        const foundItemKey = keys.find(k => k.toLowerCase().includes("item material")) || "Item Material"; // Fallback matching logic

        const validData = data.slice(2);
        const excelGceSet = new Set<string>();

        for (const row of validData as any[]) {
            // Standardize: string, trimmed
            const rawVal = row[foundItemKey];
            if (rawVal) {
                excelGceSet.add(String(rawVal).trim());
            }
        }

        console.log(`Loaded ${excelGceSet.size} unique items from Excel.`);

        // 2. Fetch DB Items with Patrimonio > 0
        // Use greater than 0 since requirement is "saldo positivo"
        const dbItems = await db.select().from(items).where(gt(items.patrimonioAtual, 0));
        console.log(`Found ${dbItems.length} items in DB with patrimonio_atual > 0.`);

        // 3. Find Orphans
        const orphans: any[] = [];

        for (const item of dbItems) {
            const dbGce = item.codigoGce.trim();
            if (!excelGceSet.has(dbGce)) {
                orphans.push({
                    codigo_gce: dbGce,
                    item_nome: item.itemNome,
                    patrimonio_atual: item.patrimonioAtual,
                    setor: item.setor,
                    observacoes: "Positive stock in DB but missing in Excel file"
                });
            }
        }

        console.log(`Found ${orphans.length} orphans.`);

        // 4. Write Report
        if (orphans.length > 0) {
            const newWb = XLSX.utils.book_new();
            const newWs = XLSX.utils.json_to_sheet(orphans);
            XLSX.utils.book_append_sheet(newWb, newWs, "Orphans");
            XLSX.writeFile(newWb, OUTPUT_FILE);
            console.log(`Report saved to: ${OUTPUT_FILE}`);
        } else {
            console.log("No orphans found. Database is consistent with Excel for positive stock.");
        }

    } catch (error) {
        console.error("Error during audit:", error);
        process.exit(1);
    }
}

auditPatrimonio();
