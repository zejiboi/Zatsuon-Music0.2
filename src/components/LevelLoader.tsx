import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { playLevelLoadSound, playLevelCompleteSound } from '../lib/gameSound';
import { darkOrchestra } from '../lib/darkOrchestraEngine';

export interface SectorInfo {
  sectorNum: string;
  jpChapter: string;
  jpTitle: string;
  code: string;
  title: string;
  description: string;
  coordinates: string;
}

const SECTOR_DATA: Record<string, SectorInfo> = {
  '/': {
    sectorNum: '01',
    jpChapter: '第壱章',
    jpTitle: '作戦指令本部',
    code: 'SEC-01 // COMMAND',
    title: 'CENTRAL COMMAND',
    description: 'Direct mission hub, priority transmissions & audio core.',
    coordinates: '34°03\'08"N 118°14\'37"W',
  },
  '/music': {
    sectorNum: '02',
    jpChapter: '第弐章',
    jpTitle: '音響記録庫',
    code: 'SEC-02 // ACOUSTICS',
    title: 'AUDIO REPOSITORY',
    description: 'Master frequency stems, lossless archives & vinyl discography.',
    coordinates: '51°30\'26"N 00°07\'39"W',
  },
  '/tour': {
    sectorNum: '03',
    jpChapter: '第参章',
    jpTitle: '世界遠征戦線',
    code: 'SEC-03 // EXPEDITION',
    title: 'WORLD TOUR SECTORS',
    description: 'Live stadium coordinates, radar tracking & mission passes.',
    coordinates: '35°41\'22"N 139°41\'30"E',
  },
  '/store': {
    sectorNum: '04',
    jpChapter: '第四章',
    jpTitle: '兵站補給所',
    code: 'SEC-04 // ARMORY',
    title: 'ARMORY & PROVISIONS',
    description: 'Tactical apparel, hardware vinyl releases & limited supply.',
    coordinates: '40°42\'46"N 74°00\'22"W',
  },
  '/blog': {
    sectorNum: '05',
    jpChapter: '第伍章',
    jpTitle: '技術記録報',
    code: 'SEC-05 // INTEL',
    title: 'INTEL & DISPATCHES',
    description: 'Field logs, classified studio blueprints & official bulletins.',
    coordinates: '52°31\'12"N 13°24\'18"E',
  },
  '/contact': {
    sectorNum: '06',
    jpChapter: '第六章',
    jpTitle: '直接交信回線',
    code: 'SEC-06 // COMMS',
    title: 'DIRECT COMMS RELAY',
    description: 'Satellite uplink for booking, press clearance & inquiries.',
    coordinates: '37°46\'39"N 122°25\'10"W',
  },
  '/cart': {
    sectorNum: '07',
    jpChapter: '第七章',
    jpTitle: '装備精算所',
    code: 'SEC-07 // LOGISTICS',
    title: 'EQUIPMENT CHECKOUT',
    description: 'Requisition inventory review, tactical freight & manifest.',
    coordinates: '45°30\'31"N 122°40\'39"W',
  },
  '/admin': {
    sectorNum: '08',
    jpChapter: '第零章',
    jpTitle: '特権制御室',
    code: 'SEC-08 // PROTOCOL',
    title: 'ROOT OVERRIDE',
    description: 'System master console, authorized cryptographic terminal.',
    coordinates: '00°00\'00"N 00°00\'00"E',
  },
};

const TACTICAL_TIPS = [
  'PRESS [1] - [6] ANYWHERE: Instant tactical warp between all major sectors.',
  'PRESS [O] TO ENGAGE: Toggle ambient dark orchestral synthesis in the background.',
  'SPACEBAR HOTKEY: Play or pause the high-definition audio deck at any time.',
  'PRESS [M] TO TOGGLE AUDIO: Mute or activate the synthesized SFX matrix.',
  'ARMORY PROVISIONS: Physical merchandise drops are limited runs with encrypted tags.',
  'TOUR RADAR: Orbital stage dates include verified live ticketing links.',
  'TACTICAL CART: Press [ESC] at any time to instantly collapse the equipment deck.',
  'HIGH CONTRAST HUD: Visual matrix calibrated in pure black and 0x00FF66 neon emerald.',
  'AUDIO DECK: Current track playback persists across all sector transitions seamlessly.',
];

