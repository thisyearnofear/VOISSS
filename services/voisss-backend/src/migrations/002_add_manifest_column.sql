-- Add manifest column for MP4 video exports
-- Migration: 002_add_manifest_column

ALTER TABLE export_jobs 
ADD COLUMN IF NOT EXISTS manifest JSONB DEFAULT '{}';

-- Add index for manifest queries
CREATE INDEX IF NOT EXISTS idx_export_jobs_manifest 
  ON export_jobs(manifest) WHERE kind = 'mp4';
