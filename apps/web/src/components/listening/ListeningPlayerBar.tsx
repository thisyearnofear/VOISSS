"use client";

import React, { useEffect, useRef } from "react";
import { Pause, Play, X } from "lucide-react";
import { formatAudioTime } from "@/lib/listening-room";
import {
  useListeningPlayback,
  useListeningRoom,
} from "@/contexts/ListeningRoomContext";

export function ListeningPlayerBar() {
  const { player } = useListeningRoom();
  const snapshot = useListeningPlayback();
  const barRef = useRef<HTMLDivElement>(null);

  const track = snapshot.track;

  useEffect(() => {
    const el = barRef.current;
    const shell = el?.closest(".lr-shell") as HTMLElement | null;
    if (!el || !shell) return;
    shell.style.setProperty(
      "--lr-player-height",
      window.innerWidth < 640 ? "14rem" : "5rem"
    );
    const observer = new ResizeObserver(() => {
      shell.style.setProperty("--lr-player-height", `${el.offsetHeight}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      shell.style.removeProperty("--lr-player-height");
    };
  }, [track]);

  if (!track) return null;

  const playing = snapshot.status === "playing";
  const loading = snapshot.status === "loading";

  return (
    <div className="lr-playerbar" role="region" aria-label="Audio player" ref={barRef}>
      <button
        type="button"
        className="lr-play"
        onClick={() => void player.toggle(track)}
        aria-label={
          loading
            ? `Cancel loading ${track.title}`
            : playing
              ? `Pause ${track.title}`
              : `Play ${track.title}`
        }
      >
        {playing || loading ? (
          <Pause className="w-4 h-4" aria-hidden />
        ) : (
          <Play className="w-4 h-4" aria-hidden />
        )}
      </button>
      <div className="lr-playerbar-info">
        <div className="lr-playerbar-title">{track.title}</div>
        <div className="lr-playerbar-kind">
          {track.kind === "sample" ? "Catalog sample" : "Your preview"}
          {track.subtitle ? ` · ${track.subtitle}` : ""}
        </div>
      </div>
      <div className="lr-playerbar-seek">
        <span>{formatAudioTime(snapshot.currentTime)}</span>
        <input
          type="range"
          min={0}
          max={snapshot.duration || 0}
          step={0.1}
          value={Math.min(snapshot.currentTime, snapshot.duration || 0)}
          onChange={(e) => player.seek(Number(e.target.value))}
          aria-label="Seek"
          disabled={!snapshot.duration}
        />
        <span>{formatAudioTime(snapshot.duration)}</span>
      </div>
      {(snapshot.error || loading) && (
        <span
          role="status"
          className={`lr-playerbar-status${snapshot.error ? " lr-error-text" : ""}`}
        >
          {snapshot.error ?? "Loading…"}
        </span>
      )}
      <button
        type="button"
        className="lr-playerbar-close"
        onClick={() => player.stop()}
        aria-label="Dismiss player"
      >
        <X className="w-4 h-4" aria-hidden />
      </button>
    </div>
  );
}
