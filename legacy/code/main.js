document.getElementById('app-title').textContent = CONFIG.title;
if (CONFIG.debug) document.body.classList.add('debug');

const infoModal = document.getElementById('info-modal');
const infoBtn = document.getElementById('info-btn');
const infoClose = document.getElementById('info-modal-close');

infoBtn.addEventListener('click', () => {
  document.getElementById('info-modal-title').textContent = CONFIG.title;
  document.getElementById('info-modal-desc').textContent = CONFIG.description;
  document.getElementById('info-modal-software').innerHTML =
    `<strong>${CONFIG.appName}</strong> v${APP_VERSION}<br>Data versione: ${APP_VERSION_DATE}<br>Licenza: <a href="LICENSE" target="_blank" rel="noopener">${APP_LICENSE}</a>`;
  infoModal.classList.add('is-open');
});
infoClose.addEventListener('click', () => infoModal.classList.remove('is-open'));
infoModal.addEventListener('click', (e) => { if (e.target === infoModal) infoModal.classList.remove('is-open'); });

const clickZoom = Number(CONFIG.click_zoom) || 14;
const clickCircleRadiusKm = Number(CONFIG.click_circle_radius) || 2;
const clickCircleColor = CONFIG.click_circle_color || '#0066cc';
const clickCircleFillOpacity = Number(CONFIG.click_circle_fill_opacity);
const clickCircleFillOpacityNorm = (clickCircleFillOpacity >= 0 && clickCircleFillOpacity <= 1) ? clickCircleFillOpacity : 0.2;

let clickCircle = null;

const map = L.map('map', { zoomControl: false, minZoom: CONFIG.min_zoom, maxZoom: CONFIG.max_zoom }).setView(CONFIG.start_center, CONFIG.start_zoom);
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.scale({ position: 'bottomright', imperial: false }).addTo(map);

const zoomOverlay = document.getElementById('zoom-overlay');
const zoomOverlayMsg = document.getElementById('zoom-overlay-msg');
zoomOverlayMsg.textContent = CONFIG.zoom_message;

function updateZoomOverlay() {
  const zoom = Math.floor(map.getZoom());
  zoomOverlay.classList.toggle('is-hidden', zoom >= clickZoom);
}
map.on('zoomend', updateZoomOverlay);
updateZoomOverlay();

const debugZoom = document.getElementById('debug-zoom');
const debugNominatim = document.getElementById('debug-nominatim');
function updateDebugPopup() {
  if (CONFIG.debug) debugZoom.textContent = map.getZoom();
}
if (CONFIG.debug) {
  map.on('zoomend', updateDebugPopup);
  updateDebugPopup();
}

const tileUrl = CONFIG.tile_url || 'https://api.webmapp.it/tiles/{z}/{x}/{y}.png';
const tileAttribution = CONFIG.tile_attribution || '&copy; CAI &copy; OpenStreetMap';

L.tileLayer(tileUrl, {
  attribution: tileAttribution,
  maxZoom: CONFIG.max_zoom,
  minZoom: CONFIG.min_zoom,
}).addTo(map);

// Caricamento GeoJSON all'avvio (percorso da root per Docker/nginx)
let geoJsonLayer = null;
let geojsonFeatures = [];
const geojsonStatus = document.getElementById('geojson-status');
geojsonStatus.textContent = 'Caricamento sentiero… (file grande, attendere)';
const geojsonUrl = new URL('DATA/data.geojson', window.location.href).href + '?t=' + Date.now();
fetch(geojsonUrl)
  .then((res) => {
    if (!res.ok) throw new Error('File non trovato: ' + res.status + ' – hai fatto rebuild? docker compose up -d --build');
    return res.json();
  })
  .then((geojson) => {
    const features = geojson && geojson.features ? geojson.features : [];
    if (features.length === 0) throw new Error('GeoJSON senza features');
    geojsonFeatures = features;
    const geojsonColor = CONFIG.geojson_color || '#0066cc';
    const geojsonWeight = Number(CONFIG.geojson_weight);
    const geojsonOpacity = Number(CONFIG.geojson_opacity);
    geoJsonLayer = L.geoJSON(geojson, {
      style: {
        color: geojsonColor,
        weight: (geojsonWeight > 0 ? geojsonWeight : 4),
        opacity: (geojsonOpacity >= 0 && geojsonOpacity <= 1 ? geojsonOpacity : 1),
      },
    }).addTo(map);
    geoJsonLayer.bringToFront();
    if (geoJsonLayer.getBounds().isValid()) {
      map.fitBounds(geoJsonLayer.getBounds(), { padding: [20, 20], maxZoom: clickZoom });
    }
    geojsonStatus.textContent = 'Sentiero caricato (' + features.length + ' tratti)';
    geojsonStatus.classList.remove('error');
    setTimeout(() => geojsonStatus.classList.add('is-hidden'), 3000);
  })
  .catch((err) => {
    geojsonStatus.textContent = 'Errore: ' + (err.message || 'caricamento sentiero fallito');
    geojsonStatus.classList.add('error');
    console.warn('Caricamento data.geojson fallito:', err);
    setTimeout(() => geojsonStatus.classList.add('is-hidden'), 8000);
  });

/**
 * Restituisce i sicai_ref delle tappe le cui geometrie ricadono entro il cerchio.
 * @param {number} centerLat - Latitudine centro cerchio
 * @param {number} centerLng - Longitudine centro cerchio
 * @param {number} radiusM - Raggio in metri
 * @returns {string[]} Array di sicai_ref (unici, ordinati)
 */
