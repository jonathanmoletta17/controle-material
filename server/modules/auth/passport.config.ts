import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import ActiveDirectory from "activedirectory2";
import { users, type User } from "@shared/schema";
import { db } from "../../db";
import { eq } from "drizzle-orm";

export function setupPassport(app: any) {
    app.use(passport.initialize());
    app.use(passport.session());

    passport.use(
        "ad",
        new LocalStrategy(async (username, password, done) => {
            const ldapServer = process.env.LDAP_SERVER;
            const ldapDomain = process.env.LDAP_DOMAIN;

            if (!ldapServer) {
                return done(null, false, { message: "LDAP_SERVER configuration missing" });
            }

            // Format: DOMAIN\username
            const adUsername = ldapDomain ? `${ldapDomain}\\${username}` : username;

            const config = {
                url: ldapServer,
                baseDN: "dc=domain,dc=com",
            };

            try {
                const ad = new ActiveDirectory(config);

                ad.authenticate(adUsername, password, async function (err, auth) {
                    if (err) {
                        console.error("LDAP Auth Error:", err);
                        return done(null, false, { message: "Falha na autenticação LDAP" });
                    }

                    if (auth) {
                        const lowerUser = username.toLowerCase();

                        // 1. Check if user exists in DB (Source of Truth)
                        let [user] = await db
                            .select()
                            .from(users)
                            .where(eq(users.username, username))
                            .limit(1);

                        let role = "";

                        if (user) {
                            // User exists: Use their DB role
                            role = user.role;
                        } else {
                            // User does NOT exist: Check Environment Variables for Bootstrap/Auto-provisioning
                            const admins = (process.env.USERS_ADMIN || "").split(",").map(u => u.trim().toLowerCase()).filter(u => u);
                            const maintenance = (process.env.USERS_MANUTENCAO || "").split(",").map(u => u.trim().toLowerCase()).filter(u => u);

                            if (admins.includes(lowerUser)) {
                                role = "admin";
                            } else if (maintenance.includes(lowerUser)) {
                                role = "manutencao";
                            } else {
                                // Not in DB and not in Env whitelist -> Deny
                                return done(null, false, { message: "Acesso negado. Usuário não cadastrado." });
                            }

                            // Create new user
                            [user] = await db
                                .insert(users)
                                .values({
                                    username: username,
                                    password: "LDAP_MANAGED",
                                    role: role,
                                })
                                .returning();
                        }

                        // Verify if user access is revoked? (e.g. role "none" or similar? For now assumes existence = access)

                        // Attach role to user object
                        (user as any).role = role;

                        return done(null, user);
                    } else {
                        return done(null, false, { message: "Credenciais inválidas" });
                    }
                });
            } catch (error) {
                return done(error);
            }
        })
    );

    passport.serializeUser((user: any, done) => {
        done(null, { id: user.id, role: user.role });
    });

    passport.deserializeUser(async (serialized: any, done) => {
        try {
            const id = typeof serialized === 'string' ? serialized : serialized.id;

            const [user] = await db
                .select()
                .from(users)
                .where(eq(users.id, id))
                .limit(1);

            if (user) {
                (user as any).role = user.role || "manutencao";
            }

            done(null, user);
        } catch (err) {
            done(err);
        }
    });
}
