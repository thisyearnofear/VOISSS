-- Enhance export_jobs table for database-driven queue
-- Migration: 002_enhance_export_jobs

-- Add missing columns if they don't exist
ALTER TABLE IF EXISTS export_jobs 
ADD COLUMN IF NOT EXISTS manifest JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS template_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS progress INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add index for polling (worker-efficient)
CREATE INDEX IF NOT EXISTS idx_export_jobs_pending 
  ON export_jobs(created_at ASC) 
  WHERE status = 'pending';
