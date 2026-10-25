import React, { useMemo } from 'react';
import { generateWaveformData } from '../lib/waveformUtils';

interface WaveformMiniPreviewProps {
  trackTitle: string;
  trackId?: string;
  isPlaying?: boolean;
  barCount?: number;
  className?: string;
}

export const WaveformMiniPreview: React.FC<WaveformMiniPreviewProps> = ({
  trackTitle,
  trackId = 'track',
  isPlaying = false,
  barCount = 24,
  className = ''
}) => {
  const peaks = useMemo(() => {
    return generateWaveformData(trackTitle || trackId, barCount);
  }, [trackTitle, trackId, barCount]);

  return (
    <div className={`flex items-center gap-[1.5px] h-6 select-none ${className}`} title="Waveform preview">
      {peaks.map((peak, i) => {
        const heightPercent = Math.max(20, Math.round(peak * 100));
        return (
          <div
            key={i}
            className="flex-1 h-full flex items-center justify-center"
          >
            <div
              style={{
                height: `${heightPercent}%`,
                animationDelay: isPlaying ? `${(i * 0.05).toFixed(2)}s` : undefined
              }}
              className={`w-full max-w-[3px] rounded-[0.5px] transition-all ${
                isPlaying
                  ? 'bg-[#00FF66] animate-pulse'
                  : 'bg-zinc-700 hover:bg-zinc-500'
              }`}
            />
          </div>
        );
      })}
    </div>
  );
};
