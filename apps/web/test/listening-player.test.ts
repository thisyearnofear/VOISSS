import { describe, expect, it, vi } from 'vitest';
import {
  createListeningPlayer,
  type ListeningTrack,
} from '@/lib/listening-player';

class FakeAudio {
  src: string;
  currentTime = 0;
  duration = 0;
  paused = true;
  onloadedmetadata: (() => void) | null = null;
  ontimeupdate: (() => void) | null = null;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  playImpl: () => Promise<void> = () => Promise.resolve();
  pausedFlag = vi.fn();

  constructor(src: string) {
    this.src = src;
  }

  play(): Promise<void> {
    return this.playImpl().then(() => {
      this.paused = false;
    });
  }

  pause() {
    this.paused = true;
    this.pausedFlag();
  }

  removeAttribute(name: string) {
    if (name === 'src') this.src = '';
  }

  load() {}
}

const track = (id: string, url?: string): ListeningTrack => ({
  id,
  url: url ?? `https://example.com/${id}.mp3`,
  title: `Track ${id}`,
  kind: 'sample',
});

function setup() {
  const created: FakeAudio[] = [];
  const player = createListeningPlayer((url: string) => {
    const a = new FakeAudio(url);
    created.push(a);
    return a as unknown as HTMLAudioElement;
  });
  return { player, created };
}

function gatedSetup() {
  const created: FakeAudio[] = [];
  const controls: { resolve: () => void; reject: (e: Error) => void }[] = [];
  const player = createListeningPlayer((url: string) => {
    const a = new FakeAudio(url);
    a.playImpl = () =>
      new Promise<void>((resolve, reject) =>
        controls.push({ resolve: () => resolve(), reject })
      );
    created.push(a);
    return a as unknown as HTMLAudioElement;
  });
  return { player, created, controls };
}

