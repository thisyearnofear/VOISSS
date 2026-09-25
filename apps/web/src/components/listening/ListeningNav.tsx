"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ConnectModal } from "@/components/auth/ConnectModal";

const PRIMARY_LINKS = [
  { href: "/marketplace", label: "Discover" },
  { href: "/generate", label: "Workspace" },
];

const SECONDARY_LINKS = [
  { href: "/sell", label: "Contributors" },
  { href: "/developers", label: "Developers" },
];

export function ListeningNav() {
  const pathname = usePathname();
  const { isAuthenticated, isAuthenticating, isCheckingSession, signIn, signOut } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);
  const [showConnect, setShowConnect] = useState(false);

  const handleAuth = async () => {
    setAuthError(null);
    try {
      if (isAuthenticated) {
        await signOut();
      } else {
        setShowConnect(true);
      }
    } catch {
      setAuthError("Sign in failed. Please try again.");
    }
  };

  const renderLink = (link: { href: string; label: string }) => (
    <Link
      key={link.href}
      href={link.href}
      className="lr-nav-link"
      aria-current={pathname === link.href ? "page" : undefined}
    >
      {link.label}
    </Link>
  );

  return (
    <header className="lr-wrap">
      <nav className="lr-nav" aria-label="Primary">
        <Link href="/" className="lr-wordmark" aria-current={pathname === "/" ? "page" : undefined}>
          VOISSS
        </Link>
        <div className="lr-nav-links">{PRIMARY_LINKS.map(renderLink)}</div>
        <div className="lr-nav-secondary">
          {SECONDARY_LINKS.map(renderLink)}
          <button
            type="button"
            className="lr-nav-link"
            onClick={handleAuth}
            disabled={isAuthenticating || isCheckingSession}
            style={{ background: "none", border: "none", font: "inherit", cursor: "pointer" }}
          >
            {isCheckingSession
              ? "…"
              : isAuthenticating
                ? "Signing in…"
                : isAuthenticated
                  ? "Sign out"
                  : "Sign in"}
          </button>
          {authError && (
            <span className="lr-error-text" role="status" style={{ fontSize: "0.8125rem" }}>
              {authError}
            </span>
          )}
        </div>
      </nav>
      <ConnectModal open={showConnect} onClose={() => setShowConnect(false)} onConnected={() => { void signIn().catch(() => setAuthError("Sign in failed. Please try again.")); }} />
    </header>
  );
}
