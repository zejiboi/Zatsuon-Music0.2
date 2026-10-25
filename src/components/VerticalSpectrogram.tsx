import React, { useEffect, useRef } from 'react';
import { audioVisualizer } from '../lib/audioVisualizer';

interface VerticalSpectrogramProps {
  side: 'left' | 'right';
  isPlaying: boolean;
  className?: string;
}

export const VerticalSpectrogram: React.FC<VerticalSpectrogramProps> = ({
  side,
  isPlaying,
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;

      const width = canvas.width;
      const height = canvas.height;

      // Deep manga black background with slight alpha
      ctx.fillStyle = 'rgba(5, 5, 5, 0.92)';
      ctx.fillRect(0, 0, width, height);

      // Subtle screentone grid lines
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y += 14) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      const { data, peaks } = audioVisualizer.getFrequencyData(isPlaying);
      const barCount = Math.min(28, data.length);
      const gap = 2;
      const totalGap = gap * (barCount - 1);
      const barHeight = Math.max(3, (height - totalGap) / barCount);

      for (let i = 0; i < barCount; i++) {
        // Map frequency bands from bottom (sub bass) to top (air / highs)
        // i = 0 is lowest frequency bin -> placed at the bottom
        const binIndex = i;
        const val = data[binIndex] || 0;
        const peak = peaks[binIndex] || 0;

        const maxBarWidth = width - 4;
        const barWidth = Math.max(2, (val / 255) * maxBarWidth);
        const peakWidth = Math.max(2, (peak / 255) * maxBarWidth);

        // Y position: bottom-up
        const y = height - ((i + 1) * (barHeight + gap));

        if (side === 'left') {
          // LEFT SIDE: Base at left (0), bars extend rightwards
          const x = 0;

          if (barWidth > 3) {
            const grad = ctx.createLinearGradient(0, 0, barWidth, 0);
            grad.addColorStop(0, '#00441a');
            grad.addColorStop(0.7, '#00FF66');
            grad.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
          } else {
            ctx.fillStyle = '#1c1c1e';
            ctx.fillRect(x, y, 2, barHeight);
          }

          // Peak marker cap
          if (peak > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(Math.min(width - 3, peakWidth), y, 2.5, barHeight);
            ctx.fillStyle = '#00FF66';
            ctx.fillRect(Math.max(0, peakWidth - 2), y, 1.5, barHeight);
          }
        } else {
          // RIGHT SIDE: Mirrored! Base at right (width), bars extend leftwards
          const x = width - barWidth;
          const peakX = width - peakWidth;

          if (barWidth > 3) {
            const grad = ctx.createLinearGradient(width, 0, x, 0);
            grad.addColorStop(0, '#00441a');
            grad.addColorStop(0.7, '#00FF66');
            grad.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
          } else {
            ctx.fillStyle = '#1c1c1e';
            ctx.fillRect(width - 2, y, 2, barHeight);
          }

          // Peak marker cap (Mirrored on left of peak)
          if (peak > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(Math.max(1, peakX), y, 2.5, barHeight);
            ctx.fillStyle = '#00FF66';
            ctx.fillRect(Math.min(width, peakX + 2), y, 1.5, barHeight);
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [side, isPlaying]);

  return (
    <aside
      aria-label={`Vertical Spectrogram ${side === 'left' ? 'Left Channel' : 'Right Channel'}`}
      className={`fixed top-14 sm:top-16 bottom-20 sm:bottom-24 z-30 pointer-events-none flex flex-col justify-between select-none ${
        side === 'left'
          ? 'left-0 border-r border-white/60 sm:border-r-2 sm:border-white shadow-[1px_0_0_#00FF66] sm:shadow-[3px_0_0_#00FF66]'
          : 'right-0 border-l border-white/60 sm:border-l-2 sm:border-white shadow-[-1px_0_0_#00FF66] sm:shadow-[-3px_0_0_#00FF66]'
      } ${className}`}
    >
      {/* Top Manga Channel Badge - Hidden on mobile, visible on sm+ */}
      <div
        className={`hidden sm:flex px-1 py-1 bg-black border-b border-zinc-800 text-[8px] font-mono font-bold flex-col items-center ${
          side === 'left' ? 'text-[#00FF66]' : 'text-white'
        }`}
      >
        <span className="[writing-mode:vertical-rl] tracking-widest uppercase">
          {side === 'left' ? 'FFT・L' : 'FFT・R'}
        </span>
        <span className="text-[7px] text-zinc-500 mt-1">
          {side === 'left' ? '左' : '右'}
        </span>
      </div>

      {/* Main Real-Time 60FPS Mirrored Spectrogram Canvas */}
      <div className="flex-1 w-full relative overflow-hidden bg-black/80">
        <canvas
          ref={canvasRef}
          width={40}
          height={380}
          className="w-full h-full block"
        />
      </div>

      {/* Bottom Frequency Range Indicator - Hidden on mobile, visible on sm+ */}
      <div className="hidden sm:block px-1 py-1 bg-black border-t border-zinc-800 text-[7px] font-mono text-zinc-500 text-center">
        <span>32Hz</span>
      </div>
    </aside>
  );
};
