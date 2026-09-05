import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";
import { config } from "../config/env.js";
async function runMigrations() {
  if (!config.databaseUrl) {
    console.log("No DATABASE_URL set. Skipping PostgreSQL migrations.");
    return;
  }
  const { Client } = pg;
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
  });
  try {
    await client.connect();
    console.log("Connected to Neon PostgreSQL database.");
    console.log("Running database schema migrations...");
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.join(currentDir, "schema.sql");
    const sql = fs.readFileSync(schemaPath, "utf8");
    await client.query(sql);
    console.log("\u2713 Database schema and seeds migrated successfully!");
  } catch (err) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await client.end();
  }
}
runMigrations().then(() => {
  console.log("Migration process finished.");
  process.exit(0);
}).catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
export {
  runMigrations
};
