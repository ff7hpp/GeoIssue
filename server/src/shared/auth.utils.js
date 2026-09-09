import crypto from "crypto";
import { config } from "../config/env.js";
const JWT_SECRET = config.jwtSecret;
const SCRYPT_COST = 16384;
const SCRYPT_BLOCK_SIZE = 8;
const SCRYPT_PARALLELIZATION = 1;
const KEY_LENGTH = 64;

function deriveScryptKey(password, salt, cost, blockSize, parallelization) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      KEY_LENGTH,
      { N: cost, r: blockSize, p: parallelization, maxmem: 64 * 1024 * 1024 },
      (err, derivedKey) => err ? reject(err) : resolve(derivedKey)
    );
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await deriveScryptKey(
    password,
    salt,
    SCRYPT_COST,
    SCRYPT_BLOCK_SIZE,
    SCRYPT_PARALLELIZATION
  );
  return `scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$${salt}$${derivedKey.toString("hex")}`;
}
async function verifyPassword(password, storedHash) {
  try {
    if (storedHash.startsWith("scrypt$")) {
      const [algorithm, cost, blockSize, parallelization, salt, key] = storedHash.split("$");
      if (algorithm !== "scrypt" || !salt || !key) return false;
      const derivedKey = await deriveScryptKey(
        password,
        salt,
        Number(cost),
        Number(blockSize),
        Number(parallelization)
      );
      const keyBuffer = Buffer.from(key, "hex");
      return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
    }

    // Backward compatibility for existing PBKDF2 hashes. A successful login upgrades them.
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derivedKey = await new Promise((resolve, reject) => {
      crypto.pbkdf2(password, salt, 1e4, KEY_LENGTH, "sha512", (err, value) => {
        if (err) reject(err);
        else resolve(value);
      });
    });
    const keyBuffer = Buffer.from(key, "hex");
    return keyBuffer.length === derivedKey.length && crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

function needsPasswordRehash(storedHash) {
  return !storedHash.startsWith(`scrypt$${SCRYPT_COST}$${SCRYPT_BLOCK_SIZE}$${SCRYPT_PARALLELIZATION}$`);
}
function generateToken(payload, expiresInSeconds = 7 * 24 * 60 * 60) {
  const header = { alg: "HS256", typ: "JWT" };
  const exp = Math.floor(Date.now() / 1e3) + expiresInSeconds;
  const fullPayload = { ...payload, exp };
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString("base64url");
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
function verifyToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(`${encodedHeader}.${encodedPayload}`).digest("base64url");
    const signatureBuffer = Buffer.from(signature);
    const expectedSignatureBuffer = Buffer.from(expectedSignature);
    if (signatureBuffer.length !== expectedSignatureBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedSignatureBuffer)) {
      return null;
    }
    const headerStr = Buffer.from(encodedHeader, "base64url").toString("utf-8");
    const header = JSON.parse(headerStr);
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;
    const payloadStr = Buffer.from(encodedPayload, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadStr);
    if (typeof payload.id !== "string" || typeof payload.email !== "string" || !["visitor", "user", "admin"].includes(payload.role) || typeof payload.exp !== "number" || payload.exp <= Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch {
    return null;
  }
}
export {
  generateToken,
  hashPassword,
  needsPasswordRehash,
  verifyPassword,
  verifyToken
};
