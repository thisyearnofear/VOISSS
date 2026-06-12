/**
 * Vitest test setup.
 *
 * Loads .env.test if present, then sets the minimum env vars that
 * route handlers need in order to instantiate. Anything not set is
 * treated as 'test' so the handlers don't try to make real network
 * calls. Each test file can override these with vi.stubEnv() as needed.
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Best-effort load of .env.test. Don't fail if it doesn't exist.
try {
  config({ path: resolve(process.cwd(), '.env.test'), override: false });
} catch {
  // ignore
}

// Minimum env so route handlers don't crash on instantiation.
// `NODE_ENV` is typed as the literal 'production' | 'development' | 'test'
// on `NodeJS.ProcessEnv`; we cast to a writable view to set it.
const env = process.env as Record<string, string | undefined>;
env.NODE_ENV = env.NODE_ENV || 'test';
env.X402_PAY_TO_ADDRESS = env.X402_PAY_TO_ADDRESS || '0x0000000000000000000000000000000000000000';
env.ADMIN_API_KEY = env.ADMIN_API_KEY || 'test-admin-key';
env.ARKIV_PRIVATE_KEY = env.ARKIV_PRIVATE_KEY || '0x' + 'a'.repeat(64);

// Tell ElevenLabs and friends to no-op rather than hit the network.
process.env.ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || 'test-elevenlabs-key';
process.env.ELEVENLABS_AGENT_ID = process.env.ELEVENLABS_AGENT_ID || 'test-agent-id';
