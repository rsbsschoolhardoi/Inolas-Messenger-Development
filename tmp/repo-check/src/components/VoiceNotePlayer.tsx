import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic } from 'lucide-react';
import { generateSyntheticVoiceNote } from '../audioUtils';

interface VoiceNotePlayerProps {
  audioUrl?: string;
  durationStr?: string;
  isMe?: boolean;
  isSentDark?: boolean;
  messageId: string;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({
  audioUrl,
  durationStr = '0:05',
  isMe,
  isSentDark = true,
  messageId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [durationSec, setDurationSec] = useState(5);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [effectiveAudioSrc, setEffectiveAudioSrc] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Parse initial duration string
  useEffect(() => {
    if (durationStr) {
      const parts = durationStr.split(':');
      if (parts.length === 2) {
        const secs = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        if (!isNaN(secs) && secs > 0) {
          setDurationSec(secs);
        }
      }
    }
  }, [durationStr]);

  // Determine effective audio source
  useEffect(() => {
    if (audioUrl && (audioUrl.startsWith('data:audio') || audioUrl.startsWith('blob:') || audioUrl.startsWith('http'))) {
      setEffectiveAudioSrc(audioUrl);
    } else {
      // Generate synthetic vocal preview if audio url is missing or placeholder
      const synthUrl = generateSyntheticVoiceNote(durationSec || 4);
      setEffectiveAudioSrc(synthUrl);
    }
  }, [audioUrl, durationSec]);

  // Manage audio element lifecycle
  useEffect(() => {
    if (!effectiveAudioSrc) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    const audio = new Audio();
    audio.preload = 'metadata';
    audio.src = effectiveAudioSrc;
    audio.playbackRate = playbackRate;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDurationSec(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      if (audio.duration && audio.duration > 0) {
        setCurrentTimeSec(audio.currentTime);
        setPlaybackProgress(Math.min(1, audio.currentTime / audio.duration));
      }
    };

    const onEnded = () => {
      setIsPlaying(false);
      setPlaybackProgress(0);
      setCurrentTimeSec(0);
      audio.currentTime = 0;
    };

    const onError = () => {
      console.warn("Audio element notice for message:", messageId);
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    audioRef.current = audio;

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audioRef.current = null;
    };
  }, [effectiveAudioSrc, messageId]);

  // Play / Pause toggle
  const togglePlay = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!audioRef.current) {
      const src = effectiveAudioSrc || audioUrl || generateSyntheticVoiceNote(durationSec);
      audioRef.current = new Audio(src);
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        audio.playbackRate = playbackRate;
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Audio play catch, fallback retry:", err);
        try {
          audio.currentTime = 0;
          await audio.play();
          setIsPlaying(true);
        } catch (e2) {
          setIsPlaying(false);
        }
      }
    }
  };

  // Seek audio along waveform
  const handleSeek = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const ratio = idx / waveformBars.length;
    const targetTime = ratio * durationSec;
    
    if (audioRef.current && durationSec > 0) {
      audioRef.current.currentTime = targetTime;
      setCurrentTimeSec(targetTime);
      setPlaybackProgress(ratio);
      if (!isPlaying) {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  // Speed Cycle
  const cycleSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatSecs = (s: number) => {
    if (isNaN(s) || !isFinite(s)) return durationStr;
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 24 fixed heights for aesthetic waveform
  const waveformBars = [30, 60, 45, 90, 75, 40, 85, 95, 50, 70, 40, 80, 100, 65, 85, 45, 90, 60, 40, 75, 55, 35, 60, 40];

  return (
    <div className="flex items-center gap-2.5 py-1 px-0.5 min-w-[230px] md:min-w-[260px] select-none">
      {/* Play/Pause round button */}
      <button
        onClick={togglePlay}
        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-all active:scale-95 cursor-pointer ${
          isMe
            ? isSentDark
              ? 'bg-white text-indigo-600 hover:bg-neutral-100'
              : 'bg-emerald-700 text-white hover:bg-emerald-800'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
        }`}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 fill-current" />
        ) : (
          <Play className="h-4 w-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Time Info */}
      <div className="flex-1 flex flex-col gap-1 min-w-0">
        {/* Dynamic Waveform Bars */}
        <div className="flex items-center gap-0.5 h-6 cursor-pointer">
          {waveformBars.map((barHeight, idx) => {
            const barProgress = idx / waveformBars.length;
            const isFilled = playbackProgress >= barProgress;

            return (
              <div
                key={idx}
                onClick={(e) => handleSeek(idx, e)}
                className={`flex-1 rounded-full transition-all duration-150 cursor-pointer ${
                  isFilled
                    ? isMe
                      ? isSentDark
                        ? 'bg-white shadow-2xs scale-y-105'
                        : 'bg-emerald-700 dark:bg-emerald-800 scale-y-105'
                      : 'bg-indigo-600 dark:bg-indigo-400 scale-y-105'
                    : isMe
                    ? isSentDark
                      ? 'bg-white/40'
                      : 'bg-emerald-950/20'
                    : 'bg-neutral-300 dark:bg-neutral-700'
                }`}
                style={{
                  height: `${isPlaying && isFilled ? Math.min(100, barHeight + ((idx % 4) * 8)) : barHeight}%`,
                }}
              />
            );
          })}
        </div>

        {/* Footer: Time and Speed Toggle */}
        <div className="flex items-center justify-between text-[10px] font-mono opacity-90">
          <div className="flex items-center gap-1">
            <Mic className="h-3 w-3" />
            <span>
              {isPlaying ? formatSecs(currentTimeSec) : formatSecs(durationSec)}
            </span>
          </div>

          <button
            onClick={cycleSpeed}
            className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors cursor-pointer ${
              isMe
                ? isSentDark
                  ? 'bg-white/20 hover:bg-white/30 text-white'
                  : 'bg-black/10 hover:bg-black/15 text-slate-800'
                : 'bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 text-neutral-700 dark:text-neutral-300'
            }`}
            title="Playback Speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
