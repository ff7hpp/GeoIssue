import pg from "pg";
import { config } from "../config/env.js";
if (config.nodeEnv === "production" || !config.databaseUrl) {
  throw new Error("Development seed requires a configured non-production database");
}
const client = new pg.Client({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
});
const statuses = ["submitted", "in_review", "accepted", "in_progress", "resolved", "rejected"];
const locations = ["K\u0131z\u0131lay", "\xC7ankaya", "Bah\xE7elievler", "Ulus", "Dikmen", "Emek"];
const problems = [
  ["road-potholes", "Potholes near pedestrian crossing", "Several deep potholes force drivers into the adjacent lane. The crossing needs resurfacing."],
  ["street-lighting", "Street lights out after sunset", "Three lamps along the walkway remain dark after sunset, reducing visibility for pedestrians."],
  ["waste-sanitation", "Overflowing public waste bins", "Bins beside the bus stop are overflowing. Collection and cleaning are needed."],
  ["sidewalks", "Damaged sidewalk paving", "Loose paving slabs create a trip hazard and obstruct wheelchair access."],
  ["water-drainage", "Blocked storm drain", "Rainwater collects beside a blocked drain and spreads across the pedestrian crossing."],
  ["parks-trees", "Fallen branches on park path", "Fallen branches obstruct the main park path. Please inspect the nearby tree and clear the path."]
];
try {
  await client.connect();
  await client.query("BEGIN");
  for (let n = 0; n < 36; n++) {
    const [slug, title, description] = problems[n % 6];
    const category = await client.query("SELECT id FROM categories WHERE slug = $1", [slug]);
    if (!category.rows[0]) throw new Error("Run migrations before development seed");
    const resident = n % 3;
    const user = await client.query(
      `INSERT INTO users (firebase_uid,email,display_name,role)
      VALUES ($1,$2,$3,'user') ON CONFLICT (firebase_uid) DO UPDATE SET firebase_uid=EXCLUDED.firebase_uid RETURNING id`,
      [`seed-resident-${resident}`, `seed-resident-${resident}@example.invalid`, `Development Resident ${resident + 1}`]
    );
    const id = `d1000000-0000-4000-8000-${String(n + 1).padStart(12, "0")}`;
    const lat = 39.89 + Math.floor(n / 6) * 0.014;
    const lon = 32.79 + n % 6 * 0.018;
    const date = new Date(Date.now() - n * 864e5).toISOString();
    await client.query(
      `INSERT INTO issues (id,category_id,title,summary,latitude,longitude,status,created_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT (id) DO NOTHING`,
      [id, category.rows[0].id, `${locations[Math.floor(n / 6)]}: ${title}`, description, lat, lon, statuses[Math.floor(n / 6)], date]
    );
    await client.query(
      `INSERT INTO reports (id,issue_id,user_id,category_id,description,latitude,longitude,created_at)
      VALUES ($1,$1,$2,$3,$4,$5,$6,$7) ON CONFLICT (id) DO NOTHING`,
      [id, user.rows[0].id, category.rows[0].id, description, lat, lon, date]
    );
  }
  await client.query("COMMIT");
  console.log("Development seed verified: 36 issues/reports, 3 residents, 6 existing categories and statuses.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => void 0);
  throw error;
} finally {
  await client.end();
}
