"use client";

import { useMemo, useState, Suspense, useCallback, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import RecordingStudio from "../../components/RecordingStudio";
import QuickRecordStudio from "../../components/RecordingStudio/QuickRecordStudio";
import StudioRecordingsList from "../../components/StudioRecordingsList";
import { useRecordings } from "../../hooks/queries/useRecordings";
import { useAuth } from "../../contexts/AuthContext";
import { ArrowRight, Mic, Upload, Zap } from "lucide-react";
import { initWebMCP } from "../../lib/webmcp";
import { MascotEvents, publishAppEvent } from "@/lib/mascot-events";
import { Chip, Disclosure, Notice } from "@/components/ui";

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
  const [recordingVariant, setRecordingVariant] = useState<"quick" | "full">(
    "full",
  );

  const { isAuthenticated, address } = useAuth();
  const { data: allRecordings = [], isLoading: isLoadingRecordings } =
    useRecordings();

  // Register WebMCP tools for AI agents (runs once on mount)
  useEffect(() => {
    initWebMCP().catch(console.error);
  }, []);

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
    publishAppEvent({ type: "recording:complete", title: newRecording.title });
  };

  const handleDeleteLocal = useCallback((recordingId: string) => {
    setLocalRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  }, []);

  const showStepIndicator = !mode && !missionId;

  return (
    <main id="listening-main">
      <MascotEvents />
      <div className="lr-wrap">
        <nav className="lr-breadcrumb" aria-label="Breadcrumb">
          <Link href="/marketplace">Discover voices</Link>
          <span aria-hidden>/</span>
          <span aria-current="page">Sell your voice</span>
        </nav>

        <header
          className="lr-discover-head"
          style={{ paddingTop: "var(--lr-space-md)" }}
        >
          <h1
            className="lr-h1"
            style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)" }}
          >
            Sell your voice.
          </h1>
          <p className="lr-lede">
            Record or import once. Earn 70% of every license.
          </p>
        </header>

        {/* Tier 0 — the three ways in. */}
        {showStepIndicator && activeStep === "choose" && (
          <div className="lr-options">
            <button
              className="lr-option"
              onClick={() => {
                setRecordingVariant("quick");
                setActiveStep("record");
              }}
            >
              <h3>
                <Mic className="w-5 h-5" aria-hidden /> Quick record
              </h3>
              <p>Start recording right away — no tools, no options.</p>
              <span className="lr-option-cta">
                Start recording <ArrowRight className="w-3 h-3" aria-hidden />
              </span>
            </button>

            <button
              className="lr-option"
              onClick={() => {
                setRecordingVariant("full");
                setActiveStep("record");
              }}
            >
              <h3>
                <Zap className="w-5 h-5" aria-hidden /> Full studio
              </h3>
              <p>
                AI voice transforms, dubbing, version management, and agent
                integration.
              </p>
              <span className="lr-option-cta">
                Open full studio <ArrowRight className="w-3 h-3" aria-hidden />
              </span>
            </button>

            <Link className="lr-option" href="/sell/import">
              <h3>
                <Upload className="w-5 h-5" aria-hidden /> Import from
                ElevenLabs
              </h3>
              <p>
                Already have voices on ElevenLabs? Import them in one click and
                start earning 70% revenue share.
              </p>
              <span className="lr-option-cta">
                Import voices <ArrowRight className="w-3 h-3" aria-hidden />
              </span>
            </Link>
          </div>
        )}

        {activeStep === "manage" && (
          <Notice style={{ marginTop: "var(--lr-space-lg)" }}>
            <p style={{ margin: 0, fontWeight: 600, color: "var(--lr-ink)" }}>
              Recording saved — what&apos;s next?
            </p>
            <p style={{ margin: "0.4rem 0 0.75rem" }}>
              {!isAuthenticated
                ? "Sign in via the top nav to publish on-chain, then list your voice on the marketplace to start earning 70%."
                : "List your voice on the marketplace to start earning 70% every time an AI agent uses it."}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              <Link href="/sell/dashboard" className="lr-btn lr-btn-primary">
                List on marketplace
              </Link>
              <Link href="/generate" className="lr-btn lr-btn-ghost">
                Preview agent experience
              </Link>
            </div>
          </Notice>
        )}

        {activeStep === "record" && (
          <div
            id="recording-section"
            style={{ marginTop: "var(--lr-space-lg)" }}
          >
            <Chip
              onClick={() => setActiveStep("choose")}
              style={{ marginBottom: "0.75rem" }}
            >
              &larr; Back to options
            </Chip>
            {/* Recording studios are pre-LR legacy surfaces — wrapped in a
                dark inset until they get their own migration pass. */}
            <div className="lr-legacy-inset">
              {recordingVariant === "quick" &&
              !templateId &&
              !mode &&
              !missionId ? (
                <QuickRecordStudio
                  onRecordingComplete={handleRecordingComplete}
                />
              ) : (
                <RecordingStudio
                  onRecordingComplete={handleRecordingComplete}
                  initialTranscriptTemplateId={templateId}
                  initialMode={mode}
                  missionId={missionId}
                />
              )}
            </div>
          </div>
        )}

        {/* Tier 1 — how the contributor journey works. */}
        <Disclosure
          title="How selling works"
          variant="section"
          id="how-selling-works"
          style={{ marginTop: "var(--lr-space-xl)" }}
        >
          <ol className="lr-reasons">
            <li>Record in the studio or import your voices from ElevenLabs.</li>
            <li>
              Publish on-chain and list on the marketplace — you set the price.
            </li>
            <li>
              Earn 70% of every license, paid in USDC on Base, each time an AI
              agent speaks in your voice.
            </li>
          </ol>
        </Disclosure>

        {isAuthenticated &&
          (allRecordings.length > 0 || isLoadingRecordings) && (
            <section style={{ marginTop: "var(--lr-space-xl)" }}>
              <div className="lr-audition-head">
                <h2>Your recordings</h2>
                {isLoadingRecordings && <span role="status">Loading…</span>}
              </div>
              <div className="lr-legacy-inset">
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
            </section>
          )}

        {!isAuthenticated && localRecordings.length > 0 && (
          <section
            style={{
              marginTop: "var(--lr-space-xl)",
              paddingBottom: "var(--lr-space-2xl)",
            }}
          >
            <div className="lr-audition-head">
              <h2>Session recordings</h2>
              <span>Sign in to save permanently</span>
            </div>
            <div className="lr-legacy-inset">
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
          </section>
        )}
      </div>
    </main>
  );
}

export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <main id="listening-main">
          <div className="lr-wrap" style={{ paddingTop: "4rem" }}>
            Loading studio…
          </div>
        </main>
      }
    >
      <StudioPageInner />
    </Suspense>
  );
}
