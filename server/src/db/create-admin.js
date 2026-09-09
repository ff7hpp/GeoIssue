import { initDb, pool } from "./pool.js";
import { authRepository } from "../modules/auth/auth.repository.js";
import { usersRepository } from "../modules/users/users.repository.js";
import { hashPassword } from "../shared/auth.utils.js";

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const displayName = process.env.ADMIN_DISPLAY_NAME?.trim() || "GeoIssue Administrator";

if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
  throw new Error("ADMIN_EMAIL must contain a valid email address");
}
if (!password || password.length < 12) {
  throw new Error("ADMIN_PASSWORD must contain at least 12 characters");
}

async function main() {
  await initDb();
  const password_hash = await hashPassword(password);
  const existing = await authRepository.findByEmail(email);

  if (existing) {
    await authRepository.updateProfile(existing.id, { password_hash });
    await usersRepository.update(existing.id, {
      display_name: displayName,
      role: "admin",
      account_status: "active"
    });
    console.log(`Administrator updated: ${email}`);
  } else {
    await authRepository.create({
      email,
      password_hash,
      display_name: displayName,
      language: "en",
      role: "admin"
    });
    console.log(`Administrator created: ${email}`);
  }

  if (pool) await pool.end();
}

main().catch((err) => {
  console.error(`Administrator bootstrap failed: ${err.message}`);
  process.exit(1);
});
