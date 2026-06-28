"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles, Mic, Headphones, Globe, Loader2 } from "lucide-react";
import VoissMascot from "./VoissMascot";

const ONBOARDING_STORAGE_KEY = "voisss_onboarding_profile";

type Step = "welcome" | "identity" | "goal" | "style" | "result";

interface UserProfile {
  role: "creator" | "developer" | "exploring";
  goal: string;
  style: string;
}

const goals = [
  { id: "earn", label: "Earn from my voice", icon: Mic, desc: "License your voice to AI agents" },
  { id: "build", label: "Add voice to my app", icon: Headphones, desc: "Integrate TTS via API" },
  { id: "explore", label: "Just exploring", icon: Globe, desc: "See what VOISSS can do" },
];

const styles = [
  { id: "professional", label: "Professional", desc: "Clear, authoritative, polished" },
  { id: "friendly", label: "Friendly", desc: "Warm, approachable, conversational" },
  { id: "creative", label: "Creative", desc: "Expressive, dynamic, unique" },
  { id: "calm", label: "Calm", desc: "Soothing, measured, peaceful" },
];

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <VoissMascot mood="wave" size="lg" interactive />
      </div>
      <h2 className="text-3xl sm:text-4xl font-bold mb-4">
        Hey! I&apos;m{" "}
        <span className="voisss-gradient-text">VOISSS</span>
      </h2>
      <p className="text-xl text-gray-300 mb-4">
        Your AI voice marketplace companion
      </p>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        I&apos;ll help you find the perfect voice for your agent, or get your voice earning in minutes.
      </p>
      <button
        onClick={onNext}
        className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white text-lg font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25"
      >
        Get Started <Sparkles className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

