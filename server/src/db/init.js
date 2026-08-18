import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "./pool.js";

dotenv.config();

const currentDir = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(currentDir, "schema.sql");
const schema = await readFile(schemaPath, "utf8");

await pool.query(schema);
await pool.end();

console.log("GeoIssue database schema is ready.");
