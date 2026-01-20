import {
    type User,
    type InsertUser,
    users,
} from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

class AuthService {
    async getUser(id: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.id, id));
        return user || undefined;
    }

    async getUserByUsername(username: string): Promise<User | undefined> {
        const [user] = await db.select().from(users).where(eq(users.username, username));
        return user || undefined;
    }

    async createUser(insertUser: InsertUser): Promise<User> {
        const [user] = await db.insert(users).values(insertUser).returning();
        return user;
    }

    async getAllUsers(): Promise<User[]> {
        return db.select().from(users).orderBy(users.username);
    }

    async updateUserRole(id: string, role: string): Promise<User | undefined> {
        const [user] = await db
            .update(users)
            .set({ role })
            .where(eq(users.id, id))
            .returning();
        return user;
    }

    async deleteUser(id: string): Promise<boolean> {
        const result = await db.delete(users).where(eq(users.id, id)).returning();
        return result.length > 0;
    }
}

export const authService = new AuthService();
