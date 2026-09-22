"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Loader2, Mic, Pause, Play } from "lucide-react";
import TerrainBand from "@/components/marketplace/TerrainBand";
import SplitBar from "@/components/SplitBar";
import { RuntimeInlineCallout } from "@/components/payment/RuntimePaymentChips";
import { Badge, Button, Chip, Disclosure, Notice } from "@/components/ui";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";
import { useVoiceCatalog } from "@/hooks/useVoiceCatalog";
import { useVoicePreview } from "@/hooks/useVoicePreview";
import { previewRequestBody } from "@/lib/listening-preview";
import { DEMO_VOICES, voiceDisplayName } from "@/lib/voice-detail";
import { voiceMetaLine } from "@/components/listening/VoiceAuditionRow";

const DEFAULT_TEXT =
  "Your agent can speak with licensed human voices. One POST — metered per character, settled on Base.";

const linkStyle: React.CSSProperties = {
  color: "var(--lr-accent)",
  minHeight: "44px",
  display: "inline-flex",
  alignItems: "center",
};

const QUICKSTART_SNIPPETS = [
  {
    id: "curl",
    name: "cURL",
    icon: "⎈",
    code: `curl -X POST https://voisss.netlify.app/api/agents/vocalize \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "AI agents deserve authentic human voices.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "agentAddress": "0xYOUR_WALLET",
    "preview": true
  }'`,
  },
  {
    id: "fetch",
    name: "TypeScript",
    icon: "◆",
    code: `// Any fetch-compatible stack works — Node, edge, browser.
const response = await fetch(
  "https://voisss.netlify.app/api/agents/vocalize",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Your AI agent can speak with licensed human voices.",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      agentAddress: "0xYOUR_WALLET",
      preview: true, // Free preview, no payment needed
    }),
  }
);

// Previews stream audio/mpeg; paid calls return JSON with audioUrl.
const { audioUrl } = (await response.json()).data;`,
  },
  {
    id: "langchain",
    name: "LangChain",
    icon: "🦜",
    code: `import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

// Give your agent a "speak" tool backed by a licensed human voice.
export const speakTool = new DynamicStructuredTool({
  name: "speak",
  description: "Say text aloud with a licensed human voice",
  schema: z.object({ text: z.string() }),
  func: async ({ text }) => {
    const res = await fetch(
      "https://voisss.netlify.app/api/agents/vocalize",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: "21m00Tcm4TlvDq8ikWAM",
          agentAddress: "0xYOUR_WALLET",
        }),
      }
    );
    return (await res.json()).data.audioUrl;
  },
});`,
  },
  {
    id: "eliza",
    name: "Eliza",
    icon: "🤖",
    code: `// Eliza plugin for VOISSS voice generation
const voisssPlugin = {
  name: "voisss",
  actions: [
    {
      name: "GENERATE_SPEECH",
      handler: async (runtime, message, state) => {
        const response = await fetch(
          "https://voisss.netlify.app/api/agents/vocalize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: message.content.text,
              voiceId: "21m00Tcm4TlvDq8ikWAM",
              agentAddress: runtime.agentId,
            }),
          }
        );
        return response.json();
      },
    },
  ],
};`,
  },
];

const AGENTIC_SNIPPET = `fetch("https://voisss.netlify.app/api/agents/vocalize", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-DYNAMIC-WALLET": "1"  // ← the agent's server wallet pays
  },
  body: JSON.stringify({
    text: "warm female ad for NYC coffee shop, 15s",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    agentAddress: "0xYourAgent"
  })
});
// → server signs TransferWithAuthorization (EIP-3009)
// → facilitator verifies → audio + IPFS + 70/30 split`;