function IdentityStep({ onSelect }: { onSelect: (role: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <VoissMascot mood="think" size="lg" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Who are you?</h2>
      <p className="text-gray-400 mb-8">Tell me a bit about yourself so I can help you best</p>
      <div className="grid gap-3 max-w-sm mx-auto">
        {goals.map((g) => {
          const Icon = g.icon;
          return (
            <button
              key={g.id}
              onClick={() => onSelect(g.id)}
              className="group flex items-center gap-4 p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left"
            >
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <Icon className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-white">{g.label}</p>
                <p className="text-sm text-gray-400">{g.desc}</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-500 group-hover:text-purple-400 transition-colors" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function GoalStep({ onSelect }: { onSelect: (goal: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <VoissMascot mood="listen" size="lg" />
      </div>
      <h2 className="text-2xl font-bold mb-2">What brings you here?</h2>
      <p className="text-gray-400 mb-8">This helps me show you the right features</p>
      <div className="grid gap-3 max-w-sm mx-auto">
        <button
          onClick={() => onSelect("license")}
          className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
        >
          <p className="font-semibold text-white mb-1">License a voice for my agent</p>
          <p className="text-sm text-gray-400">Browse the marketplace and integrate via API</p>
        </button>
        <button
          onClick={() => onSelect("list")}
          className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
        >
          <p className="font-semibold text-white mb-1">List my voice and earn</p>
          <p className="text-sm text-gray-400">Import from ElevenLabs or record in-studio</p>
        </button>
        <button
          onClick={() => onSelect("both")}
          className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-blue-500/40 hover:bg-blue-500/5 transition-all text-left"
        >
          <p className="font-semibold text-white mb-1">Both!</p>
          <p className="text-sm text-gray-400">I want to license voices and earn from my own</p>
        </button>
      </div>
    </motion.div>
  );
}

function StyleStep({ onSelect }: { onSelect: (style: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <VoissMascot mood="happy" size="lg" />
      </div>
      <h2 className="text-2xl font-bold mb-2">What voice style do you prefer?</h2>
      <p className="text-gray-400 mb-8">Don&apos;t worry, you can change anytime</p>
      <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
        {styles.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className="p-4 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all"
          >
            <p className="font-semibold text-white mb-1">{s.label}</p>
            <p className="text-xs text-gray-400">{s.desc}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ResultStep({ profile, onReset, redirecting, redirectUrl }: { profile: UserProfile; onReset: () => void; redirecting: boolean; redirectUrl: string }) {
  const destinationLabel =
    redirectUrl === "/studio"
      ? "Studio"
      : redirectUrl === "/for-agents"
        ? "Developer Docs"
        : "Demo";

  if (redirecting) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="flex justify-center mb-6">
          <VoissMascot mood="celebrate" size="lg" interactive />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-6">
          <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          <span className="text-sm text-purple-300">Taking you to {destinationLabel}…</span>
        </div>
        <h2 className="text-2xl font-bold mb-4">
          {profile.role === "creator"
            ? "Ready to earn from your voice"
            : profile.role === "developer"
              ? "Let's get you building"
              : "Welcome to VOISSS"}
        </h2>
        <p className="text-gray-400 max-w-md mx-auto">
          Your preferences have been saved. You can always retake the quiz from the help page.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center"
    >
      <div className="flex justify-center mb-6">
        <VoissMascot mood="celebrate" size="lg" interactive />
      </div>
      <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
        <Sparkles className="w-4 h-4 text-purple-400" />
        <span className="text-sm text-purple-300">Your personalized plan is ready</span>
      </div>
      <h2 className="text-2xl font-bold mb-4">
        {profile.role === "creator"
          ? "Ready to earn from your voice"
          : profile.role === "developer"
            ? "Let's get you building"
            : "Welcome to VOISSS"}
      </h2>
      <p className="text-gray-400 mb-8 max-w-md mx-auto">
        {profile.role === "creator"
          ? `You prefer ${profile.style} voices. Head to the studio to record or import your voice.`
          : `You're looking to ${profile.goal}. We've curated the best ${profile.style} voices for you.`}
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href={redirectUrl}
          className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-500/25"
        >
          Go to {destinationLabel} <ArrowRight className="w-4 h-4" />
        </a>
        <button
          onClick={onReset}
          className="px-8 py-4 border border-gray-600 rounded-xl text-gray-300 font-semibold hover:border-gray-400 transition-all"
        >
          Start Over
        </button>
      </div>
    </motion.div>
  );
}

export default function OnboardingQuiz() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [profile, setProfile] = useState<UserProfile>({
    role: "exploring",
    goal: "",
    style: "",
  });
  const [redirecting, setRedirecting] = useState(false);

  const profileComplete = !!(profile.role && profile.goal && profile.style);
  const redirectUrl =
    profile.role === "creator" || profile.goal === "list"
      ? "/studio"
      : profile.role === "developer" || profile.goal === "license" || profile.goal === "build"
        ? "/for-agents"
        : "/demo";

  // Persist to localStorage and auto-redirect once profile is complete
  useEffect(() => {
    if (!profileComplete) return;

    try {
      localStorage.setItem(
        ONBOARDING_STORAGE_KEY,
        JSON.stringify({
          ...profile,
          completedAt: Date.now(),
          redirectUrl,
        })
      );
    } catch {
      // localStorage unavailable — silently continue
    }

    setRedirecting(true);
    const timer = setTimeout(() => {
      router.push(redirectUrl);
    }, 2500);

    return () => clearTimeout(timer);
  }, [profileComplete, redirectUrl, router]);

  const handleIdentity = (role: string) => {
    setProfile((p) => ({ ...p, role: role as UserProfile["role"] }));
    setStep("goal");
  };

  const handleGoal = (goal: string) => {
    setProfile((p) => ({ ...p, goal }));
    setStep("style");
  };

  const handleStyle = (style: string) => {
    setProfile((p) => ({ ...p, style }));
    setStep("result");
  };

  const handleReset = () => {
    setRedirecting(false);
    setProfile({ role: "exploring", goal: "", style: "" });
    setStep("welcome");
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Progress bar */}
      {!redirecting && (
        <div className="flex justify-center gap-2 mb-12">
          {(["welcome", "identity", "goal", "style", "result"] as Step[]).map((s, i) => (
            <div
              key={s}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${
                step === s
                  ? "bg-purple-500 scale-125"
                  : ["welcome", "identity", "goal", "style", "result"].indexOf(step) > i
                    ? "bg-purple-500/50"
                    : "bg-gray-700"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "welcome" && (
          <WelcomeStep key="welcome" onNext={() => setStep("identity")} />
        )}
        {step === "identity" && (
          <IdentityStep key="identity" onSelect={handleIdentity} />
        )}
        {step === "goal" && (
          <GoalStep key="goal" onSelect={handleGoal} />
        )}
        {step === "style" && (
          <StyleStep key="style" onSelect={handleStyle} />
        )}
        {step === "result" && (
          <ResultStep
            key="result"
            profile={profile}
            redirecting={redirecting}
            redirectUrl={redirectUrl}
            onReset={handleReset}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
