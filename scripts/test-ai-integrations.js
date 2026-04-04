#!/usr/bin/env node

/**
 * AI Integrations Test Script
 * Tests Gemini, Venice, Kilocode, and ElevenLabs API connectivity
 */

require("dotenv").config();

const results = [];

function log(icon, msg) {
  console.log(`${icon} ${msg}`);
}

function record(provider, test, success, detail) {
  results.push({ provider, test, success, detail });
  log(success ? "✅" : "❌", `[${provider}] ${test}: ${detail}`);
}

// ── Gemini ──────────────────────────────────────────────────────────────────
async function testGemini() {
  console.log("\n" + "═".repeat(60));
  console.log("🔮 GEMINI (Google Generative AI)");
  console.log("═".repeat(60));

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    record("Gemini", "API Key", false, "GEMINI_API_KEY not set");
    return;
  }
  record("Gemini", "API Key", true, `Loaded (length: ${apiKey.length})`);

  // Test: List models
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    if (!res.ok) {
      const err = await res.text();
      record("Gemini", "List Models", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
      return;
    }
    const data = await res.json();
    const models = data.models || [];
    record("Gemini", "List Models", true, `${models.length} models available`);
    // Show a few relevant ones
    const geminiModels = models
      .filter((m) => m.name.includes("gemini"))
      .slice(0, 5);
    geminiModels.forEach((m) => log("   ", `${m.name} - ${m.displayName}`));
  } catch (e) {
    record("Gemini", "List Models", false, e.message);
    return;
  }

  // Test: Simple generation
  try {
    const model = process.env.GEMINI_TEXT_MODEL || "gemini-2.0-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in exactly 5 words." }] }],
        }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      record("Gemini", "Generate Content", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
      return;
    }
    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "(empty response)";
    record("Gemini", "Generate Content", true, `Response: "${text.trim().slice(0, 100)}"`);
  } catch (e) {
    record("Gemini", "Generate Content", false, e.message);
  }
}

// ── Venice ──────────────────────────────────────────────────────────────────
async function testVenice() {
  console.log("\n" + "═".repeat(60));
  console.log("🏛️  VENICE AI");
  console.log("═".repeat(60));

  const apiKey = process.env.VENICE_API_KEY;
  if (!apiKey) {
    record("Venice", "API Key", false, "VENICE_API_KEY not set");
    return;
  }
  record("Venice", "API Key", true, `Loaded (length: ${apiKey.length})`);

  const baseUrl = process.env.VENICE_API_URL || "https://api.venice.ai/api/v1";
  const model = process.env.VENICE_MODEL || "llama-3.3-70b";

  // Test: List models
  try {
    const res = await fetch(`${baseUrl}/models`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      const err = await res.text();
      record("Venice", "List Models", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
    } else {
      const data = await res.json();
      const models = data?.data || data?.models || [];
      record("Venice", "List Models", true, `${Array.isArray(models) ? models.length : "?"} models`);
    }
  } catch (e) {
    record("Venice", "List Models", false, e.message);
  }

  // Test: Chat completion
  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a test assistant." },
          { role: "user", content: "Say hello in exactly 5 words." },
        ],
        temperature: 0.3,
        max_tokens: 50,
        venice_parameters: { include_venice_system_prompt: false },
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      record("Venice", "Chat Completion", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
      return;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "(empty)";
    record("Venice", "Chat Completion", true, `Model: ${model} → "${text.trim().slice(0, 100)}"`);
  } catch (e) {
    record("Venice", "Chat Completion", false, e.message);
  }
}

