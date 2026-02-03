import { glpiPool } from "./glpi.db";
import { SETORES } from "@shared/schema";

export interface GlpiTicket {
    id: number;
    name: string; // Title
    status: number; // GLPI status ID
    date: string;
    requester_name?: string;
    category_name?: string;
    mapped_sector?: string;
}

class GlpiService {
    /**
     * Maps GLPI Category Name to Application Sector
     */
    private mapCategoryToSector(categoryName: string): string | null {
        if (!categoryName) return null;

        const parts = categoryName.split(" > ");
        let targetPart = categoryName;

        // "A categoria é sempre o campo do meio" logic
        if (parts.length >= 3) {
            targetPart = parts[1];
        } else if (parts.length === 2) {
            targetPart = parts[1];
        }

        // Return the extracted part directly (trimmed)
        return targetPart.trim();
    }

    async getTicket(id: number): Promise<GlpiTicket | null> {
        try {
            // Join tickets with users (requester) and categories
            // Note: glpi_tickets_users links tickets to users. type=1 usually means requester.
            const query = `
        SELECT 
          t.id, 
          t.name, 
          t.status, 
          t.date,
          u.name as requester_name,
          u.realname as requester_realname,
          u.firstname as requester_firstname,
          c.completename as category_name
        FROM glpi_tickets t
        LEFT JOIN glpi_tickets_users tu ON t.id = tu.tickets_id AND tu.type = 1 -- Requester
        LEFT JOIN glpi_users u ON tu.users_id = u.id
        LEFT JOIN glpi_itilcategories c ON t.itilcategories_id = c.id
        WHERE t.id = ?
        LIMIT 1
      `;

            const [rows] = await glpiPool.execute(query, [id]);
            const results = rows as any[];

            if (results.length === 0) {
                return null;
            }

            const row = results[0];

            // Format requester name (Prefer Realname + Firstname, fallback to login name)
            let requester = row.requester_name;
            if (row.requester_firstname || row.requester_realname) {
                requester = `${row.requester_firstname || ''} ${row.requester_realname || ''}`.trim();
            }

            const ticket: GlpiTicket = {
                id: row.id,
                name: row.name,
                status: row.status,
                date: row.date,
                requester_name: requester,
                category_name: row.category_name,
                mapped_sector: this.mapCategoryToSector(row.category_name) || undefined
            };

            return ticket;

        } catch (error) {
            console.error("Error fetching GLPI ticket:", error);
            throw new Error("Failed to communicate with GLPI database.");
        }
    }
}

export const glpiService = new GlpiService();
