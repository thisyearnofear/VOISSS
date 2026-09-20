"use client";

import dynamic from "next/dynamic";

// Lazy-load VoiceAssistant so anonymous users don't download
// the heavy conversation SDK on first paint. Next 15 requires
// `ssr: false` to live inside a Client Component, hence the wrapper.
const VoiceAssistant = dynamic(() => import("./VoiceAssistant"), {
  ssr: false,
  loading: () => null,
});

export default function VoiceAssistantLoader() {
  return <VoiceAssistant />;
}
