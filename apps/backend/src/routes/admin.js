const express = require('express');
const crypto = require('crypto');
const router = express.Router();
const { getDb } = require('../db/index');
const { requireAdmin, signSessionToken } = require('../middleware/auth');
const { deleteImageFiles } = require('../services/storage');

// POST /api/admin/login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;

  if (!envUser || !envPass) {
    return res.status(503).json({ error: 'Admin credentials not configured' });
  }

  let valid = true;
  try {
    const uMatch = username && username.length === envUser.length
      ? crypto.timingSafeEqual(Buffer.from(username), Buffer.from(envUser))
      : false;
    const pMatch = password && password.length === envPass.length
      ? crypto.timingSafeEqual(Buffer.from(password), Buffer.from(envPass))
      : false;
    if (!uMatch || !pMatch) valid = false;
  } catch { valid = false; }

  if (!valid) return res.status(401).json({ error: 'Credenziali non valide' });

  const { token, expiresAt } = signSessionToken(username);
  res.json({ token, expiresAt });
});

// GET /api/admin/me
router.get('/me', requireAdmin, (req, res) => {
  const header = req.headers.authorization || '';
  const raw = header.startsWith('Bearer ') ? header.slice(7) : '';
  const dot = raw.lastIndexOf('.');
  let expiresAt = null;
  if (dot > 0) {
    try {
      const parsed = JSON.parse(Buffer.from(raw.slice(0, dot), 'base64url').toString());
      if (parsed.exp) expiresAt = new Date(parsed.exp).toISOString();
    } catch { /* static token — no expiry */ }
  }
  res.json({ username: req.adminUser || 'admin', expiresAt });
});

// GET /api/admin/stats
router.get('/stats', requireAdmin, (req, res) => {
  const db = getDb();

  const total_uploaded = db.prepare('SELECT COUNT(*) AS n FROM images').get().n;
  const total_published = db.prepare("SELECT COUNT(*) AS n FROM images WHERE status='published'").get().n;
  const total_pending = db.prepare("SELECT COUNT(*) AS n FROM images WHERE status='pending_verification'").get().n;

  const by_stage = db
    .prepare("SELECT stage_ref, COUNT(*) AS count FROM images WHERE status='published' AND stage_ref IS NOT NULL GROUP BY stage_ref ORDER BY stage_ref")
    .all();

  const by_region = db
    .prepare("SELECT regione, COUNT(*) AS count FROM images WHERE status='published' AND regione IS NOT NULL GROUP BY regione ORDER BY count DESC")
    .all();

  res.json({ total_uploaded, total_published, total_pending, by_stage, by_region });
});

// GET /api/admin/users
router.get('/users', requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      LOWER(i.email) AS email,
      (SELECT i2.autore_nome FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS autore_nome,
      COUNT(*) AS photo_count,
      CASE WHEN EXISTS(SELECT 1 FROM verified_emails ve WHERE ve.email = LOWER(i.email)) THEN 1 ELSE 0 END AS verified,
      MIN(i.created_at) AS first_upload_at,
      MAX(i.created_at) AS last_upload_at
    FROM images i
    WHERE i.email <> ''
    GROUP BY LOWER(i.email)
    ORDER BY last_upload_at DESC
  `).all();
  res.json(rows.map((r) => ({ ...r, verified: r.verified === 1 })));
});

// GET /api/admin/images?status=&page=&q=
router.get('/images', requireAdmin, (req, res) => {
  const db = getDb();
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const { status, q } = req.query;

  const conditions = [];
  const params = [];

  if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    conditions.push('(titolo LIKE ? OR autore_nome LIKE ? OR email LIKE ?)');
    params.push(like, like, like);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM images ${where}`).get(...params).n;
  const rows = db.prepare(`
    SELECT id, status, thumbnail_path, titolo, autore_nome, email,
           stage_ref, regione, created_at, stage_distance_m
    FROM images ${where}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
  `).all(...params, PAGE_SIZE, offset);

  const items = rows.map((img) => ({
    ...img,
    thumb_url: img.thumbnail_path ? `/storage/${img.thumbnail_path}` : null,
  }));

  res.json({ items, total, page, page_size: PAGE_SIZE });
});

// DELETE /api/admin/images/:id
router.delete('/images/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });

  deleteImageFiles(img.stage_ref, img.id);
  db.prepare('DELETE FROM images WHERE id = ?').run(img.id);

  res.status(204).end();
});

module.exports = router;
