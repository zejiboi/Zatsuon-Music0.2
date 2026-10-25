import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Music, Sliders, ChevronDown, Radio, Sparkles } from 'lucide-react';
import { useDarkOrchestra } from '../lib/useDarkOrchestra';
import { OrchestraPreset, darkOrchestra } from '../lib/darkOrchestraEngine';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { motion, AnimatePresence } from 'motion/react';

interface PresetItem {
  id: OrchestraPreset;
  title: string;
  tagline: string;
  keySig: string;
  instruments: string;
}

const PRESETS: PresetItem[] = [
  {
    id: 'GOTHIC_REQUIEM',
    title: 'GOTHIC REQUIEM',
    tagline: 'Deep cellos, ancient stone cathedral choir, minor 9th tension',
    keySig: 'D MINOR / DORIAN',
    instruments: 'Contrabass, Violoncelli, Cathedral Organ, Swell Reverb'
  },
  {
    id: 'ABYSS_CHAMBER',
    title: 'ABYSS CHAMBER',
    tagline: 'Sub-bass contrabass drone, dissonant string harmonics, eerie bells',
    keySig: 'C MINOR ELEGY',
    instruments: 'Sub Contra 32Hz, Viola Cluster, Resonant Tympani'
  },
  {
    id: 'BLOOD_OVERTURE',
    title: 'BLOOD OVERTURE',
    tagline: 'Cinematic dark brass crescendo, martial percussion pulse',
    keySig: 'F# MINOR WARFARE',
    instruments: 'French Horns, Low Brass, Kettle Drums, Staccato Strings'
  },
  {
    id: 'VOID_HARMONICS',
    title: 'VOID HARMONICS',
    tagline: 'Hypnotic minimalist bowing harmonics, zero-gravity drone',
    keySig: 'ASTRAL A MINOR',
    instruments: 'High String Harmonics, Detuned Saw-Drone, Space Delay'
  }
];

