const BASE = '/api';

async function request(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  // Images
  getImages: (bbox) => request(`/images${bbox ? `?bbox=${bbox}` : ''}`),
  getImage: (id) => request(`/images/${id}`),

  // Upload flow
  upload: (formData) =>
    request('/upload', { method: 'POST', body: formData }),
  generateAI: (id) =>
    request(`/upload/${id}/ai`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }),
  finalize: (id, body) =>
    request(`/upload/${id}/finalize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),

  // Search
  search: (params) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null && v !== ''))
    );
    return request(`/search?${qs}`);
  },
  getFacets: () => request('/search/facets'),

  // Stages
  getStages: () => request('/stages'),

  // Consent
  getConsent: () => request('/legal/consent'),
};

/* ── Admin API ─────────────────────────────────────────────────────────── */

function adminRequest(path, opts = {}) {
  const token = localStorage.getItem('fotosicai_admin_token') || '';
  const headers = { ...opts.headers, Authorization: `Bearer ${token}` };
  return request(`/admin${path}`, { ...opts, headers }).catch((err) => {
    if (err.message === 'HTTP 401') {
      localStorage.removeItem('fotosicai_admin_token');
      window.location.replace('/admin/login');
    }
    throw err;
  });
}

export const adminApi = {
  login: (username, password) =>
    request('/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),

  me: () => adminRequest('/me'),

  stats: () => adminRequest('/stats'),

  users: () => adminRequest('/users'),

  images: ({ status, q, page } = {}) => {
    const qs = new URLSearchParams();
    if (status && status !== 'all') qs.set('status', status);
    if (q) qs.set('q', q);
    if (page && page > 1) qs.set('page', String(page));
    const suffix = qs.toString() ? `?${qs}` : '';
    return adminRequest(`/images${suffix}`);
  },

  deleteImage: (id) =>
    adminRequest(`/images/${id}`, { method: 'DELETE' }),
};
