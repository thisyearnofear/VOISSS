import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2 } from "lucide-react";
import { AudioVersion } from "@voisss/shared";

interface VersionComparisonProps {
  versions: AudioVersion[];
  onClose: () => void;
}

export default function VersionComparison({
  versions,
  onClose,
}: VersionComparisonProps) {
  const [selectedA, setSelectedA] = useState<string>(versions[0]?.id || "");
  const [selectedB, setSelectedB] = useState<string>(
    versions[Math.min(1, versions.length - 1)]?.id || ""
  );

  const [isPlayingA, setIsPlayingA] = useState(false);
  const [isPlayingB, setIsPlayingB] = useState(false);

  const [currentTimeA, setCurrentTimeA] = useState(0);
  const [currentTimeB, setCurrentTimeB] = useState(0);

  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const versionA = versions.find((v) => v.id === selectedA);
  const versionB = versions.find((v) => v.id === selectedB);

  const [urlA, setUrlA] = useState<string | undefined>();
  const [urlB, setUrlB] = useState<string | undefined>();

  // Manage URL A lifecycle
  useEffect(() => {
    if (!versionA) {
      setUrlA(undefined);
      return;
    }
    const url = URL.createObjectURL(versionA.blob);
    setUrlA(url);
    return () => URL.revokeObjectURL(url);
  }, [versionA]);

  // Manage URL B lifecycle
  useEffect(() => {
    if (!versionB) {
      setUrlB(undefined);
      return;
    }
    const url = URL.createObjectURL(versionB.blob);
    setUrlB(url);
    return () => URL.revokeObjectURL(url);
  }, [versionB]);

  // Handle play/pause sync
  const handlePlayA = () => {
    if (audioRefA.current) {
      if (isPlayingA) {
        audioRefA.current.pause();
        setIsPlayingA(false);
      } else {
        audioRefA.current.play().catch(() => {
          console.error("Failed to play audio A");
        });
        setIsPlayingA(true);
      }
    }
  };

  const handlePlayB = () => {
    if (audioRefB.current) {
      if (isPlayingB) {
        audioRefB.current.pause();
        setIsPlayingB(false);
      } else {
        audioRefB.current.play().catch(() => {
          console.error("Failed to play audio B");
        });
        setIsPlayingB(true);
      }
    }
  };

  // Reset play state on audio end
  useEffect(() => {
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;

    const handleEndA = () => setIsPlayingA(false);
    const handleEndB = () => setIsPlayingB(false);

    if (audioA) {
      audioA.addEventListener("ended", handleEndA);
      audioA.addEventListener("timeupdate", () =>
        setCurrentTimeA(audioA.currentTime)
      );
    }
    if (audioB) {
      audioB.addEventListener("ended", handleEndB);
      audioB.addEventListener("timeupdate", () =>
        setCurrentTimeB(audioB.currentTime)
      );
    }

    return () => {
      if (audioA) {
        audioA.removeEventListener("ended", handleEndA);
        audioA.removeEventListener("timeupdate", () => {});
      }
      if (audioB) {
        audioB.removeEventListener("ended", handleEndB);
        audioB.removeEventListener("timeupdate", () => {});
      }
    };
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgressPercent = (current: number, duration: number): number => {
    return duration > 0 ? (current / duration) * 100 : 0;
  };

  if (!versionA || !versionB) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl w-full max-w-2xl max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-[#1A1A1A] border-b border-[#2A2A2A] p-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Compare Versions</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Version Selectors */}
        <div className="grid grid-cols-2 gap-4 p-4 border-b border-[#2A2A2A]">
          <div>
            <label className="text-xs uppercase text-gray-400 mb-2 block">
              Version A
            </label>
            <select
              value={selectedA}
              onChange={(e) => setSelectedA(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white text-sm"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs uppercase text-gray-400 mb-2 block">
              Version B
            </label>
            <select
              value={selectedB}
              onChange={(e) => setSelectedB(e.target.value)}
              className="w-full px-3 py-2 bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg text-white text-sm"
            >
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* A/B Player */}
        <div className="space-y-6 p-4">
          {/* Version A */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayA}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-[#7C5DFA] to-[#9C88FF] flex items-center justify-center text-white hover:shadow-lg transition-all"
              >
                {isPlayingA ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-white font-medium">{versionA.label}</p>
                <p className="text-xs text-gray-400">
                  {versionA.metadata.duration.toFixed(1)}s
                </p>
              </div>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>

            {/* Progress Bar A */}
            <div className="space-y-1">
              <div className="h-2 bg-[#0F0F0F] rounded-full overflow-hidden border border-[#2A2A2A]">
                <div
                  className="h-full bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] transition-all"
                  style={{
                    width: `${getProgressPercent(
                      currentTimeA,
                      versionA.metadata.duration
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTimeA)}</span>
                <span>{formatTime(versionA.metadata.duration)}</span>
              </div>
            </div>

            <audio ref={audioRefA} src={urlA} className="hidden" />
          </div>

          {/* VS Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#2A2A2A]" />
            <span className="text-xs font-bold uppercase text-gray-500">
              VS
            </span>
            <div className="flex-1 h-px bg-[#2A2A2A]" />
          </div>

          {/* Version B */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={handlePlayB}
                className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white hover:shadow-lg transition-all"
              >
                {isPlayingB ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1">
                <p className="text-white font-medium">{versionB.label}</p>
                <p className="text-xs text-gray-400">
                  {versionB.metadata.duration.toFixed(1)}s
                </p>
              </div>
              <Volume2 className="w-4 h-4 text-gray-400" />
            </div>

            {/* Progress Bar B */}
            <div className="space-y-1">
              <div className="h-2 bg-[#0F0F0F] rounded-full overflow-hidden border border-[#2A2A2A]">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
                  style={{
                    width: `${getProgressPercent(
                      currentTimeB,
                      versionB.metadata.duration
                    )}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400">
                <span>{formatTime(currentTimeB)}</span>
                <span>{formatTime(versionB.metadata.duration)}</span>
              </div>
            </div>

            <audio ref={audioRefB} src={urlB} className="hidden" />
          </div>
        </div>

        {/* Metadata Comparison */}
        <div className="border-t border-[#2A2A2A] p-4 bg-[#0F0F0F]">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400 text-xs mb-1">Version A Info</p>
              <div className="space-y-1 text-gray-300">
                <p>Source: {versionA.source}</p>
                {versionA.metadata.language && (
                  <p>Language: {versionA.metadata.language}</p>
                )}
                {versionA.metadata.voiceName && (
                  <p>Voice: {versionA.metadata.voiceName}</p>
                )}
                <p>Size: {(versionA.metadata.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
            <div>
              <p className="text-gray-400 text-xs mb-1">Version B Info</p>
              <div className="space-y-1 text-gray-300">
                <p>Source: {versionB.source}</p>
                {versionB.metadata.language && (
                  <p>Language: {versionB.metadata.language}</p>
                )}
                {versionB.metadata.voiceName && (
                  <p>Voice: {versionB.metadata.voiceName}</p>
                )}
                <p>Size: {(versionB.metadata.size / 1024).toFixed(0)} KB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
