"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import type { ListeningTrack } from "@/lib/listening-player";
import {
  MAX_PREVIEW_GENERATIONS,
  PREVIEW_STORAGE_KEY,
  parsePreviewAllowance,
  previewRequestBody,
  readPreviewResponse,
  type PreviewVoiceRef,
} from "@/lib/listening-preview";

export interface UseVoicePreviewOptions {
  archetype?: string;
  onStart?: () => void;
  onVocalized?: () => void;
  onError?: (message: string) => void;
}

/**
 * Shared free-preview lifecycle: the browser-wide 3-generation allowance,
 * the /api/agents/vocalize request with race + abort guards, blob cleanup,
 * and the result as a shared-player track. Adopted by the voice listening
 * room, the developers quickstart, and /generate. Optional onStart /
 * onVocalized / onError callbacks let surfaces fire mascot events and match
 * telemetry without owning the request. cancel() aborts in-flight work and
 * clears the result (used on voice/param switches).
 */
export function useVoicePreview(
  voice: PreviewVoiceRef | null,
  title: string,
  options?: UseVoicePreviewOptions
) {
  const { player } = useListeningRoom();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioIsBlob, setAudioIsBlob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationsLeft, setGenerationsLeft] = useState(MAX_PREVIEW_GENERATIONS);
  const [allowanceReady, setAllowanceReady] = useState(false);
  const [generating, setGenerating] = useState(false);
  const generationToken = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const onVocalizedRef = useRef(options?.onVocalized);
  onVocalizedRef.current = options?.onVocalized;
  const onStartRef = useRef(options?.onStart);
  onStartRef.current = options?.onStart;
  const onErrorRef = useRef(options?.onError);
  onErrorRef.current = options?.onError;
  const archetypeRef = useRef(options?.archetype);
  archetypeRef.current = options?.archetype;

  const releaseResultUrl = useCallback(() => {
    if (resultUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(resultUrlRef.current);
    }
    resultUrlRef.current = null;
  }, []);

  const clearResult = useCallback(() => {
    const snap = player.getSnapshot();
    if (
      snap.track?.kind === "generation" &&
      resultUrlRef.current &&
      snap.track.url === resultUrlRef.current
    ) {
      player.stop();
    }
    releaseResultUrl();
    setAudioUrl(null);
    setAudioIsBlob(false);
    setError(null);
  }, [player, releaseResultUrl]);

  // Free preview allowance — one browser-wide budget shared by every surface.
  useEffect(() => {
    try {
      setGenerationsLeft(
        parsePreviewAllowance(localStorage.getItem(PREVIEW_STORAGE_KEY))
      );
    } catch {
      // localStorage unavailable — use default
    }
    setAllowanceReady(true);
  }, []);

  useEffect(() => {
    if (!allowanceReady) return;
    try {
      localStorage.setItem(PREVIEW_STORAGE_KEY, String(generationsLeft));
    } catch {
      // silent
    }
  }, [generationsLeft, allowanceReady]);

  // Unmount: cancel in-flight generation, stop our result audio, free blobs.
  useEffect(() => {
    return () => {
      generationToken.current += 1;
      abortRef.current?.abort();
      const snap = player.getSnapshot();
      if (
        snap.track?.kind === "generation" &&
        resultUrlRef.current &&
        snap.track.url === resultUrlRef.current
      ) {
        player.stop();
      }
      releaseResultUrl();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancel = useCallback(() => {
    generationToken.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setGenerating(false);
    clearResult();
  }, [clearResult]);

  const generate = useCallback(
    async (text: string) => {
      if (
        !voice ||
        !allowanceReady ||
        generating ||
        generationsLeft <= 0 ||
        !text.trim()
      ) {
        return;
      }

      const myToken = ++generationToken.current;
      const controller = new AbortController();
      abortRef.current = controller;
      setGenerating(true);
      setError(null);
      clearResult();
      player.stop();
      onStartRef.current?.();

      try {
        const response = await fetch("/api/agents/vocalize", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Demo-Mode": "true",
          },
          body: JSON.stringify(
            previewRequestBody(text, voice, archetypeRef.current)
          ),
          signal: controller.signal,
        });

        // Preview responses stream audio/mpeg directly; errors stay JSON.
        const result = await readPreviewResponse(response, controller.signal);
        if (generationToken.current !== myToken) {
          if (result.isBlob) URL.revokeObjectURL(result.url);
          return;
        }
        resultUrlRef.current = result.url;
        setAudioUrl(result.url);
        setAudioIsBlob(result.isBlob);
        setGenerationsLeft((prev) => Math.max(0, prev - 1));
        onVocalizedRef.current?.();
      } catch (err) {
        if (generationToken.current !== myToken) return;
        if (err instanceof Error && err.name === "AbortError") return;
        const message = err instanceof Error ? err.message : "Generation failed";
        setError(message);
        onErrorRef.current?.(message);
      } finally {
        if (generationToken.current === myToken) {
          setGenerating(false);
        }
      }
    },
    [voice, allowanceReady, generating, generationsLeft, clearResult, player]
  );

  const resultTrack: ListeningTrack | null =
    audioUrl && voice
      ? {
          id: `generation:${voice.id}:${audioUrl.slice(-24)}`,
          url: audioUrl,
          title,
          subtitle: "Your words",
          kind: "generation",
        }
      : null;

  return {
    generate,
    cancel,
    clearResult,
    generating,
    error,
    audioUrl,
    audioIsBlob,
    generationsLeft,
    allowanceReady,
    resultTrack,
  };
}
