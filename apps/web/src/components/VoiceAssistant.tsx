"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  Loader2,
  MessageCircle,
  Sparkles,
  X,
  ChevronRight,
  Zap,
  AlertCircle,
  ArrowRight,
  Globe,
  ExternalLink,
} from "lucide-react";
import { SearchResult } from "../hooks/useVoiceConversation";
import { useAssistant } from "../contexts/AssistantContext";
import { useVoiceConversation } from "../hooks/useVoiceConversation";

interface VoiceAssistantProps {
  context?: string;
  onInsight?: (insight: string) => void;
  onAction?: (action: string, params?: Record<string, unknown>) => void;
  initialMessage?: string;
  initiallyExpanded?: boolean;
  className?: string;
}

export default function VoiceAssistant({
  context,
  onInsight,
  onAction: externalOnAction,
  className = "",
}: VoiceAssistantProps) {
  const { isExpanded, setIsExpanded, initialMessage, setInitialMessage } =
    useAssistant();
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Default action handler for navigation
  const handleAction = (action: string) => {
    if (externalOnAction) {
      externalOnAction(action);
      return;
    }
    // Default navigation
    switch (action) {
      case "studio":
        window.location.href = "/studio";
        break;
      case "help":
        window.location.href = "/help";
        break;
      case "transcript":
        window.location.href = "/studio?mode=transcript";
        break;
      case "features":
        window.location.href = "/features";
        break;
    }
  };

  const {
    type,
    status,
    transcript,
    messages,
    error,
    connect,
    disconnect,
    sendMessage,
    isSpeaking,
    isSearching: searchingFromHook,
  } = useVoiceConversation({
    context,
    onAction: handleAction,
    onInsight,
  });

  // Handle initial message (Manual mode specific usually)
  const [hasProcessedInitial, setHasProcessedInitial] = useState(false);
  useEffect(() => {
    if (
      initialMessage &&
      !hasProcessedInitial &&
      (status === "connected" || status === "disconnected") &&
      type === "manual"
    ) {
      setHasProcessedInitial(true);
      // Ensure we are connected first if manual
      if (status === "disconnected") {
        connect().then(() => {
          setTimeout(() => sendMessage(initialMessage), 500);
        });
      } else {
        sendMessage(initialMessage);
      }
      setInitialMessage(null);
    }
  }, [
    initialMessage,
    hasProcessedInitial,
    status,
    sendMessage,
    setInitialMessage,
    type,
    connect,
  ]);

  // Auto-scroll
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, transcript]);

  if (!isExpanded) return null;

  const isListening = status === "listening";
  const isProcessing = status === "processing";
  const isSearching = status === "searching";
  const isConnecting = status === "connecting";
  const isConnected =
    status === "connected" ||
    status === "listening" ||
    status === "speaking" ||
    status === "processing" ||
    status === "searching";

  // Unified Toggle Handler
  const handleToggle = () => {
    if (type === "official") {
      if (isConnected) disconnect();
      else connect();
    } else {
      // Manual mode: toggle listening specifically
      if (status === "listening") disconnect();
      else connect();
    }
  };

  const showOrbView = messages.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end pointer-events-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md pointer-events-auto transition-opacity duration-500 ${
          isExpanded ? "opacity-100" : "opacity-0"
        }`}
        onClick={() => setIsExpanded(false)}
      />

      {/* Drawer Content */}
      <div
        className={`relative w-full max-w-lg bg-[#0A0A0A] border-l border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] pointer-events-auto flex flex-col transition-transform duration-500 ease-out transform ${
          isExpanded ? "translate-x-0" : "translate-x-full"
        } ${className}`}
      >
        {/* Visual Accent */}
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-600 via-blue-600 to-purple-600 opacity-50" />

        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-purple-600/10 to-blue-600/10 relative overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 blur-[100px] pointer-events-none" />

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity" />
                <div className="relative w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Sparkles className="w-7 h-7 text-white" />
                </div>
                {(isListening || isProcessing || isSpeaking) && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-[3px] border-[#0A0A0A] rounded-full animate-pulse shadow-lg" />
                )}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white tracking-tight">
                  VOISSS Assistant
                </h3>
                <div className="flex items-center gap-2.5 mt-1">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      isConnected
                        ? isSearching
                          ? "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.5)] animate-pulse"
                          : "bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"
                        : "bg-gray-600"
                    }`}
                  />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-[0.2em]">
                    {status === "listening"
                      ? "Listening..."
                      : status === "processing"
                      ? "Processing..."
                      : status === "searching"
                      ? "Searching web..."
                      : status === "speaking"
                      ? "Speaking"
                      : status === "connecting"
                      ? "Connecting..."
                      : "Ready"}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="p-3 hover:bg-white/5 rounded-2xl transition-all text-gray-400 hover:text-white hover:scale-110 active:scale-95"
              aria-label="Close Assistant"
            >
              <X className="w-7 h-7" />
            </button>
          </div>
        </div>

        {/* Main Content Area: Chat or Orb View */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide custom-scrollbar relative">
          {showOrbView ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6 px-4 animate-in fade-in zoom-in-95 duration-700">
              <div className="relative">
                {/* Dynamic Orb Animation */}
                <div
                  className={`absolute inset-0 blur-2xl rounded-full transition-all duration-500 ${
                    isSearching
                      ? "bg-cyan-500/30 scale-110 animate-pulse-glow"
                      : isSpeaking
                      ? "bg-purple-500/20 scale-150 opacity-100"
                      : "bg-purple-500/20 scale-100 opacity-50"
                  }`}
                />
                {/* Search ring animation */}
                {isSearching && (
                  <div className="absolute inset-0 border-2 border-cyan-500/40 rounded-full animate-ping" />
                )}
                <button
                  onClick={handleToggle}
                  disabled={isConnecting}
                  className="relative w-32 h-32 bg-white/5 rounded-full flex items-center justify-center border border-white/10 ring-1 ring-white/5 transition-all hover:scale-105 active:scale-95 group"
                >
                  {isConnecting ? (
                    <Loader2 className="w-12 h-12 text-purple-400 animate-spin" />
                  ) : isSpeaking ? (
                    <Volume2 className="w-12 h-12 text-blue-400 animate-pulse" />
                  ) : isSearching ? (
                    <Globe className="w-12 h-12 text-cyan-400 animate-spin-slow" />
                  ) : isListening ? (
                    <Mic className="w-12 h-12 text-red-500 animate-pulse" />
                  ) : (
                    <MessageCircle className="w-12 h-12 text-purple-400/70 group-hover:text-purple-300" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                <h4 className="text-xl font-bold text-white tracking-tight">
                  {type === "official"
                    ? "Start Conversation"
                    : "How can I help?"}
                </h4>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[280px]">
                  {type === "official"
                    ? "Tap the orb to start a real-time voice conversation with our AI agent."
                    : "I can help you navigate VOISSS, explain features, or manage your recordings through voice."}
                </p>
              </div>

              {type === "manual" && (
                <div className="grid grid-cols-1 gap-3 w-full max-w-xs pt-4">
                  {[
                    "Tell me about voice transform",
                    "What is Multi-language dubbing?",
                    "How do I save to Base?",
                  ].map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="group px-5 py-4 bg-white/[0.03] border border-white/5 rounded-2xl text-sm text-gray-400 hover:bg-white/[0.07] hover:border-white/10 hover:text-white transition-all text-left flex items-center justify-between"
                    >
                      <span>&quot;{s}&quot;</span>
                      <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all text-purple-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            // Chat View
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  } animate-in fade-in slide-in-from-bottom-4 duration-500`}
                >
                  <div className={`relative max-w-[88%] ${msg.role === "assistant" && msg.searchResults ? "" : ""}`}>
                    {/* Web-Sourced Badge */}
                    {msg.role === "assistant" && msg.searchResults && msg.searchResults.length > 0 && (
                      <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 bg-cyan-500/20 border border-cyan-500/30 rounded-full z-10">
                        <Globe className="w-2.5 h-2.5 text-cyan-400" />
                        <span className="text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                          Web
                        </span>
                      </div>
                    )}
                    <div
                      className={`px-6 py-4 rounded-[1.5rem] shadow-xl text-[15px] leading-relaxed tracking-wide ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-tr-none shadow-purple-500/10"
                          : "bg-[#151515] border border-white/5 text-gray-200 rounded-tl-none ring-1 ring-white/5 shadow-black/40"
                      }`}
                    >
                      {msg.content}
                    </div>
                    
                    {/* Search Result Cards */}
                    {msg.role === "assistant" && msg.searchResults && msg.searchResults.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.searchResults.map((result: SearchResult, rIdx: number) => (
                          <a
                            key={rIdx}
                            href={result.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block p-3 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/[0.06] hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/10 transition-all group cursor-pointer"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="text-sm font-medium text-gray-200 group-hover:text-cyan-300 line-clamp-1">
                                {result.title}
                              </h4>
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-cyan-400 flex-shrink-0" />
                            </div>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {result.description}
                            </p>
                            <div className="flex items-center gap-1 mt-2">
                              <Globe className="w-2.5 h-2.5 text-gray-600" />
                              <span className="text-[10px] text-gray-600 font-medium">
                                {(() => {
                                  try {
                                    return new URL(result.url).hostname.replace('www.', '');
                                  } catch {
                                    return 'Unknown source';
                                  }
                                })()}
                              </span>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(isProcessing || isSearching) && (
                <div className="flex justify-start">
                  <div className="bg-[#151515] border border-white/5 px-6 py-4 rounded-[1.5rem] rounded-tl-none ring-1 ring-white/5">
                    <div className="flex items-center gap-4">
                      <div className="flex gap-1">
                        {isSearching ? (
                          <>
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-bounce" />
                          </>
                        ) : (
                          <>
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                            <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
                          </>
                        )}
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-widest italic ${
                        isSearching ? "text-cyan-400" : "text-gray-400"
                      }`}>
                        {isSearching ? "Searching web..." : "Thinking..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={conversationEndRef} />
        </div>

        {/* Footer Area: Context & Inputs */}
        <div className="flex-none">
          {/* Context Banner */}
          {context && (
            <div className="px-8 py-2 bg-white/[0.02] border-y border-white/5 flex items-center gap-2">
              <Zap className="w-3 h-3 text-yellow-400/50" />
              <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                Context: {context.slice(0, 30)}...
              </span>
            </div>
          )}

          {/* Transcript display */}
          {transcript && (
            <div className="px-8 py-4 bg-purple-600/10 border-t border-purple-500/20 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-2.5 bg-purple-400 rounded-full animate-ping" />
                <p className="text-purple-300 text-[15px] font-medium italic tracking-wide">
                  &quot;{transcript}&quot;
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="mx-8 mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-[13px] font-medium leading-tight">
                {error}
              </p>
            </div>
          )}

          {/* Input Area */}
          <div className="p-8 bg-[#080808] border-t border-white/5 relative">
            <div className="flex items-center gap-4">
              <button
                onClick={handleToggle}
                disabled={isConnecting || isProcessing}
                className={`flex-shrink-0 w-16 h-16 rounded-[1.25rem] flex items-center justify-center transition-all duration-500 shadow-2xl relative group overflow-hidden ${
                  isListening
                    ? "bg-red-500 animate-pulse"
                    : isProcessing
                    ? "bg-gray-800 cursor-not-allowed opacity-40"
                    : "bg-gradient-to-br from-purple-600 to-blue-600 hover:scale-[1.02]"
                }`}
              >
                <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                {isListening ? (
                  <MicOff className="w-7 h-7 text-white relative z-10" />
                ) : isSpeaking ? (
                  <Volume2 className="w-7 h-7 text-white animate-pulse relative z-10" />
                ) : isConnecting || isProcessing ? (
                  <Loader2 className="w-7 h-7 text-white animate-spin relative z-10" />
                ) : (
                  <Mic className="w-7 h-7 text-white relative z-10" />
                )}
              </button>

              <div className="flex-1 relative group">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    const t = fd.get("message") as string;
                    if (t.trim()) {
                      sendMessage(t);
                      e.currentTarget.reset();
                    }
                  }}
                >
                  <input
                    type="text"
                    name="message"
                    placeholder={
                      type === "official"
                        ? "Voice only mode active"
                        : "Speak or type a message..."
                    }
                    disabled={
                      isProcessing || isListening || type === "official"
                    }
                    className="w-full pl-6 pr-14 py-5 bg-white/[0.03] border border-white/5 rounded-[1.25rem] text-white text-[15px] placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.05] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <button
                    type="submit"
                    disabled={
                      isProcessing || isListening || type === "official"
                    }
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 text-purple-400 hover:text-purple-300 disabled:opacity-0 transition-all hover:scale-110 active:scale-95"
                  >
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </form>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between text-[10px] text-gray-500 font-black uppercase tracking-[0.25em] px-1 opacity-60">
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Google Gemini 3.1 Pro
                </span>
                <span className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  ElevenLabs
                </span>
              </div>
              <span className="text-purple-400/80">AI Partner Catalyst</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
