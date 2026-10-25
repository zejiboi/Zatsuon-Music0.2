import React, { useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import { GameNavbar } from './GameNavbar';
import { MediaPlayer } from './MediaPlayer';
import { CartSidebar } from './CartSidebar';
import { TopGameLoadingBar } from './TopGameLoadingBar';
import { SoundAndAISidebar } from './SoundAndAISidebar';
import { AIChatbot } from './AIChatbot';
import { VerticalSpectrogram } from './VerticalSpectrogram';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { useDarkOrchestra } from '../lib/useDarkOrchestra';
import { motion, AnimatePresence } from 'motion/react';
import { toggleSfx, playSelectSound, setupMenuSoundListeners } from '../lib/gameSound';
import { darkOrchestra } from '../lib/darkOrchestraEngine';

export const Layout: React.FC = () => {
  const { isPlaying, togglePlayPause, setIsCartOpen } = useStore();
  const { isPlaying: isOrchestraPlaying } = useDarkOrchestra();
  const { user, logout } = useSiteStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  // Universal click & hover sound listeners
  useEffect(() => {
    const cleanup = setupMenuSoundListeners();
    return cleanup;
  }, []);

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  // Game menu hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName)) {
        return;
      }

      if (e.key === ' ') {
        e.preventDefault();
        togglePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSfx();
      } else if (e.key === 'o' || e.key === 'O') {
        playSelectSound();
        darkOrchestra.toggle();
      } else if (e.key === '1') {
        playSelectSound();
        navigate('/');
      } else if (e.key === '2') {
        playSelectSound();
        navigate('/music');
      } else if (e.key === '3') {
        playSelectSound();
        navigate('/tour');
      } else if (e.key === '4') {
        playSelectSound();
        navigate('/store');
      } else if (e.key === '5') {
        playSelectSound();
        navigate('/blog');
      } else if (e.key === '6') {
        playSelectSound();
        navigate('/contact');
      } else if (e.key === 'Escape') {
        setIsCartOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate, togglePlayPause, setIsCartOpen]);

  const hasAudioActive = isPlaying || isOrchestraPlaying;

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#000000] text-[#f4f4f5] relative selection:bg-[#00FF66] selection:text-black overflow-x-hidden">
      {/* Top Viewport Loading Bar */}
      <TopGameLoadingBar />

      {/* Mirrored Vertical Spectrogram Visualizers on Left & Right Edges */}
      <VerticalSpectrogram 
        side="left" 
        isPlaying={hasAudioActive} 
        className="w-1.5 sm:w-7 md:w-10"
      />
      <VerticalSpectrogram 
        side="right" 
        isPlaying={hasAudioActive} 
        className="w-1.5 sm:w-7 md:w-10"
      />

      {/* Ambient Green Depth Glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
        <div className="absolute top-[-15%] left-[-10%] w-[600px] h-[600px] bg-[#00FF66] opacity-[0.07] rounded-full blur-[160px]"></div>
        <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] bg-[#00FF66] opacity-[0.05] rounded-full blur-[180px]"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Game Menu Header */}
        <GameNavbar />

        {/* Dynamic Route Screen Viewport with optimized mobile and tablet spacing */}
        <main className="flex-grow flex flex-col relative pb-28 sm:pb-32 px-2 xs:px-3 sm:px-8 md:px-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="flex-grow flex flex-col"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Manga Panel Footer */}
        <footer className="border-t-2 border-white bg-black text-zinc-400 text-xs py-6 px-6 sm:px-12 md:px-16 shadow-[0_-4px_0_#00FF66]">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
            <div className="flex items-center gap-2.5">
              <span className="px-1.5 py-0.5 bg-white text-black font-bold text-[10px]">
                公式
              </span>
              <span className="font-game font-black text-white tracking-wider">ZEJI · ゼジ</span>
              <span className="text-zinc-500">&bull;</span>
              <span className="text-[11px] text-zinc-400">&copy; {new Date().getFullYear()} MANGA EXPERIENCE</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="text-[#00FF66] font-bold hidden sm:inline">
                【 黒 &bull; 白 &bull; 蛍光緑 】
              </span>
              <Link
                to="/admin"
                className="hover:text-[#00FF66] text-zinc-400 transition-colors font-mono flex items-center gap-1.5"
              >
                <span>{user?.email === 'josephgitongaofficial@gmail.com' ? '【 ADMIN CONSOLE // 管理 】' : 'ADMIN ACCESS // 司令'}</span>
              </Link>
              {user && (
                <button
                  onClick={logout}
                  className="hover:text-red-400 text-zinc-500 transition-colors font-mono"
                  title="Sign out"
                >
                  [LOGOUT]
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Locked Bottom Audio Player */}
        <MediaPlayer />

        {/* Cart Sidebar */}
        <CartSidebar />

        {/* Sound & Ambient Engine Sidebar */}
        <SoundAndAISidebar 
          onOpenAIChat={() => setIsAIChatOpen(!isAIChatOpen)} 
          isAIChatOpen={isAIChatOpen} 
        />

        {/* AI Copilot Drawer */}
        <AIChatbot 
          isOpen={isAIChatOpen} 
          onClose={() => setIsAIChatOpen(false)} 
        />
      </div>
    </div>
  );
};
