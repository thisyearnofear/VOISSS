"use client";

import React from "react";
import Link from "next/link";
import { Pause, Play } from "lucide-react";
import type { MarketplaceVoice } from "@/lib/marketplace-indexer";
import { workspaceHref } from "@/lib/listening-room";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";

export function voiceDisplayName(voice: MarketplaceVoice): string {
  return voice.metadata?.title || voice.id;
}

export function voiceMetaLine(voice: MarketplaceVoice): string {
  const parts = [
    voice.voiceProfile?.accent,
    voice.voiceProfile?.language,
    voice.voiceProfile?.tone,
  ].filter(Boolean);
  return parts.join(" · ");
}

export function VoiceAuditionRow({
  voice,
  onUse,
  onPlayed,
  actions,
  showUse = true,
}: {
  voice: MarketplaceVoice;
  onUse?: (voice: MarketplaceVoice) => void;
  onPlayed?: (voice: MarketplaceVoice) => void;
  actions?: React.ReactNode;
  showUse?: boolean;
}) {
  const { player, updateDraft, draft } = useListeningRoom();
  const snapshot = useListeningPlayback();
  const isCurrent = snapshot.track?.id === `sample:${voice.id}`;
  const playing = isCurrent && snapshot.status === "playing";
  const loading = isCurrent && snapshot.status === "loading";
  const hasSample = Boolean(voice.sampleUrl);
  const name = voiceDisplayName(voice);

  const handlePlay = () => {
    if (!voice.sampleUrl) return;
    void player
      .toggle({
        id: `sample:${voice.id}`,
        url: voice.sampleUrl,
        title: name,
        subtitle: voiceMetaLine(voice) || undefined,
        kind: "sample",
      })
      .then((started) => {
        if (started && !isCurrent) onPlayed?.(voice);
      });
  };

  const handleUse = () => {
    updateDraft({ voiceId: voice.id });
    onUse?.(voice);
  };

  const playLabel = !hasSample
    ? `${name} — sample unavailable`
    : loading
      ? `Cancel loading ${name}`
      : playing
        ? `Pause ${name}`
        : `Play ${name}`;

  return (
    <div className="lr-vrow">
      <button
        type="button"
        className="lr-play"
        onClick={handlePlay}
        disabled={!hasSample}
        aria-label={playLabel}
        title={hasSample ? undefined : "Sample unavailable"}
      >
        {playing || loading ? (
          <Pause className="w-4 h-4" aria-hidden />
        ) : (
          <Play className="w-4 h-4" aria-hidden />
        )}
      </button>
      <div className="lr-vrow-main">
        <div className="lr-vrow-title">{name}</div>
        <div className="lr-vrow-meta">
          {hasSample ? voiceMetaLine(voice) || "Catalog voice" : "Sample unavailable"}
        </div>
      </div>
      <div className="lr-vrow-actions">
        {actions}
        {showUse && (
          <Link
            className="lr-use"
            href={workspaceHref(voice.id, draft.brief)}
            onClick={handleUse}
          >
            Use voice
          </Link>
        )}
      </div>
    </div>
  );
}
