import type { Express } from "express";
import { type Server } from "http";
import { inventoryRoutes } from "./modules/inventory/inventory.routes";
import { importRoutes } from "./modules/import/import.routes";
import { authRoutes } from "./modules/auth/auth.routes";
import { managementRoutes } from "./modules/auth/management.routes";
import { responsaveisRoutes } from "./modules/responsaveis/responsaveis.routes";
import { glpiRoutes } from "./modules/glpi/glpi.routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Mount modular routes
  app.use("/api", inventoryRoutes);
  app.use("/api/import", importRoutes);
  app.use("/api/auth", authRoutes);
  app.use("/api/management", managementRoutes);
  app.use("/api/glpi", glpiRoutes);
  app.use("/api/responsaveis", responsaveisRoutes);
  app.use("/api", importRoutes);
  app.use("/api", authRoutes);
  app.use("/api", managementRoutes);
  app.use("/api/glpi", glpiRoutes);


  return httpServer;
}