export const DarkOrchestraHUD: React.FC = () => {
  const {
    isPlaying,
    isUnlocked,
    volume,
    preset,
    currentChordName,
    toggle,
    setVolume,
    setPreset,
    unlock,
    getAnalyser
  } = useDarkOrchestra();

  const [isOpen, setIsOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Real-time Audio Spectrum / Waveform visualizer
  useEffect(() => {
    if (!isOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const analyser = getAnalyser();
    const bufferLength = analyser ? analyser.frequencyBinCount : 64;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animId = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = '#050505';
      ctx.fillRect(0, 0, width, height);

      if (analyser && isPlaying) {
        analyser.getByteFrequencyData(dataArray);

        // Draw frequency bands in high-contrast neon green with subtle glow
        const barWidth = (width / (bufferLength * 0.7)) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * (height - 6);

          ctx.fillStyle = i < 8 ? '#00FF66' : i < 24 ? '#00e65c' : '#00b347';
          ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

          // Peak cap highlight
          if (barHeight > 4) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x, height - barHeight, barWidth - 1, 1.5);
          }

          x += barWidth + 1;
          if (x > width) break;
        }

        // Draw center horizon grid line
        ctx.strokeStyle = 'rgba(0, 255, 102, 0.2)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height - 1);
        ctx.lineTo(width, height - 1);
        ctx.stroke();
      } else {
        // Idle heartbeat line when paused
        ctx.strokeStyle = '#27272a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();

        ctx.fillStyle = '#71717a';
        ctx.font = '10px Cinzel, Georgia, serif';
        ctx.textAlign = 'center';
        ctx.fillText('ORCHESTRAL ENGINE PAUSED', width / 2, height / 2 - 6);
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [isOpen, isPlaying, getAnalyser]);

  const currentPresetInfo = PRESETS.find(p => p.id === preset) || PRESETS[0];

  return (
    <>
      {/* First-visit audio prompt if browser suspended AudioContext */}
      {!isUnlocked && isPlaying && (
        <div 
          onClick={() => {
            unlock();
            playSelectSound();
          }}
          className="fixed top-16 left-0 right-0 z-40 bg-[#000000] border-b border-[#00FF66] py-2 px-4 cursor-pointer hover:bg-[#00FF66]/10 transition-colors shadow-[0_4px_20px_rgba(0,255,102,0.15)] flex items-center justify-center gap-3 text-xs font-game select-none"
        >
          <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-ping"></span>
          <span className="text-[#00FF66] tracking-widest font-bold">
            [CLICK ANYWHERE TO ENGAGE DARK ORCHESTRA AMBIENCE]
          </span>
          <span className="text-zinc-500 font-serif text-[11px] hidden sm:inline">
            Browser audio permission standby &bull; Tap to unlock soundstage
          </span>
        </div>
      )}

      {/* Main Bar Trigger Button Styled as Manga Audio Panel */}
      <div className="relative">
        <button
          onClick={() => {
            playSelectSound();
            unlock();
            setIsOpen(!isOpen);
          }}
          onMouseEnter={playHoverSound}
          className={`flex items-center gap-2 px-2.5 py-1.5 border-2 transition-all select-none ${
            isPlaying
              ? 'border-white bg-black text-white shadow-[2px_2px_0_#00FF66] hover:border-[#00FF66]'
              : 'border-zinc-800 bg-black text-zinc-400 hover:text-white hover:border-zinc-600'
          }`}
          style={{
            clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)'
          }}
          title="Dark Orchestra Ambient Audio Controls"
          aria-label="Toggle dark orchestra ambient audio panel"
        >
          {/* Animated Equalizer Wave Bars */}
          <div className="flex items-end gap-[2px] h-3.5 w-3.5 shrink-0">
            <span 
              className={`w-[2px] bg-[#00FF66] rounded-full transition-all ${
                isPlaying ? 'animate-[bounce_0.8s_ease-in-out_infinite] h-full' : 'h-1'
              }`}
            ></span>
            <span 
              className={`w-[2px] bg-[#00FF66] rounded-full transition-all ${
                isPlaying ? 'animate-[bounce_1.1s_ease-in-out_infinite_0.2s] h-4/5' : 'h-2'
              }`}
            ></span>
            <span 
              className={`w-[2px] bg-[#00FF66] rounded-full transition-all ${
                isPlaying ? 'animate-[bounce_0.9s_ease-in-out_infinite_0.4s] h-3/5' : 'h-1'
              }`}
            ></span>
          </div>

          <span className="text-[10px] font-mono font-bold tracking-wider text-white hidden sm:inline">
            <span className="text-[#00FF66] [font-family:var(--font-manga)] mr-1">『響』</span>
            {isPlaying ? 'ORCHESTRA' : 'MUTED'}
          </span>

          <ChevronDown className={`w-3.5 h-3.5 transition-transform text-[#00FF66] ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {/* HUD Dropdown Modal Panel: Manga Control Frame */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] bg-black border-2 border-white text-white p-4 shadow-[6px_6px_0_#00FF66] z-50 font-sans select-none relative overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
              }}
            >
              {/* Halftone Screentone Backdrop */}
              <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

              {/* Header */}
              <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3 mb-3 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs [font-family:var(--font-manga)] text-[#00FF66] font-bold">
                    【 旋律調整 】
                  </span>
                  <div>
                    <h3 className="font-game font-black text-sm tracking-widest text-white uppercase">
                      DARK ORCHESTRA
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-400">
                      PROCEDURAL SYMPHONIC DSP
                    </p>
                  </div>
                </div>

                {/* Primary Master Play/Pause Toggle */}
                <button
                  onClick={() => {
                    playSelectSound();
                    toggle();
                  }}
                  onMouseEnter={playHoverSound}
                  className={`px-3 py-1 font-game font-bold text-xs tracking-wider transition-all border ${
                    isPlaying
                      ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[0_0_12px_rgba(0,255,102,0.5)]'
                      : 'bg-black text-zinc-400 border-zinc-800 hover:text-white hover:border-[#00FF66]'
                  }`}
                >
                  {isPlaying ? 'ACTIVE' : 'PAUSED'}
                </button>
              </div>

              {/* Spectrum Analyser Display */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 mb-1 px-1">
                  <span>SPECTRUM [20Hz - 20kHz]</span>
                  <span className="text-[#00FF66]">{currentChordName}</span>
                </div>
                <div className="h-20 w-full border border-zinc-800 bg-[#000000] relative overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={80}
                    className="w-full h-full block"
                  />
                  <div className="absolute top-1 left-2 pointer-events-none text-[9px] font-mono text-[#00FF66]/70">
                    LIVE DSP SYNTHESIS
                  </div>
                </div>
              </div>

              {/* Volume Slider with Mute Button */}
              <div className="mb-4 bg-zinc-950 p-2.5 border border-zinc-900 rounded">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-game text-xs tracking-wider text-zinc-300 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#00FF66]" /> AMBIENT VOLUME
                  </span>
                  <span className="font-mono text-[#00FF66] text-xs font-bold">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      playSelectSound();
                      setVolume(volume > 0 ? 0 : 0.65);
                    }}
                    onMouseEnter={playHoverSound}
                    className="text-zinc-400 hover:text-[#00FF66] p-1 transition-colors"
                  >
                    {volume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-zinc-600" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#00FF66]"
                  />
                </div>
              </div>

              {/* Movement / Preset Selection */}
              <div>
                <div className="text-[10px] font-game tracking-wider uppercase text-zinc-400 mb-2 px-1 flex items-center justify-between">
                  <span>ORCHESTRAL MOVEMENTS</span>
                  <span className="text-[#00FF66]">4 COMPOSITIONS</span>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PRESETS.map((p) => {
                    const isSelected = preset === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          playSelectSound();
                          setPreset(p.id);
                        }}
                        onMouseEnter={playHoverSound}
                        className={`text-left p-2.5 border transition-all text-xs ${
                          isSelected
                            ? 'border-[#00FF66] bg-[#00FF66]/10 text-white shadow-[0_0_10px_rgba(0,255,102,0.15)]'
                            : 'border-zinc-900 bg-black/60 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-game font-bold tracking-wider ${isSelected ? 'text-[#00FF66]' : 'text-zinc-200'}`}>
                            {p.title}
                          </span>
                          <span className="font-mono text-[9px] text-zinc-400 px-1 py-0.5 border border-zinc-800 bg-zinc-900">
                            {p.keySig}
                          </span>
                        </div>
                        <p className="text-[11px] font-serif text-zinc-400 line-clamp-1">
                          {p.tagline}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer info */}
              <div className="mt-4 pt-3 border-t border-zinc-900 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                <span>PRESS [M] TO TOGGLE ALL AUDIO</span>
                <span className="text-[#00FF66]">CONTINUOUS AMBIENT</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};
