import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

/**
 * POST /api/newsletter
 *
 * Minimal GTM lead capture: validates + stores the email, optionally
 * forwards to Resend (RESEND_API_KEY) for double-opt-in/confirmation.
 * No provider configured → still persists to the newsletter table so
 * no launch lead is ever dropped silently.
 */

interface NewsletterBody {
  email?: string;
  source?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Module-scope pool (same pattern as /api/tools/platform-stats). Table DDL lives
// in migration `scripts/migrations/002_contact_newsletter.sql` — hot path is INSERT only.
let pool: Pool | null = null;
function getPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!pool) {
    pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
    pool.on("error", (err) => console.error("[newsletter] pool error:", err));
  }
  return pool;
}

// Minimal in-memory rate limit: 10 subscribes / 10 min per IP (best-effort).
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_MAX = 10;
const rateHits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  rateHits.set(ip, hits);
  return hits.length > RATE_MAX;
}

function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

async function persistSubscriber(email: string, source: string): Promise<{ stored: string }> {
  const db = getPool();
  if (!db) return { stored: "memory" };
  try {
    await db.query(
      `INSERT INTO voisss_newsletter (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET source = EXCLUDED.source`,
      [email, source]
    );
    return { stored: "postgres" };
  } catch (err) {
    console.error("[newsletter] persist failed:", err);
    return { stored: "memory" };
  }
}

async function sendConfirmation(email: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.NEWSLETTER_FROM ?? "VOISSS <hello@voisss.netlify.app>";
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "You're on the VOISSS list 🎤",
        html: `<h2>You're on the list</h2>
<p>Thanks for subscribing to VOISSS — new voices, API features, and creator rewards, no spam.</p>
<p>Try the demo: <a href="https://voisss.netlify.app/generate">voisss.netlify.app/generate</a></p>`,
      }),
    });
    return res.ok;
  } catch (err) {
    console.error("[newsletter] confirmation send failed:", err);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NewsletterBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const source = (body.source ?? "homepage").slice(0, 80);

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }

    const ip = clientIp(request);
    if (ip !== "unknown" && rateLimited(ip)) {
      return NextResponse.json({ error: "Too many requests — try again later" }, { status: 429 });
    }

    const { stored } = await persistSubscriber(email, source);
    const emailed = await sendConfirmation(email);

    return NextResponse.json({ success: true, stored, emailed });
  } catch (error) {
    console.error("[newsletter] error:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

export const runtime = "nodejs";
