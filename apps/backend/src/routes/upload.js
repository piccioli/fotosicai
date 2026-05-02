const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const upload = require('../middleware/upload');
const { getDb } = require('../db/index');
const { parseExif } = require('../services/exif');
const { processImage } = require('../services/images');
const { reverseGeocode } = require('../services/nominatim');
const { findClosestStage } = require('../services/stages');
const { generateTitleCaption } = require('../services/ai');
const { deleteImageFiles } = require('../services/storage');
const { sendVerificationEmail } = require('../services/mailer');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/upload — receive file, extract metadata, save as draft
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'File mancante' });

    const { autore_nome } = req.body;
    if (!autore_nome || !autore_nome.trim()) {
      return res.status(400).json({ error: 'autore_nome è obbligatorio' });
    }

    const email = (req.body.email || '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'email è obbligatoria e deve essere valida' });
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
        titolo, caption, ai_generated, autore_nome, email, consenso, consenso_version, consenso_accepted_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).run(
      id, 'draft', paths.original, paths.thumbnail, paths.medium, width, height,
      lat ?? 0, lng ?? 0, positionSource,
      geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
      stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
      exifDatetime ?? null,
      '', '', 1, autore_nome.trim(), email, 0, '', ''
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

// POST /api/upload/:id/finalize — pubblica la foto (con verifica email)
router.post('/:id/finalize', async (req, res, next) => {
  try {
    const { titolo, caption, autore_nome, lat, lng, consenso_version, consenso_accepted,
            socio_cai, sezione_cai, ruolo_cai, referente_sicai, referente_sicai_ambito } = req.body;

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
    const finalTitolo = titolo.trim().slice(0, 60);
    const finalCaption = (caption || '').trim().slice(0, 280);
    const finalAutore = autore_nome.trim();
    const consentVer = consenso_version || process.env.CONSENT_VERSION || '';
    const aiGenerated = req.body.ai_generated === false ? 0 : 1;

    const finalSocioCai = socio_cai ? 1 : 0;
    const finalSezioneCai = finalSocioCai ? (sezione_cai || '').trim().slice(0, 120) || null : null;
    const finalRuoloCai = (ruolo_cai || '').trim().slice(0, 100) || null;
    const finalReferenteSicai = referente_sicai ? 1 : 0;
    const finalReferenteSicaiAmbito = finalReferenteSicai ? (referente_sicai_ambito || '').trim().slice(0, 100) || null : null;

    const email = img.email;

    // Check trust cache: email verified within the trust window → publish directly
    const trustDays = parseInt(process.env.EMAIL_VERIFICATION_TRUST_DAYS || '30', 10);
    const trusted = db
      .prepare("SELECT email FROM verified_emails WHERE email = ? AND verified_at >= datetime('now', ?)")
      .get(email, `-${trustDays} days`);

    if (trusted) {
      db.prepare(
        `UPDATE images SET
          status = 'published',
          verified_at = ?,
          validated_at = NULL,
          validated_by = NULL,
          titolo = ?, caption = ?,
          autore_nome = ?,
          lat = ?, lng = ?,
          paese = ?, regione = ?, provincia = ?, comune = ?,
          stage_id = ?, stage_ref = ?, stage_distance_m = ?,
          ai_generated = ?,
          socio_cai = ?, sezione_cai = ?, ruolo_cai = ?,
          referente_sicai = ?, referente_sicai_ambito = ?,
          consenso = 1, consenso_version = ?, consenso_accepted_at = ?
         WHERE id = ?`
      ).run(
        now, finalTitolo, finalCaption, finalAutore,
        finalLat, finalLng,
        geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
        stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
        aiGenerated,
        finalSocioCai, finalSezioneCai, finalRuoloCai,
        finalReferenteSicai, finalReferenteSicaiAmbito,
        consentVer, now, img.id
      );

      const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
      return res.json({
        published: true,
        id: img.id,
        url: `${PUBLIC_BASE}/?photo=${img.id}&verified=1`,
      });
    }

    // No trust cache hit — check if a pending_verification already exists for this email
    const alreadyPending = db
      .prepare("SELECT COUNT(*) AS n FROM images WHERE LOWER(email) = LOWER(?) AND status = 'pending_verification'")
      .get(email).n;

    if (alreadyPending > 0) {
      // Another photo is already waiting for email verification: save this one too but skip the email.
      const leadSentAtRow = db.prepare(`
        SELECT verification_sent_at AS sent_at
        FROM images
        WHERE LOWER(email) = LOWER(?) AND status = 'pending_verification'
        ORDER BY CASE WHEN verification_token IS NOT NULL THEN 0 ELSE 1 END,
                 datetime(verification_sent_at) ASC,
                 datetime(created_at) ASC
        LIMIT 1
      `).get(email);
      const sentAtForQueue = leadSentAtRow?.sent_at || now;

      db.prepare(
        `UPDATE images SET
          status = 'pending_verification',
          verification_token = NULL, verification_sent_at = ?,
          titolo = ?, caption = ?,
          autore_nome = ?,
          lat = ?, lng = ?,
          paese = ?, regione = ?, provincia = ?, comune = ?,
          stage_id = ?, stage_ref = ?, stage_distance_m = ?,
          ai_generated = ?,
          socio_cai = ?, sezione_cai = ?, ruolo_cai = ?,
          referente_sicai = ?, referente_sicai_ambito = ?,
          consenso = 1, consenso_version = ?, consenso_accepted_at = ?
         WHERE id = ?`
      ).run(
        sentAtForQueue,
        finalTitolo, finalCaption, finalAutore,
        finalLat, finalLng,
        geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
        stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
        aiGenerated,
        finalSocioCai, finalSezioneCai, finalRuoloCai,
        finalReferenteSicai, finalReferenteSicaiAmbito,
        consentVer, now, img.id
      );
      return res.json({ pending: true, id: img.id, email, email_sent: false });
    }

    // First pending photo for this email — create token and send verification email
    const token = crypto.randomBytes(32).toString('hex');

    db.prepare(
      `UPDATE images SET
        status = 'pending_verification',
        verification_token = ?, verification_sent_at = ?,
        titolo = ?, caption = ?,
        autore_nome = ?,
        lat = ?, lng = ?,
        paese = ?, regione = ?, provincia = ?, comune = ?,
        stage_id = ?, stage_ref = ?, stage_distance_m = ?,
        ai_generated = ?,
        socio_cai = ?, sezione_cai = ?, ruolo_cai = ?,
        referente_sicai = ?, referente_sicai_ambito = ?,
        consenso = 1, consenso_version = ?, consenso_accepted_at = ?
       WHERE id = ?`
    ).run(
      token, now,
      finalTitolo, finalCaption, finalAutore,
      finalLat, finalLng,
      geoInfo.paese ?? null, geoInfo.regione ?? null, geoInfo.provincia ?? null, geoInfo.comune ?? null,
      stageInfo.stage_id, stageInfo.stage_ref, stageInfo.distance_m,
      aiGenerated,
      finalSocioCai, finalSezioneCai, finalRuoloCai,
      finalReferenteSicai, finalReferenteSicaiAmbito,
      consentVer, now, img.id
    );

    try {
      await sendVerificationEmail({ to: email, token });
    } catch (mailErr) {
      // Keep data coherent: if the email cannot be sent, avoid leaving the photo stuck in pending state.
      db.prepare(
        `UPDATE images SET
          status = 'draft',
          verification_token = NULL,
          verification_sent_at = NULL
         WHERE id = ?`
      ).run(img.id);

      const smtpRaw = (mailErr && mailErr.message) ? String(mailErr.message) : '';
      const smtpMsg = smtpRaw.toLowerCase();
      let userMessage = 'Invio email di conferma non riuscito. Riprova tra qualche minuto.';
      if (smtpMsg.includes('timed out') || smtpMsg.includes('timeout') || smtpMsg.includes('etimedout')) {
        userMessage = 'Timeout durante l\'invio dell\'email di conferma. Riprova tra qualche minuto.';
      } else if (smtpMsg.includes('auth') || smtpMsg.includes('535') || smtpMsg.includes('eauth')) {
        userMessage = 'Errore di autenticazione SMTP durante l\'invio dell\'email di conferma.';
      } else if (smtpMsg.includes('enotfound') || smtpMsg.includes('eai_again')) {
        userMessage = 'Server SMTP non raggiungibile al momento. Riprova tra qualche minuto.';
      }

      const err = new Error(userMessage);
      err.status = 502;
      err.cause = mailErr;
      return next(err);
    }

    res.json({ pending: true, id: img.id, email, email_sent: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
