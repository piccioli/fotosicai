const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const CONSENT_PATH = process.env.CONSENT_PATH || path.join(__dirname, '../../../../legal/consenso.md');

// GET /api/legal/consent
router.get('/consent', (_req, res) => {
  try {
    const markdown = fs.readFileSync(CONSENT_PATH, 'utf8');
    res.json({
      version: process.env.CONSENT_VERSION || '2026-04-30',
      markdown,
    });
  } catch {
    res.status(503).json({ error: 'Documento di consenso non disponibile' });
  }
});

module.exports = router;
