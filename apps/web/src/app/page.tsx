import EnhancedLandingHero from "../components/EnhancedLandingHero";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        {/* Enhanced Hero Section */}
        <EnhancedLandingHero />

        {/* Simple Footer */}
        <div className="text-center mt-16 pt-8 border-t border-[#2A2A2A]">
          <p className="text-gray-400 text-sm mb-4">
            Infinite Expression Beyond Recognition
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="/platform" className="text-gray-400 hover:text-white transition-colors">
              Platform
            </a>
            <a href="/features" className="text-gray-400 hover:text-white transition-colors">
              Features
            </a>
            <a href="/missions" className="text-gray-400 hover:text-white transition-colors">
              Missions
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
