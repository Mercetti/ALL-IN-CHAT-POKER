import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';

interface AudioPlayerProps {
  src: string;
  name: string;
  duration?: string;
  className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, name, duration, className = '' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration_, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(null);
      setIsLoading(false);
      setIsLoaded(true);
      console.log('Audio metadata loaded:', audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = (event: any) => {
      console.error('Audio error:', event);
      if (event.target.error.code === event.target.error.MEDIA_ERR_NOT_SUPPORTED) {
        setError('Audio format not supported');
      } else {
        setError('Audio unavailable');
      }
      setIsPlaying(false);
      setIsLoading(false);
      setIsLoaded(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setError(null);
      setIsLoaded(false);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
      setIsLoaded(true);
    };

    const handleStalled = () => {
      console.log('Audio stalled - trying to reload');
      // Try to reload if stalled
      if (audio.src) {
        audio.load();
      }
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('stalled', handleStalled);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('stalled', handleStalled);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        setIsLoading(true);
        await audio.play();
        setIsPlaying(true);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to play audio:', err);
        setError('Failed to play audio');
        setIsLoading(false);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Convert regular audio URL to streaming URL
  const streamingSrc = src.replace('/uploads/audio/', '/uploads/audio/stream/');

  if (error) {
    return (
      <div className={`audio-player error ${className}`}>
        <div className="audio-preview-card">
          <div className="audio-icon">🎵</div>
          <div className="audio-info">
            <div className="audio-name">{name}</div>
            <div className="audio-duration">{duration || 'Unknown duration'}</div>
            <div className="audio-error">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`audio-player ${className}`}>
      <audio
        ref={audioRef}
        preload="metadata"
        style={{ display: 'none' }}
      >
        <source src={streamingSrc} type="audio/wav" />
        <source src={src} type="audio/mpeg" />
        <source src={src} type="audio/wav" />
        <source src={src} type="audio/mp3" />
        Your browser does not support the audio element.
      </audio>
      
      <div className="audio-preview-card">
        <div className="audio-controls">
          <button 
            className="play-button"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner">⟳</div>
            ) : isPlaying ? (
              <div className="pause-icon">⏸️</div>
            ) : (
              <div className="play-icon">▶️</div>
            )}
          </button>
          
          <div className="audio-info">
            <div className="audio-name">{name}</div>
            <div className="audio-time">
              {formatTime(currentTime)} / {formatTime(duration_)}
            </div>
            {isLoading && <div className="loading-status">Loading...</div>}
            {!isLoaded && !isLoading && <div className="loading-status">Ready</div>}
          </div>
        </div>
        
        {duration_ > 0 && (
          <div className="audio-progress">
            <input
              type="range"
              min="0"
              max={duration_}
              value={currentTime}
              onChange={handleSeek}
              className="progress-slider"
            />
            <div 
              className="progress-bar"
              style={{ width: `${(currentTime / duration_) * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AudioPlayer;
