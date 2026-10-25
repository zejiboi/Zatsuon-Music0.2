import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Disc, X, Play, Pause, Sliders, Music, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { useDarkOrchestra } from '../lib/useDarkOrchestra';
import { OrchestraPreset } from '../lib/darkOrchestraEngine';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { isSfxMuted, toggleSfx, playHoverSound, playSelectSound } from '../lib/gameSound';
import { motion, AnimatePresence } from 'motion/react';
import { WaveformMiniPreview } from './WaveformMiniPreview';

const ORCHESTRA_MOVEMENTS: { id: OrchestraPreset; title: string; num: string }[] = [
  { id: 'GOTHIC_REQUIEM', title: 'GOTHIC REQUIEM', num: 'I' },
  { id: 'ABYSS_CHAMBER', title: 'ABYSS CHAMBER', num: 'II' },
  { id: 'BLOOD_OVERTURE', title: 'BLOOD OVERTURE', num: 'III' },
  { id: 'VOID_HARMONICS', title: 'VOID HARMONICS', num: 'IV' },
  { id: 'CYBERPUNK_DRIFT', title: 'CYBERPUNK DRIFT', num: 'V' },
  { id: 'CATHEDRAL_NOIR', title: 'CATHEDRAL NOIR', num: 'VI' },
];

