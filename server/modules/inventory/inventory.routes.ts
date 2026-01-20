import { Router, Request, Response } from "express";
import { inventoryService } from "./inventory.service";
import { insertItemSchema, insertMovimentoSchema } from "@shared/schema";

const router = Router();

router.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await inventoryService.getAllItems();
    res.json(items);
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

router.get("/items/:id", async (req: Request, res: Response) => {
  try {
    const item = await inventoryService.getItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
});

import { requireAdmin } from "../auth/middleware";

router.post("/items", requireAdmin, async (req: Request, res: Response) => {
  try {
    const parsed = insertItemSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues
      });
    }
    const item = await inventoryService.createItem(parsed.data);
    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
});

router.put("/items/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const partialSchema = insertItemSchema.partial();
    const parsed = partialSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues
      });
    }
    const item = await inventoryService.updateItem(req.params.id, parsed.data);
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
});

router.delete("/items/:id", requireAdmin, async (req: Request, res: Response) => {
  try {
    const deleted = await inventoryService.deleteItem(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(204).send();
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
});

router.get("/items/:id/movements", async (req: Request, res: Response) => {
  try {
    const movimentos = await inventoryService.getMovimentos(req.params.id);
    res.json(movimentos);
  } catch (error) {
    console.error("Error fetching movements:", error);
    res.status(500).json({ error: "Failed to fetch movements" });
  }
});

router.post("/items/:id/movements", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const role = user?.role || "manutencao";

    // RBAC for Movement Type
    const restrictedTypes = ["ENTRADA_PATRIMONIO", "PEDIDO_PATRIMONIO", "ADIANTAMENTO_MANUTENCAO"];
    if (role === "manutencao" && restrictedTypes.includes(req.body.tipo)) {
      return res.status(403).json({ error: "Seu perfil não permite este tipo de movimentação." });
    }

    if (role === "patrimonio" && req.body.tipo !== "ENTRADA_PATRIMONIO") {
      return res.status(403).json({ error: "Seu perfil permite apenas Entrada de Patrimônio." });
    }

    const data = {
      ...req.body,
      itemId: req.params.id,
      usuarioAd: user?.username || "Anonymous"
    };

    const parsed = insertMovimentoSchema.safeParse(data);
    if (!parsed.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: parsed.error.issues
      });
    }
    const movimento = await inventoryService.createMovimento(parsed.data);
    res.status(201).json(movimento);
  } catch (error: any) {
    console.error("Error creating movement:", error);
    res.status(500).json({ error: error.message || "Failed to create movement" });
  }
});

router.get("/movements", async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    if (limit) {
      const movements = await inventoryService.getRecentMovements(limit);
      res.json(movements);
    } else {
      const movements = await inventoryService.getAllMovements();
      res.json(movements);
    }
  } catch (error) {
    console.error("Error fetching movements:", error);
    res.status(500).json({ error: "Failed to fetch movements" });
  }
});

router.get("/movements/search", async (req: Request, res: Response) => {
  try {
    const filters = {
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      tipo: req.query.tipo as string,
      setor: req.query.setor as string,
      itemId: req.query.itemId as string,
    };
    const movements = await inventoryService.getFilteredMovements(filters);
    res.json(movements);
  } catch (error) {
    console.error("Error searching movements:", error);
    res.status(500).json({ error: "Failed to search movements" });
  }
});

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const alerts = await inventoryService.getAlerts();
    res.json(alerts);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
});

export const inventoryRoutes = router;
