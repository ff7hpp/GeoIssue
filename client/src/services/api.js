const API_BASE = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
let getAuthToken = null;
function registerAuthTokenProvider(provider) {
  getAuthToken = provider;
}
class ApiRequestError extends Error {
  code;
  fields;
  constructor(code, message, fields) {
    super(message);
    this.code = code;
    this.fields = fields;
  }
}
async function request(endpoint, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...options.headers
  };
  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = body.error || {
      code: "INTERNAL_ERROR",
      message: response.statusText || "An unexpected error occurred"
    };
    throw new ApiRequestError(err.code, err.message, err.fields);
  }
  return body;
}
const api = {
  // Public & Issue Routes
  async getCategories(onlyActive = true) {
    const res = await request(`/categories?all=${!onlyActive}`);
    return res.data;
  },
  async getIssues(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.category_id) query.set("category_id", params.category_id);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/issues${qs}`);
  },
  async getIssueById(id) {
    const res = await request(`/issues/${id}`);
    return res.data;
  },
  async supportIssue(id) {
    const res = await request(
      `/issues/${id}/support`,
      { method: "POST" }
    );
    return res.data;
  },
  async unsupportIssue(id) {
    const res = await request(
      `/issues/${id}/support`,
      { method: "DELETE" }
    );
    return res.data;
  },
  // Issue Comments
  async getIssueComments(issueId) {
    const res = await request(`/issues/${issueId}/comments`);
    return res.data;
  },
  async addIssueComment(issueId, content) {
    const res = await request(`/issues/${issueId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
    return res.data;
  },
  async deleteIssueComment(issueId, commentId) {
    const res = await request(
      `/issues/${issueId}/comments/${commentId}`,
      { method: "DELETE" }
    );
    return res.data;
  },
  // Authentication & User Profile
  async login(credentials) {
    const res = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials)
    });
    return res.data;
  },
  async register(data) {
    const res = await request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async getMe() {
    const res = await request("/auth/me");
    return res.data;
  },
  async updateProfile(data) {
    const res = await request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async syncMe(data) {
    const res = await request("/me/sync", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async updateMe(data) {
    const res = await request("/me", {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async getMyReports(page = 1, limit = 20) {
    return request(`/me/reports?page=${page}&limit=${limit}`);
  },
  async createReport(data) {
    const res = await request("/reports", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async updateReport(id, data) {
    const res = await request(`/reports/${id}`, {
      method: "PUT",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async deleteReport(id) {
    const res = await request(`/reports/${id}`, {
      method: "DELETE"
    });
    return res.data;
  },
  // Geocoding Proxy Routes
  async searchGeocode(q) {
    const res = await request(`/geocode?q=${encodeURIComponent(q)}`);
    return res.data;
  },
  async reverseGeocode(lat, lon) {
    const res = await request(
      `/geocode/reverse?lat=${lat}&lon=${lon}`
    );
    return res.data.address;
  },
  // Admin Routes
  async getAdminIssues(params = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set("status", params.status);
    if (params.category_id) query.set("category_id", params.category_id);
    if (params.search) query.set("search", params.search);
    if (params.page) query.set("page", params.page.toString());
    if (params.limit) query.set("limit", params.limit.toString());
    const qs = query.toString() ? `?${query.toString()}` : "";
    return request(`/admin/issues${qs}`);
  },
  async updateAdminStatus(id, status, note) {
    const res = await request(`/admin/issues/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, note })
    });
    return res.data;
  },
  async updateAdminPriority(id, priority) {
    const res = await request(`/admin/issues/${id}/priority`, {
      method: "PATCH",
      body: JSON.stringify({ priority })
    });
    return res.data;
  },
  async assignAdminIssue(id, assignee_id) {
    const res = await request(`/admin/issues/${id}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignee_id })
    });
    return res.data;
  },
  async getAdminUsers(page = 1, limit = 20) {
    return request(`/admin/users?page=${page}&limit=${limit}`);
  },
  async updateAdminUser(id, data) {
    const res = await request(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async createAdminCategory(data) {
    const res = await request("/admin/categories", {
      method: "POST",
      body: JSON.stringify(data)
    });
    return res.data;
  },
  async updateAdminCategory(id, data) {
    const res = await request(`/admin/categories/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data)
    });
    return res.data;
  }
};
export {
  ApiRequestError,
  api,
  registerAuthTokenProvider
};
