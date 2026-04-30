const express = require('express');
const router = express.Router();
const { getStageList } = require('../services/stages');

// GET /api/stages
router.get('/', (_req, res) => {
  res.json(getStageList());
});

module.exports = router;
