/**
 * Export Service
 * Core export logic: store jobs, track status, manage results
 * PRINCIPLE: ENHANCEMENT FIRST - Single source of truth for export operations
 * PRINCIPLE: DRY - All export logic centralized here
 * PRINCIPLE: AGGRESSIVE CONSOLIDATION - Database-driven, no Bull/Redis
 */

const { query } = require('./db-service');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { assertSafeDownloadUrl } = require('../lib/ssrf');

/**
 * Enqueue an export job by saving to database
 * PRINCIPLE: CLEAN - Clear contract, explicit dependencies
 */
async function enqueueExport({
  kind,
  audioUrl,
  transcriptId,
  templateId,
  template,
  manifest,
  style,
  userId = 'anonymous',
  audioBlob,
}) {
  // Validate input
  if (!['mp3', 'mp4', 'carousel'].includes(kind)) {
    throw new Error(`Invalid export kind: ${kind}`);
  }

  // SSRF guard: client-provided URLs must pass the download allowlist.
  // file:// URLs are only ever produced internally from uploaded blobs.
  if (audioUrl) {
    if (audioUrl.startsWith('file://')) {
      throw new Error('file:// audio URLs are not accepted from clients');
    }
    assertSafeDownloadUrl(audioUrl);
  }

  const jobId = `export_${crypto.randomUUID()}`;

  // If audioBlob is provided, save it and generate audioUrl
  let finalAudioUrl = audioUrl;
  if (audioBlob) {
    finalAudioUrl = await saveAudioBlob(jobId, audioBlob);
  }

  // Insert into database with template data
  await query(
    `INSERT INTO export_jobs 
    (id, user_id, kind, audio_url, transcript_id, template_id, manifest, style, template_data, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())`,
    [jobId, userId, kind, finalAudioUrl, transcriptId, templateId, JSON.stringify(manifest || {}), JSON.stringify(style || {}), JSON.stringify(template || {})]
  );

  const estimatedSeconds = {
    mp3: 60,
    mp4: 300,
    carousel: 2,
  };

  return {
    jobId,
    estimatedSeconds: estimatedSeconds[kind],
    statusUrl: `/api/export/${jobId}/status`,
  };
}

/**
 * Get next pending job for worker.
 *
 * Claim is atomic (UPDATE ... WHERE status='pending' RETURNING) and stamps a
 * lease (locked_at). Failed jobs are retried with exponential backoff up to
 * MAX_ATTEMPTS; exhausted jobs go to 'failed' permanently.
 */
const MAX_ATTEMPTS = parseInt(process.env.EXPORT_MAX_ATTEMPTS || '3', 10);
const BASE_RETRY_MS = 15000; // 15s, 30s, 60s...

async function getNextPendingJob() {
  // Promote due retries first so they compete with fresh jobs in FIFO order.
  await query(
    `UPDATE export_jobs
     SET status = 'pending', updated_at = NOW()
     WHERE status = 'retry' AND next_retry_at <= NOW()`,
  );

  // Try a fresh claim.
  const claim = await query(
    `UPDATE export_jobs
     SET status = 'processing', locked_at = NOW(), attempts = attempts + 1, updated_at = NOW()
     WHERE id = (
       SELECT id FROM export_jobs
       WHERE status = 'pending'
         AND (next_retry_at IS NULL OR next_retry_at <= NOW())
       ORDER BY created_at ASC
       FOR UPDATE SKIP LOCKED
       LIMIT 1
     )
     RETURNING id, kind, audio_url, transcript_id, template_id, manifest, style, template_data, user_id, attempts`,
  );

  if (claim.rows.length > 0) {
    return mapJobRow(claim.rows[0]);
  }

  return null;
}

function mapJobRow(job) {
  return {
    jobId: job.id,
    kind: job.kind,
    audioUrl: job.audio_url,
    transcriptId: job.transcript_id,
    templateId: job.template_id,
    // Handle JSONB vs TEXT: JSONB columns return objects, TEXT return strings
    manifest: typeof job.manifest === 'string' ? JSON.parse(job.manifest || '{}') : (job.manifest || {}),
    style: typeof job.style === 'string' ? JSON.parse(job.style || '{}') : (job.style || {}),
    template: typeof job.template_data === 'string' ? JSON.parse(job.template_data || '{}') : (job.template_data || {}),
    userId: job.user_id,
    attempts: job.attempts,
  };
}

/**
 * Requeue jobs abandoned by a crashed worker (lease expired) and schedules
 * retries for failed attempts under the retry limit.
 */
