BEGIN;

--
-- ACTION ALTER TABLE
--
ALTER TABLE "silence_clip" ADD COLUMN "storageUri" text NOT NULL DEFAULT ''::text;
--
-- ACTION ALTER TABLE
--
ALTER TABLE "silence_entry" ADD COLUMN "storageUri" text NOT NULL DEFAULT ''::text;
ALTER TABLE "silence_entry" ADD COLUMN "audioUrl" text NOT NULL DEFAULT ''::text;

--
-- MIGRATION VERSION FOR voisss_butler
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('voisss_butler', '20261012191221809', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261012191221809', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod', '20240516151843329', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20240516151843329', "timestamp" = now();


COMMIT;
