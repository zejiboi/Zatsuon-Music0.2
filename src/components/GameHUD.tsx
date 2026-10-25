import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Volume2, VolumeX, ShoppingBag, Radio, Shield, Terminal } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { isSfxMuted, toggleSfx, playHoverSound, playSelectSound } from '../lib/gameSound';

export const GameHUD: React.FC = () => {
  const { cart, setIsCartOpen, currentTrack, isPlaying, togglePlayPause, getCartTotal } = useStore();
  const { user } = useSiteStore();
  const [sfxActive, setSfxActive] = useState(!isSfxMuted());
  const location = useLocation();
  const isAdmin = user?.email === 'josephgitongaofficial@gmail.com';

  const handleToggleSfx = () => {
    const newState = toggleSfx();
    setSfxActive(newState);
  };

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0a0212]/90 backdrop-blur-md border-b border-[#ffffff12] text-[#e0e0e0]">
      {/* Top Telemetry Strip */}
      <div className="max-w-[1500px] mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between text-[11px] font-hud tracking-wider border-b border-[#ffffff08]">
        {/* Left: Player ID & Level */}
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className="flex items-center gap-2 group text-white hover:text-[#D4AF37] transition-colors"
          >
            <span className="w-2 h-2 bg-[#D4AF37] rotate-45 group-hover:scale-125 transition-transform"></span>
            <span className="font-bold tracking-widest text-sm text-white">ZEJI<span className="text-[#D4AF37]">:</span>SYS</span>
          </Link>
          <span className="text-[#555] hidden sm:inline">|</span>
          <div className="hidden sm:flex items-center gap-2 text-[#888]">
            <span>PILOT:</span>
            <span className="text-white font-bold">ZEJI</span>
            <span className="px-1.5 py-0.2 bg-[#D4AF37]/15 text-[#D4AF37] border border-[#D4AF37]/30 text-[9px] rounded-sm font-bold">
              LVL 99
            </span>
          </div>
          <span className="text-[#555] hidden md:inline">|</span>
          <div className="hidden md:flex items-center gap-2 text-[#888]">
            <span>SYSTEM:</span>
            <span className="text-[#00F0FF] font-bold">OPTIMAL</span>
          </div>
        </div>

        {/* Center: Live Sound Deck Teaser */}
        <div className="flex items-center gap-3">
          {currentTrack ? (
            <button
              onClick={() => {
                playSelectSound();
                togglePlayPause();
              }}
              onMouseEnter={playHoverSound}
              className="flex items-center gap-2.5 px-3 py-1 bg-[#160626] border border-[#ffffff15] hover:border-[#D4AF37] rounded transition-colors text-left"
            >
              <div className="flex items-end gap-0.5 h-3">
                <span className={`w-0.5 bg-[#D4AF37] ${isPlaying ? 'animate-bounce h-3' : 'h-1.5'}`} style={{ animationDuration: '600ms' }}></span>
                <span className={`w-0.5 bg-[#D4AF37] ${isPlaying ? 'animate-bounce h-2' : 'h-2'}`} style={{ animationDuration: '800ms' }}></span>
                <span className={`w-0.5 bg-[#D4AF37] ${isPlaying ? 'animate-bounce h-3.5' : 'h-1'}`} style={{ animationDuration: '450ms' }}></span>
              </div>
              <span className="text-white font-medium max-w-[120px] sm:max-w-[200px] truncate text-[10px]">
                {currentTrack.title}
              </span>
              <span className="text-[#888] text-[9px] uppercase hidden sm:inline">
                [{isPlaying ? 'PLAYING' : 'PAUSED'}]
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-[#666] text-[10px]">
              <Radio className="w-3 h-3 text-[#555]" />
              <span className="hidden sm:inline">DECK READY &bull; SELECT A TRACK</span>
            </div>
          )}
        </div>

        {/* Right: Audio SFX Switch & Inventory Requisition */}
        <div className="flex items-center gap-4">
          {/* SFX Switch */}
          <button
            onClick={handleToggleSfx}
            onMouseEnter={playHoverSound}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[10px] font-bold uppercase transition-colors ${
              sfxActive 
                ? 'bg-[#18082a] border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black' 
                : 'bg-transparent border-[#ffffff15] text-[#666] hover:text-white'
            }`}
            title="Toggle Menu Sound Effects"
          >
            {sfxActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">SFX {sfxActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Inventory / Cart */}
          <button
            onClick={() => {
              playSelectSound();
              setIsCartOpen(true);
            }}
            onMouseEnter={playHoverSound}
            className="flex items-center gap-2 px-3 py-1 bg-[#18082a] border border-[#ffffff15] hover:border-[#D4AF37] rounded transition-colors text-white group"
            aria-label="Open Inventory Requisition"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold tracking-wider">
              INV [{totalCartCount}]
            </span>
            {totalCartCount > 0 && (
              <span className="text-[#D4AF37] font-bold text-[10px] hidden md:inline">
                ${getCartTotal().toFixed(0)}
              </span>
            )}
          </button>

          {isAdmin && (
            <Link
              to="/admin"
              onMouseEnter={playHoverSound}
              onClick={playSelectSound}
              className={`p-1.5 rounded border ${location.pathname === '/admin' ? 'bg-[#ff0055] border-[#ff0055] text-white' : 'border-[#ffffff15] text-[#888] hover:text-white'} transition-colors`}
              title="Developer Command Override"
            >
              <Terminal className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
