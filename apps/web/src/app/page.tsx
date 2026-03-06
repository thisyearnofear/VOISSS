import EnhancedLandingHero from "../components/EnhancedLandingHero";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Enhanced Hero Section */}
        <EnhancedLandingHero />

        {/* Simple Footer */}
        <div className="text-center mt-24 pt-12 border-t border-[#2A2A2A]">
          <p className="text-zinc-500 text-sm mb-6 font-medium tracking-wide">
            ENTERPRISE VOICE LICENSING • BLOCKCHAIN PROVENANCE • SCALABLE API
          </p>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4 text-sm font-bold uppercase tracking-widest">
            <a href="/marketplace" className="text-white hover:text-blue-500 transition-colors">
              Browse Marketplace
            </a>
            <a href="/marketplace/dashboard" className="text-zinc-400 hover:text-white transition-colors">
              Contributor Portal
            </a>
            <a href="/docs" className="text-zinc-400 hover:text-white transition-colors">
              Developer Docs
            </a>
            <a href="mailto:enterprise@voisss.io" className="text-zinc-400 hover:text-white transition-colors">
              Contact Sales
            </a>
          </div>
          <p className="mt-12 text-zinc-600 text-[10px] tracking-widest uppercase">
            © 2026 VOISSS TECHNOLOGIES. ALL RIGHTS RESERVED.
          </p>
        </div>
      </div>
    </div>
  );
}
