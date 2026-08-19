import "dotenv/config";
import cors from "cors";
import express from "express";
import { databaseConfigured, getDatabaseStatus } from "./db.js";
import geocodeRoutes from "./routes/geocode.routes.js";
import issueRoutes from "./routes/issues.routes.js";

const app = express();
const port = process.env.PORT || 5000;
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));
app.use(express.json());

app.get("/api/health", async (_req, res) => {
  const database = await getDatabaseStatus();
  res.json({ ok: true, service: "geoissue-api", database });
});

app.use("/api/issues", issueRoutes);
app.use("/api/geocode", geocodeRoutes);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: error.message || "Unexpected server error." });
});

app.listen(port, () => {
  console.log(`GeoIssue API running at http://localhost:${port}`);
  console.log(databaseConfigured ? "Issue storage: Neon PostgreSQL" : "Issue storage: temporary memory (DATABASE_URL is not set)");
});
