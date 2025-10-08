"use client";

import React, { useState, useCallback } from "react";
import { useWebAudioRecording } from "../hooks/useWebAudioRecording";
import { Users, Share2, Heart, MessageCircle, Globe, Lock, Zap, Languages, Wand2 } from "lucide-react";
import RealTimeWaveform from "./RealTimeWaveform";
import { createAIServiceClient } from "@voisss/shared";

interface SocialRecordingStudioProps {
  onRecordingComplete?: (audioBlob: Blob, metadata: any) => void;
}

export default function SocialRecordingStudio({ onRecordingComplete }: SocialRecordingStudioProps) {
  const {
    isRecording,
    isLoading,
    duration,
    audioBlob,
    error,
    waveformData,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    cancelRecording,
  } = useWebAudioRecording();

  // Social features state
  const [recordingTitle, setRecordingTitle] = useState("");
  const [recordingDescription, setRecordingDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedCommunity, setSelectedCommunity] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");

  // AI Enhancement state
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [enhancedBlob, setEnhancedBlob] = useState<Blob | null>(null);

  // Mock data
  const communities = [
    { id: "music", name: "🎵 Music Producers", members: 1243 },
    { id: "podcast", name: "🎙️ Podcast Creators", members: 876 },
    { id: "language", name: "🌍 Language Learners", members: 542 },
    { id: "voice", name: "🎭 Voice Actors", members: 324 }
  ];

  const popularTags = ["music", "podcast", "voice-over", "demo", "practice", "collaboration"];
  const aiVoices = ["Professional", "Warm", "Energetic", "Calm", "Dramatic"];
  const languages = ["English", "Spanish", "French", "German", "Japanese"];

  const handleStartRecording = useCallback(async () => {
    try {
      await startRecording();
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    try {
      await stopRecording();
      setShowAIOptions(true);
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  }, [stopRecording]);

  const handleAddTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAIEnhancement = async () => {
    if (!audioBlob) return;
    
    setIsProcessing(true);
    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 3000));
      setEnhancedBlob(audioBlob); // In real implementation, this would be the enhanced audio
      setShowAIOptions(false);
    } catch (error) {
      console.error("AI enhancement failed:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = () => {
    const finalBlob = enhancedBlob || audioBlob;
    if (finalBlob && onRecordingComplete) {
      const metadata = {
        title: recordingTitle,
        description: recordingDescription,
        isPublic,
        community: selectedCommunity,
        tags,
        duration,
        aiEnhanced: !!enhancedBlob,
        voice: selectedVoice,
        language: selectedLanguage
      };
      onRecordingComplete(finalBlob, metadata);
    }
  };

  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Create & Share</h2>
        <p className="text-gray-400">Record, enhance with AI, and share with the community</p>
      </div>

      {/* Recording Interface */}
      <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-8 mb-8">
        {/* Waveform Visualization */}
        <div className="mb-8">
          <RealTimeWaveform 
            isRecording={isRecording}
            audioData={waveformData}
            className="h-32"
          />
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center items-center gap-4 mb-6">
          {!isRecording && !audioBlob && (
            <button
              onClick={handleStartRecording}
              disabled={isLoading}
              className="w-16 h-16 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <div className="w-6 h-6 bg-white rounded-full"></div>
            </button>
          )}

          {isRecording && (
            <>
              <button
                onClick={handleStopRecording}
                className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center hover:from-gray-700 hover:to-gray-800 transition-all duration-200"
              >
                <div className="w-6 h-6 bg-white rounded-sm"></div>
              </button>
              <div className="text-white font-mono text-xl">
                {formatDuration(duration)}
              </div>
            </>
          )}

          {audioBlob && !isRecording && (
            <div className="flex gap-4">
              <button
                onClick={() => {
                  const audio = new Audio(URL.createObjectURL(audioBlob));
                  audio.play();
                }}
                className="px-6 py-3 bg-green-600 rounded-lg text-white hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent"></div>
                Play
              </button>
              <button
                onClick={cancelRecording}
                className="px-6 py-3 bg-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
              >
                Re-record
              </button>
            </div>
          )}
        </div>

        {/* Duration Display */}
        {(isRecording || audioBlob) && (
          <div className="text-center text-gray-400 mb-4">
            Duration: {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* AI Enhancement Panel */}
      {showAIOptions && audioBlob && (
        <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-purple-500/30 rounded-2xl p-6 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Wand2 className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-semibold text-white">AI Enhancement</h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {/* Voice Enhancement */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Voice Style
              </label>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Keep Original</option>
                {aiVoices.map(voice => (
                  <option key={voice} value={voice}>{voice}</option>
                ))}
              </select>
            </div>

            {/* Language Dubbing */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Languages className="w-4 h-4 inline mr-1" />
                Translate to
              </label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#3A3A3A] rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Keep Original Language</option>
                {languages.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={handleAIEnhancement}
              disabled={isProcessing}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  Enhance with AI
                </>
              )}
            </button>
            <button
              onClick={() => setShowAIOptions(false)}
              className="px-6 py-3 bg-gray-600 rounded-lg text-white hover:bg-gray-700 transition-colors"
            >
              Skip
            </button>
          </div>
        </div>
      )}

      {/* Social Metadata */}
      {(audioBlob || enhancedBlob) && !showAIOptions && (
        <div className="bg-gradient-to-br from-[#1A1A1A] to-[#2A2A2A] border border-[#3A3A3A] rounded-2xl p-6 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share with Community
          </h3>

          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={recordingTitle}
                onChange={(e) => setRecordingTitle(e.target.value)}
                placeholder="Give your recording a catchy title..."
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={recordingDescription}
                onChange={(e) => setRecordingDescription(e.target.value)}
                placeholder="Tell the community about your recording..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none resize-none"
              />
            </div>

            {/* Community Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Share to Community
              </label>
              <select
                value={selectedCommunity}
                onChange={(e) => setSelectedCommunity(e.target.value)}
                className="w-full px-4 py-3 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="">Select a community...</option>
                {communities.map(community => (
                  <option key={community.id} value={community.id}>
                    {community.name} ({community.members} members)
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-purple-600/20 border border-purple-500/30 rounded-full text-sm text-purple-300 flex items-center gap-2"
                  >
                    #{tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-purple-400 hover:text-purple-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag(newTag)}
                  placeholder="Add a tag..."
                  className="flex-1 px-3 py-2 bg-[#0A0A0A] border border-[#3A3A3A] rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none text-sm"
                />
                <button
                  onClick={() => handleAddTag(newTag)}
                  className="px-4 py-2 bg-purple-600 rounded-lg text-white hover:bg-purple-700 transition-colors text-sm"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => handleAddTag(tag)}
                    className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300 hover:bg-gray-600 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Privacy Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Privacy
              </label>
              <div className="flex gap-4">
                <button
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                    isPublic
                      ? 'bg-green-600/20 border-green-500/50 text-green-300'
                      : 'bg-[#0A0A0A] border-[#3A3A3A] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Globe className="w-4 h-4" />
                  Public
                </button>
                <button
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 px-4 py-3 rounded-lg border transition-all duration-200 flex items-center justify-center gap-2 ${
                    !isPublic
                      ? 'bg-orange-600/20 border-orange-500/50 text-orange-300'
                      : 'bg-[#0A0A0A] border-[#3A3A3A] text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Private
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Button */}
      {(audioBlob || enhancedBlob) && !showAIOptions && (
        <div className="text-center">
          <button
            onClick={handlePublish}
            disabled={!recordingTitle.trim()}
            className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 rounded-xl text-white text-lg font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 mx-auto"
          >
            <Share2 className="w-5 h-5" />
            {isPublic ? 'Publish to Community' : 'Save Recording'}
          </button>
        </div>
      )}
    </div>
  );
}