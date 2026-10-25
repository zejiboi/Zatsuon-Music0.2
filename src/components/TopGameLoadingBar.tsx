import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { playLevelLoadSound, playSelectSound } from '../lib/gameSound';

interface RouteSectorMap {
  code: string;
  jp: string;
}

const ROUTE_SECTORS: Record<string, RouteSectorMap> = {
  '/': { code: 'SEC-01', jp: '作戦' },
  '/music': { code: 'SEC-02', jp: '音響' },
  '/tour': { code: 'SEC-03', jp: '巡業' },
  '/store': { code: 'SEC-04', jp: '兵站' },
  '/blog': { code: 'SEC-05', jp: '速報' },
  '/contact': { code: 'SEC-06', jp: '交信' },
  '/cart': { code: 'SEC-07', jp: '精算' },
  '/admin': { code: 'SEC-00', jp: '特権' },
};

export const TopGameLoadingBar: React.FC = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sectorInfo, setSectorInfo] = useState<RouteSectorMap>({ code: 'SEC-01', jp: '作戦' });
  const isFirstMount = useRef(true);
  const prevPath = useRef(location.pathname);
  const timerRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timerRef.current.forEach((t) => clearTimeout(t));
    timerRef.current = [];
  };

  useEffect(() => {
    // Skip animation on initial page boot
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevPath.current = location.pathname;
      return;
    }

    // Only trigger when pathname actually changes
    if (location.pathname === prevPath.current) return;
    prevPath.current = location.pathname;

    clearTimers();
    const sector = ROUTE_SECTORS[location.pathname] || { code: 'SEC-0X', jp: '転送' };
    setSectorInfo(sector);
    setIsLoading(true);
    setProgress(18);

    // Audio cue
    playLevelLoadSound();

    // Fast, crisp arcade game meter acceleration
    const t1 = setTimeout(() => {
      setProgress(58);
    }, 60);

    const t2 = setTimeout(() => {
      setProgress(86);
    }, 140);

    const t3 = setTimeout(() => {
      setProgress(100);
    }, 240);

    const t4 = setTimeout(() => {
      setIsLoading(false);
    }, 420);

    timerRef.current = [t1, t2, t3, t4];

    return clearTimers;
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed top-0 left-0 right-0 z-[100] pointer-events-none select-none"
        >
          {/* Main Top Bar Outer Track */}
          <div className="relative w-full h-[3.5px] bg-black/80 backdrop-blur-sm overflow-hidden">
            
            {/* Background Segment Grid Ticks */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none z-10"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, #00FF66 0, #00FF66 2px, transparent 2px, transparent 12px)'
              }}
            ></div>

            {/* Glowing Neon Green Progress Fill */}
            <motion.div
              className="h-full bg-[#00FF66] relative shadow-[0_0_12px_#00FF66,0_0_24px_rgba(0,255,102,0.6)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: [0.16, 1, 0.3, 1], duration: 0.12 }}
            >
              {/* White Incandescent Leading Edge Laser Tip */}
              <div className="absolute top-0 bottom-0 right-0 w-3 bg-white shadow-[0_0_8px_#ffffff,0_0_14px_#00FF66]"></div>

              {/* High-speed diagonal scanline shimmer */}
              <div 
                className="absolute inset-0 opacity-40"
                style={{
                  backgroundImage: 'repeating-linear-gradient(-45deg, #000 0, #000 2px, transparent 2px, transparent 6px)'
                }}
              ></div>
            </motion.div>
          </div>

          {/* Minimalist Floating HUD Reticle Badge (Upper Right Corner) */}
          <motion.div 
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-[3.5px] right-3 sm:right-6 flex items-center gap-1.5 px-2 py-0.5 bg-black border-x border-b border-white text-[9px] font-mono text-white shadow-[2px_2px_0_#00FF66]"
          >
            <span className="w-1.5 h-1.5 bg-[#00FF66] rounded-full animate-ping"></span>
            <span className="text-[#00FF66] font-bold">{sectorInfo.code}</span>
            <span className="text-zinc-500">/</span>
            <span className="[font-family:var(--font-manga)] font-bold text-white">{sectorInfo.jp}</span>
            <span className="text-zinc-500">/</span>
            <span className="text-zinc-300 font-bold tracking-wider">{progress}%</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
