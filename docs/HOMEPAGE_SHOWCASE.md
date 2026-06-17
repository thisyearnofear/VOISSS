# Homepage Hero — "Real Human vs. Licensed AI" Showcase

The homepage (`apps/web/src/app/page.tsx`) places a side-by-side waveform
comparison directly under the hero CTAs. It shows the same sentence
spoken first by a real human narrator, then synthesized by an AI voice
licensed through VOISSS — the central thesis of the product, in one
visual.

```
"The thousand injuries of Fortunato I had borne as I best could,
 but when he ventured upon insult, I vowed revenge."
                                    — E. A. Poe, The Cask of Amontillado (1846)

 ┌─ LibriVox narrator ─────┐  ┌─ ElevenLabs · George ─────┐
 │  ▌▌▌▌█▌▌█▌█▌▌▌▌█▌▌▌▌█▌▌  │  ▌▌▌█▌█▌▌▌▌▌▌▌▌█▌▌▌▌▌▌▌▌ │
 │  Real human · CC0       │  │  Licensed AI · same line │
 └─────────────────────────┘  └──────────────────────────┘
                     ▶  Tap to play both sides
```

## Why this matters

VOISSS sells *licensed human voices for AI agents*. The page needed
to make that legible in under five seconds. Generic AI-voice products
lead with synthesis quality. Ours leads with provenance — the left bar
is a real person, the right bar is their voice being used by an agent.
A single visual encodes the whole product differentiator.

## How it works

| Piece | Where | Notes |
|---|---|---|
| Component | `apps/web/src/components/OriginalVsAiShowcase.tsx` | Client component, lazy AudioContext, real Web Audio API analysers |
| Page wire-up | `apps/web/src/app/page.tsx` | Renders between `<EnhancedLandingHero />` and `<InteractiveHowItWorks />` |
| Human audio | `apps/web/public/showcase/voice-human.mp3` | LibriVox narrator reading Poe (CC0) |
| AI audio | `apps/web/public/showcase/voice-ai.mp3` | ElevenLabs "George" voice, same sentence |

- A single play button drives both audio elements in parallel.
- The waveforms are drawn from `AnalyserNode` frequency data each
  animation frame — they reflect real amplitude of the playing audio,
  not a fake animation.
- `AudioContext` is created on first click to satisfy browser autoplay
  policies. Nothing fires before user interaction.
- The expandable "Why two waveforms?" footer links the **70%** revenue
  claim to `/studio` so curious visitors land on the contributor
  funnel.

## Replacing the placeholder with a real contributor

The current human sample is a LibriVox placeholder (Poe, CC0) so the
showcase works without a recorded contributor. When a real contributor
gives consent to appear on the homepage:

1. **Get the recording.** WAV or MP3, 6–10 seconds, a single sentence
   with natural prosody variation. The current sentence is the first
   line of *The Cask of Amontillado*; if you change it, change
   `SENTENCE` in the component and re-render both audio files.
2. **Loudness-normalize** to ~-16 LUFS for visual parity with the AI
   side. A reasonable `ffmpeg` incantation:

   ```bash
   ffmpeg -i input.mp3 -af \
     "loudnorm=I=-16:TP=-1.5:LRA=11,highpass=f=80,lowpass=f=12000" \
     -ar 44100 -ac 1 -b:a 128k voice-human.mp3
   ```

3. **Re-render the AI side** with the same sentence, using whichever
   TTS pipeline the marketplace uses for that contributor's voice
   (today: ElevenLabs, voice id from `/api/marketplace/voices`).

4. **Replace both files** at
   `apps/web/public/showcase/voice-human.mp3` and `…/voice-ai.mp3`.
   Both are gitignored by the root `public` pattern, so add with
   `git add -f` or amend the existing commit.

5. **Update the labels** in the component — `HUMAN_VOICE_LABEL` and
   `HUMAN_VOICE_SUB` — to reflect the real contributor
   (e.g. `"Mara · Audiobook narrator"`,
   `"Real human · licensed to VOISSS"`).

6. **Verify** by running `pnpm dev:web` and visiting `http://localhost:4445`.
   The play button should start both clips together; the bars should
   animate in sync.

The component itself is voice- and sentence-agnostic — no other
changes are needed.

## Attribution

- **Human sample:** *The Cask of Amontillado* by Edgar Allan Poe
  (1846, public domain), read by a LibriVox volunteer (CC0 release).
- **AI sample:** Synthesized for the showcase via ElevenLabs
  (`eleven_multilingual_v2`, "George" voice). The current placeholder
  is intentionally not a VOISSS-marketplace voice — swap as above.
