const express = require('express');
const router = express.Router();
const { getDb } = require('../db/index');

// GET /api/verify/:token — verifica email e pubblica tutte le foto pending per quell'email
router.get('/:token', (req, res) => {
  const { token } = req.params;
  if (!token || token.length < 10) return res.status(400).send('Token non valido.');

  const db = getDb();
  const img = db
    .prepare("SELECT * FROM images WHERE verification_token = ? AND status = 'pending_verification'")
    .get(token);

  if (!img) return res.status(404).send('Link non valido o email già verificata.');

  const ttlHours = parseInt(process.env.EMAIL_VERIFICATION_TTL_HOURS || '24', 10);
  const sentAt = new Date(img.verification_sent_at);
  const expiresAt = new Date(sentAt.getTime() + ttlHours * 60 * 60 * 1000);
  if (Date.now() > expiresAt.getTime()) {
    return res.status(410).send('Il link di verifica è scaduto. Carica nuovamente la foto per ricevere un nuovo link.');
  }

  const now = new Date().toISOString();

  // Publish ALL pending_verification photos for this email in one shot
  db.prepare(
    "UPDATE images SET status = 'published', verified_at = ?, verification_token = NULL WHERE LOWER(email) = LOWER(?) AND status = 'pending_verification'"
  ).run(now, img.email);

  db.prepare(
    'INSERT INTO verified_emails (email, verified_at) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET verified_at = excluded.verified_at'
  ).run(img.email.toLowerCase(), now);

  const PUBLIC_BASE = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  res.redirect(302, `${PUBLIC_BASE}/?email_verified=1`);
});

module.exports = router;
