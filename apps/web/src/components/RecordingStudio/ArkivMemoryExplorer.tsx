"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Database,
  Search,
  ExternalLink,
  Shield,
  Brain,
  Mic,
  Tag,
  FileText,
  Loader2,
  AlertTriangle,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Fingerprint,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import {
  queryVoiceInsights,
  queryHumanityCertificates,
  getBragaExplorerUrl,
  getBragaEntityUrl,
  type ArkivEntity,
} from "@/services/arkivService";

interface ArkivMemoryExplorerProps {
  ownerAddress?: string | null;
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; icon: React.ReactNode }> = {
    "verified-human": {
      color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
    "review-needed": {
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      icon: <HelpCircle className="w-3 h-3" />,
    },
    uncertain: {
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      icon: <XCircle className="w-3 h-3" />,
    },
  };
  const current = config[status] || config.uncertain;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${current.color}`}
    >
      {current.icon}
      {status.replace(/-/g, " ")}
    </span>
  );
}

function MemoryCard({
  entity,
  certificate,
}: {
  entity: ArkivEntity;
  certificate?: ArkivEntity;
}) {
  const [expanded, setExpanded] = useState(false);
  const payload = entity.payload;
  const txHash = entity.attributes.find((a) => a.key === "txHash")?.value;
  const createdAtMs = payload.createdAt
    ? new Date(payload.createdAt).getTime()
    : Date.now();
  const dateStr = new Date(createdAtMs).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-[#1A1A1A]/80 backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden hover:border-purple-500/20 transition-colors duration-300"
    >
      {/* Card Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="text-white font-bold text-sm truncate">
                {payload.title || "Untitled Memory"}
              </h4>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateStr}
              </span>
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                Braga Testnet
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {certificate && (
              <StatusBadge status={certificate.payload.status || "uncertain"} />
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Tags */}
        {payload.tags && payload.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {payload.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-md border border-purple-500/20"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Summary Preview */}
        {payload.summary && payload.summary.length > 0 && (
          <div className="mt-3 space-y-1">
            {payload.summary.slice(0, expanded ? undefined : 2).map((point, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                <span>{point}</span>
              </div>
            ))}
            {!expanded && payload.summary.length > 2 && (
              <p className="text-[10px] text-gray-600 pl-3">
                +{payload.summary.length - 2} more
              </p>
            )}
          </div>
        )}

        {/* Transcript Preview */}
        {payload.transcript && (
          <div className="mt-3 p-2.5 bg-black/20 rounded-xl border border-white/[0.04]">
            <div className="flex items-center gap-1.5 mb-1">
              <Mic className="w-3 h-3 text-indigo-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Transcript
              </span>
            </div>
            <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-3">
              {payload.transcript}
            </p>
          </div>
        )}
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-white/[0.04] pt-4">
              {/* Action Items */}
              {payload.actionItems && payload.actionItems.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    Platform Captions
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {payload.actionItems.map((item, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-black/20 rounded-lg border border-white/[0.04] text-xs text-gray-400 italic"
                      >
                        &ldquo;{item}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Humanity Certificate */}
              {certificate && (
                <div className="bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                      Humanity Certificate
                    </h5>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                        Verdict
                      </span>
                      <p className="text-xs text-gray-300">
                        {certificate.payload.verdict || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                        Confidence
                      </span>
                      <p className="text-xs text-gray-300">
                        {Math.round((certificate.payload.confidence || 0) * 100)}%
                      </p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70">
                        Badge
                      </span>
                      <p className="text-xs text-gray-300">
                        {certificate.payload.badge || "N/A"}
                      </p>
                    </div>
                  </div>
                  {certificate.payload.humanSignals &&
                    certificate.payload.humanSignals.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-emerald-500/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300/70 block mb-1">
                          Human Signals
                        </span>
                        <ul className="space-y-1">
                          {certificate.payload.humanSignals.map((s, i) => (
                            <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                              <Fingerprint className="w-3 h-3 text-emerald-400/50 mt-0.5 flex-shrink-0" />
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}

              {/* Arkiv Links */}
              <div className="flex items-center gap-3">
                <a
                  href={getBragaEntityUrl(entity.key)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-lg text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors"
                >
                  <Database className="w-3 h-3" />
                  View Entity
                  <ExternalLink className="w-3 h-3" />
                </a>
                {entity.key && (
                  <span className="text-[10px] text-gray-600 font-mono truncate">
                    {entity.key.slice(0, 20)}...{entity.key.slice(-8)}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ArkivMemoryExplorer({
  ownerAddress,
}: ArkivMemoryExplorerProps) {
  const [entities, setEntities] = useState<ArkivEntity[]>([]);
  const [certificates, setCertificates] = useState<ArkivEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const loadMemories = useCallback(async () => {
    if (!ownerAddress) return;
    setIsLoading(true);
    setError(null);
    try {
      const [insights, certs] = await Promise.all([
        queryVoiceInsights(ownerAddress),
        queryHumanityCertificates(ownerAddress),
      ]);
      setEntities(insights);
      setCertificates(certs);
    } catch (err) {
      console.error("Failed to load Arkiv memories:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load memories from Arkiv"
      );
    } finally {
      setIsLoading(false);
    }
  }, [ownerAddress]);

  useEffect(() => {
    loadMemories();
  }, [loadMemories]);

  const filteredEntities = entities.filter((entity) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const payload = entity.payload;
    return (
      (payload.title || "").toLowerCase().includes(q) ||
      (payload.tags || []).some((t) => t.toLowerCase().includes(q)) ||
      (payload.summary || []).some((s) => s.toLowerCase().includes(q)) ||
      (payload.transcript || "").toLowerCase().includes(q)
    );
  });

  const getCertificateForInsight = (insight: ArkivEntity) => {
    return certificates.find(
      (cert) => cert.payload.parentInsightId === insight.key
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-indigo-600/20 border border-purple-500/20 flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              AI Memory Archive
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              Decentralized voice insights on Arkiv Braga Testnet
            </p>
          </div>
        </div>
        <button
          onClick={loadMemories}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.06] rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors disabled:opacity-30"
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          Refresh
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search your voice memories..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0F0F0F] border border-[#2A2A2A] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/30 transition-colors"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">Query failed</p>
            <p className="text-xs text-red-400/70">{error}</p>
          </div>
        </div>
      )}

      {/* Not connected */}
      {!ownerAddress && (
        <div className="p-8 text-center bg-[#1A1A1A]/50 border border-[#2A2A2A] rounded-2xl">
          <Database className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            Connect your wallet to view your Arkiv memory archive
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && entities.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Querying Braga Testnet...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && ownerAddress && filteredEntities.length === 0 && !error && (
        <div className="p-8 text-center bg-[#1A1A1A]/50 border border-[#2A2A2A] rounded-2xl">
          <FileText className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">
            {searchQuery
              ? "No memories match your search"
              : "No voice memories archived yet. Generate insights to save them to Arkiv."}
          </p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredEntities.map((entity) => (
            <MemoryCard
              key={entity.key}
              entity={entity}
              certificate={getCertificateForInsight(entity)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Footer stats */}
      {entities.length > 0 && (
        <div className="flex items-center justify-between pt-4 border-t border-[#2A2A2A]">
          <p className="text-[10px] text-gray-600 font-medium">
            {filteredEntities.length} of {entities.length} memories shown
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-gray-600">
              Braga Testnet · Chain ID 60138453102
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
