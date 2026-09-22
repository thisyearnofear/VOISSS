import { trackPlaybackEnergy } from "./terrain-bus";

export type ListeningTrack = {
  id: string;
  url: string;
  title: string;
  subtitle?: string;
  kind: "sample" | "generation";
};

export type PlaybackSnapshot = {
  track: ListeningTrack | null;
  status: "idle" | "loading" | "playing" | "paused" | "error";
  currentTime: number;
  duration: number;
  error: string | null;
};

export interface ListeningPlayer {
  getSnapshot(): PlaybackSnapshot;
  getServerSnapshot(): PlaybackSnapshot;
  subscribe(listener: () => void): () => void;
  toggle(track: ListeningTrack): Promise<boolean>;
  seek(seconds: number): void;
  stop(): void;
}

const IDLE_SNAPSHOT: PlaybackSnapshot = {
  track: null,
  status: "idle",
  currentTime: 0,
  duration: 0,
  error: null,
};

const PLAY_ERROR = "This audio could not be played. Try again.";

export function createListeningPlayer(
  createAudio: (url: string) => HTMLAudioElement = (url) => new Audio(url)
): ListeningPlayer {
  let snapshot: PlaybackSnapshot = IDLE_SNAPSHOT;
  let audio: HTMLAudioElement | null = null;
  let token = 0;
  let stopEnergy: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const publish = (next: PlaybackSnapshot) => {
    snapshot = next;
    // The shared player is the one true source of voice energy: any playback
    // — home ribbon, marketplace card, workspace preview — energizes the
    // hero's VoiceTerrain through the bus. Transitions only; the tracker's
    // own interval is released the moment playback isn't playing.
    if (next.status === "playing" && audio && !stopEnergy) {
      stopEnergy = trackPlaybackEnergy(audio);
    } else if (next.status !== "playing" && stopEnergy) {
      stopEnergy();
      stopEnergy = null;
    }
    for (const listener of listeners) listener();
  };

  const releaseAudio = (target: HTMLAudioElement | null) => {
    if (!target) return;
    target.onloadedmetadata = null;
    target.ontimeupdate = null;
    target.onended = null;
    target.onerror = null;
    try {
      target.pause();
    } catch {
    }
    try {
      target.removeAttribute("src");
      target.load();
    } catch {
    }
  };

  const readTimes = (target: HTMLAudioElement) => ({
    currentTime:
      Number.isFinite(target.currentTime) && target.currentTime >= 0
        ? target.currentTime
        : 0,
    duration:
      Number.isFinite(target.duration) && target.duration >= 0
        ? target.duration
        : 0,
  });

  const attach = (
    target: HTMLAudioElement,
    myToken: number,
    track: ListeningTrack
  ) => {
    const alive = () => token === myToken && audio === target;
    target.onloadedmetadata = () => {
      if (!alive()) return;
      const times = readTimes(target);
      publish({ ...snapshot, ...times, error: null });
    };
    target.ontimeupdate = () => {
      if (!alive()) return;
      const times = readTimes(target);
      publish({ ...snapshot, ...times });
    };
    target.onended = () => {
      if (!alive()) return;
      try {
        target.currentTime = 0;
      } catch {
      }
      publish({
        track,
        status: "paused",
        currentTime: 0,
        duration: readTimes(target).duration,
        error: null,
      });
    };
    target.onerror = () => {
      if (!alive()) return;
      token += 1;
      releaseAudio(target);
      audio = null;
      publish({
        track,
        status: "error",
        currentTime: 0,
        duration: 0,
        error: PLAY_ERROR,
      });
    };
  };

  const startTrack = async (track: ListeningTrack): Promise<boolean> => {
    const myToken = ++token;
    releaseAudio(audio);
    audio = null;
    publish({
      track,
      status: "loading",
      currentTime: 0,
      duration: 0,
      error: null,
    });
    let next: HTMLAudioElement;
    try {
      next = createAudio(track.url);
    } catch {
      if (token === myToken) {
        publish({
          track,
          status: "error",
          currentTime: 0,
          duration: 0,
          error: PLAY_ERROR,
        });
      }
      return false;
    }
    audio = next;
    attach(next, myToken, track);
    try {
      await next.play();
    } catch {
      if (token !== myToken) {
        releaseAudio(next);
        return false;
      }
      releaseAudio(next);
      audio = null;
      publish({
        track,
        status: "error",
        currentTime: 0,
        duration: 0,
        error: PLAY_ERROR,
      });
      return false;
    }
    if (token !== myToken || audio !== next) {
      releaseAudio(next);
      return false;
    }
    publish({
      track,
      status: "playing",
      ...readTimes(next),
      error: null,
    });
    return true;
  };

  const isSameTrack = (a: ListeningTrack, b: ListeningTrack) =>
    a.id === b.id && a.url === b.url;

  return {
    getSnapshot: () => snapshot,
    getServerSnapshot: () => IDLE_SNAPSHOT,
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    async toggle(track: ListeningTrack): Promise<boolean> {
      const current = snapshot.track;
      if (current && isSameTrack(current, track) && audio) {
        if (snapshot.status === "playing") {
          try {
            audio.pause();
          } catch {
          }
          publish({ ...snapshot, status: "paused" });
          return false;
        }
        if (snapshot.status === "paused") {
          const target = audio;
          const myToken = ++token;
          attach(target, myToken, track);
          publish({ ...snapshot, status: "loading", error: null });
          try {
            await target.play();
          } catch {
            if (token !== myToken || audio !== target) {
              releaseAudio(target);
              return false;
            }
            releaseAudio(target);
            audio = null;
            publish({
              ...snapshot,
              status: "error",
              error: PLAY_ERROR,
            });
            return false;
          }
          if (token !== myToken || audio !== target) {
            releaseAudio(target);
            return false;
          }
          publish({ ...snapshot, status: "playing", ...readTimes(target) });
          return true;
        }
        if (snapshot.status === "loading") {
          token += 1;
          releaseAudio(audio);
          audio = null;
          publish(IDLE_SNAPSHOT);
          return false;
        }
      }
      return startTrack(track);
    },
    seek(seconds: number) {
      if (!audio || !Number.isFinite(seconds)) return;
      const { duration } = readTimes(audio);
      if (!duration) return;
      const clamped = Math.min(Math.max(seconds, 0), duration);
      try {
        audio.currentTime = clamped;
      } catch {
        return;
      }
      publish({ ...snapshot, currentTime: clamped });
    },
    stop() {
      token += 1;
      releaseAudio(audio);
      audio = null;
      publish(IDLE_SNAPSHOT);
    },
  };
}
