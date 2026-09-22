"use client";

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';

const QA = [
  { icon: "\u{1F3AD}", title: "Transform your voice", body: "Record in the Studio, open Advanced Tools \u2192 Voice Transform, pick a style and render a new version. Every version lands in the ledger beside the original.", cta: "Open Studio", href: "/sell" },
  { icon: "\u{1F30D}", title: "Dub into 8+ languages", body: "Record, open Advanced Tools \u2192 Global Dubbing, pick a target language. Emotion and tone carry over; the dubbed version joins the ledger.", cta: "Open Studio", href: "/sell" },
  { icon: "\u26D3\uFE0F", title: "Secured on Base", body: "Saved recordings anchor to Base with an IPFS payload \u2014 provenance you can verify on Basescan from the wallet menu.", cta: "Contributor flow", href: "/sell" },
  { icon: "\u2728", title: "AI insights", body: "Advanced Tools \u2192 Gemini Insights scores pacing, energy and clarity against your script and suggests concrete fixes.", cta: "Open Studio", href: "/sell" },
  { icon: "\u{1F4DD}", title: "Transcript videos", body: "Advanced Tools \u2192 Transcript & Edit composes a captioned video from your recording, ready to share.", cta: "Transcript Composer", href: "/sell?mode=transcript" },
  { icon: "\u{1F4B0}", title: "Free to start", body: "Recording is free. Three browser previews per voice, then per-character vocalize via the API \u2014 70% of every license goes to the contributor.", cta: "API pricing", href: "/developers" },
];

export default function HelpPage() {
  return (
    <main id="listening-main">
      <div className="lr-wrap" style={{ paddingBottom: "var(--lr-space-2xl)" }}>
        <div className="text-center mb-8" style={{ paddingTop: "var(--lr-space-md)" }}>
          <h1 className="lr-h1" style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>Help</h1>
          <p className="lr-lede">Answers first, Studio second. Every question resolves to a concrete next step.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl mx-auto mb-10">
          {QA.map((item) => (
            <article key={item.title} className="lr-card">
              <div className="flex items-center gap-3 mb-2">
                <span aria-hidden>{item.icon}</span>
                <h2 className="text-base font-semibold text-white" style={{ margin: 0 }}>{item.title}</h2>
              </div>
              <p className="text-sm text-gray-300" style={{ margin: "0 0 0.75rem" }}>{item.body}</p>
              <Link href={item.href} className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: "var(--lr-accent)" }}>{item.cta} <span aria-hidden>\u2192</span></Link>
            </article>
          ))}
        </div>
        <div className="lr-card max-w-3xl mx-auto mb-10">
          <div className="flex items-center gap-2 mb-2 justify-center">
            <MessageCircle className="w-5 h-5" aria-hidden style={{ color: "var(--lr-accent)" }} />
            <h2 className="text-xl font-bold text-white" style={{ margin: 0 }}>Try It Yourself</h2>
          </div>
          <p className="text-gray-300 text-sm text-center mb-4">The fastest way to learn is by doing. Jump into the Studio and experiment!</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/sell" className="lr-btn text-center">Open Studio</Link>
            <Link href="/sell?mode=transcript" className="lr-btn lr-btn-ghost text-center">Transcript Composer</Link>
            <Link href="/developers" className="lr-btn lr-btn-ghost text-center">API docs</Link>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
          <a href="mailto:support@voisss.netlify.app" className="lr-card text-center">
            <h3 className="font-semibold text-white mb-1">Email</h3>
            <p className="text-gray-400 text-sm" style={{ margin: 0 }}>support@voisss.netlify.app</p>
          </a>
          <a href="https://discord.gg/voisss" target="_blank" rel="noopener noreferrer" className="lr-card text-center">
            <h3 className="font-semibold text-white mb-1">Discord</h3>
            <p className="text-gray-400 text-sm" style={{ margin: 0 }}>Community help</p>
          </a>
          <a href="https://twitter.com/voisss_app" target="_blank" rel="noopener noreferrer" className="lr-card text-center">
            <h3 className="font-semibold text-white mb-1">X</h3>
            <p className="text-gray-400 text-sm" style={{ margin: 0 }}>Updates &amp; support</p>
          </a>
        </div>
      </div>
    </main>
  );
}
