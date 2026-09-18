/**
 * ElevenLabs dubbing routes.
 *
 * Async-first: /dubbing/start returns a job id immediately; clients poll
 * /dubbing/:id/status and fetch /dubbing/:id/audio/:lang.
 *
 * /dubbing/complete used to hold an HTTP request open for up to 180s while
 * polling ElevenLabs inline — a connection-exhaustion hazard. It now behaves
 * as an alias for /dubbing/start (202 + job reference). Any legacy client can
 * simply poll; a Deprecation header marks the endpoint.
 */
const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const { asyncHandler, logger } = require('../middleware');
const { uploadAudio } = require('../lib/upload');

const ELEVEN_API_BASE = process.env.ELEVEN_API_BASE || 'https://api.elevenlabs.io/v1';

function buildDubbingForm(file, { targetLanguage, sourceLanguage, modelId, preserveBackgroundAudio }) {
  const form = new FormData();
  const normalizedType = (file.mimetype || 'audio/webm').split(';')[0];
  form.append('file', file.buffer, {
    filename: `input.${normalizedType.includes('ogg') ? 'ogg' : 'webm'}`,
    contentType: normalizedType,
  });
  form.append('target_lang', targetLanguage);
  if (sourceLanguage && sourceLanguage !== 'auto') form.append('source_lang', sourceLanguage);
  if (modelId) form.append('model_id', modelId);
  if (preserveBackgroundAudio !== undefined) {
    form.append('drop_background_audio', String(preserveBackgroundAudio === false || preserveBackgroundAudio === 'false'));
  }
  return form;
}

async function startElevenDubbing(file, opts) {
  const form = buildDubbingForm(file, opts);
  const response = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
    method: 'POST',
    headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, ...form.getHeaders() },
    body: form,
    timeout: 120000,
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (errorText.includes('invalid_workspace_type')) {
      const err = new Error('ElevenLabs workspace upgrade required');
      err.statusCode = 402;
      err.code = 'LEGACY_WORKSPACE';
      err.isOperational = true;
      throw err;
    }
    const err = new Error('Failed to start dubbing job');
    err.statusCode = response.status;
    err.code = 'DUBBING_ERROR';
    err.isOperational = true;
    throw err;
  }

  return response.json();
}

function createDubbingRoutes() {
  const router = express.Router();

  router.post('/start', uploadAudio.single('audio'), asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided', code: 'MISSING_FILE' });
    }
    const { targetLanguage } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ error: 'targetLanguage is required', code: 'MISSING_LANGUAGE' });
    }

    logger.info({ targetLanguage, fileSize: req.file.size }, 'Dubbing start');
    const data = await startElevenDubbing(req.file, req.body);
    res.json(data);
  }));

  // Deprecated synchronous-style alias: now returns 202 + polling references.
  router.post('/complete', uploadAudio.single('audio'), asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided', code: 'MISSING_FILE' });
    }
    const { targetLanguage } = req.body;
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required', code: 'MISSING_LANGUAGE' });
    }

    logger.info({ targetLanguage }, 'Dubbing complete (deprecated sync alias) -> async job');
    const data = await startElevenDubbing(req.file, req.body);
    const dubbingId = data.dubbing_id;

    res.set('Deprecation', 'true');
    res.status(202).json({
      dubbingId,
      statusUrl: `/api/dubbing/${dubbingId}/status`,
      audioUrl: `/api/dubbing/${dubbingId}/audio/${targetLanguage}`,
      message: 'Dubbing started. Poll statusUrl until status=dubbed, then fetch audioUrl.',
    });
  }));

  router.get('/:dubbingId/status', asyncHandler(async (req, res) => {
    const { dubbingId } = req.params;
    const response = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      timeout: 30000,
    });

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to get dubbing status',
        code: 'DUBBING_ERROR',
      });
    }
    res.json(await response.json());
  }));

  router.get('/:dubbingId/audio/:targetLanguage', asyncHandler(async (req, res) => {
    const { dubbingId, targetLanguage } = req.params;
    const response = await fetch(
      `${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`,
      { headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY }, timeout: 60000 },
    );

    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to fetch dubbed audio',
        code: 'DUBBING_ERROR',
      });
    }
    const audioBuffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);
  }));

  return router;
}

module.exports = { createDubbingRoutes };
