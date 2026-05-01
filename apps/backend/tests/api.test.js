/**
 * Test di integrazione API fotosicai.
 *
 * Servizi esterni (Nominatim, Claude AI, stage matching, mailer) sono mockati.
 * Il DB usa SQLite in-memory (:memory:) — azzerato prima di ogni test.
 * Le immagini sono elaborate da sharp su fixture JPEG reali collocate
 * in tests/fixtures/ dall'utente (vedi fixtures/README.md).
 *
 * Se la fixture principale `foto-test.jpg` non è presente, i test di upload
 * vengono saltati automaticamente con un avviso in console.
 */

const os = require('os');
const path = require('path');
const fs = require('fs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const TEST_STORAGE_DIR = path.join(os.tmpdir(), `fotosicai-tests-${process.pid}`);

// Locate legal/consenso.md regardless of Docker vs local layout
function findConsentPath() {
  let dir = path.dirname(__dirname); // start one level above tests/
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, 'legal', 'consenso.md');
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return path.join(__dirname, '../legal/consenso.md');
}

// ── Env vars — devono essere settate PRIMA di require() qualsiasi modulo app ──

process.env.DATABASE_PATH = ':memory:';
process.env.STORAGE_DIR = TEST_STORAGE_DIR;
process.env.ADMIN_TOKEN = 'test-admin-token';
process.env.CONSENT_VERSION = '2026-04-30';
process.env.CONSENT_PATH = findConsentPath();
process.env.NODE_ENV = 'test';
process.env.PUBLIC_BASE_URL = 'http://localhost:3000';

// ── Mock servizi esterni ───────────────────────────────────────────────────

jest.mock('../src/services/stages', () => ({
  loadStages: jest.fn(),
  findClosestStage: jest.fn(() => ({
    stage_id: 1,
    stage_ref: 'A01',
    distance_m: 150,
  })),
  getStageList: jest.fn(() => [
    { id: 1, sicai_ref: 'A01' },
    { id: 2, sicai_ref: 'A02' },
  ]),
}));

jest.mock('../src/services/nominatim', () => ({
  reverseGeocode: jest.fn(async () => ({
    paese: 'Italia',
    regione: 'Toscana',
    provincia: 'FI',
    comune: 'Firenze',
  })),
}));

jest.mock('../src/services/ai', () => ({
  generateTitleCaption: jest.fn(async () => ({
    titolo: 'Paesaggio sul sentiero',
    caption: 'Una veduta panoramica lungo il Sentiero Italia.',
  })),
}));

jest.mock('../src/services/mailer', () => ({
  sendVerificationEmail: jest.fn(async () => {}),
}));

// ── App e DB ───────────────────────────────────────────────────────────────

const request = require('supertest');
const { createApp } = require('../src/app');
const { resetDb, getDb } = require('../src/db/index');
const { sendVerificationEmail } = require('../src/services/mailer');

// ── Helpers ────────────────────────────────────────────────────────────────

// Resolve a fixture name trying both .jpg and .jpeg extensions.
// Returns the full path if found, null otherwise.
function resolveFixture(...names) {
  for (const name of names) {
    const exts = name.includes('.') ? [''] : ['.jpg', '.jpeg'];
    for (const ext of exts) {
      const p = path.join(FIXTURES_DIR, name + ext);
      if (fs.existsSync(p)) return p;
    }
  }
  return null;
}

function fixtureExists(name) {
  return resolveFixture(name) !== null;
}

function fixturePath(name) {
  return resolveFixture(name);
}

// ── Setup / teardown ───────────────────────────────────────────────────────

let app;

beforeAll(() => {
  fs.mkdirSync(TEST_STORAGE_DIR, { recursive: true });
});

beforeEach(() => {
  resetDb();
  app = createApp();
  jest.clearAllMocks();
});

afterAll(() => {
  resetDb();
  fs.rmSync(TEST_STORAGE_DIR, { recursive: true, force: true });
});

// ══════════════════════════════════════════════════════════════════════════
// Health
// ══════════════════════════════════════════════════════════════════════════

