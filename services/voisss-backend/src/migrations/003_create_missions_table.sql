-- Migration: Create Missions and Responses Tables
-- Strategy: Use JSONB for flexible mission data and responses while maintaining
-- relational integrity for users and mission links.

-- Table for mission definitions
CREATE TABLE IF NOT EXISTS "missions" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index for mission activity and creation filtering
CREATE INDEX IF NOT EXISTS idx_missions_created_at ON "missions" (created_at DESC);

-- Table for user-mission acceptance (many-to-many relationship)
CREATE TABLE IF NOT EXISTS "user_missions" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for user-mission lookups
CREATE INDEX IF NOT EXISTS idx_user_missions_user_id ON "user_missions" ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_user_missions_mission_id ON "user_missions" ((data->>'missionId'));

-- Table for mission responses/submissions
CREATE TABLE IF NOT EXISTS "mission_responses" (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for response filtering
CREATE INDEX IF NOT EXISTS idx_responses_mission_id ON "mission_responses" ((data->>'missionId'));
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON "mission_responses" ((data->>'userId'));
CREATE INDEX IF NOT EXISTS idx_responses_status ON "mission_responses" ((data->>'status'));
