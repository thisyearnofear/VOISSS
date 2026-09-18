import { describe, it, expect, beforeEach, vi } from 'vitest';

// Stub the db-service module BEFORE requiring export-service, so the
// destructured `query` in export-service points at our mock. This is more
// reliable than vi.mock for CommonJS interop in vitest.
const queryMock = vi.fn();
const dbServicePath = require.resolve('../src/services/db-service');

// Replace the real module exports with our mock before any require().
const stub = {
  query: queryMock,
  getPool: () => ({ connect: () => ({ query: queryMock, release: () => {} }) }),
  runMigrations: vi.fn(),
  closePool: vi.fn(),
};
require.cache[dbServicePath] = { id: dbServicePath, filename: dbServicePath, loaded: true, exports: stub };

const {
  getNextPendingJob,
  failOrRetryJob,
  recoverStaleJobs,
  MAX_ATTEMPTS,
} = require('../src/services/export-service');

describe('job queue — getNextPendingJob claim', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('returns null when no pending job', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const job = await getNextPendingJob();
    expect(job).toBeNull();
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(queryMock.mock.calls[0][0]).toContain("status = 'retry'");
    expect(queryMock.mock.calls[1][0]).toContain('FOR UPDATE SKIP LOCKED');
  });

  it('returns a mapped job when a row is claimed', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'export_123',
          kind: 'mp3',
          audio_url: 'https://api.elevenlabs.io/a.mp3',
          transcript_id: 't1',
          template_id: null,
          manifest: '{}',
          style: '{}',
          template_data: '{}',
          user_id: 'u1',
          attempts: 1,
        }],
      });

    const job = await getNextPendingJob();
    expect(job).not.toBeNull();
    expect(job.jobId).toBe('export_123');
    expect(job.kind).toBe('mp3');
    expect(job.attempts).toBe(1);
    expect(job.manifest).toEqual({});
    expect(queryMock.mock.calls[1][0]).toContain('attempts = attempts + 1');
  });
});

describe('job queue — failOrRetryJob', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('schedules a retry with exponential backoff when attempts < MAX_ATTEMPTS', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const outcome = await failOrRetryJob('export_123', 'boom', 1);
    expect(outcome).toBe('retry');
    expect(queryMock.mock.calls[0][0]).toContain("status = 'retry'");
    expect(queryMock.mock.calls[0][0]).toContain('next_retry_at');
    expect(queryMock.mock.calls[0][1][0]).toBe('15000');
  });

  it('doubles the backoff on each attempt (2^attempts-1)', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    await failOrRetryJob('export_123', 'boom', 1);
    // backoff = 15000 * 2^0 = 15000ms
    expect(queryMock.mock.calls[0][1][0]).toBe('15000');

    queryMock.mockClear();
    await failOrRetryJob('export_123', 'boom', 2);
    // backoff = 15000 * 2^1 = 30000ms (still < MAX_ATTEMPTS=3, so retry)
    expect(queryMock.mock.calls[0][1][0]).toBe('30000');
    expect(queryMock.mock.calls[0][0]).toContain("status = 'retry'");
  });

  it('permanently fails when attempts >= MAX_ATTEMPTS', async () => {
    queryMock.mockResolvedValue({ rows: [] });
    const outcome = await failOrRetryJob('export_123', 'boom', MAX_ATTEMPTS);
    expect(outcome).toBe('failed');
    expect(queryMock.mock.calls[0][0]).toContain("status = 'failed'");
    expect(queryMock.mock.calls[0][0]).not.toContain('next_retry_at');
  });
});

describe('job queue — recoverStaleJobs', () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it('requeues abandoned processing jobs with remaining attempts', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ id: 'job1' }, { id: 'job2' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await recoverStaleJobs(15);
    expect(result.requeued).toBe(2);
    expect(result.failed).toBe(0);
    expect(queryMock.mock.calls[0][0]).toContain("status = 'retry'");
    expect(queryMock.mock.calls[0][0]).toContain('attempts < $3');
  });

  it('permanently fails abandoned jobs out of attempts', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'job3' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await recoverStaleJobs(15);
    expect(result.requeued).toBe(0);
    expect(result.failed).toBe(1);
    expect(queryMock.mock.calls[1][0]).toContain("status = 'failed'");
    expect(queryMock.mock.calls[1][0]).toContain('attempts >= $2');
  });

  it('sweeps scheduled retries that hit the attempt limit', async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 'job4' }] });

    await recoverStaleJobs(15);
    expect(queryMock.mock.calls[2][0]).toContain("status = 'retry'");
    expect(queryMock.mock.calls[2][0]).toContain("status = 'failed'");
  });
});