describe('Health', () => {
  test('GET /api/health → 200 ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Legal
// ══════════════════════════════════════════════════════════════════════════

describe('Legal', () => {
  test('GET /api/legal/consent → markdown e versione', async () => {
    const res = await request(app).get('/api/legal/consent');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version', '2026-04-30');
    expect(typeof res.body.markdown).toBe('string');
    expect(res.body.markdown.length).toBeGreaterThan(0);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Stages
// ══════════════════════════════════════════════════════════════════════════

describe('Stages', () => {
  test('GET /api/stages → lista tappe con sicai_ref', async () => {
    const res = await request(app).get('/api/stages');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('sicai_ref');
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Images — DB vuoto
// ══════════════════════════════════════════════════════════════════════════

describe('Images — DB vuoto', () => {
  test('GET /api/images → array vuoto', async () => {
    const res = await request(app).get('/api/images');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/images?bbox=10,43,12,44 → array vuoto', async () => {
    const res = await request(app).get('/api/images?bbox=10,43,12,44');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  test('GET /api/images?bbox malformato → 400', async () => {
    const res = await request(app).get('/api/images?bbox=nonvalido');
    expect(res.status).toBe(400);
  });

  test('GET /api/images/:id inesistente → 404', async () => {
    const res = await request(app).get('/api/images/id-che-non-esiste');
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Search — DB vuoto
// ══════════════════════════════════════════════════════════════════════════

describe('Search — DB vuoto', () => {
  test('GET /api/search → items vuoti', async () => {
    const res = await request(app).get('/api/search');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.page).toBe(1);
  });

  test('GET /api/search?q=sentiero → nessun risultato', async () => {
    const res = await request(app).get('/api/search?q=sentiero');
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
  });

  test('GET /api/search/facets → liste vuote', async () => {
    const res = await request(app).get('/api/search/facets');
    expect(res.status).toBe(200);
    expect(res.body.regioni).toEqual([]);
    expect(res.body.province).toEqual([]);
    expect(res.body.comuni).toEqual([]);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Admin — senza foto nel DB
// ══════════════════════════════════════════════════════════════════════════

describe('Admin — autenticazione', () => {
  test('DELETE /api/admin/images/:id senza token → 401', async () => {
    const res = await request(app).delete('/api/admin/images/qualsiasi-id');
    expect(res.status).toBe(401);
  });

  test('DELETE /api/admin/images/:id con token errato → 401', async () => {
    const res = await request(app)
      .delete('/api/admin/images/qualsiasi-id')
      .set('Authorization', 'Bearer token-sbagliato');
    expect(res.status).toBe(401);
  });

  test('DELETE /api/admin/images/inesistente con token corretto → 404', async () => {
    const res = await request(app)
      .delete('/api/admin/images/non-esiste')
      .set('Authorization', 'Bearer test-admin-token');
    expect(res.status).toBe(404);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Upload — validazione input (non richiedono fixture)
// ══════════════════════════════════════════════════════════════════════════

describe('Upload — validazione input', () => {
  test('POST /api/upload senza file → 400', async () => {
    const res = await request(app).post('/api/upload').field('autore_nome', 'Mario Rossi');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/[Ff]ile/);
  });
});

// ══════════════════════════════════════════════════════════════════════════
// Upload + flusso completo — richiedono fixture/foto-test.jpg
// ══════════════════════════════════════════════════════════════════════════

describe('Upload — flusso completo', () => {
  // Cerca in ordine: foto-test, foto-con-gps, foto-senza-gps (entrambe le estensioni)
  const FIXTURE_PATH = resolveFixture('foto-test', 'foto-con-gps', 'foto-senza-gps');
  const GPS_FIXTURE_PATH = resolveFixture('foto-con-gps');
  const NO_GPS_FIXTURE_PATH = resolveFixture('foto-senza-gps');

  function skipIfNoFixture() {
    if (!FIXTURE_PATH) {
      console.warn('[skip] nessuna fixture trovata in tests/fixtures/ — aggiungi foto-con-gps.jpeg o foto-test.jpg');
      return true;
    }
    return false;
  }

  test('POST /api/upload senza autore_nome → 400', async () => {
    if (skipIfNoFixture()) return;
    const res = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH);
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/autore/i);
  });

  test('POST /api/upload senza email → 400', async () => {
    if (skipIfNoFixture()) return;
    const res = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('lat', '43.7')
      .field('lng', '11.2');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('POST /api/upload con email non valida → 400', async () => {
    if (skipIfNoFixture()) return;
    const res = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'non-una-email')
      .field('lat', '43.7')
      .field('lng', '11.2');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  test('Draft: upload restituisce id e paths relativi a /storage/', async () => {
    if (skipIfNoFixture()) return;
    const res = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('id');
    expect(typeof res.body.id).toBe('string');
    expect(res.body.paths.thumb_url).toMatch(/^\/storage\//);
    expect(res.body.paths.medium_url).toMatch(/^\/storage\//);
    expect(res.body.suggested.stage.stage_ref).toBe('A01');
    expect(res.body.suggested.regione).toBe('Toscana');
  });

  test('GPS EXIF estratto automaticamente (se presente nella foto)', async () => {
    if (!GPS_FIXTURE_PATH) {
      console.warn('[skip] foto-con-gps non trovata in tests/fixtures/');
      return;
    }
    // Upload senza coordinate nel body: se la foto ha GPS EXIF verrà usato
    const res = await request(app)
      .post('/api/upload')
      .attach('file', GPS_FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it');

    expect(res.status).toBe(200);

    if (!res.body.exif?.gps) {
      console.warn('[skip] foto-con-gps.jpeg non contiene metadati GPS EXIF estraibili — per testare questa funzione usa una foto scattata da smartphone con GPS attivo');
      return;
    }
    expect(res.body.exif.gps).toHaveProperty('lat');
    expect(res.body.exif.gps).toHaveProperty('lng');
    expect(res.body.suggested.source).toBe('exif');
  });

  test('Upload senza GPS usa posizione manuale dal body', async () => {
    if (!NO_GPS_FIXTURE_PATH) {
      console.warn('[skip] foto-senza-gps non trovata in tests/fixtures/');
      return;
    }
    const res = await request(app)
      .post('/api/upload')
      .attach('file', NO_GPS_FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');

    expect(res.status).toBe(200);
    expect(res.body.exif.gps).toBeNull();
    expect(res.body.suggested.lat).toBeCloseTo(43.7, 2);
    expect(res.body.suggested.lng).toBeCloseTo(11.2, 2);
  });

  test('AI: genera titolo e caption dal draft', async () => {
    if (skipIfNoFixture()) return;
    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');

    const res = await request(app).post(`/api/upload/${upload.body.id}/ai`);
    expect(res.status).toBe(200);
    expect(res.body.titolo).toBe('Paesaggio sul sentiero');
    expect(res.body.caption).toBe('Una veduta panoramica lungo il Sentiero Italia.');
  });

  test('Finalize senza consenso → 400', async () => {
    if (skipIfNoFixture()) return;
    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');

    const res = await request(app)
      .post(`/api/upload/${upload.body.id}/finalize`)
      .send({ titolo: 'Titolo', autore_nome: 'Mario Rossi', consenso_accepted: false });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/consenso/i);
  });

  test('Finalize senza titolo → 400', async () => {
    if (skipIfNoFixture()) return;
    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');

    const res = await request(app)
      .post(`/api/upload/${upload.body.id}/finalize`)
      .send({ titolo: '', autore_nome: 'Mario Rossi', consenso_accepted: true });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/titolo/i);
  });

  test('Finalize → pending_verification, email inviata', async () => {
    if (skipIfNoFixture()) return;

    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');
    expect(upload.status).toBe(200);
    const id = upload.body.id;

    const fin = await request(app)
      .post(`/api/upload/${id}/finalize`)
      .send({
        titolo: 'Titolo test',
        caption: 'Caption test',
        autore_nome: 'Mario Rossi',
        lat: 43.7,
        lng: 11.2,
        consenso_version: '2026-04-30',
        consenso_accepted: true,
      });
    expect(fin.status).toBe(200);
    expect(fin.body.pending).toBe(true);
    expect(fin.body.id).toBe(id);
    expect(fin.body.email).toBe('mario@example.it');
    expect(fin.body.url).toBeUndefined();

    // Email di verifica inviata
    expect(sendVerificationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'mario@example.it', photoId: id })
    );

    // Foto non ancora visibile pubblicamente
    const list = await request(app).get('/api/images');
    expect(list.body.some((i) => i.id === id)).toBe(false);
  });

  test('Verifica token → foto pubblicata e rimossa dai pending', async () => {
    if (skipIfNoFixture()) return;

    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');
    const id = upload.body.id;

    await request(app)
      .post(`/api/upload/${id}/finalize`)
      .send({
        titolo: 'Titolo test',
        autore_nome: 'Mario Rossi',
        lat: 43.7,
        lng: 11.2,
        consenso_version: '2026-04-30',
        consenso_accepted: true,
      });

    // Leggo il token dal DB
    const db = getDb();
    const row = db.prepare('SELECT verification_token FROM images WHERE id = ?').get(id);
    expect(row.verification_token).toBeTruthy();

    // Clicco il link di verifica
    const verify = await request(app).get(`/api/verify/${row.verification_token}`);
    expect(verify.status).toBe(302);
    expect(verify.headers.location).toContain(`photo=${id}`);
    expect(verify.headers.location).toContain('verified=1');

    // Foto ora visibile
    const list = await request(app).get('/api/images');
    expect(list.body.some((i) => i.id === id)).toBe(true);

    // Token consumato
    const rowAfter = db.prepare('SELECT verification_token, status FROM images WHERE id = ?').get(id);
    expect(rowAfter.status).toBe('published');
    expect(rowAfter.verification_token).toBeNull();
  });

  test('Token già usato → 404', async () => {
    if (skipIfNoFixture()) return;

    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');
    const id = upload.body.id;

    await request(app)
      .post(`/api/upload/${id}/finalize`)
      .send({ titolo: 'T', autore_nome: 'Mario', lat: 43.7, lng: 11.2, consenso_version: '2026-04-30', consenso_accepted: true });

    const db = getDb();
    const { verification_token: token } = db.prepare('SELECT verification_token FROM images WHERE id = ?').get(id);

    await request(app).get(`/api/verify/${token}`);
    const second = await request(app).get(`/api/verify/${token}`);
    expect(second.status).toBe(404);
  });

  test('Email già verificata — finalize pubblica subito senza email', async () => {
    if (skipIfNoFixture()) return;

    // Seed email verificata
    const db = getDb();
    db.prepare("INSERT INTO verified_emails (email, verified_at) VALUES (?, datetime('now'))").run('trusted@example.it');

    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'trusted@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');
    const id = upload.body.id;

    const fin = await request(app)
      .post(`/api/upload/${id}/finalize`)
      .send({
        titolo: 'Titolo trusted',
        autore_nome: 'Mario Rossi',
        lat: 43.7,
        lng: 11.2,
        consenso_version: '2026-04-30',
        consenso_accepted: true,
      });
    expect(fin.status).toBe(200);
    expect(fin.body.published).toBe(true);
    expect(fin.body.url).toContain(`photo=${id}`);

    // Nessuna email inviata
    expect(sendVerificationEmail).not.toHaveBeenCalled();

    // Foto subito visibile
    const list = await request(app).get('/api/images');
    expect(list.body.some((i) => i.id === id)).toBe(true);
  });

  test('Flusso end-to-end: upload → AI → verify → list → search → delete', async () => {
    if (skipIfNoFixture()) return;

    // 1. Upload draft
    const upload = await request(app)
      .post('/api/upload')
      .attach('file', FIXTURE_PATH)
      .field('autore_nome', 'Mario Rossi')
      .field('email', 'mario@example.it')
      .field('lat', '43.7')
      .field('lng', '11.2');
    expect(upload.status).toBe(200);
    const id = upload.body.id;

    // 2. AI
    const ai = await request(app).post(`/api/upload/${id}/ai`);
    expect(ai.status).toBe(200);

    // 3. Finalize → pending
    const fin = await request(app)
      .post(`/api/upload/${id}/finalize`)
      .send({
        titolo: 'Titolo finale del test',
        caption: 'Caption finale del test',
        autore_nome: 'Mario Rossi',
        lat: 43.7,
        lng: 11.2,
        consenso_version: '2026-04-30',
        consenso_accepted: true,
      });
    expect(fin.status).toBe(200);
    expect(fin.body.pending).toBe(true);

    // 4. Foto non ancora nella lista pubblica
    const listBefore = await request(app).get('/api/images');
    expect(listBefore.body.some((i) => i.id === id)).toBe(false);

    // 5. Verifica email
    const db = getDb();
    const { verification_token: token } = db.prepare('SELECT verification_token FROM images WHERE id = ?').get(id);
    const verify = await request(app).get(`/api/verify/${token}`);
    expect(verify.status).toBe(302);

    // 6. Immagine nella lista
    const list = await request(app).get('/api/images');
    expect(list.status).toBe(200);
    expect(list.body.some((i) => i.id === id)).toBe(true);
    const found = list.body.find((i) => i.id === id);
    expect(found.thumb_url).toMatch(/^\/storage\//);

    // 7. Dettaglio
    const detail = await request(app).get(`/api/images/${id}`);
    expect(detail.status).toBe(200);
    expect(detail.body.titolo).toBe('Titolo finale del test');
    expect(detail.body.regione).toBe('Toscana');

    // 8. Bbox dentro il range
    const bboxIn = await request(app).get('/api/images?bbox=10,43,12,44');
    expect(bboxIn.status).toBe(200);
    expect(bboxIn.body.some((i) => i.id === id)).toBe(true);

    // 9. Bbox fuori range
    const bboxOut = await request(app).get('/api/images?bbox=0,0,1,1');
    expect(bboxOut.status).toBe(200);
    expect(bboxOut.body.some((i) => i.id === id)).toBe(false);

    // 10. Ricerca full-text
    const fts = await request(app).get('/api/search?q=finale');
    expect(fts.status).toBe(200);
    expect(fts.body.items.some((i) => i.id === id)).toBe(true);

    // 11. Filtro per regione
    const byRegione = await request(app).get('/api/search?regione=Toscana');
    expect(byRegione.status).toBe(200);
    expect(byRegione.body.items.some((i) => i.id === id)).toBe(true);

    // 12. Filtro per stage_ref
    const byStage = await request(app).get('/api/search?stage_ref=A01');
    expect(byStage.status).toBe(200);
    expect(byStage.body.items.some((i) => i.id === id)).toBe(true);

    // 13. Facets dopo pubblicazione
    const facets = await request(app).get('/api/search/facets');
    expect(facets.status).toBe(200);
    expect(facets.body.regioni).toContain('Toscana');

    // 14. Delete senza token → 401
    expect((await request(app).delete(`/api/admin/images/${id}`)).status).toBe(401);

    // 15. Delete con token errato → 401
    expect(
      (await request(app).delete(`/api/admin/images/${id}`).set('Authorization', 'Bearer sbagliato')).status
    ).toBe(401);

    // 16. Delete con token corretto → 204
    const del = await request(app)
      .delete(`/api/admin/images/${id}`)
      .set('Authorization', 'Bearer test-admin-token');
    expect(del.status).toBe(204);

    // 17. Immagine non più trovata
    expect((await request(app).get(`/api/images/${id}`)).status).toBe(404);

    // 18. Più nella lista
    const listAfter = await request(app).get('/api/images');
    expect(listAfter.body.some((i) => i.id === id)).toBe(false);
  });
});
