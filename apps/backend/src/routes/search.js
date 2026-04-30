const express = require('express');
const router = express.Router();
const { getDb } = require('../db/index');

const PAGE_SIZE = 24;

// GET /api/search/facets — distinct values for filter dropdowns
router.get('/facets', (req, res) => {
  const db = getDb();
  const regioni = db.prepare(`SELECT DISTINCT regione FROM images WHERE status='published' AND regione IS NOT NULL ORDER BY regione`).all().map((r) => r.regione);
  const province = db.prepare(`SELECT DISTINCT provincia FROM images WHERE status='published' AND provincia IS NOT NULL ORDER BY provincia`).all().map((r) => r.provincia);
  const comuni = db.prepare(`SELECT DISTINCT comune FROM images WHERE status='published' AND comune IS NOT NULL ORDER BY comune`).all().map((r) => r.comune);
  res.json({ regioni, province, comuni });
});

// GET /api/search?q=&regione=&provincia=&comune=&stage_ref=&page=1
router.get('/', (req, res) => {
  const db = getDb();
  const { q, regione, provincia, comune, stage_ref } = req.query;
  const page = Math.max(1, Number(req.query.page) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  // Collect filter conditions and params separately from FTS
  const conditions = [`i.status = 'published'`];
  const filterParams = [];

  // Full-text search: get matching rowids, inject as integer list (safe — all from DB)
  if (q && q.trim()) {
    try {
      const term = q.trim().replace(/['"*^()]/g, ' ').trim();
      if (!term) return res.json({ items: [], total: 0, page, page_size: PAGE_SIZE });
      const ftsRows = db.prepare(
        `SELECT rowid FROM images_fts WHERE images_fts MATCH ? ORDER BY rank LIMIT 2000`
      ).all(`${term}*`);
      if (ftsRows.length === 0) return res.json({ items: [], total: 0, page, page_size: PAGE_SIZE });
      // Safe to interpolate — rowids are integers straight from our own DB
      const rowidList = ftsRows.map((r) => Number(r.rowid)).join(',');
      conditions.push(`i.rowid IN (${rowidList})`);
    } catch (e) {
      console.warn('[search] FTS error:', e.message);
    }
  }

  if (regione) { conditions.push(`i.regione = ?`); filterParams.push(regione); }
  if (provincia) { conditions.push(`i.provincia = ?`); filterParams.push(provincia); }
  if (comune) { conditions.push(`i.comune = ?`); filterParams.push(comune); }
  if (stage_ref) { conditions.push(`i.stage_ref = ?`); filterParams.push(stage_ref); }

  const where = `WHERE ${conditions.join(' AND ')}`;

  const total = db.prepare(`SELECT COUNT(*) as n FROM images i ${where}`).get(...filterParams).n;

  const rows = db.prepare(
    `SELECT i.id, i.lat, i.lng, i.thumbnail_path, i.medium_path, i.file_path,
            i.titolo, i.caption, i.autore_nome, i.stage_ref, i.regione, i.provincia, i.comune, i.data_scatto
     FROM images i ${where} ORDER BY i.created_at DESC LIMIT ? OFFSET ?`
  ).all(...filterParams, PAGE_SIZE, offset);

  const items = rows.map((img) => ({
    ...img,
    thumb_url: `/storage/${img.thumbnail_path}`,
    medium_url: `/storage/${img.medium_path}`,
  }));

  res.json({ items, total, page, page_size: PAGE_SIZE });
});

module.exports = router;
