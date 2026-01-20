import { Router, Request, Response } from "express";
import { authService } from "./auth.service";
import { z } from "zod";

const router = Router();

import { requireAdmin } from "./middleware";

router.get("/users", requireAdmin, async (req: Request, res: Response) => {
    try {
        const users = await authService.getAllUsers();
        // Remove passwords/sensitive data if necessary (already done by schema typically, except password hash if stored)
        // Since we store "LDAP_MANAGED", it's fine.
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ error: "Failed to fetch users" });
    }
});

const createUserSchema = z.object({
    username: z.string().min(1),
    role: z.enum(["admin", "manutencao"]),
});

router.post("/users", requireAdmin, async (req: Request, res: Response) => {
    try {
        const parsed = createUserSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: "Dados inválidos", details: parsed.error });
        }

        // Check if user exists
        const existing = await authService.getUserByUsername(parsed.data.username);
        if (existing) {
            return res.status(409).json({ error: "Usuário já existe" });
        }

        const user = await authService.createUser({
            username: parsed.data.username,
            role: parsed.data.role,
            password: "LDAP_MANAGED" // Placeholder 
        });

        res.status(201).json(user);
    } catch (error) {
        console.error("Error creating user:", error);
        res.status(500).json({ error: "Failed to create user" });
    }
});

router.patch("/users/:id/role", requireAdmin, async (req: Request, res: Response) => {
    try {
        const { role } = req.body;
        if (!["admin", "manutencao"].includes(role)) {
            return res.status(400).json({ error: "Role inválido" });
        }

        const user = await authService.updateUserRole(req.params.id, role);
        if (!user) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        res.json(user);
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ error: "Failed to update user role" });
    }
});

router.delete("/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
        const deleted = await authService.deleteUser(req.params.id);
        if (!deleted) {
            return res.status(404).json({ error: "Usuário não encontrado" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ error: "Failed to delete user" });
    }
});

export const managementRoutes = router;
