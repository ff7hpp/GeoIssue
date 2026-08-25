import { pool, isUsingMockDb, mockStore, query } from '../../db/pool.js';
import { DbCategory } from '../../shared/types.js';
import crypto from 'crypto';

export const categoriesRepository = {
  async listAll(onlyActive = true): Promise<DbCategory[]> {
    if (isUsingMockDb) {
      return Array.from(mockStore.categories.values())
        .filter((c) => (onlyActive ? c.is_active : true))
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    const sql = onlyActive
      ? 'SELECT * FROM categories WHERE is_active = true ORDER BY name ASC'
      : 'SELECT * FROM categories ORDER BY name ASC';
    const res = await query(sql);
    return res.rows;
  },

  async findById(id: string): Promise<DbCategory | null> {
    if (isUsingMockDb) {
      return mockStore.categories.get(id) || null;
    }
    const res = await query('SELECT * FROM categories WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findBySlug(slug: string): Promise<DbCategory | null> {
    if (isUsingMockDb) {
      for (const c of mockStore.categories.values()) {
        if (c.slug === slug) return c;
      }
      return null;
    }
    const res = await query('SELECT * FROM categories WHERE slug = $1', [slug]);
    return res.rows[0] || null;
  },

  async create(data: { name: string; slug: string; icon: string }): Promise<DbCategory> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const category: DbCategory = {
        id: crypto.randomUUID(),
        name: data.name,
        slug: data.slug,
        icon: data.icon,
        is_active: true,
        created_at: now,
        updated_at: now,
      };
      mockStore.categories.set(category.id, category);
      return category;
    }

    const sql = `
      INSERT INTO categories (name, slug, icon)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
    const res = await query(sql, [data.name, data.slug, data.icon]);
    return res.rows[0];
  },

  async update(
    id: string,
    data: Partial<Pick<DbCategory, 'name' | 'slug' | 'icon' | 'is_active'>>
  ): Promise<DbCategory | null> {
    const now = new Date().toISOString();
    if (isUsingMockDb) {
      const cat = mockStore.categories.get(id);
      if (!cat) return null;
      Object.assign(cat, data, { updated_at: now });
      mockStore.categories.set(id, cat);
      return cat;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.slug !== undefined) {
      fields.push(`slug = $${idx++}`);
      values.push(data.slug);
    }
    if (data.icon !== undefined) {
      fields.push(`icon = $${idx++}`);
      values.push(data.icon);
    }
    if (data.is_active !== undefined) {
      fields.push(`is_active = $${idx++}`);
      values.push(data.is_active);
    }

    if (fields.length === 0) return this.findById(id);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const sql = `UPDATE categories SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
    const res = await query(sql, values);
    return res.rows[0] || null;
  },
};
