import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Each test mutates process.env; snapshot/restore around it so the
// module-level config (read at require time in some paths) stays predictable.
const baseEnv = { ...process.env };

function freshSsrf() {
  vi.resetModules();
  return require('../src/lib/ssrf');
}

describe('SSRF guard — assertSafeDownloadUrl', () => {
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('accepts an allowlisted public https URL', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    const url = assertSafeDownloadUrl('https://api.elevenlabs.io/v1/audio.mp3');
    expect(url.hostname).toBe('api.elevenlabs.io');
  });

  it('accepts a wildcard-suffix host (*.ipfs.dweb.link)', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    const url = assertSafeDownloadUrl('https://bafybeipfs.ipfs.dweb.link/audio.mp3');
    expect(url.hostname).toBe('bafybeipfs.ipfs.dweb.link');
  });

  it('rejects non-http protocols (file://, ftp://)', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('file:///etc/passwd')).toThrow(/protocol/);
    expect(() => assertSafeDownloadUrl('ftp://example.com/a')).toThrow(/protocol/);
  });

  it('rejects localhost and loopback', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('http://localhost:5577/health')).toThrow(/private-network/);
    expect(() => assertSafeDownloadUrl('http://127.0.0.1/health')).toThrow(/private-network/);
  });

  it('rejects RFC1918 private ranges', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    for (const ip of ['10.0.0.1', '172.16.5.4', '192.168.1.1', '169.254.169.254']) {
      expect(() => assertSafeDownloadUrl(`http://${ip}/latest/meta-data`)).toThrow(/private-network/);
    }
  });

  it('rejects IPv6 loopback/link-local', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('http://[::1]/health')).toThrow(/private-network/);
    expect(() => assertSafeDownloadUrl('http://[fe80::1]/health')).toThrow(/private-network/);
  });

  it('rejects hosts not on the allowlist even if public', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('https://evil.example.com/audio.mp3')).toThrow(/allowlist/);
  });

  it('extends the allowlist via EXPORT_ALLOWED_HOSTS', () => {
    process.env.EXPORT_ALLOWED_HOSTS = 'cdn.mycloud.com,*.mycloud.com';
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('https://cdn.mycloud.com/a.mp3')).not.toThrow();
    expect(() => assertSafeDownloadUrl('https://assets.mycloud.com/a.mp3')).not.toThrow();
  });

  it('rejects malformed URLs', () => {
    const { assertSafeDownloadUrl } = freshSsrf();
    expect(() => assertSafeDownloadUrl('not-a-url')).toThrow(/parseable URL/);
    expect(() => assertSafeDownloadUrl('')).toThrow(/parseable URL/);
  });
});

describe('SSRF guard — assertSafeFileUrl', () => {
  const TEMP_DIR = '/tmp/voisss-exports-test';

  beforeEach(() => {
    process.env.EXPORT_TEMP_DIR = TEMP_DIR;
  });
  afterEach(() => {
    process.env = { ...baseEnv };
  });

  it('accepts file:// paths inside the temp dir', () => {
    const { assertSafeFileUrl } = freshSsrf();
    const resolved = assertSafeFileUrl(`file://${TEMP_DIR}/job_input.webm`);
    expect(resolved).toBe(TEMP_DIR + '/job_input.webm');
  });

  it('rejects file:// paths escaping the temp dir (path traversal)', () => {
    const { assertSafeFileUrl } = freshSsrf();
    expect(() => assertSafeFileUrl('file:///etc/passwd')).toThrow(/outside export temp/);
    expect(() => assertSafeFileUrl(`file://${TEMP_DIR}/../../etc/passwd`)).toThrow(/outside export temp/);
  });
});
