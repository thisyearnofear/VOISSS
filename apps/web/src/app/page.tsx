"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import HomeStructuredData from "../components/HomeStructuredData";
import SplitBar from "../components/SplitBar";
import VoiceTerrain from "../components/VoiceTerrain";
import { SignalRibbon } from "../components/listening/SignalRibbon";
import { VoiceAuditionRow } from "../components/listening/VoiceAuditionRow";
import { Button, Chip, Disclosure } from "../components/ui";
import { useListeningPlayback, useListeningRoom } from "../contexts/ListeningRoomContext";
import { useVoiceCatalog } from "../hooks/useVoiceCatalog";
import { pulseVoice } from "../lib/terrain-bus";
import { initTelemetry, flushNow } from "../lib/telemetry";

if (typeof window !== "undefined") {
  initTelemetry();
  window.addEventListener("popstate", flushNow);
}

const EXAMPLE_BRIEFS = [
  "Calm narration",
  "A warm welcome",
  "An energetic ad",
];

const PIPELINE = [
  {
    stage: "s/01",
    title: "Brief",
    desc: "Plain English — “warm narrator for a sleep app, unhurried”. No taxonomy to learn.",
  },
  {
    stage: "s/02",
    title: "Archetype",
    desc: "The brief resolves to a matching archetype — meditation, ad read, narration — each with its own target profile.",
  },
  {
    stage: "s/03",
    title: "Six dimensions",
    desc: "Every voice is scored on neutral acoustic dimensions: energy, pace, express, warmth, authority, intimacy.",
  },
  {
    stage: "s/04",
    title: "Ranked + reasons",
    desc: "Fit decomposes into auditable labels — “calm energy · unhurried · warm”. The rubric is versioned and cited.",
  },
];

