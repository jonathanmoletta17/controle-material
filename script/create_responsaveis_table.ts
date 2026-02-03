
import { sql } from "drizzle-orm";
import { db } from "../server/db";

async function main() {
    console.log("Checking if 'responsaveis' table needs to be created...");

    const createTableQuery = sql`
    CREATE TABLE IF NOT EXISTS responsaveis (
      id text PRIMARY KEY DEFAULT gen_random_uuid(),
      nome text NOT NULL,
      id_funcional text NOT NULL,
      ativo boolean NOT NULL DEFAULT true
    );
  `;

    try {
        await db.execute(createTableQuery);
        console.log("Success: Table 'responsaveis' ensured.");
    } catch (error) {
        console.error("Error creating table:", error);
        process.exit(1);
    }

    process.exit(0);
}

main();
