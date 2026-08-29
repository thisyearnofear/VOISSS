import Link from "next/link";
import VoissMascotMark from "@/components/VoissMascotMark";

export const metadata = {
  title: "Page not found | VOISSS",
};

export default function NotFound() {
  return (
    <div className="relative overflow-hidden min-h-[80vh] flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A1A] to-[#0A0A0A]">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 voisss-container py-16 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="absolute inset-0 -z-10 bg-purple-500/20 blur-3xl rounded-full" />
            <VoissMascotMark
              priority
              size={220}
              className="w-40 h-40 sm:w-52 sm:h-52 drop-shadow-[0_16px_40px_rgba(124,93,250,0.35)]"
            />
          </div>
        </div>

        <p className="text-sm font-bold uppercase tracking-widest text-purple-400 mb-2">
          404 — Off the record
        </p>
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
          We couldn&apos;t find that page
        </h1>
        <p className="text-gray-400 max-w-md mx-auto mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has moved. Let&apos;s get
          you back to the good stuff.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/"
            className="px-8 py-4 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-xl text-white text-lg font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
          >
            Back home
          </Link>
          <Link
            href="/marketplace"
            className="px-8 py-4 border border-gray-600 rounded-xl text-gray-300 text-lg font-semibold hover:border-gray-400 transition-all"
          >
            Browse voices
          </Link>
        </div>
      </div>
    </div>
  );
}
