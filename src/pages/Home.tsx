import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Play, Pause, ArrowRight, Disc, ShoppingBag, X, Maximize2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { motion, AnimatePresence } from 'framer-motion';

export const Home: React.FC = () => {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useStore();
  const { tracks, homeContent } = useSiteStore();
  const heroImage = homeContent?.heroImageUrl || '/src/assets/images/manga_hero_splash_1792583199243.jpg';
  const albumTitle = homeContent?.albumTitle || 'MIDNIGHT ECHOES';
  const albumSubtitle = homeContent?.albumSubtitle || 'DARK ORCHESTRA × MODULAR SYNTH';
  const bannerTag = homeContent?.bannerTag || '【 巻頭 】 VOL. 01';
  const featuredTrack = (homeContent?.featuredTrackId && tracks.find(t => t.id === homeContent.featuredTrackId)) || tracks[0];

  const [isCoverFullScreen, setIsCoverFullScreen] = useState(false);

  const panelSettings = homeContent?.panelSettings || {
    heroHeight: 'standard',
    mangaCardSize: 'standard',
    cornerCutSize: 'standard',
    shadowDepth: 'standard',
    storeGridDensity: 'standard'
  };

  // Dynamic Panel Sizing Configurations
  const heroHeightClass = {
    compact: 'aspect-[21/9] max-h-[360px] sm:max-h-[420px]',
    cinematic: 'aspect-[16/9] max-h-[620px] sm:max-h-[720px]',
    standard: 'aspect-[16/9] sm:aspect-[21/9] max-h-[500px] sm:max-h-[560px]'
  }[panelSettings.heroHeight || 'standard'];

  const heroClipPath = {
    subtle: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
    deep: 'polygon(0 0, calc(100% - 18px) 0, 100% 18px, 100% 100%, 18px 100%, 0 calc(100% - 18px))',
    standard: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
  }[panelSettings.cornerCutSize || 'standard'];

  const cardClipPath = {
    subtle: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
    deep: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
    standard: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
  }[panelSettings.cornerCutSize || 'standard'];

  const heroShadowClass = {
    flat: 'shadow-[2px_2px_0_#00FF66] sm:shadow-[4px_4px_0_#00FF66]',
    deep: 'shadow-[6px_6px_0_#00FF66] sm:shadow-[12px_12px_0_#00FF66]',
    standard: 'shadow-[4px_4px_0_#00FF66] sm:shadow-[8px_8px_0_#00FF66]'
  }[panelSettings.shadowDepth || 'standard'];

  const cardShadowClass = {
    flat: 'shadow-[2px_2px_0_#00FF66] sm:shadow-[3px_3px_0_#00FF66] hover:shadow-[2px_2px_0_#ffffff] sm:hover:shadow-[3px_3px_0_#ffffff]',
    deep: 'shadow-[5px_5px_0_#00FF66] sm:shadow-[9px_9px_0_#00FF66] hover:shadow-[5px_5px_0_#ffffff] sm:hover:shadow-[9px_9px_0_#ffffff]',
    standard: 'shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] hover:shadow-[3px_3px_0_#ffffff] sm:hover:shadow-[6px_6px_0_#ffffff]'
  }[panelSettings.shadowDepth || 'standard'];

  const thumbnailAspectClass = {
    compact: 'aspect-[16/10]',
    large: 'aspect-[1/1]',
    standard: 'aspect-[4/3]'
  }[panelSettings.mangaCardSize || 'standard'];

  const captionPaddingClass = {
    compact: 'p-2 sm:p-2.5',
    large: 'p-3.5 sm:p-5',
    standard: 'p-2.5 sm:p-4'
  }[panelSettings.mangaCardSize || 'standard'];

  const titleSizeClass = {
    compact: 'text-xs sm:text-base',
    large: 'text-base sm:text-xl',
    standard: 'text-sm sm:text-lg'
  }[panelSettings.mangaCardSize || 'standard'];

  const handlePlayFeatured = () => {
    playSelectSound();
    if (!featuredTrack) return;
    if (currentTrack?.id === featuredTrack.id) {
      togglePlayPause();
    } else {
      playTrack(featuredTrack);
    }
  };

  // Click on main image: play song & expand cover art full screen
  const handleMainImageClick = () => {
    playSelectSound();
    if (featuredTrack) {
      if (currentTrack?.id !== featuredTrack.id || !isPlaying) {
        playTrack(featuredTrack);
      }
    }
    setIsCoverFullScreen(true);
  };

  // Close full screen on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCoverFullScreen) {
        setIsCoverFullScreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCoverFullScreen]);

  return (
    <div className="flex flex-col w-full relative z-10 font-sans pb-16">
      
      {/* Hero: Minimalist Japanese Manga Splash Panel (巻頭見開き) */}
      <section className="px-2 xs:px-3 sm:px-8 pt-4 sm:pt-8 pb-6 sm:pb-10 max-w-[1440px] mx-auto w-full">
        <div 
          className={`relative bg-black border-2 border-white ${heroShadowClass} overflow-hidden group transition-all duration-300`}
          style={{
            clipPath: heroClipPath
          }}
        >
          {/* Main Visual: Clicking plays the song AND puts cover art as full screen */}
          <div 
            onClick={handleMainImageClick}
            onMouseEnter={playHoverSound}
            className={`relative ${heroHeightClass} w-full overflow-hidden bg-black cursor-pointer group/art transition-all duration-300`}
            title="Click to play music and expand cover art full screen"
          >
            <img 
              src={heroImage} 
              alt={`${albumTitle} Manga Hero Splash - Click to expand full screen`} 
              className="w-full h-full object-cover object-center grayscale contrast-125 group-hover/art:scale-102 group-hover/art:grayscale-0 transition-all duration-700"
            />
            
            {/* Subtle screentone texture overlay */}
            <div className="absolute inset-0 manga-screentone-neon opacity-10 pointer-events-none"></div>
            
            {/* Dark vignette gradient for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>

            {/* Top Manga Header Stamp */}
            <div className="absolute top-2.5 left-2.5 sm:top-6 sm:left-6 flex items-center gap-1.5 sm:gap-2 z-10 pointer-events-none">
              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
                {bannerTag}
              </span>
              <span className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white text-black font-game font-black text-[10px] sm:text-xs uppercase tracking-wider hidden xs:inline-block">
                ZEJI // 公式
              </span>
            </div>

            {/* Fullscreen Expand Prompt Badge */}
            <div className="absolute top-2.5 right-2.5 sm:top-6 sm:right-6 z-10 flex items-center gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-black/90 border border-white sm:border-2 text-white group-hover/art:border-[#00FF66] group-hover/art:text-[#00FF66] transition-all shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66] text-[9px] sm:text-xs font-mono font-bold">
              <Maximize2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span className="hidden sm:inline">CLICK IMAGE TO PLAY & EXPAND FULLSCREEN</span>
              <span className="sm:hidden">EXPAND & PLAY</span>
            </div>

            {/* Bottom Minimal Overlay with Title & Actions */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-8 sm:left-8 sm:right-8 flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 z-10">
              <div onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                  {/* Razor-sharp bold Japanese characters with clean contrast */}
                  <span className="text-base sm:text-3xl [font-family:var(--font-manga)] font-black text-[#00FF66] tracking-tight drop-shadow-[2px_2px_0_#000000]">
                    ドォン！
                  </span>
                  <span className="text-[9px] sm:text-xs font-mono text-zinc-300 font-bold uppercase tracking-widest truncate">
                    {albumSubtitle}
                  </span>
                </div>
                
                {/* Crystal clear heading with mobile responsive typography */}
                <h1 className="text-2xl xs:text-3xl sm:text-6xl lg:text-7xl font-game font-black tracking-tight text-white uppercase leading-none drop-shadow-[3px_3px_0_#000000]">
                  {albumTitle}
                </h1>
              </div>

              {/* Minimal Action Buttons - Fitted for mobile without overflowing */}
              <div className="flex items-center gap-2 sm:gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button 
                  onClick={handlePlayFeatured}
                  onMouseEnter={playHoverSound}
                  disabled={!featuredTrack}
                  className="px-3.5 xs:px-5 sm:px-8 py-2 sm:py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-black shadow-[2px_2px_0_#ffffff] sm:shadow-[4px_4px_0_#ffffff] hover:shadow-[2px_2px_0_#00FF66] active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                  }}
                >
                  {(isPlaying && currentTrack?.id === featuredTrack?.id) ? (
                    <>
                      <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                      <span>PAUSE // 停止</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                      <span>PLAY // 再生</span>
                    </>
                  )}
                </button>

                <Link 
                  to="/store"
                  onMouseEnter={playHoverSound}
                  onClick={playSelectSound}
                  className="px-3.5 xs:px-5 sm:px-8 py-2 sm:py-3 bg-black hover:bg-white text-white hover:text-black font-game font-black text-[11px] sm:text-sm uppercase tracking-wider transition-all flex items-center gap-1.5 sm:gap-2 border-2 border-white hover:border-[#00FF66] shadow-[2px_2px_0_#00FF66] sm:shadow-[4px_4px_0_#00FF66] hover:shadow-[2px_2px_0_#ffffff] active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                  }}
                >
                  <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FF66] group-hover:text-black" />
                  <span>STORE // 店</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-Screen Cover Art Modal / Lightbox */}
      <AnimatePresence>
        {isCoverFullScreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsCoverFullScreen(false)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8 cursor-zoom-out select-none"
          >
            {/* Top Action Bar with Prominent Close Button */}
            <div className="absolute top-4 right-4 sm:top-6 sm:right-8 z-50 flex items-center gap-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  playSelectSound();
                  setIsCoverFullScreen(false);
                }}
                onMouseEnter={playHoverSound}
                className="px-4 py-2 bg-white text-black font-game font-black text-xs uppercase tracking-wider flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#00FF66] hover:bg-[#00FF66] transition-colors"
                title="Close (ESC)"
              >
                <X className="w-4 h-4" />
                <span>CLOSE // 閉じる (ESC)</span>
              </button>
            </div>

            {/* High-Resolution Full-Screen Art Panel */}
            <motion.div
              initial={{ scale: 0.94 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.94 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-5xl max-h-[85vh] w-full border-4 border-white bg-black shadow-[0_0_50px_rgba(0,255,102,0.4)] overflow-hidden cursor-default flex flex-col"
            >
              {/* Full Art Container */}
              <div className="flex-1 w-full overflow-hidden bg-black flex items-center justify-center">
                <img 
                  src={heroImage}
                  alt={`${albumTitle} Fullscreen Cover Art`}
                  className="w-full h-auto max-h-[75vh] object-contain block mx-auto"
                />
              </div>

              {/* Bottom Art Player Bar */}
              <div className="p-3.5 bg-black border-t-2 border-white flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-xs text-white">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-[#00FF66] text-black font-black text-[10px]">
                    NOW PLAYING
                  </span>
                  <span className="font-game font-bold text-sm tracking-wider text-white">
                    MIDNIGHT ECHOES // 轟音の調ベ
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayFeatured();
                    }}
                    onMouseEnter={playHoverSound}
                    className="px-4 py-1.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider flex items-center gap-2 border border-black shadow-[2px_2px_0_#ffffff] transition-all"
                  >
                    {isPlaying && currentTrack?.id === featuredTrack?.id ? (
                      <>
                        <Pause className="w-3.5 h-3.5 fill-current" />
                        <span>PAUSE</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        <span>PLAY TRACK</span>
                      </>
                    )}
                  </button>

                  <span className="text-zinc-400 text-[11px] hidden md:inline">
                    FULLSCREEN MANGA COVER ART
                  </span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Japanese Manga Style Panels Menu Grid (画像中心 コマ割りメニュー) */}
      {/* Japanese Manga Style Panels Menu Grid (画像中心 コマ割りメニュー) */}
      <section className="px-2 xs:px-3 sm:px-8 max-w-[1440px] mx-auto w-full">
        
        {/* Minimal Section Divider */}
        <div className="flex items-center justify-between mb-3 sm:mb-6 pb-2 sm:pb-3 border-b-2 border-white">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="px-1.5 sm:px-2 py-0.5 bg-white text-black font-mono font-black text-[10px] sm:text-[11px]">
              目次 // INDEX
            </span>
            <span className="text-xs sm:text-sm font-game font-black text-white uppercase tracking-wider">
              MANGA SECTOR PANELS
            </span>
          </div>
          <span className="text-[10px] sm:text-xs font-mono text-[#00FF66] font-bold">
            コマを選択 // SELECT
          </span>
        </div>

        {/* 4-Panel Asymmetrical Manga Grid - High Visual Dominance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          
          {/* Panel 01: SOUND / 音 */}
          <Link
            to="/music"
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className={`group relative flex flex-col bg-black border-2 border-white hover:border-[#00FF66] transition-all ${cardShadowClass} hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden`}
            style={{
              clipPath: cardClipPath
            }}
          >
            {/* Big Manga Artwork */}
            <div className={`relative ${thumbnailAspectClass} w-full overflow-hidden bg-black border-b-2 border-zinc-800 transition-all duration-300`}>
              <img 
                src="/src/assets/images/manga_sound_panel_1792583212523.jpg" 
                alt="Manga Sound Archive" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] text-[9px] sm:text-[10px] font-mono font-black shadow-[1px_1px_0_#ffffff]">
                第壱コマ // 01
              </span>
            </div>

            {/* Minimal Caption Box */}
            <div className={`${captionPaddingClass} flex items-center justify-between bg-black transition-all duration-300`}>
              <div>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#00FF66] font-bold block">
                  AUDIO ARCHIVE
                </span>
                <h3 className={`${titleSizeClass} font-game font-black text-white uppercase group-hover:text-[#00FF66] transition-colors`}>
                  01 音響 SOUND
                </h3>
              </div>
              <span className="p-1.5 sm:p-2 bg-white text-black group-hover:bg-[#00FF66] transition-colors border border-black shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
          </Link>

          {/* Panel 02: GEAR & MERCH / 店 */}
          <Link
            to="/store"
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className={`group relative flex flex-col bg-black border-2 border-white hover:border-[#00FF66] transition-all ${cardShadowClass} hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden`}
            style={{
              clipPath: cardClipPath
            }}
          >
            {/* Big Manga Artwork */}
            <div className={`relative ${thumbnailAspectClass} w-full overflow-hidden bg-black border-b-2 border-zinc-800 transition-all duration-300`}>
              <img 
                src="/src/assets/images/manga_gear_panel_1792583224309.jpg" 
                alt="Manga Gear Store" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] text-[9px] sm:text-[10px] font-mono font-black shadow-[1px_1px_0_#ffffff]">
                第弐コマ // 02
              </span>
            </div>

            {/* Minimal Caption Box */}
            <div className={`${captionPaddingClass} flex items-center justify-between bg-black transition-all duration-300`}>
              <div>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#00FF66] font-bold block">
                  ARMORY & MERCH
                </span>
                <h3 className={`${titleSizeClass} font-game font-black text-white uppercase group-hover:text-[#00FF66] transition-colors`}>
                  02 兵站 STORE
                </h3>
              </div>
              <span className="p-1.5 sm:p-2 bg-white text-black group-hover:bg-[#00FF66] transition-colors border border-black shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
          </Link>

          {/* Panel 03: WORLD TOUR / 巡 */}
          <Link
            to="/tour"
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className={`group relative flex flex-col bg-black border-2 border-white hover:border-[#00FF66] transition-all ${cardShadowClass} hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden`}
            style={{
              clipPath: cardClipPath
            }}
          >
            {/* Big Manga Artwork */}
            <div className={`relative ${thumbnailAspectClass} w-full overflow-hidden bg-black border-b-2 border-zinc-800 transition-all duration-300`}>
              <img 
                src="/src/assets/images/manga_tour_panel_1792583237044.jpg" 
                alt="Manga Tour Concert" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] text-[9px] sm:text-[10px] font-mono font-black shadow-[1px_1px_0_#ffffff]">
                第参コマ // 03
              </span>
            </div>

            {/* Minimal Caption Box */}
            <div className={`${captionPaddingClass} flex items-center justify-between bg-black transition-all duration-300`}>
              <div>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#00FF66] font-bold block">
                  LIVE EXPEDITION
                </span>
                <h3 className={`${titleSizeClass} font-game font-black text-white uppercase group-hover:text-[#00FF66] transition-colors`}>
                  03 巡業 TOUR
                </h3>
              </div>
              <span className="p-1.5 sm:p-2 bg-white text-black group-hover:bg-[#00FF66] transition-colors border border-black shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
          </Link>

          {/* Panel 04: CONTACT & DISPATCH / 信 */}
          <Link
            to="/contact"
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className={`group relative flex flex-col bg-black border-2 border-white hover:border-[#00FF66] transition-all ${cardShadowClass} hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden`}
            style={{
              clipPath: cardClipPath
            }}
          >
            {/* Big Manga Artwork */}
            <div className={`relative ${thumbnailAspectClass} w-full overflow-hidden bg-black border-b-2 border-zinc-800 transition-all duration-300`}>
              <img 
                src="/src/assets/images/game_album_midnight_echoes_1792574038993.jpg" 
                alt="Manga Signal Dispatch" 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 group-hover:grayscale-0 transition-all duration-500"
              />
              <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] text-[9px] sm:text-[10px] font-mono font-black shadow-[1px_1px_0_#ffffff]">
                第四コマ // 04
              </span>
            </div>

            {/* Minimal Caption Box */}
            <div className={`${captionPaddingClass} flex items-center justify-between bg-black transition-all duration-300`}>
              <div>
                <span className="text-[9px] sm:text-[10px] font-mono text-[#00FF66] font-bold block">
                  TRANSMISSION
                </span>
                <h3 className={`${titleSizeClass} font-game font-black text-white uppercase group-hover:text-[#00FF66] transition-colors`}>
                  04 交信 CONTACT
                </h3>
              </div>
              <span className="p-1.5 sm:p-2 bg-white text-black group-hover:bg-[#00FF66] transition-colors border border-black shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
            </div>
          </Link>

        </div>
      </section>

    </div>
  );
};
