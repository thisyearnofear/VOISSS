"use client";

import React, { useEffect, useState } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { Play, Pause, Share2, Heart } from "lucide-react";
import { formatDuration } from "@voisss/shared";
import Image from "next/image";

// Types for Farcaster interactions
interface FarcasterUser {
  fid?: number;
  username?: string;
  pfpUrl?: string;
  followerCount?: number;
}

interface MiniAppPayload {
  recordingId?: string;
}

interface FarcasterShareContent {
  text: string;
  url: string;
}

// Define an interface for the SDK to avoid 'any' casting
// This extends the known usage based on the original file
interface ExpandedSDK {
  actions: {
    ready: () => void;
  };
  getInitialPayload?: () => MiniAppPayload;
  share?: (content: FarcasterShareContent) => Promise<void>;
  like?: (id: string) => Promise<void>;
  openUrl?: (url: string) => void;
}

// Extend Window interface for MiniApp globals
declare global {
  interface Window {
    __MINIAPP_PAYLOAD__?: MiniAppPayload;
    __MINIAPP_USER__?: FarcasterUser;
  }
}

const safeSdk = sdk as unknown as ExpandedSDK;

export default function VoisssMiniAppPlayer() {
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Removed unused state setters for duration and currentTime
  const currentTime = 0;

  const [userContext, setUserContext] = useState<FarcasterUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Get the initial payload from the manifest
      const payload =
        safeSdk.getInitialPayload?.() || window.__MINIAPP_PAYLOAD__;

      if (payload && payload.recordingId) {
        setRecordingId(payload.recordingId);
      } else {
        setError("No recording ID was provided in the manifest payload.");
      }

      // Get user context if available
      const user = window.__MINIAPP_USER__;
      if (user) {
        setUserContext(user);
      }

      // CRITICAL: Tell the Farcaster client that your app is ready to be displayed.
      // If you don't call this, you'll get an infinite loading screen.
      safeSdk.actions.ready();
    } catch (err) {
      console.error("Error initializing Mini App:", err);
      setError("Failed to initialize the player.");
    }
  }, []);

  if (error) {
    return (
      <div
        style={{
          backgroundColor: "#121214",
          color: "#FFFFFF",
          padding: "20px",
          textAlign: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <h2 style={{ color: "#FF5252", marginBottom: "16px" }}>Error</h2>
        <p style={{ color: "#A0A0B0" }}>{error}</p>
      </div>
    );
  }

  if (!recordingId) {
    return (
      <div
        style={{
          backgroundColor: "#121214",
          color: "#FFFFFF",
          padding: "20px",
          textAlign: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "3px solid #7C5DFA",
            borderTop: "3px solid transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        />
        <p style={{ color: "#A0A0B0" }}>Loading VOISSS Player...</p>
      </div>
    );
  }

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleShare = async () => {
    try {
      // Try to use Farcaster share if available
      if (safeSdk.share) {
        await safeSdk.share({
          text: `Check out my recording on VOISSS! 🎤`,
          url: `${window.location.origin}/recording/${recordingId}`,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${window.location.origin}/recording/${recordingId}`
        );
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  };

  const handleHeart = async () => {
    try {
      if (safeSdk.like) {
        await safeSdk.like(recordingId);
      }
    } catch (err) {
      console.error("Failed to like recording:", err);
    }
  };

  // Mock recording data - in a real implementation, this would fetch from your API
  const mockRecording = {
    id: recordingId,
    title: "Voice Recording",
    duration: 180, // 3 minutes
    author: userContext?.username || "Anonymous",
    authorAvatar: userContext?.pfpUrl || "/default-avatar.png",
    plays: 1234,
    waveform: Array.from({ length: 50 }, () => Math.random() * 0.8 + 0.2),
  };

  return (
    <div
      style={{
        backgroundColor: "#121214",
        color: "#FFFFFF",
        padding: "16px",
        maxWidth: "500px",
        margin: "0 auto",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "1px solid #2A2A35",
        }}
      >
        <h1
          style={{
            fontSize: "24px",
            fontWeight: "700",
            color: "#7C5DFA",
            marginBottom: "4px",
          }}
        >
          VOISSS
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "#A0A0B0",
          }}
        >
          Voice Recording Player
        </p>
      </div>

      {/* User Context */}
      {userContext && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px",
            backgroundColor: "#1E1E24",
            borderRadius: "8px",
            marginBottom: "20px",
            gap: "12px",
          }}
        >
          <Image
            src={userContext.pfpUrl || "/default-avatar.png"}
            alt={userContext.username || "User Avatar"}
            width={32}
            height={32}
            unoptimized // Allow external URLs
            style={{
              borderRadius: "16px",
              objectFit: "cover",
            }}
          />
          <div>
            <p
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#FFFFFF",
                margin: 0,
              }}
            >
              {userContext.username}
            </p>
            <p
              style={{
                fontSize: "12px",
                color: "#A0A0B0",
                margin: 0,
              }}
            >
              {userContext.followerCount || 0} followers
            </p>
          </div>
        </div>
      )}

      {/* Recording Info */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "18px",
            fontWeight: "600",
            color: "#FFFFFF",
            marginBottom: "8px",
          }}
        >
          {mockRecording.title}
        </h2>

        {/* Waveform Visualization */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            height: "60px",
            backgroundColor: "#1E1E24",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "16px",
            gap: "2px",
          }}
        >
          {mockRecording.waveform.map((amplitude, index) => (
            <div
              key={index}
              style={{
                flex: 1,
                height: `${amplitude * 40}px`,
                backgroundColor: isPlaying ? "#7C5DFA" : "#2A2A35",
                borderRadius: "1px",
                transition: "all 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            marginBottom: "16px",
          }}
        >
          <button
            onClick={handlePlay}
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "28px",
              backgroundColor: "#7C5DFA",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {isPlaying ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" style={{ marginLeft: "2px" }} />
            )}
          </button>
        </div>

        {/* Time Display */}
        <div
          style={{
            textAlign: "center",
            color: "#A0A0B0",
            fontSize: "14px",
            marginBottom: "20px",
          }}
        >
          {formatDuration(currentTime)} /{" "}
          {formatDuration(mockRecording.duration)}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            color: "#A0A0B0",
            fontSize: "14px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Play size={16} />
            <span>{mockRecording.plays}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginTop: "24px",
        }}
      >
        <button
          onClick={handleShare}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            backgroundColor: "#1E1E24",
            border: "1px solid #2A2A35",
            borderRadius: "8px",
            color: "#FFFFFF",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>

        <button
          onClick={handleHeart}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "12px",
            backgroundColor: "#1E1E24",
            border: "1px solid #2A2A35",
            borderRadius: "8px",
            color: "#FFFFFF",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <Heart size={16} />
          <span>Like</span>
        </button>
      </div>

      {/* Call to Action */}
      <div
        style={{
          marginTop: "32px",
          padding: "20px",
          backgroundColor: "rgba(124, 93, 250, 0.15)",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <h3
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#7C5DFA",
            marginBottom: "8px",
          }}
        >
          Create Your Own
        </h3>
        <p
          style={{
            fontSize: "14px",
            color: "#A0A0B0",
            marginBottom: "16px",
          }}
        >
          Record, transform, and share your voice with AI-powered tools
        </p>
        <button
          onClick={() => {
            if (safeSdk.openUrl) {
              safeSdk.openUrl("https://voisss.app");
            } else {
              window.open("https://voisss.app", "_blank");
            }
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#7C5DFA",
            border: "none",
            borderRadius: "8px",
            color: "#FFFFFF",
            fontWeight: "600",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          Open VOISSS
        </button>
      </div>

      {/* Styles for animation */}
      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
