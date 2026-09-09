import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(currentDir, ".env") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to prepare the isolated test database");
}

const testDatabaseUrl = new URL(process.env.DATABASE_URL);
testDatabaseUrl.pathname = "/geoissue_test";

export default defineConfig({
  test: {
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl.toString(),
      JWT_SECRET: "geoissue_test_jwt_secret_only_for_disposable_database",
      CLIENT_ORIGIN: "http://localhost:5173"
    },
    globalSetup: "./src/tests/test-db.global-setup.js"
  }
});
