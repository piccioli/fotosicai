const sharp = require('sharp');
const { ensureDir, imagePaths, absPath } = require('./storage');

const THUMB_SIZE = 240;
const MEDIUM_MAX = 1200;

/**
 * Process an uploaded image buffer: save original, medium, thumbnail.
 * Returns { paths, width, height }.
 */
async function processImage(buffer, stageRef, imageId) {
  const dir = ensureDir(stageRef, imageId);
  const paths = imagePaths(stageRef, imageId);

  const img = sharp(buffer).rotate(); // auto-rotate from EXIF orientation

  const meta = await img.metadata();

  // Original (re-saved as JPEG, stripping EXIF except orientation already applied)
  await img.clone().jpeg({ quality: 92, mozjpeg: false }).toFile(absPath(paths.original));

  // Medium (max 1200px on longest side)
  await img
    .clone()
    .resize(MEDIUM_MAX, MEDIUM_MAX, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(absPath(paths.medium));

  // Thumbnail (square crop 240x240)
  await img
    .clone()
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'cover', position: 'entropy' })
    .jpeg({ quality: 80 })
    .toFile(absPath(paths.thumbnail));

  return {
    paths,
    width: meta.width || 0,
    height: meta.height || 0,
  };
}

module.exports = { processImage };
