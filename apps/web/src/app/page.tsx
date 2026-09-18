import { Suspense, lazy } from "react";
import EnhancedLandingHero from "../components/EnhancedLandingHero";
import OnboardingRedirect from "../components/OnboardingRedirect";
import OriginalVsAiShowcase from "../components/OriginalVsAiShowcase";
import HomeStructuredData from "../components/HomeStructuredData";
import { initTelemetry, flushNow } from "../lib/telemetry";

// Initialize telemetry on page load
if (typeof window !== "undefined") {
  initTelemetry();
  // Flush on route change or navigation
  window.addEventListener("popstate", flushNow);
}

// Code-split below-fold sections for faster initial load
const InteractiveHowItWorks = lazy(() => import("../components/InteractiveHowItWorks"));
const DeveloperSnippets = lazy(() => import("../components/DeveloperSnippets"));
const FAQSection = lazy(() => import("../components/FAQSection"));
const NewsletterSection = lazy(() => import("../components/NewsletterSection"));
const ProtocolIntegrationsSection = lazy(() => import("../components/ProtocolIntegrationsSection"));
const PersonaConversionSection = lazy(() => import("../components/PersonaConversionSection"));

/** Minimal skeleton while a lazy section loads */
function SectionFallback() {
  return (
    <section className="py-24 max-w-6xl animate-pulse">
      <div className="h-6 w-40 bg-[#141414] rounded-full mb-4" />
      <div className="h-10 w-72 bg-[#1A1A1A] rounded-lg mb-16" />
      <div className="grid md:grid-cols-2 gap-6">
        <div className="h-64 bg-[#141414] rounded-2xl border border-white/[0.06]" />
        <div className="h-64 bg-[#141414] rounded-2xl border border-white/[0.06]" />
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <HomeStructuredData />
      {/* Auto-redirect returning visitors to their tailored destination */}
      <OnboardingRedirect />
      <div className="voisss-container py-8 sm:py-12">
        {/* Enhanced Hero Section — always loaded, above fold */}
        <EnhancedLandingHero />

        {/* Original vs. AI — side-by-side waveform comparison of a real
            human narrator and a licensed AI voice saying the same line.
            Sits between the hero CTAs and the interactive playground
            so visitors see the value prop before the call-to-action. */}
        <OriginalVsAiShowcase />

        {/* Persona-driven conversion — who is this for? */}
        <Suspense fallback={<SectionFallback />}>
          <PersonaConversionSection />
        </Suspense>

        {/* Interactive How It Works (Progressive Disclosure) */}
        <Suspense fallback={<SectionFallback />}>
          <InteractiveHowItWorks />
        </Suspense>

        {/* Developer Snippets — 5-line integrations */}
        <Suspense fallback={<SectionFallback />}>
          <DeveloperSnippets />
        </Suspense>

        {/* Protocol & Integrations Section */}
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
        <div className="mt-24 pt-10 border-t border-white/[0.08]">
          <p className="text-white/35 text-[11px] font-mono mb-6 tracking-[0.14em] uppercase">
            08 — Voice licensing for AI agents · blockchain provenance · instant API access
          </p>
          <div className="flex flex-wrap gap-x-10 gap-y-3 text-xs font-bold uppercase tracking-[0.14em]">
            <a href="/demo" className="text-white hover:text-purple-400 transition-colors">
              Try Demo
            </a>
            <a href="/marketplace" className="text-zinc-400 hover:text-white transition-colors">
              Browse Voices
            </a>
            <a href="/for-agents" className="text-zinc-400 hover:text-white transition-colors">
              Devs
            </a>
            <a href="/studio" className="text-zinc-400 hover:text-white transition-colors">
              Start Recording
            </a>
            <a href="/hackathon" className="text-amber-500 hover:text-amber-400 transition-colors">
              🏆 Hackathon
            </a>
            <a href="https://github.com/thisyearnofear/VOISSS" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
              GitHub
            </a>
          </div>
          <p className="mt-12 text-zinc-600 text-[10px] tracking-widest uppercase">
            © 2026 VOISSS. Built on Base • Open Source • MIT License • Powered by Google Gemini
          </p>
        </div>
      </div>
    </div>
  );
}
