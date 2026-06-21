"use client";

import { useState, useEffect, useCallback } from "react";
import { Play, Square, Activity, DollarSign, Cpu, RefreshCw } from "lucide-react";

interface ACPStatus {
  isRunning: boolean;
  agentId: string;
  autoBid: boolean;
  minBudget: number;
  offeringIds: string[];
}

const OFFERING_NAMES: Record<string, string> = {
  "019e98e8-f262-7aa9-938b-73664bae4fcd": "Voice Generation",
  "019e9bb1-5f8c-76c9-8f92-685af00b8c22": "Voice Analysis",
  "019e9bb1-9e4d-7fb1-bb47-adb879d978c0": "Voice Cloning",
};

export default function ACPDashboardPage() {
  const [status, setStatus] = useState<ACPStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authKey, setAuthKey] = useState("");
  const [showKeyInput, setShowKeyInput] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/acp/listener", {
        headers: { Authorization: `Bearer ${authKey}` },
      });
      const json = await res.json();
      if (json.success) {
        setStatus(json.data);
        setShowKeyInput(false);
      } else {
        setError(json.error || "Failed to fetch status");
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [authKey]);

  const toggleListener = async (action: "start" | "stop") => {
    try {
      const res = await fetch("/api/acp/listener", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authKey}`,
        },
        body: JSON.stringify({ action }),
      });
      const json = await res.json();
      if (json.success) {
        setStatus(json.status);
      } else {
        setError(json.error || `Failed to ${action} listener`);
      }
    } catch {
      setError(`Failed to ${action} listener`);
    }
  };

  if (showKeyInput) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <Cpu className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">ACP Listener Dashboard</h1>
            <p className="text-gray-400 text-sm">Enter admin API key to view status</p>
          </div>
          <input
            type="password"
            value={authKey}
            onChange={(e) => setAuthKey(e.target.value)}
            placeholder="Admin API Key"
            className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 mb-4"
          />
          <button
            onClick={fetchStatus}
            disabled={!authKey || loading}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl text-white font-semibold disabled:opacity-50 transition-all"
          >
            {loading ? "Connecting..." : "Connect"}
          </button>
          {error && <p className="text-red-400 text-sm mt-4 text-center">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">ACP Listener</h1>
            <p className="text-gray-400 text-sm mt-1">
              Autonomous job discovery on the Virtuals Protocol marketplace
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchStatus()}
              className="p-2 rounded-lg bg-[#1A1A1A] border border-[#2A2A2A] hover:border-gray-500 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-400" />
            </button>
            {status?.isRunning ? (
              <button
                onClick={() => toggleListener("stop")}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/20 transition-all"
              >
                <Square className="w-4 h-4" /> Stop
              </button>
            ) : (
              <button
                onClick={() => toggleListener("start")}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 hover:bg-green-500/20 transition-all"
              >
                <Play className="w-4 h-4" /> Start
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Activity className={`w-5 h-5 ${status?.isRunning ? "text-green-400" : "text-gray-500"}`} />
              <span className="text-sm text-gray-400">Status</span>
            </div>
            <p className={`text-lg font-semibold ${status?.isRunning ? "text-green-400" : "text-gray-500"}`}>
              {status?.isRunning ? "Active" : "Stopped"}
            </p>
          </div>
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">Min Budget</span>
            </div>
            <p className="text-lg font-semibold">${status?.minBudget.toFixed(2)}</p>
          </div>
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-purple-400" />
              <span className="text-sm text-gray-400">Auto-Bid</span>
            </div>
            <p className={`text-lg font-semibold ${status?.autoBid ? "text-green-400" : "text-gray-500"}`}>
              {status?.autoBid ? "Enabled" : "Disabled"}
            </p>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Marketplace Offerings</h2>
          <div className="space-y-3">
            {status?.offeringIds.map((id) => (
              <div key={id} className="flex items-center justify-between p-3 bg-[#0A0A0A] rounded-xl">
                <span className="text-sm font-medium">{OFFERING_NAMES[id] || id}</span>
                <span className="text-xs text-gray-500 font-mono">{id.slice(0, 8)}...</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#0A0A0A] rounded-xl">
            <span className="text-xs text-gray-500">Agent ID: </span>
            <span className="text-xs text-gray-300 font-mono">{status?.agentId}</span>
          </div>
        </div>

        <div className="mt-8 p-6 bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-[#2A2A2A] rounded-2xl">
          <h2 className="text-lg font-semibold mb-2">How It Works</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            VOISSS listens for voice-related job opportunities on the Virtuals Protocol ACP marketplace.
            When a matching job is found, it auto-bids and delivers results — all without manual intervention.
            Currently monitoring 3 offerings: voice generation, voice analysis, and voice cloning.
          </p>
        </div>
      </div>
    </div>
  );
}
