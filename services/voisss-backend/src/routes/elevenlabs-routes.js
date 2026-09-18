/**
 * ElevenLabs proxy routes: voice list + speech-to-speech transform.
 * Moved out of server.js so the app entry stays a thin composition root.
 */
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');

const { asyncHandler, logger } = require('../middleware');
const { uploadAudio } = require('../lib/upload');

const ELEVEN_API_BASE = process.env.ELEVEN_API_BASE || 'https://api.elevenlabs.io/v1';

function createElevenLabsRoutes({ transformLimiter }) {
  const router = express.Router();

  router.get('/voices', asyncHandler(async (req, res) => {
    const response = await fetch(`${ELEVEN_API_BASE}/voices`, {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
      timeout: 30000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, body: errorText.slice(0, 500) }, 'ElevenLabs API error');
      return res.status(response.status).json({
        error: 'Failed to fetch voices',
        code: 'ELEVENLABS_ERROR',
      });
    }

    res.json(await response.json());
  }));

  router.post('/transform', transformLimiter, uploadAudio.single('audio'), asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided', code: 'MISSING_FILE' });
    }

    const { voiceId, modelId = 'eleven_multilingual_sts_v2', outputFormat = 'mp3_44100_128' } = req.body;

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required', code: 'MISSING_VOICE_ID' });
    }

    logger.info({ voiceId, modelId, fileSize: req.file.size }, 'Transform request');

    const form = new FormData();
    form.append('model_id', modelId);
    form.append('output_format', outputFormat);

    const normalizedType = (req.file.mimetype || 'audio/webm').split(';')[0];
    const extension = normalizedType.includes('webm') ? 'webm'
      : normalizedType.includes('ogg') ? 'ogg'
        : normalizedType.includes('mpeg') || normalizedType.includes('mp3') ? 'mp3'
          : 'bin';

    form.append('audio', req.file.buffer, {
      filename: `input.${extension}`,
      contentType: normalizedType,
    });

    const response = await fetch(`${ELEVEN_API_BASE}/speech-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY, ...form.getHeaders() },
      body: form,
      timeout: 120000,
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, voiceId }, 'Transform failed');
      return res.status(response.status).json({
        error: 'Voice transformation failed',
        code: 'TRANSFORM_ERROR',
      });
    }

    const audioBuffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    logger.info({ voiceId, outputSize: audioBuffer.length }, 'Transform complete');
    res.send(audioBuffer);
  }));

  return router;
}

module.exports = { createElevenLabsRoutes };
