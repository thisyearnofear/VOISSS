"use client";

import React, { useState, useRef, useEffect } from 'react';

interface AudioComparisonProps {
  originalAudio: Blob;
  dubbedAudio: Blob;
  originalTranscript?: string;
  translatedTranscript?: string;
  targetLanguage?: string;
  className?: string;
}

export default function AudioComparison({
  originalAudio,
  dubbedAudio,
  originalTranscript = "",
  translatedTranscript = "",
  targetLanguage = "",
  className = ""
}: AudioComparisonProps) {
  const [isPlaying, setIsPlaying] = useState<'none' | 'original' | 'dubbed' | 'both'>('none');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const originalRef = useRef<HTMLAudioElement>(null);
  const dubbedRef = useRef<HTMLAudioElement>(null);
  const syncTimeoutRef = useRef<NodeJS.Timeout>();

  // Create object URLs for audio blobs
  const originalUrl = React.useMemo(() => URL.createObjectURL(originalAudio), [originalAudio]);
  const dubbedUrl = React.useMemo(() => URL.createObjectURL(dubbedAudio), [dubbedAudio]);

  useEffect(() => {
    return () => {
      URL.revokeObjectURL(originalUrl);
      URL.revokeObjectURL(dubbedUrl);
    };
  }, [originalUrl, dubbedUrl]);

  const handlePlayPause = (audio: 'original' | 'dubbed' | 'both') => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;

    if (!originalAudio || !dubbedAudio) return;

    if (audio === 'both') {
      // Sync both audios to play together
      originalAudio.currentTime = 0;
      dubbedAudio.currentTime = 0;
      originalAudio.play();
      dubbedAudio.play();
      setIsPlaying('both');
    } else if (audio === 'original') {
      if (isPlaying === 'original') {
        originalAudio.pause();
        setIsPlaying('none');
      } else {
        originalAudio.currentTime = 0;
        originalAudio.play();
        setIsPlaying('original');
      }
    } else if (audio === 'dubbed') {
      if (isPlaying === 'dubbed') {
        dubbedAudio.pause();
        setIsPlaying('none');
      } else {
        dubbedAudio.currentTime = 0;
        dubbedAudio.play();
        setIsPlaying('dubbed');
      }
    }
  };

  const handleTimeUpdate = (audioElement: HTMLAudioElement) => {
    setCurrentTime(audioElement.currentTime);
    setDuration(audioElement.duration || 0);

    // Sync the other audio if both are playing
    if (isPlaying === 'both') {
      const otherAudio = audioElement === originalRef.current ? dubbedRef.current : originalRef.current;
      if (otherAudio && Math.abs(otherAudio.currentTime - audioElement.currentTime) > 0.1) {
        otherAudio.currentTime = audioElement.currentTime;
      }
    }
  };

  const handleSeek = (newTime: number) => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;

    if (originalAudio) originalAudio.currentTime = newTime;
    if (dubbedAudio) dubbedAudio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Audio Comparison
        </h3>
        <p className="text-gray-400 text-sm">
          Compare your original recording with the dubbed version
        </p>
      </div>

      {/* Playback Controls */}
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => handlePlayPause('original')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPlaying === 'original'
              ? 'bg-blue-600 text-white'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isPlaying === 'original' ? 'Pause Original' : 'Play Original'}
        </button>

        <button
          onClick={() => handlePlayPause('both')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPlaying === 'both'
              ? 'bg-[#7C5DFA] text-white'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isPlaying === 'both' ? 'Pause Both' : 'Play Together'}
        </button>

        <button
          onClick={() => handlePlayPause('dubbed')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPlaying === 'dubbed'
              ? 'bg-green-600 text-white'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A3A]'
          }`}
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {isPlaying === 'dubbed' ? 'Pause Dubbed' : 'Play Dubbed'}
        </button>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div
          className="w-full h-2 bg-[#2A2A2A] rounded-full cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            handleSeek(newTime);
          }}
        >
          <div
            className="h-full bg-gradient-to-r from-[#7C5DFA] to-[#9C88FF] rounded-full transition-all duration-100"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Audio Elements */}
      <div className="space-y-4 mb-6">
        <audio
          ref={originalRef}
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying('original')}
          onPause={() => setIsPlaying('none')}
          onEnded={() => setIsPlaying('none')}
          className="hidden"
        >
          <source src={originalUrl} type={originalAudio.type || undefined} />
        </audio>

        <audio
          ref={dubbedRef}
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
          onLoadedMetadata={(e) => {
            if (isPlaying === 'both') {
              // Sync the duration if both are playing
              setDuration(e.currentTarget.duration || 0);
            }
          }}
          onPlay={() => setIsPlaying('dubbed')}
          onPause={() => setIsPlaying('none')}
          onEnded={() => setIsPlaying('none')}
          className="hidden"
        >
          <source src={dubbedUrl} type={dubbedAudio.type || 'audio/mpeg'} />
        </audio>
      </div>

      {/* Transcript Comparison */}
      {(originalTranscript || translatedTranscript) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {originalTranscript && (
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
                Original Transcript
              </h4>
              <div className="text-sm text-gray-300 max-h-32 overflow-y-auto bg-gray-800/50 p-3 rounded">
                {originalTranscript}
              </div>
            </div>
          )}

          {translatedTranscript && (
            <div className="bg-[#0F0F0F] border border-[#2A2A2A] rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <span className="text-lg">{targetLanguage ? '🌍' : '🎭'}</span>
                {targetLanguage ? `${targetLanguage.toUpperCase()} Translation` : 'Translated Transcript'}
              </h4>
              <div className="text-sm text-blue-300 max-h-32 overflow-y-auto bg-blue-900/20 p-3 rounded">
                {translatedTranscript}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tips */}
      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <p className="text-blue-300 text-xs">
          💡 <strong>Tip:</strong> Use "Play Together" to hear both versions simultaneously and compare the AI's emotional accuracy and pronunciation.
        </p>
      </div>
    </div>
  );
}