# /studio "Earn 70%" Hero

The `/studio` page (contributor recording tool) opens with a short
hero that closes the click-through from the homepage showcase. The
homepage's `OriginalVsAiShowcase` expands to explain the product
thesis and links the **70%** claim to `/studio` with no context —
this hero is the landing context for those visitors.

```
┌──────────────────────────────────────────────────┐
│  ✨ For voice contributors                       │
│                                                  │
│  Earn 70% of every character an AI agent         │
│  speaks in your voice.                           │
│                                                  │
│  Record your voice once. License it to AI        │
│  agents on the marketplace. Get paid             │
│  automatically every time they speak.            │
│                                                  │
│  [🎤 Start recording →]  [See the marketplace]   │
│                                                  │
│  ┌─ Step 1 ─┐  ┌─ Step 2 ─┐  ┌─ Step 3 ─┐        │
│  │ 🎤       │  │ 📋       │  │ 💰       │        │
│  │ Record   │  │ List     │  │ Earn     │        │
│  │ your     │  │ your     │  │ 70% of   │        │
│  │ voice    │  │ voice    │  │ every    │        │
│  │          │  │          │  │ char     │        │
│  └──────────┘  └──────────┘  └──────────┘        │
└──────────────────────────────────────────────────┘
        ↓ scroll
   [ RecordingStudio component — the actual tool ]
```

## How it answers the visitor's first three questions

| Question | Where the hero answers it |
|---|---|
| What is this? | Headline: "Earn 70% of every character an AI agent speaks in your voice." |
| How does it work? | 3-step strip: **Record → List → Earn** |
| What do I do now? | "Start recording" CTA scrolls to `#recording-section` (the existing recording tool mounted by the page) |

The recording tool is mounted by `StudioPageInner` directly below the
hero, so a single click takes the visitor from the value prop to the
action. The 3-step strip is deliberately informational, not
interactive — clicking any step scrolls the same anchor.

## File layout

| Piece | Path |
|---|---|
| Component | `apps/web/src/components/StudioEarningsHero.tsx` |
| Page wire-up | `apps/web/src/app/studio/page.tsx` (renders above `<RecordingStudio />`) |
| Anchor target | `id="recording-section"` on the wrapper around `<RecordingStudio />` |

The hero is a client component (uses `framer-motion` for the
entrance stagger) but does **not** use any browser-only APIs. It
renders fully on the server, so there is no flash of empty space
before hydration.

## Design choices

- **Same ambient blobs as the homepage hero** (purple top-left,
  blue bottom-right) so visitors feel they've arrived somewhere
  related, not a different product.
- **Gradient text on "70%"** mirrors the way the homepage showcase
  uses gradient text for "Real human" and "Licensed AI" — the
  visual cue says "this is the same number the page promised."
- **3-step strip uses muted cards** so the page below (the actual
  recording tool) remains visually dominant once the visitor
  scrolls. The hero is supposed to be skimmable, not the main event.
- **Secondary CTA "See the marketplace first"** is intentionally
  low-affordance (text button, not gradient). It's there for
  visitors who aren't ready to record but want to see what the
  product looks like in production.

## Updating the copy

All hero copy lives at the top of `StudioEarningsHero.tsx` as plain
strings. The 3-step body text is the most likely thing to want
editing as the revenue model evolves — if the split ever changes
from 70/30, that's the only place to update besides the matching
copy in `OriginalVsAiShowcase.tsx` and the homepage hero.

## Test path

After deploying, click the **70%** link in the homepage
`OriginalVsAiShowcase` "Why two waveforms?" expand. You should land
on `/studio` with the hero above the fold. The "Start recording"
button should smooth-scroll to the recording tool below.
