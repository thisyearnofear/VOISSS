require("dotenv").config();

const express = require("express");
const multer = require("multer");
const FormData = require("form-data");
const fetch = require("node-fetch");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const { 
  logger, requestLogger, requestId, 
  errorHandler, asyncHandler, 
  authMiddleware 
} = require("./middleware");

const exportRoutes = require("./routes/export-routes");
const missionRoutes = require("./routes/mission-routes");
const { runMigrations, closePool } = require("./services/db-service");

const app = express();
const PORT = process.env.PORT || 5577;
const ELEVEN_API_BASE = "https://api.elevenlabs.io/v1";
const API_KEY = process.env.ELEVENLABS_API_KEY;
const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || "/var/www/voisss-exports";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
      retryAfter: 60
    });
  }
});

const transformLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      mediaSrc: ["'self'", "*"],
      imgSrc: ["'self'", "*", "data:"],
      connectSrc: ["'self'", "*"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

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
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-Id"]
}));

app.use(requestId);
app.use(requestLogger);
app.use(express.json());

if (require("fs").existsSync(OUTPUT_DIR)) {
  logger.info({ outputDir: OUTPUT_DIR }, "Serving exports");
  app.use("/exports", express.static(OUTPUT_DIR));
}

app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.use("/api", apiLimiter, authMiddleware);

logger.info("Mounting routes...");
app.use("/api/export", exportRoutes);
app.use("/api/missions", missionRoutes);
logger.info("Routes mounted");

app.get("/api/voices", asyncHandler(async (req, res) => {
  const response = await fetch(`${ELEVEN_API_BASE}/voices`, {
    headers: { "xi-api-key": API_KEY },
    timeout: 30000
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, body: errorText }, "ElevenLabs API error");
    return res.status(response.status).json({
      error: "Failed to fetch voices",
      code: "ELEVENLABS_ERROR"
    });
  }

  const data = await response.json();
  res.json(data);
}));

app.post("/api/transform", transformLimiter, upload.single("audio"), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided", code: "MISSING_FILE" });
  }

  const { voiceId, modelId = "eleven_multilingual_sts_v2", outputFormat = "mp3_44100_128" } = req.body;

  if (!voiceId) {
    return res.status(400).json({ error: "voiceId is required", code: "MISSING_VOICE_ID" });
  }

  logger.info({ voiceId, modelId, fileSize: req.file.size }, "Transform request");

  const form = new FormData();
  form.append("model_id", modelId);
  form.append("output_format", outputFormat);

  const normalizedType = (req.file.mimetype || "audio/webm").split(";")[0];
  const extension = normalizedType.includes("webm") ? "webm" 
    : normalizedType.includes("ogg") ? "ogg"
    : normalizedType.includes("mpeg") || normalizedType.includes("mp3") ? "mp3" 
    : "bin";

  form.append("audio", req.file.buffer, {
    filename: `input.${extension}`,
    contentType: normalizedType
  });

  const response = await fetch(`${ELEVEN_API_BASE}/speech-to-speech/${voiceId}`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, ...form.getHeaders() },
    body: form,
    timeout: 120000
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status, voiceId }, "Transform failed");
    return res.status(response.status).json({
      error: "Voice transformation failed",
      code: "TRANSFORM_ERROR"
    });
  }

  const audioBuffer = await response.buffer();
  res.set("Content-Type", "audio/mpeg");
  res.send(audioBuffer);

  logger.info({ voiceId, outputSize: audioBuffer.length }, "Transform complete");
}));

app.post("/api/dubbing/start", upload.single("audio"), asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No audio file provided", code: "MISSING_FILE" });
  }

  const { targetLanguage, sourceLanguage, modelId, preserveBackgroundAudio } = req.body;

  if (!targetLanguage) {
    return res.status(400).json({ error: "targetLanguage is required", code: "MISSING_LANGUAGE" });
  }

  logger.info({ targetLanguage, fileSize: req.file.size }, "Dubbing start");

  const form = new FormData();
  const normalizedType = (req.file.mimetype || "audio/webm").split(";")[0];
  
  form.append("file", req.file.buffer, {
    filename: "input.webm",
    contentType: normalizedType
  });
  form.append("target_lang", targetLanguage);

  if (sourceLanguage) form.append("source_lang", sourceLanguage);
  if (modelId) form.append("model_id", modelId);
  if (preserveBackgroundAudio !== undefined) {
    form.append("drop_background_audio", String(!preserveBackgroundAudio));
  }

  const response = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, ...form.getHeaders() },
    body: form,
    timeout: 120000
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error({ status: response.status }, "Dubbing start failed");
    return res.status(response.status).json({
      error: "Failed to start dubbing job",
      code: "DUBBING_ERROR"
    });
  }

  const data = await response.json();
  res.json(data);
}));

