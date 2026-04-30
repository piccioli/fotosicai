// exifr is an ES module; use dynamic import
let _exifr = null;
async function getExifr() {
  if (!_exifr) _exifr = (await import('exifr')).default || (await import('exifr'));
  return _exifr;
}

/**
 * Parse EXIF metadata from a Buffer.
 * Returns { gps: {lat, lng} | null, datetime: string | null }.
 */
async function parseExif(buffer) {
  try {
    const ExifReader = await getExifr();
    const data = await ExifReader.parse(buffer, {
      gps: true,
      pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'],
    });
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
