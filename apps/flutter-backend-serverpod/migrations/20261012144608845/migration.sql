BEGIN;

--
-- ACTION ALTER TABLE
--
ALTER TABLE "silence_entry" ADD COLUMN "isAiGenerated" boolean NOT NULL DEFAULT false;

--
-- MIGRATION VERSION FOR voisss_butler
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('voisss_butler', '20261012144608845', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261012144608845', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod', '20240516151843329', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20240516151843329', "timestamp" = now();


COMMIT;
