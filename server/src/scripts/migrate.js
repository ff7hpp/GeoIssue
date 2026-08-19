import "dotenv/config";
import { sql } from "../db.js";

if (!sql) {
  throw new Error("DATABASE_URL is missing from server/.env");
}

await sql`
  CREATE TABLE IF NOT EXISTS issues (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    title VARCHAR(160) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending'
      CHECK (status IN ('Pending', 'In Progress', 'Resolved')),
    reporter VARCHAR(120) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    created_by VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )
`;

await sql`CREATE INDEX IF NOT EXISTS issues_created_by_index ON issues (created_by)`;
await sql`CREATE INDEX IF NOT EXISTS issues_created_at_index ON issues (created_at DESC)`;

console.log("Neon migration complete: issues table is ready.");
