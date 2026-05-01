const express = require('express');
const router = express.Router();
const { getStageList, findClosestStage } = require('../services/stages');

// GET /api/stages
router.get('/', (_req, res) => {
  res.json(getStageList());
});

// GET /api/stages/nearest?lat=&lng=
router.get('/nearest', (req, res) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat e lng obbligatori e numerici' });
  }
  const result = findClosestStage(lat, lng);
  res.json(result); // { stage_id, stage_ref, distance_m }
});

module.exports = router;