export const SoundAndAISidebar: React.FC = () => {
  const {
    isPlaying: isOrchestraPlaying,
    volume,
    preset,
    activeMode,
    currentSong,
    toggle: toggleOrchestra,
    setVolume,
    setPreset,
    setSong,
    unlock
  } = useDarkOrchestra();

  const { currentTrack, isPlaying: isTrackPlaying, togglePlayPause, playTrack } = useStore();
  const { tracks } = useSiteStore();

  const [sfxActive, setSfxActive] = useState(!isSfxMuted());
  const [isOrchestraMenuOpen, setIsOrchestraMenuOpen] = useState(false);
  const [isTrackMenuOpen, setIsTrackMenuOpen] = useState(false);
  const [ambientTab, setAmbientTab] = useState<'movements' | 'songs'>('songs');

  const orchestraMenuRef = useRef<HTMLDivElement>(null);
  const trackMenuRef = useRef<HTMLDivElement>(null);

  const handleToggleSfx = () => {
    const newState = toggleSfx();
    setSfxActive(newState);
  };

  const handleToggleTrackMenu = () => {
    playSelectSound();
    setIsOrchestraMenuOpen(false);
    setIsTrackMenuOpen(!isTrackMenuOpen);
  };

  const handleSelectTrack = (track: any) => {
    playSelectSound();
    playTrack(track);
  };

  const handleSelectAmbientSong = (track: any) => {
    playSelectSound();
    unlock();
    setSong({
      id: track.id,
      title: track.title,
      album: track.album || 'AMBIENT ARCHIVE',
      audioUrl: track.audioUrl,
      duration: track.duration,
      coverUrl: track.coverUrl
    });
  };

  const handleAmbientNextSong = () => {
    if (tracks.length === 0) return;
    playSelectSound();
    const currentIdx = tracks.findIndex(t => t.id === currentSong?.id);
    const nextIdx = (currentIdx + 1) % tracks.length;
    handleSelectAmbientSong(tracks[nextIdx]);
  };

  const handleAmbientPrevSong = () => {
    if (tracks.length === 0) return;
    playSelectSound();
    const currentIdx = tracks.findIndex(t => t.id === currentSong?.id);
    const prevIdx = (currentIdx - 1 + tracks.length) % tracks.length;
    handleSelectAmbientSong(tracks[prevIdx]);
  };

  // Close menus on ESC or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOrchestraMenuOpen(false);
        setIsTrackMenuOpen(false);
      }
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (orchestraMenuRef.current && !orchestraMenuRef.current.contains(e.target as Node)) {
        setIsOrchestraMenuOpen(false);
      }
      if (trackMenuRef.current && !trackMenuRef.current.contains(e.target as Node)) {
        setIsTrackMenuOpen(false);
      }
    };

    if (isOrchestraMenuOpen || isTrackMenuOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOrchestraMenuOpen, isTrackMenuOpen]);

  return (
    <>
      {/* Floating Vertical Audio HUD Side Bar (Offset inward to avoid spectrogram overlap) */}
      <aside
        aria-label="Audio Engine Controls"
        className="fixed right-2 sm:right-6 md:right-10 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-1.5 sm:gap-2 p-1 sm:p-2 bg-black border-2 border-white shadow-[2px_2px_0_#00FF66] sm:shadow-[3px_3px_0_#00FF66] select-none"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)'
        }}
      >
        {/* Decorative Top Crosshair */}
        <div className="w-full flex items-center justify-center pb-0.5 sm:pb-1 border-b border-zinc-800 text-[8px] sm:text-[9px] font-mono text-[#00FF66]">
          ✦
        </div>

        {/* 1. Dark Orchestra / Ambient Engine Icon */}
        <div className="relative">
          <button
            onClick={() => {
              playSelectSound();
              unlock();
              setIsOrchestraMenuOpen(!isOrchestraMenuOpen);
            }}
            onMouseEnter={playHoverSound}
            className={`w-7 sm:w-10 h-7 sm:h-10 flex flex-col items-center justify-center border-2 transition-all relative group ${
              isOrchestraMenuOpen
                ? 'bg-[#00FF66] text-black border-white shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]'
                : isOrchestraPlaying
                ? 'bg-black text-[#00FF66] border-[#00FF66] shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]'
                : 'bg-black text-zinc-400 border-zinc-800 hover:border-[#00FF66] hover:text-[#00FF66]'
            }`}
            title="Ambient Engine & Song Selector"
            aria-label="Toggle Ambient Engine Menu"
          >
            <Music className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {isOrchestraPlaying && (
              <span className="absolute bottom-0.5 sm:bottom-1 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-[#00FF66] rounded-full animate-ping"></span>
            )}
          </button>
        </div>

        {/* 2. Track Audio Deck / Song Selector Icon */}
        <button
          onClick={handleToggleTrackMenu}
          onMouseEnter={playHoverSound}
          className={`w-7 sm:w-10 h-7 sm:h-10 flex items-center justify-center border-2 transition-all relative ${
            isTrackMenuOpen
              ? 'bg-[#00FF66] text-black border-white shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]'
              : isTrackPlaying
              ? 'bg-black text-[#00FF66] border-[#00FF66] shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]'
              : 'bg-black text-zinc-400 border-zinc-800 hover:border-[#00FF66] hover:text-[#00FF66]'
          }`}
          title="Change Foreground Music Track (楽曲変更)"
          aria-label="Open Music Tracks Playlist"
        >
          {isTrackPlaying ? (
            <Disc className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00FF66] animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
          )}
          {isTrackPlaying && (
            <span className="absolute bottom-0.5 sm:bottom-1 w-1 sm:w-1.5 h-1 sm:h-1.5 bg-[#00FF66] rounded-full animate-ping"></span>
          )}
        </button>

        {/* 3. SFX Mute/Unmute Icon */}
        <button
          onClick={() => {
            playSelectSound();
            handleToggleSfx();
          }}
          onMouseEnter={playHoverSound}
          className={`w-7 sm:w-10 h-7 sm:h-10 flex items-center justify-center border-2 transition-all ${
            sfxActive
              ? 'bg-black text-[#00FF66] border-[#00FF66] shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]'
              : 'bg-black text-zinc-600 border-zinc-800 hover:border-zinc-500 hover:text-zinc-300'
          }`}
          title={sfxActive ? 'Sound Effects: ON (Click to Mute)' : 'Sound Effects: MUTED'}
          aria-label="Toggle Sound Effects"
        >
          {sfxActive ? <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <VolumeX className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />}
        </button>

        {/* Decorative Bottom Crosshair */}
        <div className="w-full flex items-center justify-center pt-0.5 sm:pt-1 border-t border-zinc-800 text-[7px] sm:text-[8px] font-mono text-zinc-500">
          DSP
        </div>
      </aside>

      {/* Foreground Song Tracks Playlist Menu */}
      <AnimatePresence>
        {isTrackMenuOpen && (
          <div
            onClick={() => setIsTrackMenuOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          >
            <motion.div
              ref={trackMenuRef}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[380px] sm:w-[420px] max-h-[85vh] overflow-y-auto bg-black border-2 border-white p-4 sm:p-5 shadow-[8px_8px_0_#00FF66] select-none text-white font-sans relative overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
              }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-white">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-[#00FF66] text-black font-mono font-black text-[10px]">
                    曲
                  </span>
                  <div>
                    <h3 className="font-game font-black text-sm tracking-widest text-white uppercase">
                      MUSIC CATALOG
                    </h3>
                    <span className="text-[10px] font-mono text-zinc-400">FOREGROUND PLAYBACK</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSelectSound();
                    setIsTrackMenuOpen(false);
                  }}
                  onMouseEnter={playHoverSound}
                  className="p-1 bg-black border border-white hover:bg-white hover:text-black text-white transition-colors"
                  aria-label="Close Track Menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {currentTrack && (
                <div className="flex items-center justify-between gap-3 mb-3 p-2.5 bg-zinc-950 border border-zinc-800 font-mono text-xs">
                  <div className="min-w-0">
                    <span className="text-[9px] text-[#00FF66] block">NOW ACTIVE:</span>
                    <span className="text-white font-bold truncate block">{currentTrack.title}</span>
                  </div>

                  <button
                    onClick={() => {
                      playSelectSound();
                      togglePlayPause();
                    }}
                    className="px-2.5 py-1 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase transition-colors shrink-0 flex items-center gap-1"
                  >
                    {isTrackPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isTrackPlaying ? 'PAUSE' : 'PLAY'}</span>
                  </button>
                </div>
              )}

              <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                {tracks.map((t, idx) => {
                  const isCurrent = currentTrack?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTrack(t)}
                      onMouseEnter={playHoverSound}
                      className={`w-full flex items-center justify-between p-2 border-2 text-xs font-mono transition-all text-left group ${
                        isCurrent
                          ? 'bg-zinc-950 text-white border-[#00FF66] shadow-[2px_2px_0_#ffffff]'
                          : 'bg-black text-zinc-300 border-zinc-800 hover:border-white hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`px-1 py-0.5 text-[9px] font-bold ${isCurrent ? 'bg-[#00FF66] text-black' : 'bg-zinc-900 text-zinc-500'}`}>
                          0{idx + 1}
                        </span>

                        <div className="w-7 h-7 border border-zinc-700 bg-zinc-900 overflow-hidden shrink-0">
                          <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                        </div>

                        <div className="min-w-0 pr-1">
                          <h4 className="font-game font-bold text-white text-xs truncate group-hover:text-[#00FF66]">
                            {t.title}
                          </h4>
                          <span className="text-zinc-500 text-[9px] block truncate">{t.album}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-12 hidden sm:block">
                          <WaveformMiniPreview
                            trackTitle={t.title}
                            trackId={t.id}
                            isPlaying={isCurrent && isTrackPlaying}
                            barCount={14}
                            className="h-3.5"
                          />
                        </div>
                        <span className="text-[9px] text-zinc-400 font-mono">{t.duration}</span>
                        {isCurrent && isTrackPlaying ? (
                          <span className="w-2 h-2 bg-[#00FF66] rounded-full animate-ping"></span>
                        ) : isCurrent ? (
                          <span className="w-2 h-2 bg-[#00FF66] rounded-full"></span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Enhanced Ambient Engine Menu */}
      <AnimatePresence>
        {isOrchestraMenuOpen && (
          <div
            onClick={() => setIsOrchestraMenuOpen(false)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
          >
            <motion.div
              ref={orchestraMenuRef}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.16 }}
              className="w-full max-w-[380px] sm:w-[430px] max-h-[88vh] overflow-y-auto bg-black border-2 border-white p-4 sm:p-5 shadow-[8px_8px_0_#00FF66] select-none text-white font-sans relative overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
              }}
            >
              <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-white">
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-[#00FF66] text-black font-mono font-black text-[10px]">
                    響
                  </span>
                  <div>
                    <h3 className="font-game font-black text-sm tracking-widest text-white uppercase">
                      AMBIENT ENGINE
                    </h3>
                    <span className="text-[10px] font-mono text-[#00FF66]">
                      {activeMode === 'song' ? `SONG: ${currentSong?.title || 'CATALOG'}` : `PRESET: ${preset}`}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSelectSound();
                    setIsOrchestraMenuOpen(false);
                  }}
                  onMouseEnter={playHoverSound}
                  className="p-1 bg-black border border-white hover:bg-white hover:text-black text-white transition-colors"
                  aria-label="Close Ambient Menu"
                  title="Close (ESC)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-between gap-3 mb-3 p-2 bg-zinc-950 border border-zinc-800">
                <span className="text-xs font-mono font-bold text-zinc-300">
                  AMBIENT AUDIO
                </span>
                <div className="flex items-center gap-1.5">
                  {activeMode === 'song' && (
                    <>
                      <button
                        onClick={handleAmbientPrevSong}
                        className="p-1 hover:text-[#00FF66] text-zinc-400"
                        title="Previous Ambient Song"
                      >
                        <SkipBack className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={handleAmbientNextSong}
                        className="p-1 hover:text-[#00FF66] text-zinc-400"
                        title="Next Ambient Song"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      playSelectSound();
                      toggleOrchestra();
                    }}
                    onMouseEnter={playHoverSound}
                    className={`px-2.5 py-1 font-game font-black text-xs uppercase tracking-wider border transition-all ${
                      isOrchestraPlaying
                        ? 'bg-[#00FF66] text-black border-[#00FF66] shadow-[2px_2px_0_#ffffff]'
                        : 'bg-black text-zinc-400 border-zinc-700 hover:text-white hover:border-white'
                    }`}
                  >
                    {isOrchestraPlaying ? 'ACTIVE' : 'PAUSED'}
                  </button>
                </div>
              </div>

              <div className="mb-3 p-2 bg-zinc-950 border border-zinc-800">
                <div className="flex items-center justify-between text-xs font-mono mb-1.5 text-zinc-300">
                  <span className="flex items-center gap-1.5 font-bold text-[11px]">
                    <Sliders className="w-3 h-3 text-[#00FF66]" /> AMBIENT VOLUME
                  </span>
                  <span className="text-[#00FF66] font-bold text-[11px]">
                    {Math.round(volume * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 appearance-none cursor-pointer accent-[#00FF66]"
                />
              </div>

              <div className="grid grid-cols-2 gap-1 mb-3 border border-zinc-800 p-1 bg-black">
                <button
                  onClick={() => {
                    playSelectSound();
                    setAmbientTab('songs');
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                    ambientTab === 'songs'
                      ? 'bg-[#00FF66] text-black shadow-[2px_2px_0_#ffffff]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Disc className="w-3 h-3" />
                  <span>CHANGE SONGS ({tracks.length})</span>
                </button>

                <button
                  onClick={() => {
                    playSelectSound();
                    setAmbientTab('movements');
                  }}
                  className={`py-1.5 text-[10px] font-mono font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
                    ambientTab === 'movements'
                      ? 'bg-[#00FF66] text-black shadow-[2px_2px_0_#ffffff]'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>MOVEMENTS (6)</span>
                </button>
              </div>

              {ambientTab === 'songs' && (
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  <span className="text-[9px] font-mono text-[#00FF66] font-bold block uppercase tracking-wider mb-1">
                    CLICK TO PLAY AS AMBIENT SOUNDTRACK
                  </span>

                  {tracks.map((t, idx) => {
                    const isSelected = activeMode === 'song' && currentSong?.id === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => handleSelectAmbientSong(t)}
                        onMouseEnter={playHoverSound}
                        className={`w-full flex items-center justify-between p-2 border-2 text-xs font-mono transition-all text-left group ${
                          isSelected
                            ? 'bg-zinc-950 text-white border-[#00FF66] shadow-[2px_2px_0_#ffffff]'
                            : 'bg-black text-zinc-300 border-zinc-800 hover:border-[#00FF66] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-1 py-0.5 text-[9px] font-bold ${
                            isSelected ? 'bg-[#00FF66] text-black' : 'bg-zinc-900 text-zinc-500'
                          }`}>
                            0{idx + 1}
                          </span>

                          <div className="w-7 h-7 border border-zinc-700 bg-zinc-900 overflow-hidden shrink-0">
                            <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                          </div>

                          <div className="min-w-0 pr-1">
                            <h4 className="font-game font-bold text-white text-xs truncate group-hover:text-[#00FF66]">
                              {t.title}
                            </h4>
                            <span className="text-zinc-500 text-[9px] block truncate">{t.album}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[9px] text-zinc-400 font-mono">{t.duration}</span>
                          {isSelected && isOrchestraPlaying ? (
                            <span className="w-2 h-2 bg-[#00FF66] rounded-full animate-ping"></span>
                          ) : isSelected ? (
                            <span className="w-2 h-2 bg-[#00FF66] rounded-full"></span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {ambientTab === 'movements' && (
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto pr-1">
                  <span className="text-[9px] font-mono text-[#00FF66] font-bold block uppercase tracking-wider mb-1">
                    SYNTHESIZED AMBIENT MOVEMENTS
                  </span>

                  {ORCHESTRA_MOVEMENTS.map((m) => {
                    const isSelected = activeMode === 'generative' && preset === m.id;
                    return (
                      <button
                        key={m.id}
                        onClick={() => {
                          playSelectSound();
                          unlock();
                          setPreset(m.id);
                        }}
                        onMouseEnter={playHoverSound}
                        className={`w-full flex items-center justify-between px-3 py-2 border-2 text-xs font-game font-bold tracking-wider transition-all ${
                          isSelected
                            ? 'bg-white text-black border-white shadow-[2px_2px_0_#00FF66]'
                            : 'bg-black text-zinc-300 border-zinc-800 hover:border-[#00FF66] hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`px-1 font-mono text-[9px] border ${
                            isSelected ? 'bg-black text-[#00FF66] border-black' : 'bg-zinc-900 text-zinc-400 border-zinc-700'
                          }`}>
                            {m.num}
                          </span>
                          <span className="text-xs">{m.title}</span>
                        </div>
                        {isSelected && (
                          <span className="w-2 h-2 bg-[#00FF66] rounded-full"></span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
