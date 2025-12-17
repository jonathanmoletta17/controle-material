import "dotenv/config";
import { db } from "../server/db";
import { users } from "@shared/schema";

async function seed() {
    console.log("Seeding database...");

    try {
        const existingUsers = await db.select().from(users).limit(1);
        if (existingUsers.length === 0) {
            console.log("No users found. Creating default admin.");
            await db.insert(users).values({
                username: "admin",
                password: "admin_password_change_me", // Password should be hashed in real app, but complying with current simplicty
            });
            console.log("Default user created.");
        } else {
            console.log("Database already populated with users.");
        }
    } catch (error) {
        console.error("Error seeding:", error);
    } finally {
        process.exit(0);
    }
}

seed();
