#!/usr/bin/env node
/**
 * ACP listener shim — single source of truth.
 *
 * Historically, services/voisss-backend/src/workers/acp-listener-worker.js
 * was a hand-maintained duplicate of packages/shared/src/services/acp-listener-service.ts.
 * That created drift risk: bug fixes / new offering IDs had to be applied twice.
 *
 * This shim is a ~20-line file whose only job is to delegate to the shared
 * package's `startAcpListenerWorker()` entry point. The PM2 ecosystem config
 * runs this file as the `voisss-acp-listener` process.
 *
 * All behavior — env handling, child_process.spawn of npx acp-cli, job
 * matching, reputation persistence, signal handling — lives in the shared
 * package now.
 */

const { startAcpListenerWorker } = require('@voisss/shared/server');

startAcpListenerWorker().catch((err) => {
  console.error('[ACP Worker] Fatal:', err);
  process.exit(1);
});
