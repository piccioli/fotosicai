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

  users: ({ page } = {}) => {
    const qs = page && page > 1 ? `?page=${page}` : '';
    return adminRequest(`/users${qs}`);
  },

  exportUsers: async () => {
    const token = localStorage.getItem('fotosicai_admin_token') || '';
    const res = await fetch('/api/admin/users/export', { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) { localStorage.removeItem('fotosicai_admin_token'); window.location.replace('/admin/login'); return; }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const disposition = res.headers.get('Content-Disposition') || '';
    const match = disposition.match(/filename="([^"]+)"/);
    const filename = match ? match[1] : 'fotosicai-utenti.xlsx';
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  },

  facets: () => adminRequest('/facets'),

  images: ({ status, validated, q, email, stage_ref, regione, page } = {}) => {
    const qs = new URLSearchParams();
    if (status && status !== 'all') qs.set('status', status);
    if (validated && validated !== 'all') qs.set('validated', validated);
    if (q) qs.set('q', q);
    if (email) qs.set('email', email);
    if (stage_ref && stage_ref !== 'all') qs.set('stage_ref', stage_ref);
    if (regione && regione !== 'all') qs.set('regione', regione);
    if (page && page > 1) qs.set('page', String(page));
    const suffix = qs.toString() ? `?${qs}` : '';
    return adminRequest(`/images${suffix}`);
  },

  getImage: (id) => adminRequest(`/images/${id}`),

  deleteImage: (id) =>
    adminRequest(`/images/${id}`, { method: 'DELETE' }),

  validateImage: (id) =>
    adminRequest(`/images/${id}/validate`, { method: 'POST' }),

  invalidateImage: (id) =>
    adminRequest(`/images/${id}/invalidate`, { method: 'POST' }),
};
