"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Nav from "../Nav";
import MobileBottomNav from "../MobileBottomNav";
import VoiceAssistantLoader from "../VoiceAssistantLoader";
import { useListeningRoom } from "@/contexts/ListeningRoomContext";
import { ListeningNav } from "./ListeningNav";
import { ListeningPlayerBar } from "./ListeningPlayerBar";

const LISTENING_ROUTES = new Set(["/", "/marketplace", "/generate"]);

export default function ListeningShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { player } = useListeningRoom();
  const isListeningRoute = LISTENING_ROUTES.has(pathname);

  useEffect(() => {
    if (!LISTENING_ROUTES.has(pathname)) player.stop();
  }, [pathname, player]);

  if (!isListeningRoute) {
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
    <div className={`lr-shell${pathname === "/generate" ? " lr-dark" : ""}`}>
      <a className="lr-skip" href="#listening-main">
        Skip to content
      </a>
      <ListeningNav />
      {children}
      <ListeningPlayerBar />
    </div>
  );
}
