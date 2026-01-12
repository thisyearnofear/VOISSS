require("dotenv").config();
const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');
const exportRoutes = require('./routes/export-routes');
const { runMigrations, closePool } = require('./services/db-service');

const app = express();
const PORT = process.env.PORT || 5577;
const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;
const path = require('path');
const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || '/var/www/voisss-exports';

// Middleware
app.use(cors({
  origin: [
    "https://voisss.netlify.app",
    "https://voisss.vercel.app",
    "https://voisss.app",
    "https://voisss.famile.xyz",
    "http://voisss.famile.xyz",
    "http://localhost:4445",
    "http://localhost:3000"
  ],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Serve exports publicly
if (require('fs').existsSync(OUTPUT_DIR)) {
  console.log(`📂 Serving exports from: ${OUTPUT_DIR}`);
  app.use('/exports', express.static(OUTPUT_DIR));
}

// Override default CSP for API endpoints (allow all origins for API)
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self' *; connect-src 'self' *; media-src 'self' *; img-src 'self' * data:;");
  next();
});

// Setup routes
console.log('📝 Mounting export routes...');
app.use('/api/export', exportRoutes);
console.log('✅ All routes mounted');


// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// List voices endpoint
app.get('/api/voices', async (req, res) => {
  try {
    const response = await fetch(`${ELEVEN_API_BASE}/voices`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error (list voices):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).json({
        error: 'Failed to fetch voices',
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error listing voices:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Speech-to-speech transformation endpoint
app.post('/api/transform', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const { voiceId, modelId = 'eleven_multilingual_sts_v2', outputFormat = 'mp3_44100_128' } = req.body;

    if (!voiceId) {
      return res.status(400).json({ error: 'voiceId is required' });
    }

    console.log('Transform request:', {
      voiceId,
      modelId,
      outputFormat,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Prepare form data for ElevenLabs
    const form = new FormData();
    form.append('model_id', modelId);
    form.append('output_format', outputFormat);

    // Normalize MIME type
    const normalizedType = (req.file.mimetype || 'audio/webm').split(';')[0];
    const filename = normalizedType.includes('webm') ? 'input.webm' :
      normalizedType.includes('ogg') ? 'input.ogg' :
        normalizedType.includes('mpeg') || normalizedType.includes('mp3') ? 'input.mp3' :
          'input';

    form.append('audio', req.file.buffer, {
      filename,
      contentType: normalizedType
    });

    // Make request to ElevenLabs with extended timeout
    const response = await fetch(`${ELEVEN_API_BASE}/speech-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form,
      timeout: 120000 // 120 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error (transform):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        voiceId,
        modelId
      });
      return res.status(response.status).json({
        error: 'Voice transformation failed',
        details: errorText
      });
    }

    // Stream the audio response back
    const audioBuffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

    console.log('Transform successful:', {
      voiceId,
      outputSize: audioBuffer.length
    });

  } catch (error) {
    console.error('Error in transform:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Start dubbing job endpoint
app.post('/api/dubbing/start', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const {
      targetLanguage,
      sourceLanguage,
      modelId,
      preserveBackgroundAudio
    } = req.body;

    if (!targetLanguage) {
      return res.status(400).json({ error: 'targetLanguage is required' });
    }

    console.log('Dubbing start request:', {
      targetLanguage,
      sourceLanguage,
      modelId,
      fileSize: req.file.size,
      mimeType: req.file.mimetype
    });

    // Prepare form data
    const form = new FormData();
    const normalizedType = (req.file.mimetype || 'audio/webm').split(';')[0];
    const filename = normalizedType.includes('webm') ? 'input.webm' :
      normalizedType.includes('ogg') ? 'input.ogg' :
        normalizedType.includes('mpeg') || normalizedType.includes('mp3') ? 'input.mp3' :
          'input';

    form.append('file', req.file.buffer, {
      filename,
      contentType: normalizedType
    });
    form.append('target_lang', targetLanguage);

    if (sourceLanguage) {
      form.append('source_lang', sourceLanguage);
    }
    if (modelId) {
      form.append('model_id', modelId);
    }
    if (preserveBackgroundAudio !== undefined) {
      form.append('drop_background_audio', String(!preserveBackgroundAudio));
    }

    // Create dubbing job
    const response = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form,
      timeout: 120000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error (dubbing start):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      return res.status(response.status).json({
        error: 'Failed to start dubbing job',
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);

    console.log('Dubbing job started:', {
      dubbingId: data.dubbing_id,
      targetLanguage
    });

  } catch (error) {
    console.error('Error starting dubbing:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get dubbing status endpoint
app.get('/api/dubbing/:dubbingId/status', async (req, res) => {
  try {
    const { dubbingId } = req.params;

    const response = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 30000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error (dubbing status):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        dubbingId
      });
      return res.status(response.status).json({
        error: 'Failed to get dubbing status',
        details: errorText
      });
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Error getting dubbing status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Get dubbed audio endpoint
app.get('/api/dubbing/:dubbingId/audio/:targetLanguage', async (req, res) => {
  try {
    const { dubbingId, targetLanguage } = req.params;

    const response = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 60000
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs API Error (dubbed audio):', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        dubbingId,
        targetLanguage
      });
      return res.status(response.status).json({
        error: 'Failed to fetch dubbed audio',
        details: errorText
      });
    }

    // Stream the audio response back
    const audioBuffer = await response.buffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(audioBuffer);

    console.log('Dubbed audio retrieved:', {
      dubbingId,
      targetLanguage,
      outputSize: audioBuffer.length
    });

  } catch (error) {
    console.error('Error getting dubbed audio:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Complete dubbing endpoint (handles full async process)
app.post('/api/dubbing/complete', upload.single('audio'), async (req, res) => {
  try {
    const { targetLanguage, sourceLanguage, preserveBackgroundAudio } = req.body;
    const audioFile = req.file;

    if (!audioFile) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    if (!targetLanguage) {
      return res.status(400).json({ error: 'Target language is required' });
    }

    console.log('Complete dubbing request:', {
      targetLanguage,
      sourceLanguage,
      fileSize: audioFile.size,
      mimeType: audioFile.mimetype
    });

    // Step 1: Start dubbing job
    const form = new FormData();
    form.append('file', audioFile.buffer, {
      filename: audioFile.originalname || 'audio.wav',
      contentType: audioFile.mimetype || 'audio/wav'
    });
    form.append('target_lang', targetLanguage);

    if (sourceLanguage && sourceLanguage !== 'auto') {
      form.append('source_lang', sourceLanguage);
    }
    if (preserveBackgroundAudio !== undefined) {
      form.append('drop_background_audio', String(!preserveBackgroundAudio));
    }

    const startResponse = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        ...form.getHeaders()
      },
      body: form,
      timeout: 120000
    });

    if (!startResponse.ok) {
      const errorText = await startResponse.text();
      console.error('ElevenLabs API Error (complete dubbing start):', errorText);

      if (errorText.includes('invalid_workspace_type')) {
        return res.status(402).json({
          error: 'ElevenLabs workspace upgrade required',
          message: 'Your ElevenLabs API key is on a legacy workspace that doesn\'t support the dubbing API.',
          code: 'LEGACY_WORKSPACE'
        });
      }

      return res.status(startResponse.status).json({
        error: 'Failed to start dubbing job',
        details: errorText
      });
    }

    const startData = await startResponse.json();
    const dubbingId = startData.dubbing_id;
    console.log('Complete dubbing job started:', { dubbingId, targetLanguage });

    // Step 2: Poll for completion
    const pollStart = Date.now();
    const maxWaitMs = 180_000; // 3 minutes
    const pollIntervalMs = 2000; // 2 seconds
    let status = 'dubbing';
    let pollCount = 0;

    while (status !== 'dubbed') {
      const elapsed = Date.now() - pollStart;

      if (elapsed > maxWaitMs) {
        return res.status(408).json({
          error: 'Dubbing timeout',
          message: `Dubbing took longer than expected (${Math.round(elapsed / 1000)}s)`,
          dubbingId
        });
      }

      await new Promise(r => setTimeout(r, pollIntervalMs));

      const statusResponse = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
        headers: { 'xi-api-key': API_KEY },
        timeout: 30000
      });

      if (!statusResponse.ok) {
        console.error('Status check failed:', statusResponse.status);
        continue; // Retry status check
      }

      const statusData = await statusResponse.json();
      status = statusData.status;
      pollCount++;

      if (status === 'failed') {
        return res.status(500).json({
          error: 'Dubbing job failed',
          details: statusData.error || 'Unknown error'
        });
      }

      if (pollCount % 10 === 0) {
        console.log(`Complete dubbing progress: ${Math.round(elapsed / 1000)}s elapsed, status: ${status}`);
      }
    }

    // Step 3: Get final audio
    const audioResponse = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`, {
      headers: { 'xi-api-key': API_KEY },
      timeout: 60000
    });

    if (!audioResponse.ok) {
      const errorText = await audioResponse.text();
      console.error('Failed to retrieve dubbed audio:', errorText);
      return res.status(audioResponse.status).json({
        error: 'Failed to retrieve dubbed audio',
        details: errorText
      });
    }

    const audioBuffer = await audioResponse.buffer();
    const audioBase64 = audioBuffer.toString('base64');

    console.log('Complete dubbing finished:', {
      dubbingId,
      targetLanguage,
      outputSize: audioBuffer.length,
      processingTime: Date.now() - pollStart
    });

    res.json({
      audio_base64: audioBase64,
      content_type: 'audio/mpeg',
      target_language: targetLanguage,
      processing_time: Date.now() - pollStart,
      dubbingId
    });

  } catch (error) {
    console.error('Error in complete dubbing:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

/**
 * Initialize database and start server
 */
async function startServer() {
  try {
    // Run pending migrations
    await runMigrations();

    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`VOISSS Processing Service running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(`Export API: POST /api/export/request`);
      console.log(`Export Status: GET /api/export/:jobId/status`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`${'='.repeat(60)}\n`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\nSIGTERM received, shutting down gracefully...');
      server.close(() => console.log('Server closed'));
      await closePool();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT received, shutting down gracefully...');
      server.close(() => console.log('Server closed'));
      await closePool();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();