import "dotenv/config";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { databaseConfigured, getDatabaseStatus } from "./db.js";
import geocodeRoutes from "./routes/geocode.routes.js";
import issueRoutes from "./routes/issues.routes.js";

const app = express();
const port = process.env.PORT || 5000;
const configuredClientOrigins = (process.env.CLIENT_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedClientOrigins = new Set(configuredClientOrigins);

if (process.env.NODE_ENV !== "production") {
  allowedClientOrigins.add("http://localhost:5173");
  allowedClientOrigins.add("http://127.0.0.1:5173");
}

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedClientOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
}));
app.use(helmet());
app.use(express.json({ limit: "32kb" }));

app.get("/api/health", async (_req, res) => {
  const database = await getDatabaseStatus();
  res.json({ ok: true, service: "geoissue-api", database });
});

app.use("/api/issues", issueRoutes);
app.use("/api/geocode", geocodeRoutes);

app.use((error, _req, res, _next) => {
  if (error.status === 413) {
    return res.status(413).json({ message: "Request body is too large." });
  }

  if (error.status === 400 && error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Request body must be valid JSON." });
  }

  console.error(error);
  return res.status(500).json({ message: "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`GeoIssue API running at http://localhost:${port}`);
  console.log(databaseConfigured ? "Issue storage: Neon PostgreSQL" : "Issue storage: temporary memory (DATABASE_URL is not set)");
});
