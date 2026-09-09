import { initDb, pool } from "./pool.js";
import { authRepository } from "../modules/auth/auth.repository.js";
import { hashPassword } from "../shared/auth.utils.js";

const email = process.env.ACCOUNT_EMAIL?.trim().toLowerCase();
const password = process.env.ACCOUNT_PASSWORD;

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("ACCOUNT_EMAIL must contain a valid existing email address");
}
if (!password || password.length < 12) {
  throw new Error("ACCOUNT_PASSWORD must contain at least 12 characters");
}

async function main() {
  await initDb();
  const existing = await authRepository.findByEmail(email);
  if (!existing) throw new Error("Account not found");

  await authRepository.updateProfile(existing.id, {
    password_hash: await hashPassword(password)
  });
  console.log(`Password updated for existing account: ${email}`);

  if (pool) await pool.end();
}

main().catch((err) => {
  console.error(`Password update failed: ${err.message}`);
  process.exit(1);
});
