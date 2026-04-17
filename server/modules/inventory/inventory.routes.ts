import { Router, Request, Response } from "express";
import { inventoryService } from "./inventory.service";
import { insertItemSchema, insertMovimentoSchema } from "@shared/schema";
import multer from "multer";
import fs from "fs";
import path from "path";
import { handleRouteError } from "../../lib/errors";

const UPLOADS_DIR = path.resolve("uploads/items");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${ext}`);
  },
});

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de arquivo não permitido. Use JPEG, PNG ou WEBP."));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: imageFilter,
});

const router = Router();

router.get("/items", async (req: Request, res: Response) => {
  try {
    const items = await inventoryService.getAllItems();
    res.json(items);
  } catch (error) {
    handleRouteError(res, error, "Failed to fetch items");
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
    handleRouteError(res, error, "Failed to fetch item");
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
    handleRouteError(res, error, "Failed to create item");
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
    handleRouteError(res, error, "Failed to update item");
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
    handleRouteError(res, error, "Failed to delete item");
  }
});

router.post(
  "/items/:id/image",
  requireAdmin,
  upload.single("image"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "Nenhum arquivo enviado." });
      }

      // If there is an existing image, delete the old file
      const existing = await inventoryService.getItem(req.params.id);
      if (!existing) {
        fs.unlinkSync(req.file.path); // clean up newly uploaded file
        return res.status(404).json({ error: "Item not found" });
      }
      if (existing.imagemUrl) {
        const oldPath = path.resolve(existing.imagemUrl.replace(/^\//, ""));
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      const imagemUrl = `/uploads/items/${req.file.filename}`;
      const item = await inventoryService.updateItem(req.params.id, { imagemUrl } as any);
      res.json(item);
    } catch (error: any) {
      // Multer errors (file size, wrong type)
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Arquivo muito grande. Máximo 5MB." });
      }
      handleRouteError(res, error, "Failed to upload image");
    }
  }
);

router.delete(
  "/items/:id/image",
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      const existing = await inventoryService.getItem(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Item not found" });
      }
      if (existing.imagemUrl) {
        const filePath = path.resolve(existing.imagemUrl.replace(/^\//, ""));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      const item = await inventoryService.updateItem(req.params.id, { imagemUrl: null } as any);
      res.json(item);
    } catch (error) {
      handleRouteError(res, error, "Failed to remove image");
    }
  }
);

router.get("/items/:id/movements", async (req: Request, res: Response) => {
  try {
    const movimentos = await inventoryService.getMovimentos(req.params.id);
    res.json(movimentos);
  } catch (error) {
    handleRouteError(res, error, "Failed to fetch movements");
  }
});

router.post("/items/:id/movements", async (req: Request, res: Response) => {
  try {
    const user = req.user as any;
    const role = user?.role || "manutencao";

    // RBAC for Movement Type
    if (role === "visualizador") {
      return res.status(403).json({ error: "Seu perfil é apenas de visualização. Não é permitido registrar movimentações." });
    }

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
  } catch (error) {
    handleRouteError(res, error, "Failed to create movement");
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
    handleRouteError(res, error, "Failed to fetch movements");
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
    handleRouteError(res, error, "Failed to search movements");
  }
});

router.get("/alerts", async (req: Request, res: Response) => {
  try {
    const alerts = await inventoryService.getAlerts();
    res.json(alerts);
  } catch (error) {
    handleRouteError(res, error, "Failed to fetch alerts");
  }
});

export const inventoryRoutes = router;
