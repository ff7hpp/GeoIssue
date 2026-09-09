import { isUsingMockDb, mockStore, query } from "../../db/pool.js";
const usersRepository = {
  async findById(id) {
    if (isUsingMockDb) {
      return mockStore.users.get(id) || null;
    }
    const res = await query("SELECT * FROM users WHERE id = $1", [id]);
    return res.rows[0] || null;
  },
  async findByEmail(email) {
    if (isUsingMockDb) {
      for (const u of mockStore.users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      return null;
    }
    const res = await query("SELECT * FROM users WHERE LOWER(email) = LOWER($1)", [
      email
    ]);
    return res.rows[0] || null;
  },
  async update(id, data) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (isUsingMockDb) {
      const user = mockStore.users.get(id);
      if (!user) return null;
      Object.assign(user, data, { updated_at: now });
      mockStore.users.set(id, user);
      return user;
    }
    const fields = [];
    const values = [];
    let idx = 1;
    if (data.display_name !== void 0) {
      fields.push(`display_name = $${idx++}`);
      values.push(data.display_name);
    }
    if (data.language !== void 0) {
      fields.push(`language = $${idx++}`);
      values.push(data.language);
    }
    if (data.role !== void 0) {
      fields.push(`role = $${idx++}`);
      values.push(data.role);
    }
    if (data.account_status !== void 0) {
      fields.push(`account_status = $${idx++}`);
      values.push(data.account_status);
    }
    if (fields.length === 0) return this.findById(id);
    fields.push(`updated_at = NOW()`);
    values.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },
  async listAll(page = 1, limit = 20) {
    if (isUsingMockDb) {
      const all = Array.from(mockStore.users.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * limit;
      return {
        users: all.slice(start, start + limit),
        total: all.length
      };
    }
    const countRes = await query("SELECT COUNT(*) FROM users");
    const total = parseInt(countRes.rows[0].count, 10);
    const offset = (page - 1) * limit;
    const res = await query(
      "SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2",
      [limit, offset]
    );
    return { users: res.rows, total };
  }
};
export {
  usersRepository
};
