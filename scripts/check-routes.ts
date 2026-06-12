#!/usr/bin/env tsx
/**
 * scripts/check-routes.ts
 *
 * Validates that the route registry in `packages/shared/src/api/routes.ts`
 * matches the actual Next.js app router layout on disk.
 *
 *   1. Every `live` route in the registry must have a `route.ts` file under
 *      `apps/web/src/app/api/...`.
 *   2. Every `route.ts` file under `apps/web/src/app/api/` that exports an
 *      HTTP method (GET, POST, etc.) must be represented in the registry.
 *   3. Every `planned` route in the registry must NOT have a file (else
 *      flip its status to `live`).
 *   4. Every `deprecated` route is informational and ignored.
 *
 * Exits with a non-zero code if any check fails. Wire into CI as a required
 * check on every PR.
 *
 * Run with: `pnpm run check:routes`
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';

import type { HttpMethod, RouteDefinition } from '../packages/shared/src/api/routes';

const REPO_ROOT = resolve(__dirname, '..');
// Anchor at .../apps/web/src/app so the resulting paths include the /api/ prefix.
const APP_ROOT = join(REPO_ROOT, 'apps/web/src/app');
const API_ROOT = join(APP_ROOT, 'api');

const VALID_METHODS: readonly HttpMethod[] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
  'HEAD',
];

/** A route entry as discovered on disk. */
interface DiscoveredRoute {
  method: HttpMethod;
  /** Path in Next.js form, e.g. `/api/agents/themes/[themeId]` */
  nextPath: string;
  /** Absolute path to the route.ts file */
  file: string;
}

// ---------------------------------------------------------------------------
// Load registry directly from the source TypeScript file. The script is run
// under tsx, so TS imports work natively. Importing from source is simpler
// and safer than reaching into a code-split dist/ output.
// ---------------------------------------------------------------------------

async function loadRegistry(): Promise<RouteDefinition[]> {
  const sourcePath = join(REPO_ROOT, 'packages/shared/src/api/routes.ts');
  // Use a cache-busting query so tsx doesn't return a stale module on rerun.
  const mod = (await import(`${sourcePath}?t=${Date.now()}`)) as {
    ROUTES: readonly RouteDefinition[];
  };
  return [...mod.ROUTES];
}

// ---------------------------------------------------------------------------
// Discover routes on disk
// ---------------------------------------------------------------------------

async function* walk(dir: string): AsyncGenerator<string> {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Only descend into the api/ subtree.
      if (!full.startsWith(API_ROOT + sep) && full !== API_ROOT) continue;
      yield* walk(full);
    } else if (entry.isFile() && entry.name === 'route.ts') {
      yield full;
    }
  }
}

/**
 * Convert an absolute path to a route.ts file to the Next.js API path.
 * Example: /…/apps/web/src/app/api/agents/themes/[themeId]/route.ts
 *   → /api/agents/themes/[themeId]
 */
function fileToNextPath(file: string): string {
  // We anchor at APP_ROOT so the relative path starts with 'api/...'.
  const rel = relative(APP_ROOT, file).split(sep).join('/');
  return '/' + rel.replace(/\/route\.ts$/, '');
}

/**
 * Extract exported HTTP methods from a route.ts file.
 * Supports both `export async function GET(...)` and `export const POST = ...`.
 */
function extractMethods(file: string): HttpMethod[] {
  const src = readFileSync(file, 'utf-8');
  const methods = new Set<HttpMethod>();
  for (const m of VALID_METHODS) {
    const fnRe = new RegExp(`^export (async )?function ${m}\\b`, 'm');
    const constRe = new RegExp(`^export const ${m}\\s*[:=]`, 'm');
    if (fnRe.test(src) || constRe.test(src)) {
      methods.add(m);
    }
  }
  return [...methods];
}

async function discoverRoutes(): Promise<DiscoveredRoute[]> {
  const out: DiscoveredRoute[] = [];
  for await (const file of walk(API_ROOT)) {
    for (const method of extractMethods(file)) {
      out.push({ method, nextPath: fileToNextPath(file), file });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

interface Issue {
  severity: 'error' | 'warning';
  message: string;
}

function check(
  registry: RouteDefinition[],
  discovered: DiscoveredRoute[]
): Issue[] {
  const issues: Issue[] = [];

  // Index registry by method + path for fast lookup
  const registryByKey = new Map<string, RouteDefinition>();
  for (const r of registry) {
    registryByKey.set(`${r.method} ${r.path}`, r);
  }

  // Index discovered by method + path
  const discoveredByKey = new Map<string, DiscoveredRoute>();
  for (const d of discovered) {
    discoveredByKey.set(`${d.method} ${d.nextPath}`, d);
  }

  // (1) Live route in registry without a file → error
  for (const r of registry) {
    if (r.status !== 'live') continue;
    const key = `${r.method} ${r.path}`;
    if (!discoveredByKey.has(key)) {
      issues.push({
        severity: 'error',
        message: `Registry says live but file missing: ${key}\n   → Create the file, or set status to 'planned' / 'deprecated' in the registry.`,
      });
    }
  }

  // (2) Discovered route not in registry → error
  for (const d of discovered) {
    const key = `${d.method} ${d.nextPath}`;
    if (!registryByKey.has(key)) {
      const rel = relative(REPO_ROOT, d.file);
      issues.push({
        severity: 'error',
        message: `Unregistered route: ${key}\n   File: ${rel}\n   → Add it to packages/shared/src/api/routes.ts.`,
      });
    }
  }

  // (3) Planned route with a file → warning (probably should be 'live')
  for (const r of registry) {
    if (r.status !== 'planned') continue;
    const key = `${r.method} ${r.path}`;
    if (discoveredByKey.has(key)) {
      issues.push({
        severity: 'warning',
        message: `Registry says planned but file exists: ${key}\n   → Set status to 'live'.`,
      });
    }
  }

  // (4) Deprecated route with a file → informational only
  for (const r of registry) {
    if (r.status !== 'deprecated') continue;
    const key = `${r.method} ${r.path}`;
    if (discoveredByKey.has(key)) {
      issues.push({
        severity: 'warning',
        message: `Deprecated route still has a file: ${key}\n   → If the file is dead, delete it. If kept for backward compat, ignore.`,
      });
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  if (!existsSync(API_ROOT)) {
    console.error(`❌ check-routes: cannot find API root at ${API_ROOT}`);
    process.exit(2);
  }

  console.log('🔍 check-routes: validating route registry against filesystem…\n');

  const registry = await loadRegistry();
  const discovered = await discoverRoutes();

  console.log(
    `   Registry: ${registry.length} entries (${registry.filter((r) => r.status === 'live').length} live, ${registry.filter((r) => r.status === 'planned').length} planned)`
  );
  console.log(`   Filesystem: ${discovered.length} route handlers\n`);

  const issues = check(registry, discovered);

  if (issues.length === 0) {
    console.log('✅ check-routes: registry and filesystem are in sync.\n');
    process.exit(0);
  }

  const errors = issues.filter((i) => i.severity === 'error');
  const warnings = issues.filter((i) => i.severity === 'warning');

  for (const i of issues) {
    const icon = i.severity === 'error' ? '❌' : '⚠️ ';
    console.log(`${icon} ${i.message}\n`);
  }

  console.log(
    `   ${errors.length} error${errors.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`
  );

  if (errors.length > 0) {
    console.log('\n❌ check-routes failed.\n');
    process.exit(1);
  }

  console.log('\n⚠️  check-routes passed with warnings.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ check-routes: unexpected error:', err);
  process.exit(2);
});