async function recoverStaleJobs(leaseMinutes = 15) {
  // 1) Abandoned 'processing' rows: expired lease, attempts remaining -> retry.
  const abandoned = await query(
    `UPDATE export_jobs
     SET status = 'retry',
         next_retry_at = NOW() + ($1 || ' seconds')::interval,
         error_message = 'Requeued: worker lease expired (crash recovery)',
         updated_at = NOW()
     WHERE status = 'processing'
       AND locked_at < NOW() - ($2 || ' minutes')::interval
       AND attempts < $3
     RETURNING id`,
    [String(BASE_RETRY_MS / 1000), String(leaseMinutes), MAX_ATTEMPTS],
  );

  // 2) Abandoned rows out of attempts -> permanent failure.
  const exhausted = await query(
    `UPDATE export_jobs
     SET status = 'failed',
         error_message = 'Failed: worker lease expired and retry limit reached',
         updated_at = NOW(),
         completed_at = NOW()
     WHERE status = 'processing'
       AND locked_at < NOW() - ($1 || ' minutes')::interval
       AND attempts >= $2
     RETURNING id`,
    [String(leaseMinutes), MAX_ATTEMPTS],
  );

  // 3) Scheduled 'retry' rows whose attempts got exhausted.
  await query(
    `UPDATE export_jobs
     SET status = 'failed',
         error_message = 'Failed: retry limit reached',
         updated_at = NOW(),
         completed_at = NOW()
     WHERE status = 'retry' AND attempts >= $1`,
    [MAX_ATTEMPTS],
  );

  return {
    requeued: abandoned.rows.length,
    failed: exhausted.rows.length,
  };
}

/**
 * Mark a job failed after an attempt; schedules a retry when attempts remain.
 */
async function failOrRetryJob(jobId, errorMessage, attempts) {
  if (attempts < MAX_ATTEMPTS) {
    const backoffMs = BASE_RETRY_MS * Math.pow(2, attempts - 1);
    await query(
      `UPDATE export_jobs
       SET status = 'retry',
           next_retry_at = NOW() + ($1 || ' milliseconds')::interval,
           error_message = $2,
           locked_at = NULL,
           updated_at = NOW()
       WHERE id = $3`,
      [String(backoffMs), errorMessage, jobId],
    );
    return 'retry';
  }

  await query(
    `UPDATE export_jobs
     SET status = 'failed',
         error_message = $1,
         updated_at = NOW(),
         completed_at = NOW()
     WHERE id = $2`,
    [errorMessage, jobId],
  );
  return 'failed';
}

/**
 * Save audio blob to file system and return URL
 * PRINCIPLE: CLEAN - Separate concern for blob storage
 */
async function saveAudioBlob(jobId, audioBlob) {
  const tempDir = process.env.EXPORT_TEMP_DIR || '/tmp/voisss-exports';
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const audioPath = path.join(tempDir, `${jobId}_input.webm`);

  // Convert array to buffer if needed
  const buffer = Buffer.isBuffer(audioBlob)
    ? audioBlob
    : Buffer.from(audioBlob);

  fs.writeFileSync(audioPath, buffer);

  // Return file:// URL for local access
  return `file://${audioPath}`;
}

/**
 * Get job status
 * PRINCIPLE: PERFORMANT - Direct database query
 */
async function getJobStatus(jobId) {
  const result = await query(
    `SELECT id, status, output_url, output_size, error_message, created_at, updated_at, completed_at
    FROM export_jobs
    WHERE id = $1`,
    [jobId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const job = result.rows[0];

  return {
    jobId: job.id,
    status: job.status,
    outputUrl: job.output_url,
    outputSize: job.output_size,
    error: job.error_message,
    createdAt: job.created_at,
    updatedAt: job.updated_at,
    completedAt: job.completed_at,
  };
}

/**
 * Update job status (called by worker)
 * PRINCIPLE: CLEAN - Worker uses this as single source of truth
 */
async function updateJobStatus(jobId, status, data = {}) {
  const { outputUrl, outputSize, errorMessage, progress } = data;

  await query(
    `UPDATE export_jobs
    SET status = $1::varchar,
        progress = $2::integer,
        output_url = $3::text,
        output_size = $4::integer,
        error_message = $5::text,
        updated_at = NOW(),
        locked_at = CASE WHEN $1::varchar IN ('completed', 'failed', 'retry') THEN NULL ELSE locked_at END,
        completed_at = CASE WHEN $1::varchar IN ('completed', 'failed') THEN NOW() ELSE completed_at END
    WHERE id = $6::varchar`,
    [status, progress || 0, outputUrl || null, outputSize || null, errorMessage || null, jobId]
  );
}

/**
 * Get jobs for a user (pagination)
 * PRINCIPLE: PERFORMANT - Indexed query for common access pattern
 */
async function getUserJobs(userId, limit = 20, offset = 0) {
  const result = await query(
    `SELECT id, kind, status, output_url, output_size, created_at, completed_at
    FROM export_jobs
    WHERE user_id = $1
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3`,
    [userId, limit, offset]
  );

  return result.rows;
}

/**
 * Clean up expired jobs (called by maintenance task)
 * PRINCIPLE: ORGANIZED - Separate concern from main export logic
 */
async function cleanupExpiredJobs(retentionHours = 24) {
  const hours = Number.parseInt(retentionHours, 10);
  if (!Number.isFinite(hours) || hours <= 0) {
    throw new Error(`Invalid retentionHours: ${retentionHours}`);
  }
  const result = await query(
    `DELETE FROM export_jobs
    WHERE created_at < NOW() - ($1 || ' hours')::interval
    AND status IN ('completed', 'failed')
    RETURNING id`,
    [String(hours)],
  );

  return result.rows.length;
}

module.exports = {
  enqueueExport,
  getNextPendingJob,
  getJobStatus,
  updateJobStatus,
  failOrRetryJob,
  recoverStaleJobs,
  getUserJobs,
  cleanupExpiredJobs,
  MAX_ATTEMPTS,
};
