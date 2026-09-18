-- Migration: Add retry/lease columns to export_jobs for crash recovery
-- 004_add_queue_retry_columns

ALTER TABLE IF EXISTS export_jobs
  ADD COLUMN IF NOT EXISTS attempts INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMP;

-- Allow 'retry' as an intermediate status used by crash recovery / backoff
ALTER TABLE IF EXISTS export_jobs
  DROP CONSTRAINT IF EXISTS export_jobs_status_check;

ALTER TABLE IF EXISTS export_jobs
  ADD CONSTRAINT export_jobs_status_check
  CHECK (status IN ('pending', 'processing', 'retry', 'completed', 'failed'));

-- Index for the stale-lease sweep
CREATE INDEX IF NOT EXISTS idx_export_jobs_processing_lock
  ON export_jobs(locked_at)
  WHERE status = 'processing';
