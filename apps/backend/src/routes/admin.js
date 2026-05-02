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
  const total_pending_email = db.prepare("SELECT COUNT(*) AS n FROM images WHERE status='pending_verification'").get().n;
  const total_pending_validation = db.prepare("SELECT COUNT(*) AS n FROM images WHERE status='published' AND validated_at IS NULL").get().n;
  const total_published = db.prepare("SELECT COUNT(*) AS n FROM images WHERE status='published' AND validated_at IS NOT NULL").get().n;

  const by_stage = db
    .prepare("SELECT stage_ref, COUNT(*) AS count FROM images WHERE status='published' AND validated_at IS NOT NULL AND stage_ref IS NOT NULL GROUP BY stage_ref ORDER BY stage_ref")
    .all();

  const by_region = db
    .prepare("SELECT regione, COUNT(*) AS count FROM images WHERE status='published' AND validated_at IS NOT NULL AND regione IS NOT NULL GROUP BY regione ORDER BY count DESC")
    .all();

  res.json({ total_uploaded, total_pending_email, total_pending_validation, total_published, by_stage, by_region });
});

// GET /api/admin/users
router.get('/users', requireAdmin, (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT
      LOWER(i.email) AS email,
      (SELECT i2.autore_nome        FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS autore_nome,
      (SELECT i2.socio_cai          FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS socio_cai,
      (SELECT i2.sezione_cai        FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS sezione_cai,
      (SELECT i2.ruolo_cai          FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS ruolo_cai,
      (SELECT i2.referente_sicai    FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS referente_sicai,
      (SELECT i2.referente_sicai_ambito FROM images i2 WHERE LOWER(i2.email) = LOWER(i.email) ORDER BY i2.created_at DESC LIMIT 1) AS referente_sicai_ambito,
      MAX(i.marketing_consent) AS marketing_consent,
      COUNT(*) AS photo_count,
      CASE WHEN EXISTS(SELECT 1 FROM verified_emails ve WHERE ve.email = LOWER(i.email)) THEN 1 ELSE 0 END AS verified,
      MIN(i.created_at) AS first_upload_at,
      MAX(i.created_at) AS last_upload_at
    FROM images i
    WHERE i.email <> ''
    GROUP BY LOWER(i.email)
    ORDER BY last_upload_at DESC
  `).all();
  res.json(rows.map((r) => ({
    ...r,
    verified: r.verified === 1,
    socio_cai: r.socio_cai === 1,
    referente_sicai: r.referente_sicai === 1,
    marketing_consent: r.marketing_consent === 1,
  })));
});

// GET /api/admin/facets — valori distinti per i filtri (tutte le foto, non solo published)
router.get('/facets', requireAdmin, (req, res) => {
  const db = getDb();
  const stage_refs = db.prepare("SELECT DISTINCT stage_ref FROM images WHERE stage_ref IS NOT NULL ORDER BY stage_ref").all().map((r) => r.stage_ref);
  const regioni = db.prepare("SELECT DISTINCT regione FROM images WHERE regione IS NOT NULL ORDER BY regione").all().map((r) => r.regione);
  res.json({ stage_refs, regioni });
});

// GET /api/admin/images?status=&validated=&email=&q=&stage_ref=&regione=&page=
router.get('/images', requireAdmin, (req, res) => {
  const db = getDb();
  const PAGE_SIZE = 50;
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const { status, validated, q, email, stage_ref, regione } = req.query;

  const conditions = [];
  const params = [];

  if (status === 'pending_validation') {
    conditions.push("status = 'published' AND validated_at IS NULL");
  } else if (status && status !== 'all') {
    conditions.push('status = ?');
    params.push(status);
  }

  if (validated === 'true') { conditions.push('validated_at IS NOT NULL'); }
  else if (validated === 'false') { conditions.push('validated_at IS NULL'); }

  if (email && email.trim()) {
    conditions.push('email LIKE ?');
    params.push(`%${email.trim()}%`);
  }

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    conditions.push('(titolo LIKE ? OR autore_nome LIKE ?)');
    params.push(like, like);
  }

  if (stage_ref && stage_ref !== 'all') { conditions.push('stage_ref = ?'); params.push(stage_ref); }
  if (regione && regione !== 'all') { conditions.push('regione = ?'); params.push(regione); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) AS n FROM images ${where}`).get(...params).n;
  const rows = db.prepare(`
    SELECT id, status, thumbnail_path, titolo, autore_nome, email,
           stage_ref, regione, created_at, stage_distance_m,
           validated_at, validated_by
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

// GET /api/admin/images/:id
router.get('/images/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const img = db.prepare(`
    SELECT id, status, thumbnail_path, medium_path, file_path,
           titolo, caption, autore_nome, email,
           stage_ref, stage_distance_m, regione, provincia, comune,
           lat, lng, data_scatto, created_at,
           validated_at, validated_by
    FROM images WHERE id = ?
  `).get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });
  res.json({
    ...img,
    thumb_url:    img.thumbnail_path ? `/storage/${img.thumbnail_path}` : null,
    medium_url:   img.medium_path    ? `/storage/${img.medium_path}`    : null,
    original_url: img.file_path      ? `/storage/${img.file_path}`      : null,
  });
});

// POST /api/admin/images/:id/validate
router.post('/images/:id/validate', requireAdmin, (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT id, status, validated_at FROM images WHERE id = ?').get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });
  if (img.status !== 'published') {
    return res.status(409).json({ error: 'Solo foto con email verificata possono essere validate' });
  }
  if (img.validated_at) return res.json({ validated: true, validated_at: img.validated_at }); // idempotent

  const now = new Date().toISOString();
  const by = req.adminUser || 'admin';
  db.prepare('UPDATE images SET validated_at = ?, validated_by = ? WHERE id = ?').run(now, by, img.id);
  res.json({ validated: true, validated_at: now, validated_by: by });
});

// POST /api/admin/images/:id/invalidate
router.post('/images/:id/invalidate', requireAdmin, (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT id FROM images WHERE id = ?').get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });

  db.prepare('UPDATE images SET validated_at = NULL, validated_by = NULL WHERE id = ?').run(img.id);
  res.json({ validated: false });
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
