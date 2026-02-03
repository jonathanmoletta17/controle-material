import { Router } from "express";
import { glpiService } from "./glpi.service";

const router = Router();

router.get("/tickets/:id", async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: "Invalid ticket ID" });
        }

        const ticket = await glpiService.getTicket(id);
        if (!ticket) {
            return res.status(404).json({ error: "Ticket not found" });
        }

        res.json(ticket);
    } catch (error) {
        console.error("Error fetching GLPI ticket:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

export const glpiRoutes = router;
