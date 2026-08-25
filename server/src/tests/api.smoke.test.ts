import { describe, it, expect, beforeAll } from 'vitest';
import { app } from '../app.js';
import { initDb } from '../db/pool.js';

// Simple lightweight supertest-like invocation helper using express app
async function makeRequest(
  method: string,
  url: string,
  headers: Record<string, string> = {},
  body?: any
) {
  return new Promise<{ status: number; body: any }>((resolve) => {
    const req: any = {
      method,
      url,
      originalUrl: url,
      headers: { ...headers },
      body,
      query: {},
      params: {},
    };

    if (url.includes('?')) {
      const parts = url.split('?');
      req.url = parts[0];
      req.originalUrl = url;
      const searchParams = new URLSearchParams(parts[1]);
      for (const [k, v] of searchParams.entries()) {
        req.query[k] = v;
      }
    }

    let responseStatus = 200;
    let responseBody: any = null;

    const res: any = {
      status(code: number) {
        responseStatus = code;
        return this;
      },
      json(data: any) {
        responseBody = data;
        resolve({ status: responseStatus, body: responseBody });
        return this;
      },
      setHeader() {},
      getHeader() {},
    };

    app(req, res, (err: any) => {
      if (err) {
        resolve({
          status: err.statusCode || 500,
          body: { error: { code: err.code || 'INTERNAL_ERROR', message: err.message } },
        });
      } else {
        resolve({ status: responseStatus, body: responseBody });
      }
    });
  });
}

describe('API Smoke & Security Tests', () => {
  beforeAll(async () => {
    await initDb();
  });

  it('GET /api/health should return 200 with service info', async () => {
    const res = await makeRequest('GET', '/api/health');
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('healthy');
  });

  it('GET /api/categories should be publicly accessible', async () => {
    const res = await makeRequest('GET', '/api/categories');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/issues should be publicly accessible', async () => {
    const res = await makeRequest('GET', '/api/issues');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta.page).toBe(1);
  });

  it('POST /api/reports without Authorization header should return 401 UNAUTHENTICATED', async () => {
    const res = await makeRequest('POST', '/api/reports', {}, {
      category_id: 'c1',
      description: 'Test pothole',
      latitude: 39.9,
      longitude: 32.8,
    });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/me without Authorization header should return 401 UNAUTHENTICATED', async () => {
    const res = await makeRequest('GET', '/api/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('GET /api/admin/users with regular user token should return 403 FORBIDDEN', async () => {
    const res = await makeRequest('GET', '/api/admin/users', {
      authorization: 'Bearer dev-user',
    });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('GET /api/admin/users with admin token should return 200 OK', async () => {
    const res = await makeRequest('GET', '/api/admin/users', {
      authorization: 'Bearer dev-admin',
    });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
