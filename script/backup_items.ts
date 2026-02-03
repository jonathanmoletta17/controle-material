import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function backup() {
    console.log("Backing up items table...");
    try {
        // Drop if exists to ensure fresh backup or use IF NOT EXISTS?
        // User asked "create a copy", usually implies value preservation at this moment.
        // I will drop the backup table if it exists to ensure it reflects current state.
        await db.execute(sql`DROP TABLE IF EXISTS items_backup;`);
        await db.execute(sql`CREATE TABLE items_backup AS SELECT * FROM items;`);
        console.log("Backup created successfully: items_backup");
    } catch (error) {
        console.error("Error creating backup:", error);
    } finally {
        process.exit(0);
    }
}

backup();
