import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "server/.env") });
const nodeEnv = process.env.NODE_ENV || "development";
const jwtSecret = process.env.JWT_SECRET;
const databaseUrl = process.env.DATABASE_URL || "";
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173";
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || "";
if (nodeEnv === "production") {
  const missing = [
    !jwtSecret && "JWT_SECRET",
    !databaseUrl && "DATABASE_URL",
    !process.env.CLIENT_ORIGIN && "CLIENT_ORIGIN",
    !firebaseProjectId && "FIREBASE_PROJECT_ID"
  ].filter(Boolean);
  if (missing.length > 0) {
    throw new Error(`${missing.join(", ")} required when NODE_ENV=production`);
  }
}
const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv,
  clientOrigin,
  clientOrigins: clientOrigin.split(",").map((origin) => origin.trim()).filter(Boolean),
  databaseUrl,
  matchRadiusMeters: parseFloat(process.env.MATCH_RADIUS_METERS || "50"),
  geocodingTimeout: parseInt(process.env.GEOCODING_TIMEOUT || "5000", 10),
  jwtSecret: jwtSecret || "geoissue_local_development_jwt_secret",
  firebase: {
    projectId: firebaseProjectId,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n") : ""
  }
};
export {
  config
};
