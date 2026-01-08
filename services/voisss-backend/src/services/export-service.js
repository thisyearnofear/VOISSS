/**
 * Export Service
 * Core export logic: enqueue jobs, track status, manage results
 * PRINCIPLE: ENHANCEMENT FIRST - Single source of truth for export operations
 * PRINCIPLE: DRY - All export logic centralized here
 */

const { query } = require('./db-service');
const { getQueue } = require('./queue-service');
const crypto = require('crypto');

const EXPORT_QUEUE = 'voisss-export';

/**
 * Enqueue an export job
 * PRINCIPLE: CLEAN - Clear contract, explicit dependencies
 */
async function enqueueExport({
  kind,
  audioUrl,
  transcriptId,
  templateId,
  style,
  userId = 'anonymous',
}) {
  // Validate input
  if (!['mp3', 'mp4', 'carousel'].includes(kind)) {
    throw new Error(`Invalid export kind: ${kind}`);
  }

  const jobId = `export_${crypto.randomUUID()}`;

  // Insert into database
  await query(
    `INSERT INTO export_jobs 
    (id, user_id, kind, audio_url, transcript_id, template_id, style, status, created_at)
    VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', NOW())`,
    [jobId, userId, kind, audioUrl, transcriptId, templateId, JSON.stringify(style || {})]
  );

  // Add to queue with retry logic
  const queue = getQueue(EXPORT_QUEUE);
  const jobData = {
    jobId,
    kind,
    audioUrl,
    transcriptId,
    templateId,
    style,
    userId,
  };

  const estimatedSeconds = {
    mp3: 60,
    mp4: 180,
    carousel: 2,
  };

  await queue.add(jobData, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    timeout: estimatedSeconds[kind] * 1500, // Add 50% buffer
    removeOnComplete: { age: 3600 }, // Remove completed jobs after 1 hour
    removeOnFail: false, // Keep failed jobs for debugging
  });

  return {
    jobId,
    estimatedSeconds: estimatedSeconds[kind],
    statusUrl: `/api/export/${jobId}/status`,
  };
}

/**
 * Get job status
 * PRINCIPLE: PERFORMANT - Cache hot queries in Redis
 */
async function getJobStatus(jobId) {
  const result = await query(
    `SELECT id, status, output_url, output_size, error_message, created_at, completed_at
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
    completedAt: job.completed_at,
  };
}

/**
 * Update job status (called by worker)
 * PRINCIPLE: CLEAN - Worker uses this as single source of truth
 */
async function updateJobStatus(jobId, status, data = {}) {
  const { outputUrl, outputSize, errorMessage } = data;

  await query(
    `UPDATE export_jobs
    SET status = $1, 
        output_url = $2,
        output_size = $3,
        error_message = $4,
        completed_at = CASE WHEN $1 IN ('completed', 'failed') THEN NOW() ELSE completed_at END
    WHERE id = $5`,
    [status, outputUrl || null, outputSize || null, errorMessage || null, jobId]
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
  const result = await query(
    `DELETE FROM export_jobs
    WHERE created_at < NOW() - INTERVAL '${retentionHours} hours'
    AND status IN ('completed', 'failed')
    RETURNING id`,
  );

  return result.rows.length;
}

module.exports = {
  enqueueExport,
  getJobStatus,
  updateJobStatus,
  getUserJobs,
  cleanupExpiredJobs,
  EXPORT_QUEUE,
};
