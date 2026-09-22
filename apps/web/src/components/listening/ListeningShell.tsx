"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "../Nav";
import MobileBottomNav from "../MobileBottomNav";
import VoiceAssistantLoader from "../VoiceAssistantLoader";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { ListeningNav } from "./ListeningNav";
import { ListeningPlayerBar } from "./ListeningPlayerBar";

const LISTENING_ROUTES = new Set([
  "/",
  "/marketplace",
  "/generate",
  "/developers",
  "/benchmarks",
]);

/** Dark graphite surfaces (workspace-style tooling). */
const DARK_ROUTES = new Set(["/generate", "/benchmarks"]);

/** Listening Room surfaces get the lr-shell chrome (nav + shared player bar)
 *  and keep playback alive across navigation; everything else is legacy. */
function isListeningRoute(pathname: string): boolean {
  return (
    LISTENING_ROUTES.has(pathname) ||
    pathname.startsWith("/marketplace/voices/") ||
    pathname === "/sell" ||
    pathname.startsWith("/sell/")
  );
}

export default function ListeningShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { player } = useListeningRoom();
  const listening = isListeningRoute(pathname);

  useEffect(() => {
    if (!isListeningRoute(pathname)) player.stop();
  }, [pathname, player]);

  if (!listening) {
    return (
      <>
        <Nav />
        {children}
        <MobileBottomNav />
        <VoiceAssistantLoader />
      </>
    );
  }

  return (
    <div className={`lr-shell${DARK_ROUTES.has(pathname) ? " lr-dark" : ""}`}>
      <a className="lr-skip" href="#listening-main">
        Skip to content
      </a>
      <ListeningNav />
      {children}
      <ListeningPlayerBar />
    </div>
  );
}
