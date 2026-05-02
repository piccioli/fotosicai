'use strict';
/**
 * FotoSICAI stress-test seed script.
 *
 * Usage (inside backend container):
 *   node /tmp/stress_test.js <USERS> <PHOTOS_PER_USER>
 *
 * Invoked automatically by scripts/stress_test.sh which copies this file
 * into the running backend container.
 */

const path = require('path');
const fs   = require('fs');
const crypto = require('crypto');

// ── env defaults (container paths) ───────────────────────────────────────────
process.env.DATABASE_PATH = process.env.DATABASE_PATH || '/app/db/fotosicai.sqlite';
process.env.STORAGE_DIR   = process.env.STORAGE_DIR   || '/app/storage';
process.env.DATA_DIR      = process.env.DATA_DIR      || '/app/DATA';

const USERS            = Math.max(1, parseInt(process.argv[2] || '5',  10));
const PHOTOS_PER_USER  = Math.max(1, parseInt(process.argv[3] || '10', 10));
const JITTER           = 0.10;   // ±10 %
const TRAIL_BUFFER_M   = 500;    // massimo scostamento dal tracciato

// ── reuse backend services ────────────────────────────────────────────────────
const { getDb }          = require('/app/src/db/index.js');
const { loadStages }     = require('/app/src/services/stages.js');
const { processImage }   = require('/app/src/services/images.js');

loadStages();
const db = getDb();

// ── fixture images ────────────────────────────────────────────────────────────
const FIXTURE_DIR = '/app/tests/fixtures';
const fixtures = fs.readdirSync(FIXTURE_DIR)
  .filter(f => /\.(jpe?g|png)$/i.test(f))
  .map(f => path.join(FIXTURE_DIR, f));

if (!fixtures.length) {
  console.error('[stress] Nessuna fixture in', FIXTURE_DIR);
  process.exit(1);
}

// ── GeoJSON segments sampling ─────────────────────────────────────────────────
const GEOJSON_PATH = path.join(process.env.DATA_DIR, 'data.geojson');
const CSV_PATH     = path.join(process.env.DATA_DIR, 'sentiero_italia_tappe_id_name - MAPPING.csv');

const idToRef = {};
for (const line of fs.readFileSync(CSV_PATH, 'utf8').trim().split('\n').slice(1)) {
  const [id, ref] = line.split(',');
  if (id && ref) idToRef[Number(id.trim())] = ref.trim();
}

const segments = [];
for (const feat of JSON.parse(fs.readFileSync(GEOJSON_PATH)).features) {
  const geom  = feat.geometry;
  const props = feat.properties || {};
  const ref   = props.sicai_ref || idToRef[props.id] || null;
  if (!geom || !ref) continue;
  const rings = geom.type === 'LineString' ? [geom.coordinates]
              : geom.type === 'MultiLineString' ? geom.coordinates : [];
  for (const ring of rings) {
    for (let i = 0; i < ring.length - 1; i++) {
      segments.push({ a: ring[i], b: ring[i + 1], ref });
    }
  }
}
console.log(`[stress] ${segments.length} segmenti trail caricati`);

// ── geometry helpers ──────────────────────────────────────────────────────────
function rand(min, max)    { return min + Math.random() * (max - min); }
function pick(arr)         { return arr[Math.floor(Math.random() * arr.length)]; }

function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2
          + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
          * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Random point on a random trail segment */
function randomTrailPoint() {
  const seg = pick(segments);
  const t   = Math.random();
  return {
    lat: seg.a[1] + t * (seg.b[1] - seg.a[1]),
    lng: seg.a[0] + t * (seg.b[0] - seg.a[0]),
    ref: seg.ref,
  };
}

/** Offset (lat, lng) by up to maxM metres in a random direction */
function jitter(lat, lng, maxM) {
  const dLat = maxM / 111320;
  const dLng = maxM / (111320 * Math.cos(lat * Math.PI / 180));
  const angle = Math.random() * 2 * Math.PI;
  const r     = Math.sqrt(Math.random()); // uniform disk
  return {
    lat: lat + dLat * r * Math.cos(angle),
    lng: lng + dLng * r * Math.sin(angle),
  };
}

