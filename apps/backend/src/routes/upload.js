const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const upload = require('../middleware/upload');
const { getDb } = require('../db/index');
const { parseExif } = require('../services/exif');
const { processImage } = require('../services/images');
const { reverseGeocode } = require('../services/nominatim');
const { findClosestStage } = require('../services/stages');
const { generateTitleCaption } = require('../services/ai');
const { deleteImageFiles } = require('../services/storage');

// POST /api/upload — receive file, extract metadata, save as draft
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File mancante' });

    const { autore_nome } = req.body;
    if (!autore_nome || !autore_nome.trim()) {
      return res.status(400).json({ error: 'autore_nome è obbligatorio' });
    }

    const id = uuidv4();
    const buffer = req.file.buffer;

    // EXIF
    const { gps: exifGps, datetime: exifDatetime } = await parseExif(buffer);

    // Determine position: prefer EXIF GPS, fallback to body lat/lng
    let lat = exifGps?.lat ?? null;
    let lng = exifGps?.lng ?? null;
    let positionSource = exifGps ? 'exif' : 'manual';

    const bodyLat = req.body.lat != null ? Number(req.body.lat) : null;
    const bodyLng = req.body.lng != null ? Number(req.body.lng) : null;
    if (bodyLat != null && bodyLng != null && !isNaN(bodyLat) && !isNaN(bodyLng)) {
      lat = bodyLat;
      lng = bodyLng;
      positionSource = exifGps ? 'exif' : 'manual';
    }

    // If no position at all, save draft without geo data — frontend must provide
    const hasPosition = lat != null && lng != null;

    // Stage matching (only if we have coordinates)
    let stageInfo = { stage_id: null, stage_ref: null, distance_m: null };
    let geoInfo = { paese: null, regione: null, provincia: null, comune: null };
    if (hasPosition) {
      [stageInfo, geoInfo] = await Promise.all([
        Promise.resolve(findClosestStage(lat, lng)),
        reverseGeocode(lat, lng).catch(() => ({})),
      ]);
    }

    // Process images (original + medium + thumb)
    const { paths, width, height } = await processImage(buffer, stageInfo.stage_ref, id);

    const db = getDb();
    db.prepare(
      `INSERT INTO images (id, status, file_path, thumbnail_path, medium_path, width, height,
        lat, lng, position_source, paese, regione, provincia, comune,
        stage_id, stage_ref, stage_distance_m, data_scatto,
        titolo, caption, ai_generated, autore_nome, consenso, consenso_version, consenso_accepted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, 'draft', paths.original, paths.thumbnail, paths.medium, width, height,
      lat ?? 0, lng ?? 0, positionSource,
      geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
      stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
      exifDatetime ?? null,
      '', '', 1, autore_nome.trim(), 0, '', ''
    );

    res.json({
      id,
      exif: { gps: exifGps, datetime: exifDatetime },
      suggested: {
        lat,
        lng,
        source: positionSource,
        ...geoInfo,
        stage: stageInfo,
      },
      paths: {
        thumb_url: `/storage/${paths.thumbnail}`,
        medium_url: `/storage/${paths.medium}`,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/upload/:id/ai — generate title and caption via Claude
router.post('/:id/ai', async (req, res, next) => {
  try {
    const db = getDb();
    const img = db.prepare('SELECT * FROM images WHERE id = ? AND status = ?').get(req.params.id, 'draft');
    if (!img) return res.status(404).json({ error: 'Draft non trovato' });

    const { titolo, caption } = await generateTitleCaption(img.medium_path, {
      comune: img.comune,
      regione: img.regione,
      provincia: img.provincia,
      stage_ref: img.stage_ref,
      data_scatto: img.data_scatto,
    });

    // Save AI suggestions to draft
    db.prepare('UPDATE images SET titolo = ?, caption = ?, ai_generated = 1 WHERE id = ?').run(titolo, caption, img.id);

    res.json({ titolo, caption });
  } catch (err) {
    // If AI fails, return error but don't break the flow — frontend shows manual fallback
    console.error('[ai]', err.message);
    res.status(502).json({ error: 'Generazione AI fallita', detail: err.message });
  }
});

// POST /api/upload/:id/finalize — publish the image
router.post('/:id/finalize', async (req, res, next) => {
  try {
    const { titolo, caption, autore_nome, lat, lng, consenso_version, consenso_accepted } = req.body;

    if (!consenso_accepted) return res.status(400).json({ error: 'Consenso obbligatorio' });
    if (!titolo || !titolo.trim()) return res.status(400).json({ error: 'Titolo obbligatorio' });
    if (!autore_nome || !autore_nome.trim()) return res.status(400).json({ error: 'autore_nome obbligatorio' });

    const db = getDb();
    const img = db.prepare('SELECT * FROM images WHERE id = ? AND status = ?').get(req.params.id, 'draft');
    if (!img) return res.status(404).json({ error: 'Draft non trovato' });

    // Allow position update at finalize (user might have adjusted on map)
    let finalLat = img.lat;
    let finalLng = img.lng;
    let stageInfo = { stage_id: img.stage_id, stage_ref: img.stage_ref, distance_m: img.stage_distance_m };
    let geoInfo = { paese: img.paese, regione: img.regione, provincia: img.provincia, comune: img.comune };

    if (lat != null && lng != null && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
      finalLat = Number(lat);
      finalLng = Number(lng);
      [stageInfo, geoInfo] = await Promise.all([
        Promise.resolve(findClosestStage(finalLat, finalLng)),
        reverseGeocode(finalLat, finalLng).catch(() => ({})),
      ]);
    }

    const now = new Date().toISOString();
    db.prepare(
      `UPDATE images SET
        status = 'published',
        titolo = ?, caption = ?,
        autore_nome = ?,
        lat = ?, lng = ?,
        paese = ?, regione = ?, provincia = ?, comune = ?,
        stage_id = ?, stage_ref = ?, stage_distance_m = ?,
        ai_generated = ?,
        consenso = 1, consenso_version = ?, consenso_accepted_at = ?
       WHERE id = ?`
    ).run(
      titolo.trim().slice(0, 60),
      (caption || '').trim().slice(0, 280),
      autore_nome.trim(),
      finalLat, finalLng,
      geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
      stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
      req.body.ai_generated === false ? 0 : 1,
      consenso_version || process.env.CONSENT_VERSION || '',
      now,
      img.id
    );

    const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    res.json({
      id: img.id,
      status: 'published',
      url: `${PUBLIC_BASE}/?photo=${img.id}`,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
