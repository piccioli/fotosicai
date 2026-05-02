require('dotenv').config();
const path = require('path');
const fs = require('fs');

const { getDb } = require('./db/index');
const { loadStages } = require('./services/stages');
const { createApp } = require('./app');

const PORT = process.env.PORT || 3000;
const STORAGE_DIR = process.env.STORAGE_DIR || './storage';

fs.mkdirSync(path.resolve(STORAGE_DIR), { recursive: true });
fs.mkdirSync(
  path.resolve(process.env.DATABASE_PATH ? path.dirname(process.env.DATABASE_PATH) : './db'),
  { recursive: true }
);

if (!process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD) {
  console.warn('[startup] ADMIN_USERNAME e/o ADMIN_PASSWORD non impostati — interfaccia admin disabilitata');
}

getDb();
loadStages();

const app = createApp();
app.listen(PORT, () => console.log(`fotosicai backend listening on http://localhost:${PORT}`));
