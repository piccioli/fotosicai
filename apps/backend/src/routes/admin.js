const express = require('express');
const router = express.Router();
const { getDb } = require('../db/index');
const { requireAdmin } = require('../middleware/auth');
const { deleteImageFiles } = require('../services/storage');

// DELETE /api/admin/images/:id
router.delete('/images/:id', requireAdmin, (req, res) => {
  const db = getDb();
  const img = db.prepare('SELECT * FROM images WHERE id = ?').get(req.params.id);
  if (!img) return res.status(404).json({ error: 'Immagine non trovata' });

  // Delete files
  deleteImageFiles(img.stage_ref, img.id);

  // Delete from DB
  db.prepare('DELETE FROM images WHERE id = ?').run(img.id);

  res.status(204).end();
});

module.exports = router;
