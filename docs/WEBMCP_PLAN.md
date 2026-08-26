# WebMCP Integration for VOISSS

**Status:** ✅ **Implemented** (production on voisss.netlify.app)  
**Target:** WebMCP Challenge (Devpost hackathon)  
**Effort:** ~1.5 days  
**Deploy target:** voisss.netlify.app (Netlify)

---

## Status — Implemented

All 5 WebMCP imperative tools are live on the marketplace and studio pages:

1. **`list_voices`** — Browse voices with filters → `GET /api/marketplace/voices`
2. **`play_voice_sample`** — Play voice audio in browser → existing audio player
3. **`get_voice_details`** — Full voice info (tags, pricing, contributor) → marketplace API
4. **`license_voice`** — Open license checkout flow → `/marketplace` with pre-filled params
5. **`vocalize`** — Generate speech from text → `POST /api/agents/vocalize`

An agent opens `voisss.netlify.app/marketplace` → queries `getTools()` → sees 5 tool definitions with JSON schemas → calls tools with structured args → VOISSS executes client-side JS → returns results → user sees UI update live.

### Agent.json declares WebMCP capability

The `/.well-known/agent.json` file includes a `webmcp` block declaring the 5 enabled tools, making VOISSS machine-discoverable by any WebMCP-aware agent.

### Files

- `apps/web/src/lib/webmcp.ts` — Polyfill loader + 5 tool registrations + type-safe execute callbacks
- `apps/web/src/app/marketplace/page.tsx` — `useEffect(() => initWebMCP())` on mount
- `apps/web/src/app/studio/page.tsx` — Same WebMCP init for studio pages
- `apps/web/public/.well-known/agent.json` — `"webmcp": { "enabled": true, "tools": [...] }`
- `apps/web/tsconfig.json` — Added `"webmcp-types"` to compilerOptions.types

## What is WebMCP?

WebMCP is a W3C community-group proposal (at `github.com/webmachinelearning/webmcp`) that lets websites expose tools to AI agents **in the browser**. Two modes:

| Mode | API | Example |
|------|-----|---------|
| **Imperative** | `document.modelContext.registerTool({ name, description, inputSchema, execute })` | JS calls `list_voices(tone='professional')` → returns voice catalog |
| **Declarative** | `<form toolname="..." tooldescription="...">` | Browser auto-synthesizes a tool from a search form |

An agent opens your page → calls `getTools()` → sees tool list with descriptions and JSON schemas → calls tools with structured args → your page executes client-side JS and returns results. The user sees the UI update live.

## Browser Support

| Environment | How |
|---|---|
| **Chrome 149+** | Origin trial — enable via `chrome://flags/#enable-webmcp-testing` |
| **ChatGPT in-app browser** | Supports WebMCP out of the box ✅ |
| **Edge 150+** | Origin trial via Edge flags |
| **All others** | Polyfill from `@google/webmcp-polyfill` |

## Why VOISSS × WebMCP?

| Challenge criterion | VOISSS fit |
|---------------------|------------|
| **WebMCP leverage** | 5 tools map one-to-one to existing API endpoints — no backend changes needed |
| **Execution** | API already works; WebMCP is a client-side wrapper |
| **Potential impact** | Agents discover, license, and generate voice from a live web page — solves "agent navigation" for voice marketplaces |
| **Creativity** | A B2B voice marketplace where agents are first-class customers, demonstrated via in-browser tool discovery |

The challenge asks: *"Build an app that becomes meaningfully better when people and their agents can use it together."*

**VOISSS with WebMCP:** An agent opens `voisss.netlify.app/marketplace`, discovers `list_voices` and `vocalize` tools, and says: *"Find me a professional female voice, generate a 15-second intro, and let me hear it."* The agent calls tools → UI updates → audio plays. Before WebMCP, the agent had to scrape the DOM and guess which buttons to click. After, it gets structured tools with JSON schemas.

---

## Tool Set (5 imperative + declarative forms)

| # | Tool | Input | Output | Maps to |
|---|------|-------|--------|---------|
| 1 | `list_voices` | `{ language?, tone?, licenseType? }` | Array of voice objects (id, name, description, tags, price, previewUrl) | `GET /api/marketplace/voices` |
| 2 | `play_voice_sample` | `{ voiceId }` | `{ status: 'playing', voiceId }` | Existing audio player on VoiceCard |
| 3 | `get_voice_details` | `{ voiceId }` | Full voice detail (tags, pricing, license terms, contributor) | `GET /api/marketplace/voices` filtered |
| 4 | `license_voice` | `{ voiceId, licenseType: 'exclusive'\|'non-exclusive' }` | `{ status: 'opened', voiceId, licenseType }` — opens checkout flow | `POST /api/marketplace/license` |
| 5 | `vocalize` | `{ text, voiceId, preview? }` | `{ audioUrl, cost, recordingId }` | `POST /api/agents/vocalize` |

### Declarative forms
Voice search form on marketplace: `<form toolname="search_voices" tooldescription="Search VOISSS voices by language, tone, or price.">` with inputs for `language`, `tone`, `maxPrice`.

