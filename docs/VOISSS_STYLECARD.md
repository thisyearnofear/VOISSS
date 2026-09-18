# VOISSS Stylecard — “Licensed Signal”

*Goal → Format → Layout → Type → Color → Constraints. Specs beat vibes.*
*Refs: MengTo/sylva (procedural hero, one loop, reduced-motion, sandboxed WebGL) + MengTo/Skills web-design (81 skills) + ui/design-first-ui-prompting.*

---

### Goal
Make VOISSS **remembered as the voice terrain** — not “another dark marketplace”.

- **Positioning:** Financial infrastructure for voice IP (tokenized RWA + 70/30 programmatic royalty + agent-to-agent x402 on Base). Not a storefront.
- **Memory anchor:** One obsessive detail judges can describe in one sentence: *“the dark editorial page where the waveform field parts around your finger.”*
- **Conversion:** Human in 8s understands: 1) try any voice free, 2) agent can pay itself on-chain, 3) contributor earns 70%.

> Sylva lesson: *One procedural system at 130k-blade depth beats 20 tricks.* VOISSS gets one: **Voice Terrain**.

---

### Format
- **Desktop:** 12-col editorial with a **framed container** — visible rules, not floating cards. Wireframe page index in left rule.
- **Mobile:** Single column, terrain stays (reduced density), copy stacks, dock anchors bottom.
- No centered SaaS hero. Headline left-aligned, terrain right/ambient. Like Sylva’s conservation editorial: keep composition, replace generic decoration with *original procedural geometry*.

---

### Layout — constraints

```
┌ container-lines ──────────────────────────┐
│ 01  VOISSS  ·  Base 8453  ·  70/30        │  ← technical wireframe info bar
│ ┌ nested-frame ───────────────────────┐   │
│ │                                     │   │
│ │  H1 masked-reveal                   │   │
│ │  mono rule  $0.000001/char  0xBE85…  │   │
│ │  [ Try Demo · beam-glow ] [ Browse ]│   │
│ │                          ↖ terrain  │   │  ← canvas voice field, pointer-reactive
│ └─────────────────────────────────────┘   │
│  progressive-blur under terrain           │
└──────────────────────────────────────────┘
```

- Use: `framed-grid-layout` + `nested-container-frames` + `editorial-tech` + `split-layout-technical`.
- Frame is always visible: `container-lines` (hairline + tick marks), `corner-diagonals` only on hero frame — nowhere else.
- Terrain is **sandboxed** to hero (one canvas, one loop, DPR-capped at 2). Like Sylva’s liquid-metal iframes — isolated state, no global WebGL leak.
- Single animation loop shares terrain + masked reveals + beam glow. No ad-hoc `setInterval`.
- `progressive-blur` behind terrain → text stays legible at any scroll.

---

### Type

- **Display:** `Syne` (already loaded) for H1/H2 — tight `-0.04em`, 700, 56–72px desktop. No gradient text on long phrases; gradient only on 2–3 word lockup if used.
- **Mono:** `Courier Prime` for every data point: `0xBE85…`, `70/30`, `$0.000001`, `/api/agents/vocalize`, `Base 8453`, `70% → contributor`. This is the “infrastructure” signal.
- **Body:** `Inter` 14–16px, `text-zinc-400`, max 58ch. Headlines do the seduction; body does the explaining.
- **Numbers:** `number-details` treatment — tabular-mono, thin rules above value.
- Hierarchy: `H1 (editorial) → mono rule (proof) → CTAs (action) → terrain (world)`. No third font.

---

### Color

```css
--voiss-ink:     #0A0A0A;   /* bg primary — keep */
--voiss-paper:   #F6F1EB;   /* editorial light frame — use only inside nested-frame on dark? no — keep dark paper */
--voiss-field:   #141018;   /* terrain underlay */
--voiss-violet:  #7C5DFA;   /* primary — only CTA solid + beam glow */
--voiss-violet-2:#9C88FF;   /* border-gradient stop, specular rim */
--voiss-cyan:    #22D3EE;   /* secondary accent for AI side — never on same button as violet */
--voiss-line:    rgba(255,255,255,0.08); /* container-lines */
--voiss-line-strong: rgba(255,255,255,0.14);
```

