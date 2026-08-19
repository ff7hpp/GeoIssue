import cors from "cors";
import express from "express";
import issueRoutes from "./routes/issues.routes.js";

const app = express();
const port = 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "geoissue-api" });
});

app.use("/api/issues", issueRoutes);

app.listen(port, () => {
  console.log(`GeoIssue API running at http://localhost:${port}`);
});
