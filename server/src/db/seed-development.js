import pg from "pg";
import { config } from "../config/env.js";

if (config.nodeEnv === "production" || !config.databaseUrl) {
  throw new Error("Development seed requires a configured non-production database");
}

const client = new pg.Client({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
});

const fixtures = [
  ["road-potholes", "Potholes at Kizilay bus stop", "Three deep potholes beside the southbound bus bay damage tyres and force buses into traffic.", "submitted", 39.9208, 32.8541, 2],
  ["street-lighting", "Dark crossing near Tunali Hilmi", "Two pedestrian-crossing lamps have been off for five evenings, leaving the curb invisible after sunset.", "in_review", 39.9091, 32.8604, 5],
  ["waste-sanitation", "Overflowing bins on Sakarya Street", "Public bins near the food stalls overflow each afternoon and litter reaches the storm drain.", "accepted", 39.9175, 32.8548, 8],
  ["sidewalks", "Broken paving by Kugulu Park", "Raised paving slabs block wheelchair movement along the park-side walkway.", "in_progress", 39.9059, 32.8617, 11],
  ["water-drainage", "Blocked drain on Cinnah Avenue", "Rainwater pools across the cycle lane because leaves and sediment cover the drain grate.", "resolved", 39.8957, 32.8612, 14],
  ["parks-trees", "Fallen branch in Segmenler Park", "A large fallen branch narrows the main footpath and needs safe removal.", "rejected", 39.8847, 32.8695, 17],
  ["road-potholes", "Cracked asphalt at Bahcelievler junction", "Long asphalt cracks widen at the right-turn lane and collect water after rain.", "submitted", 39.9269, 32.8236, 20],
  ["street-lighting", "Lamp outage near Anitkabir entrance", "Path lighting on the east approach has failed, creating a dark section for visitors.", "in_review", 39.9251, 32.8368, 23],
  ["waste-sanitation", "Illegal rubbish beside Genclik Park", "Household bags and cardboard have accumulated beside the public recycling point.", "accepted", 39.9432, 32.8506, 26],
  ["sidewalks", "Missing tactile paving at Ulus stop", "Tactile guiding tiles end before the bus stop, leaving an unsafe gap for visually impaired pedestrians.", "in_progress", 39.9416, 32.8583, 29],
  ["water-drainage", "Flooded underpass at Sihhiye", "The underpass entrance floods during moderate rain and pedestrians must step into traffic.", "resolved", 39.9326, 32.8625, 32],
  ["parks-trees", "Damaged bench area in Kurtulus Park", "Broken tree roots have lifted paving around benches and created trip hazards.", "rejected", 39.9237, 32.8756, 35],
  ["road-potholes", "Sunken manhole on Ataturk Boulevard", "A sunken utility cover jolts cars and is difficult to see at night.", "submitted", 39.9299, 32.8531, 38],
  ["street-lighting", "Flickering lights near Kolej Metro", "Several lamps flicker continuously and leave parts of the pavement intermittently dark.", "in_review", 39.9186, 32.8713, 41],
  ["waste-sanitation", "Uncollected litter at Dikimevi square", "Litter around the square has not been collected for several days despite full bins.", "accepted", 39.9201, 32.8922, 44],
  ["sidewalks", "Narrow sidewalk on Hosdere Street", "Construction barriers leave less than a safe walking width beside fast traffic.", "in_progress", 39.8878, 32.8588, 47],
  ["water-drainage", "Leaking irrigation pipe in Botanik Park", "A leaking irrigation pipe keeps the path wet and creates slippery moss.", "resolved", 39.8765, 32.8779, 50],
  ["parks-trees", "Unsafe low branch near Cebeci campus", "A low hanging branch blocks a shared path and may fall in strong wind.", "rejected", 39.9255, 32.8843, 53],
  ["road-potholes", "Loose paving on Mithatpasa Street", "Loose road-edge blocks shift under vehicle wheels beside the market entrance.", "submitted", 39.9372, 32.8654, 56],
  ["street-lighting", "Unlit walkway at Batikent park", "The connecting walkway between apartments and the park has no working lights.", "in_review", 39.9778, 32.7174, 59],
  ["waste-sanitation", "Full dog-waste station in Eryaman", "The dog-waste dispenser is empty and its collection bin has overflowed onto the path.", "accepted", 39.9731, 32.6286, 62],
  ["sidewalks", "Collapsed curb ramp in Kecioren", "The curb ramp surface has collapsed and cannot be safely used by wheelchairs or prams.", "in_progress", 39.9985, 32.8698, 65],
  ["water-drainage", "Open drainage grate at Etlik", "A damaged grate leaves an open drain beside a school walking route.", "resolved", 39.9972, 32.8527, 68],
  ["parks-trees", "Overgrown path at Altinpark", "Shrubs have grown into the paved path and reduce visibility around a bend.", "rejected", 39.9639, 32.8721, 71],
  ["road-potholes", "Uneven speed hump in Mamak", "The speed hump has broken edges that scrape low vehicles and create motorcycle risk.", "submitted", 39.9411, 32.9247, 74],
  ["street-lighting", "Broken lamp near Abidinpasa market", "A market-side lamp pole is dark and its access panel appears loose.", "in_review", 39.9322, 32.9191, 77],
  ["waste-sanitation", "Missed recycling collection in Cankaya", "Recycling containers are full and loose material is spreading across the pavement.", "accepted", 39.8974, 32.8619, 80],
  ["sidewalks", "Tree-root trip hazard on Gaziosmanpasa", "Tree roots have lifted several sidewalk sections near the clinic entrance.", "in_progress", 39.8904, 32.8671, 83],
  ["water-drainage", "Standing water by Ahlatlibel trail", "A blocked culvert leaves standing water across the trail after every rainfall.", "resolved", 39.8294, 32.7645, 86],
  ["parks-trees", "Damaged playground surface at Ayranci", "Rubber safety surfacing under the slide has split and exposes the hard base.", "rejected", 39.8968, 32.8793, 89]
];

