import React, { useState, useCallback } from "react";
import {
  Sparkles,
  Loader2,
  Check,
  MessageSquare,
  FileText,
  Zap,
  Globe,
  Mic,
  Brain,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StudioInsightsPanelProps {
  audioBlob: Blob | null;
  onApplyInsights: (data: {
    title: string;
    summary: string;
    tags: string[];
    humanityCertificate?: HumanityCertificate;
    provider?: string;
    model?: string;
  }) => void;
  isVisible: boolean;
}

interface HumanityCertificate {
  status: "verified-human" | "review-needed" | "uncertain";
  badge: string;
  confidence: number;
  verdict: string;
  humanSignals: string[];
  aiArtifacts: string[];
  provenanceNotes: string[];
}

type StepStatus = "pending" | "running" | "completed" | "failed" | "skipped";

interface PipelineStep {
  id: string;
  label: string;
  status: StepStatus;
  provider?: string;
  model?: string;
  message?: string;
}

interface InsightsData {
  title: string;
  summary: string[];
  tags: string[];
  actionItems: string[];
  humanityCertificate?: HumanityCertificate;
  provider?: string;
  model?: string;
  transcript?: string;
  mode?: string;
}

const INITIAL_STEPS: PipelineStep[] = [
  { id: "transcription", label: "Transcribing audio with ElevenLabs", status: "pending" },
  { id: "analysis", label: "Analyzing transcript", status: "pending" },
  { id: "fallback", label: "Gemini audio-native fallback", status: "pending" },
];

function StepIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />;
    case "completed":
      return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    case "failed":
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    case "skipped":
      return <div className="w-3.5 h-3.5 rounded-full border border-gray-600" />;
    default:
      return <div className="w-3.5 h-3.5 rounded-full border border-gray-700 bg-gray-800" />;
  }
}

function StepLabel({ step }: { step: PipelineStep }) {
  const statusColors: Record<StepStatus, string> = {
    pending: "text-gray-600",
    running: "text-purple-300",
    completed: "text-emerald-300",
    failed: "text-red-300",
    skipped: "text-gray-600",
  };

  return (
    <div className="flex items-center gap-2.5">
      <StepIcon status={step.status} />
      <div className="flex flex-col">
        <span className={`text-xs font-medium ${statusColors[step.status]}`}>
          {step.label}
        </span>
        {step.provider && step.status === "completed" && (
          <span className="text-[10px] text-gray-500">
            via {step.provider} ({step.model})
          </span>
        )}
        {step.message && step.status === "failed" && (
          <span className="text-[10px] text-red-400/70">{step.message}</span>
        )}
      </div>
    </div>
  );
}

