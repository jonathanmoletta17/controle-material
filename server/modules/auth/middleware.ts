import { Request, Response, NextFunction } from "express";

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Debug logging to diagnose permission issues
    const user = req.user as any;

    if (process.env.NODE_ENV !== 'production' || !user || user.role !== 'admin') {
        console.log(`[AuthDebug] Checking Admin Access. User: ${user?.username}, Role: ${user?.role}, Authorized: ${user?.role === 'admin'}`);
    }

    if (user?.role !== "admin") {
        return res.status(403).json({
            error: "Acesso negado. Requer permissão de administrador.",
            debug: { receivedRole: user?.role } // Helping frontend debug
        });
    }
    next();
};
