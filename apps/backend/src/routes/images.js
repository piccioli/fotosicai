const express = require('express');
const router = express.Router();
const { getDb } = require('../db/index');

function withUrls(img) {
  return {
    ...img,
    thumb_url: `/storage/${img.thumbnail_path}`,
    medium_url: `/storage/${img.medium_path}`,
    original_url: `/storage/${img.file_path}`,
  };
}

const PUBLIC_WHERE = "status='published' AND validated_at IS NOT NULL";

/** Mappa / lista pubblica: evita risposte enormi ma consente archivi grandi (override con ?limit=). */
const DEFAULT_LIMIT = Number(process.env.PUBLIC_MAP_IMAGE_DEFAULT_LIMIT) || 25000;
const MAX_LIMIT = Number(process.env.PUBLIC_MAP_IMAGE_MAX_LIMIT) || 100000;

// GET /api/images?bbox=W,S,E,N&limit=
router.get('/', (req, res) => {
  const db = getDb();
  const requested = Number(req.query.limit);
  const limit = Math.min(
    Math.max(1, Number.isFinite(requested) && requested > 0 ? requested : DEFAULT_LIMIT),
    MAX_LIMIT
  );

  if (req.query.bbox) {
    const parts = req.query.bbox.split(',').map(Number);
    if (parts.length !== 4 || parts.some(isNaN)) {
      return res.status(400).json({ error: 'bbox deve essere W,S,E,N' });
    }
    const [W, S, E, N] = parts;
    const rows = db.prepare(
      `SELECT id, lat, lng, thumbnail_path, medium_path, file_path, titolo, stage_ref, data_scatto
       FROM images WHERE ${PUBLIC_WHERE} AND lat BETWEEN ? AND ? AND lng BETWEEN ? AND ?
       LIMIT ?`
    ).all(S, N, W, E, limit);
    return res.json(rows.map(withUrls));
  }

  // Without bbox: return latest N
  const rows = db.prepare(
    `SELECT id, lat, lng, thumbnail_path, medium_path, file_path, titolo, stage_ref, data_scatto
     FROM images WHERE ${PUBLIC_WHERE} ORDER BY created_at DESC LIMIT ?`
  ).all(limit);
  res.json(rows.map(withUrls));
});

// GET /api/images/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const img = db.prepare(`SELECT * FROM images WHERE id = ? AND ${PUBLIC_WHERE}`).get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });
  res.json(withUrls(img));
});

module.exports = router;