// ── random content pools ──────────────────────────────────────────────────────
const NOMI    = ['Marco','Giulia','Luca','Sara','Andrea','Elena','Matteo','Francesca',
                 'Alessandro','Valentina','Davide','Chiara','Lorenzo','Marta','Federico',
                 'Anna','Stefano','Laura','Roberto','Paola','Simone','Irene','Tommaso'];
const COGNOMI = ['Rossi','Ferrari','Bianchi','Russo','Esposito','Romano','Colombo',
                 'Ricci','Marino','Greco','Bruno','Gallo','Conti','De Luca','Costa',
                 'Giordano','Mancini','Rizzo','Lombardi','Morelli','Fontana','Santoro'];
const DOMAINS = ['gmail.com','yahoo.it','libero.it','hotmail.com','outlook.com','icloud.com','tiscali.it'];
const SEZIONI = ['Milano','Roma','Torino','Firenze','Napoli','Bologna','Venezia','Genova',
                 'Palermo','Catania','Bari','Verona','Trieste','Padova','Trento',
                 'Perugia','Ancona','Cagliari','Reggio Calabria','Potenza'];
const RUOLI   = ['Socio ordinario','Accompagnatore di escursionismo','Istruttore di alpinismo',
                 'Presidente di sezione','Consigliere sezionale','Guida alpina'];

const TITOLI = [
  'Panorama sul sentiero','Vista dalla cresta','Alba sul percorso','Bosco di faggi',
  'Il valico','Tramonto in montagna','Rifugio sul cammino','Prato fiorito','Lago alpino',
  'Vetta raggiunta','Il guado','Pietraia antica','Foresta silenziosa','Mulattiera storica',
  'Cresta ventosa','Versante meridionale','Valle nascosta','Torrentello di montagna',
  'Bosco di abeti','Cucuzzolo panoramico','Sentiero tra le rocce','Fioritura spontanea',
  'Paese antico','Campagna italiana','Passo di montagna','La discesa','Il pianoro',
  'Ruderi sul tracciato','Fontana del camminatore','Ombra e luce nel bosco',
  'Il bivio','Parete rocciosa','Campo di lavanda','Borgata abbandonata',
  'Ulivi e sentiero','Pascolo d\'alta quota','Neve tardiva','Rifugio solitario',
];
const AGGETTIVI = ['— Sentiero Italia','— Appennino','— Italia','— CAI','— escursione'];
const DESCRIZIONI = [
  'Un tratto panoramico con vista sulla vallata sottostante.',
  'Il sentiero si snoda tra rocce e vegetazione mediterranea.',
  'Punto di sosta ideale con fontanella d\'acqua fresca.',
  'Dalla cima si scorge il percorso della giornata intera.',
  'Flora tipica della zona appenninica in piena fioritura.',
  'Il bosco offre riparo dal sole nelle ore più calde.',
  'Traccia ben segnalata con cartelli CAI bianchi e rossi.',
  'Vista a 360 gradi sul paesaggio circostante.',
  'Silenzio assoluto interrotto solo dal canto degli uccelli.',
  'Un tratto impegnativo ma ricco di soddisfazioni.',
  'Paesaggio tipicamente toscano con cipressi in lontananza.',
  'Il torrente accompagna il cammino per qualche chilometro.',
  'Erba alta e fiori selvatici colorano il percorso.',
  'Punto di ritrovo tra escursionisti provenienti da varie direzioni.',
  'Rocce affioranti creano un paesaggio quasi lunare.',
  'La nebbia bassa avvolge la vallata in un\'atmosfera magica.',
  'Sentiero esposto al sole pomeridiano — portare acqua.',
  '',
];

