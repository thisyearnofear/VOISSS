/**
 * SSRF guard for server-side downloads.
 *
 * The export worker fetches arbitrary URLs submitted by clients. Without
 * validation that is a read primitive into the private network (PM2 admin
 * ports, cloud metadata, localhost services). This module enforces:
 *   - protocol allowlist (http/https only; file:// only inside temp dir)
 *   - hostname allowlist (public audio hosts, configurable via env)
 *   - final-URL revalidation after redirects
 *   - response size cap
 */

const path = require('path');
const net = require('net');

const TEMP_DIR = process.env.EXPORT_TEMP_DIR || '/tmp/voisss-exports';

const DEFAULT_ALLOWED_HOSTS = [
  'api.elevenlabs.io',
  'storage.googleapis.com',
  'ipfs.io',
];
// Suffixes are stored WITHOUT the leading '*': e.g. '.ipfs.dweb.link' matches
// any host ending in '.ipfs.dweb.link'. Normalized in configuredHosts().
const DEFAULT_ALLOWED_SUFFIXES = [
  '.elevenlabs.io',
  '.storage.googleapis.com',
  '.ipfs.dweb.link',
];

const MAX_DOWNLOAD_BYTES = parseInt(process.env.EXPORT_MAX_DOWNLOAD_BYTES || String(100 * 1024 * 1024), 10);

function configuredHosts() {
  const extra = (process.env.EXPORT_ALLOWED_HOSTS || '')
    .split(',')
    .map(h => h.trim().toLowerCase())
    .filter(Boolean);
  const extraSuffixes = extra
    .filter(h => h.startsWith('*.'))
    .map(h => h.slice(1)); // '*.cloud.com' -> '.cloud.com'
  return {
    hosts: new Set([...DEFAULT_ALLOWED_HOSTS, ...extra.filter(h => !h.startsWith('*'))]),
    suffixes: [...DEFAULT_ALLOWED_SUFFIXES, ...extraSuffixes],
  };
}

function isPrivateAddress(hostname) {
  // Block obvious private/loopback/link-local literals. DNS-rebinding is
  // mitigated primarily by the host allowlist below (literals other than
  // allowed public hosts never pass).
  if (net.isIPv4(hostname)) {
    const [a, b] = hostname.split('.').map(Number);
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
  }
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost') || lower.endsWith('.internal')) return true;
  if (hostname.includes(':')) {
    // IPv6 literal
    const v6 = lower.replace(/^\[|\]$/g, '');
    if (v6 === '::1' || v6 === '::' || v6.startsWith('fe80') || v6.startsWith('fd')) return true;
  }
  return false;
}

function hostAllowed(hostname) {
  const { hosts, suffixes } = configuredHosts();
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (hosts.has(host)) return true;
  return suffixes.some(suffix => host.endsWith(suffix));
}

/**
 * Validate an http(s) URL for safe server-side fetching.
 * Throws Error with a descriptive message when the URL is rejected.
 */
function assertSafeDownloadUrl(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid audio URL: not a parseable URL`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error(`Blocked audio URL protocol: ${url.protocol}`);
  }

  if (isPrivateAddress(url.hostname)) {
    throw new Error(`Blocked private-network host: ${url.hostname}`);
  }

  if (!hostAllowed(url.hostname)) {
    throw new Error(
      `Host not in download allowlist: ${url.hostname}. ` +
      `Allowed hosts can be extended via EXPORT_ALLOWED_HOSTS.`
    );
  }

  return url;
}

/**
 * Validate a file:// URL: only files inside the export temp directory may
 * be read (jobs created from uploads legitimately reference local blobs).
 */
function assertSafeFileUrl(rawUrl) {
  const filePath = rawUrl.startsWith('file://') ? rawUrl.slice(7) : rawUrl;
  const resolved = path.resolve(filePath);
  const tempRoot = path.resolve(process.env.EXPORT_TEMP_DIR || TEMP_DIR);

  if (resolved !== tempRoot && !resolved.startsWith(tempRoot + path.sep)) {
    throw new Error(`Blocked file:// read outside export temp directory: ${resolved}`);
  }
  return resolved;
}

module.exports = {
  assertSafeDownloadUrl,
  assertSafeFileUrl,
  hostAllowed,
  isPrivateAddress,
  MAX_DOWNLOAD_BYTES,
  TEMP_DIR,
};
