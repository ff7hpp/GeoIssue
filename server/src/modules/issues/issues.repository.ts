import { pool, isUsingMockDb, mockStore, query } from '../../db/pool.js';
import {
  DbIssue,
  DbIssueStatusHistory,
  IssuePriority,
  IssueStatus,
} from '../../shared/types.js';
import { calculateHaversineDistance } from '../../shared/haversine.js';
import { isIssueActive } from '../../shared/stateMachine.js';
import crypto from 'crypto';

export const issuesRepository = {
  async findById(id: string): Promise<DbIssue | null> {
    if (isUsingMockDb) {
      const issue = mockStore.issues.get(id);
      if (!issue) return null;
      const category = mockStore.categories.get(issue.category_id);
      let supportersCount = 0;
      for (const key of mockStore.issue_supporters) {
        if (key.startsWith(`${id}:`)) supportersCount++;
      }
      return {
        ...issue,
        category,
        assignee: issue.assigned_to ? mockStore.users.get(issue.assigned_to) : null,
        supporter_count: supportersCount,
      };
    }

    const sql = `
      SELECT i.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        (SELECT COUNT(*)::int FROM issue_supporters WHERE issue_id = i.id) as supporter_count,
        CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'display_name', u.display_name, 'email', u.email, 'avatar_url', u.avatar_url) ELSE NULL END as assignee
      FROM issues i
      JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.assigned_to = u.id
      WHERE i.id = $1 AND i.deleted_at IS NULL
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async list(filters: {
    status?: IssueStatus;
    categoryId?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{ issues: DbIssue[]; total: number }> {
    const page = filters.page || 1;
    const limit = filters.limit || 20;

    if (isUsingMockDb) {
      let all = Array.from(mockStore.issues.values()).filter(i => !i.deleted_at).map((issue) => {
        const category = mockStore.categories.get(issue.category_id);
        let supportersCount = 0;
        for (const key of mockStore.issue_supporters) {
          if (key.startsWith(`${issue.id}:`)) supportersCount++;
        }
        return {
          ...issue,
          category,
          assignee: issue.assigned_to ? mockStore.users.get(issue.assigned_to) : null,
          supporter_count: supportersCount,
        };
      });

      if (filters.status) {
        all = all.filter((i) => i.status === filters.status);
      }
      if (filters.categoryId) {
        all = all.filter((i) => i.category_id === filters.categoryId);
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        all = all.filter(
          (i) =>
            i.title.toLowerCase().includes(s) ||
            (i.summary && i.summary.toLowerCase().includes(s))
        );
      }

      all.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * limit;
      return {
        issues: all.slice(start, start + limit),
        total: all.length,
      };
    }

    const conditions: string[] = ['i.deleted_at IS NULL'];
    const values: any[] = [];
    let idx = 1;

    if (filters.status) {
      conditions.push(`i.status = $${idx++}`);
      values.push(filters.status);
    }
    if (filters.categoryId) {
      conditions.push(`i.category_id = $${idx++}`);
      values.push(filters.categoryId);
    }
    if (filters.search) {
      conditions.push(
        `(LOWER(i.title) LIKE $${idx} OR LOWER(COALESCE(i.summary, '')) LIKE $${idx})`
      );
      values.push(`%${filters.search.toLowerCase()}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM issues i ${whereClause}`;
    const countRes = await query(countSql, values);
    const total = parseInt(countRes.rows[0].count, 10);

    const offset = (page - 1) * limit;
    values.push(limit, offset);

    const sql = `
      SELECT i.*,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug, 'icon', c.icon) as category,
        (SELECT COUNT(*)::int FROM issue_supporters WHERE issue_id = i.id) as supporter_count,
        CASE WHEN u.id IS NOT NULL THEN json_build_object('id', u.id, 'display_name', u.display_name, 'email', u.email, 'avatar_url', u.avatar_url) ELSE NULL END as assignee
      FROM issues i
      JOIN categories c ON i.category_id = c.id
      LEFT JOIN users u ON i.assigned_to = u.id
      ${whereClause}
      ORDER BY i.created_at DESC
      LIMIT $${idx++} OFFSET $${idx++}
    `;

    const res = await query(sql, values);
    return { issues: res.rows, total };
  },

  async findNearbyActiveCandidates(
    categoryId: string,
    lat: number,
    lon: number,
    radiusMeters: number
  ): Promise<Array<DbIssue & { distance: number }>> {
    let candidateIssues: DbIssue[] = [];

    if (isUsingMockDb) {
      candidateIssues = Array.from(mockStore.issues.values()).filter(
        (i) => i.category_id === categoryId && isIssueActive(i.status) && !i.deleted_at
      );
    } else {
      const sql = `
        SELECT * FROM issues
        WHERE category_id = $1
          AND status IN ('submitted', 'in_review', 'accepted', 'in_progress')
          AND deleted_at IS NULL
      `;
      const res = await query(sql, [categoryId]);
      candidateIssues = res.rows.map((row) => ({
        ...row,
        latitude: parseFloat(row.latitude),
        longitude: parseFloat(row.longitude),
      }));
    }

    const matches: Array<DbIssue & { distance: number }> = [];

    for (const issue of candidateIssues) {
      const distance = calculateHaversineDistance(
        lat,
        lon,
        Number(issue.latitude),
        Number(issue.longitude)
      );
      if (distance <= radiusMeters) {
        matches.push({ ...issue, distance });
      }
    }

    // Sort by closest distance first
    return matches.sort((a, b) => a.distance - b.distance);
  },

  async create(data: {
    category_id: string;
    title: string;
    summary?: string | null;
    latitude: number;
    longitude: number;
    status?: IssueStatus;
    priority?: IssuePriority;
  }): Promise<DbIssue> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const issue: DbIssue = {
        id: crypto.randomUUID(),
        category_id: data.category_id,
        title: data.title,
        summary: data.summary || null,
        latitude: data.latitude,
        longitude: data.longitude,
        status: data.status || 'submitted',
        priority: data.priority || 'medium',
        report_count: 1,
        created_at: now,
        updated_at: now,
        resolved_at: null,
      };
      mockStore.issues.set(issue.id, issue);
      return issue;
    }

    const sql = `
      INSERT INTO issues (category_id, title, summary, latitude, longitude, status, priority, report_count)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 1)
      RETURNING *;
    `;
    const res = await query(sql, [
      data.category_id,
      data.title,
      data.summary || null,
      data.latitude,
      data.longitude,
      data.status || 'submitted',
      data.priority || 'medium',
    ]);
    return res.rows[0];
  },

  async incrementReportCount(id: string): Promise<void> {
    if (isUsingMockDb) {
      const issue = mockStore.issues.get(id);
      if (issue) {
        issue.report_count += 1;
        issue.updated_at = new Date().toISOString();
        mockStore.issues.set(id, issue);
      }
      return;
    }

    await query(
      'UPDATE issues SET report_count = report_count + 1, updated_at = NOW() WHERE id = $1',
      [id]
    );
  },

  async update(id: string, data: Partial<DbIssue>): Promise<DbIssue | null> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const issue = mockStore.issues.get(id);
      if (!issue) return null;
      Object.assign(issue, data, { updated_at: now });
      mockStore.issues.set(id, issue);
      return issue;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.priority !== undefined) {
      fields.push(`priority = $${idx++}`);
      values.push(data.priority);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title);
    }
    if (data.summary !== undefined) {
      fields.push(`summary = $${idx++}`);
      values.push(data.summary);
    }
    if (data.resolved_at !== undefined) {
      fields.push(`resolved_at = $${idx++}`);
      values.push(data.resolved_at);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE issues SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async assignIssue(issueId: string, assigneeId: string | null): Promise<void> {
    if (isUsingMockDb) {
      const issue = mockStore.issues.get(issueId);
      if (issue) {
        issue.assigned_to = assigneeId;
        issue.updated_at = new Date().toISOString();
        mockStore.issues.set(issueId, issue);
      }
      return;
    }
    await query('UPDATE issues SET assigned_to = $1, updated_at = NOW() WHERE id = $2', [
      assigneeId,
      issueId,
    ]);
  },

  async addStatusHistory(data: {
    issue_id: string;
    changed_by_user_id: string | null;
    from_status: IssueStatus | null;
    to_status: IssueStatus;
    note?: string | null;
  }): Promise<DbIssueStatusHistory> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const history: DbIssueStatusHistory = {
        id: crypto.randomUUID(),
        issue_id: data.issue_id,
        changed_by_user_id: data.changed_by_user_id,
        from_status: data.from_status,
        to_status: data.to_status,
        note: data.note || null,
        created_at: now,
      };
      mockStore.issue_status_history.set(history.id, history);
      return history;
    }

    const sql = `
      INSERT INTO issue_status_history (issue_id, changed_by_user_id, from_status, to_status, note)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
    const res = await query(sql, [
      data.issue_id,
      data.changed_by_user_id,
      data.from_status,
      data.to_status,
      data.note || null,
    ]);
    return res.rows[0];
  },

  async getStatusHistory(issueId: string): Promise<DbIssueStatusHistory[]> {
    if (isUsingMockDb) {
      const list = Array.from(mockStore.issue_status_history.values())
        .filter((h) => h.issue_id === issueId)
        .map((h) => {
          const user = h.changed_by_user_id
            ? mockStore.users.get(h.changed_by_user_id)
            : null;
          return {
            ...h,
            changed_by: user
              ? { id: user.id, display_name: user.display_name, role: user.role }
              : undefined,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      return list;
    }

    const sql = `
      SELECT h.*,
        json_build_object('id', u.id, 'display_name', u.display_name, 'role', u.role) as changed_by
      FROM issue_status_history h
      LEFT JOIN users u ON h.changed_by_user_id = u.id
      WHERE h.issue_id = $1
      ORDER BY h.created_at DESC
    `;
    const res = await query(sql, [issueId]);
    return res.rows;
  },
};
