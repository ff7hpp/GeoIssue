import { AppError } from "../shared/errors.js";
import { usersRepository } from "../modules/users/users.repository.js";
import { verifyToken } from "../shared/auth.utils.js";

function readBearerToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw AppError.unauthenticated("Authorization bearer token is missing");
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    throw AppError.unauthenticated("Authorization token is empty");
  }
  return token;
}

async function resolveUserFromToken(token) {
  const payload = verifyToken(token);
  if (!payload) {
    throw AppError.unauthenticated("Invalid authentication token");
  }

  const user = await usersRepository.findById(payload.id);
  if (!user) {
    throw AppError.unauthenticated("User associated with token not found");
  }
  if (user.account_status === "suspended") {
    throw AppError.forbidden("Your account is currently suspended.");
  }
  if (user.account_status !== "active") {
    throw AppError.forbidden("Your account is not active.");
  }
  return user;
}

async function authenticate(req, res, next) {
  try {
    req.user = await resolveUserFromToken(readBearerToken(req));
    next();
  } catch (err) {
    next(err);
  }
}

async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();

  try {
    req.user = await resolveUserFromToken(readBearerToken(req));
    next();
  } catch (err) {
    if (err.code === "UNAUTHENTICATED") return next();
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthenticated("Authentication required"));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        AppError.forbidden(`Access restricted to role(s): ${roles.join(", ")}`)
      );
    }
    next();
  };
}

export {
  authenticate,
  optionalAuth,
  requireRole
};
