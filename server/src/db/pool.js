import pg from "pg";
import { config } from "../config/env.js";
const { Pool } = pg;
let pool = null;
let isUsingMockDb = false;
const mockStore = {
  users: /* @__PURE__ */ new Map(),
  categories: /* @__PURE__ */ new Map(),
  issues: /* @__PURE__ */ new Map(),
  reports: /* @__PURE__ */ new Map(),
  issue_supporters: /* @__PURE__ */ new Set(),
  // key: "issueId:userId"
  issue_status_history: /* @__PURE__ */ new Map(),
  issue_comments: /* @__PURE__ */ new Map()
};
async function initDb() {
  if (config.databaseUrl) {
    try {
      pool = new Pool({
        connectionString: config.databaseUrl,
        ssl: config.databaseUrl.includes("neon.tech") ? { rejectUnauthorized: false } : false
      });
      const client = await pool.connect();
      client.release();
      console.log("Connected to PostgreSQL / Neon database.");
      isUsingMockDb = false;
      return;
    } catch (err) {
      if (config.nodeEnv === "production") {
        console.error("Could not connect to the configured PostgreSQL database.");
        throw new Error("Production database connection failed");
      }
      console.warn(
        "Could not connect to PostgreSQL database URL. Falling back to in-memory local data store.",
        err
      );
    }
  } else {
    console.log(
      "DATABASE_URL not configured. Operating in in-memory fallback store for local dev & testing."
    );
  }
  isUsingMockDb = true;
  seedMockData();
}
async function query(text, params) {
  if (pool && !isUsingMockDb) {
    return pool.query(text, params);
  }
  throw new Error("Database pool not initialized");
}
function seedMockData() {
  if (mockStore.categories.size > 0) return;
  const defaultCategories = [
    {
      id: "c1000000-0000-0000-0000-000000000001",
      name: "Road & Potholes",
      slug: "road-potholes",
      icon: "Construction",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c1000000-0000-0000-0000-000000000002",
      name: "Street Lighting",
      slug: "street-lighting",
      icon: "Lightbulb",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c1000000-0000-0000-0000-000000000003",
      name: "Waste & Sanitation",
      slug: "waste-sanitation",
      icon: "Trash2",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c1000000-0000-0000-0000-000000000004",
      name: "Sidewalks & Walkways",
      slug: "sidewalks",
      icon: "Footprints",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c1000000-0000-0000-0000-000000000005",
      name: "Water & Drainage",
      slug: "water-drainage",
      icon: "Droplets",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "c1000000-0000-0000-0000-000000000006",
      name: "Public Parks & Trees",
      slug: "parks-trees",
      icon: "Trees",
      is_active: true,
      created_at: (/* @__PURE__ */ new Date()).toISOString(),
      updated_at: (/* @__PURE__ */ new Date()).toISOString()
    }
  ];
  defaultCategories.forEach((cat) => mockStore.categories.set(cat.id, cat));
  const adminUser = {
    id: "u1000000-0000-0000-0000-000000000001",
    auth_uid: "admin_demo_uid_123",
    email: "admin@geoissue.org",
    display_name: "Lead Admin",
    role: "admin",
    language: "en",
    account_status: "active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockStore.users.set(adminUser.id, adminUser);
  const citizenUser = {
    id: "u1000000-0000-0000-0000-000000000002",
    auth_uid: "citizen_demo_uid_456",
    email: "citizen@geoissue.org",
    display_name: "Tariq Al-Mansoor",
    role: "user",
    language: "en",
    account_status: "active",
    created_at: (/* @__PURE__ */ new Date()).toISOString(),
    updated_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  mockStore.users.set(citizenUser.id, citizenUser);
  const sampleIssue1 = {
    id: "i1000000-0000-0000-0000-000000000001",
    category_id: defaultCategories[0].id,
    title: "Severe pothole cluster on Bagdat Avenue",
    summary: "Multiple deep potholes causing traffic hazards and vehicle damage near the Kadikoy intersection.",
    latitude: 40.9707,
    longitude: 29.0649,
    status: "in_progress",
    priority: "low",
    report_count: 3,
    created_at: new Date(Date.now() - 864e5 * 4).toISOString(),
    updated_at: new Date(Date.now() - 864e5 * 1).toISOString(),
    resolved_at: null
  };
  mockStore.issues.set(sampleIssue1.id, sampleIssue1);
  const sampleReport1 = {
    id: "r1000000-0000-0000-0000-000000000001",
    issue_id: sampleIssue1.id,
    user_id: citizenUser.id,
    category_id: defaultCategories[0].id,
    description: "Broke my tire rim on this pothole while driving home last night. Very dangerous at speed.",
    latitude: 40.9707,
    longitude: 29.0649,
    image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=800&q=80",
    created_at: new Date(Date.now() - 864e5 * 4).toISOString(),
    updated_at: new Date(Date.now() - 864e5 * 4).toISOString()
  };
  mockStore.reports.set(sampleReport1.id, sampleReport1);
  const history1 = {
    id: "h1000000-0000-0000-0000-000000000001",
    issue_id: sampleIssue1.id,
    changed_by_user_id: adminUser.id,
    from_status: "submitted",
    to_status: "in_review",
    note: "Under review by municipal road dispatch team.",
    created_at: new Date(Date.now() - 864e5 * 3).toISOString()
  };
  const history2 = {
    id: "h1000000-0000-0000-0000-000000000002",
    issue_id: sampleIssue1.id,
    changed_by_user_id: adminUser.id,
    from_status: "in_review",
    to_status: "accepted",
    note: "Confirmed on-site. Work order dispatched to public works contractor.",
    created_at: new Date(Date.now() - 864e5 * 2).toISOString()
  };
  const history3 = {
    id: "h1000000-0000-0000-0000-000000000003",
    issue_id: sampleIssue1.id,
    changed_by_user_id: adminUser.id,
    from_status: "accepted",
    to_status: "in_progress",
    note: "Asphalt repair crew on site today.",
    created_at: new Date(Date.now() - 864e5 * 1).toISOString()
  };
  mockStore.issue_status_history.set(history1.id, history1);
  mockStore.issue_status_history.set(history2.id, history2);
  mockStore.issue_status_history.set(history3.id, history3);
  const sampleIssue2 = {
    id: "i1000000-0000-0000-0000-000000000002",
    category_id: defaultCategories[1].id,
    title: "Broken street lamp row near Macka Park",
    summary: "Dark street stretch creating safety concern for pedestrians near the park at night.",
    latitude: 41.0458,
    longitude: 28.9921,
    status: "in_review",
    priority: "low",
    report_count: 1,
    created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
    updated_at: new Date(Date.now() - 864e5 * 2).toISOString(),
    resolved_at: null
  };
  mockStore.issues.set(sampleIssue2.id, sampleIssue2);
  const sampleReport2 = {
    id: "r1000000-0000-0000-0000-000000000002",
    issue_id: sampleIssue2.id,
    user_id: citizenUser.id,
    category_id: defaultCategories[1].id,
    description: "Three consecutive street lamps have been out for 4 days.",
    latitude: 41.0458,
    longitude: 28.9921,
    image_url: null,
    created_at: new Date(Date.now() - 864e5 * 2).toISOString(),
    updated_at: new Date(Date.now() - 864e5 * 2).toISOString()
  };
  mockStore.reports.set(sampleReport2.id, sampleReport2);
  mockStore.issue_supporters.add(`${sampleIssue1.id}:${citizenUser.id}`);
}
export {
  initDb,
  isUsingMockDb,
  mockStore,
  pool,
  query
};
