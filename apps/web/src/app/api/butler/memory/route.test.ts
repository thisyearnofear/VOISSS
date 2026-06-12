/**
 * /api/butler/memory — happy-path + validation tests.
 *
 * The route wraps the shared butler-memory-service. We mock that
 * service so the tests don't hit Arkiv. The mocks let each test
 * set its own return value for the four POST actions and the GET.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetUserPreferences = vi.fn();
const mockSaveUserPreferences = vi.fn();
const mockGetVoiceRecommendations = vi.fn();
const mockGetProactiveSuggestions = vi.fn();
const mockTrackVoiceUsage = vi.fn();

vi.mock('@voisss/shared/server', () => ({
  getUserPreferences: mockGetUserPreferences,
  saveUserPreferences: mockSaveUserPreferences,
  getVoiceRecommendations: mockGetVoiceRecommendations,
  getProactiveSuggestions: mockGetProactiveSuggestions,
  trackVoiceUsage: mockTrackVoiceUsage,
}));

const { GET, POST } = await import('@/app/api/butler/memory/route');
import { NextRequest } from 'next/server';

function jsonRequest(body: unknown, url = 'http://localhost/api/butler/memory'): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/butler/memory', () => {
  beforeEach(() => {
    mockGetUserPreferences.mockReset();
  });

  it('returns 400 when neither userId nor walletAddress is provided', async () => {
    const req = new NextRequest('http://localhost/api/butler/memory', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/userId.*walletAddress/);
  });

  it('returns the preferences when userId matches', async () => {
    const prefs = {
      userId: 'u1',
      walletAddress: '0xabc',
      favoriteVoices: ['v1'],
      preferredStyles: ['professional'],
      defaultLanguage: 'en',
      usageCount: 3,
      totalRecordings: 2,
      lastInteraction: 1700000000000,
      context: {},
    };
    mockGetUserPreferences.mockResolvedValue(prefs);
    const req = new NextRequest('http://localhost/api/butler/memory?userId=u1', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual(prefs);
  });

  it('returns null when no preferences exist for the user', async () => {
    mockGetUserPreferences.mockResolvedValue(null);
    const req = new NextRequest('http://localhost/api/butler/memory?userId=u-new', { method: 'GET' });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toBeNull();
  });
});

describe('POST /api/butler/memory', () => {
  beforeEach(() => {
    mockSaveUserPreferences.mockReset();
    mockGetUserPreferences.mockReset();
    mockGetVoiceRecommendations.mockReset();
    mockGetProactiveSuggestions.mockReset();
    mockTrackVoiceUsage.mockReset();
  });

  it('returns 400 when body has no action', async () => {
    const res = await POST(jsonRequest({ foo: 'bar' }));
    expect(res.status).toBe(400);
  });

  it('save-preferences forwards to saveUserPreferences and returns entityId', async () => {
    mockSaveUserPreferences.mockResolvedValue({ success: true, entityId: 'ent_123' });
    const res = await POST(
      jsonRequest({
        action: 'save-preferences',
        preferences: {
          userId: 'u1',
          walletAddress: '0xabc',
          favoriteVoices: [],
          preferredStyles: [],
          defaultLanguage: 'en',
          usageCount: 0,
          totalRecordings: 0,
          lastInteraction: 0,
          context: {},
        },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.entityId).toBe('ent_123');
    expect(mockSaveUserPreferences).toHaveBeenCalledOnce();
  });

  it('save-preferences returns 500 if the service reports failure', async () => {
    mockSaveUserPreferences.mockResolvedValue({ success: false, error: 'arkiv-down' });
    const res = await POST(
      jsonRequest({
        action: 'save-preferences',
        preferences: {
          userId: 'u1',
          walletAddress: '0xabc',
          favoriteVoices: [],
          preferredStyles: [],
          defaultLanguage: 'en',
          usageCount: 0,
          totalRecordings: 0,
          lastInteraction: 0,
          context: {},
        },
      })
    );
    expect(res.status).toBe(500);
  });

  it('get-recommendations returns the recommendations when prefs exist', async () => {
    mockGetUserPreferences.mockResolvedValue({
      userId: 'u1',
      walletAddress: '0xabc',
      favoriteVoices: ['v1'],
      preferredStyles: ['professional'],
      defaultLanguage: 'en',
      usageCount: 5,
      totalRecordings: 3,
      lastInteraction: 0,
      context: { useCase: 'podcast' },
    });
    mockGetVoiceRecommendations.mockResolvedValue([
      { voiceId: 'v1', voiceName: 'Rachel', score: 100, reason: 'favorite', useCase: 'podcast' },
    ]);
    const res = await POST(
      jsonRequest({
        action: 'get-recommendations',
        userId: 'u1',
        availableVoices: [{ id: 'v1', name: 'Rachel', tags: ['professional', 'podcast'] }],
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].voiceId).toBe('v1');
  });

  it('get-recommendations returns [] when the user has no prefs', async () => {
    mockGetUserPreferences.mockResolvedValue(null);
    const res = await POST(jsonRequest({ action: 'get-recommendations', userId: 'u-new' }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual([]);
  });

  it('get-suggestions forwards the recentActivity hint', async () => {
    mockGetUserPreferences.mockResolvedValue({
      userId: 'u1',
      walletAddress: '0xabc',
      favoriteVoices: [],
      preferredStyles: [],
      defaultLanguage: 'en',
      usageCount: 1,
      totalRecordings: 0,
      lastInteraction: 0,
      context: {},
    });
    mockGetProactiveSuggestions.mockReturnValue(['Welcome back!']);
    const res = await POST(
      jsonRequest({
        action: 'get-suggestions',
        userId: 'u1',
        recentActivity: { timeSinceLastInteraction: 30 * 60 * 60 * 1000 },
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toEqual(['Welcome back!']);
    expect(mockGetProactiveSuggestions).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u1' }),
      expect.objectContaining({ timeSinceLastInteraction: 30 * 60 * 60 * 1000 })
    );
  });

  it('track-usage forwards all four required fields', async () => {
    mockTrackVoiceUsage.mockResolvedValue(undefined);
    const res = await POST(
      jsonRequest({
        action: 'track-usage',
        userId: 'u1',
        walletAddress: '0xabc',
        voiceId: 'v1',
        recordingId: 'rec_1',
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.tracked).toBe(true);
    expect(mockTrackVoiceUsage).toHaveBeenCalledWith('u1', '0xabc', 'v1', 'rec_1');
  });

  it('track-usage returns 400 when fields are missing', async () => {
    const res = await POST(jsonRequest({ action: 'track-usage', userId: 'u1' }));
    expect(res.status).toBe(400);
  });
});
