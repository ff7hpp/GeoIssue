import { Request, Response, NextFunction } from "express";
import { Role } from "./domain.js";
import { store } from "./db.js";
export type User = { uid: string; email: string; name: string; role: Role };
declare global { namespace Express { interface Request { user?: User } } }
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const uid = req.headers["x-user-id"]?.toString().trim() || "";
  if (!uid) return res.status(401).json({ error: { code: "UNAUTHENTICATED", message: "A local demo identity is required." } });
  const existing = await store.user(uid);
  req.user = existing ?? await store.saveUser({ uid, email: `${uid}@local.geoissue`, name: uid === "demo-admin" ? "Demo administrator" : "Demo resident", role: uid === (process.env.ADMIN_USER_ID || "demo-admin") ? "admin" : "user" });
  return next();
}
export function requireAdmin(req: Request, res: Response, next: NextFunction) { return req.user?.role === "admin" ? next() : res.status(403).json({ error: { code: "FORBIDDEN", message: "Admin access is required." } }); }
