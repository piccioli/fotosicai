const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const schemaPath = path.join(__dirname, 'schema.sql');
let db;

function getDb() {
  if (!db) {
    const DB_PATH = process.env.DATABASE_PATH || './db/fotosicai.sqlite';
    if (DB_PATH !== ':memory:') {
      const dir = path.dirname(DB_PATH);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    db.exec(fs.readFileSync(schemaPath, 'utf8'));
    migrateImages(db);
    cleanupStalePending(db);
  }
  return db;
}

function migrateImages(db) {
  const newCols = [
    "ALTER TABLE images ADD COLUMN email TEXT NOT NULL DEFAULT ''",
    'ALTER TABLE images ADD COLUMN verification_token TEXT',
    'ALTER TABLE images ADD COLUMN verification_sent_at TEXT',
    'ALTER TABLE images ADD COLUMN verified_at TEXT',
  ];
  for (const sql of newCols) {
    try { db.prepare(sql).run(); } catch (_) { /* column already exists */ }
  }
  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_images_token ON images(verification_token) WHERE verification_token IS NOT NULL');
  } catch (_) {}
}

function cleanupStalePending(db) {
  const staleRows = db
    .prepare("SELECT id, stage_ref FROM images WHERE status = 'pending_verification' AND verification_sent_at < datetime('now', '-7 days')")
    .all();
  if (staleRows.length === 0) return;

  const { deleteImageFiles } = require('../services/storage');
  for (const row of staleRows) {
    try { deleteImageFiles(row.stage_ref, row.id); } catch (_) {}
  }
  db.prepare("DELETE FROM images WHERE status = 'pending_verification' AND verification_sent_at < datetime('now', '-7 days')").run();
}

function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, resetDb };
