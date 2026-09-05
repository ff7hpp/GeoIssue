import { isUsingMockDb, mockStore, query } from "../../db/pool.js";
const supportRepository = {
  async hasUserSupported(issueId, userId) {
    if (isUsingMockDb) {
      return mockStore.issue_supporters.has(`${issueId}:${userId}`);
    }
    const res = await query(
      "SELECT 1 FROM issue_supporters WHERE issue_id = $1 AND user_id = $2",
      [issueId, userId]
    );
    return res.rows.length > 0;
  },
  async addSupport(issueId, userId) {
    if (isUsingMockDb) {
      const key = `${issueId}:${userId}`;
      if (mockStore.issue_supporters.has(key)) return false;
      mockStore.issue_supporters.add(key);
      return true;
    }
    const sql = `
      INSERT INTO issue_supporters (issue_id, user_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING
      RETURNING *;
    `;
    const res = await query(sql, [issueId, userId]);
    return (res.rowCount ?? 0) > 0;
  },
  async removeSupport(issueId, userId) {
    if (isUsingMockDb) {
      const key = `${issueId}:${userId}`;
      return mockStore.issue_supporters.delete(key);
    }
    const res = await query(
      "DELETE FROM issue_supporters WHERE issue_id = $1 AND user_id = $2",
      [issueId, userId]
    );
    return (res.rowCount ?? 0) > 0;
  },
  async getSupportersCount(issueId) {
    if (isUsingMockDb) {
      let count = 0;
      for (const key of mockStore.issue_supporters) {
        if (key.startsWith(`${issueId}:`)) count++;
      }
      return count;
    }
    const res = await query(
      "SELECT COUNT(*)::int as count FROM issue_supporters WHERE issue_id = $1",
      [issueId]
    );
    return res.rows[0]?.count || 0;
  }
};
export {
  supportRepository
};
