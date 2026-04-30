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
  }
  return db;
}

function resetDb() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = { getDb, resetDb };
