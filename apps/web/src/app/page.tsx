import EnhancedLandingHero from "../components/EnhancedLandingHero";
import InteractiveHowItWorks from "../components/InteractiveHowItWorks";
import OWSHackathonSection from "../components/OWSHackathonSection";
import NewsletterSection from "../components/NewsletterSection";
import FAQSection from "../components/FAQSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white overflow-hidden">
      <div className="voisss-container py-8 sm:py-12">
        {/* Enhanced Hero Section */}
        <EnhancedLandingHero />

        {/* Interactive How It Works (Progressive Disclosure) */}
        <InteractiveHowItWorks />

        {/* FAQ Section (Secondary Information) */}
        <FAQSection />

        {/* Newsletter Section (Lead Capture) */}
        <NewsletterSection />

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
              API Docs
            </a>
            <a href="/marketplace/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              List Your Voice
            </a>
            <a href="https://github.com/thisyearnofear/VOISSS" target="_blank" rel="noopener noreferrer" className="text-zinc-400 hover:text-white transition-colors">
              GitHub
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
