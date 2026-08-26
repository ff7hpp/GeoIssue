import { pool, isUsingMockDb, mockStore, query } from '../../db/pool.js';
import { DbUser, Language, UserRole } from '../../shared/types.js';
import crypto from 'crypto';

export const authRepository = {
  async findByEmail(email: string): Promise<DbUser | null> {
    const normalizedEmail = email.toLowerCase().trim();
    if (isUsingMockDb) {
      for (const u of mockStore.users.values()) {
        if (u.email.toLowerCase() === normalizedEmail) return u;
      }
      return null;
    }

    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [normalizedEmail]);
    return res.rows[0] || null;
  },

  async findById(id: string): Promise<DbUser | null> {
    if (isUsingMockDb) {
      return mockStore.users.get(id) || null;
    }

    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async create(data: {
    email: string;
    password_hash: string;
    display_name: string;
    language?: Language;
    role?: UserRole;
  }): Promise<DbUser> {
    const now = new Date().toISOString();
    const normalizedEmail = data.email.toLowerCase().trim();
    const firebaseUid = `local_${crypto.randomUUID()}`;

    if (isUsingMockDb) {
      const user: DbUser = {
        id: crypto.randomUUID(),
        firebase_uid: firebaseUid,
        email: normalizedEmail,
        password_hash: data.password_hash,
        display_name: data.display_name,
        avatar_url: null,
        role: data.role || 'user',
        language: data.language || 'en',
        account_status: 'active',
        created_at: now,
        updated_at: now,
      };
      mockStore.users.set(user.id, user);
      return user;
    }

    const sql = `
      INSERT INTO users (firebase_uid, email, password_hash, display_name, role, language, account_status)
      VALUES ($1, $2, $3, $4, $5, $6, 'active')
      RETURNING *;
    `;
    const res = await query(sql, [
      firebaseUid,
      normalizedEmail,
      data.password_hash,
      data.display_name,
      data.role || 'user',
      data.language || 'en',
    ]);
    return res.rows[0];
  },

  async updateProfile(
    userId: string,
    data: {
      display_name?: string;
      language?: Language;
      avatar_url?: string;
      password_hash?: string;
    }
  ): Promise<DbUser | null> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const existing = mockStore.users.get(userId);
      if (!existing) return null;

      const updated: DbUser = {
        ...existing,
        display_name: data.display_name !== undefined ? data.display_name : existing.display_name,
        language: data.language !== undefined ? data.language : existing.language,
        avatar_url: data.avatar_url !== undefined ? data.avatar_url : existing.avatar_url,
        password_hash: data.password_hash !== undefined ? data.password_hash : existing.password_hash,
        updated_at: now,
      };
      mockStore.users.set(userId, updated);
      return updated;
    }

    const setClauses: string[] = ['updated_at = NOW()'];
    const values: any[] = [userId];
    let paramIdx = 2;

    if (data.display_name !== undefined) {
      setClauses.push(`display_name = $${paramIdx++}`);
      values.push(data.display_name);
    }
    if (data.language !== undefined) {
      setClauses.push(`language = $${paramIdx++}`);
      values.push(data.language);
    }
    if (data.avatar_url !== undefined) {
      setClauses.push(`avatar_url = $${paramIdx++}`);
      values.push(data.avatar_url);
    }
    if (data.password_hash !== undefined) {
      setClauses.push(`password_hash = $${paramIdx++}`);
      values.push(data.password_hash);
    }

    const sql = `
      UPDATE users
      SET ${setClauses.join(', ')}
      WHERE id = $1
      RETURNING *;
    `;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },
};
