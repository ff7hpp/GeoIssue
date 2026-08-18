import express from "express";
import { query } from "../db/pool.js";
import { requireAdmin, requireAuth } from "../middleware/auth.js";

const router = express.Router();

const issueFields = `
  issues.id,
  issues.title,
  issues.description,
  issues.category,
  issues.status,
  issues.lat,
  issues.lng,
  issues.created_by,
  issues.created_at,
  issues.updated_at,
  users.name AS reporter
`;

function mapIssue(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    status: row.status,
    lat: Number(row.lat),
    lng: Number(row.lng),
    createdBy: row.created_by,
    reporter: row.reporter || "Deleted user",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function canManageIssue(user, issue) {
  return user.role === "admin" || issue.created_by === user.id;
}

router.get("/", async (req, res, next) => {
  try {
    const conditions = [];
    const params = [];

    if (req.query.category) {
      params.push(req.query.category);
      conditions.push(`issues.category = $${params.length}`);
    }

    if (req.query.status) {
      params.push(req.query.status);
      conditions.push(`issues.status = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const { rows } = await query(
      `SELECT ${issueFields}
       FROM issues
       LEFT JOIN users ON users.id = issues.created_by
       ${where}
       ORDER BY issues.created_at DESC`,
      params,
    );

    res.json({ issues: rows.map(mapIssue) });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT ${issueFields}
       FROM issues
       LEFT JOIN users ON users.id = issues.created_by
       WHERE issues.id = $1`,
      [req.params.id],
    );

    if (!rows[0]) {
      return next({ status: 404, message: "Issue not found" });
    }

    res.json({ issue: mapIssue(rows[0]) });
  } catch (err) {
    next(err);
  }
});

router.post("/", requireAuth, async (req, res, next) => {
  try {
    const { title, description = "", category, lat, lng } = req.body;

    if (!title || !category || lat === undefined || lng === undefined) {
      return next({ status: 400, message: "Title, category, lat, and lng are required" });
    }

    const { rows } = await query(
      `INSERT INTO issues (title, description, category, lat, lng, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title.trim(), description.trim(), category, lat, lng, req.user.id],
    );

    res.status(201).json({ issue: mapIssue({ ...rows[0], reporter: req.user.name }) });
  } catch (err) {
    next(err);
  }
});

router.put("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM issues WHERE id = $1", [req.params.id]);
    const issue = existing.rows[0];

    if (!issue) {
      return next({ status: 404, message: "Issue not found" });
    }

    if (!canManageIssue(req.user, issue)) {
      return next({ status: 403, message: "You cannot edit this issue" });
    }

    const { title, description = "", category, status, lat, lng } = req.body;

    if (!title || !category || !status || lat === undefined || lng === undefined) {
      return next({
        status: 400,
        message: "Title, category, status, lat, and lng are required",
      });
    }

    const { rows } = await query(
      `UPDATE issues
       SET title = $1,
           description = $2,
           category = $3,
           status = $4,
           lat = $5,
           lng = $6,
           updated_at = now()
       WHERE id = $7
       RETURNING *`,
      [title.trim(), description.trim(), category, status, lat, lng, req.params.id],
    );

    res.json({ issue: mapIssue({ ...rows[0], reporter: req.user.name }) });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const existing = await query("SELECT * FROM issues WHERE id = $1", [req.params.id]);
    const issue = existing.rows[0];

    if (!issue) {
      return next({ status: 404, message: "Issue not found" });
    }

    if (!canManageIssue(req.user, issue)) {
      return next({ status: 403, message: "You cannot delete this issue" });
    }

    await query("DELETE FROM issues WHERE id = $1", [req.params.id]);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

router.patch("/:id/status", requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return next({ status: 400, message: "Status is required" });
    }

    const { rows } = await query(
      `UPDATE issues
       SET status = $1, updated_at = now()
       WHERE id = $2
       RETURNING *`,
      [status, req.params.id],
    );

    if (!rows[0]) {
      return next({ status: 404, message: "Issue not found" });
    }

    res.json({ issue: mapIssue({ ...rows[0], reporter: req.user.name }) });
  } catch (err) {
    next(err);
  }
});

export default router;
