import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, VolumeX, Terminal, KeyRound } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { toggleSfx, isSfxMuted, playSelectSound, playHoverSound } from '../lib/gameSound';

export const GameFooterHUD: React.FC = () => {
  const { togglePlayPause, isPlaying, setIsCartOpen } = useStore();
  const { user, login, logout } = useSiteStore();
  const navigate = useNavigate();
  const muted = isSfxMuted();

  return (
    <footer className="relative z-20 border-t border-[#ffffff10] bg-[#08020e] text-[#888] font-hud text-[11px] py-4 px-4 sm:px-8">
      <div className="max-w-[1500px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Tactical Hotkey Prompts */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[#777]">
          <span className="flex items-center gap-1.5 text-[#aaa]">
            <KeyRound className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-wider font-bold text-white">CONTROLS:</span>
          </span>
          <button
            onClick={() => {
              playSelectSound();
              togglePlayPause();
            }}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#160624] border border-[#ffffff10] hover:border-[#D4AF37] text-white transition-colors"
          >
            <span className="text-[#D4AF37] font-bold">[SPACE]</span>
            <span>{isPlaying ? 'PAUSE AUDIO' : 'PLAY AUDIO'}</span>
          </button>

          <button
            onClick={() => {
              toggleSfx();
              playSelectSound();
            }}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#160624] border border-[#ffffff10] hover:border-[#D4AF37] text-white transition-colors"
          >
            <span className="text-[#00F0FF] font-bold">[M]</span>
            <span>SFX {muted ? 'OFF' : 'ON'}</span>
          </button>

          <button
            onClick={() => {
              playSelectSound();
              setIsCartOpen(true);
            }}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-[#160624] border border-[#ffffff10] hover:border-[#D4AF37] text-white transition-colors"
          >
            <span className="text-[#D4AF37] font-bold">[7]</span>
            <span>INVENTORY</span>
          </button>
        </div>

        {/* Center: System Status */}
        <div className="text-[10px] text-[#555] tracking-widest uppercase text-center">
          &copy; {new Date().getFullYear()} ZEJI MUSIC CORP &bull; SYSTEM PROTOCOL 9.4
        </div>

        {/* Right: Root Console / Auth */}
        <div className="flex items-center gap-4 text-[10px]">
          <button
            onClick={() => {
              playSelectSound();
              if (user) {
                logout();
              } else {
                login();
              }
            }}
            onMouseEnter={playHoverSound}
            className="hover:text-white transition-colors flex items-center gap-1 text-[#666]"
          >
            <Terminal className="w-3 h-3" />
            <span>{user ? `ADMIN [${user.email?.split('@')[0]}] (LOGOUT)` : 'DEV ACCESS'}</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
