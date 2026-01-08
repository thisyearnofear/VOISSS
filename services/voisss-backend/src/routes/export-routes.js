/**
 * Export Routes
 * API endpoints for export operations
 * PRINCIPLE: MODULAR - Routes delegate to services
 * PRINCIPLE: CLEAN - Clear request/response contracts
 */

const express = require('express');
const { enqueueExport, getJobStatus } = require('../services/export-service');

const router = express.Router();

/**
 * POST /api/export/request
 * Enqueue a new export job
 * 
 * Body: {
 *   kind: 'mp3' | 'mp4' | 'carousel',
 *   audioUrl: string,           // URL to download audio from
 *   transcriptId: string,
 *   templateId?: string,
 *   manifest?: object,          // For MP4: storyboard manifest with segments
 *   style?: object,
 *   userId?: string
 * }
 */
router.post('/request', async (req, res) => {
  try {
    const { kind, audioUrl, transcriptId, templateId, manifest, style, userId } = req.body;

    // Validate required fields
    if (!kind || !audioUrl || !transcriptId) {
      return res.status(400).json({
        error: 'Missing required fields: kind, audioUrl, transcriptId',
      });
    }

    // Validate MP4-specific requirements
    if (kind === 'mp4' && !manifest) {
      return res.status(400).json({
        error: 'MP4 export requires manifest with segment timing',
      });
    }

    // Enqueue the job
    const result = await enqueueExport({
      kind,
      audioUrl,
      transcriptId,
      templateId,
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

module.exports = router;
