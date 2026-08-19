import { neon } from "@neondatabase/serverless";

export const databaseConfigured = Boolean(process.env.DATABASE_URL);
export const sql = databaseConfigured ? neon(process.env.DATABASE_URL) : null;

export async function getDatabaseStatus() {
  if (!sql) return { mode: "memory", connected: false };

  const rows = await sql`SELECT current_database() AS database`;
  return { mode: "neon", connected: true, database: rows[0].database };
}
