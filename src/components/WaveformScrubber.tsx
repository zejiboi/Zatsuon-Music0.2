import React, { useState, useEffect, useRef, useMemo } from 'react';
import { generateWaveformData, getTrackWaveform } from '../lib/waveformUtils';

interface WaveformScrubberProps {
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  trackId?: string;
  trackTitle?: string;
  audioUrl?: string;
  barCount?: number;
  className?: string;
}

export const WaveformScrubber: React.FC<WaveformScrubberProps> = ({
  currentTime,
  duration,
  onSeek,
  trackId = 'track',
  trackTitle = 'Track',
  audioUrl = '',
  barCount = 52,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [waveformPeaks, setWaveformPeaks] = useState<number[]>(() =>
    generateWaveformData(trackTitle || trackId, barCount)
  );
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update waveform peaks if track changes
  useEffect(() => {
    let active = true;
    getTrackWaveform(audioUrl || trackId, trackTitle, barCount).then(peaks => {
      if (active && peaks && peaks.length > 0) {
        setWaveformPeaks(peaks);
      }
    });
    return () => {
      active = false;
    };
  }, [trackId, trackTitle, audioUrl, barCount]);

  const progress = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const formatTime = (secs: number) => {
    if (!secs || isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const calculateSeekTime = (clientX: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * (duration || 0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    const seekTime = calculateSeekTime(e.clientX);
    onSeek(seekTime);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverProgress(ratio);

    if (isDragging) {
      onSeek(ratio * (duration || 0));
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging) {
      setHoverProgress(null);
    }
  };

  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setHoverProgress(null);
      }
    };
    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const playedBarIndex = Math.floor(progress * waveformPeaks.length);
  const hoverBarIndex = hoverProgress !== null ? Math.floor(hoverProgress * waveformPeaks.length) : null;

  return (
    <div className={`w-full select-none ${className}`}>
      {/* Waveform Bars Container */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative h-9 sm:h-10 flex items-center gap-[2px] cursor-pointer group py-1"
        title="Click or drag to seek"
      >
        {waveformPeaks.map((peak, idx) => {
          const isPlayed = idx <= playedBarIndex;
          const isHovered = hoverBarIndex !== null && idx <= hoverBarIndex;
          const isExactPlayHead = idx === playedBarIndex;
          const isExactHoverHead = hoverBarIndex !== null && idx === hoverBarIndex;

          const heightPercent = Math.max(16, Math.min(100, Math.round(peak * 100)));

          return (
            <div
              key={idx}
              className="flex-1 h-full flex items-center justify-center relative"
            >
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[5px] rounded-[1px] transition-all duration-75 ${
                  isPlayed
                    ? 'bg-[#00FF66] shadow-[0_0_6px_rgba(0,255,102,0.6)]'
                    : isHovered
                    ? 'bg-zinc-400'
                    : 'bg-zinc-800 hover:bg-zinc-700'
                } ${isExactPlayHead ? 'ring-1 ring-white bg-white scale-y-110 shadow-[0_0_8px_#ffffff]' : ''}`}
              />
            </div>
          );
        })}

        {/* Hover Time Tooltip */}
        {hoverProgress !== null && duration > 0 && (
          <div
            className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] font-mono text-[9px] font-bold pointer-events-none shadow-[2px_2px_0_#ffffff] z-20"
            style={{ left: `${hoverProgress * 100}%` }}
          >
            {formatTime(hoverProgress * duration)}
          </div>
        )}

        {/* Current Scanhead Needle */}
        <div
          className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none shadow-[0_0_8px_#00FF66] z-10 transition-all duration-75"
          style={{ left: `${progress * 100}%` }}
        >
          <div className="w-2 h-2 -top-1 -left-[3px] absolute bg-[#00FF66] border border-black rotate-45" />
        </div>
      </div>

      {/* Timestamp readouts */}
      <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 mt-0.5">
        <span className="text-[#00FF66] font-bold">{formatTime(currentTime)}</span>
        <span className="tracking-widest text-[9px] uppercase text-zinc-600 hidden sm:inline">
          PEAK AMPLITUDE DYNAMICS
        </span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
};
