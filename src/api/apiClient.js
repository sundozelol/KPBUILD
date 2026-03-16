/**
 * apiClient — drop-in replacement for @base44/sdk
 * Provides the same interface: apiClient.entities.*, apiClient.functions.invoke(), etc.
 * All requests go to the local backend at /api/*
 */

const API_BASE = '/api';

// ── Token management ──────────────────────────────────────────────────────────

function getToken() {
  return localStorage.getItem('kp_auth_token');
}

function setToken(token) {
  localStorage.setItem('kp_auth_token', token);
}

function clearToken() {
  localStorage.removeItem('kp_auth_token');
}

// ── Base fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    window.location.href = '/login';
    throw new Error('Сессия истекла. Войдите снова.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  // Handle PDF/binary responses
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/pdf') || ct.includes('octet-stream')) {
    return res.blob();
  }

  return res.json();
}

// ── Entity factory ────────────────────────────────────────────────────────────
// Mirrors base44.entities.EntityName.list/create/update/delete/get/filter

function createEntity(endpoint) {
  return {
    /** list(sortParam, limit) → array */
    async list(sort, limit) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit) params.set('limit', String(limit));
      const q = params.toString();
      return apiFetch(`/${endpoint}${q ? '?' + q : ''}`);
    },

    /** get(id) → object */
    async get(id) {
      return apiFetch(`/${endpoint}/${id}`);
    },

    /** create(data) → object */
    async create(data) {
      return apiFetch(`/${endpoint}`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    /** update(id, data) → object */
    async update(id, data) {
      return apiFetch(`/${endpoint}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },

    /** delete(id) → { ok: true } */
    async delete(id) {
      return apiFetch(`/${endpoint}/${id}`, { method: 'DELETE' });
    },

    /**
     * filter(filters, sort, limit, offset) → array
     * filters: { field: value, ... }
     */
    async filter(filters = {}, sort, limit, offset) {
      const params = new URLSearchParams();
      if (sort) params.set('sort', sort);
      if (limit != null) params.set('limit', String(limit));
      if (offset != null) params.set('offset', String(offset));
      if (filters && typeof filters === 'object') {
        params.set('filters', JSON.stringify(filters));
      }
      return apiFetch(`/${endpoint}?${params.toString()}`);
    },

    /** bulkCreate(items) → { created: number } */
    async bulkCreate(items) {
      return apiFetch(`/${endpoint}/bulk`, {
        method: 'POST',
        body: JSON.stringify({ products: items }),
      });
    },
  };
}

// ── Auth ──────────────────────────────────────────────────────────────────────

const auth = {
  async login(email, password) {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setToken(data.token);
    return data;
  },

  async register(email, password, name, inviteCode) {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, inviteCode }),
    });
    setToken(data.token);
    return data;
  },

  async me() {
    return apiFetch('/auth/me');
  },

  async changePassword(currentPassword, newPassword) {
    return apiFetch('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  async updateMe(data) {
    return apiFetch('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  logout() {
    clearToken();
    window.location.href = '/login';
  },
};

// ── File upload (mirrors base44.integrations.Core.UploadFile) ─────────────────

const integrations = {
  Core: {
    async UploadFile({ file }) {
      const formData = new FormData();
      formData.append('file', file);

      const token = getToken();
      const res = await fetch(`${API_BASE}/upload/image`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ошибка загрузки файла');
      }

      return res.json(); // { file_url, filename }
    },
  },
};

// ── Functions (mirrors base44.functions.invoke) ───────────────────────────────

const functions = {
  async invoke(name, params = {}) {
    if (name === 'importXmlFeed') {
      const data = await apiFetch('/xml-feeds/import', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return { data };
    }
    if (name === 'enableFeedSync') {
      const data = await apiFetch(`/xml-feeds/${params.feedId}/enable-sync`, { method: 'POST' });
      return { data };
    }
    if (name === 'syncXmlPrices') {
      const data = await apiFetch('/xml-feeds/sync-prices', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      return { data };
    }
    throw new Error(`Unknown function: ${name}`);
  },
};

// ── PDF Export ────────────────────────────────────────────────────────────────

async function exportToPdf(html, styles, title, format = 'A4') {
  const token = getToken();
  const res = await fetch(`${API_BASE}/export/pdf`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ html, styles, title, format }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Ошибка генерации PDF');
  }

  return res.blob();
}

// ── Upload from URL ───────────────────────────────────────────────────────────

async function uploadFromUrl(url) {
  return apiFetch('/upload/from-url', {
    method: 'POST',
    body: JSON.stringify({ url }),
  });
}

// ── Main export (mimics base44 shape) ────────────────────────────────────────

// ── Users management (admin only) ─────────────────────────────────────────────

const users = {
  async list() { return apiFetch('/users'); },
  async create(data) { return apiFetch('/users', { method: 'POST', body: JSON.stringify(data) }); },
  async update(id, data) { return apiFetch(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); },
  async delete(id) { return apiFetch(`/users/${id}`, { method: 'DELETE' }); },
};

const invites = {
  async list() { return apiFetch('/invites'); },
  async create(data) { return apiFetch('/invites', { method: 'POST', body: JSON.stringify(data) }); },
  async delete(id) { return apiFetch(`/invites/${id}`, { method: 'DELETE' }); },
};

const settings = {
  async getSync() { return apiFetch('/settings/sync'); },
  async updateSync(data) { return apiFetch('/settings/sync', { method: 'PATCH', body: JSON.stringify(data) }); },
  async getSyncLogs() { return apiFetch('/settings/sync-logs'); },
};

const publicApi = {
  async getProposal(token) { return apiFetch(`/public/${token}`); },

  async logView(token) {
    const res = await fetch(`${API_BASE}/public/${token}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }).catch(() => null);
    if (!res?.ok) return null;
    return res.json().catch(() => null);
  },

  async logViewEnd(token, viewId, durationSeconds, pageStats) {
    return fetch(`${API_BASE}/public/${token}/view-end`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ view_id: viewId, duration_seconds: durationSeconds, page_stats: pageStats }),
    }).catch(() => {});
  },

  async downloadPdf(token, html, styles, title) {
    const res = await fetch(`${API_BASE}/public/${token}/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, styles, title }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Ошибка генерации PDF');
    }
    return res.blob();
  },
};

const share = {
  async enable(id) { return apiFetch(`/proposals/${id}/share`, { method: 'POST' }); },
  async disable(id) { return apiFetch(`/proposals/${id}/share`, { method: 'DELETE' }); },
  async getViews(id) { return apiFetch(`/proposals/${id}/views`); },
};

export const apiClient = {
  entities: {
    Proposal: createEntity('proposals'),
    Product: createEntity('products'),
    CompanyProfile: createEntity('company-profile'),
    XmlFeed: createEntity('xml-feeds'),
    ProposalTemplate: createEntity('proposal-templates'),
  },
  auth,
  users,
  invites,
  settings,
  integrations,
  functions,
  exportToPdf,
  uploadFromUrl,
  getToken,
  setToken,
  clearToken,
  publicApi,
  share,
};

// Named alias used across all files as "base44"
export { apiClient as base44 };

export default apiClient;