function getTappeInCircle(centerLat, centerLng, radiusM) {
  const center = L.latLng(centerLat, centerLng);
  const names = new Set();

  function coordsToPoints(coords) {
    if (!Array.isArray(coords) || coords.length === 0) return [];
    if (typeof coords[0] === 'number') return [coords]; // Point
    if (typeof coords[0][0] === 'number') return coords; // LineString
    return coords.flat(); // MultiLineString
  }

  for (const feat of geojsonFeatures) {
    const geom = feat.geometry;
    if (!geom || !geom.coordinates) continue;
    const points = coordsToPoints(geom.coordinates);
    for (const p of points) {
      const lat = p[1];
      const lng = p[0];
      if (center.distanceTo(L.latLng(lat, lng)) <= radiusM) {
        const props = feat.properties || {};
        const ref = props.sicai_ref || props.name;
        if (ref) names.add(ref);
        break;
      }
    }
  }
  return Array.from(names).sort();
}

map.on('click', async (e) => {
  if (Math.floor(map.getZoom()) < clickZoom) return;
  const { lat, lng } = e.latlng;

  if (clickCircle) map.removeLayer(clickCircle);
  clickCircle = L.circle(e.latlng, {
    radius: clickCircleRadiusKm * 1000,
    fillColor: clickCircleColor,
    fillOpacity: clickCircleFillOpacityNorm,
    color: clickCircleColor,
    weight: 2,
  }).addTo(map);

  if (CONFIG.debug) debugNominatim.textContent = 'Caricamento...';
  const popup = L.popup()
    .setLatLng(e.latlng)
    .setContent(
      '<div class="coord-popup">' +
        '<div class="loader"></div> Caricamento Nominatim...' +
      '</div>'
    )
    .openOn(map);

  popup.on('remove', () => {
    if (clickCircle) map.removeLayer(clickCircle);
    clickCircle = null;
  });

  function formatTappeContent(tappe) {
    var content = tappe.length > 0
      ? tappe.map(function (n) { var d = document.createElement('div'); d.textContent = n; return d.innerHTML; }).join(', ')
      : 'nessuna tappa';
    return '<p><strong>Tappe:</strong> ' + content + '</p>';
  }

  function buildTypeformButtonHtml(addr, lat, lng, tappe) {
    if (!CONFIG.typeform_url) return '';
    var radius = clickCircleRadiusKm;
    var hasTappe = tappe && tappe.length > 0;
    var comune = (addr && (addr.city || addr.town || addr.village || addr.municipality)) || '-';
    var regione = (addr && addr.state) || '-';
    var paese = (addr && addr.country) || '-';
    var provincia = (addr && addr.county) || '-';
    var indirizzoCompleto = (addr && addr.display_name) || '-';
    var coordinate = lat.toFixed(6) + ',' + lng.toFixed(6);
    var tappeStr = hasTappe ? tappe.join(',') : '';
    var params = 'regione=' + encodeURIComponent(regione) +
      '&paese=' + encodeURIComponent(paese) +
      '&provincia=' + encodeURIComponent(provincia) +
      '&comune=' + encodeURIComponent(comune) +
      '&indirizzo_completo=' + encodeURIComponent(indirizzoCompleto) +
      '&coordinate=' + encodeURIComponent(coordinate) +
      '&tappe=' + encodeURIComponent(tappeStr);
    var url = CONFIG.typeform_url + '#' + params;
    if (hasTappe) {
      return '<div class="coord-popup-typeform"><a href="' + url + '" target="_blank" rel="noopener" class="typeform-btn typeform-btn--active">Prosegui Accreditamento</a></div>';
    }
    return '<div class="coord-popup-typeform"><span class="typeform-btn typeform-btn--disabled" title="Per poter procedere con l\'accreditamento devi selezionare un punto che sia nel raggio di ' + radius + ' km">Prosegui Accreditamento</span><p class="typeform-btn-hint">Per poter procedere con l\'accreditamento devi selezionare un punto che sia nel raggio di ' + radius + ' km</p></div>';
  }

  try {
    const { popupHtml, json, jsonStr } = await Nominatim.fetchReverseGeocode(lat, lng);
    if (CONFIG.debug) debugNominatim.textContent = jsonStr;
    const tappe = getTappeInCircle(lat, lng, clickCircleRadiusKm * 1000);
    const tappeHtml = formatTappeContent(tappe);
    var typeformHtml = buildTypeformButtonHtml(json && json.address ? { ...json.address, display_name: json.display_name } : null, lat, lng, tappe);
    const insertPos = popupHtml.lastIndexOf('</div>');
    var contentToInsert = tappeHtml + typeformHtml;
    const finalHtml = insertPos >= 0
      ? popupHtml.slice(0, insertPos) + contentToInsert + popupHtml.slice(insertPos)
      : popupHtml + contentToInsert;
    popup.setContent(finalHtml);
  } catch (err) {
    if (CONFIG.debug) debugNominatim.textContent = 'Errore: ' + err.message;
    let errHtml = Nominatim.formatErrorHtml(lat, lng, err);
    const tappe = getTappeInCircle(lat, lng, clickCircleRadiusKm * 1000);
    const tappeHtml = formatTappeContent(tappe);
    var typeformHtml = buildTypeformButtonHtml(null, lat, lng, tappe);
    const insertPos = errHtml.lastIndexOf('</div>');
    var contentToInsert = tappeHtml + typeformHtml;
    errHtml = insertPos >= 0 ? errHtml.slice(0, insertPos) + contentToInsert + errHtml.slice(insertPos) : errHtml + contentToInsert;
    popup.setContent(errHtml);
  }
});
