import jwt from "jsonwebtoken";

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next({ status: 401, message: "Authentication required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return next({ status: 401, message: "Invalid or expired token" });
  }
}

export function requireAdmin(req, _res, next) {
  if (req.user?.role !== "admin") {
    return next({ status: 403, message: "Admin access required" });
  }

  return next();
}
