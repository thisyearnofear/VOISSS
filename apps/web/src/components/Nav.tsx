"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useBasename } from "../hooks/useBasename";
import { useBaseAccount } from "../hooks/useBaseAccount";
import { useAssistant } from "../contexts/AssistantContext";
import { Sparkles, Menu, X } from "lucide-react";
import { useRouter } from "next/navigation";

const ONBOARDING_STORAGE_KEY = "voisss_onboarding_profile";

interface OnboardingProfile {
  role: "creator" | "developer" | "exploring";
  goal: string;
  style: string;
  completedAt: number;
  redirectUrl: string;
}

export default function Nav() {
  const router = useRouter();
  const { address, isAuthenticated, isAuthenticating, isCheckingSession, signIn, signOut } = useAuth();
  const { isExpanded, toggleAssistant } = useAssistant();

  const { displayName, hasBasename, isLoading: isResolvingBasename } = useBasename(address as `0x${string}` | null);
  const {
    isConnected,
    universalAddress,
    status: baseAccountStatus,
  } = useBaseAccount();
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);


  // Close wallet menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false);
      }
    };

    if (showWalletMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWalletMenu]);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleMobileOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    };

    if (showMobileMenu) {
      document.addEventListener('mousedown', handleMobileOutside);
      // Prevent body scroll when mobile menu is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleMobileOutside);
      document.body.style.overflow = '';
    };
  }, [showMobileMenu]);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleDisconnect = async () => {
    try {
      await signOut();
      setShowWalletMenu(false);
    } catch (error) {
      console.error("Failed to sign out:", error);
    }
  };

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      // Could add a toast notification here
    }
  };

  // Network info for Base
  const networkInfo = {
    name: 'Base',
    isTestnet: false
  };

  // Load onboarding persona from localStorage to tailor nav
  const [personaRole, setPersonaRole] = useState<string | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (raw) {
        const profile: OnboardingProfile = JSON.parse(raw);
        if (profile.role) setPersonaRole(profile.role);
      }
    } catch {
      // localStorage unavailable — use default nav
    }
  }, []);

  // Build nav links based on persona
  // Developer → first link is "API Docs" (replaces "Studio" + "Devs" deduplicated)
  // Creator / default → first link is "Studio", "Devs" shown as normal
  const baseLinks = [
    {
      href: personaRole === "developer" ? "/for-agents" : "/studio",
      label: personaRole === "developer" ? "API Docs" : "Studio",
      className: "text-white hover:text-[#9C88FF] transition-colors text-sm font-bold uppercase tracking-wider",
    },
    { href: "/marketplace", label: "Voices", className: "text-gray-400 hover:text-white transition-colors text-sm font-medium" },
    { href: "/import", label: "Import", className: "text-gray-400 hover:text-white transition-colors text-sm font-medium" },
  ];

  // "Devs" link — skipped for developer persona since "API Docs" already points to /for-agents
  const extraLinks = personaRole === "developer"
    ? [{ href: "/acp-dashboard", label: "ACP", className: "text-gray-400 hover:text-white transition-colors text-sm font-medium" }]
    : [
        { href: "/for-agents", label: "Devs", className: "text-gray-400 hover:text-white transition-colors text-sm font-medium" },
        { href: "/acp-dashboard", label: "ACP", className: "text-gray-400 hover:text-white transition-colors text-sm font-medium" },
      ];

  const navLinks = [...baseLinks, ...extraLinks];

  return (
    <nav className="border-b border-[#2A2A2A] bg-[#0A0A0A]/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="voisss-container">
        <div className="flex items-center justify-between py-4">
          <Link href="/" className="font-bold text-2xl voisss-gradient-text hover:opacity-80 transition-opacity">
            VOISSS
          </Link>

          <div className="flex items-center gap-6">
            {/* Desktop Nav Links */}
            <div className="hidden sm:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className={link.className}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* AI Assistant Toggle */}
            <button
              onClick={toggleAssistant}
              className={`p-2 rounded-xl border transition-all duration-300 flex items-center gap-2 group ${isExpanded
                ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                : 'bg-white/5 border-white/10 text-gray-400 hover:border-purple-500/30 hover:text-purple-400'
                }`}
              title="Toggle AI Assistant"
            >
              <Sparkles className={`w-5 h-5 transition-transform duration-500 ${isExpanded ? 'rotate-180 scale-110' : 'group-hover:rotate-12'}`} />
              <span className="hidden lg:inline text-xs font-bold uppercase tracking-widest">Assistant</span>
            </button>

            {/* Authentication / Profile Area */}
            <div className="flex items-center gap-3 justify-end">
              {/* Mobile Hamburger */}
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="sm:hidden p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Toggle menu"
              >
                {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>

              {isCheckingSession ? (
                <div className="flex items-center gap-2 px-3 py-2 text-gray-500 text-xs font-medium">
                  <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Syncing...</span>
                </div>
              ) : !isAuthenticated ? (
                <div className="hidden sm:flex items-center gap-3">
                  <Link
                    href="/studio"
                    className="px-4 py-2 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white text-sm font-medium hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all duration-200 shadow-lg hover:shadow-purple-500/25"
                  >
                    Start Recording
                  </Link>
                  <button
                    onClick={signIn}
                    disabled={isAuthenticating}
                    className="px-3 py-2 text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    {isAuthenticating ? (
                      <>
                        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                        <span className="hidden sm:inline">Connecting...</span>
                      </>
                    ) : (
                      <span>Sign In</span>
                    )}
                  </button>
                </div>
              ) : address && (
                <div className="relative" ref={menuRef}>
                  <button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl hover:border-green-500/50 transition-all duration-200 group"
                  >
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                    <span className="text-green-400 text-sm font-medium hidden sm:inline">
                      {displayName ? displayName : formatAddress(address)}
                    </span>
                    <span className="text-green-400 text-sm font-medium sm:hidden">
                      Wallet
                    </span>
                    <svg
                      className={`w-4 h-4 text-green-400 transition-transform duration-200 ${showWalletMenu ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              )}
            </div>


            {/* Enhanced Wallet Dropdown Menu */}
            {showWalletMenu && (
              <div className="absolute right-0 mt-3 w-80 bg-gradient-to-br from-[#1A1A1A] to-[#0F0F0F] border border-[#3A3A3A] rounded-sm shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header with Gradient */}
                <div className="p-5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-b border-[#2A2A2A]">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/20">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">Connected</span>
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                      </div>
                      <p className="text-white font-semibold text-sm mt-0.5">Base Account</p>
                    </div>
                  </div>

                  {/* Network Badge */}
                  <div className={`mb-3 px-3 py-2 rounded-lg border ${networkInfo.isTestnet
                    ? 'bg-yellow-500/10 border-yellow-500/30'
                    : 'bg-green-500/10 border-green-500/30'
                    }`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${networkInfo.isTestnet ? 'bg-yellow-400' : 'bg-green-400'
                        } animate-pulse`}></div>
                      <span className={`text-xs font-medium ${networkInfo.isTestnet ? 'text-yellow-400' : 'text-green-400'
                        }`}>
                        {networkInfo.name}
                      </span>
                    </div>
                    {networkInfo.isTestnet && (
                      <p className="text-xs text-gray-400 mt-1">
                        💡 Switch network in your wallet extension
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm">
                    <p className="text-gray-400 text-xs mb-1">Identity</p>
                    <div className="text-white font-mono text-xs break-all leading-relaxed">
                      {isResolvingBasename ? (
                        <span className="text-gray-400">Resolving...</span>
                      ) : (
                        displayName || address
                      )}
                    </div>
                    {!hasBasename && !isResolvingBasename && (
                      <p className="text-gray-400 text-xs mt-2">
                        💡 Get a Basename for human-readable identity
                      </p>
                    )}
                  </div>

                  {/* Base Account Status */}
                  {isConnected && universalAddress && (
                    <div className="p-3 bg-[#0A0A0A] border border-[#2A2A2A] rounded-sm mt-3">
                      <p className="text-gray-400 text-xs mb-1">Base Account</p>
                      <div className="text-white font-mono text-xs break-all leading-relaxed mb-2">
                        {universalAddress}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-gray-400">Spend Permission:</span>
                        <span className="text-green-400">
                          Active
                        </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs mt-1">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-gray-300">{baseAccountStatus}</span>
                        </div>
                    </div>
                  )}
                </div>

                {/* Actions with Beautiful Styling */}
                <div className="p-3">
                  <button
                    onClick={copyAddress}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#2A2A2A] rounded-sm transition-all duration-200 flex items-center gap-3 group mb-1"
                  >
                    <div className="w-8 h-8 bg-blue-500/10 rounded-sm flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Copy Address</p>
                      <p className="text-xs text-gray-400">Copy to clipboard</p>
                    </div>
                  </button>

                  <a
                    href={`https://basescan.org/address/${address}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#2A2A2A] rounded-sm transition-all duration-200 flex items-center gap-3 group mb-1"
                  >
                    <div className="w-8 h-8 bg-purple-500/10 rounded-sm flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                      <svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">View on Basescan</p>
                      <p className="text-xs text-gray-400">Verify on blockchain</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-500 group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>

                  <div className="my-2 border-t border-[#2A2A2A]"></div>

                  <button
                    onClick={handleDisconnect}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-red-500/10 rounded-sm transition-all duration-200 flex items-center gap-3 group"
                  >
                    <div className="w-8 h-8 bg-red-500/10 rounded-sm flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-red-400">Disconnect Wallet</p>
                      <p className="text-xs text-gray-400">Sign out from Base</p>
                    </div>
                  </button>
                </div>

                {/* Footer Tip */}
                <div className="px-4 py-3 bg-[#0A0A0A] border-t border-[#2A2A2A]">
                  <p className="text-xs text-gray-500 text-center">
                    💡 Your recordings are secured on Base
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 sm:hidden" onClick={() => setShowMobileMenu(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div
            ref={mobileMenuRef}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-72 max-w-[85vw] bg-[#0A0A0A] border-l border-[#2A2A2A] shadow-2xl animate-in slide-in-from-right duration-300"
          >
            <div className="flex items-center justify-between p-4 border-b border-[#2A2A2A]">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 text-gray-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center px-6 py-4 text-white hover:bg-white/5 transition-colors text-lg font-medium"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-[#2A2A2A] p-6 space-y-4">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/studio"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full text-center px-6 py-3 bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-lg text-white font-semibold hover:from-[#6B4CE6] hover:to-[#8B7AFF] transition-all"
                  >
                    Start Recording
                  </Link>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      signIn();
                    }}
                    disabled={isAuthenticating}
                    className="block w-full text-center px-6 py-3 border border-[#3A3A3A] rounded-lg text-gray-400 font-medium hover:border-gray-600 hover:text-white transition-all"
                  >
                    {isAuthenticating ? "Connecting..." : "Sign In"}
                  </button>
                </>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  <p className="mb-2">Connected as</p>
                  <p className="text-white font-mono text-xs break-all">{address}</p>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      handleDisconnect();
                    }}
                    className="mt-4 text-red-400 hover:text-red-300 transition-colors text-sm font-medium"
                  >
                    Disconnect
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </nav>
  );
}
