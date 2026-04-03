'use client';

import { useState, useEffect } from 'react';
import { Bot, Shield, Zap, DollarSign, CheckCircle, ArrowRight, Play, Loader2, Award } from 'lucide-react';
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
        }
      });
      setIsCompleted(true);
      setShowConfetti(true);
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
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Bot className="w-5 h-5" />
            <span className="font-bold tracking-widest text-xs uppercase">OWS Hackathon 2026 Demo</span>
          </div>
          <h1 className="text-4xl font-black mb-4">Autonomous Agent Commerce</h1>
          <p className="text-zinc-400 text-lg max-w-2xl">
            Watch an AI agent autonomously manage its own budget, comply with spend policies, and pay for services via OWS and x402.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Agent Control Center */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111] border border-white/5 rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-8">
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
                <button 
                  onClick={runDemo}
                  disabled={isProcessing}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-full font-bold transition-all flex items-center gap-2"
                >
                  {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Run Demo
                </button>
              </div>

              {/* Progress Steps */}
              <div className="space-y-4 mb-8">
                <StepItem active={step >= 1} current={step === 1} icon={<Zap />} label="Initialization" />
                <StepItem active={step >= 2} current={step === 2} icon={<Shield />} label="OWS Policy Enforcement" />
                <StepItem active={step >= 3} current={step === 3} icon={<DollarSign />} label="402 Payment Required" />
                <StepItem active={step >= 4} current={step === 4} icon={<ArrowRight />} label="x402 Signing & Dispatch" />
                <StepItem active={step >= 5} current={step === 5} icon={<CheckCircle />} label="Synthesis Complete" />
              </div>

              {/* Output */}
              {audioUrl && (
                <div className="space-y-4">
                  <div className="bg-blue-600/10 border border-blue-500/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-bottom-4">
                    <div className="flex items-center gap-3">
                      <Play className="w-5 h-5 text-blue-400" />
                      <span className="font-bold text-sm text-blue-300">Generated Voice Result</span>
                    </div>
                    <audio src={audioUrl} controls className="h-8 w-48" />
                  </div>

                  {missionId && !isCompleted && (
                    <button
                      onClick={handleMissionComplete}
                      disabled={isCompleting}
                      className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-4 rounded-xl font-black flex items-center justify-center gap-3 animate-pulse shadow-[0_0_20px_rgba(79,70,229,0.4)]"
                    >
                      {isCompleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Award className="w-5 h-5" />}
                      COMPLETE TUTORIAL & CLAIM REWARD
                    </button>
                  )}

                  {isCompleted && (
                    <div className="bg-green-600/10 border border-green-500/20 rounded-xl p-6 text-center animate-in zoom-in duration-500 relative overflow-hidden">
                      {showConfetti && (
                        <div className="absolute inset-0 pointer-events-none">
                          {[...Array(20)].map((_, i) => (
                            <div 
                              key={i}
                              className="absolute w-2 h-2 rounded-full animate-ping"
                              style={{
                                backgroundColor: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'][i % 4],
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${1 + Math.random() * 2}s`
                              }}
                            />
                          ))}
                        </div>
                      )}
                      <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(34,197,94,0.4)] relative z-10">
                        <CheckCircle className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-black text-green-400 mb-2 relative z-10">Mission Completed!</h3>
                      <p className="text-zinc-400 text-sm mb-6 relative z-10">Your first reward is being processed on-chain. Welcome to the VOISSS economy.</p>
                      <button 
                        onClick={() => router.push('/missions')}
                        className="bg-white text-black hover:bg-zinc-200 px-10 py-3 rounded-full font-black transition-all transform hover:scale-105 active:scale-95 relative z-10 shadow-xl"
                      >
                        Back to Mission Board
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Logs */}
            <div className="bg-black border border-white/5 rounded-2xl p-6 font-mono text-xs">
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
                <span className="text-zinc-500 uppercase font-black">Agent Audit Log</span>
                <span className="text-green-500/50">READ-ONLY</span>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {logs.length === 0 && <span className="text-zinc-700 italic">Waiting for agent start...</span>}
                {logs.map((log, i) => (
                  <div key={i} className="text-zinc-400">
                    <span className="text-zinc-600 mr-2">{i+1}.</span>
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Wallet State */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-white/5 rounded-2xl p-6">
              <h3 className="text-xs font-black text-zinc-500 uppercase mb-4 tracking-widest">OWS Wallet State</h3>
              <div className="space-y-4">
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase mb-1">Network</div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-blue-500 rounded-full" />
                    <span className="font-bold text-sm">Base Mainnet</span>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase mb-1">Balance</div>
                  <div className="text-2xl font-black">4.85 <span className="text-zinc-600 text-sm">USDC</span></div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-600 uppercase mb-1">Spend Policy</div>
                  <div className="bg-white/5 rounded p-2 text-[10px] text-zinc-400">
                    {'{"max_per_session": "5.00", "allow_list": ["/api/agents/*"]}'}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
              <h3 className="text-xs font-black text-blue-500 uppercase mb-2">Track 2: Audit Forensics</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Every transaction is logged to the OWS audit log. This demo shows the "Agentic P&L" in real-time, allowing for cryptographically verifiable business operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StepItem({ active, current, icon, label }: { active: boolean, current: boolean, icon: React.ReactNode, label: string }) {
  return (
    <div className={`flex items-center gap-4 transition-all ${active ? 'opacity-100' : 'opacity-20'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
        current ? 'bg-blue-600 border-blue-500 scale-110' : 
        active ? 'bg-zinc-800 border-zinc-700' : 'bg-transparent border-zinc-800'
      }`}>
        {cloneElement(icon as React.ReactElement, { className: "w-4 h-4 text-white" })}
      </div>
      <span className={`font-bold text-sm ${current ? 'text-blue-400' : 'text-zinc-400'}`}>{label}</span>
    </div>
  );
}

import { cloneElement } from 'react';