const categorySlugs = [...new Set(fixtures.map(([slug]) => slug))];
const reportIds = fixtures.map((_, index) => `f2000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`);

try {
  await client.connect();
  await client.query("BEGIN");
  const categoryResult = await client.query(
    "SELECT id, slug FROM categories WHERE slug = ANY($1::text[])",
    [categorySlugs]
  );
  const categoryIds = new Map(categoryResult.rows.map((category) => [category.slug, category.id]));
  if (categoryIds.size !== categorySlugs.length) throw new Error("Run migrations before development seed");

  const residents = [];
  for (let index = 0; index < 3; index++) {
    const user = await client.query(
      `INSERT INTO users (firebase_uid, email, display_name, role)
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (firebase_uid) DO NOTHING
       RETURNING id`,
      [`seed-fixture-resident-${index + 1}`, `seed-fixture-resident-${index + 1}@example.invalid`, `Fixture Resident ${index + 1}`]
    );
    if (user.rows[0]) {
      residents.push(user.rows[0].id);
    } else {
      const existing = await client.query("SELECT id FROM users WHERE firebase_uid = $1", [`seed-fixture-resident-${index + 1}`]);
      residents.push(existing.rows[0].id);
    }
  }

  for (const [index, [slug, title, description, status, latitude, longitude, daysAgo]] of fixtures.entries()) {
    const issueId = `e2000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const reportId = reportIds[index];
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const categoryId = categoryIds.get(slug);
    await client.query(
      `INSERT INTO issues (id, category_id, title, summary, latitude, longitude, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [issueId, categoryId, title, description, latitude, longitude, status, createdAt]
    );
    await client.query(
      `INSERT INTO reports (id, issue_id, user_id, category_id, description, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [reportId, issueId, residents[index % residents.length], categoryId, description, latitude, longitude, createdAt]
    );
  }

  const result = await client.query("SELECT COUNT(*)::int AS count FROM reports WHERE id = ANY($1::uuid[])", [reportIds]);
  if (result.rows[0].count !== fixtures.length) throw new Error("Development fixture verification failed");
  await client.query("COMMIT");
  console.log("Development seed verified: 30 persistent reports, 30 mapped issues, 3 fixture residents.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => void 0);
  throw error;
} finally {
  await client.end();
}
