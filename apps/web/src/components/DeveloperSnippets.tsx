"use client";

import { useState } from "react";
import { Copy, Check, Terminal, ArrowRight, Code2 } from "lucide-react";

const snippets = [
  {
    id: "langchain",
    name: "LangChain",
    icon: "🦜",
    code: `await fetch("https://voisss.netlify.app/api/agents/vocalize", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Hello from my AI agent",
    voiceId: "21m00Tcm4TlvDq8ikWAM",
    agentAddress: "0xYOUR_WALLET",
    preview: true, // Free
  }),
});`,
  },
  {
    id: "eliza",
    name: "Eliza",
    icon: "🤖",
    code: `// Eliza action
const voisssSpeak = {
  name: "GENERATE_SPEECH",
  handler: async (runtime, message) => {
    return fetch("https://voisss.netlify.app/api/agents/vocalize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: message.content.text,
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        agentAddress: runtime.agentId,
      }),
    }).then(r => r.json());
  },
};`,
  },
  {
    id: "curl",
    name: "cURL",
    icon: "⎈",
    code: `curl -X POST https://voisss.netlify.app/api/agents/vocalize \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Hello from an AI agent",
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

export default function DeveloperSnippets() {
  const [active, setActive] = useState(snippets[0]);
  const [copyText, setCopyText] = useState("");

  return (
    <section className="py-24 max-w-6xl mx-auto px-4">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full mb-6">
          <Terminal className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-300">For Developers</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Integrate in{" "}
          <span className="voisss-gradient-text">5 Lines</span>
        </h2>
        <p className="text-gray-400 max-w-2xl mx-auto">
          One API call. Pick your framework, copy the snippet, and your agent speaks with a licensed human voice.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        {/* Tabs */}
        <div className="flex gap-2 mb-4 p-1 bg-[#1A1A1A] rounded-xl border border-[#2A2A2A]">
          {snippets.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active.id === s.id
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <span>{s.icon}</span>
              {s.name}
            </button>
          ))}
        </div>

        {/* Code */}
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

        <div className="mt-6 text-center">
          <a
            href="/for-agents"
            className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            <Code2 className="w-4 h-4" />
            View full API reference <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}
