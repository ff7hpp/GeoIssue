import pg from "pg";
import { config } from "../config/env.js";
import { ISTANBUL_BOUNDS } from "../shared/istanbul.js";

if (config.nodeEnv === "production" || !config.databaseUrl) {
  throw new Error("Development seed requires a configured non-production database");
}

const client = new pg.Client({
  connectionString: config.databaseUrl,
  ssl: config.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
});

const fixtures = [
  ["road-potholes", "Potholes at Sogutlucesme bus stop", "Deep potholes beside the Kadikoy bus bay damage tyres and force buses into traffic.", "submitted", 40.9905, 29.0293, 2],
  ["street-lighting", "Dark crossing near Taksim Square", "Pedestrian-crossing lamps have failed and leave the curb difficult to see after sunset.", "in_review", 41.0370, 28.9850, 5],
  ["waste-sanitation", "Overflowing bins near Eminonu pier", "Public bins near the ferry stalls overflow and litter reaches the waterfront drains.", "accepted", 41.0164, 28.9704, 8],
  ["sidewalks", "Broken paving in Besiktas Square", "Raised paving slabs block wheelchair movement through the busy square.", "in_progress", 41.0438, 29.0058, 11],
  ["water-drainage", "Blocked drain near Uskudar ferry", "Rainwater pools across the pedestrian route because sediment covers the drain grate.", "resolved", 41.0267, 29.0150, 14],
  ["parks-trees", "Fallen branch in Gulhane Park", "A large fallen branch narrows the main footpath and needs safe removal.", "rejected", 41.0136, 28.9814, 17],
  ["road-potholes", "Cracked asphalt at Bakirkoy junction", "Long asphalt cracks widen at the right-turn lane and collect water after rain.", "submitted", 40.9800, 28.8720, 20],
  ["street-lighting", "Lamp outage in Zeytinburnu", "Path lighting beside the tram approach has failed, creating a dark section for pedestrians.", "in_review", 41.0053, 28.9076, 23],
  ["waste-sanitation", "Illegal rubbish beside Karakoy quay", "Household bags and cardboard have accumulated beside the public recycling point.", "accepted", 41.0254, 28.9745, 26],
  ["sidewalks", "Missing tactile paving in Sisli", "Tactile guiding tiles end before the bus stop, leaving an unsafe accessibility gap.", "in_progress", 41.0602, 28.9877, 29],
  ["water-drainage", "Flooded underpass at Yenikapi", "The underpass entrance floods during moderate rain and pedestrians must step into traffic.", "resolved", 41.0050, 28.9525, 32],
  ["parks-trees", "Damaged bench area in Macka Park", "Broken tree roots have lifted paving around benches and created trip hazards.", "rejected", 41.0458, 28.9921, 35],
  ["road-potholes", "Sunken manhole in Mecidiyekoy", "A sunken utility cover jolts cars and is difficult to see at night.", "submitted", 41.0663, 28.9920, 38],
  ["street-lighting", "Flickering lights in Nisantasi", "Several lamps flicker continuously and leave parts of the pavement intermittently dark.", "in_review", 41.0522, 28.9955, 41],
  ["waste-sanitation", "Uncollected litter in Eyupsultan", "Litter around the square has not been collected for several days despite full bins.", "accepted", 41.0470, 28.9339, 44],
  ["sidewalks", "Narrow sidewalk in Fatih", "Construction barriers leave less than a safe walking width beside fast traffic.", "in_progress", 41.0180, 28.9396, 47],
  ["water-drainage", "Leaking irrigation pipe in Florya", "A leaking irrigation pipe keeps the park path wet and creates slippery moss.", "resolved", 40.9767, 28.7884, 50],
  ["parks-trees", "Unsafe low branch in Fenerbahce Park", "A low branch blocks a shared path and may fall in strong wind.", "rejected", 40.9688, 29.0364, 53],
  ["road-potholes", "Loose paving on Bagdat Avenue", "Loose road-edge blocks shift under vehicle wheels beside the market entrance.", "submitted", 40.9707, 29.0649, 56],
  ["street-lighting", "Unlit walkway in Atakoy", "The connecting walkway between apartments and the park has no working lights.", "in_review", 40.9834, 28.8419, 59],
  ["waste-sanitation", "Full dog-waste station in Kartal", "The dog-waste dispenser is empty and its collection bin has overflowed onto the path.", "accepted", 40.8892, 29.1857, 62],
  ["sidewalks", "Collapsed curb ramp in Umraniye", "The curb ramp surface has collapsed and cannot be safely used by wheelchairs or prams.", "in_progress", 41.0164, 29.1248, 65],
  ["water-drainage", "Open drainage grate in Beykoz", "A damaged grate leaves an open drain beside a school walking route.", "resolved", 41.1340, 29.0923, 68],
  ["parks-trees", "Overgrown path in Emirgan Park", "Shrubs have grown into the paved path and reduce visibility around a bend.", "rejected", 41.1084, 29.0527, 71],
  ["road-potholes", "Uneven speed hump in Kucukcekmece", "The speed hump has broken edges that scrape low vehicles and create motorcycle risk.", "submitted", 41.0000, 28.7800, 74],
  ["street-lighting", "Broken lamp in Bayrampasa", "A market-side lamp pole is dark and its access panel appears loose.", "in_review", 41.0437, 28.9015, 77],
  ["waste-sanitation", "Missed recycling collection in Kadikoy", "Recycling containers are full and loose material is spreading across the pavement.", "accepted", 40.9910, 29.0270, 80],
  ["sidewalks", "Tree-root trip hazard in Levent", "Tree roots have lifted several sidewalk sections near the clinic entrance.", "in_progress", 41.0810, 29.0105, 83],
  ["water-drainage", "Standing water near Sariyer coast", "A blocked culvert leaves standing water across the waterfront trail after rainfall.", "resolved", 41.1665, 29.0505, 86],
  ["parks-trees", "Damaged playground surface in Maltepe", "Rubber safety surfacing under the slide has split and exposes the hard base.", "rejected", 40.9357, 29.1307, 89]
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
      `INSERT INTO users (auth_uid, email, display_name, role)
       VALUES ($1, $2, $3, 'user')
       ON CONFLICT (auth_uid) DO NOTHING
       RETURNING id`,
      [`seed-fixture-resident-${index + 1}`, `seed-fixture-resident-${index + 1}@example.invalid`, `Fixture Resident ${index + 1}`]
    );
    if (user.rows[0]) {
      residents.push(user.rows[0].id);
    } else {
      const existing = await client.query("SELECT id FROM users WHERE auth_uid = $1", [`seed-fixture-resident-${index + 1}`]);
      residents.push(existing.rows[0].id);
    }
  }

  for (const [index, [slug, title, description, status, latitude, longitude, daysAgo]] of fixtures.entries()) {
    const issueId = `e2000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
    const reportId = reportIds[index];
    const createdAt = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
    const categoryId = categoryIds.get(slug);
    await client.query(
      `INSERT INTO issues (id, category_id, title, summary, latitude, longitude, status, priority, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'low', $8)
       ON CONFLICT (id) DO UPDATE SET
         category_id = EXCLUDED.category_id,
         title = EXCLUDED.title,
         summary = EXCLUDED.summary,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         status = EXCLUDED.status,
         updated_at = NOW()`,
      [issueId, categoryId, title, description, latitude, longitude, status, createdAt]
    );
    await client.query(
      `INSERT INTO reports (id, issue_id, user_id, category_id, description, latitude, longitude, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO UPDATE SET
         issue_id = EXCLUDED.issue_id,
         user_id = EXCLUDED.user_id,
         category_id = EXCLUDED.category_id,
         description = EXCLUDED.description,
         latitude = EXCLUDED.latitude,
         longitude = EXCLUDED.longitude,
         updated_at = NOW()`,
      [reportId, issueId, residents[index % residents.length], categoryId, description, latitude, longitude, createdAt]
    );
  }

  const istanbulCenter = [41.0082, 28.9784];
  await client.query(
    `UPDATE issues
     SET latitude = $1, longitude = $2, updated_at = NOW()
     WHERE latitude < $3 OR latitude > $4 OR longitude < $5 OR longitude > $6`,
    [
      istanbulCenter[0],
      istanbulCenter[1],
      ISTANBUL_BOUNDS.south,
      ISTANBUL_BOUNDS.north,
      ISTANBUL_BOUNDS.west,
      ISTANBUL_BOUNDS.east
    ]
  );
  await client.query(
    `UPDATE reports r
     SET latitude = i.latitude, longitude = i.longitude, updated_at = NOW()
     FROM issues i
     WHERE r.issue_id = i.id
       AND (r.latitude < $1 OR r.latitude > $2 OR r.longitude < $3 OR r.longitude > $4)`,
    [
      ISTANBUL_BOUNDS.south,
      ISTANBUL_BOUNDS.north,
      ISTANBUL_BOUNDS.west,
      ISTANBUL_BOUNDS.east
    ]
  );
  await client.query(
    `UPDATE issues i
     SET priority = CASE
       WHEN counts.supporter_count >= 10 THEN 'urgent'
       WHEN counts.supporter_count >= 5 THEN 'high'
       WHEN counts.supporter_count >= 2 THEN 'medium'
       ELSE 'low'
     END,
     updated_at = NOW()
     FROM (
       SELECT i2.id, COUNT(s.user_id)::int AS supporter_count
       FROM issues i2
       LEFT JOIN issue_supporters s ON s.issue_id = i2.id
       GROUP BY i2.id
     ) counts
     WHERE i.id = counts.id`
  );

  const result = await client.query("SELECT COUNT(*)::int AS count FROM reports WHERE id = ANY($1::uuid[])", [reportIds]);
  if (result.rows[0].count !== fixtures.length) throw new Error("Development fixture verification failed");
  await client.query("COMMIT");
  console.log("Development seed verified: 30 Istanbul reports, 30 mapped issues, 3 fixture residents.");
} catch (error) {
  await client.query("ROLLBACK").catch(() => void 0);
  throw error;
} finally {
  await client.end();
}
