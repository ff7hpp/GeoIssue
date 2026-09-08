import { isUsingMockDb, mockStore, query } from "../../db/pool.js";
import { priorityFromSupporterCount } from "../../shared/priority.js";
import crypto from "crypto";

function withSupportPriority(issue) {
  if (!issue) return issue;
  let supporterCount = issue.supporter_count;
  if (isUsingMockDb) {
    supporterCount = 0;
    for (const key of mockStore.issue_supporters) {
      if (key.startsWith(`${issue.id}:`)) supporterCount++;
    }
  }
  return {
    ...issue,
    supporter_count: Number(supporterCount) || 0,
    priority: priorityFromSupporterCount(supporterCount)
  };
}

const reportsRepository = {
  async findById(id) {
    if (isUsingMockDb) {
      const report = mockStore.reports.get(id);
      if (!report) return null;
      const category = mockStore.categories.get(report.category_id);
      const user = mockStore.users.get(report.user_id);
      return {
        ...report,
        category,
        user: user ? { id: user.id, display_name: user.display_name } : void 0
      };
    }
    const sql = `
      SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        json_build_object('id', u.id, 'display_name', u.display_name) as user
      FROM reports r
      JOIN categories c ON r.category_id = c.id
      JOIN users u ON r.user_id = u.id
      WHERE r.id = $1 AND r.deleted_at IS NULL
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },
  async findByIssueId(issueId) {
    if (isUsingMockDb) {
      const list = Array.from(mockStore.reports.values()).filter((r) => r.issue_id === issueId).map((r) => {
        const category = mockStore.categories.get(r.category_id);
        const user = mockStore.users.get(r.user_id);
        return {
          ...r,
          category,
          user: user ? { id: user.id, display_name: user.display_name } : void 0
        };
      }).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      return list;
    }
    const sql = `
      SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        json_build_object('id', u.id, 'display_name', u.display_name) as user
      FROM reports r
      JOIN categories c ON r.category_id = c.id
      JOIN users u ON r.user_id = u.id
      WHERE r.issue_id = $1 AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
    `;
    const res = await query(sql, [issueId]);
    return res.rows;
  },
  async findByUserId(userId, page = 1, limit = 20) {
    if (isUsingMockDb) {
      const all = Array.from(mockStore.reports.values()).filter((r) => r.user_id === userId && !r.deleted_at).map((r) => {
        const category = mockStore.categories.get(r.category_id);
        const issue = mockStore.issues.get(r.issue_id);
        return {
          ...r,
          category,
          issue: withSupportPriority(issue)
        };
      }).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * limit;
      return {
        reports: all.slice(start, start + limit),
        total: all.length
      };
    }
    const countRes = await query(
      "SELECT COUNT(*) FROM reports WHERE user_id = $1 AND deleted_at IS NULL",
      [userId]
    );
    const total = parseInt(countRes.rows[0].count, 10);
    const offset = (page - 1) * limit;
    const sql = `
      SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        json_build_object(
          'id', i.id,
          'title', i.title,
          'status', i.status,
          'priority', i.priority,
          'supporter_count', (SELECT COUNT(*)::int FROM issue_supporters s WHERE s.issue_id = i.id)
        ) as issue
      FROM reports r
      JOIN categories c ON r.category_id = c.id
      JOIN issues i ON r.issue_id = i.id
      WHERE r.user_id = $1 AND r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    const res = await query(sql, [userId, limit, offset]);
    return {
      reports: res.rows.map((report) => ({
        ...report,
        issue: withSupportPriority(report.issue)
      })),
      total
    };
  },
  async listAll(page = 1, limit = 20) {
    if (isUsingMockDb) {
      const all = Array.from(mockStore.reports.values()).map((r) => {
        const category = mockStore.categories.get(r.category_id);
        const issue = mockStore.issues.get(r.issue_id);
        const user = mockStore.users.get(r.user_id);
        return {
          ...r,
          category,
          issue: withSupportPriority(issue),
          user: user ? { id: user.id, display_name: user.display_name } : void 0
        };
      }).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * limit;
      return { reports: all.slice(start, start + limit), total: all.length };
    }
    const countRes = await query("SELECT COUNT(*) FROM reports WHERE deleted_at IS NULL");
    const total = parseInt(countRes.rows[0].count, 10);
    const offset = (page - 1) * limit;
    const sql = `
      SELECT r.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        json_build_object(
          'id', i.id,
          'title', i.title,
          'status', i.status,
          'priority', i.priority,
          'supporter_count', (SELECT COUNT(*)::int FROM issue_supporters s WHERE s.issue_id = i.id)
        ) as issue,
        json_build_object('id', u.id, 'display_name', u.display_name) as user
      FROM reports r
      JOIN categories c ON r.category_id = c.id
      JOIN issues i ON r.issue_id = i.id
      JOIN users u ON r.user_id = u.id
      WHERE r.deleted_at IS NULL
      ORDER BY r.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    const res = await query(sql, [limit, offset]);
    return {
      reports: res.rows.map((report) => ({
        ...report,
        issue: withSupportPriority(report.issue)
      })),
      total
    };
  },
  async create(data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (isUsingMockDb) {
      const report = {
        id: crypto.randomUUID(),
        issue_id: data.issue_id,
        user_id: data.user_id,
        category_id: data.category_id,
        description: data.description,
        latitude: data.latitude,
        longitude: data.longitude,
        image_url: data.image_url || null,
        created_at: now,
        updated_at: now
      };
      mockStore.reports.set(report.id, report);
      return report;
    }
    const sql = `
      INSERT INTO reports (issue_id, user_id, category_id, description, latitude, longitude, image_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const res = await query(sql, [
      data.issue_id,
      data.user_id,
      data.category_id,
      data.description,
      data.latitude,
      data.longitude,
      data.image_url || null
    ]);
    return res.rows[0];
  },
  async update(id, data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (isUsingMockDb) {
      const report = mockStore.reports.get(id);
      if (!report) return null;
      if (data.description !== void 0) report.description = data.description;
      if (data.image_url !== void 0) report.image_url = data.image_url;
      report.updated_at = now;
      mockStore.reports.set(id, report);
      return report;
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (data.description !== void 0) {
      fields.push(`description = $${idx++}`);
      values.push(data.description);
    }
    if (data.image_url !== void 0) {
      fields.push(`image_url = $${idx++}`);
      values.push(data.image_url);
    }
    if (fields.length === 0) return this.findById(id);
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const sql = `UPDATE reports SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },
  async delete(id) {
    if (isUsingMockDb) {
      const exists = mockStore.reports.has(id);
      if (exists) {
        const rep = mockStore.reports.get(id);
        mockStore.reports.delete(id);
        if (rep && mockStore.issues.has(rep.issue_id)) {
          const issue = mockStore.issues.get(rep.issue_id);
          issue.report_count = Math.max(0, issue.report_count - 1);
        }
      }
      return exists;
    }
    const reportRes = await query("SELECT issue_id FROM reports WHERE id = $1", [id]);
    if (reportRes.rows.length === 0) return false;
    const issueId = reportRes.rows[0].issue_id;
    await query("UPDATE reports SET deleted_at = NOW() WHERE id = $1", [id]);
    await query(
      "UPDATE issues SET report_count = GREATEST(0, report_count - 1), updated_at = NOW() WHERE id = $1",
      [issueId]
    );
    return true;
  }
};
export {
  reportsRepository
};
