/**
 * useVersionLedger Hook
 * Single source of truth for audio version management
 * Replaces: scattered audioBlob, variantBlobFree, dubbedBlob, activeForgeBlob
 */

import { useState, useCallback, useEffect, useRef } from "react";
import {
  AudioVersion,
  AudioVersionSource,
  VersionLedgerState,
} from "../types/audio-version";

export function useVersionLedger(
  initialBlob: Blob | null,
  initialDuration: number,
  initialState?: VersionLedgerState | null,
  onStateChange?: (state: VersionLedgerState) => void
) {
  const [state, setState] = useState<VersionLedgerState>(() => {
    if (initialState) {
      return initialState;
    }
    if (!initialBlob) {
      return { versions: [], activeVersionId: "" };
    }

    // Initialize with original recording
    const originalVersion: AudioVersion = {
      id: "v0",
      label: "Original",
      source: "original",
      blob: initialBlob,
      metadata: {
        duration: initialDuration,
        size: initialBlob.size,
        createdAt: new Date().toISOString(),
        transformChain: [],
      },
    };

    return {
      versions: [originalVersion],
      activeVersionId: "v0",
    };
  });

  const justRestored = useRef(!!initialState);

  // Hydrate state if provided (e.g. from async storage)
  useEffect(() => {
    if (initialState) {
      setState(initialState);
      justRestored.current = true;
    }
  }, [initialState]);

  // Sync with initialBlob changes (e.g. after a new recording is finished)
  useEffect(() => {
    if (justRestored.current) {
      justRestored.current = false;
      // If we just restored from state and initialBlob is null, don't clear state
      if (!initialBlob) return;
    }

    if (!initialBlob) {
      setState({ versions: [], activeVersionId: "" });
      return;
    }

    setState((prev) => {
      // If v0 already exists and blob is the same, do nothing
      const existingV0 = prev.versions.find((v) => v.id === "v0");
      if (existingV0 && existingV0.blob === initialBlob) {
        return prev;
      }

      const originalVersion: AudioVersion = {
        id: "v0",
        label: "Original",
        source: "original",
        blob: initialBlob,
        metadata: {
          duration: initialDuration,
          size: initialBlob.size,
          createdAt: new Date().toISOString(),
          transformChain: [],
        },
      };

      // If we are replacing v0, we should probably clear other versions too
      // since they are derived from the old v0
      return {
        versions: [originalVersion],
        activeVersionId: "v0",
      };
    });
  }, [initialBlob, initialDuration]);

  // Notify parent of state changes
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  /**
   * Add a new derived version (AI Voice, Dub, or Chain)
   */
  const addVersion = useCallback(
    (
      blob: Blob,
      source: AudioVersionSource,
      parentVersionId: string,
      metadata: Partial<AudioVersion["metadata"]>
    ): AudioVersion => {
      const parentVersion = state.versions.find(
        (v) => v.id === parentVersionId
      );
      if (!parentVersion) {
        throw new Error(`Parent version ${parentVersionId} not found`);
      }

      // Generate label based on source type and parent
      const label = generateLabel(source, parentVersion.label, metadata);

      // Build transformation chain
      const transformChain = [
        ...parentVersion.metadata.transformChain,
        formatChainEntry(source, metadata),
      ];

      const newVersion: AudioVersion = {
        id: generateVersionId(),
        label,
        source,
        parentVersionId,
        blob,
        metadata: {
          duration: metadata.duration ?? 0,
          size: blob.size,
          createdAt: new Date().toISOString(),
          transformChain,
          voiceId: metadata.voiceId,
          voiceName: metadata.voiceName,
          language: metadata.language,
        },
      };

      setState((prev) => ({
        versions: [...prev.versions, newVersion],
        activeVersionId: newVersion.id,
      }));

      return newVersion;
    },
    [state.versions]
  );

  /**
   * Get a version by ID
   */
  const getVersion = useCallback(
    (versionId: string): AudioVersion | undefined => {
      return state.versions.find((v) => v.id === versionId);
    },
    [state.versions]
  );

  /**
   * Set active version for Forge
   */
  const setActiveVersion = useCallback(
    (versionId: string) => {
      const version = state.versions.find((v) => v.id === versionId);
      if (!version) {
        throw new Error(`Version ${versionId} not found`);
      }
      setState((prev) => ({ ...prev, activeVersionId: versionId }));
    },
    [state.versions]
  );

  /**
   * Delete a version and its descendants
   */
  const deleteVersion = useCallback((versionId: string) => {
    if (versionId === "v0") {
      throw new Error("Cannot delete original version");
    }

    setState((prev) => {
      const toDelete = new Set<string>();
      const findDescendants = (id: string) => {
        toDelete.add(id);
        prev.versions
          .filter((v) => v.parentVersionId === id)
          .forEach((v) => findDescendants(v.id));
      };

      findDescendants(versionId);

      const remaining = prev.versions.filter((v) => !toDelete.has(v.id));
      const newActiveId = toDelete.has(prev.activeVersionId)
        ? remaining[0]?.id ?? "v0"
        : prev.activeVersionId;

      return {
        versions: remaining,
        activeVersionId: newActiveId,
      };
    });
  }, []);

  /**
   * Get versions that can be transformed (not chains, usually)
   */
  const getTransformableVersions = useCallback((): AudioVersion[] => {
    return state.versions.filter((v) => v.source !== "chain");
  }, [state.versions]);

  /**
   * Get all descendants of a version
   */
  const getDescendants = useCallback(
    (versionId: string): AudioVersion[] => {
      const descendants: AudioVersion[] = [];
      const findChildren = (id: string) => {
        const children = state.versions.filter((v) => v.parentVersionId === id);
        descendants.push(...children);
        children.forEach((c) => findChildren(c.id));
      };
      findChildren(versionId);
      return descendants;
    },
    [state.versions]
  );

  return {
    // State
    versions: state.versions,
    activeVersion: state.versions.find((v) => v.id === state.activeVersionId),
    activeVersionId: state.activeVersionId,

    // Actions
    addVersion,
    getVersion,
    setActiveVersion,
    deleteVersion,
    getTransformableVersions,
    getDescendants,
  };
}

// Utility functions
function generateVersionId(): string {
  return `v${Math.random().toString(36).substring(7)}`;
}

function generateLabel(
  source: AudioVersionSource,
  parentLabel: string,
  metadata: Partial<AudioVersion["metadata"]>
): string {
  if (source === "original") {
    return "Original";
  }

  if (source.startsWith("dub-")) {
    const lang = source.substring(4);
    return metadata.language
      ? `${parentLabel} (${metadata.language})`
      : `${parentLabel} (Dubbed)`;
  }

  if (source.startsWith("aiVoice-")) {
    const voiceName = metadata.voiceName ?? "AI Voice";
    return `${parentLabel} (${voiceName})`;
  }

  return parentLabel;
}

function formatChainEntry(
  source: AudioVersionSource,
  metadata: Partial<AudioVersion["metadata"]>
): string {
  if (source.startsWith("dub-")) {
    return `dub:${source.substring(4)}`;
  }
  if (source.startsWith("aiVoice-")) {
    return `voice:${metadata.voiceId ?? source.substring(8)}`;
  }
  return source;
}
