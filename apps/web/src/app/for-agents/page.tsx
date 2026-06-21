"use client";

import { useState } from "react";
import { Copy, Check, Terminal, Code2, Bot, ExternalLink } from "lucide-react";

const snippets = [
  {
    id: "langchain",
    name: "LangChain",
    icon: "🦜",
    language: "typescript",
    code: `import { ChatOpenAI } from "@langchain/openai";

const voice = new ChatOpenAI({
  apiKey: "YOUR_VOISSS_API_KEY",
  configuration: {
    baseURL: "https://voisss.netlify.app/api/agents",
  },
});

// Generate speech from text
const response = await fetch(
  "https://voisss.netlify.app/api/agents/vocalize",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Hello, I'm an AI agent using a licensed human voice.",
      voiceId: "21m00Tcm4TlvDq8ikWAM",
      agentAddress: "0xYOUR_WALLET",
    }),
  }
);`,
  },
  {
    id: "vercel",
    name: "Vercel AI SDK",
    icon: "▲",
    language: "typescript",
    code: `import { generateText } from "ai";

// VOISSS works with any fetch-compatible AI SDK
const response = await fetch(
  "https://voisss.netlify.app/api/agents/vocalize",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Your AI agent can speak with licensed human voices.",
      voiceId: "professional_male_01",
      agentAddress: "0xYOUR_WALLET",
      preview: true, // Free preview, no payment needed
    }),
  }
);

const { audioUrl } = (await response.json()).data;`,
  },
  {
    id: "eliza",
    name: "Eliza / Virtuals",
    icon: "🤖",
    language: "typescript",
    code: `// Eliza plugin for VOISSS voice generation
const voisssPlugin = {
  name: "voisss",
  actions: [
    {
      name: "GENERATE_SPEECH",
      handler: async (runtime, message, state) => {
        const response = await fetch(
          "https://voisss.netlify.app/api/agents/vocalize",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: message.content.text,
              voiceId: "21m00Tcm4TlvDq8ikWAM",
              agentAddress: runtime.agentId,
            }),
          }
        );
        return response.json();
      },
    },
  ],
};`,
  },
  {
    id: "curl",
    name: "cURL",
    icon: "⎈",
    language: "bash",
    code: `curl -X POST https://voisss.netlify.app/api/agents/vocalize \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "AI agents deserve authentic human voices.",
    "voiceId": "21m00Tcm4TlvDq8ikWAM",
    "agentAddress": "0xYOUR_WALLET",
    "preview": true
  }'`,
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="absolute top-3 right-3 p-2 rounded-lg bg-[#2A2A2A] hover:bg-[#3A3A3A] transition-colors"
    >
      {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
    </button>
  );
}

export default function ForAgentsPage() {
  const [activeTab, setActiveTab] = useState(snippets[0].id);

  const active = snippets.find((s) => s.id === activeTab)!;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <div className="voisss-container py-16 sm:py-24">
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
            <Terminal className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">Developer Quickstart</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">
            Integrate VOISSS in{" "}
            <span className="voisss-gradient-text">5 Lines</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Pick your framework, copy the code, and your AI agent is speaking with a licensed human voice.
          </p>
        </div>

        {/* Tab Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-wrap gap-2 p-1 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
            {snippets.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveTab(s.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === s.id
                    ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                <span>{s.icon}</span>
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Code Block */}
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-[#111] border border-[#2A2A2A] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-[#1A1A1A] border-b border-[#2A2A2A]">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span className="ml-3 text-xs text-gray-500 font-mono">{active.name}</span>
            </div>
            <CopyButton text={active.code} />
            <pre className="p-6 overflow-x-auto">
              <code className="text-sm font-mono text-gray-300 leading-relaxed whitespace-pre">
                {active.code}
              </code>
            </pre>
          </div>
        </div>

        {/* Integration Features */}
        <div className="max-w-4xl mx-auto mt-20 grid sm:grid-cols-3 gap-6">
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <Code2 className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Framework Agnostic</h3>
            <p className="text-sm text-gray-400">
              Works with any HTTP client. LangChain, Vercel AI SDK, Eliza, or raw fetch.
            </p>
          </div>
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <Bot className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Autonomous Commerce</h3>
            <p className="text-sm text-gray-400">
              VOISSS auto-bids on ACP voice jobs. Your agent finds work, we handle delivery.
            </p>
          </div>
          <div className="p-6 bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl">
            <ExternalLink className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">OpenAPI Spec</h3>
            <p className="text-sm text-gray-400">
              <a href="/api/agents/openapi.json" className="text-blue-400 hover:underline">
                Download OpenAPI spec
              </a>{" "}
              for type-safe client generation.
            </p>
          </div>
        </div>

        {/* Pricing */}
        <div className="max-w-2xl mx-auto mt-20 text-center">
          <div className="p-8 bg-gradient-to-br from-blue-500/5 to-purple-500/5 border border-[#2A2A2A] rounded-2xl">
            <h2 className="text-2xl font-bold mb-4">Pay-Per-Character Pricing</h2>
            <p className="text-5xl font-bold voisss-gradient-text mb-4">$0.000001</p>
            <p className="text-gray-400 mb-6">per character — no monthly fees, no minimum commitment</p>
            <a
              href="/marketplace"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all"
            >
              Browse Voices <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
