-- Create export_jobs table for tracking audio/video exports
-- Migration: 001_create_export_jobs

CREATE TABLE IF NOT EXISTS export_jobs (
  id VARCHAR(100) PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  kind VARCHAR(20) NOT NULL CHECK (kind IN ('mp3', 'mp4', 'carousel')),
  
  -- Input metadata
  audio_url TEXT NOT NULL,
  transcript_id VARCHAR(255),
  template_id VARCHAR(255),
  style JSONB DEFAULT '{}',
  
  -- Status tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Output
  output_url TEXT,
  output_size INT,
  
  -- Error handling
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  -- Metadata for observability
  worker_id VARCHAR(100),
  duration_ms INT
);

-- Indexes for common queries
-- PRINCIPLE: PERFORMANT - Support common access patterns
CREATE INDEX IF NOT EXISTS idx_export_jobs_user_status 
  ON export_jobs(user_id, status);

CREATE INDEX IF NOT EXISTS idx_export_jobs_created_at 
  ON export_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_jobs_status 
  ON export_jobs(status);

-- Index for cleanup operations
CREATE INDEX IF NOT EXISTS idx_export_jobs_age 
  ON export_jobs(created_at) 
  WHERE status IN ('completed', 'failed');
