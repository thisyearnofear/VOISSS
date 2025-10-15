"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';

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

  // Create object URLs using refs to avoid premature revocation
  const originalUrlRef = useRef<string | null>(null);
  const dubbedUrlRef = useRef<string | null>(null);
  
  // Create object URLs when audio blobs change
  useEffect(() => {
    // Revoke previous URLs if they exist
    if (originalUrlRef.current) {
      URL.revokeObjectURL(originalUrlRef.current);
    }
    if (dubbedUrlRef.current) {
      URL.revokeObjectURL(dubbedUrlRef.current);
    }
    
    // Create new URLs
    originalUrlRef.current = URL.createObjectURL(originalAudio);
    dubbedUrlRef.current = URL.createObjectURL(dubbedAudio);
    
    // Update audio sources with new URLs
    const originalAudioEl = originalRef.current;
    const dubbedAudioEl = dubbedRef.current;
    
    if (originalAudioEl) {
      originalAudioEl.src = originalUrlRef.current;
    }
    if (dubbedAudioEl) {
      dubbedAudioEl.src = dubbedUrlRef.current;
    }
    
    return () => {
      // Revoke URLs when component unmounts or when blobs change
      if (originalUrlRef.current) {
        URL.revokeObjectURL(originalUrlRef.current);
        originalUrlRef.current = null;
      }
      if (dubbedUrlRef.current) {
        URL.revokeObjectURL(dubbedUrlRef.current);
        dubbedUrlRef.current = null;
      }
    };
  }, [originalAudio, dubbedAudio]);

  // Audio elements are reloaded via the src updates in the main useEffect

  const handlePlayPause = useCallback(async (audio: 'original' | 'dubbed' | 'both') => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;

    if (!originalAudio || !dubbedAudio) {
      console.error('Audio elements not available');
      return;
    }

    // Check if URLs are valid
    if (!originalUrlRef.current || !dubbedUrlRef.current) {
      console.error('Audio URLs not available');
      return;
    }

    try {
      // Pause all first to avoid conflicts
      originalAudio.pause();
      dubbedAudio.pause();

      // Add a small delay to ensure audio elements have processed the pause
      await new Promise(resolve => setTimeout(resolve, 50));

      if (audio === 'both') {
        // Reset time to sync both
        originalAudio.currentTime = 0;
        dubbedAudio.currentTime = 0;
        // Use Promise.allSettled to handle potential errors individually
        const [originalResult, dubbedResult] = await Promise.allSettled([
          originalAudio.play(),
          dubbedAudio.play()
        ]);
        
        if (originalResult.status === 'rejected' || dubbedResult.status === 'rejected') {
          console.error('One or both audio play promises rejected:', 
            originalResult.status === 'rejected' ? originalResult.reason : 'original OK',
            dubbedResult.status === 'rejected' ? dubbedResult.reason : 'dubbed OK'
          );
          setIsPlaying('none');
        } else {
          setIsPlaying('both');
        }
      } else if (audio === 'original') {
        originalAudio.currentTime = 0;
        try {
          await originalAudio.play();
          setIsPlaying('original');
        } catch (error) {
          console.error('Original audio play error:', error);
          setIsPlaying('none');
        }
      } else if (audio === 'dubbed') {
        dubbedAudio.currentTime = 0;
        try {
          await dubbedAudio.play();
          setIsPlaying('dubbed');
        } catch (error) {
          console.error('Dubbed audio play error:', error);
          setIsPlaying('none');
        }
      }
    } catch (error) {
      console.error('Audio playback error:', error);
      setIsPlaying('none');
    }
  }, []);

  const handleTimeUpdate = useCallback((audioElement: HTMLAudioElement) => {
    setCurrentTime(audioElement.currentTime);
    // Only update duration if it's a valid number and not Infinity
    const duration = audioElement.duration;
    if (duration && isFinite(duration)) {
      setDuration(duration);
    }

    // Sync the other audio if both are playing
    if (isPlaying === 'both') {
      const otherAudio = audioElement === originalRef.current ? dubbedRef.current : originalRef.current;
      if (otherAudio && Math.abs(otherAudio.currentTime - audioElement.currentTime) > 0.1) {
        otherAudio.currentTime = audioElement.currentTime;
      }
    }
  }, [isPlaying]);

  const handleSeek = useCallback((newTime: number) => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;

    if (originalAudio) originalAudio.currentTime = newTime;
    if (dubbedAudio) dubbedAudio.currentTime = newTime;
    setCurrentTime(newTime);
  }, []);

  const handleStopAll = useCallback(() => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;
    
    if (originalAudio) originalAudio.pause();
    if (dubbedAudio) dubbedAudio.pause();
    setIsPlaying('none');
  }, []);

  const formatTime = useCallback((time: number): string => {
    // Handle invalid time values
    if (!isFinite(time) || time < 0) {
      return '0:00';
    }
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Add effect to handle when audio ends
  useEffect(() => {
    const originalAudio = originalRef.current;
    const dubbedAudio = dubbedRef.current;

    const handleOriginalEnded = () => {
      if (isPlaying === 'original' || isPlaying === 'both') {
        setIsPlaying(prev => {
          if (prev === 'both' && dubbedAudio) {
            // If both were playing, pause the dubbed audio too
            dubbedAudio.pause();
          }
          return 'none';
        });
      }
    };

    const handleDubbedEnded = () => {
      if (isPlaying === 'dubbed' || isPlaying === 'both') {
        setIsPlaying(prev => {
          if (prev === 'both' && originalAudio) {
            // If both were playing, pause the original audio too
            originalAudio.pause();
          }
          return 'none';
        });
      }
    };

    if (originalAudio) {
      originalAudio.addEventListener('ended', handleOriginalEnded);
    }
    if (dubbedAudio) {
      dubbedAudio.addEventListener('ended', handleDubbedEnded);
    }

    return () => {
      if (originalAudio) {
        originalAudio.removeEventListener('ended', handleOriginalEnded);
      }
      if (dubbedAudio) {
        dubbedAudio.removeEventListener('ended', handleDubbedEnded);
      }
    };
  }, [isPlaying]);

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
      <div className="flex flex-col gap-3 mb-6 md:flex-row">
        <button
          onClick={() => handlePlayPause('original')}
          className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
            isPlaying === 'original'
              ? 'bg-blue-600 text-white'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
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
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
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
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
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
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && isFinite(dur) && duration === 0) { // Only set duration if valid and not already set
              setDuration(dur);
            }
          }}
          onError={(e) => console.error('Original audio loading error:', e)}
          className="hidden"
        >
          <source src={originalUrlRef.current || ''} type={originalAudio.type || undefined} />
        </audio>

        <audio
          ref={dubbedRef}
          onTimeUpdate={(e) => handleTimeUpdate(e.currentTarget)}
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (dur && isFinite(dur) && duration === 0) { // Only set duration if valid and not already set
              setDuration(dur);
            }
          }}
          onError={(e) => console.error('Dubbed audio loading error:', e)}
          className="hidden"
        >
          <source src={dubbedUrlRef.current || ''} type={dubbedAudio.type || 'audio/mpeg'} />
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