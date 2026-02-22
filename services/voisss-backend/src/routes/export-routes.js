const express = require('express');
const multer = require('multer');
const { enqueueExport, getJobStatus, getUserJobs } = require('../services/export-service');
const { asyncHandler, NotFoundError, logger } = require('../middleware');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validate');

const router = express.Router();
const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['audio/webm', 'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4'];
    if (allowedMimes.some(mime => file.mimetype.includes(mime.split('/')[1]))) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}`), false);
    }
  }
});

router.post('/request', upload.single('audio'), asyncHandler(async (req, res) => {
  let kind, audioUrl, transcriptId, templateId, manifest, style, userId, audioBlob;
  let parsedTemplate = null;

  if (req.file) {
    kind = req.body.kind;
    transcriptId = req.body.transcriptId;
    templateId = req.body.templateId;
    audioBlob = req.file.buffer;

    logger.debug({ kind, transcriptId, fileSize: req.file.size }, 'Export request with file');

    if (req.body.manifest) {
      try {
        manifest = JSON.parse(req.body.manifest);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid manifest JSON', code: 'INVALID_MANIFEST' });
      }
    }

    if (req.body.template) {
      try {
        parsedTemplate = typeof req.body.template === 'string' 
          ? JSON.parse(req.body.template) 
          : req.body.template;
      } catch (e) {
        logger.warn({ error: e.message }, 'Template parse error');
      }
    }

    if (req.body.style) {
      try {
        style = typeof req.body.style === 'string' 
          ? JSON.parse(req.body.style) 
          : req.body.style;
      } catch (e) {
        logger.warn({ error: e.message }, 'Style parse error');
      }
    }
  } else {
    ({ kind, audioUrl, transcriptId, templateId, manifest, style, userId } = req.body);
    if (req.body.template) {
      parsedTemplate = typeof req.body.template === 'string' 
        ? JSON.parse(req.body.template) 
        : req.body.template;
    }
  }

  if (!kind || !transcriptId) {
    return res.status(400).json({
      error: 'Missing required fields: kind, transcriptId',
      code: 'MISSING_FIELDS'
    });
  }

  if (!['mp3', 'mp4'].includes(kind)) {
    return res.status(400).json({
      error: 'Invalid kind. Must be "mp3" or "mp4"',
      code: 'INVALID_KIND'
    });
  }

  if (!audioUrl && !audioBlob) {
    return res.status(400).json({
      error: 'Either audioUrl or audio file is required',
      code: 'MISSING_AUDIO'
    });
  }

  if (kind === 'mp4') {
    if (!manifest) {
      return res.status(400).json({
        error: 'MP4 export requires manifest with segment timing',
        code: 'MISSING_MANIFEST'
      });
    }

    const lastSegment = manifest.segments?.[manifest.segments.length - 1];
    if (lastSegment && lastSegment.endMs > 65000) {
      return res.status(400).json({
        error: `Export too long (${(lastSegment.endMs / 1000).toFixed(1)}s). Maximum 60 seconds allowed.`,
        code: 'DURATION_EXCEEDED'
      });
    }
  }

  const result = await enqueueExport({
    kind,
    audioUrl,
    audioBlob,
    transcriptId,
    templateId,
    template: parsedTemplate,
    manifest,
    style,
    userId: userId || req.user?.id || 'anonymous'
  });

  logger.info({ jobId: result.jobId }, 'Export enqueued');
  res.status(202).json(result);
}));

router.get('/:jobId/status', 
  validateParams(schemas.jobId),
  asyncHandler(async (req, res) => {
    const { jobId } = req.params;

    const status = await getJobStatus(jobId);

    if (!status) {
      throw new NotFoundError('Job not found');
    }

    res.json(status);
  })
);

router.get('/user/:userId',
  validateParams(schemas.userId),
  validateQuery(schemas.pagination),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { limit, offset } = req.query;

    const jobs = await getUserJobs(userId, limit, offset);
    res.json(jobs);
  })
);

module.exports = router;
