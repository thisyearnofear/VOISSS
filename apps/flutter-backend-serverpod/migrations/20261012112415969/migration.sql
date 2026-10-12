BEGIN;

--
-- ACTION CREATE TABLE
--
CREATE TABLE "silence_clip" (
    "id" bigserial PRIMARY KEY,
    "title" text NOT NULL,
    "videoUrl" text NOT NULL,
    "durationSec" bigint NOT NULL,
    "rightsNote" text NOT NULL,
    "weekStart" timestamp without time zone NOT NULL,
    "active" boolean NOT NULL,
    "createdAt" timestamp without time zone NOT NULL
);

--
-- ACTION CREATE TABLE
--
CREATE TABLE "silence_entry" (
    "id" bigserial PRIMARY KEY,
    "clipId" bigint NOT NULL,
    "displayName" text NOT NULL,
    "audio" bytea NOT NULL,
    "audioFormat" text NOT NULL,
    "voteCount" bigint NOT NULL,
    "voteScoreTotal" bigint NOT NULL,
    "createdAt" timestamp without time zone NOT NULL
);

--
-- ACTION CREATE TABLE
--
CREATE TABLE "silence_vote" (
    "id" bigserial PRIMARY KEY,
    "entryId" bigint NOT NULL,
    "voterToken" text NOT NULL,
    "score" bigint NOT NULL,
    "createdAt" timestamp without time zone NOT NULL
);

-- Indexes
CREATE UNIQUE INDEX "silence_vote_entry_voter_idx" ON "silence_vote" USING btree ("entryId", "voterToken");

--
-- ACTION CREATE FOREIGN KEY
--
ALTER TABLE ONLY "silence_entry"
    ADD CONSTRAINT "silence_entry_fk_0"
    FOREIGN KEY("clipId")
    REFERENCES "silence_clip"("id")
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;

--
-- ACTION CREATE FOREIGN KEY
--
ALTER TABLE ONLY "silence_vote"
    ADD CONSTRAINT "silence_vote_fk_0"
    FOREIGN KEY("entryId")
    REFERENCES "silence_entry"("id")
    ON DELETE NO ACTION
    ON UPDATE NO ACTION;


--
-- MIGRATION VERSION FOR voisss_butler
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('voisss_butler', '20261012112415969', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20261012112415969', "timestamp" = now();

--
-- MIGRATION VERSION FOR serverpod
--
INSERT INTO "serverpod_migrations" ("module", "version", "timestamp")
    VALUES ('serverpod', '20240516151843329', now())
    ON CONFLICT ("module")
    DO UPDATE SET "version" = '20240516151843329', "timestamp" = now();


COMMIT;
