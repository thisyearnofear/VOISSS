import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  recordingId: string;
  onPlay?: () => void;
  onPause?: () => void;
  onSeek?: (time: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export function AudioPlayer({ 
  recordingId, 
  onPlay, 
  onPause, 
  onSeek,
  className,
  style 
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  const mockRecording = {
    id: recordingId,
    title: 'Sample Recording',
    duration: 180,
    audioUrl: `https://example.com/recordings/${recordingId}.mp3`
  };

  useEffect(() => {
    setDuration(mockRecording.duration);
  }, [mockRecording.duration]);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        onPause?.();
      } else {
        audioRef.current.play();
        onPlay?.();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      onSeek?.(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <div className={className} style={style}>
      <audio
        ref={audioRef}
        src={mockRecording.audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      
      <div style={{
        backgroundColor: '#1E1E24',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        margin: '0 auto',
        border: '1px solid #2A2A35',
        color: '#FFFFFF',
        fontFamily: 'system-ui, -apple-system, sans-serif'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            fontSize: '18px',
            fontWeight: '600',
            color: '#FFFFFF',
            marginBottom: '8px',
            textAlign: 'center',
            margin: '0 0 8px 0'
          }}>
            {mockRecording.title}
          </h3>
          
          <div style={{ 
            color: '#A0A0B0', 
            textAlign: 'center', 
            fontSize: '14px' 
          }}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '24px' }}>
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            style={{
              width: '100%',
              height: '4px',
              background: '#2A2A35',
              borderRadius: '2px',
              outline: 'none',
              cursor: 'pointer',
              appearance: 'none'
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '24px' 
        }}>
          <button
            onClick={togglePlayPause}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '32px',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backgroundColor: isPlaying ? '#4E7BFF' : '#7C5DFA',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}
          >
            {isPlaying ? (
              <Pause size={24} color="#FFFFFF" />
            ) : (
              <Play size={24} color="#FFFFFF" />
            )}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Volume2 size={20} color="#A0A0B0" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              defaultValue={1}
              style={{
                width: '60px',
                height: '4px',
                background: '#2A2A35',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AudioPlayer;