Voice clone form on studio: `<form toolname="voice_clone" tooldescription="Create a voice clone from reference audio.">` with existing studio inputs.

---

## File Structure

```
apps/web/src/app/marketplace/
├── page.tsx                          # existing "use client" — add WebMCP init + declarative form
└── webmcp-register.ts                # NEW — imperative tool registrations

apps/web/src/app/studio/
├── page.tsx                          # existing "use client" — add declarative forms

apps/web/src/lib/
├── webmcp-polyfill.ts                # NEW — thin wrapper: load polyfill, init if no native support
└── webmcp-tools.ts                   # NEW — all 5 imperative tool definitions

apps/web/public/
└── .well-known/
    └── agent.json                    # existing — add "webmcp": { enabled: true }
```

## Implementation Steps

### Step 1: Install dependencies (0.5h)
```bash
pnpm add -D webmcp-types
```

### Step 2: Polyfill wrapper (0.5h)
`lib/webmcp-polyfill.ts`:
- Import Google's polyfill (copy from `demos/shared/webmcp-polyfill.js`)
- Check for `document.modelContext` (skip if native Chrome/Edge)
- Export `initWebMCP()` called once per page

### Step 3: 5 imperative tools (3h)
`lib/webmcp-tools.ts`:
- Import `initWebMCP()`
- Register each tool via `document.modelContext?.registerTool()`
- Each tool's `execute` function calls existing VOISSS APIs or manipulates existing DOM

### Step 4: Marketplace page integration (1.5h)
`apps/web/src/app/marketplace/page.tsx`:
- Already `"use client"` — perfect
- Add declarative form for voice search
- Call `registerWebMCPTools()` in useEffect

### Step 5: Studio page integration (1.5h)
`apps/web/src/app/studio/page.tsx`:
- Add `toolname`/`tooldescription`/`toolparamdescription` attributes to existing form inputs
- Register imperative tools for voice clone and submit

### Step 6: Update agent.json (0.25h)
Add `"webmcp": { "enabled": true, "tools": ["list_voices", "vocalize", ...] }` to `.well-known/agent.json`

### Step 7: Deploy + test (2h)
- Push to main → Netlify deploys
- Test in ChatGPT in-app browser (supports WebMCP natively)
- Test in Chrome with `chrome://flags/#enable-webmcp-testing`
- Verify `getTools()` returns 5 tools via browser console

### Step 8: Demo video (2h)
Record a Loom:
1. Open `voisss.netlify.app/marketplace` in ChatGPT browser
2. Agent says: *"Find me a professional female voice, generate a 15-second intro, and play it."*
3. Agent calls `list_voices(tone='professional')` → filters → picks voice
4. Agent calls `vocalize(text='Welcome to VOISSS...', voiceId='...')` → gets audio URL
5. Audio plays in browser
6. Agent: *"Here's the sample. Want me to license it?"*
7. Agent calls `license_voice(voiceId, 'non-exclusive')` → checkout opens
8. End with summary

---

## Technical Notes

### Name constraints
Tool names must match `[a-zA-Z0-9_.-]{1,128}` (spec section).

### Execution model
WebMCP tools run **client-side** in the browser. The `execute` function can:
- Fetch from your Next.js API (as we do for `list_voices` and `vocalize`)
- Manipulate existing DOM elements (for `play_voice_sample`)
- Navigate to a page with pre-filled params (for `license_voice`)

### State management
No state to manage — each tool call is independent. The voice catalog is fetched from the API on each `list_voices` call. Audio playback uses existing components.

### Edge cases
- `vocalize` returns 402 for unpaid requests → tool returns `{ error: 'payment_required', details: {...} }` with the full payment response
- `license_voice` opens checkout → returns `{ status: 'opened' }` — user completes manually
- Voice samples are audio files → `play_voice_sample` finds the existing `<audio>` element and calls `.play()`

### Devpost submission checklist
- [ ] Live URL: `https://voisss.netlify.app/marketplace`
- [ ] Loom demo video (<3 min public)
- [ ] Open-source GitHub repo with license
- [ ] README with WebMCP integration section
- [ ] `document.modelContext.registerTool()` code visible in source

---

## Risks

| Risk | Mitigation |
|------|-----------|
| ChatGPT browser version doesn't have WebMCP | Use ChatGPT Plus/Pro with latest version; fallback test in Chrome origin trial |
| Netlify deploy delays demo | Pre-deploy to a custom domain if needed |
| Tool descriptions must be accurate to real behavior | Test each tool end-to-end before recording demo |
| Voice samples require auth for some voices | Preview mode works without auth; use preview voices for demo |

---

## Post-challenge: what this unlocks

1. **Base Builder Grant** — this demo is stronger than any usage campaign. An agent actually using VOISSS from a browser page is the strongest signal possible.
2. **OpenAI showcase** — selected projects get featured on the WebMCP showcase page.
3. **Agent discoverability** — any agent that supports WebMCP can now interact with VOISSS directly in-browser, without any backend integration needed.