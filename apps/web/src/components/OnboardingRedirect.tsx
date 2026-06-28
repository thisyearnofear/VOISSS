"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, X, Loader2 } from "lucide-react";

const ONBOARDING_STORAGE_KEY = "voisss_onboarding_profile";
const DISMISSED_KEY = "voisss_redirect_dismissed";

interface OnboardingProfile {
  role: "creator" | "developer" | "exploring";
  goal: string;
  style: string;
  completedAt: number;
  redirectUrl: string;
}

function computeRedirectUrl(profile: OnboardingProfile): string {
  if (profile.role === "creator" || profile.goal === "list") return "/studio";
  if (profile.role === "developer" || profile.goal === "license" || profile.goal === "build") return "/for-agents";
  return "/demo";
}

function destinationLabel(url: string): string {
  if (url === "/studio") return "Studio";
  if (url === "/for-agents") return "Developer Docs";
  return "Demo";
}

/** Read the saved onboarding profile at mount time (synchronous). */
function readRedirectUrl(): string | null {
  try {
    if (localStorage.getItem(DISMISSED_KEY) === "true") return null;
    const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!raw) return null;
    const profile: OnboardingProfile = JSON.parse(raw);
    if (!profile.role) return null;
    return computeRedirectUrl(profile);
  } catch {
    return null;
  }
}

export default function OnboardingRedirect() {
  const router = useRouter();
  const [redirectUrl] = useState(readRedirectUrl);
  const [countdown, setCountdown] = useState(3);
  const [redirecting, setRedirecting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Start redirect on mount when a redirectUrl exists
  // Cleanup + restart handles StrictMode double-mount correctly
  useEffect(() => {
    if (!redirectUrl) return;

    setRedirecting(true);

    // Countdown every second
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          return 0;
        }
        return c - 1;
      });
    }, 1000);

    // Auto-redirect after 3s
    const timer = setTimeout(() => {
      clearInterval(interval);
      router.push(redirectUrl);
    }, 3000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [redirectUrl, router]);

  if (!redirectUrl || dismissed) return null;

  const label = destinationLabel(redirectUrl);

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] animate-in slide-in-from-top duration-300">
      <div className="bg-gradient-to-r from-purple-600/90 via-blue-600/90 to-purple-600/90 backdrop-blur-md border-b border-white/10">
        <div className="voisss-container flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3 text-sm">
            {redirecting ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white/90">
                  Taking you to {label} in {countdown}s…
                </span>
              </>
            ) : (
              <>
                <span className="text-white/90">Welcome back!</span>
                <span className="hidden sm:inline text-white/60">Continue where you left off</span>
                <button
                  onClick={() => router.push(redirectUrl)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white text-xs font-semibold transition-colors"
                >
                  Go to {label} <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
          <button
            onClick={() => {
              try { localStorage.setItem(DISMISSED_KEY, "true"); } catch {}
              setDismissed(true);
            }}
            className="p-1.5 text-white/60 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Stay on home page"
            title="Stay on home page"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
