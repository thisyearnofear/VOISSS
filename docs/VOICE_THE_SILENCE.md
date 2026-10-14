# Voice the Silence — Serverpod Hackathon Plan

**Event:** "Build Something Real" (BuilderBase / Serverpod)
**Deadline:** October 14, 2026 (submissions) — winners ~October 22
**Prize pool:** $20,000 ($10k cash + $10k Serverpod Cloud credits)
**Requirement:** a real full-stack app built on Serverpod (Dart/Flutter). Agentic coding allowed.

## Concept

**"Voice the Silence"** — a weekly silent-clip voiceover contest (Bad Lip Reading
mechanic as a community format):

1. A silent clip is posted (public-domain footage, e.g. Chaplin-era film — no
   likeness or rights issues).
2. Humans record voiceovers in the app; entries are listed **blind** (no author
   shown until after voting).
3. The crowd votes. Leaderboard updates live via Serverpod Streams.
4. Winning voices carry a "licensed on VOISSS" footer — the connector back to
   the marketplace flywheel: clip → human voice supply → votes → licensing.

### Why this test

- Proves whether the gamified-supply loop pulls humans in (the "waste stream"
  incentive theory: participants record for fun, the platform gets licensed
  voice assets).
- Doubles as the demand-gen vehicle: shareable output + public leaderboard.
- Voting data feeds the humanity-verification dataset later (blind
  human-vs-machine guesses are a stretch goal, not day-1 scope).

## Scope (4 days)

**In scope**

- One active clip, seeded by admin (hardcode the first; archive list can be a stub)
- Record/upload voiceover in-app (`record` package already in `mobile-flutter`)
- Blind entry gallery with audio playback (`audioplayers` already installed)
- Voting (score or pick-a-winner), deduped per session
- Live leaderboard via Serverpod **streaming methods** (judges reward realtime)

**Out of scope (post-hackathon)**

- On-chain splits, licensing checkout, x402 payments
- Agent API entries (vocalize submissions) — v2
- Lip-reading guess mode ("guess what they said") — stretch goal only
- User accounts beyond lightweight session identity; no $VOISSS token wiring

## Architecture

### Data model (`lib/src/models/*.spy.yaml`)

```
Clip:   table: silence_clip
        title: String, videoUrl: String, durationSec: int,
        rightsNote: String, weekStart: DateTime, active: bool

Entry:  table: silence_entry
        clipId: int (relation), displayName: String,
        audioUrl: String, voteScore: int, createdAt: DateTime

Vote:   table: silence_vote
        entryId: int (relation), voterSession: String (hashed),
        score: int, createdAt: DateTime
        unique index on (entryId, voterSession)
```

### Endpoints

| Endpoint | Methods | Notes |
|---|---|---|
| `silence_clip` | `getActive()`, `listArchive()`, `createClip(...)`, `updateSceneGuide(clipId, guide)` | `createClip`/`updateSceneGuide` have **no auth** — gate before public exposure |
| `silence_entry` | `submit(clipId, displayName, audioBytes, audioFormat)`, `list(clipId)`, `aiVoices()`, `generate(...)` | `list` returns `SilenceEntryView` — audio as `ByteData`, `displayName` visible (blindness is client-side personas for now) |
| `silence_vote` | `cast(entryId, voterToken, score)`, `leaderboard(clipId)`, `watchLeaderboard(clipId)` | dedupe on (entryId, voterToken); `watchLeaderboard` is a 2s polling stream w/ change-signature dedupe — not true pub/sub |
| `silence_co_writer` | `openers(clipId)`, `chat(clipId, history, draft)` | AI riffing partner; system prompt carries the clip's vision-seeded `sceneGuide` + user's live draft. Uses `BUTLER_LLM_*` env (Featherless, Qwen3-32B, thinking disabled) |

### Screens (`mobile-flutter`) — ✅ implemented

Single self-contained tab wired as a third bottom-nav destination alongside
Recordings/Butler. Files under `lib/screens/silence/`:

- `silence_screen.dart` — clip card (muted looping video, hook copy,
  Watch→Record→Vote strip, social-proof line), entries list, leaderboard
  (winner highlighted), "licensed on VOISSS" footer → `voisss.famile.xyz`
- `silence_recorder.dart` — record-while-watching: recording restarts the
  muted clip so performers sync to the footage; wall-clock countdown
  `0:23 / 1:00`, auto-stops at clip duration; pulsing mic; replay + display
  name + submit (web records webm/opus, mobile m4a)
