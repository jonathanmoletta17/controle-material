
import { db } from "../server/db";
import { users } from "../shared/schema";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding test user...");
  try {
    const existingUser = await db.select().from(users).where(eq(users.username, "admin"));
    if (existingUser.length === 0) {
      await db.insert(users).values({
        username: "admin",
        password: "admin_password_change_me", // Default password from original seed
      });
      console.log("User 'admin' created.");
    } else {
      console.log("User 'admin' already exists.");
    }
  } catch (error) {
    console.error("Error seeding user:", error);
  }
  process.exit(0);
}

seed();
