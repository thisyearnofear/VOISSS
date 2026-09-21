import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  parsePreviewAllowance,
  readPreviewResponse,
} from '@/lib/listening-preview';

function makeResponse(init: {
  ok?: boolean;
  status?: number;
  contentType?: string;
  json?: unknown;
  blobSize?: number;
}): Response {
  const headers = new Headers();
  if (init.contentType) headers.set('content-type', init.contentType);
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    headers,
    blob: () =>
      Promise.resolve(
        init.blobSize === undefined
          ? new Blob(['audio-bytes'])
          : new Blob([new Uint8Array(init.blobSize)])
      ),
    json: () =>
      init.json === undefined
        ? Promise.reject(new Error('not json'))
        : Promise.resolve(init.json),
  } as unknown as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('parsePreviewAllowance', () => {
  it('returns 3 for null, empty, garbage, non-integer, and out-of-range values', () => {
    expect(parsePreviewAllowance(null)).toBe(3);
    expect(parsePreviewAllowance('')).toBe(3);
    expect(parsePreviewAllowance('   ')).toBe(3);
    expect(parsePreviewAllowance('abc')).toBe(3);
    expect(parsePreviewAllowance('1.5')).toBe(3);
    expect(parsePreviewAllowance('-1')).toBe(3);
    expect(parsePreviewAllowance('4')).toBe(3);
  });

  it('persists a real 0 and valid counts', () => {
    expect(parsePreviewAllowance('0')).toBe(0);
    expect(parsePreviewAllowance('2')).toBe(2);
    expect(parsePreviewAllowance('3')).toBe(3);
  });
});

describe('readPreviewResponse', () => {
  it('returns a blob object URL for audio responses', async () => {
    const spy = vi
      .spyOn(URL, 'createObjectURL')
      .mockReturnValue('blob:fake-url');
    const res = await readPreviewResponse(
      makeResponse({ contentType: 'audio/mpeg' }),
      new AbortController().signal
    );
    expect(res).toEqual({ url: 'blob:fake-url', isBlob: true });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('rejects audio responses with an error status', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL');
    await expect(
      readPreviewResponse(
        makeResponse({ ok: false, status: 500, contentType: 'audio/mpeg' }),
        new AbortController().signal
      )
    ).rejects.toThrow('Generation failed. Please try again.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects an empty blob without allocating a URL', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL');
    await expect(
      readPreviewResponse(
        makeResponse({ contentType: 'audio/mpeg', blobSize: 0 }),
        new AbortController().signal
      )
    ).rejects.toThrow('Generation returned no audio. Please try again.');
    expect(spy).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON bodies', async () => {
    await expect(
      readPreviewResponse(
        makeResponse({ contentType: 'application/json', json: undefined }),
        new AbortController().signal
      )
    ).rejects.toThrow('Generation failed. Please try again.');
  });

  it('rejects a successful JSON response without a usable URL', async () => {
    await expect(
      readPreviewResponse(
        makeResponse({
          contentType: 'application/json',
          json: { success: true, data: {} },
        }),
        new AbortController().signal
      )
    ).rejects.toThrow('Generation returned no audio. Please try again.');
  });

  it('rejects unsafe URL schemes', async () => {
    await expect(
      readPreviewResponse(
        makeResponse({
          contentType: 'application/json',
          json: { success: true, data: { audioUrl: 'javascript:alert(1)' } },
        }),
        new AbortController().signal
      )
    ).rejects.toThrow('Generation returned no audio. Please try again.');
  });

  it('returns a valid https JSON URL', async () => {
    const res = await readPreviewResponse(
      makeResponse({
        contentType: 'application/json',
        json: { success: true, data: { audioUrl: 'https://cdn.example.com/a.mp3' } },
      }),
      new AbortController().signal
    );
    expect(res).toEqual({ url: 'https://cdn.example.com/a.mp3', isBlob: false });
  });

  it('throws when already aborted and never allocates', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL');
    const controller = new AbortController();
    controller.abort();
    await expect(
      readPreviewResponse(
        makeResponse({ contentType: 'audio/mpeg' }),
        controller.signal
      )
    ).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });

  it('abort during blob read prevents allocation', async () => {
    const spy = vi.spyOn(URL, 'createObjectURL');
    const controller = new AbortController();
    const res = {
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'audio/mpeg' }),
      blob: () => {
        controller.abort();
        return Promise.resolve(new Blob(['x']));
      },
    } as unknown as Response;
    await expect(
      readPreviewResponse(res, controller.signal)
    ).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
