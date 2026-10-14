-- VOISSS lead-capture tables — SQLite variant for Cloudflare D1.
-- Mirrors 002_contact_newsletter.sql (Postgres). Apply with:
--   npx wrangler d1 execute voisss-leads --remote --file=scripts/migrations/003_leads_d1.sql
CREATE TABLE IF NOT EXISTS voisss_contact_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS voisss_newsletter (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  source TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
