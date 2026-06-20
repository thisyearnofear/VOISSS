"use client";

import { useMemo, useState, Suspense, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import RecordingStudio from "../../components/RecordingStudio";
import StudioRecordingsList from "../../components/StudioRecordingsList";
import StudioEarningsHero from "../../components/StudioEarningsHero";
import { useRecordings } from "../../hooks/queries/useRecordings";
import { useAuth } from "../../contexts/AuthContext";
import { Mic, Upload, ArrowRight } from "lucide-react";

type StudioStep = "choose" | "record" | "import" | "manage";

function StudioPageInner() {
  const searchParams = useSearchParams();
  const templateId = useMemo(
    () => searchParams.get("templateId") || undefined,
    [searchParams],
  );
  const mode = useMemo(
    () => searchParams.get("mode") || undefined,
    [searchParams],
  );
  const missionId = useMemo(
    () => searchParams.get("missionId") || undefined,
    [searchParams],
  );

  const [localRecordings, setLocalRecordings] = useState<
    Array<{
      id: string;
      title: string;
      duration: number;
      blob: Blob;
      createdAt: string;
    }>
  >([]);
  const [activeStep, setActiveStep] = useState<StudioStep>("choose");

  const { isAuthenticated, address } = useAuth();
  const { data: allRecordings = [], isLoading: isLoadingRecordings } =
    useRecordings();

  interface RecordingWithIpfs {
    id: string;
    title: string;
    duration: number;
    createdAt: string | Date;
    onChain?: boolean;
    ipfsHash?: string;
  }

  const handleRecordingComplete = (audioBlob: Blob, duration: number) => {
    const newRecording = {
      id: Date.now().toString(),
      title: `Recording ${localRecordings.length + 1}`,
      duration,
      blob: audioBlob,
      createdAt: new Date().toISOString(),
    };
    setLocalRecordings((prev) => [newRecording, ...prev]);
    setActiveStep("manage");
  };

  const handleDeleteLocal = useCallback((recordingId: string) => {
    setLocalRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  }, []);

  const showStepIndicator = !mode && !missionId;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-8 sm:py-12">
        <StudioEarningsHero />

        {showStepIndicator && activeStep === "choose" && (
          <div className="max-w-3xl mx-auto mb-12">
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => setActiveStep("record")}
                className="group p-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-purple-500/40 hover:bg-purple-500/5 transition-all text-left"
              >
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Mic className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Record New Voice</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Use the studio to record clean voice samples. Pick from curated scripts or read your own.
                </p>
                <span className="text-sm text-purple-400 group-hover:text-purple-300 flex items-center gap-1">
                  Start recording <ArrowRight className="w-3 h-3" />
                </span>
              </button>

              <a
                href="/import"
                className="group p-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl hover:border-green-500/40 hover:bg-green-500/5 transition-all text-left block"
              >
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4">
                  <Upload className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Import from ElevenLabs</h3>
                <p className="text-sm text-gray-400 mb-4">
                  Already have voices on ElevenLabs? Import them in one click and start earning 70% revenue share.
                </p>
                <span className="text-sm text-green-400 group-hover:text-green-300 flex items-center gap-1">
                  Import voices <ArrowRight className="w-3 h-3" />
                </span>
              </a>
            </div>
          </div>
        )}

        {activeStep === "record" && (
          <div id="recording-section" className="mb-12">
            <button
              onClick={() => setActiveStep("choose")}
              className="text-sm text-gray-400 hover:text-white mb-4 transition-colors"
            >
              &larr; Back to options
            </button>
            <RecordingStudio
              onRecordingComplete={handleRecordingComplete}
              initialTranscriptTemplateId={templateId}
              initialMode={mode}
              missionId={missionId}
            />
          </div>
        )}

        {isAuthenticated &&
          (allRecordings.length > 0 || isLoadingRecordings) && (
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Your Recordings
                </h2>
                {isLoadingRecordings && (
                  <div className="flex items-center gap-2 text-gray-400">
                    <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                )}
              </div>
              <StudioRecordingsList
                recordings={allRecordings.map((r: RecordingWithIpfs) => ({
                  id: r.id,
                  title: r.title,
                  duration: r.duration,
                  createdAt:
                    typeof r.createdAt === "string"
                      ? r.createdAt
                      : r.createdAt instanceof Date
                        ? r.createdAt.toISOString()
                        : new Date().toISOString(),
                  tags: r.onChain ? ["on-chain"] : ["local"],
                  onChain: r.onChain,
                  ipfsHash: r.ipfsHash,
                }))}
                isLoading={isLoadingRecordings}
                isAuthenticated={isAuthenticated}
                userId={address || undefined}
              />
            </div>
          )}

        {!isAuthenticated && localRecordings.length > 0 && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
              Session Recordings
              <span className="text-sm font-normal text-gray-400 ml-2">
                (Sign in to save permanently)
              </span>
            </h2>
            <StudioRecordingsList
              recordings={localRecordings.map((r) => ({
                id: r.id,
                title: r.title,
                duration: r.duration,
                createdAt: r.createdAt,
                tags: ["session"],
              }))}
              localRecordings={localRecordings}
              isAuthenticated={isAuthenticated}
              onDeleteLocal={handleDeleteLocal}
              userId={address || undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0A] text-white">
          <div className="voisss-container py-8 sm:py-12">
            Loading studio...
          </div>
        </div>
      }
    >
      <StudioPageInner />
    </Suspense>
  );
}
