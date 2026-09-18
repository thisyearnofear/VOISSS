const express = require('express');
const { enqueueExport, getJobStatus, getUserJobs } = require('../services/export-service');
const { asyncHandler, NotFoundError, ValidationError, logger } = require('../middleware');
const { validateBody, validateParams, validateQuery, schemas } = require('../middleware/validate');
const { uploadAudio } = require('../lib/upload');

const router = express.Router();

router.post('/request', uploadAudio.single('audio'), asyncHandler(async (req, res) => {
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
        throw new ValidationError('Invalid manifest JSON', [{ field: 'manifest', message: e.message }]);
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
    throw new ValidationError('Missing required fields: kind, transcriptId');
  }

  if (!['mp3', 'mp4'].includes(kind)) {
    throw new ValidationError('Invalid kind. Must be "mp3" or "mp4"');
  }

  if (!audioUrl && !audioBlob) {
    throw new ValidationError('Either audioUrl or audio file is required');
  }

  if (kind === 'mp4') {
    if (!manifest) {
      throw new ValidationError('MP4 export requires manifest with segment timing');
    }

    const lastSegment = manifest.segments?.[manifest.segments.length - 1];
    if (lastSegment && lastSegment.endMs > 65000) {
      throw new ValidationError(`Export too long (${(lastSegment.endMs / 1000).toFixed(1)}s). Maximum 60 seconds allowed.`);
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
    userId: userId || req.user?.name || 'anonymous'
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
