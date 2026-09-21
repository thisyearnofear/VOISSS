"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  EMPTY_DRAFT,
  LISTENING_DRAFT_KEY,
  parseListeningDraft,
  type ListeningDraft,
} from "@/lib/listening-room";
import {
  createListeningPlayer,
  type ListeningPlayer,
  type PlaybackSnapshot,
} from "@/lib/listening-player";

type ListeningRoomValue = {
  draft: ListeningDraft;
  ready: boolean;
  updateDraft: (patch: Partial<ListeningDraft>) => void;
  toggleShortlist: (id: string) => void;
  player: ListeningPlayer;
};

const ListeningRoomContext = createContext<ListeningRoomValue | null>(null);

export function ListeningRoomProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [player] = useState<ListeningPlayer>(() => createListeningPlayer());
  const [draft, setDraft] = useState<ListeningDraft>(EMPTY_DRAFT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const parsed = parseListeningDraft(sessionStorage.getItem(LISTENING_DRAFT_KEY));
      setDraft(parsed);
    } catch {
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      sessionStorage.setItem(LISTENING_DRAFT_KEY, JSON.stringify(draft));
    } catch {
    }
  }, [draft, ready]);

  useEffect(() => {
    return () => player.stop();
  }, [player]);

  const updateDraft = useCallback((patch: Partial<ListeningDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
  }, []);

  const toggleShortlist = useCallback((id: string) => {
    setDraft((d) => {
      if (d.shortlist.includes(id)) {
        return { ...d, shortlist: d.shortlist.filter((x) => x !== id) };
      }
      if (d.shortlist.length >= 3) return d;
      return { ...d, shortlist: [...d.shortlist, id] };
    });
  }, []);

  const value = useMemo<ListeningRoomValue>(
    () => ({ draft, ready, updateDraft, toggleShortlist, player }),
    [draft, ready, updateDraft, toggleShortlist, player]
  );

  return (
    <ListeningRoomContext.Provider value={value}>
      {children}
    </ListeningRoomContext.Provider>
  );
}

export function useListeningRoom(): ListeningRoomValue {
  const ctx = useContext(ListeningRoomContext);
  if (!ctx) {
    throw new Error("useListeningRoom must be used within ListeningRoomProvider");
  }
  return ctx;
}

export function useListeningPlayback(): PlaybackSnapshot {
  const { player } = useListeningRoom();
  return useSyncExternalStore(
    player.subscribe,
    player.getSnapshot,
    player.getServerSnapshot
  );
}
