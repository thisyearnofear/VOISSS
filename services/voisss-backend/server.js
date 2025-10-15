const express = require('express');
const multer = require('multer');
const FormData = require('form-data');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5577;
const ELEVEN_API_BASE = 'https://api.elevenlabs.io/v1';
const API_KEY = process.env.ELEVENLABS_API_KEY;

// Middleware
app.use(cors());
app.use(express.json());

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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`VOISSS Processing Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});