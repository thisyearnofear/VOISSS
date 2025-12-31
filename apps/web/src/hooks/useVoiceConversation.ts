"use client";

import { useState, useEffect, useRef } from "react";
import { useConversation } from "@elevenlabs/react";

// --- Types ---

export type Role = "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
  timestamp: Date;
}

export type AgentStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "listening"
  | "processing"
  | "speaking";

interface UseVoiceConversationProps {
  context?: string;
  onAction?: (action: string) => void;
  onInsight?: (insight: string) => void;
}

// --- Hook ---

export function useVoiceConversation({
  context,
  onAction,
  onInsight,
}: UseVoiceConversationProps) {
  const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
  const isOfficial = !!agentId;

  // ---------------------------------------------------------------------------
  // 1. Official ElevenLabs Implementation (WebSocket)
  // ---------------------------------------------------------------------------

  const [officialError, setOfficialError] = useState<string | null>(null);

  const officialConversation = useConversation({
    onConnect: () => setOfficialError(null),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onError: (err: any) => {
      console.error("ElevenLabs Agent Error:", err);
      setOfficialError(typeof err === "string" ? err : "Connection error");
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onMessage: (message: any) => {
      // Check for actions in the message
      if (message.message?.text && onAction) {
        const actionMatch = message.message.text.match(/\[ACTION:(\w+)\]/);
        if (actionMatch) {
          onAction(actionMatch[1]);
        }
      }
    },
  });

  // ---------------------------------------------------------------------------
  // 2. Manual Implementation (SpeechRecognition + API)
  // ---------------------------------------------------------------------------

  const [manualState, setManualState] = useState<{
    status: AgentStatus;
    transcript: string;
    messages: Message[];
    error: string | null;
  }>({
    status: "disconnected",
    transcript: "",
    messages: [],
    error: null,
  });

  // Refs for manual implementation
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Speech Recognition & Audio (Effect)
  useEffect(() => {
    if (isOfficial) return; // Skip if using official

    if (typeof window !== "undefined") {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = "en-US";
      }

      // Initialize audio
      audioRef.current = new Audio();
    }

    // Cleanup
    return () => {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (audioRef.current) audioRef.current.pause();
    };
  }, [isOfficial]);

  // Manual Helpers
  const updateManualStatus = (status: AgentStatus) =>
    setManualState((prev) => ({ ...prev, status }));

  const addMessage = (role: Role, content: string) =>
    setManualState((prev) => ({
      ...prev,
      messages: [...prev.messages, { role, content, timestamp: new Date() }],
    }));

  const speakResponse = async (text: string) => {
    updateManualStatus("speaking");
    try {
      const response = await fetch("/api/elevenlabs/text-to-speech", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
        }),
      });

      if (!response.ok) throw new Error("Failed to generate speech");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          updateManualStatus("connected"); // Return to connected/ready state
          URL.revokeObjectURL(audioUrl);
        };
        await audioRef.current.play();
      }
    } catch (err) {
      console.error("TTS error:", err);
      updateManualStatus("connected");
    }
  };

  const handleManualInput = async (text: string) => {
    if (!text.trim()) return;

    addMessage("user", text);
    updateManualStatus("processing");
    setManualState((prev) => ({ ...prev, transcript: "" })); // Clear transcript

    try {
      const res = await fetch("/api/voice-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          context: context || "VOISSS Platform",
          conversationHistory: manualState.messages.slice(-6),
        }),
      });

      if (!res.ok) throw new Error("AI processing failed");

      const data = await res.json();
      let aiResponse = data.response;

      // Extract actions
      const actionMatch = aiResponse.match(/\[ACTION:(\w+)\]/);
      if (actionMatch && onAction) {
        onAction(actionMatch[1]);
        aiResponse = aiResponse.replace(/\[ACTION:\w+\]/g, "").trim();
      }

      addMessage("assistant", aiResponse);
      if (onInsight) onInsight(aiResponse);

      await speakResponse(aiResponse);
    } catch (err) {
      console.error(err);
      setManualState((prev) => ({
        ...prev,
        error: "Failed to process request. Try again.",
        status: "connected",
      }));
    }
  };

  // Re-bind recognition events to capture latest closure scope
  useEffect(() => {
    if (isOfficial || !recognitionRef.current) return;

    const recognition = recognitionRef.current;

    recognition.onstart = () => updateManualStatus("listening");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current];
      const transcriptText = result[0].transcript;

      setManualState((prev) => ({ ...prev, transcript: transcriptText }));

      if (result.isFinal) {
        handleManualInput(transcriptText);
      }
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      let errorMsg = `Voice error: ${event.error}`;
      if (event.error === "network")
        errorMsg = "Network error. Check connection.";
      if (event.error === "not-allowed") errorMsg = "Microphone denied.";
      if (event.error === "no-speech") return; // Ignore

      setManualState((prev) => ({
        ...prev,
        status: "disconnected",
        error: errorMsg,
      }));
    };

    recognition.onend = () => {
      setManualState((prev) => {
        if (prev.status === "listening")
          return { ...prev, status: "connected" };
        return prev;
      });
    };
  });

  // ---------------------------------------------------------------------------
  // 3. Unified Interface
  // ---------------------------------------------------------------------------

  if (isOfficial) {
    const { status, isSpeaking } = officialConversation;

    // Map official status to our unified status
    let unifiedStatus: AgentStatus = "disconnected";
    if (status === "connecting") unifiedStatus = "connecting";
    if (status === "connected")
      unifiedStatus = isSpeaking ? "speaking" : "connected";

    return {
      type: "official" as const,
      status: unifiedStatus,
      transcript: "", // Official SDK doesn't expose realtime user transcript easily in this hook
      messages: [], // Official SDK manages history internally
      error: officialError,
      connect: async () => {
        try {
          await navigator.mediaDevices.getUserMedia({ audio: true });
          await officialConversation.startSession({ agentId: agentId! });
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (e: any) {
          setOfficialError(e.message || "Failed to connect");
        }
      },
      disconnect: async () => await officialConversation.endSession(),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      sendMessage: async (text: string) => {
        // Official SDK might not support text input injection easily alongside voice
        console.warn(
          "Text input not fully supported in official voice mode yet"
        );
      },
      isSpeaking,
    };
  }

  // Manual Interface
  return {
    type: "manual" as const,
    status: manualState.status,
    transcript: manualState.transcript,
    messages: manualState.messages,
    error: manualState.error,
    connect: async () => {
      setManualState((prev) => ({ ...prev, error: null }));
      try {
        if (!recognitionRef.current)
          throw new Error("Speech recognition not supported");
        recognitionRef.current.start();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setManualState((prev) => ({ ...prev, error: e.message }));
      }
    },
    disconnect: async () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      if (audioRef.current) audioRef.current.pause();
      updateManualStatus("disconnected");
    },
    sendMessage: handleManualInput,
    isSpeaking: manualState.status === "speaking",
  };
}

// Type declarations for Web Speech API
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SpeechRecognition: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    webkitSpeechRecognition: any;
  }
}
