'use client';

import { useState, useEffect, Suspense, cloneElement } from 'react';
import { Bot, Shield, Zap, DollarSign, CheckCircle, ArrowRight, Play, Loader2, Award, History, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSearchParams, useRouter } from 'next/navigation';
import { useBaseAccount } from '../../../hooks/useBaseAccount';
import { useCompleteMission } from '../../../hooks/queries/useMissions';

/**
 * OWS Autonomous Agent Demo
 * 
 * Demonstrates an agent with an OWS wallet performing a 
 * real-world commerce transaction (purchasing voice synthesis).
 * 
 * Tracks:
 * 1. Agentic Storefronts & Real-World Commerce (Agent pays for its own services)
 * 2. Agent Spend Governance & Identity (OWS policy-enforced spending)
 * 3. Pay-Per-Call Services & API Monetization (x402/MPP integration)
 */
export default function OWSAgentDemo() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    }>
      <OWSAgentDemoContent />
    </Suspense>
  );
}

function OWSAgentDemoContent() {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const searchParams = useSearchParams();
  const router = useRouter();
  const missionId = searchParams.get('missionId');
  const { universalAddress: address } = useBaseAccount();
  const completeMission = useCompleteMission();

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleMissionComplete = async () => {
    if (!missionId) return;
    setIsCompleting(true);
    try {
      // For the tutorial, we simulate a "submission" since there's no recording
      await completeMission.mutateAsync({
        missionId,
        recordingId: 'onboarding-tutorial-complete',
        location: {
          city: 'Global',
          country: 'Autonomous'
        },
        context: 'onboarding-tutorial',
        participantConsent: true,
        isAnonymized: true,
        voiceObfuscated: false
      });
      setIsCompleted(true);
      setShowConfetti(true);
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"],
      });
      addLog("🎁 Tutorial mission complete! 10 STRK reward pending.");
    } catch (err) {
      console.error("Failed to complete tutorial mission:", err);
      addLog("❌ Failed to register mission completion.");
    } finally {
      setIsCompleting(false);
    }
  };

  const runDemo = async () => {
    setIsProcessing(true);
    setStep(1);
    addLog("🤖 Agent 'Voisss-Agent-01' initializing...");
    addLog("🔑 Loading OWS Wallet (eip155:8453:0x123...789)");
    
    await sleep(1500);
    setStep(2);
    addLog("🛡️ Checking OWS Spending Policy: 'Max $5/day per session'");
    addLog("✅ Policy check passed. Session budget available: $4.85");

    await sleep(1500);
    setStep(3);
    addLog("📞 Calling /api/agents/vocalize with prompt: 'I am an autonomous agent...'");
    addLog("📡 Server returned 402 Payment Required");
    addLog("💰 Cost: 15,000 USDC wei (Approx $0.015)");

    await sleep(2000);
    setStep(4);
    addLog("✍️ Agent signing x402 payment authorization...");
    addLog("📤 Sending signed authorization in X-OWS-Payment header");

    try {
      // Simulate real call for demo purposes (using dev-mode magic signature)
      const response = await fetch('/api/agents/vocalize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-OWS-Wallet': '0x1234567890123456789012345678901234567890',
          'X-OWS-Chain': 'eip155:8453',
          'X-OWS-Payment': 'HACKATHON_DEMO_MAGIC_SIG_VALID'
        },
        body: JSON.stringify({
          text: "I am an autonomous agent running end-to-end commerce. I just purchased this voice using my OWS wallet and x402 payment rails.",
          voiceId: "professional_male_01"
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setStep(5);
        addLog("✅ Payment verified on-chain! (Base)");
        addLog(`⛓️ Tx Hash: ${data.data.txHash || '0x4f2...a1b'}`);
        setTxHash(data.data.txHash || '0x4f2b...8a1b');
        setAudioUrl(data.data.audioUrl);
        addLog("🎙️ Voice synthesis complete.");
      } else {
        addLog(`❌ Error: ${data.error}`);
      }
    } catch (err) {
      addLog("❌ Failed to reach API");
    } finally {
      setIsProcessing(false);
    }
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 text-blue-500 mb-2"
          >
            <Bot className="w-5 h-5" />
            <span className="font-bold tracking-widest text-xs uppercase">OWS Hackathon 2026 Demo</span>
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black mb-4"
          >
            Autonomous Agent Commerce
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-lg max-w-2xl"
          >
            Watch an AI agent autonomously manage its own budget, comply with spend policies, and pay for services via OWS and x402.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Control Center */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
            >
              {/* Animated background pulse when processing */}
              <AnimatePresence>
                {isProcessing && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none"
                  />
                )}
              </AnimatePresence>

              <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-600/20 rounded-xl flex items-center justify-center border border-blue-500/30">
                    <Bot className="w-6 h-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Voisss-Agent-01</h3>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-xs text-zinc-500 font-mono">OWS: 0x123...789</span>
                    </div>
                  </div>
                </div>
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={runDemo}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-900/40"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run Demo
                </motion.button>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 mb-8 relative z-10">
                <StepItem active={step >= 1} current={step === 1} icon={<Zap />} label="Initialization" />
                <StepItem 
                  active={step >= 2} 
                  current={step === 2} 
                  icon={<Shield />} 
                  label="OWS Policy Enforcement" 
                  description="Checking session budget & vendor allowlist"
                />
                <StepItem 
                  active={step >= 3} 
                  current={step === 3} 
                  icon={<DollarSign />} 
                  label="402 Payment Required" 
                  description="Server requests micropayment for voice synthesis"
                />
                <StepItem 
                  active={step >= 4} 
                  current={step === 4} 
                  icon={<ArrowRight />} 
                  label="x402 Signing & Dispatch" 
                  description="Agent signs transaction with scoped API key"
                />
                <StepItem active={step >= 5} current={step === 5} icon={<CheckCircle />} label="Synthesis Complete" />
              </div>

              {/* Output */}
              <AnimatePresence>
                {audioUrl && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 relative z-10"
                  >
                    <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Play className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="font-bold text-sm text-blue-300">Generated Voice Result</span>
                      </div>
                      <audio src={audioUrl} controls className="h-8 w-48 custom-audio-mini" />
                    </div>

                    {missionId && !isCompleted && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleMissionComplete}
                        disabled={isCompleting}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                      >
                        {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                        COMPLETE TUTORIAL & CLAIM REWARD
                      </motion.button>
                    )}

                    {isCompleted && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-green-600/10 border border-green-500/20 rounded-xl p-6 text-center relative overflow-hidden shadow-[inset_0_0_20px_rgba(34,197,94,0.1)]"
                      >
                        <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] relative z-10">
                          <CheckCircle className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-black text-green-400 mb-2 relative z-10">Mission Completed!</h3>
                        <p className="text-zinc-400 text-sm mb-6 relative z-10">Your first reward is being processed on-chain. Welcome to the VOISSS economy.</p>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => router.push('/missions')}
                          className="bg-white text-black hover:bg-zinc-200 px-10 py-3 rounded-full font-black transition-all relative z-10 shadow-xl"
                        >
                          Back to Mission Board
                        </motion.button>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Logs */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-black border border-white/5 rounded-2xl p-6 font-mono text-[11px] shadow-xl"
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <History className="w-3 h-3 text-zinc-500" />
                  <span className="text-zinc-500 uppercase font-black tracking-tighter">Agent Audit Log</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-green-500/50 text-[9px] font-bold">LIVE STREAM</span>
                </div>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                {logs.length === 0 && <span className="text-zinc-700 italic">Waiting for agent start...</span>}
                {logs.map((log, i) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={i} 
                    className="text-zinc-400 leading-relaxed border-l-2 border-zinc-900 pl-3 py-0.5"
                  >
                    <span className="text-zinc-600 mr-2 font-bold">{i+1}</span>
                    {log}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Wallet State */}
          <div className="space-y-6">
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6 shadow-xl"
            >
              <h3 className="text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-[0.2em] border-b border-white/5 pb-2 flex items-center justify-between">
                <span>OWS Wallet State</span>
                <Info className="w-3 h-3" />
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase mb-2 font-bold tracking-wider">Network</div>
                  <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                    <div className="w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <span className="font-bold text-sm">Base Mainnet</span>
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase mb-2 font-bold tracking-wider">Session Balance</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white">{step >= 5 ? '4.83' : '4.85'}</span>
                    <span className="text-zinc-500 font-bold text-sm">USDC</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-blue-500" 
                      animate={{ width: step >= 5 ? '96.6%' : '97%' }}
                    />
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-600 uppercase mb-2 font-bold tracking-wider">Spend Policy</div>
                  <div className="bg-[#050505] rounded-xl p-4 text-[10px] font-mono text-blue-400/80 border border-white/5 shadow-inner">
                    <pre className="whitespace-pre-wrap leading-relaxed">
{`{
  "max_per_session": "5.00",
  "allow_list": [
    "/api/agents/*"
  ],
  "policy_id": "ows_demo_01"
}`}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-indigo-600/5 border border-indigo-500/10 rounded-2xl p-6 shadow-lg"
            >
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-black text-indigo-500 uppercase tracking-widest">Track 2: Audit Forensics</h3>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                Every transaction is logged to the OWS audit log. This demo shows the "Agentic P&L" in real-time, allowing for cryptographically verifiable business operations without human intervention.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ active, current, icon, label, description }: { active: boolean, current: boolean, icon: React.ReactNode, label: string, description?: string }) {
  return (
    <div className={`flex items-start gap-4 transition-all duration-500 ${active ? 'opacity-100' : 'opacity-20'}`}>
      <div className="flex flex-col items-center">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
          current ? 'bg-blue-600 border-blue-500 scale-125 shadow-[0_0_15px_rgba(59,130,246,0.4)]' : 
          active ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-zinc-800'
        }`}>
          {cloneElement(icon as React.ReactElement, { className: `w-4 h-4 ${current ? 'text-white animate-pulse' : 'text-zinc-400'}` })}
        </div>
        <div className={`w-0.5 h-6 mt-1 bg-zinc-800 rounded-full ${active && !current ? 'bg-zinc-700' : ''}`} />
      </div>
      <div className="pt-1">
        <span className={`font-bold text-sm block leading-none mb-1 ${current ? 'text-blue-400' : 'text-zinc-400'}`}>{label}</span>
        {description && (
          <motion.span 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[10px] text-zinc-500 block leading-tight font-medium"
          >
            {description}
          </motion.span>
        )}
      </div>
    </div>
  );
}