interface LevelLoaderProps {
  pathname: string;
  isActive: boolean;
  onComplete: () => void;
}

export const LevelLoader: React.FC<LevelLoaderProps> = ({
  pathname,
  isActive,
  onComplete,
}) => {
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(TACTICAL_TIPS[0]);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const hasFinishedRef = useRef(false);

  const sector: SectorInfo = SECTOR_DATA[pathname] || {
    sectorNum: '0X',
    jpChapter: '第零話',
    jpTitle: '移動空間',
    code: 'SEC-UNKNOWN',
    title: 'NAVIGATION TRANSITION',
    description: 'Routing coordinates through tactical proxy network...',
    coordinates: '00°00\'00"N 00°00\'00"E',
  };

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      hasFinishedRef.current = false;
      return;
    }

    // Pick random lore tip
    const randomTip = TACTICAL_TIPS[Math.floor(Math.random() * TACTICAL_TIPS.length)];
    setCurrentTip(randomTip);
    setProgress(0);
    hasFinishedRef.current = false;
    startTimeRef.current = null;

    // Trigger audio effect
    playLevelLoadSound();

    const DURATION = 480; // snappy, cinematic 480ms transition

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const linearPct = Math.min(elapsed / DURATION, 1);
      
      // Easing curve: quick start, slight pause around 75%, fast snap to 100%
      let easedPct = linearPct;
      if (linearPct < 0.4) {
        easedPct = linearPct * 1.5;
      } else if (linearPct < 0.8) {
        easedPct = 0.6 + (linearPct - 0.4) * 0.75;
      } else {
        easedPct = 0.9 + (linearPct - 0.8) * 0.5;
      }

      const displayPct = Math.min(Math.round(easedPct * 100), 100);
      setProgress(displayPct);

      if (linearPct < 1) {
        animationFrameRef.current = requestAnimationFrame(step);
      } else {
        if (!hasFinishedRef.current) {
          hasFinishedRef.current = true;
          setProgress(100);
          playLevelCompleteSound();
          setTimeout(() => {
            onComplete();
          }, 100);
        }
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    // Keyboard or click skip handler
    const handleSkip = () => {
      darkOrchestra.unlockContext();
      if (!hasFinishedRef.current) {
        hasFinishedRef.current = true;
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        setProgress(100);
        playLevelCompleteSound();
        onComplete();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        handleSkip();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, pathname, onComplete]);

  // Telemetry status message based on current progress
  const getStatusText = (val: number) => {
    if (val < 25) return 'CALIBRATING SECTOR FREQUENCIES...';
    if (val < 55) return 'INITIALIZING LEVEL BUFFER & TEXTURES...';
    if (val < 85) return 'SYNCHRONIZING TACTICAL RADAR MESH...';
    if (val < 100) return 'FINALIZING LEVEL ENTRY CLEARANCE...';
    return 'WARP SEQUENCE COMPLETE // READY';
  };

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.01 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="fixed inset-0 z-[60] bg-[#000000] flex flex-col justify-between p-6 sm:p-10 md:p-16 select-none cursor-pointer overflow-hidden"
          onClick={() => {
            if (!hasFinishedRef.current) {
              hasFinishedRef.current = true;
              setProgress(100);
              playLevelCompleteSound();
              onComplete();
            }
          }}
          title="Click to expedite warp"
        >
          {/* Subtle Ambient High-Contrast Neon Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-[#00FF66] opacity-[0.04] blur-[150px] pointer-events-none"></div>

          {/* Tactical Screen Corner HUD Reticles */}
          <div className="absolute top-4 left-4 sm:top-8 sm:left-8 w-6 h-6 border-t-2 border-l-2 border-[#00FF66] pointer-events-none"></div>
          <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-6 h-6 border-t-2 border-r-2 border-[#00FF66] pointer-events-none"></div>
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 w-6 h-6 border-b-2 border-l-2 border-[#00FF66] pointer-events-none"></div>
          <div className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 w-6 h-6 border-b-2 border-r-2 border-[#00FF66] pointer-events-none"></div>

          {/* Top Telemetry Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#00FF66] rotate-45 animate-ping"></span>
              <span className="w-2.5 h-2.5 bg-[#00FF66] rotate-45 -ml-5.5"></span>
              <span className="font-hud font-bold text-xs sm:text-sm tracking-widest text-[#00FF66]">
                WARP PROTOCOL: ACTIVE
              </span>
            </div>

            <div className="flex items-center gap-4 text-xs font-hud text-zinc-500">
              <span>LAT/LONG: {sector.coordinates}</span>
              <span className="hidden md:inline">&bull;</span>
              <span className="hidden md:inline text-zinc-400">FPS: 60 // V-SYNC ON</span>
            </div>
          </div>

          {/* Center Stage: Level Sector Title & Level Loading Bar */}
          <div className="relative z-10 max-w-4xl w-full mx-auto my-auto py-8 flex flex-col items-center text-center">
            
            {/* Manga Sector Chapter Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-black border-2 border-white text-white font-mono text-xs font-bold uppercase mb-4 shadow-[3px_3px_0_#00FF66]">
              <span className="text-[#00FF66] [font-family:var(--font-manga)]">{sector.jpChapter || '第壱章'}</span>
              <span>&bull;</span>
              <span>{sector.code}</span>
              <span>&bull;</span>
              <span className="text-[#00FF66] [font-family:var(--font-manga)]">{sector.jpTitle || '作戦本部'}</span>
            </div>

            {/* Major Level Title */}
            <h1 className="font-game font-black text-3xl sm:text-5xl md:text-6xl text-white tracking-widest uppercase mb-8 drop-shadow-[4px_4px_0_#000000]">
              {sector.title}
            </h1>

            {/* Level Loading Bar Container */}
            <div className="w-full max-w-2xl bg-[#050505] border-2 border-[#00FF66] p-1 shadow-[0_0_25px_rgba(0,255,102,0.2)] relative">
              
              {/* Outer decorative notches */}
              <div className="absolute -top-1.5 left-2 w-3 h-0.5 bg-[#00FF66]"></div>
              <div className="absolute -top-1.5 right-2 w-3 h-0.5 bg-[#00FF66]"></div>
              <div className="absolute -bottom-1.5 left-2 w-3 h-0.5 bg-[#00FF66]"></div>
              <div className="absolute -bottom-1.5 right-2 w-3 h-0.5 bg-[#00FF66]"></div>

              {/* Inner Meter Track */}
              <div className="relative h-6 sm:h-7 bg-zinc-950 overflow-hidden flex items-center">
                {/* Neon Green Fill Meter */}
                <div
                  className="h-full bg-[#00FF66] transition-all duration-75 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Subtle diagonal stripe mask over the fill bar */}
                  <div 
                    className="absolute inset-0 opacity-20"
                    style={{
                      backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 5px, transparent 5px, transparent 10px)'
                    }}
                  ></div>

                  {/* High intensity glowing leading edge tip */}
                  <div className="absolute top-0 bottom-0 right-0 w-2 bg-white shadow-[0_0_12px_#00FF66]"></div>
                </div>

                {/* 20 Segment Block Grids across the bar to mimic classic video game health/loading chunks */}
                <div 
                  className="absolute inset-0 grid pointer-events-none"
                  style={{ gridTemplateColumns: 'repeat(20, minmax(0, 1fr))' }}
                >
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="border-r border-black/40 h-full"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Telemetry Readout under the bar */}
            <div className="w-full max-w-2xl mt-3 flex items-center justify-between text-xs font-hud">
              <span className="text-zinc-400 tracking-wider flex items-center gap-2">
                <span className="inline-block w-1.5 h-1.5 bg-[#00FF66] animate-pulse"></span>
                {getStatusText(progress)}
              </span>
              <span className="text-[#00FF66] font-bold tracking-widest text-sm">
                [{progress.toString().padStart(3, '0')}%]
              </span>
            </div>
          </div>

          {/* Bottom Bar: Tactical Lore Intel & Expedite prompt */}
          <div className="relative z-10 border-t border-zinc-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-zinc-400 max-w-xl text-left">
              <span className="px-1.5 py-0.5 bg-[#00FF66]/20 text-[#00FF66] font-hud text-[10px] tracking-wider font-bold border border-[#00FF66]/40">
                INTEL
              </span>
              <span className="font-serif italic text-zinc-300 text-xs sm:text-sm">
                "{currentTip}"
              </span>
            </div>

            <div className="font-hud text-zinc-500 text-[11px] tracking-widest flex items-center gap-1.5 whitespace-nowrap">
              <span>[ PRESS ANY KEY OR CLICK TO EXPEDITE ]</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
