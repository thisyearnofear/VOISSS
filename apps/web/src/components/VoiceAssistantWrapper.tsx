"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useAssistant } from "../contexts/AssistantContext";

const VoiceAssistant = dynamic(() => import("./VoiceAssistant"), {
    ssr: false,
});

export default function VoiceAssistantWrapper() {
    const pathname = usePathname();
    const { setIsExpanded } = useAssistant();

    // Close assistant on navigation for better UX
    useEffect(() => {
        setIsExpanded(false);
    }, [pathname, setIsExpanded]);

    // Provide contextual description based on pathname
    let context = "VOISSS Platform";
    if (pathname === '/studio') {
        context = "Recording Studio - user can record voice, transform audio, and save to blockchain";
    } else if (pathname === '/help') {
        context = "Help Center - user is looking for guidance or documentation";
    } else if (pathname === '/missions') {
        context = "Missions - user is exploring tasks to earn rewards";
    } else if (pathname === '/features') {
        context = "Features - user is viewing platform capabilities";
    } else if (pathname.includes('/studio') && pathname.includes('mode=transcript')) {
        context = "Transcript Composer - user is creating video transcripts from audio";
    }

    return <VoiceAssistant context={context} />;
}
