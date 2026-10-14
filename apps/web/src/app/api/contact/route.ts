import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

interface ContactFormData {
  email: string;
  subject: string;
  message: string;
}

// Reuse one pool across invocations (same pattern as
// /api/tools/platform-stats). Per-request Client + CREATE TABLE on every
// hit exhausts connections and adds ~100ms+ to each submit.
let pool: Pool | null = null;
function getPool(): Pool | null {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!pool) {
    pool = new Pool({ connectionString: dbUrl, max: 5, idleTimeoutMillis: 30_000 });
    pool.on('error', (err) => console.error('[contact] pool error:', err));
  }
  return pool;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL = 254;
const MAX_SUBJECT = 200;
const MAX_MESSAGE = 5000;

// Minimal in-memory rate limit: 10 submits / 10 min per IP. Best-effort on
// serverless (resets on cold start) — upgrade to Redis/Upstash for strict.
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

/** Escape HTML so ticket content can be rendered in the support email safely. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

export async function POST(request: NextRequest) {
  try {
    let parsed: ContactFormData;
    try {
      parsed = (await request.json()) as ContactFormData;
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    const email = parsed.email?.trim().toLowerCase().slice(0, MAX_EMAIL) ?? '';
    const subject = parsed.subject?.trim().slice(0, MAX_SUBJECT) ?? '';
    const message = parsed.message?.trim().slice(0, MAX_MESSAGE) ?? '';
    
    // Validate required fields
    if (!email || !subject || !message) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }
    
    // Validate email format
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (ip !== 'unknown' && rateLimited(ip)) {
      return NextResponse.json({ error: 'Too many requests — try again later' }, { status: 429 });
    }
    
    // Create support ticket data
    const supportTicket = {
      email,
      subject,
      message,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip,
      status: 'open',
      priority: 'normal',
    };
    
    const ticketId = generateTicketId();

    // NOTE: table is created by migration `scripts/migrations/002_contact_newsletter.sql`
    // — no DDL here so the hot path is a single INSERT.
    const db = getPool();
    if (db) {
      try {
        await db.query(
          `INSERT INTO voisss_contact_tickets (ticket_id, email, subject, message)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (ticket_id) DO NOTHING`,
          [ticketId, email, subject, message]
        );
      } catch (dbErr) {
        console.error("[contact] persist failed (lead still acknowledged):", dbErr);
      }
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('Support Ticket Created:', { ...supportTicket, message: message.slice(0, 200) });
    }

    // Fire-and-forget: email delivery must never fail the ticket itself.
    void sendSupportNotification({ ...supportTicket, ticketId }).catch((err) =>
      console.error('[contact] support notification failed:', err)
    );
    void sendAutoReply(email, subject).catch((err) =>
      console.error('[contact] auto-reply failed:', err)
    );
    
    return NextResponse.json(
      { 
        message: 'Support request submitted successfully',
        ticketId
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to submit support request' },
      { status: 500 }
    );
  }
}

// Helper function to generate ticket ID
function generateTicketId(): string {
  const rand = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
    : Math.random().toString(36).slice(2, 8).toUpperCase();
  return `VOISSS-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// Helper function to send support notification (example)
async function sendSupportNotification(ticket: any) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUPPORT_EMAIL;
  if (!apiKey || !to) { console.warn("[contact] RESEND_API_KEY/SUPPORT_EMAIL unset — notification skipped"); return; }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM ?? "VOISSS <hello@voisss.netlify.app>",
        to: [to],
        subject: `New Support Request: ${ticket.subject.slice(0, 120)}`,
        html: `
          <h2>New Support Request</h2>
          <p><strong>From:</strong> ${esc(ticket.email)}</p>
          <p><strong>Subject:</strong> ${esc(ticket.subject)}</p>
          <p><strong>Message:</strong></p>
          <p>${esc(ticket.message)}</p>
          <p><strong>Timestamp:</strong> ${esc(ticket.timestamp)}</p>
        `,
      }),
    });
    if (!res.ok) console.error("[contact] support notification rejected:", res.status);
  } catch (err) {
    console.error("[contact] support notification failed:", err);
  }
}

// Helper function to send auto-reply (example)
async function sendAutoReply(email: string, subject: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.NEWSLETTER_FROM ?? "VOISSS <hello@voisss.netlify.app>",
        to: [email],
        subject: `Re: ${subject} - We've received your message`,
        html: `
          <h2>Thank you for contacting VOISSS Support</h2>
          <p>We've received your message and will get back to you within 24 hours.</p>
          <p>In the meantime, you can:</p>
          <ul>
            <li>Check our <a href="${process.env.NEXT_PUBLIC_BASE_URL}/help">Help Center</a></li>
            <li>Join our <a href="https://discord.gg/voisss">Discord community</a></li>
            <li>Follow us on <a href="https://twitter.com/voisss_app">Twitter</a></li>
          </ul>
          <p>Best regards,<br>The VOISSS Team</p>
        `,
      }),
    });
  } catch (err) {
    console.error("[contact] auto-reply failed:", err);
  }
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
