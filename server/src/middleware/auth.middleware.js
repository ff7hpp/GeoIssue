import { getFirebaseAuth } from "../config/firebase.js";
import { config } from "../config/env.js";
import { AppError } from "../shared/errors.js";
import { usersRepository } from "../modules/users/users.repository.js";
import { verifyToken } from "../shared/auth.utils.js";
function resolveDevelopmentIdentity(token) {
  if (config.nodeEnv === "production") return null;
  if (token === "dev-admin") {
    return {
      uid: "admin_demo_uid_123",
      email: "admin@geoissue.org",
      displayName: "Lead Admin",
      role: "admin"
    };
  }
  if (token === "dev-user") {
    return {
      uid: "citizen_demo_uid_456",
      email: "citizen@geoissue.org",
      displayName: "Tariq Al-Mansoor",
      role: "user"
    };
  }
  if (token.startsWith("mock:")) {
    const uid = token.slice("mock:".length);
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(uid)) {
      throw AppError.unauthenticated("Invalid mock authentication token");
    }
    return {
      uid,
      email: `${uid}@geoissue.org`,
      displayName: null,
      role: "user"
    };
  }
  return null;
}
function looksLikeJwt(token) {
  return token.split(".").length === 3;
}
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw AppError.unauthenticated("Authorization bearer token is missing");
    }
    const token = authHeader.split("Bearer ")[1].trim();
    if (!token) {
      throw AppError.unauthenticated("Authorization token is empty");
    }
    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
      const user2 = await usersRepository.findById(jwtPayload.id);
      if (!user2) {
        throw AppError.unauthenticated("User associated with token not found");
      }
      if (user2.account_status === "suspended") {
        throw AppError.forbidden("Your account is currently suspended.");
      }
      req.user = user2;
      return next();
    }
    const developmentIdentity = resolveDevelopmentIdentity(token);
    let uid;
    let email;
    let displayName;
    let role;
    if (developmentIdentity) {
      ({ uid, email, displayName, role } = developmentIdentity);
    } else {
      if (!looksLikeJwt(token)) {
        throw AppError.unauthenticated("Invalid authentication token");
      }
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) {
        throw AppError.unauthenticated("Invalid authentication token");
      }
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        email = decodedToken.email || `${uid}@geoissue.local`;
        displayName = decodedToken.name || null;
        role = "user";
      } catch {
        throw AppError.unauthenticated("Invalid authentication token");
      }
    }
    req.firebaseUid = uid;
    req.firebaseEmail = email;
    let user = await usersRepository.findByFirebaseUid(uid);
    if (!user) {
      const emailOwner = await usersRepository.findByEmail(email);
      if (emailOwner) {
        throw AppError.conflict(
          "An account with this email already uses a different sign-in method"
        );
      }
      user = await usersRepository.upsert({
        firebase_uid: uid,
        email,
        display_name: displayName || (email ? email.split("@")[0] : "Citizen"),
        role,
        language: "en",
        account_status: "active"
      });
    }
    if (user.account_status === "suspended") {
      throw AppError.forbidden("Your account is currently suspended.");
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }
  try {
    const token = authHeader.split("Bearer ")[1].trim();
    if (!token) return next();
    const jwtPayload = verifyToken(token);
    if (jwtPayload) {
      const user2 = await usersRepository.findById(jwtPayload.id);
      if (user2 && user2.account_status !== "suspended") {
        req.user = user2;
      }
      return next();
    }
    const developmentIdentity = resolveDevelopmentIdentity(token);
    let uid;
    if (developmentIdentity) {
      uid = developmentIdentity.uid;
    } else {
      if (!looksLikeJwt(token)) return next();
      const firebaseAuth = getFirebaseAuth();
      if (!firebaseAuth) return next();
      try {
        const decodedToken = await firebaseAuth.verifyIdToken(token);
        uid = decodedToken.uid;
      } catch {
        return next();
      }
    }
    const user = await usersRepository.findByFirebaseUid(uid);
    if (user && user.account_status !== "suspended") {
      req.user = user;
    }
    next();
  } catch {
    next();
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
