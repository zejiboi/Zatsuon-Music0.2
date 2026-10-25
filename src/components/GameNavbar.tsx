import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { playHoverSound, playSelectSound } from '../lib/gameSound';

interface NavItemConfig {
  name: string;
  jp: string;
  chapter: string;
  path: string;
  sfxKatakana: string;
}

export const GameNavbar: React.FC = () => {
  const { cart, setIsCartOpen } = useStore();
  const { user } = useSiteStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdmin = user?.email === 'josephgitongaofficial@gmail.com';

  const navLinks: NavItemConfig[] = [
    { name: 'HOME', jp: '本', chapter: '零', path: '/', sfxKatakana: 'ドンッ' },
    { name: 'SOUND', jp: '音', chapter: '壱', path: '/music', sfxKatakana: 'ピピッ' },
    { name: 'STORE', jp: '店', chapter: '弐', path: '/store', sfxKatakana: 'ガチッ' },
    { name: 'TOUR', jp: '巡', chapter: '参', path: '/tour', sfxKatakana: 'ゴオオ' },
    { name: 'INTEL', jp: '報', chapter: '四', path: '/blog', sfxKatakana: 'シャッ' },
    { name: 'COMMS', jp: '信', chapter: '伍', path: '/contact', sfxKatakana: 'ピポッ' },
    ...(isAdmin ? [{ name: 'ADMIN', jp: '制', chapter: '特', path: '/admin', sfxKatakana: 'キーッ' }] : []),
  ];

  const totalCartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000] border-b-2 border-white select-none relative shadow-[0_4px_0_#00FF66]">
      {/* Subtle top manga screentone hairline accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-white opacity-80"></div>

      <div className="max-w-[1440px] mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-2">
        
        {/* Brand / Logo: Japanese Manga Ink Stamp Aesthetic */}
        <Link 
          to="/" 
          onMouseEnter={playHoverSound}
          onClick={playSelectSound}
          className="flex items-center gap-1.5 group shrink-0"
        >
          {/* Manga Ink Box Frame */}
          <div className="relative border-2 border-white bg-black px-2 py-0.5 sm:px-2.5 sm:py-1 transition-all group-hover:border-[#00FF66] shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <span className="text-[9px] sm:text-[10px] font-bold text-[#00FF66] tracking-tighter [font-family:var(--font-manga)]">
                ゼジ
              </span>
              <span 
                data-text="ZEJI"
                className="font-game font-black tracking-widest text-base sm:text-xl text-white game-glitch-text"
              >
                ZEJI
              </span>
            </div>
            {/* Corner registration crosshair */}
            <span className="absolute -top-1 -right-1 text-[7px] sm:text-[8px] text-[#00FF66] leading-none select-none font-mono">
              +
            </span>
          </div>
        </Link>

        {/* Center: High-Contrast Japanese Manga Style Panels for Menu Navigation */}
        <nav className="hidden lg:flex items-center gap-1.5 xl:gap-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.name}
                to={link.path}
                onMouseEnter={playHoverSound}
                onClick={playSelectSound}
                className={`relative px-3 xl:px-4 py-1.5 transition-all text-xs select-none group border-2 ${
                  isActive 
                    ? 'bg-white text-black border-white shadow-[3px_3px_0_#00FF66] translate-x-[-1px] translate-y-[-1px]' 
                    : 'bg-black text-white border-zinc-700 hover:border-white hover:text-[#00FF66] hover:shadow-[2px_2px_0_#00FF66]'
                }`}
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                }}
              >
                {/* Active Halftone Screentone overlay for active panel */}
                {isActive && (
                  <span className="absolute inset-0 manga-screentone-paper opacity-20 pointer-events-none"></span>
                )}

                <div className="flex items-center gap-1.5 relative z-10">
                  {/* Chapter Badge */}
                  <span className={`text-[9px] px-1 py-0.2 font-mono font-bold border ${
                    isActive 
                      ? 'bg-black text-[#00FF66] border-black' 
                      : 'bg-zinc-900 text-zinc-400 border-zinc-700 group-hover:text-white group-hover:border-[#00FF66]'
                  }`}>
                    {link.chapter}
                  </span>

                  {/* Main Title with subtle game glitch on hover */}
                  <span 
                    data-text={link.name}
                    className={`font-game font-extrabold tracking-wider text-[11px] xl:text-xs game-glitch-text ${
                      isActive ? 'text-black' : 'text-white'
                    }`}
                  >
                    {link.name}
                  </span>

                  {/* Japanese Kanji Label with subtle glitch */}
                  <span 
                    data-text={link.jp}
                    className={`text-[10px] [font-family:var(--font-manga)] tracking-tight font-bold game-glitch-text ${
                      isActive ? 'text-black/80 font-black' : 'text-[#00FF66]'
                    }`}
                  >
                    {link.jp}
                  </span>
                </div>

                {/* Floating Katakana Sound Effect on Hover */}
                <span className="absolute -top-3 right-0 text-[8px] font-bold text-[#00FF66] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none [font-family:var(--font-manga)] drop-shadow-[0_0_4px_#00FF66]">
                  {link.sfxKatakana}
                </span>
              </NavLink>
            );
          })}
        </nav>

        {/* Right Tools: Cart Requisition Box & Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Cart Trigger: Manga Armory Requisition Box */}
          <button
            onClick={() => {
              playSelectSound();
              setIsCartOpen(true);
            }}
            onMouseEnter={playHoverSound}
            className="relative px-2 py-1 sm:px-2.5 sm:py-1.5 border-2 border-white bg-black hover:bg-[#00FF66] text-white hover:text-black hover:border-[#00FF66] transition-all flex items-center gap-1 sm:gap-1.5 shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]"
            aria-label="Open cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] font-game font-bold hidden sm:inline">
              ARMORY
            </span>
            {totalCartCount > 0 && (
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-[#00FF66] text-black border border-black text-[9px] sm:text-[10px] font-black flex items-center justify-center shadow-[1px_1px_0_#ffffff]">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1 sm:p-1.5 border-2 border-white bg-black text-white hover:border-[#00FF66] hover:text-[#00FF66] transition-colors shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Japanese Manga Comic Menu Drawer (目次 // CHAPTER INDEX) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t-2 border-white bg-black px-3 py-3.5 sm:px-4 sm:py-5 shadow-[0_4px_0_#00FF66] relative overflow-hidden">
          {/* Subtle Screentone Backdrop */}
          <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

          {/* Manga Header Banner */}
          <div className="flex items-center justify-between pb-2 mb-2.5 sm:pb-3 sm:mb-3 border-b-2 border-zinc-800">
            <span className="text-[10px] sm:text-[11px] font-game font-black text-white tracking-widest flex items-center gap-1.5">
              <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 目次 】</span>
              PANEL INDEX
            </span>
            <span className="text-[8px] sm:text-[9px] font-mono text-[#00FF66] border border-[#00FF66] px-1.5 py-0.5">
              SELECT CHAPTER
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 relative z-10">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => {
                    playSelectSound();
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between p-2 sm:p-3 border-2 transition-all ${
                    isActive 
                      ? 'bg-white text-black border-white shadow-[2px_2px_0_#00FF66] sm:shadow-[3px_3px_0_#00FF66]' 
                      : 'bg-[#080808] text-white border-zinc-800 hover:border-white hover:bg-zinc-950 hover:shadow-[1px_1px_0_#00FF66]'
                  }`}
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                  }}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className={`text-[9px] sm:text-[10px] font-mono font-bold px-1 sm:px-1.5 py-0.5 border ${
                      isActive ? 'bg-black text-[#00FF66] border-black' : 'bg-black text-zinc-400 border-zinc-700'
                    }`}>
                      第{link.chapter}話
                    </span>
                    <div>
                      <span 
                        data-text={link.name}
                        className={`block font-game font-black text-xs sm:text-sm tracking-wider game-glitch-text ${
                          isActive ? 'text-black' : 'text-white'
                        }`}
                      >
                        {link.name}
                      </span>
                      <span 
                        data-text={link.jp}
                        className={`text-[9px] sm:text-[10px] [font-family:var(--font-manga)] font-bold game-glitch-text ${
                          isActive ? 'text-black/80' : 'text-[#00FF66]'
                        }`}
                      >
                        {link.jp}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] sm:text-[11px] font-bold [font-family:var(--font-manga)] ${
                    isActive ? 'text-black' : 'text-zinc-600'
                  }`}>
                    {link.sfxKatakana} &rarr;
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
