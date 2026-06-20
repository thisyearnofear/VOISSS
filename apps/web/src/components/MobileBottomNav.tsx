"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, Store, Upload } from "lucide-react";

const BOTTOM_LINKS = [
  { href: "/marketplace", label: "Voices", icon: Store },
  { href: "/studio", label: "Record", icon: Mic, primary: true },
  { href: "/import", label: "Import", icon: Upload },
];

export default function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-lg sm:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex items-center justify-around py-1">
        {BOTTOM_LINKS.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");

          // Primary CTA — Record button is larger and elevated
          if (link.primary) {
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative -top-3 flex flex-col items-center gap-0.5"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] flex items-center justify-center shadow-lg shadow-[#7C5DFA]/25 active:scale-95 transition-transform">
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
                isActive ? "text-[#9C88FF]" : "text-gray-500 hover:text-gray-300"
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
