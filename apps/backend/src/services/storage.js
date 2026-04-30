const path = require('path');
const fs = require('fs');

const STORAGE_DIR = () => path.resolve(process.env.STORAGE_DIR || './storage');

function imageDir(stageRef, imageId) {
  const bucket = stageRef || '_unmatched';
  return path.join(STORAGE_DIR(), 'foto', bucket, imageId);
}

function ensureDir(stageRef, imageId) {
  const dir = imageDir(stageRef, imageId);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function imagePaths(stageRef, imageId) {
  return {
    original: `foto/${stageRef || '_unmatched'}/${imageId}/original.jpg`,
    medium: `foto/${stageRef || '_unmatched'}/${imageId}/medium.jpg`,
    thumbnail: `foto/${stageRef || '_unmatched'}/${imageId}/thumb.jpg`,
  };
}

function absPath(relativePath) {
  return path.join(STORAGE_DIR(), relativePath);
}

function deleteImageFiles(stageRef, imageId) {
  const dir = imageDir(stageRef, imageId);
  if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true, force: true });
}

module.exports = { ensureDir, imagePaths, absPath, deleteImageFiles };
