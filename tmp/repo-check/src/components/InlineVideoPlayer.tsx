import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, RotateCcw } from 'lucide-react';

interface InlineVideoPlayerProps {
  src: string;
  poster?: string;
  fileName?: string;
  isMe?: boolean;
  onExpand?: () => void;
}

export const InlineVideoPlayer: React.FC<InlineVideoPlayerProps> = ({
  src,
  poster,
  fileName,
  isMe,
  onExpand
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [hasError, setHasError] = useState(false);

  const effectiveSrc = (!src || src.startsWith('[File Attachment'))
    ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
    : src;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);
    const handleError = () => {
      setHasError(true);
      // If error occurs with local src, fallback src
      if (video.src !== 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4') {
        video.src = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        video.load();
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [effectiveSrc]);

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (!video.paused) {
      video.pause();
    } else {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Autoplay / play prevented:", err);
          // Fallback: enable native controls so user can play directly
          video.controls = true;
        });
      }
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    const seekTime = parseFloat(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="relative rounded-xl overflow-hidden max-w-[280px] sm:max-w-xs md:max-w-sm w-full bg-black border border-neutral-250/50 dark:border-neutral-800/80 shadow-xs group select-none my-0.5"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onClick={(e) => {
        if ((e.target as HTMLElement).tagName !== 'BUTTON' && (e.target as HTMLElement).tagName !== 'INPUT') {
          togglePlay(e);
        }
      }}
    >
      <video
        ref={videoRef}
        src={effectiveSrc}
        poster={poster}
        playsInline
        preload="metadata"
        className="w-full max-h-56 md:max-h-64 object-cover cursor-pointer block"
      />

      {/* Center Play Overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center cursor-pointer transition-opacity">
          <button
            onClick={(e) => togglePlay(e)}
            className="p-3 rounded-full bg-white/90 dark:bg-neutral-900/90 text-neutral-900 dark:text-white shadow-lg hover:scale-110 active:scale-95 transition-all cursor-pointer"
            title="Play Video"
          >
            <Play className="h-5 w-5 fill-current ml-0.5" />
          </button>
        </div>
      )}

      {/* Top bar info */}
      <div className={`absolute top-0 inset-x-0 p-2 bg-gradient-to-b from-black/70 to-transparent flex items-center justify-between text-white transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        <span className="text-[10px] font-medium truncate max-w-[170px] drop-shadow">
          {fileName || 'Video'}
        </span>
        {onExpand && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExpand();
            }}
            className="p-1 rounded-md bg-black/40 hover:bg-black/60 text-white backdrop-blur-xs transition-colors cursor-pointer"
            title="Full Screen / Media Player"
          >
            <Maximize2 className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className={`absolute bottom-0 inset-x-0 p-2 bg-gradient-to-t from-black/85 via-black/50 to-transparent flex flex-col gap-1 text-white transition-opacity ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0'}`}>
        {/* Scrub Bar */}
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:h-1.5 transition-all"
        />

        <div className="flex items-center justify-between pt-0.5 text-[10px]">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => togglePlay(e)}
              className="p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-3 w-3 fill-current" /> : <Play className="h-3 w-3 fill-current" />}
            </button>

            <button
              onClick={toggleMute}
              className="p-0.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-3 w-3 text-rose-400" /> : <Volume2 className="h-3 w-3" />}
            </button>

            <span className="font-mono text-[9px] opacity-90">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <span className="text-[8px] px-1 py-0.5 rounded bg-white/20 font-semibold backdrop-blur">
            HD
          </span>
        </div>
      </div>
    </div>
  );
};
