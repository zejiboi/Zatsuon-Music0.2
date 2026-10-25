import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Activity, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { darkOrchestra } from '../lib/darkOrchestraEngine';
import { audioVisualizer } from '../lib/audioVisualizer';
import { FrequencyVisualizer } from './FrequencyVisualizer';
import { WaveformScrubber } from './WaveformScrubber';

export const MediaPlayer: React.FC = () => {
  const { currentTrack, isPlaying, togglePlayPause, playTrack } = useStore();
  const { tracks } = useSiteStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);

  const activeTrack = currentTrack || (tracks.length > 0 ? tracks[0] : null);

  const fallbackDurationSeconds = React.useMemo(() => {
    if (!activeTrack?.duration) return 225;
    const parts = activeTrack.duration.split(':').map(p => parseInt(p, 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    }
    return 225;
  }, [activeTrack?.duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioVisualizer.attach(audioRef.current);
    }
  }, [activeTrack?.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioVisualizer.resume();
        audioRef.current.play().catch(e => {
          console.log('Audio playback prevented by policy', e);
        });
        darkOrchestra.duck(true);
      } else {
        audioRef.current.pause();
        darkOrchestra.duck(false);
      }
    }
    return () => {
      darkOrchestra.duck(false);
    };
  }, [isPlaying, activeTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  if (!activeTrack) return null;

  const currentIndex = tracks.findIndex(t => t.id === activeTrack.id);

  const handleNext = () => {
    playSelectSound();
    if (tracks.length === 0) return;
    const nextIndex = (currentIndex + 1) % tracks.length;
    playTrack(tracks[nextIndex]);
  };

  const handlePrev = () => {
    playSelectSound();
    if (tracks.length === 0) return;
    const prevIndex = (currentIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex]);
  };

  const handleToggle = () => {
    playSelectSound();
    audioVisualizer.resume();
    if (!currentTrack && activeTrack) {
      playTrack(activeTrack);
    } else {
      togglePlayPause();
    }
  };

  const handleSeek = (newTime: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const effectiveDuration = duration > 0 ? duration : fallbackDurationSeconds;

  return (
    <aside 
      aria-label="Audio Playback Bar"
      className="fixed bottom-0 left-0 right-0 z-[100] w-full isolate font-sans select-none pointer-events-auto transform-none"
    >
      
      {/* Collapsible Real-Time Manga Frequency Visualizer Deck */}
      {showVisualizer && (
        <div className="max-w-[1440px] mx-auto px-2 sm:px-4">
          <div className="bg-black border-2 border-b-0 border-white shadow-[0_-6px_0_#00FF66] p-2.5 sm:p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-[#00FF66] text-black font-mono text-[9px] sm:text-[10px] font-black uppercase">
                  MASTER DSP
                </span>
                <span className="text-[11px] sm:text-xs font-mono text-white [font-family:var(--font-manga)]">
                  【 リアルタイム周波数アナライザー 】
                </span>
              </div>
              <button
                onClick={() => setShowVisualizer(false)}
                className="text-zinc-500 hover:text-white text-xs font-mono"
              >
                CLOSE [ &times; ]
              </button>
            </div>
            
            <FrequencyVisualizer 
              isPlaying={isPlaying} 
              currentTime={currentTime} 
              mode="full" 
            />
          </div>
        </div>
      )}

      {/* Main Bottom Control Deck - Locked to Bottom */}
      <div className="bg-black text-white border-t-2 border-white px-2.5 sm:px-6 py-1.5 sm:py-2 shadow-[0_-4px_0_#00FF66] relative overflow-hidden">
        {/* Background Screentone */}
        <div className="absolute inset-0 manga-screentone-neon opacity-5 pointer-events-none"></div>

        <div className="max-w-[1440px] mx-auto relative z-10">
          
          {/* MOBILE / TABLET VIEW (< md) - Compact, Space-Optimized */}
          <div className="flex md:hidden flex-col gap-0.5 w-full">
            <div className="flex items-center justify-between gap-1.5">
              {/* Thumbnail + Title */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                <div className="w-7 h-7 border border-white bg-black shrink-0 overflow-hidden shadow-[1px_1px_0_#00FF66]">
                  <img 
                    src={activeTrack.coverUrl || '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg'} 
                    alt={activeTrack.title} 
                    className="w-full h-full object-cover grayscale contrast-125" 
                  />
                </div>
                <div className="min-w-0">
                  <h4 className="font-game font-black text-[11px] truncate text-white uppercase leading-tight">
                    {activeTrack.title}
                  </h4>
                  <span className="text-[8px] font-mono text-[#00FF66] truncate block leading-tight">
                    {isPlaying ? '▶ REPLAY' : '❚❚ IDLE'} &bull; {activeTrack.album || 'MIDNIGHT ECHOES'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={handlePrev}
                  onMouseEnter={playHoverSound}
                  className="text-white hover:text-[#00FF66] p-0.5"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-3 h-3" />
                </button>

                <button 
                  onClick={handleToggle}
                  onMouseEnter={playHoverSound}
                  className="w-7 h-7 flex items-center justify-center bg-[#00FF66] text-black border border-black hover:bg-white shadow-[1px_1px_0_#ffffff]"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current ml-0.5" />}
                </button>

                <button 
                  onClick={handleNext}
                  onMouseEnter={playHoverSound}
                  className="text-white hover:text-[#00FF66] p-0.5"
                  aria-label="Next track"
                >
                  <SkipForward className="w-3 h-3" />
                </button>

                <button
                  onClick={() => setShowVisualizer(!showVisualizer)}
                  className={`p-1 border text-[8px] font-mono font-bold transition-colors ${
                    showVisualizer ? 'bg-[#00FF66] text-black border-black' : 'border-zinc-700 text-zinc-400 hover:text-white'
                  }`}
                  title="Toggle Spectrogram"
                >
                  <Activity className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Mobile Scrubber */}
            <WaveformScrubber
              currentTime={currentTime}
              duration={effectiveDuration}
              onSeek={handleSeek}
              trackId={activeTrack.id}
              trackTitle={activeTrack.title}
              audioUrl={activeTrack.audioUrl}
              barCount={28}
              className="mt-0.5"
            />
          </div>

          {/* DESKTOP VIEW (>= md) - Full Manga Audio Deck */}
          <div className="hidden md:flex items-center justify-between gap-4">
            
            {/* Left: Track Cover & Details */}
            <div className="flex items-center gap-3 w-auto min-w-[240px] max-w-[280px]">
              <div className="w-10 h-10 border-2 border-white bg-black shrink-0 overflow-hidden shadow-[2px_2px_0_#00FF66] relative group">
                <img 
                  src={activeTrack.coverUrl || '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg'} 
                  alt={activeTrack.title} 
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform" 
                />
                {isPlaying && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#00FF66] animate-ping" />
                )}
              </div>

              <div className="overflow-hidden min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-[#00FF66] uppercase tracking-wider block truncate">
                    <span className="[font-family:var(--font-manga)] mr-1">【 {isPlaying ? '再生中' : '待機中'} 】</span>
                    {activeTrack.album || 'MIDNIGHT ECHOES'}
                  </span>
                </div>
                <h4 className="font-game font-black text-sm tracking-wide truncate text-white uppercase">
                  {activeTrack.title}
                </h4>
              </div>
            </div>

            {/* Center: Playback Controls & Waveform Scrubber */}
            <div className="flex flex-col items-center flex-1 max-w-2xl px-2">
              <div className="flex items-center gap-5 mb-1">
                <button 
                  onClick={handlePrev}
                  onMouseEnter={playHoverSound}
                  className="text-white hover:text-[#00FF66] transition-colors p-1"
                  aria-label="Previous track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button 
                  onClick={handleToggle}
                  onMouseEnter={playHoverSound}
                  className="w-9 h-9 flex items-center justify-center bg-[#00FF66] text-black border-2 border-black hover:bg-white hover:scale-105 transition-all shadow-[2px_2px_0_#ffffff] active:translate-x-0.5 active:translate-y-0.5"
                  aria-label={isPlaying ? 'Pause track' : 'Play track'}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button 
                  onClick={handleNext}
                  onMouseEnter={playHoverSound}
                  className="text-white hover:text-[#00FF66] transition-colors p-1"
                  aria-label="Next track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full">
                <WaveformScrubber
                  currentTime={currentTime}
                  duration={effectiveDuration}
                  onSeek={handleSeek}
                  trackId={activeTrack.id}
                  trackTitle={activeTrack.title}
                  audioUrl={activeTrack.audioUrl}
                  barCount={56}
                />
              </div>
            </div>

            {/* Right: Spectrogram Toggle & Volume */}
            <div className="flex items-center gap-3.5 min-w-[240px] justify-end">
              <button
                onClick={() => {
                  playSelectSound();
                  setShowVisualizer(!showVisualizer);
                }}
                onMouseEnter={playHoverSound}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold border-2 transition-all flex items-center gap-1.5 ${
                  showVisualizer
                    ? 'bg-[#00FF66] text-black border-black shadow-[2px_2px_0_#ffffff]'
                    : 'bg-black text-white border-zinc-700 hover:border-[#00FF66] hover:text-[#00FF66]'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>SPECTROGRAM</span>
                {showVisualizer ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
              </button>

              <div className="flex items-center gap-2 text-zinc-400">
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="hover:text-white transition-colors"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-red-500" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>

                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={e => {
                    const val = parseFloat(e.target.value);
                    setVolume(val);
                    if (isMuted) setIsMuted(false);
                  }}
                  className="w-16 h-1.5 bg-zinc-800 accent-[#00FF66] cursor-pointer"
                  title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio 
          ref={audioRef} 
          src={activeTrack.audioUrl} 
          onEnded={handleNext}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          crossOrigin="anonymous"
        />
      </div>
    </aside>
  );
};