app.get("/api/dubbing/:dubbingId/status", asyncHandler(async (req, res) => {
  const { dubbingId } = req.params;

  const response = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
    headers: { "xi-api-key": API_KEY },
    timeout: 30000
  });

  if (!response.ok) {
    return res.status(response.status).json({
      error: "Failed to get dubbing status",
      code: "DUBBING_ERROR"
    });
  }

  const data = await response.json();
  res.json(data);
}));

app.get("/api/dubbing/:dubbingId/audio/:targetLanguage", asyncHandler(async (req, res) => {
  const { dubbingId, targetLanguage } = req.params;

  const response = await fetch(
    `${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`,
    { headers: { "xi-api-key": API_KEY }, timeout: 60000 }
  );

  if (!response.ok) {
    return res.status(response.status).json({
      error: "Failed to fetch dubbed audio",
      code: "DUBBING_ERROR"
    });
  }

  const audioBuffer = await response.buffer();
  res.set("Content-Type", "audio/mpeg");
  res.send(audioBuffer);
}));

app.post("/api/dubbing/complete", upload.single("audio"), asyncHandler(async (req, res) => {
  const { targetLanguage, sourceLanguage, preserveBackgroundAudio } = req.body;
  const audioFile = req.file;

  if (!audioFile) {
    return res.status(400).json({ error: "No audio file provided", code: "MISSING_FILE" });
  }
  if (!targetLanguage) {
    return res.status(400).json({ error: "Target language is required", code: "MISSING_LANGUAGE" });
  }

  const form = new FormData();
  form.append("file", audioFile.buffer, {
    filename: audioFile.originalname || "audio.wav",
    contentType: audioFile.mimetype || "audio/wav"
  });
  form.append("target_lang", targetLanguage);

  if (sourceLanguage && sourceLanguage !== "auto") {
    form.append("source_lang", sourceLanguage);
  }
  if (preserveBackgroundAudio !== undefined) {
    form.append("drop_background_audio", String(!preserveBackgroundAudio));
  }

  const startResponse = await fetch(`${ELEVEN_API_BASE}/dubbing`, {
    method: "POST",
    headers: { "xi-api-key": API_KEY, ...form.getHeaders() },
    body: form,
    timeout: 120000
  });

  if (!startResponse.ok) {
    const errorText = await startResponse.text();

    if (errorText.includes("invalid_workspace_type")) {
      return res.status(402).json({
        error: "ElevenLabs workspace upgrade required",
        code: "LEGACY_WORKSPACE"
      });
    }

    return res.status(startResponse.status).json({
      error: "Failed to start dubbing job",
      code: "DUBBING_ERROR"
    });
  }

  const startData = await startResponse.json();
  const dubbingId = startData.dubbing_id;
  const pollStart = Date.now();
  const maxWaitMs = 180_000;
  const pollIntervalMs = 2000;
  let status = "dubbing";

  while (status !== "dubbed") {
    const elapsed = Date.now() - pollStart;

    if (elapsed > maxWaitMs) {
      return res.status(408).json({
        error: "Dubbing timeout",
        code: "TIMEOUT",
        dubbingId
      });
    }

    await new Promise(r => setTimeout(r, pollIntervalMs));

    const statusResponse = await fetch(`${ELEVEN_API_BASE}/dubbing/${dubbingId}`, {
      headers: { "xi-api-key": API_KEY },
      timeout: 30000
    });

    if (!statusResponse.ok) continue;

    const statusData = await statusResponse.json();
    status = statusData.status;

    if (status === "failed") {
      return res.status(500).json({
        error: "Dubbing job failed",
        code: "DUBBING_FAILED"
      });
    }
  }

  const audioResponse = await fetch(
    `${ELEVEN_API_BASE}/dubbing/${dubbingId}/audio/${targetLanguage}`,
    { headers: { "xi-api-key": API_KEY }, timeout: 60000 }
  );

  if (!audioResponse.ok) {
    return res.status(audioResponse.status).json({
      error: "Failed to retrieve dubbed audio",
      code: "DUBBING_ERROR"
    });
  }

  const audioBuffer = await audioResponse.buffer();

  res.json({
    audio_base64: audioBuffer.toString("base64"),
    content_type: "audio/mpeg",
    target_language: targetLanguage,
    processing_time: Date.now() - pollStart,
    dubbingId
  });
}));

app.use(errorHandler);

async function startServer() {
  try {
    await runMigrations();

    const server = app.listen(PORT, "0.0.0.0", () => {
      logger.info(
        `\n${"=".repeat(60)}\n` +
        `VOISSS Processing Service running on port ${PORT}\n` +
        `Health check: http://localhost:${PORT}/health\n` +
        `Environment: ${process.env.NODE_ENV || "development"}\n` +
        `${"=".repeat(60)}\n`
      );
    });

    const shutdown = async (signal) => {
      logger.info(`${signal} received, shutting down...`);
      server.close(() => logger.info("Server closed"));
      await closePool();
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error(error, "Failed to start server");
    process.exit(1);
  }
}

startServer();
