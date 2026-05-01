const fs = require('fs');
const path = require('path');

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '../../../../DATA');
const GEOJSON_PATH = path.join(DATA_DIR, 'data.geojson');
const CSV_PATH = path.join(DATA_DIR, 'sentiero_italia_tappe_id_name - MAPPING.csv');
const MAX_DISTANCE_M = Number(process.env.VITE_STAGE_MAX_DISTANCE_M) || 5000;

let features = [];
let idToRef = {};
let stageList = [];

function loadStages() {
  // Load CSV mapping id -> sicai_ref
  const csvRaw = fs.readFileSync(CSV_PATH, 'utf8');
  const lines = csvRaw.trim().split('\n').slice(1); // skip header
  for (const line of lines) {
    const [id, tappa] = line.split(',');
    if (id && tappa) idToRef[Number(id.trim())] = tappa.trim();
  }
  stageList = Object.entries(idToRef).map(([id, ref]) => ({ id: Number(id), sicai_ref: ref }));

  // Load GeoJSON
  const geojson = JSON.parse(fs.readFileSync(GEOJSON_PATH, 'utf8'));
  features = geojson.features || [];
  console.log(`[stages] loaded ${features.length} features, ${stageList.length} stage refs`);
}

/**
 * Haversine distance in metres between two [lng,lat] points.
 */
function haversineM(lng1, lat1, lng2, lat2) {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Minimum distance from point (lng,lat) to a line segment (ax,ay)-(bx,by) in metres.
 */
function pointToSegmentM(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq > 0 ? ((px - ax) * dx + (py - ay) * dy) / lenSq : 0;
  t = Math.max(0, Math.min(1, t));
  return haversineM(px, py, ax + t * dx, ay + t * dy);
}

/**
 * Returns {stage_id, stage_ref, distance_m} of the closest SICAI stage to (lat, lng).
 * Returns stage_id=null if nothing found within MAX_DISTANCE_M.
 */
function findClosestStage(lat, lng) {
  let best = null;
  let bestDist = Infinity;

  for (const feat of features) {
    const geom = feat.geometry;
    if (!geom || !geom.coordinates) continue;
    const props = feat.properties || {};
    const ref = props.sicai_ref || null;
    const id = props.id != null ? Number(props.id) : null;
    if (!ref && !id) continue;

    const stageRef = ref || idToRef[id] || null;
    const stageId = id;

    // Flatten all segments from LineString / MultiLineString
    const type = geom.type;
    let rings = [];
    if (type === 'LineString') rings = [geom.coordinates];
    else if (type === 'MultiLineString') rings = geom.coordinates;
    else continue;

    for (const ring of rings) {
      for (let i = 0; i < ring.length - 1; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[i + 1];
        const d = pointToSegmentM(lng, lat, ax, ay, bx, by);
        if (d < bestDist) {
          bestDist = d;
          best = { stage_id: stageId, stage_ref: stageRef, distance_m: d };
        }
      }
    }
  }

  if (!best || bestDist > MAX_DISTANCE_M) {
    return { stage_id: null, stage_ref: null, distance_m: best ? bestDist : null };
  }
  return best;
}

function getStageList() {
  return stageList;
}

module.exports = { loadStages, findClosestStage, getStageList };
