require("dotenv").config();

const fs = require("fs");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const {
  logger, requestLogger, requestId,
  errorHandler, authMiddleware,
} = require("./middleware");

const exportRoutes = require("./routes/export-routes");
const missionRoutes = require("./routes/mission-routes");
const { createElevenLabsRoutes } = require("./routes/elevenlabs-routes");
const { createDubbingRoutes } = require("./routes/dubbing-routes");
const { runMigrations, closePool } = require("./services/db-service");

const app = express();
const PORT = process.env.PORT || 5577;
const OUTPUT_DIR = process.env.EXPORT_OUTPUT_DIR || "/var/www/voisss-exports";

// ── Security headers ────────────────────────────────────────────────
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

// ── CORS ────────────────────────────────────────────────────────────
// Allowlist comes from env in production (comma-separated); the hardcoded
// list below is a development convenience only.
const DEV_ORIGINS = [
  "http://localhost:4445",
  "http://localhost:3000",
];
const prodOrigins = (process.env.CORS_ORIGINS || "https://voisss.netlify.app,https://voisss.app")
  .split(",")
  .map(o => o.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === "production") {
  prodOrigins.forEach(origin => {
    if (origin.startsWith("http://")) {
      logger.warn({ origin }, "Insecure (http://) origin in CORS allowlist");
    }
  });
}
const allowedOrigins = process.env.NODE_ENV === "production"
  ? prodOrigins
  : [...new Set([...prodOrigins, ...DEV_ORIGINS])];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-API-Key", "X-Request-Id"]
}));

app.use(requestId);
app.use(requestLogger);
app.use(express.json());

if (fs.existsSync(OUTPUT_DIR)) {
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

// ── Rate limits ─────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_API_MAX || "100", 10),
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
  max: parseInt(process.env.RATE_LIMIT_TRANSFORM_MAX || "10", 10),
  standardHeaders: true,
  legacyHeaders: false
});

// ── Routes ──────────────────────────────────────────────────────────
// Auth is fail-closed: protected routes require API_KEYS entries (see
// middleware/auth.js). Public/capability paths are allowlisted there.
app.use("/api", apiLimiter, authMiddleware);

app.use("/api/export", exportRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api", createElevenLabsRoutes({ transformLimiter }));
app.use("/api/dubbing", createDubbingRoutes());

logger.info("Routes mounted");

app.use(errorHandler);

async function startServer() {
  try {
    if (process.env.NODE_ENV === "production"
      && !(process.env.API_KEYS || "").trim()
      && process.env.ALLOW_UNAUTHENTICATED_DEV !== "true") {
      throw new Error(
        "Refusing to start in production with no API_KEYS configured. " +
        "Set API_KEYS=name:key,... (see .env.example)."
      );
    }

    await runMigrations();

    const HOST = process.env.HOST || "127.0.0.1";
    const server = app.listen(PORT, HOST, () => {
      logger.info(
        `\n${"=".repeat(60)}\n` +
        `VOISSS Processing Service running on ${HOST}:${PORT}\n` +
        `Health check: http://localhost:${PORT}/health\n` +
        `Environment: ${process.env.NODE_ENV || "development"}\n` +
        `Auth: ${require("./middleware/auth")._internals.getConfig().apiKeys.size > 0 ? "enabled" : "DISABLED"}\n` +
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

module.exports = app;
