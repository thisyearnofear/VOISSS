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
  const [showCelebration, setShowCelebration] = useState(true);

  const originalRef = useRef<HTMLAudioElement>(null);
  const dubbedRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  // Auto-scroll to component and show celebration on mount
  useEffect(() => {
    // Small delay to ensure layout is complete
    const timer = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }
      // Hide celebration after 5 seconds
      const celebrationTimer = setTimeout(() => {
        setShowCelebration(false);
      }, 5000);
      return () => clearTimeout(celebrationTimer);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
    <div 
      ref={containerRef}
      className={`bg-[#1A1A1A] border rounded-xl p-4 sm:p-6 ${showCelebration ? 'border-[#7C5DFA] shadow-lg shadow-[#7C5DFA]/20 animate-pulse' : 'border-[#2A2A2A]'} ${className}`}
    >
      {/* Success Banner - Mobile Optimized */}
      {showCelebration && (
        <div className="mb-4 p-3 sm:p-4 bg-gradient-to-r from-green-600/20 to-[#7C5DFA]/20 border border-green-500/30 rounded-lg animate-fade-in">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="text-2xl sm:text-3xl">🎉</div>
            <div className="flex-1">
              <p className="text-green-400 font-semibold text-sm sm:text-base">Dubbing Complete!</p>
              <p className="text-gray-300 text-xs sm:text-sm">🎧 Listen to your dubbed audio below</p>
            </div>
            <button
              onClick={() => setShowCelebration(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="mb-4 sm:mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#7C5DFA]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          Audio Comparison
        </h3>
        <p className="text-gray-400 text-sm">
          Compare your original recording with the dubbed version
        </p>
      </div>

      {/* Playback Controls - Mobile Optimized */}
      <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-6 md:flex-row">
        <button
          onClick={() => handlePlayPause('original')}
          className={`flex-1 px-3 sm:px-4 py-4 sm:py-3 min-h-[48px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
            isPlaying === 'original'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
          }`}
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
            {isPlaying === 'original' ? (
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
          <span className="text-sm sm:text-base">{isPlaying === 'original' ? 'Pause Original' : 'Play Original'}</span>
        </button>

        <button
          onClick={() => handlePlayPause('dubbed')}
          className={`flex-1 px-3 sm:px-4 py-4 sm:py-3 min-h-[48px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 ${
            isPlaying === 'dubbed'
              ? 'bg-green-600 text-white shadow-lg shadow-green-600/30'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
          }`}
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
            {isPlaying === 'dubbed' ? (
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
          <span className="text-sm sm:text-base">{isPlaying === 'dubbed' ? 'Pause Dubbed' : 'Play Dubbed'}</span>
        </button>

        <button
          onClick={() => handlePlayPause('both')}
          className={`flex-1 px-3 sm:px-4 py-4 sm:py-3 min-h-[48px] rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 md:flex-[0.8] ${
            isPlaying === 'both'
              ? 'bg-[#7C5DFA] text-white shadow-lg shadow-[#7C5DFA]/30'
              : 'bg-[#2A2A2A] text-gray-300 hover:bg-[#3A3A2A]'
          }`}
        >
          <svg className="w-5 h-5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 24 24">
            {isPlaying === 'both' ? (
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            ) : (
              <path d="M8 5v14l11-7z" />
            )}
          </svg>
          <span className="text-sm sm:text-base hidden sm:inline">{isPlaying === 'both' ? 'Pause Both' : 'Play Together'}</span>
          <span className="text-sm sm:hidden">{isPlaying === 'both' ? 'Pause Both' : 'Both'}</span>
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