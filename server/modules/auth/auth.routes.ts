import { Router } from "express";
import passport from "passport";

const router = Router();

router.post("/auth/login", (req, res, next) => {
    passport.authenticate("ad", (err: any, user: any, info: any) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: info?.message || "Authentication failed" });
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            return res.json({ message: "Login successful", user: { id: user.id, username: user.username, role: (user as any).role } });
        });
    })(req, res, next);
});

router.post("/auth/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.json({ message: "Logout successful" });
    });
});

router.get("/auth/user", (req, res) => {
    if (req.isAuthenticated()) {
        const user: any = req.user;
        res.json({ user: { id: user.id, username: user.username, role: user.role } });
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

export const authRoutes = router;
