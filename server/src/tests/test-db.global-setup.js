import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import pg from "pg";

const { Client } = pg;
const testDatabase = "geoissue_test";
const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(currentDir, "../../.env") });

function isolatedUrl(databaseUrl, database) {
  const url = new URL(databaseUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

async function connect(databaseUrl) {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
  });
  await client.connect();
  return client;
}

export default async function setupTestDatabase() {
  const sourceUrl = process.env.DATABASE_URL;
  if (!sourceUrl) {
    throw new Error("DATABASE_URL is required to prepare the isolated test database");
  }
  const testUrl = isolatedUrl(sourceUrl, testDatabase);
  if (sourceUrl === testUrl || !testUrl.includes(`/${testDatabase}`)) {
    throw new Error("Refusing to prepare a non-test database");
  }

  const adminUrl = isolatedUrl(testUrl, "postgres");
  const admin = await connect(adminUrl);

  try {
    const database = await admin.query("SELECT datname FROM pg_database WHERE datname = $1", [testDatabase]);
    if (database.rowCount > 0) {
      await admin.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [testDatabase]);
      await admin.query(`DROP DATABASE ${testDatabase}`);
    }
    await admin.query(`CREATE DATABASE ${testDatabase}`);
  } finally {
    await admin.end();
  }

  const testClient = await connect(testUrl);
  try {
    const schema = fs.readFileSync(path.join(currentDir, "../db/schema.sql"), "utf8");
    await testClient.query(schema);
  } finally {
    await testClient.end();
  }

  return async () => {
    const cleanup = await connect(adminUrl);
    try {
      await cleanup.query("SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = $1 AND pid <> pg_backend_pid()", [testDatabase]);
      await cleanup.query(`DROP DATABASE ${testDatabase}`);
    } finally {
      await cleanup.end();
    }
  };
}