- `silence_theater.dart` — full-screen "watch the dub": entry audio plays
  over the footage (this is the Bad Lip Reading mechanic), prev/next take,
  replay, reactions, share
- `silence_reactions.dart` — reaction-tap voting (😂=5, 🔥=4, 💀=3 mapped to
  backend int scores) with pop animation; shared by tiles and theater
- `silence_personas.dart` — deterministic blind personas ("Velvet
  Megaphone") shown until you vote on an entry, then the real name reveals
- `silence_recording_{io,web,stub}.dart` — conditional import (dart:io on
  mobile, blob-URL fetch on web)

Support: `lib/services/silence/silence_service.dart` (generated-client
wrapper + persisted voter token), `lib/providers/silence_provider.dart`
(state + `myVotes` map driving blind→reveal). `share_plus` added for
challenge/entry sharing.

### Progressive-disclosure / showmanship layer (hackathon polish)

- **Hook fade-in** — the silent clip sits for ~1.4s before "A century of
  silence ends today — give it a voice" fades in. Mystery before instruction.
- **Post-first-vote reveal card** — after a user's first vote: "You just
  judged an audition. Every take here is a licensable voice…" — the
  marketplace bridge at peak engagement, not a footer nobody reads.
- **Agent plant** — one machine-generated take ("The Projectionist's
  Apprentice", entry id=2, `kAgentEntryIds` in `silence_provider.dart`)
  submitted via `tool/plant_agent_take.dart`. Once a judge votes on it the
  reveal fires: "This take was generated by a machine — did you catch it?"
  Demonstrates blind voting, the human-vs-machine thesis, and that agent
  participation already works — with no special-casing on the backend.
- **"Built on Serverpod" expander** — collapsed technical blurb (typed
  endpoints, ByteData→bytea, streaming leaderboard, live deploy) at the
  bottom for judges; invisible weight for players.

### Media storage

- `maxRequestSize: 52428800` (50 MB) already set in `config/development.yaml` —
  enough for short audio uploads via `ByteData`/`Uint8List` in `submit()`.
- Clip video: host on a static/CDN host or Serverpod's `serverpod_cloud_storage`
  tables (already in the migration — the module is present).
- For the sprint, storing entry audio as files under `web/` or Postgres blobs
  is acceptable; move to S3/Serverpod Cloud Storage after.

## Schedule

| Day | Work |
|---|---|
| 0–1 | Version alignment (see audit), `serverpod generate`, models + `serverpod create-migration`, endpoints, seed clip |
| 2 | Screens 1–3, local test against `docker-compose` Postgres |
| 3 | Leaderboard + realtime votes, deploy (Dockerfile exists; Serverpod Cloud), polish |
| 4 | Demo video, Devpost write-up, submission; post the clip publicly and seed 5–10 entries |

## Backend audit (as of 2026-10-10)

Location: `apps/flutter-backend-serverpod` (`voisss_butler_server`).
Last touched: **2026-06-09**.

| Area | State | Action needed |
|---|---|---|
| Serverpod version | **2.9.2**; latest is **4.0.4** (2026-10-06) — two major versions behind | Do NOT upgrade mid-sprint; bump `serverpod`, `serverpod_test`, `serverpod_lints` together after the hackathon and regenerate. Note breaking changes between 2.x and 4.x. |
| Domain tables | ✅ Done — `silence_clip`, `silence_entry`, `silence_vote` models created in `lib/src/models/`, migration `migrations/20261012112415969` generated | Apply on first run: `dart bin/main.dart --apply-migrations` (needs Postgres via `docker compose up voisss_butler_postgres` — Docker not running on the dev machine as of 2026-10-10). |
| Endpoints | ✅ Done — `silence_clip`, `silence_entry`, `silence_vote` endpoints added and generated into the client. `greeting`/`butler` left untouched | Butler is Venice/Gemini AI code, unrelated — don't depend on it. `createClip` has **no auth** — add an admin check before deploying publicly. |
| Client package | ✅ Done — `config/generator.yaml` fixed (`client_package_path` was `../voisss_butler_client`, corrected to `voisss_butler_client`); `serverpod generate` outputs to `flutter-backend-serverpod/voisss_butler_client` | The stale copy at `mobile-flutter/packages/voisss_butler_client` is superseded — mobile-flutter now points at the generated package directly. |
| `mobile-flutter` deps | ✅ Done — `serverpod_client`/`serverpod_flutter` bumped `^2.3.0` → `^2.9.2`, `voisss_butler_client` repointed to `../flutter-backend-serverpod/voisss_butler_client`; `flutter pub get` clean | — |
| Config | Custom ports 8090–8094, Postgres via `docker-compose.yaml` (postgres:16-alpine), Redis disabled | Works as-is for dev. Redis not needed for the sprint. |
| Security | `docker-compose.yaml` hardcoded `VENICE_API_KEY` **scrubbed** (now `${VENICE_API_KEY}` env) | Still rotate the key — it was committed and may be exposed in git history/remotes. |
| Local toolchain | ✅ Done — Dart 3.13.5 + Flutter 3.47.7 installed at `~/sdk/` | Add to PATH: `export PATH="$HOME/sdk/flutter/bin:$HOME/sdk/dart-sdk/bin:$HOME/.pub-cache/bin:$PATH"` |

## Deployment state (2026-10-12)

Deployed to the Hetzner server (`snel-bot`, 157.180.36.156):

- Source synced to `~/flutter-backend-serverpod`, `docker compose build` +
  `up -d` — postgres 16 on :8093, server on :8090/:8091/:8092.
- Migrations applied (`--apply-migrations` via `docker compose run` — the
  compose `command:` does NOT reach the binary because the Dockerfile uses a
  shell-form ENTRYPOINT; run migrations manually after each change:
  `docker compose run --rm --entrypoint ./server voisss_butler_server
  --mode=production --server-id=default --logging=normal --role=monolith
  --apply-migrations`).
- Seeded clip id=1: "The Bond — Chaplin (1918)", 60 s, public domain.
- Verified: `POST http://127.0.0.1:8090/silenceClip/getActive` returns it.

**~~KNOWN ISSUE — DNS~~ RESOLVED (2026-10-12):** A record
`butler.voisss.famile.xyz → 157.180.36.156` added (Cloudflare, DNS-only);
`certbot --nginx` issued a dedicated cert (expires 2027-01-10). API is live at
`https://butler.voisss.famile.xyz/`.

**nginx fix applied:** the vhost hard-set `Connection: upgrade` on every
request, which made Dart's HttpServer treat POSTs as protocol upgrades and
drop their bodies (every endpoint with params 400'd through the proxy).
Replaced with the standard `map $http_upgrade $connection_upgrade` block
(`default upgrade; '' close;`) and `proxy_set_header Connection
$connection_upgrade;`; `proxy_request_buffering` back on. Config backup at
`/tmp/voisss-butler.bak` on the server. Verified end-to-end over public
HTTPS: `getActive`, `list`, `leaderboard`, `submit`, `cast` all pass.

**Wire format note:** Serverpod 2.9 endpoint calls take parameters as a JSON
**body** (`POST /endpoint/method {"arg": value}`), not query strings — query
params arrive as raw strings and fail typed params (`String → int`).

**~~KNOWN ISSUE — browser CORS~~ RESOLVED (2026-10-12):** browser `fetch`
failed with `TypeError: Failed to fetch` while curl/navigation worked — the
POST response carried `access-control-allow-origin: *` **twice** (nginx
`add_header` + Serverpod's own CORS headers; Chrome rejects duplicate values).
Fix: removed the server-level `add_header`s from the butler vhost — Serverpod
now owns CORS on proxied responses, nginx only answers OPTIONS directly.
Rule of thumb: **one layer owns CORS** — proxy or app, never both.

**Backlog:**
- `createClip` is publicly callable — add an admin-key check before public
  exposure beyond the hackathon.

## Implementation notes (post-day-0)

- Entry audio is stored as `bytea` in Postgres (`ByteData` model field), capped
  at 5 MB per submission — no cloud-storage config needed for the sprint.
- `watchLeaderboard(clipId)` is a polling stream (2 s tick, change-signature
  dedupe). Good enough for a leaderboard; replace with proper pub/sub if
  Postgres LISTEN/NOTIFY or Redis is enabled later.
- Votes dedupe on a client-generated `voterToken` (UUID in
  `shared_preferences`) — no accounts needed.
- Entries currently return `displayName` immediately; true blind voting
  (hide author until reveal) is a v2 flag.

## Client implementation status (2026-10-12)

- `SilenceProvider` added to `MultiProvider` in `lib/main.dart`; third
  bottom-nav tab "Silence" added. Butler and Recordings flows untouched.
- `flutter analyze` clean on all new files (`lib/screens/silence`,
  `lib/providers/silence_provider.dart`, `lib/services/silence`).
- `flutter build web --release` **passes** — required two pre-existing fixes:
  `splash_screen.dart`/`onboarding_screen.dart` imported `'main.dart'`
  (resolves to `lib/screens/main.dart`, never existed → `'../main.dart'`), and
  `ThemeData.cardTheme` needed `CardThemeData` for Flutter 3.47. Wasm still
  blocked by `speech_to_text`/`audioplayers_web`/`flutter_tts` JS-interop —
  build uses dart2js, fine for the demo.
- **Design pass (2026-10-12):** Silence is now the first nav destination — the
  contest IS the app. Full-bleed cinematic hero (footage covers ~60% of the
  viewport under a gradient scrim; eyebrow + title + hook + Watch→Record→Vote
  chips overlaid; glass share/refresh buttons, no AppBar). Gradient pill
  record CTA (pulses red while recording). Take tiles use persona-initial
  avatars; leaderboard and reveal cards use tonal surfaces. Theater mode is
  full-bleed with scrimmed overlay controls. Typography: Space Grotesk
  display + Inter body via `google_fonts`; shared `buildVoisssTheme()` in
  `main.dart` (deep `0xFF0B0A12` scaffold, 20px card radii, M3
  `NavigationBar`). Splash/onboarding/home copy rewritten — the stale
  "Flutter Butler / Powered by Venice AI / connect Starknet wallet"
  positioning is gone from the first-run path; the wallet card lives on the
  Studio tab reframed as an optional payout path. No hackathon language
  anywhere in the UI.
- Runtime-verified in browser (headless Chrome): clip loads, video plays,
  take tile → reaction vote → name reveal → machine-plant reveal →
  "you just judged an audition" card → leaderboard all fire correctly.
- **Studio pass (2026-10-12):** the recorder is now a two-path studio.
  Optional collapsible "Write your lines" script draft, then either
  *Voice it myself* (records over the footage with **live captions** via
  `speech_to_text` — your words appear as you speak, proving the mic is
  capturing, and the script shows as a teleprompter) or *AI voice*
  (bottom sheet: script + voice picker + display name →
  `silenceEntry.generate`). Post-capture shows an explicit "Take captured
  · 0:42 · We heard: '…'" card — the unclear-save feedback is gone.
- **AI voices (Featherless (Kokoro)):** new `silenceEntry.generate(clipId,
  displayName, script, voice)` endpoint calls Featherless (Kokoro)
  `audio/speech` (`Kokoro-82M`, mp3) server-side and stores the
  take flagged `isAiGenerated` — server-side voice allowlist
  (`silenceEntry.aiVoices` returns the menu). Reads `FEATHERLESS_API_KEY`
  from env (compose wires `${FEATHERLESS_API_KEY:-}`); returns "not
  configured" gracefully until set. Migration `20261012144608845` adds
  `silence_entry.isAiGenerated` (applied live; entry id=2 backfilled
  true — the plant is now flag-driven, `kAgentEntryIds` is just a
  fallback). Reveal logic checks `entry.isAiGenerated` everywhere
  (tile, theater, reveal card).
- **Co-writer (vision-aware ideation, 2026-10-12):** "Riff with AI" on the
  draft card opens a chat sheet. Cold start = 3 LLM-generated direction
  cards tied to on-screen moments; each assistant reply has "Insert into
  draft" which extracts `LINE:`-marked speakable lines. On-screen context
  comes from `silence_clip.sceneGuide` — timestamped scene descriptions
  distilled once per clip by `Qwen/Qwen3-VL-32B-Instruct` from
  ffmpeg-sampled frames (`voisss_butler_client/tool/seed_scene_guide.dart`,
  run with `FEATHERLESS_API_KEY` + ffmpeg; writes via
  `updateSceneGuide`). Chat itself uses the text LLM — vision cost is
  paid once per clip, not per message. Qwen3 is a thinking model —
  `chat_template_kwargs.enable_thinking=false` is required or it burns
  `max_tokens` on reasoning and returns empty content.
- **Web polish fixes:** `web/icons/` generated from the mascot (192/512 +
  maskable), manifest rebranded (name/theme/description), index.html
  title/meta; bundled `NotoColorEmoji.ttf` + `fontFamilyFallback` in the
  theme so 😂🔥💀 render even when canvaskit can't reach the fonts CDN;
  stale `assets/images|icons|animations/` pubspec dirs removed.
- Untested at runtime: mic permission flow, audio upload, live captions
  in a real mic session, Featherless (Kokoro) roundtrip (needs `FEATHERLESS_API_KEY`
  on snel-bot, then `docker compose up -d` to pick up the env).

## Deployment posture & process (2026-10-12)

**Surfaces — three separate things, don't conflate:**
- **Backend** `apps/flutter-backend-serverpod` → snel-bot (Hetzner
  `157.180.36.156`, ssh alias `snel-bot`, user `deploy`, port 49152).
  Runs via `docker compose` at `/home/deploy/flutter-backend-serverpod` —
  an **rsync target, not a git checkout**.
- **Edge:** nginx vhost `butler.voisss.famile.xyz` → `:8090` (certbot TLS;
  Serverpod owns CORS — one layer only).
- **Flutter web** `apps/mobile-flutter` → `flutter build web --release` →
  `build/web`; local preview only so far — not publicly deployed.
- `apps/web` (vinext web app → `voisss.famile.xyz`, Cloudflare Workers) is a
  **separate app and pipeline** — unrelated to the contest backend.

**Backend deploy process (manual, no CI):**
```bash
rsync -az apps/flutter-backend-serverpod/lib snel-bot:/home/deploy/flutter-backend-serverpod/
rsync -az apps/flutter-backend-serverpod/{docker-compose.yaml,migrations,config} snel-bot:/home/deploy/flutter-backend-serverpod/
ssh snel-bot 'cd /home/deploy/flutter-backend-serverpod \
  && docker compose build voisss_butler_server \
  && docker compose up -d voisss_butler_server'
# Migrations do NOT auto-apply (the --apply-migrations arg in the compose
# command doesn't take); run manually:
ssh snel-bot 'cd /home/deploy/flutter-backend-serverpod \
  && docker compose run --rm --entrypoint ./server voisss_butler_server \
  --mode=production --server-id=default --logging=normal \
  --role=monolith --apply-migrations'
```

**Secrets:** `/home/deploy/flutter-backend-serverpod/.env` (chmod 600,
gitignored) — `FEATHERLESS_API_KEY`, `BUTLER_LLM_KEY/URL/MODEL`. Compose
references `${VAR}` names only; keys never enter the repo.

**AI provider alignment:** one provider — **Featherless** — serves both
surfaces: Kokoro-82M → Silence AI voices (`silenceEntry.generate`),
Qwen3-32B → Butler chat (`butler.chat`, OpenAI-compatible, configured via
`BUTLER_LLM_*`; `VENICE_API_KEY` remains a fallback path in code but is
unset). Verified live: `butler.health` → `Provider: llm`, real chat
roundtrip OK; `silenceEntry.generate` → real mp3 (entry id=4).

**Drift caveat:** because the server is an rsync target, deploy only from
a committed state — everything synced so far is committed. No CI; if
this becomes a team habit, promote the server dir to a real git checkout
or add a deploy workflow.

## Submission package (draft)

**Tagline:** Voice the Silence — a game that secretly builds the world's
most honest voice marketplace.

**Devpost structure (mirrors the product's own disclosure):**
1. Hook: "Chaplin's been silent for 107 years. We let the internet fix that."
2. The game: watch → record → vote blind → live leaderboard.
3. The architecture: one diagram (typed endpoints → Postgres → stream).
   Name the Serverpod features: codegen'd type-safe client, ByteData binary
   params → `bytea` (no multipart), endpoint streaming, real migrations on a
   deployed Postgres 16 + nginx + TLS box — not localhost.
4. The twist: every take is audition-grade, consented, rights-cleared voice
   inventory. The game is the marketplace's supply side.
5. The plant: one take is machine-generated — did you catch it? Blind
   voting + the reveal proves provenance matters.
6. Honest scope: cloud storage, true pub/sub, agent API entries — cut
   deliberately.

**Demo video (~90s):** 0:00 muted Chaplin (no narration — let silence work)
→ 0:08 voice drops in → 0:20 record-a-take over footage → 0:40 theater +
reaction voting → 0:55 leaderboard ticks live + vote on camera against the
public HTTPS URL → 1:10 the twist (marketplace) + machine reveal → 1:25
architecture card.

**Judge script (60s):** open app → Silence tab → watch the clip → record
10s → submit → open a take → vote 😂 → watch the reveal card + leaderboard.

**Live counters:** update the Devpost during judging week with real
entry/vote counts.

## Success criteria (for the flywheel, not the prize)

- ≥10 entries submitted on the seeded clip within a week
- ≥3 entrants ask about / click through to "license this voice"
- Any inbound from agent builders about submitting machine entries

## Post-hackathon

- Add `humanOrMachineGuess` to `Vote` and enable the blind "Human or Machine?"
  reveal — feeds humanity-certificate training signal.
- Wire winning entries to marketplace listings (voice audition → license CTA).
- Let agents enter via `/api/agents/vocalize` output — agent vs human duels.
- Rotate the committed Venice key; upgrade Serverpod 2.9.2 → 4.x on a branch.
