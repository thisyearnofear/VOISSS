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

  const jobId = `export_${crypto.randomUUID()}`;

  // If audioBlob is provided, save it and generate audioUrl
  let finalAudioUrl = audioUrl;
  if (audioBlob) {
    finalAudioUrl = await saveAudioBlob(jobId, audioBlob);
  }

  // Insert into database with template data
  // Note: template_data column may not exist in older schemas - attempt insert, fall back if needed
  try {
    await query(
      `INSERT INTO export_jobs 
      (id, user_id, kind, audio_url, transcript_id, template_id, manifest, style, template_data, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', NOW())`,
      [jobId, userId, kind, finalAudioUrl, transcriptId, templateId, JSON.stringify(manifest || {}), JSON.stringify(style || {}), JSON.stringify(template || {})]
    );
  } catch (e) {
    if (e.message.includes('template_data')) {
      // Column doesn't exist, try without it
      await query(
        `INSERT INTO export_jobs 
        (id, user_id, kind, audio_url, transcript_id, template_id, manifest, style, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())`,
        [jobId, userId, kind, finalAudioUrl, transcriptId, templateId, JSON.stringify(manifest || {}), JSON.stringify(style || {})]
      );
    } else {
      throw e;
    }
  }

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
 * Get next pending job for worker
 * PRINCIPLE: MODULAR - Worker fetches its own jobs
 */
async function getNextPendingJob() {
  const result = await query(
    `SELECT id, kind, audio_url, transcript_id, template_id, manifest, style, template_data, user_id
     FROM export_jobs
     WHERE status = 'pending'
     ORDER BY created_at ASC
     LIMIT 1`,
  );

  if (result.rows.length === 0) {
    return null;
  }

  const job = result.rows[0];
  
  // Attempt to lock job by updating status to 'processing'
  const lockResult = await query(
    `UPDATE export_jobs 
     SET status = 'processing', updated_at = NOW()
     WHERE id = $1 AND status = 'pending'
     RETURNING *`,
    [job.id]
  );

  if (lockResult.rows.length === 0) {
    // Job was already picked up by another worker
    return null;
  }

  return {
    jobId: job.id,
    kind: job.kind,
    audioUrl: job.audio_url,
    transcriptId: job.transcript_id,
    templateId: job.template_id,
    manifest: JSON.parse(job.manifest || '{}'),
    style: JSON.parse(job.style || '{}'),
    template: JSON.parse(job.template_data || '{}'),
    userId: job.user_id,
  };
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
  getNextPendingJob,
  getJobStatus,
  updateJobStatus,
  getUserJobs,
  cleanupExpiredJobs,
};