// ── Kilocode ────────────────────────────────────────────────────────────────
async function testKilocode() {
  console.log("\n" + "═".repeat(60));
  console.log("🤖 KILOCODE (Kilo.ai)");
  console.log("═".repeat(60));

  const apiKey = process.env.KILOCODE_API_KEY;
  if (!apiKey) {
    record("Kilocode", "API Key", false, "KILOCODE_API_KEY not set");
    return;
  }
  record("Kilocode", "API Key", true, `Loaded (length: ${apiKey.length})`);

  const baseUrl = process.env.KILOCODE_API_URL || "https://api.kilo.ai/api/openrouter/";
  const model = process.env.KILOCODE_MODEL || "kilo-auto/balanced";

  // Test: Chat completion
  try {
    const res = await fetch(`${baseUrl}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://voisss.com",
        "X-Title": "VOISSS",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "You are a test assistant." },
          { role: "user", content: "Say hello in exactly 5 words." },
        ],
        temperature: 0.5,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      record("Kilocode", "Chat Completion", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
      return;
    }
    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || "(empty)";
    record("Kilocode", "Chat Completion", true, `Model: ${model} → "${text.trim().slice(0, 100)}"`);
  } catch (e) {
    record("Kilocode", "Chat Completion", false, e.message);
  }
}

// ── ElevenLabs ──────────────────────────────────────────────────────────────
async function testElevenLabs() {
  console.log("\n" + "═".repeat(60));
  console.log("🎙️  ELEVENLABS");
  console.log("═".repeat(60));

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    record("ElevenLabs", "API Key", false, "ELEVENLABS_API_KEY not set");
    return;
  }
  record("ElevenLabs", "API Key", true, `Loaded (length: ${apiKey.length})`);

  const base = "https://api.elevenlabs.io/v1";

  // Test: Get models
  try {
    const res = await fetch(`${base}/models`, {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      record("ElevenLabs", "List Models", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
    } else {
      const models = await res.json();
      record("ElevenLabs", "List Models", true, `${models.length} models available`);
      models.slice(0, 3).forEach((m) => log("   ", `${m.name} (${m.model_id})`));
    }
  } catch (e) {
    record("ElevenLabs", "List Models", false, e.message);
  }

  // Test: Get voices
  try {
    const res = await fetch(`${base}/voices`, {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      record("ElevenLabs", "List Voices", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
    } else {
      const data = await res.json();
      const voices = data.voices || [];
      record("ElevenLabs", "List Voices", true, `${voices.length} voices available`);
      voices.slice(0, 3).forEach((v) => log("   ", `${v.name} (${v.voice_id})`));
    }
  } catch (e) {
    record("ElevenLabs", "List Voices", false, e.message);
  }

  // Test: User/subscription info
  try {
    const res = await fetch(`${base}/user`, {
      headers: { "xi-api-key": apiKey },
    });
    if (!res.ok) {
      const err = await res.text();
      record("ElevenLabs", "User Info", false, `HTTP ${res.status}: ${err.slice(0, 200)}`);
    } else {
      const user = await res.json();
      record(
        "ElevenLabs",
        "User Info",
        true,
        `Tier: ${user.subscription?.tier || "?"}, Characters left: ${user.subscription?.character_count ?? "?"}`
      );
    }
  } catch (e) {
    record("ElevenLabs", "User Info", false, e.message);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log("\n🧪 VOISSS AI Integration Tests");
  console.log("=".repeat(60));

  await testGemini();
  await testVenice();
  await testKilocode();
  await testElevenLabs();

  // Summary
  console.log("\n" + "═".repeat(60));
  console.log("📊 SUMMARY");
  console.log("═".repeat(60));

  const grouped = {};
  for (const r of results) {
    if (!grouped[r.provider]) grouped[r.provider] = [];
    grouped[r.provider].push(r);
  }

  let allPass = true;
  for (const [provider, tests] of Object.entries(grouped)) {
    const passed = tests.filter((t) => t.success).length;
    const total = tests.length;
    const status = passed === total ? "✅" : "⚠️";
    if (passed !== total) allPass = false;
    console.log(`${status} ${provider}: ${passed}/${total} tests passed`);
  }

  console.log("\n" + (allPass ? "✅ All integrations working!" : "⚠️  Some integrations need attention."));
  console.log("");

  process.exit(allPass ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
