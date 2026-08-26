import { ApiResponse, Issue, Category, Report, User, IssueStatus, IssuePriority } from '../types';

const API_BASE = '/api';

let getAuthToken: (() => Promise<string | null>) | null = null;

export function registerAuthTokenProvider(provider: () => Promise<string | null>) {
  getAuthToken = provider;
}

export class ApiRequestError extends Error {
  code: string;
  fields?: Record<string, string>;

  constructor(code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    const err = body.error || {
      code: 'INTERNAL_ERROR',
      message: response.statusText || 'An unexpected error occurred',
    };
    throw new ApiRequestError(err.code, err.message, err.fields);
  }

  return body;
}

export const api = {
  // Public & Issue Routes
  async getCategories(onlyActive = true) {
    const res = await request<Category[]>(`/categories?all=${!onlyActive}`);
    return res.data;
  },

  async getIssues(params: {
    status?: IssueStatus;
    category_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Issue[]>(`/issues${qs}`);
  },

  async getIssueById(id: string) {
    const res = await request<Issue>(`/issues/${id}`);
    return res.data;
  },

  async supportIssue(id: string) {
    const res = await request<{ supported: boolean; supporter_count: number }>(
      `/issues/${id}/support`,
      { method: 'POST' }
    );
    return res.data;
  },

  async unsupportIssue(id: string) {
    const res = await request<{ supported: boolean; supporter_count: number }>(
      `/issues/${id}/support`,
      { method: 'DELETE' }
    );
    return res.data;
  },

  // User & Report Routes
  async getMe() {
    const res = await request<User>('/me');
    return res.data;
  },

  async syncMe(data: {
    firebase_uid?: string;
    email?: string;
    display_name?: string | null;
    language?: string;
  }) {
    const res = await request<User>('/me/sync', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateMe(data: { display_name?: string; language?: string }) {
    const res = await request<User>('/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async getMyReports(page = 1, limit = 20) {
    return request<Report[]>(`/me/reports?page=${page}&limit=${limit}`);
  },

  async createReport(data: {
    category_id: string;
    description: string;
    latitude: number;
    longitude: number;
    image_url?: string | null;
    title?: string;
  }) {
    const res = await request<{
      report: Report;
      matched_issue_id: string;
      is_new_issue: boolean;
      distance_meters: number;
    }>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateReport(
    id: string,
    data: { description?: string; image_url?: string | null }
  ) {
    const res = await request<Report>(`/reports/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async deleteReport(id: string) {
    const res = await request<{ success: boolean }>(`/reports/${id}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  // Geocoding Proxy Routes
  async searchGeocode(q: string) {
    const res = await request<Array<{
      place_id: number | string;
      display_name: string;
      lat: number;
      lon: number;
    }>>(`/geocode?q=${encodeURIComponent(q)}`);
    return res.data;
  },

  async reverseGeocode(lat: number, lon: number) {
    const res = await request<{ address: string | null }>(
      `/geocode/reverse?lat=${lat}&lon=${lon}`
    );
    return res.data.address;
  },

  // Admin Routes
  async getAdminIssues(params: {
    status?: IssueStatus;
    category_id?: string;
    search?: string;
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.category_id) query.set('category_id', params.category_id);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<Issue[]>(`/admin/issues${qs}`);
  },

  async updateAdminStatus(id: string, status: IssueStatus, note?: string) {
    const res = await request<Issue>(`/admin/issues/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
    return res.data;
  },

  async updateAdminPriority(id: string, priority: IssuePriority) {
    const res = await request<Issue>(`/admin/issues/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority }),
    });
    return res.data;
  },

  async getAdminUsers(page = 1, limit = 20) {
    return request<User[]>(`/admin/users?page=${page}&limit=${limit}`);
  },

  async updateAdminUser(id: string, data: { role?: string; account_status?: string }) {
    const res = await request<User>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async createAdminCategory(data: { name: string; slug: string; icon: string }) {
    const res = await request<Category>('/admin/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data;
  },

  async updateAdminCategory(
    id: string,
    data: { name?: string; slug?: string; icon?: string; is_active?: boolean }
  ) {
    const res = await request<Category>(`/admin/categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return res.data;
  },
};
