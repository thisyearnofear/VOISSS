/**
 * Shared multer config for audio uploads — single source of truth so the
 * file-size cap and MIME filter cannot drift between mount points.
 */
const multer = require('multer');

const MAX_UPLOAD_BYTES = parseInt(process.env.MAX_UPLOAD_BYTES || String(50 * 1024 * 1024), 10);
const ALLOWED_MIME_PREFIXES = ['audio/'];

const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
  fileFilter: (req, file, cb) => {
    const type = (file.mimetype || '').toLowerCase();
    if (ALLOWED_MIME_PREFIXES.some(prefix => type.startsWith(prefix))) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Audio files only.`), false);
    }
  },
});

module.exports = { uploadAudio, MAX_UPLOAD_BYTES };
