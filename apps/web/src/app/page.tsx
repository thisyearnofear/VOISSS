import { Suspense, lazy } from "react";
import EnhancedLandingHero from "../components/EnhancedLandingHero";
import OriginalVsAiShowcase from "../components/OriginalVsAiShowcase";

// Code-split below-fold sections for faster initial load
const InteractiveHowItWorks = lazy(() => import("../components/InteractiveHowItWorks"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const NewsletterSection = lazy(() => import("../components/NewsletterSection"));
const ProtocolIntegrationsSection = lazy(() => import("../components/ProtocolIntegrationsSection"));

/** Minimal skeleton while a lazy section loads */
function SectionFallback() {
  return (
    <section className="py-24 max-w-6xl mx-auto px-4 animate-pulse">
      <div className="h-10 w-64 bg-[#1A1A1A] rounded-lg mx-auto mb-16" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-[#1A1A1A] rounded-2xl" />
        <div className="h-64 bg-[#1A1A1A] rounded-2xl" />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="voisss-container py-8 sm:py-12">
        {/* Enhanced Hero Section — always loaded, above fold */}
        <EnhancedLandingHero />

        {/* Original vs. AI — side-by-side waveform comparison of a real
            human narrator and a licensed AI voice saying the same line.
            Sits between the hero CTAs and the interactive playground
            so visitors see the value prop before the call-to-action. */}
        <OriginalVsAiShowcase />

        {/* Interactive How It Works (Progressive Disclosure) */}
        <Suspense fallback={<SectionFallback />}>
          <InteractiveHowItWorks />
        </Suspense>          {/* Protocol & Integrations Section */}
        <Suspense fallback={<SectionFallback />}>
          <ProtocolIntegrationsSection />
        </Suspense>

        {/* FAQ Section (Secondary Information) */}
        <Suspense fallback={<SectionFallback />}>
          <FAQSection />
        </Suspense>

        {/* Newsletter Section (Lead Capture) */}
        <Suspense fallback={<SectionFallback />}>
          <NewsletterSection />
        </Suspense>

        {/* Simple Footer */}
        <div className="text-center mt-24 pt-12 border-t border-[#2A2A2A]">
          <p className="text-zinc-500 text-sm mb-6 font-medium tracking-wide">
            VOICE LICENSING FOR AI AGENTS • BLOCKCHAIN PROVENANCE • INSTANT API ACCESS
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-bold uppercase tracking-widest">
            <a href="/marketplace" className="text-white hover:text-blue-500 transition-colors">
              Browse Voices
            </a>
            <a href="/agents" className="text-zinc-400 hover:text-white transition-colors">
              For Agents
            </a>
            <a href="/studio" className="text-zinc-400 hover:text-white transition-colors">
              Start Recording
            </a>
            <a href="https://github.com/thisyearnofear/VOISSS" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
              GitHub
            </a>
            <a href="/import" className="text-zinc-400 hover:text-white transition-colors">
              Import Voices
            </a>
          </div>
          <p className="mt-12 text-zinc-600 text-[10px] tracking-widest uppercase">
            © 2026 VOISSS. Built on Base • Open Source • MIT License
          </p>
        </div>
      </div>
    </div>
  );
}
