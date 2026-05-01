const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

function createApp() {
  const STORAGE_DIR = process.env.STORAGE_DIR || './storage';
  fs.mkdirSync(path.resolve(STORAGE_DIR), { recursive: true });

  const app = express();
  if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
  app.use(cors());
  app.use(express.json());

  app.use('/storage', express.static(path.resolve(STORAGE_DIR)));
  app.use('/DATA', express.static(path.join(__dirname, '../../../DATA')));

  app.use('/api/upload', require('./routes/upload'));
  app.use('/api/verify', require('./routes/verify'));
  app.use('/api/images', require('./routes/images'));
  app.use('/api/search', require('./routes/search'));
  app.use('/api/stages', require('./routes/stages'));
  app.use('/api/legal', require('./routes/legal'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/geocode', require('./routes/geocode'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };
