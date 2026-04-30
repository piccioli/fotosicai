const { getDb } = require('../db/index');

const USER_AGENT = process.env.NOMINATIM_USER_AGENT || 'fotosicai/1.0';
const BASE_URL = 'https://nominatim.openstreetmap.org/reverse';
const RATE_LIMIT_MS = 1100; // Nominatim policy: max 1 req/s

let lastRequestAt = 0;

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function geoKey(lat, lng) {
  return `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

/**
 * Reverse geocode (lat, lng) with SQLite cache.
 * Returns { paese, regione, provincia, comune, display_name }.
 */
async function reverseGeocode(lat, lng) {
  const db = getDb();
  const key = geoKey(lat, lng);

  const cached = db.prepare('SELECT * FROM nominatim_cache WHERE geokey = ?').get(key);
  if (cached) {
    return {
      paese: cached.paese,
      regione: cached.regione,
      provincia: cached.provincia,
      comune: cached.comune,
      display_name: cached.display_name,
    };
  }

  // Rate limit
  const now = Date.now();
  const wait = RATE_LIMIT_MS - (now - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();

  const url = `${BASE_URL}?lat=${lat}&lon=${lng}&format=json`;
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const json = await res.json();

  const addr = json.address || {};
  const result = {
    paese: addr.country || null,
    regione: addr.state || null,
    provincia: addr.county || null,
    comune: addr.city || addr.town || addr.village || addr.municipality || null,
    display_name: json.display_name || null,
  };

  db.prepare(
    `INSERT OR REPLACE INTO nominatim_cache (geokey, paese, regione, provincia, comune, display_name, raw_json)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(key, result.paese, result.regione, result.provincia, result.comune, result.display_name, JSON.stringify(json));

  return result;
}

module.exports = { reverseGeocode };
