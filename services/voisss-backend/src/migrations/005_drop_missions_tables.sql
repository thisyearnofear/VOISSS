-- 005_drop_missions_tables.sql — VPS cleanup Phase 2
-- Drops the retired missions SocialFi tables. The Next.js app now serves 410 for /api/missions*
-- and the VPS no longer mounts missionRoutes (see src/server.js). This migration makes the
-- drop reproducible on every host that upgrades via runMigrations().
-- Safe to re-run: checks for table existence first.

DO $$
BEGIN
  -- Drop indexes explicitly first for clarity (DROP TABLE CASCADE would also work)
  DROP INDEX IF EXISTS idx_responses_status;
  DROP INDEX IF EXISTS idx_responses_user_id;
  DROP INDEX IF EXISTS idx_responses_mission_id;
  DROP INDEX IF EXISTS idx_user_missions_mission_id;
  DROP INDEX IF EXISTS idx_user_missions_user_id;
  DROP INDEX IF EXISTS idx_missions_created_at;

  -- Drop tables (missions SocialFi). CASCADE in case anything still references them in tests.
  DROP TABLE IF EXISTS "mission_responses" CASCADE;
  DROP TABLE IF EXISTS "user_missions" CASCADE;
  DROP TABLE IF EXISTS "missions" CASCADE;
END $$;
