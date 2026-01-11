/**
 * Export Routes
 * API endpoints for export operations
 * PRINCIPLE: MODULAR - Routes delegate to services
 * PRINCIPLE: CLEAN - Clear request/response contracts
 */

const express = require('express');
const multer = require('multer');
const { enqueueExport, getJobStatus, getUserJobs } = require('../services/export-service');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

/**
 * POST /api/export/request
 * Enqueue a new export job
 * 
 * Supports two formats:
 * 1. JSON with audioUrl (for external URLs)
 * 2. Multipart form-data with audio file (for uploads)
 */
router.post('/request', upload.single('audio'), async (req, res) => {
  try {
    console.log(`📝 Export request received`);
    console.log(`   req.file exists:`, !!req.file);
    if (req.file) {
      console.log(`   Audio file size: ${req.file.size || req.file.buffer?.length} bytes`);
    }
    
    let kind, audioUrl, transcriptId, templateId, manifest, style, userId, audioBlob;

    // Handle multipart/form-data (file upload)
    if (req.file) {
      kind = req.body.kind;
      transcriptId = req.body.transcriptId;
      templateId = req.body.templateId;
      audioBlob = req.file.buffer;
      
      console.log(`   Kind: ${kind}, TranscriptId: ${transcriptId}`);
      console.log(`   AudioBlob size: ${audioBlob?.length} bytes`);

      if (req.body.manifest) {
        try {
          manifest = JSON.parse(req.body.manifest);
        } catch (e) {
          manifest = req.body.manifest;
        }
      }

      if (req.body.template) {
        try {
          const template = JSON.parse(req.body.template);
          // Extract template fields if needed
        } catch (e) {
          // ignore
        }
      }
    } else {
      // Handle JSON request (original format)
      ({ kind, audioUrl, transcriptId, templateId, manifest, style, userId } = req.body);
      console.log(`   JSON request - audioUrl: ${audioUrl}`);
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
      template: req.body.template ? (typeof req.body.template === 'string' ? JSON.parse(req.body.template) : req.body.template) : null,
      manifest,
      style,
      userId: userId || req.user?.id || 'anonymous',
    });

    res.status(202).json(result); // 202 Accepted
  } catch (error) {
    console.error('Export request failed:', error);
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

    const status = await getJobStatus(jobId);

    if (!status) {
      return res.status(404).json({
        error: 'Job not found',
      });
    }

    res.json(status);
  } catch (error) {
    console.error('Status request failed:', error);
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
