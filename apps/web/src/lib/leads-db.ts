import type { Pool } from "pg";

/**
 * Lead-capture persistence for /api/newsletter + /api/contact.
 *
 * On Cloudflare Workers the `DB` D1 binding is used (see cloudflare.config.ts).
 * Outside Workers (plain `next dev` / self-host), falls back to Postgres via
 * `pg` + DATABASE_URL. Returns null when neither is available — callers must
 * treat that as non-durable.
 */

interface D1Statement {
  bind(...values: unknown[]): { run(): Promise<unknown> };
}
interface D1Like {
  prepare(sql: string): D1Statement;
}

let d1: D1Like | null | undefined;
export async function getLeadsD1(): Promise<D1Like | null> {
  if (d1 !== undefined) return d1;
  try {
    // Resolved by @cloudflare/vite-plugin / workerd at runtime. Dynamic so
    // non-Workers builds (next build) don't fail on the specifier.
    const mod = (await import(
      /* webpackIgnore: true */ "cloudflare:workers"
    )) as {
      env?: Record<string, unknown>;
    };
    d1 = (mod.env?.DB as D1Like | undefined) ?? null;
  } catch {
    d1 = null;
  }
  return d1;
}

let pool: Pool | null | undefined;
export async function getLeadsPool(): Promise<Pool | null> {
  if (pool !== undefined) return pool;
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return (pool = null);
  try {
    const { Pool } = await import("pg");
    pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
    pool.on("error", (err) => console.error("[leads-db] pool error:", err));
  } catch {
    pool = null;
  }
  return pool;
}
