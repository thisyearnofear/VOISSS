/**
 * Export Routes
 * API endpoints for export operations
 * PRINCIPLE: MODULAR - Routes delegate to services
 * PRINCIPLE: CLEAN - Clear request/response contracts
 * PRINCIPLE: AGGRESSIVE CONSOLIDATION - Database-driven, no queues
 */

const express = require('express');
const multer = require('multer');
const { enqueueExport, getJobStatus, getUserJobs } = require('../services/export-service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/export/request
 * Create a new export job (saved to database, worker will pick it up)
 * 
 * Supports two formats:
 * 1. JSON with audioUrl (for external URLs)
 * 2. Multipart form-data with audio file (for uploads)
 */
router.post('/request', upload.single('audio'), async (req, res) => {
  try {
    console.log(`📝 Export request received`);
    console.log(`   Audio file: ${req.file ? req.file.size + ' bytes' : 'none'}`);

    let kind, audioUrl, transcriptId, templateId, manifest, style, userId, audioBlob;
    let parsedTemplate = null;

    // Handle multipart/form-data (file upload)
    if (req.file) {
      kind = req.body.kind;
      transcriptId = req.body.transcriptId;
      templateId = req.body.templateId;
      audioBlob = req.file.buffer;

      console.log(`   Kind: ${kind}, TranscriptId: ${transcriptId}`);

      if (req.body.manifest) {
        try {
          manifest = JSON.parse(req.body.manifest);
        } catch (e) {
          manifest = req.body.manifest;
        }
      }

      if (req.body.template) {
        try {
          parsedTemplate = typeof req.body.template === 'string' ? JSON.parse(req.body.template) : req.body.template;
        } catch (e) {
          console.error('Template parse error:', e.message);
        }
      }

      if (req.body.style) {
        try {
          style = typeof req.body.style === 'string' ? JSON.parse(req.body.style) : req.body.style;
        } catch (e) {
          console.error('Style parse error:', e.message);
        }
      }
    } else {
      // Handle JSON request (original format)
      ({ kind, audioUrl, transcriptId, templateId, manifest, style, userId } = req.body);
      if (req.body.template) {
        parsedTemplate = typeof req.body.template === 'string' ? JSON.parse(req.body.template) : req.body.template;
      }
    }

    // Validate required fields
    if (!kind || !transcriptId) {
      return res.status(400).json({
        error: 'Missing required fields: kind, transcriptId',
      });
    }

    if (!audioUrl && !audioBlob) {
      return res.status(400).json({
        error: 'Either audioUrl or audio file is required',
      });
    }

    // Validate MP4-specific requirements and duration limits
    if (kind === 'mp4') {
      if (!manifest) {
        return res.status(400).json({
          error: 'MP4 export requires manifest with segment timing',
        });
      }

      // Enforce 65s maximum duration (60s + buffer)
      const lastSegment = manifest.segments?.[manifest.segments.length - 1];
      if (lastSegment && lastSegment.endMs > 65000) {
        return res.status(400).json({
          error: `Export too long (${(lastSegment.endMs / 1000).toFixed(1)}s). Maximum 60 seconds allowed.`,
        });
      }
    }

    // Enqueue the job
    const result = await enqueueExport({
      kind,
      audioUrl,
      audioBlob,
      transcriptId,
      templateId,
      template: parsedTemplate,
      manifest,
      style,
      userId: userId || req.user?.id || 'anonymous',
    });

    console.log(`✅ Export enqueued: ${result.jobId}`);
    res.status(202).json(result); // 202 Accepted
  } catch (error) {
    console.error('Export request failed:', error.message);
    console.error('Stack:', error.stack);
    res.status(400).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/export/:jobId/status
 * Get job status and result
 */
router.get('/:jobId/status', async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`📊 Status request for: ${jobId}`);

    const status = await getJobStatus(jobId);

    if (!status) {
      console.log(`⚠️  Job not found: ${jobId}`);
      return res.status(404).json({
        error: 'Job not found',
      });
    }

    console.log(`✅ Status retrieved: ${jobId} - ${status.status}`);
    res.json(status);
  } catch (error) {
    console.error('Status request failed:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      error: error.message,
    });
  }
});

/**
 * GET /api/export/user/:userId
 * List export jobs for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const jobs = await getUserJobs(userId, parseInt(limit), parseInt(offset));
    res.json(jobs);
  } catch (error) {
    console.error('User jobs request failed:', error);
    res.status(500).json({
      error: error.message,
    });
  }
});

module.exports = router;