- Dark editorial = `#0A0A0A` page + `#111` nested frame + `white/[0.08]` rules. No pure white surfaces.
- Gradient used once: beam-glow CTA. Else flat or `css-border-gradient`.
- Terrain palette: violet→cyan HLS noise at 6% opacity — never saturated. Like Sylva moss: procedural but muted.

---

### Motion — defaults (stolen from Sylva + Skills)

| Element | Duration | Ease | Notes |
|---------|----------|------|-------|
| Masked reveal (H1, mono rule) | 0.7s | `cubic-bezier(0.22,1,0.36,1)` | `masked-reveal` / `staggered-word-reveal`, 40ms stagger |
| Container lines draw | 1.0s | `power2.out` | On view, once |
| Terrain entrance | 0.9s | `power1.out` | Opacity + slight y |
| Beam glow on CTA hover | 0.35s | `power2.out` | `beam-glow-states` — moving specular |
| Progressive blur | 0.5s | linear | Scroll-linked, no JS on body |
| Reduced motion | — | — | `prefers-reduced-motion: reduce` → static terrain grad, no pointer trail, instant reveals |

One loop owns terrain + dock + reveals (Sylva pattern). Never nest independent RAFs.

---

### References — direct lineage

- **Sylva:** Procedural seeded root + 130k instanced moss + pointer parting + pollen + spring dock + liquid-metal sandboxed controls + pixel-reveal photos + reduced-motion path + no external request.
- **Skills used:** `editorial-tech` / `framed-grid-layout` / `nested-container-frames` / `technical-wireframe-info-layout` / `container-lines` / `corner-diagonals` / `css-border-gradient` / `progressive-blur` / `beam-glow-states` / `masked-reveal` / `staggered-word-reveal` / `animation-on-scroll` / `add-shader-cursor-trail`→`pointer-trail-emitter` / `threejs-landscape` (lite) / `beautiful-shadows` / `number-details`.

---

### Negative prompts — what NOT to do

- No centered gradient hero with 3 purple blobs + “Browse Voices / Start Recording” twins. That’s why you were forgettable.
- No “feature 3-up floating cards” with soft shadows. Use framed cells with rules.
- No flying-in-from-all-sides. Only masked-reveal + line draw.
- No glass-morphism everywhere, no dither + laser + grid together. Pick: **container-lines + one progressive-blur + one beam-glow**. Restraint = Awwwards.
- No WebGL globe, liquid button outside hero, or 5 shaders. One terrain, sandboxed.
- No live blockchain tickers in hero — save `AgentRegistry 0xBE85…` for mono rule only.
- No new font. No new color. Work inside `#0A0A0A → #7C5DFA → white/08`.

---

### Components shipped this pass

1. **VoiceTerrain.tsx** — 2D procedural field (seeded ribs + instanced specks, pointer repulsion + velocity pollen, DPR 2, <50KB, reduced-motion static). Own loop.
2. **craft.css additions** — `container-lines`, `corner-diagonals`, `css-border-gradient`, `progressive-blur`, `beam-glow`, `masked-reveal`.
3. **EnhancedLandingHero** rebuild — editorial frame + wireframe index + masked H1 + terrain ambient + beam-glow primary.
4. Small tune: `OriginalVsAiShowcase`, `QuickVoicePreview`, `PersonaConversion` → framed cells (no new palette).

---

### Acceptance

- [ ] First paint hero is readable without JS (terrain behind static grad fallback).
- [ ] One finger test: move pointer → field parts visibly around cursor at 60fps on M1, no jank.
- [ ] Lighthouse reading: framed rules visible at 375px, reduced-motion disables motion, no layout shift.
- [ ] 5-second description test: a stranger can describe one detail (“the field thing”) unprompted.
