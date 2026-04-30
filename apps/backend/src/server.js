require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const { getDb } = require('./db/index');
const { loadStages } = require('./services/stages');

const app = express();
const PORT = process.env.PORT || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR || './storage';

// Ensure storage dir exists
fs.mkdirSync(path.resolve(STORAGE_DIR), { recursive: true });
fs.mkdirSync(path.resolve(process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : './data'), { recursive: true });

// Init DB and stages before accepting requests
getDb();
loadStages();

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve uploaded images as static files
app.use('/storage', express.static(path.resolve(STORAGE_DIR)));

// Serve DATA (GeoJSON etc.) — needed for dev proxy; in production nginx serves this directly
app.use('/DATA', express.static(path.join(__dirname, '../../../DATA')));

// Routes
app.use('/api/upload', require('./routes/upload'));
app.use('/api/images', require('./routes/images'));
app.use('/api/search', require('./routes/search'));
app.use('/api/stages', require('./routes/stages'));
app.use('/api/legal', require('./routes/legal'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`fotosicai backend listening on http://localhost:${PORT}`);
});
