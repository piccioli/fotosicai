const express = require('express');
const router = express.Router();
const { reverseGeocode } = require('../services/nominatim');

// GET /api/geocode?lat=&lng=
router.get('/', async (req, res, next) => {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({ error: 'lat e lng obbligatori e numerici' });
  }
  try {
    const result = await reverseGeocode(lat, lng);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
