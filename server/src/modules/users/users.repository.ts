import { pool, isUsingMockDb, mockStore, query } from '../../db/pool.js';
import { DbUser, Language, UserRole } from '../../shared/types.js';
import crypto from 'crypto';

export const usersRepository = {
  async findById(id: string): Promise<DbUser | null> {
    if (isUsingMockDb) {
      return mockStore.users.get(id) || null;
    }
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByFirebaseUid(firebaseUid: string): Promise<DbUser | null> {
    if (isUsingMockDb) {
      for (const u of mockStore.users.values()) {
        if (u.firebase_uid === firebaseUid) return u;
      }
      return null;
    }
    const res = await query('SELECT * FROM users WHERE firebase_uid = $1', [
      firebaseUid,
    ]);
    return res.rows[0] || null;
  },

  async findByEmail(email: string): Promise<DbUser | null> {
    if (isUsingMockDb) {
      for (const u of mockStore.users.values()) {
        if (u.email.toLowerCase() === email.toLowerCase()) return u;
      }
      return null;
    }
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [
      email,
    ]);
    return res.rows[0] || null;
  },

  async upsert(data: {
    firebase_uid: string;
    email: string;
    display_name?: string | null;
    role?: UserRole;
    language?: Language;
    account_status?: string;
  }): Promise<DbUser> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const existing = await this.findByFirebaseUid(data.firebase_uid);
      if (existing) {
        existing.display_name = data.display_name !== undefined ? data.display_name : existing.display_name;
        existing.language = data.language || existing.language;
        existing.updated_at = now;
        mockStore.users.set(existing.id, existing);
        return existing;
      }

      const newUser: DbUser = {
        id: crypto.randomUUID(),
        firebase_uid: data.firebase_uid,
        email: data.email,
        display_name: data.display_name || null,
        role: data.role || 'user',
        language: data.language || 'en',
        account_status: (data.account_status as any) || 'active',
        created_at: now,
        updated_at: now,
      };
      mockStore.users.set(newUser.id, newUser);
      return newUser;
    }

    const sql = `
      INSERT INTO users (firebase_uid, email, display_name, role, language, account_status)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET
        display_name = COALESCE(EXCLUDED.display_name, users.display_name),
        language = COALESCE(EXCLUDED.language, users.language),
        updated_at = NOW()
      RETURNING *;
    `;
    const res = await query(sql, [
      data.firebase_uid,
      data.email,
      data.display_name || null,
      data.role || 'user',
      data.language || 'en',
      data.account_status || 'active',
    ]);
    return res.rows[0];
  },

  async update(id: string, data: Partial<DbUser>): Promise<DbUser | null> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const user = mockStore.users.get(id);
      if (!user) return null;
      Object.assign(user, data, { updated_at: now });
      mockStore.users.set(id, user);
      return user;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.display_name !== undefined) {
      fields.push(`display_name = $${idx++}`);
      values.push(data.display_name);
    }
    if (data.language !== undefined) {
      fields.push(`language = $${idx++}`);
      values.push(data.language);
    }
    if (data.role !== undefined) {
      fields.push(`role = $${idx++}`);
      values.push(data.role);
    }
    if (data.account_status !== undefined) {
      fields.push(`account_status = $${idx++}`);
      values.push(data.account_status);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },

  async listAll(page = 1, limit = 20): Promise<{ users: DbUser[]; total: number }> {
    if (isUsingMockDb) {
      const all = Array.from(mockStore.users.values()).sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const start = (page - 1) * limit;
      return {
        users: all.slice(start, start + limit),
        total: all.length,
      };
    }

    const countRes = await query('SELECT COUNT(*) FROM users');
    const total = parseInt(countRes.rows[0].count, 10);
    const offset = (page - 1) * limit;

    const res = await query(
      'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return { users: res.rows, total };
  },
};
