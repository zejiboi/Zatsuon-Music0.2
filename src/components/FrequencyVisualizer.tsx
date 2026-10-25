import React, { useEffect, useRef, useState } from 'react';
import { audioVisualizer } from '../lib/audioVisualizer';
import { Activity, BarChart2, Zap } from 'lucide-react';
import { playSelectSound } from '../lib/gameSound';

interface FrequencyVisualizerProps {
  isPlaying: boolean;
  currentTime?: number;
  mode?: 'compact' | 'full';
  className?: string;
}

export const FrequencyVisualizer: React.FC<FrequencyVisualizerProps> = ({
  isPlaying,
  currentTime = 0,
  mode = 'compact',
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visualMode, setVisualMode] = useState<'bars' | 'oscilloscope'>('bars');
  const [peakDb, setPeakDb] = useState<number>(-48);
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

      // Clear with deep manga black
      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      // Render subtle manga screentone grid
      ctx.strokeStyle = '#18181b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 0; y < height; y += 12) {
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(width, y + 0.5);
      }
      ctx.stroke();

      if (visualMode === 'bars') {
        const { data, peaks } = audioVisualizer.getFrequencyData(isPlaying, currentTime);
        const barCount = Math.min(32, data.length);
        const gap = 2;
        const totalGap = gap * (barCount - 1);
        const barWidth = Math.max(2, (width - totalGap) / barCount);

        let maxVal = 0;

        for (let i = 0; i < barCount; i++) {
          const val = data[i] || 0;
          if (val > maxVal) maxVal = val;
          const peak = peaks[i] || 0;

          const barHeight = Math.max(2, (val / 255) * (height - 8));
          const peakY = height - Math.max(2, (peak / 255) * (height - 8));
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Bar gradient / Neon Green with white hot tip
          if (barHeight > 4) {
            const grad = ctx.createLinearGradient(0, height, 0, y);
            grad.addColorStop(0, '#005522');
            grad.addColorStop(0.7, '#00FF66');
            grad.addColorStop(1, '#FFFFFF');
            ctx.fillStyle = grad;
            ctx.fillRect(x, y, barWidth, barHeight);
          } else {
            ctx.fillStyle = '#1c1c1e';
            ctx.fillRect(x, height - 2, barWidth, 2);
          }

          // Peak hold marker
          if (peak > 4) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(x, Math.max(0, peakY - 1), barWidth, 2);
            // Neon glow shadow for peak
            ctx.fillStyle = '#00FF66';
            ctx.fillRect(x, Math.max(0, peakY + 1), barWidth, 1);
          }
        }

        // Compute simulated dB readout
        const currentDb = maxVal > 0 ? Math.round(20 * Math.log10(maxVal / 255)) : -48;
        setPeakDb(prev => Math.max(currentDb, prev - 1));

      } else {
        // Oscilloscope mode
        const timeData = audioVisualizer.getTimeDomainData(isPlaying, currentTime);
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00FF66';
        ctx.shadowColor = '#00FF66';
        ctx.shadowBlur = 6;
        ctx.beginPath();

        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset
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
  }, [isPlaying, currentTime, visualMode]);

  return (
    <div className={`relative border border-zinc-700 bg-black overflow-hidden font-mono select-none ${className}`}>
      {/* HUD Header Bar */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-zinc-950 border-b border-zinc-800 text-[10px]">
        <div className="flex items-center gap-2">
          <span className="text-[#00FF66] font-bold tracking-wider flex items-center gap-1">
            <Zap className="w-3 h-3 fill-current" />
            <span className="[font-family:var(--font-manga)]">【 周波数 】</span>
            FFT SPECTROGRAM
          </span>
          <span className={`px-1 py-0.2 text-[9px] border ${isPlaying ? 'bg-[#00FF66] text-black border-[#00FF66] font-black animate-pulse' : 'bg-zinc-900 text-zinc-500 border-zinc-800'}`}>
            {isPlaying ? 'ACTIVE' : 'IDLE'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-zinc-400 text-[9px]">
            <span>PEAK:</span>
            <span className={peakDb > -6 ? 'text-[#00FF66] font-bold' : 'text-white'}>
              {peakDb > -48 ? `${peakDb} dB` : '-∞ dB'}
            </span>
          </div>

          {/* Mode Switchers */}
          <div className="flex items-center border border-zinc-800 bg-black">
            <button
              onClick={() => {
                playSelectSound();
                setVisualMode('bars');
              }}
              className={`p-1 hover:text-[#00FF66] transition-colors ${visualMode === 'bars' ? 'bg-[#00FF66] text-black font-bold' : 'text-zinc-500'}`}
              title="Graphic Equalizer Bars"
            >
              <BarChart2 className="w-3 h-3" />
            </button>
            <button
              onClick={() => {
                playSelectSound();
                setVisualMode('oscilloscope');
              }}
              className={`p-1 hover:text-[#00FF66] transition-colors ${visualMode === 'oscilloscope' ? 'bg-[#00FF66] text-black font-bold' : 'text-zinc-500'}`}
              title="Oscilloscope Beam"
            >
              <Activity className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative p-2 bg-[#050505]">
        <canvas
          ref={canvasRef}
          width={mode === 'compact' ? 320 : 540}
          height={mode === 'compact' ? 44 : 76}
          className="w-full h-full block border border-zinc-900"
        />

        {/* Frequency Band Indicators */}
        <div className="flex justify-between text-[8px] font-mono text-zinc-500 mt-1 px-1">
          <span>SUB 32Hz</span>
          <span>BASS 120Hz</span>
          <span>MID 1kHz</span>
          <span>PRES 4kHz</span>
          <span>AIR 16kHz</span>
        </div>
      </div>
    </div>
  );
};
