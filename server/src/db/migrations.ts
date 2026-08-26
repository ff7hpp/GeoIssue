import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import { config } from '../config/env.js';

export async function runMigrations() {
  if (!config.databaseUrl) {
    console.log('No DATABASE_URL set. Skipping PostgreSQL migrations.');
    return;
  }

  const { Client } = pg;
  const client = new Client({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('neon.tech')
      ? { rejectUnauthorized: false }
      : false,
  });

  try {
    await client.connect();
    console.log('Running database schema migrations...');

    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    const schemaPath = path.join(currentDir, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    await client.query(sql);
    console.log('Database migrations completed successfully.');
  } catch (err) {
    console.error('Migration error:', err);
    throw err;
  } finally {
    await client.end();
  }
}
