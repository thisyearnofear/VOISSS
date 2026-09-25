"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Store, AudioLines, FileText, Gauge } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // One funnel: discover → generate (primary) → sell → build.
  const BOTTOM_LINKS = [
    { href: "/marketplace", label: "Discover", icon: Store },
    {
      href: "/generate",
      label: "Generate",
      icon: AudioLines,
      primary: true,
    },
    { href: "/sell", label: "Sell", icon: Mic },
    { href: "/developers", label: "API", icon: FileText },
    { href: "/benchmarks", label: "Bench", icon: Gauge },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-lg sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around py-1">
        {BOTTOM_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          // Primary CTA — elevated button
          if (link.primary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative -top-3 flex flex-col items-center gap-0.5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#D6FF2A] to-[#EAFF6A] flex items-center justify-center shadow-lg shadow-[#D6FF2A]/25 active:scale-95 transition-transform">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white tracking-tight">
                  {link.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                isActive ? "text-[#EAFF6A]" : "text-gray-500 hover:text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{link.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Spacer to prevent content from hiding behind the nav */}
      <div className="h-2" />
    </nav>
  );
}
