const exifr = require('exifr');

/**
 * Parse EXIF metadata from a Buffer.
 * Returns { gps: {lat, lng} | null, datetime: string | null }.
 */
async function parseExif(buffer) {
  try {
    // Note: 'pick' interferes with GPS decimal conversion — parse all and extract below.
    const data = await exifr.parse(buffer, { gps: true });
    if (!data) return { gps: null, datetime: null };

    const lat = data.latitude ?? null;
    const lng = data.longitude ?? null;
    const gps = lat != null && lng != null ? { lat, lng } : null;

    const rawDt = data.DateTimeOriginal || data.CreateDate || null;
    let datetime = null;
    if (rawDt) {
      // EXIF datetime: "YYYY:MM:DD HH:MM:SS" → ISO
      datetime = String(rawDt).replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    }

    return { gps, datetime };
  } catch {
    return { gps: null, datetime: null };
  }
}

module.exports = { parseExif };