describe('createListeningPlayer', () => {
  it('creates no audio before the first toggle', () => {
    const { player, created } = setup();
    expect(created).toHaveLength(0);
    expect(player.getSnapshot().status).toBe('idle');
    expect(player.getServerSnapshot().status).toBe('idle');
  });

  it('plays a track and reports playing status', async () => {
    const { player, created } = setup();
    const ok = await player.toggle(track('a'));
    expect(ok).toBe(true);
    expect(created).toHaveLength(1);
    expect(player.getSnapshot().status).toBe('playing');
    expect(player.getSnapshot().track?.id).toBe('a');
  });

  it('pauses and resumes the same track; pause returns false', async () => {
    const { player } = setup();
    await player.toggle(track('a'));
    const paused = await player.toggle(track('a'));
    expect(paused).toBe(false);
    expect(player.getSnapshot().status).toBe('paused');
    const resumed = await player.toggle(track('a'));
    expect(resumed).toBe(true);
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('same id with a different url is a new track (new audio object)', async () => {
    const { player, created } = setup();
    await player.toggle(track('a', 'https://example.com/one.mp3'));
    await player.toggle(track('a', 'https://example.com/two.mp3'));
    expect(created).toHaveLength(2);
    expect(created[0].src).toBe('');
    expect(player.getSnapshot().status).toBe('playing');
    expect(player.getSnapshot().track?.url).toBe('https://example.com/two.mp3');
  });

  it('stops the previous audio when switching tracks', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    await player.toggle(track('b'));
    expect(created).toHaveLength(2);
    expect(created[0].src).toBe('');
    expect(created[0].pausedFlag).toHaveBeenCalled();
    expect(created[0].onended).toBeNull();
    expect(player.getSnapshot().track?.id).toBe('b');
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('loading cancel: second toggle before play resolves cancels playback', async () => {
    const { player, created, controls } = gatedSetup();
    const first = player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('loading');
    const cancelled = await player.toggle(track('a'));
    expect(cancelled).toBe(false);
    expect(player.getSnapshot().status).toBe('idle');
    controls[0].resolve();
    expect(await first).toBe(false);
    expect(player.getSnapshot().status).toBe('idle');
    expect(created[0].src).toBe('');
  });

  it('reports error state when play rejects', async () => {
    const created: FakeAudio[] = [];
    const player = createListeningPlayer((url: string) => {
      const a = new FakeAudio(url);
      a.playImpl = () => Promise.reject(new Error('denied'));
      created.push(a);
      return a as unknown as HTMLAudioElement;
    });
    const ok = await player.toggle(track('a'));
    expect(ok).toBe(false);
    expect(player.getSnapshot().status).toBe('error');
    expect(player.getSnapshot().error).toBe('This audio could not be played. Try again.');
  });

  it('a stale resolution after switching cannot change the new track', async () => {
    const { player, created, controls } = gatedSetup();
    const first = player.toggle(track('a'));
    const second = player.toggle(track('b'));
    controls[0].resolve();
    controls[1].resolve();
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(created[0].pausedFlag).toHaveBeenCalled();
    expect(player.getSnapshot().track?.id).toBe('b');
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('a stale rejection after switching cannot change the new track', async () => {
    const { player, controls } = gatedSetup();
    const first = player.toggle(track('a'));
    const second = player.toggle(track('b'));
    controls[1].resolve();
    controls[0].reject(new Error('late failure'));
    expect(await first).toBe(false);
    expect(await second).toBe(true);
    expect(player.getSnapshot().track?.id).toBe('b');
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('deferred resume then switch: stale resume is released, B keeps playing', async () => {
    const { player, created, controls } = gatedSetup();
    const firstA = player.toggle(track('a'));
    controls[0].resolve();
    await firstA;
    await player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('paused');

    const resumeA = player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('loading');

    const playB = player.toggle(track('b'));
    controls[2].resolve();
    controls[1].resolve();
    expect(await resumeA).toBe(false);
    expect(await playB).toBe(true);
    expect(created[0].pausedFlag).toHaveBeenCalled();
    expect(created[0].src).toBe('');
    expect(player.getSnapshot().track?.id).toBe('b');
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('a second click during an in-flight resume cancels it', async () => {
    const { player, controls } = gatedSetup();
    const firstA = player.toggle(track('a'));
    controls[0].resolve();
    await firstA;
    await player.toggle(track('a'));

    const resume = player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('loading');
    const cancelled = await player.toggle(track('a'));
    expect(cancelled).toBe(false);
    expect(player.getSnapshot().status).toBe('idle');
    controls[1].resolve();
    expect(await resume).toBe(false);
    expect(player.getSnapshot().status).toBe('idle');
  });

  it('media ended resets to paused at time 0 so replay works', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    created[0].duration = 120;
    created[0].currentTime = 120;
    created[0].onended?.();
    expect(player.getSnapshot().status).toBe('paused');
    expect(player.getSnapshot().currentTime).toBe(0);
    await player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('media error surfaces an inline error', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    created[0].onerror?.();
    expect(player.getSnapshot().status).toBe('error');
    expect(player.getSnapshot().error).toBe('This audio could not be played. Try again.');
  });

  it('a pending play resolution after a media error cannot overwrite the error', async () => {
    const { player, created, controls } = gatedSetup();
    const pending = player.toggle(track('a'));
    expect(player.getSnapshot().status).toBe('loading');
    created[0].onerror?.();
    expect(player.getSnapshot().status).toBe('error');
    controls[0].resolve();
    expect(await pending).toBe(false);
    expect(player.getSnapshot().status).toBe('error');
    expect(created[0].src).toBe('');
  });

  it('publishes finite times from metadata/timeupdate and clamps seek', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    created[0].duration = 90;
    created[0].onloadedmetadata?.();
    expect(player.getSnapshot().duration).toBe(90);

    created[0].currentTime = 30;
    created[0].ontimeupdate?.();
    expect(player.getSnapshot().currentTime).toBe(30);

    player.seek(200);
    expect(created[0].currentTime).toBe(90);
    player.seek(-5);
    expect(created[0].currentTime).toBe(0);

    created[0].duration = NaN;
    player.seek(10);
    expect(created[0].currentTime).toBe(0);
  });

  it('detached events from a released audio do not publish', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    const old = created[0];
    const staleTimeupdate = old.ontimeupdate;
    const staleEnded = old.onended;
    await player.toggle(track('b'));
    expect(old.ontimeupdate).toBeNull();
    old.currentTime = 42;
    staleTimeupdate?.();
    staleEnded?.();
    expect(player.getSnapshot().track?.id).toBe('b');
    expect(player.getSnapshot().currentTime).toBe(0);
    expect(player.getSnapshot().status).toBe('playing');
  });

  it('stop detaches handlers, releases audio, and resets state', async () => {
    const { player, created } = setup();
    await player.toggle(track('a'));
    player.stop();
    expect(created[0].src).toBe('');
    expect(created[0].onended).toBeNull();
    expect(created[0].ontimeupdate).toBeNull();
    const snap = player.getSnapshot();
    expect(snap.status).toBe('idle');
    expect(snap.track).toBeNull();
  });

  it('notifies subscribers on state changes', async () => {
    const { player } = setup();
    const seen: string[] = [];
    const unsub = player.subscribe(() => seen.push(player.getSnapshot().status));
    await player.toggle(track('a'));
    player.stop();
    unsub();
    player.stop();
    expect(seen).toContain('loading');
    expect(seen).toContain('playing');
    expect(seen.filter((s) => s === 'idle')).toHaveLength(1);
  });
});
