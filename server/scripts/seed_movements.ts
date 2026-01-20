
import { db } from "../db";
import { items, movimentos } from "../../shared/schema";
import { inventoryService } from "../modules/inventory/inventory.service";
import { v4 as uuidv4 } from "uuid";

// Mock Data Helpers
const SETORES_LIST = [
    "ELETRICA",
    "HIDRAULICA",
    "REFRIGERACAO",
    "MARCENARIA",
    "PEDREIROS",
    "PINTORES",
    "SERRALHERIA"
];

const RESPONSAVEIS = [
    "Carlos Silva",
    "Joao Santos",
    "Maria Oliveira",
    "Pedro Souza",
    "Ana Lima",
    "Marcos Costa",
    "Roberto Alves"
];

function randomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice<T>(arr: T[]): T {
    return arr[randomInt(0, arr.length - 1)];
}

async function seed() {
    console.log("🌱 Starting Movement Seeding...");

    try {
        const allItems = await db.select().from(items);
        if (allItems.length === 0) {
            console.log("❌ No items found. Please import items first.");
            process.exit(1);
        }

        console.log(`📦 Found ${allItems.length} items to simulate movements for.`);

        // Generate movements for the last 90 days
        const today = new Date();
        const DAYS_BACK = 90;
        let totalMovements = 0;

        for (let i = DAYS_BACK; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Randomize time within the day (08:00 to 17:00)
            date.setHours(randomInt(8, 17), randomInt(0, 59), 0, 0);

            // Random number of movements per day (e.g., 2 to 15)
            const dailyCount = randomInt(2, 15);

            for (let j = 0; j < dailyCount; j++) {
                const item = randomChoice(allItems);

                // Skip if stock is low to avoid breaking logic too much (optional, but good for realism)
                if (item.estoqueAtual <= 0) continue;

                // Withdrawal amount (1 to 5)
                const qty = randomInt(1, Math.min(5, item.estoqueAtual)); // Ensure we don't go negative randomly here

                if (qty <= 0) continue;

                try {
                    await inventoryService.createMovimento({
                        itemId: item.id,
                        tipo: "RETIRADA_MANUTENCAO",
                        quantidade: -qty, // Negative for withdrawal in DB, but service might expect negative? 
                        // Service check: "Math.abs(insertMovimento.quantidade)". 
                        // Service logic: "quantidadeAlteracaoEstoque = -Math.abs(insertMovimento.quantidade);"
                        // So input sign implies direction but service enforces logic?
                        // Actually service takes quantity as supplied. 
                        // Let's check service logic again.
                        // Service: "quantidadeAlteracaoEstoque = -Math.abs(insertMovimento.quantidade);"
                        // It forces negative for RETIRADA.
                        // So passing positive or negative works, result is negative.
                        // But strictly, let's pass positive as absolute value? 
                        // Wait, the UI sends positive numbers usually and we convert?
                        // MovementForm: `data.quantidade` comes from input type number.
                        // Let's check MovementForm logic.
                        // UI inputs are usually positive.
                        // Service logic: 
                        // case "RETIRADA_MANUTENCAO":
                        //    quantidadeAlteracaoEstoque = -Math.abs(insertMovimento.quantidade);
                        //    ...
                        //    quantidadeRegistrada = Math.abs(insertMovimento.quantidade); (This is what is saved!)
                        //    ...
                        //    values({ ... quantidade: quantidadeRegistrada })
                        // WAIT. If service saves Abs(qty), then stored movements are POSITIVE?
                        // Let's re-read service code from step 1806.
                        // Line 248: `quantidade: quantidadeRegistrada` where `quantidadeRegistrada = Math.abs(...)`
                        // So movements are stored as POSITIVE integers in DB?
                        // But `ReportsPage` renders `-{Math.abs(m.quantidade)}`.
                        // Let's verify `ReportsPage` line 327: `TableCell className="font-bold text-red-600">-{Math.abs(m.quantidade)}</TableCell>`
                        // And `ConsumptionChart` line 48: `sum + m.quantidade`.
                        // If stored as positive, consumption chart sums positives. Correct.
                        // So I should pass positive or negative, service stores positive.

                        quantidade: qty,
                        dataMovimento: date,
                        setor: randomChoice(SETORES_LIST),
                        responsavel: randomChoice(RESPONSAVEIS),
                        numeroChamado: `REQ-${randomInt(1000, 9999)}`,
                        observacoes: "Movimentação gerada automaticamente (Seed)",
                    });

                    // Update local item stock for next iteration loop consistency (approximate)
                    item.estoqueAtual -= qty;
                    totalMovements++;
                } catch (err) {
                    // Ignore errors (e.g., negative stock prevented by service)
                    // console.warn("Skipped movement:", err.message);
                }
            }

            if (i % 10 === 0) process.stdout.write(".");
        }

        console.log(`\n✅ Finished! Created ${totalMovements} movements.`);
        process.exit(0);

    } catch (error) {
        console.error("\n❌ Seeding failed:", error);
        process.exit(1);
    }
}

seed();