export default function Home() {
  const router = useRouter();
  const { draft, updateDraft } = useListeningRoom();
  const playback = useListeningPlayback();
  const { query, voices } = useVoiceCatalog();

  // Live catalog size for the wireframe index — honest number, quiet fallback.
  const sampleVoices = voices.filter((v) => Boolean(v.sampleUrl)).slice(0, 3);

  // Brief = ripple: a pause in typing lifts a voice off the terrain, so the
  // hero answers the words as they arrive.
  const rippleTimer = useRef<number | null>(null);
  useEffect(() => {
    return () => {
      if (rippleTimer.current) window.clearTimeout(rippleTimer.current);
    };
  }, []);
  const onBriefChange = (value: string) => {
    updateDraft({ brief: value.slice(0, 500) });
    if (rippleTimer.current) window.clearTimeout(rippleTimer.current);
    rippleTimer.current = window.setTimeout(() => pulseVoice("lift"), 550);
  };

  const goDiscover = (value: string) => {
    const q = value.trim();
    updateDraft({ brief: q });
    router.push(q ? `/marketplace?brief=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <main id="listening-main" className="lr-home">
      <HomeStructuredData />

      {/* ── Hero — the field itself. A living terrain the brief disturbs, an
           audition console that answers. The page performs the match. ─────── */}
      <section className="lr-home-hero lr-dark voisss-frame voisss-terrain-bg">
        <VoiceTerrain />
        <div className="lr-hero-scrim" aria-hidden />
        <div className="lr-hero-inner">
          {/* Main grid — copy + instrument */}
          <div className="lr-home-copy">
            <small className="lr-eyebrow voisss-masked-reveal">A voice worth listening to.</small>
            <h1 className="lr-h1 voisss-masked-reveal voisss-masked-reveal-delay-1">
              Find the voice your project needs.
            </h1>
            <p className="lr-lede voisss-masked-reveal voisss-masked-reveal-delay-2">
              Describe the sound. Hear the options. Try your words.
            </p>

            {/* The search — floating console; demonstrates the match here,
                submits into the live marketplace */}
            <form
              className="lr-hero-console voisss-masked-reveal voisss-masked-reveal-delay-3 voisss-specular"
              onSubmit={(e) => {
                e.preventDefault();
                goDiscover(draft.brief);
              }}
            >
              <label htmlFor="home-brief" className="lr-label">
                What should it sound like?
              </label>
              <div className="lr-hero-console-row">
                <input
                  id="home-brief"
                  type="text"
                  className="lr-input"
                  value={draft.brief}
                  onChange={(e) => onBriefChange(e.target.value)}
                  placeholder="warm narrator for a sleep app, unhurried"
                  maxLength={500}
                />
                <Button type="submit">
                  Find a voice <ArrowRight className="w-4 h-4" aria-hidden />
                </Button>
              </div>
            </form>

            <div className="lr-examples">
              {EXAMPLE_BRIEFS.map((example) => (
                <Chip key={example} onClick={() => goDiscover(example)}>
                  {example}
                </Chip>
              ))}
            </div>

            <p className="lr-quiet">Listen to catalog samples. No account needed.</p>
          </div>

          {/* The instrument — a real rubric match, replayed in-browser */}
          <section
            className="lr-audition lr-hero-audition voisss-masked-reveal voisss-masked-reveal-delay-2 voisss-container-lines"
            aria-label="Listen to voices"
          >
            {/* Wireframe index */}
            <header className="lr-audition-head">
              <h2>Start by listening</h2>
              <span>Catalog samples</span>
            </header>
            {/* Licensed Signal — procedural field, pointer-reactive, one rAF */}
            <SignalRibbon playing={playback.status === "playing"} />
            {query.isLoading && (
              <p className="lr-quiet" role="status">Loading voices…</p>
            )}
            {query.isError && (
              <p className="lr-error-text" role="status">
                Voices could not be loaded.{" "}
                <Chip onClick={() => void query.refetch()}>Retry</Chip>
              </p>
            )}
            {!query.isLoading && !query.isError && sampleVoices.length === 0 && (
              <p className="lr-quiet">No catalog samples are available right now.</p>
            )}
            {/* ── Hear it — playback energizes the field behind the glass ────── */}
            {sampleVoices.map((voice) => (
              <VoiceAuditionRow key={voice.id} voice={voice} />
            ))}
          </section>
        </div>
      </section>

      <div className="lr-wrap">
        {/* Bottom proof strip */}
        <section className="lr-home-proof">
          <h2>Find the fit. Keep the context.</h2>
          {/* ── Three paths ──────────────────────────────────────────────────── */}
          <div className="lr-entries">
            <Link className="lr-entry voisss-specular voisss-specular-light" href="/marketplace">
              <h3>For your next project</h3>
              <p>
                Describe the voice in plain English, hear ranked matches with
                reasons, then carry your pick into the workspace to try your own
                words.
              </p>
            </Link>
            <Link className="lr-entry voisss-specular voisss-specular-light" href="/developers">
              <h3>For your application</h3>
              <p>
                One POST to /api/agents/vocalize. OpenAPI spec, x402
                micropayments, and voices licensed for programmatic use.
              </p>
            </Link>
          </div>
          <p className="lr-quiet">
            Have a voice worth licensing?{" "}
            <Link href="/sell" style={{ color: "var(--lr-accent)" }}>
              Contributors record or import in the Studio →
            </Link>
          </p>
        </section>

        {/* ── Pipeline — the match, anatomised ─────────────────────────────── */}
        <Disclosure title="How a match is made">
          <div className="lr-pipeline">
            {PIPELINE.map((s) => (
              <div key={s.stage} className="lr-pipeline-stage">
                <h4>{s.title}</h4>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <p className="lr-quiet">
            <Link href="/benchmarks" style={{ color: "var(--lr-accent)" }}>
              Measured vs GPT-4o-mini on the benchmarks page →
            </Link>
          </p>
        </Disclosure>

        {/* ── Economics — the split, drawn not claimed ─────────────────────── */}
        <Disclosure title="On-chain economics">
          <div className="lr-legacy-inset">
            <div className="lr-pipeline">
              <div className="lr-pipeline-stage" style={{ background: "var(--lr-night-raised)", borderColor: "var(--lr-night-line)" }}>
                <h4>License purchases</h4>
                <SplitBar variant="license" />
                <p style={{ marginTop: "0.75rem" }}>
                  Split at purchase time, on-chain. The proportion is a contract
                  constant — platformFeeBps 3000 — not a promise.
                </p>
              </div>
              <div className="lr-pipeline-stage" style={{ background: "var(--lr-night-raised)", borderColor: "var(--lr-night-line)" }}>
                <h4>x402 recording sales</h4>
                <SplitBar variant="x402" />
                <p style={{ marginTop: "0.75rem" }}>
                  The better deal for creators — platformFeePercent 5 in
                  VoiceRecords.sol, so 95% of every access payment is theirs.
                </p>
              </div>
            </div>
          </div>
        </Disclosure>

        {/* ── Footer ───────────────────────────────────────────────────────── */}
        <footer className="lr-home-footer">
          <Link href="/help">Help</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/sell">Contributors</Link>
          <Link href="/developers">Developers</Link>
        </footer>
      </div>
    </main>
  );
}