export default function StudioInsightsPanel({
  audioBlob,
  onApplyInsights,
  isVisible,
}: StudioInsightsPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pipelineSteps, setPipelineSteps] = useState<PipelineStep[]>(INITIAL_STEPS);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);

  const handleGenerateInsights = useCallback(async () => {
    if (!audioBlob) return;

    setIsLoading(true);
    setError(null);
    setInsights(null);
    setTranscript(null);
    setShowPipeline(true);
    setPipelineSteps(INITIAL_STEPS.map((s) => ({ ...s })));

    try {
      const formData = new FormData();
      formData.append("file", audioBlob, "recording.webm");

      const response = await fetch("/api/studio-insights/stream", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response stream");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const eventBlock of events) {
          const lines = eventBlock.split("\n");
          let eventType = "";
          let eventData = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7);
            } else if (line.startsWith("data: ")) {
              eventData = line.slice(6);
            }
          }

          if (!eventType || !eventData) continue;

          try {
            const parsed = JSON.parse(eventData);

            switch (eventType) {
              case "progress":
                if (parsed.steps) {
                  setPipelineSteps(parsed.steps);
                }
                break;

              case "transcript":
                if (parsed.text) {
                  setTranscript(parsed.text);
                }
                break;

              case "complete":
                setInsights({
                  title: parsed.insights?.title || "Untitled",
                  summary: parsed.insights?.summary || [],
                  tags: parsed.insights?.tags || [],
                  actionItems: parsed.insights?.actionItems || [],
                  humanityCertificate: parsed.humanityCertificate,
                  provider: parsed.provider,
                  model: parsed.model,
                  transcript: parsed.transcript,
                  mode: parsed.mode,
                });
                if (parsed.steps) {
                  setPipelineSteps(parsed.steps);
                }
                if (parsed.transcript && !transcript) {
                  setTranscript(parsed.transcript);
                }
                break;

              case "error":
                throw new Error(parsed.message || "Pipeline failed");
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== "Pipeline failed") {
              console.warn("SSE parse error:", parseErr);
            } else {
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Analysis failed. Please try a different recording."
      );
    } finally {
      setIsLoading(false);
    }
  }, [audioBlob, transcript]);

  if (!isVisible) return null;

  const handleApply = () => {
    if (!insights) return;

    onApplyInsights({
      title: insights.title,
      summary: insights.summary.join("\n"),
      tags: insights.tags,
      humanityCertificate: insights.humanityCertificate,
      provider: insights.provider,
      model: insights.model,
    });
  };

  const activeSteps = pipelineSteps.filter((s) => s.status !== "pending" || isLoading);
  const hasVisibleSteps = activeSteps.length > 0 && (isLoading || insights);

  return (
    <div className="bg-[#111111] rounded-2xl p-6 mb-8 border border-purple-500/20 shadow-[0_0_50px_rgba(124,93,250,0.1)] relative overflow-hidden group">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-600/10 blur-[100px] pointer-events-none" />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              Studio Insights
            </h3>
            <p className="text-xs text-gray-500 font-medium">
              AI-powered transcription, metadata & trust signals
            </p>
          </div>
        </div>
        {!insights && (
          <button
            onClick={handleGenerateInsights}
            disabled={isLoading || !audioBlob}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 group-hover:animate-pulse" />
                Analyze Version
              </>
            )}
          </button>
        )}
      </div>

      {/* Pipeline Progress */}
      {(isLoading || showPipeline) && (
        <div className="mb-6 space-y-1.5 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gradient-to-r from-purple-500/20 to-transparent" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400/60">
              Pipeline
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-purple-500/20 to-transparent" />
          </div>

          <div className="flex items-center gap-6">
            {pipelineSteps.map((step, i) => (
              <React.Fragment key={step.id}>
                {i > 0 && (
                  <div
                    className={`h-px flex-1 max-w-[40px] ${
                      step.status === "completed" || step.status === "running"
                        ? "bg-purple-500/40"
                        : "bg-gray-800"
                    }`}
                  />
                )}
                <StepLabel step={step} />
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      {/* Transcript Preview */}
      {transcript && (
        <div className="mb-6 animate-in fade-in slide-in-from-bottom-1 duration-500">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-2 w-full text-left group/transcript"
          >
            <Mic className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">
              Transcript
            </span>
            <span className="text-[10px] text-gray-600 ml-1">
              ({transcript.length} chars)
            </span>
            {showTranscript ? (
              <ChevronUp className="w-3 h-3 text-gray-600 ml-auto" />
            ) : (
              <ChevronDown className="w-3 h-3 text-gray-600 ml-auto" />
            )}
          </button>
          {showTranscript && (
            <div className="mt-2 p-3 bg-gray-900/50 rounded-xl border border-indigo-500/10 text-gray-300 text-xs leading-relaxed max-h-32 overflow-y-auto">
              {transcript}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-red-400 text-sm mb-6 bg-red-900/10 border border-red-900/20 p-4 rounded-xl flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          {error}
        </div>
      )}

      {insights && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-gray-900/30 p-5 rounded-2xl border border-white/5">
              <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2">
                <FileText className="w-3 h-3" /> Suggested Viral Title
              </h4>
              <p className="text-white text-xl font-bold leading-tight">
                {insights.title}
              </p>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {insights.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-purple-500/10 text-purple-400 text-[10px] font-bold rounded-lg border border-purple-500/20"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/30 p-5 rounded-2xl border border-white/5">
              <h4 className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                <Globe className="w-3 h-3" /> Summary
              </h4>
              <ul className="space-y-2">
                {insights.summary.map((point, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-gray-300 text-xs leading-relaxed"
                  >
                    <div className="w-1 h-1 rounded-full bg-purple-500 mt-1.5 flex-shrink-0" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900/10 to-purple-900/10 p-6 rounded-2xl border border-indigo-500/10">
            <h4 className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
              <MessageSquare className="w-3 h-3" /> Social Platform Captions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {insights.actionItems[0] && (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 group/caption relative">
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-gray-600 group-hover/caption:text-sky-400 transition-colors">
                    X / FARCASTER
                  </span>
                  <p className="text-gray-300 text-xs italic">
                    &ldquo;{insights.actionItems[0]}&rdquo;
                  </p>
                </div>
              )}
              {insights.actionItems[1] && (
                <div className="bg-black/20 p-3 rounded-lg border border-white/5 group/caption relative">
                  <span className="absolute top-2 right-2 text-[8px] font-bold text-gray-600 group-hover/caption:text-pink-400 transition-colors">
                    TIKTOK / REELS
                  </span>
                  <p className="text-gray-300 text-xs italic">
                    &ldquo;{insights.actionItems[1]}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>

          {insights.humanityCertificate && (
            <div className="bg-emerald-950/20 p-6 rounded-2xl border border-emerald-500/20">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mb-2">
                    Humanity Certificate
                  </h4>
                  <p className="text-white text-lg font-bold">
                    {insights.humanityCertificate.badge}
                  </p>
                  <p className="text-sm text-emerald-100/80 mt-1">
                    {insights.humanityCertificate.verdict}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-widest text-emerald-300/70">
                    Confidence
                  </div>
                  <div className="text-2xl font-black text-white">
                    {Math.round(
                      insights.humanityCertificate.confidence * 100
                    )}
                    %
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                  <div className="text-emerald-300 font-bold uppercase tracking-wider text-[10px] mb-2">
                    Human signals
                  </div>
                  <ul className="space-y-2 text-gray-300">
                    {insights.humanityCertificate.humanSignals.map(
                      (signal, index) => (
                        <li key={index}>{signal}</li>
                      )
                    )}
                  </ul>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                  <div className="text-amber-300 font-bold uppercase tracking-wider text-[10px] mb-2">
                    AI artifacts
                  </div>
                  <ul className="space-y-2 text-gray-300">
                    {insights.humanityCertificate.aiArtifacts.map(
                      (artifact, index) => (
                        <li key={index}>{artifact}</li>
                      )
                    )}
                  </ul>
                </div>
                <div className="bg-black/20 rounded-xl border border-white/5 p-4">
                  <div className="text-sky-300 font-bold uppercase tracking-wider text-[10px] mb-2">
                    Provenance notes
                  </div>
                  <ul className="space-y-2 text-gray-300">
                    {insights.humanityCertificate.provenanceNotes.map(
                      (note, index) => (
                        <li key={index}>{note}</li>
                      )
                    )}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <div className="flex flex-col gap-1">
              <p className="text-[10px] text-gray-600 font-medium">
                {insights.mode === "transcript-pipeline" ? (
                  <>
                    <Mic className="w-3 h-3 inline mr-1 text-indigo-400" />
                    Transcribed by ElevenLabs
                    <Brain className="w-3 h-3 inline mx-1 text-purple-400" />
                    Analyzed by {insights.provider}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 inline mr-1 text-amber-400" />
                    Audio-native analysis by {insights.provider}
                  </>
                )}
                {insights.model && (
                  <span className="ml-2 px-1.5 py-0.5 rounded bg-white/5 border border-white/10 uppercase tracking-tighter">
                    {insights.model}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 border border-green-500/20"
            >
              <Check className="w-4 h-4" />
              Apply to Metadata
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
