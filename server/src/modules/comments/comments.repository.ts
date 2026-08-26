import { pool, isUsingMockDb, mockStore, query } from '../../db/pool.js';
import { DbComment } from '../../shared/types.js';
import crypto from 'crypto';

export const commentsRepository = {
  async findByIssueId(issueId: string): Promise<DbComment[]> {
    if (isUsingMockDb) {
      const list = Array.from(mockStore.issue_comments.values())
        .filter((c) => c.issue_id === issueId)
        .map((c) => {
          const user = mockStore.users.get(c.user_id);
          return {
            ...c,
            user: user
              ? { id: user.id, display_name: user.display_name, role: user.role }
              : undefined,
          };
        })
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      return list;
    }

    const sql = `
      SELECT c.*,
        json_build_object('id', u.id, 'display_name', u.display_name, 'role', u.role) as user
      FROM issue_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.issue_id = $1
      ORDER BY c.created_at ASC
    `;
    const res = await query(sql, [issueId]);
    return res.rows;
  },

  async findById(id: string): Promise<DbComment | null> {
    if (isUsingMockDb) {
      const comment = mockStore.issue_comments.get(id);
      if (!comment) return null;
      const user = mockStore.users.get(comment.user_id);
      return {
        ...comment,
        user: user
          ? { id: user.id, display_name: user.display_name, role: user.role }
          : undefined,
      };
    }

    const sql = `
      SELECT c.*,
        json_build_object('id', u.id, 'display_name', u.display_name, 'role', u.role) as user
      FROM issue_comments c
      JOIN users u ON c.user_id = u.id
      WHERE c.id = $1
    `;
    const res = await query(sql, [id]);
    return res.rows[0] || null;
  },

  async create(data: {
    issue_id: string;
    user_id: string;
    content: string;
    is_official?: boolean;
  }): Promise<DbComment> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const comment: DbComment = {
        id: crypto.randomUUID(),
        issue_id: data.issue_id,
        user_id: data.user_id,
        content: data.content,
        is_official: data.is_official ?? false,
        created_at: now,
        updated_at: now,
      };
      mockStore.issue_comments.set(comment.id, comment);
      const user = mockStore.users.get(data.user_id);
      return {
        ...comment,
        user: user
          ? { id: user.id, display_name: user.display_name, role: user.role }
          : undefined,
      };
    }

    const sql = `
      WITH inserted AS (
        INSERT INTO issue_comments (issue_id, user_id, content, is_official)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      )
      SELECT inserted.*,
        json_build_object('id', u.id, 'display_name', u.display_name, 'role', u.role) as user
      FROM inserted
      JOIN users u ON inserted.user_id = u.id;
    `;
    const res = await query(sql, [
      data.issue_id,
      data.user_id,
      data.content,
      data.is_official ?? false,
    ]);
    return res.rows[0];
  },

  async delete(id: string): Promise<boolean> {
    if (isUsingMockDb) {
      return mockStore.issue_comments.delete(id);
    }
    const res = await query('DELETE FROM issue_comments WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  },
};