function randomUser(idx) {
  const nome    = pick(NOMI);
  const cognome = pick(COGNOMI);
  const socio   = Math.random() > 0.4;
  const ref     = socio && Math.random() > 0.75;
  return {
    autore_nome:            `${nome} ${cognome}`,
    email:                  `${nome.toLowerCase()}.${cognome.toLowerCase().replace(/\s/g, '')}${idx}@${pick(DOMAINS)}`,
    socio_cai:              socio ? 1 : 0,
    sezione_cai:            socio  ? pick(SEZIONI) : null,
    ruolo_cai:              socio  ? pick(RUOLI)   : null,
    referente_sicai:        ref    ? 1 : 0,
    referente_sicai_ambito: ref    ? pick(SEZIONI) : null,
    marketing_consent:      Math.random() > 0.5 ? 1 : 0,
  };
}

function randomMeta() {
  const base = pick(TITOLI);
  const titolo = Math.random() > 0.5 ? `${base} ${pick(AGGETTIVI)}` : base;
  return { titolo, caption: pick(DESCRIZIONI) };
}

// ── prepared statements ───────────────────────────────────────────────────────
const insertImg = db.prepare(`
  INSERT INTO images (
    id, status, file_path, thumbnail_path, medium_path, width, height,
    lat, lng, position_source,
    stage_ref, stage_distance_m, data_scatto,
    titolo, caption, ai_generated, autore_nome, email,
    verified_at, validated_at, validated_by,
    socio_cai, sezione_cai, ruolo_cai,
    referente_sicai, referente_sicai_ambito,
    consenso, consenso_version, consenso_accepted_at,
    marketing_consent, created_at
  ) VALUES (
    ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
  )
`);

const insertVerified = db.prepare(
  'INSERT OR IGNORE INTO verified_emails (email, verified_at) VALUES (?,?)'
);

// ── main ──────────────────────────────────────────────────────────────────────
async function main() {
  const t0 = Date.now();
  console.log(`\n🏔  FotoSICAI stress test — ${USERS} utenti × ~${PHOTOS_PER_USER} foto (±${JITTER * 100}%)`);
  console.log(`    Buffer trail: ${TRAIL_BUFFER_M} m | Fixtures: ${fixtures.map(f => path.basename(f)).join(', ')}\n`);

  let totalPhotos = 0;

  for (let u = 0; u < USERS; u++) {
    const user    = randomUser(u);
    const nPhotos = Math.max(1, Math.round(PHOTOS_PER_USER * (1 + rand(-JITTER, JITTER))));

    const verifiedAt = isoOffset(rand(1, 30));
    insertVerified.run(user.email, verifiedAt);

    process.stdout.write(`  [${u + 1}/${USERS}] ${user.email.padEnd(42)} ${nPhotos} foto `);

    for (let p = 0; p < nPhotos; p++) {
      const trail      = randomTrailPoint();
      const pos        = jitter(trail.lat, trail.lng, TRAIL_BUFFER_M);
      const distM      = haversineM(pos.lat, pos.lng, trail.lat, trail.lng);
      const meta       = randomMeta();
      const id         = crypto.randomUUID();
      const fixture    = pick(fixtures);
      const createdAt  = isoOffset(rand(0, 30));
      const dataScatto = isoOffset(rand(0, 365)).slice(0, 10);

      const { paths, width, height } = await processImage(
        fs.readFileSync(fixture), trail.ref, id
      );

      insertImg.run(
        id, 'published', paths.original, paths.thumbnail, paths.medium, width, height,
        pos.lat, pos.lng, 'manual',
        trail.ref, distM, dataScatto,
        meta.titolo, meta.caption, 0, user.autore_nome, user.email,
        verifiedAt, createdAt, 'stress_test',
        user.socio_cai, user.sezione_cai, user.ruolo_cai,
        user.referente_sicai, user.referente_sicai_ambito,
        1, '2026-04-30', createdAt,
        user.marketing_consent, createdAt
      );
      process.stdout.write('.');
      totalPhotos++;
    }
    console.log(' ✓');
  }

  const secs = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅  ${totalPhotos} foto inserite per ${USERS} utenti in ${secs}s\n`);
}

/** ISO timestamp offset by `daysAgo` days (random fractional) */
function isoOffset(daysAgo) {
  return new Date(Date.now() - daysAgo * 86400000)
    .toISOString().replace('T', ' ').slice(0, 19);
}

main().catch(e => { console.error(e); process.exit(1); });