/** Token-styled code block with a header row and copy control. */
function CodeBlock({ label, code }: { label: string; code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="lr-code">
      <div className="lr-code-head">
        <span>{label}</span>
        <button
          type="button"
          className="lr-code-copy"
          aria-label={`Copy ${label} snippet`}
          onClick={() => {
            navigator.clipboard
              .writeText(code)
              .then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              })
              .catch(() => {});
          }}
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5" aria-hidden /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden /> Copy
            </>
          )}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function DevelopersPage() {
  const { player } = useListeningRoom();
  const playback = useListeningPlayback();
  const { query, voices } = useVoiceCatalog();
  const [voiceId, setVoiceId] = useState("");
  const [text, setText] = useState(DEFAULT_TEXT);
  const [activeTab, setActiveTab] = useState(QUICKSTART_SNIPPETS[0].id);

  // Real catalog voices; the curated demo voice keeps the panel usable when
  // the catalog is unreachable.
  const selectedVoice =
    voices.find((v) => v.id === voiceId) ??
    voices[0] ??
    DEMO_VOICES["demo-rachel"];

  const trackVocalize = () => {
    fetch("/api/marketplace/match-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "voice_vocalize",
        voiceId: selectedVoice.id,
        brief: "",
      }),
      keepalive: true,
    }).catch(() => {});
  };

  const {
    generate,
    clearResult,
    generating,
    error,
    audioUrl,
    audioIsBlob,
    generationsLeft,
    allowanceReady,
    resultTrack,
  } = useVoicePreview(selectedVoice, voiceDisplayName(selectedVoice), {
    onVocalized: trackVocalize,
  });

  const resultPlaying =
    resultTrack !== null &&
    playback.track?.id === resultTrack.id &&
    playback.status === "playing";

  const activeSnippet =
    QUICKSTART_SNIPPETS.find((s) => s.id === activeTab) ??
    QUICKSTART_SNIPPETS[0];

  // The exact call the live preview makes — the bridge from try → integrate.
  const lastCallSnippet = [
    'fetch("/api/agents/vocalize", {',
    '  method: "POST",',
    '  headers: { "Content-Type": "application/json" },',
    `  body: JSON.stringify(${JSON.stringify(previewRequestBody(text, selectedVoice), null, 2).split("\n").join("\n  ")}),`,
    "});",
  ].join("\n");

  return (
    <main id="listening-main">
      <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Developers</span>
        </nav>

        <header
          className="lr-discover-head"
          style={{ paddingTop: "var(--lr-space-md)" }}
        >
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}
          >
            Give your agent a voice.
          </h1>
          <p className="lr-lede">
            One POST. Licensed human voices, metered per character, settled on
            Base.
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginTop: "1rem",
            }}
          >
            <Badge>x402 · metered per character</Badge>
            <Badge>Settles on Base</Badge>
            <Badge>70% to voice owners</Badge>
          </div>
        </header>

        {/* The shared signal field — the preview below wakes it. */}
        <div
          className="lr-legacy-inset"
          style={{ padding: 0, overflow: "hidden" }}
        >
          <TerrainBand
            eyebrow="Signal"
            readyLabel="Idle — run a preview to wake it"
            heightClass="h-[128px] sm:h-[148px]"
          />
        </div>

        {/* Tier 0 — a working request, not a promise. */}
        <section
          className="lr-audition"
          style={{ marginTop: "var(--lr-space-lg)" }}
          aria-label="Try a real request"
        >
          <div className="lr-audition-head">
            <h2>Make a real request</h2>
            <span role="status">
              {allowanceReady && generationsLeft > 0
                ? `${generationsLeft} free preview${generationsLeft !== 1 ? "s" : ""} left`
                : allowanceReady
                  ? "Preview limit reached"
                  : "…"}
            </span>
          </div>

          <div style={{ display: "grid", gap: "0.75rem" }}>
            <div>
              <label htmlFor="dev-voice" className="lr-label">
                Voice
              </label>
              <select
                id="dev-voice"
                className="lr-select"
                value={selectedVoice.id}
                onChange={(e) => {
                  setVoiceId(e.target.value);
                  clearResult();
                }}
                disabled={generating || query.isLoading}
              >
                {query.isLoading && <option>Loading voices…</option>}
                {!query.isLoading && voices.length === 0 && (
                  <option value={DEMO_VOICES["demo-rachel"].id}>
                    Rachel — demo voice
                  </option>
                )}
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {voiceDisplayName(v)}
                    {voiceMetaLine(v) ? ` — ${voiceMetaLine(v)}` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="dev-script" className="lr-label">
                Text
              </label>
              <textarea
                id="dev-script"
                className="lr-textarea"
                rows={3}
                maxLength={500}
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  clearResult();
                }}
                disabled={generating}
              />
            </div>
          </div>

          {error && (
            <p
              className="lr-error-text"
              role="status"
              style={{ marginTop: "0.75rem" }}
            >
              {error}
            </p>
          )}

          {generationsLeft > 0 ? (
            <>
              <div style={{ marginTop: "1rem" }}>
                <Button
                  onClick={() => void generate(text)}
                  disabled={!allowanceReady || generating || !text.trim()}
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
                      <span>Generating…</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4" aria-hidden />
                      <span>Run a free preview</span>
                    </>
                  )}
                </Button>
              </div>
              <p className="lr-quiet">
                No key, no wallet · up to 500 characters · shares the workspace
                preview budget
              </p>
            </>
          ) : (
            <Notice style={{ marginTop: "1rem" }}>
              <p style={{ margin: 0, fontWeight: 600, color: "var(--lr-ink)" }}>
                Preview limit reached
              </p>
              <p style={{ margin: "0.4rem 0 0.75rem" }}>
                Browser previews are used up. The snippets below are the same
                call with your own key and wallet.
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <Link href="/marketplace" className="lr-btn lr-btn-ghost">
                  Browse voices
                </Link>
                <Link href="/generate" className="lr-btn lr-btn-ghost">
                  Open the workspace
                </Link>
              </div>
            </Notice>
          )}

          {audioUrl && resultTrack && (
            <div className="lr-result">
              <p style={{ margin: 0, fontWeight: 600 }}>Your preview is ready</p>
              <div
                style={{
                  display: "flex",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                  marginTop: "0.75rem",
                }}
              >
                <Button
                  variant="ghost"
                  onClick={() => void player.toggle(resultTrack)}
                >
                  {resultPlaying ? (
                    <>
                      <Pause className="w-4 h-4" aria-hidden /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" aria-hidden /> Play
                    </>
                  )}
                </Button>
                <a
                  className="lr-btn lr-btn-ghost"
                  href={audioUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={audioIsBlob ? "voisss-preview.mp3" : undefined}
                >
                  Open audio
                </a>
              </div>
              <p className="lr-quiet">The call you just made:</p>
              <CodeBlock label="request" code={lastCallSnippet} />
            </div>
          )}
        </section>

        {/* Tier 0/1 — the quickstart. */}
        <section
          style={{ marginTop: "var(--lr-space-xl)" }}
          aria-label="Quickstart"
        >
          <div className="lr-audition-head">
            <h2>Integrate in minutes</h2>
            <span>Any HTTP client works</span>
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
            role="tablist"
            aria-label="Framework"
          >
            {QUICKSTART_SNIPPETS.map((s) => (
              <Chip
                key={s.id}
                role="tab"
                aria-selected={activeTab === s.id}
                onClick={() => setActiveTab(s.id)}
              >
                {s.icon} {s.name}
              </Chip>
            ))}
          </div>
          <CodeBlock label={activeSnippet.name} code={activeSnippet.code} />
        </section>


        {/* Tier 1 — payments, pricing, and ecosystem behind disclosures. */}
        <div style={{ marginTop: "var(--lr-space-xl)" }}>
          <Disclosure
            title="Self-paying agents (x402 + Dynamic)"
            variant="section"
            name="developers"
            id="agentic-payments"
          >
            <p style={{ marginTop: 0 }}>
              No top-up, no human click: the agent&apos;s Dynamic server wallet
              signs the x402 payment on Base, and 70% settles to the voice
              owner on-chain.
            </p>
            <CodeBlock label="agentic checkout" code={AGENTIC_SNIPPET} />
            <div
              className="lr-legacy-inset"
              style={{ marginTop: "0.75rem", display: "grid", gap: "0.75rem" }}
            >
              <RuntimeInlineCallout />
              <SplitBar variant="license" compact />
            </div>
            <p
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "0.25rem 1rem",
                margin: "0.75rem 0 0",
              }}
            >
              <a
                href="https://www.dynamic.xyz/docs/overview/agents/agent-payments"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Dynamic docs
              </a>
              <a
                href="/api/agents/dynamic-wallet"
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                Inspect the wallet API
              </a>
              <a href="/api/bankr" target="_blank" rel="noopener noreferrer" style={linkStyle}>
                /api/bankr
              </a>
            </p>
          </Disclosure>

          <Disclosure
            title="Pricing & revenue split"
            variant="section"
            name="developers"
            id="pricing"
          >
            <p style={{ marginTop: 0 }}>
              <strong
                style={{
                  fontFamily: "var(--lr-font-display)",
                  fontSize: "1.5rem",
                  color: "var(--lr-ink)",
                }}
              >
                $0.000001
              </strong>{" "}
              per character — no monthly fees, no minimum commitment.
            </p>
            <p>
              Licensing splits 70/30 (VoiceLicenseMarket.sol); paywalled
              recordings pay creators 95/5 (VoiceRecords.sol) — both settle
              on-chain, instantly.
            </p>
            <div className="lr-legacy-inset" style={{ marginTop: "0.75rem" }}>
              <SplitBar variant="x402" />
            </div>
          </Disclosure>

          <Disclosure
            title="Frameworks & agent commerce"
            variant="section"
            name="developers"
            id="frameworks"
          >
            <ul className="lr-reasons">
              <li>
                <strong>Framework agnostic</strong> — any HTTP client:
                LangChain, Vercel AI SDK, Eliza, or raw fetch.
              </li>
              <li>
                <strong>Autonomous commerce</strong> — VOISSS auto-bids on ACP
                voice jobs; your agent finds work, we handle delivery.
              </li>
              <li>
                <strong>Type-safe clients</strong> — generate from the OpenAPI
                spec (
                <a
                  href="/api/agents/openapi.json"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={linkStyle}
                >
                  /api/agents/openapi.json
                </a>
                ).
              </li>
            </ul>
          </Disclosure>
        </div>

        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            flexWrap: "wrap",
            marginTop: "var(--lr-space-xl)",
          }}
        >
          <Link href="/marketplace" className="lr-btn lr-btn-primary">
            Browse voices
          </Link>
          <Link href="/generate" className="lr-btn lr-btn-ghost">
            Open the workspace
          </Link>
        </div>
      </div>
    </main>
  );
}

