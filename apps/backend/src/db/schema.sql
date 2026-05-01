CREATE TABLE IF NOT EXISTS images (
  id                   TEXT PRIMARY KEY,
  status               TEXT NOT NULL DEFAULT 'draft',
  file_path            TEXT NOT NULL,
  thumbnail_path       TEXT NOT NULL,
  medium_path          TEXT NOT NULL,
  width                INTEGER,
  height               INTEGER,
  lat                  REAL NOT NULL,
  lng                  REAL NOT NULL,
  position_source      TEXT NOT NULL,
  paese                TEXT,
  regione              TEXT,
  provincia            TEXT,
  comune               TEXT,
  stage_id             INTEGER,
  stage_ref            TEXT,
  stage_distance_m     REAL,
  data_scatto          TEXT,
  titolo               TEXT NOT NULL DEFAULT '',
  caption              TEXT NOT NULL DEFAULT '',
  ai_generated         INTEGER NOT NULL DEFAULT 1,
  autore_nome          TEXT NOT NULL DEFAULT '',
  email                TEXT NOT NULL DEFAULT '',
  verification_token   TEXT,
  verification_sent_at TEXT,
  verified_at          TEXT,
  validated_at         TEXT,
  validated_by         TEXT,
  consenso             INTEGER NOT NULL DEFAULT 0,
  consenso_version     TEXT NOT NULL DEFAULT '',
  consenso_accepted_at TEXT NOT NULL DEFAULT '',
  created_at           TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_images_status_geo ON images(status, lat, lng);
CREATE INDEX IF NOT EXISTS idx_images_stage ON images(stage_ref) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_images_regione ON images(regione) WHERE status='published';
CREATE INDEX IF NOT EXISTS idx_images_comune ON images(comune) WHERE status='published';

CREATE VIRTUAL TABLE IF NOT EXISTS images_fts USING fts5(
  titolo, caption, autore_nome, stage_ref,
  content='images', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS images_ai_insert AFTER INSERT ON images BEGIN
  INSERT INTO images_fts(rowid, titolo, caption, autore_nome, stage_ref)
  VALUES (new.rowid, new.titolo, new.caption, new.autore_nome, coalesce(new.stage_ref, ''));
END;

CREATE TRIGGER IF NOT EXISTS images_ai_update AFTER UPDATE ON images BEGIN
  INSERT INTO images_fts(images_fts, rowid, titolo, caption, autore_nome, stage_ref)
  VALUES ('delete', old.rowid, old.titolo, old.caption, old.autore_nome, coalesce(old.stage_ref, ''));
  INSERT INTO images_fts(rowid, titolo, caption, autore_nome, stage_ref)
  VALUES (new.rowid, new.titolo, new.caption, new.autore_nome, coalesce(new.stage_ref, ''));
END;

CREATE TRIGGER IF NOT EXISTS images_ai_delete AFTER DELETE ON images BEGIN
  INSERT INTO images_fts(images_fts, rowid, titolo, caption, autore_nome, stage_ref)
  VALUES ('delete', old.rowid, old.titolo, old.caption, old.autore_nome, coalesce(old.stage_ref, ''));
END;

CREATE TABLE IF NOT EXISTS verified_emails (
  email       TEXT PRIMARY KEY,
  verified_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS nominatim_cache (
  geokey       TEXT PRIMARY KEY,
  paese        TEXT,
  regione      TEXT,
  provincia    TEXT,
  comune       TEXT,
  display_name TEXT,
  raw_json     TEXT,
  cached_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS stages (
  id        INTEGER PRIMARY KEY,
  sicai_ref TEXT NOT NULL UNIQUE
);
