import React from 'react';
import { Play, Pause, Disc, Volume2, Activity } from 'lucide-react';
import { useSiteStore } from '../store/useSiteStore';
import { useStore } from '../store/useStore';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { WaveformMiniPreview } from '../components/WaveformMiniPreview';
import { WaveformScrubber } from '../components/WaveformScrubber';

export const Music: React.FC = () => {
  const { playTrack, currentTrack, isPlaying, togglePlayPause } = useStore();
  const { tracks } = useSiteStore();

  const handleTrackSelect = (track: any) => {
    playSelectSound();
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      playTrack(track);
    }
  };

  const featuredTrack = tracks[0];

  return (
    <div className="max-w-[1440px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-8 md:py-12 relative z-10 font-sans w-full pb-24 sm:pb-28">
      
      {/* Minimal Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              第壱話 // 01
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
              SOUND TEST MENU &bull; REAL-TIME FFT
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 音響 】</span>
            AUDIO ARCHIVE
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[10px] sm:text-xs font-mono text-[#00FF66] font-bold block">
            {tracks.length} TRACKS
          </span>
          <span className="text-[8px] sm:text-[10px] font-mono text-zinc-400">24-BIT LOSSLESS</span>
        </div>
      </div>

      {/* Featured Artwork & Player Banner (Image Dominant) */}
      <div 
        className="mb-4 sm:mb-8 bg-black border-2 border-white p-3 sm:p-6 flex flex-col md:flex-row items-center gap-4 sm:gap-6 shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] relative overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
        }}
      >
        <div className="relative w-full md:w-64 aspect-[16/9] md:aspect-square border-2 border-white bg-black shadow-[2px_2px_0_#000000] sm:shadow-[4px_4px_0_#000000] shrink-0 overflow-hidden">
          <img 
            src="/src/assets/images/manga_sound_panel_1792583212523.jpg" 
            alt="Midnight Echoes Synth Console"
            className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 hover:scale-105 transition-all duration-500"
          />
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 bg-black border border-[#00FF66] text-[#00FF66] text-[9px] sm:text-[10px] font-mono font-bold">
            巻頭作品
          </span>
        </div>

        <div className="flex-1 w-full flex flex-col justify-center">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <span className="text-[9px] sm:text-[10px] font-mono text-black bg-[#00FF66] px-1.5 sm:px-2 py-0.5 font-black uppercase">
              LP 01
            </span>
            <span className="text-[10px] sm:text-xs [font-family:var(--font-manga)] text-zinc-300 font-bold">
              『真夜中の残響』
            </span>
          </div>

          <h2 className="text-xl sm:text-4xl font-game font-black text-white uppercase mb-1.5 sm:mb-2">
            MIDNIGHT ECHOES
          </h2>

          {/* Featured Waveform Preview */}
          {featuredTrack && (
            <div className="my-1.5 sm:my-2 p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 rounded-sm">
              <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono text-zinc-400 mb-0.5 sm:mb-1">
                <span className="flex items-center gap-1 text-[#00FF66]">
                  <Activity className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  WAVEFORM MASTER PROFILE
                </span>
                <span>{featuredTrack.duration}</span>
              </div>
              <WaveformMiniPreview
                trackTitle={featuredTrack.title}
                trackId={featuredTrack.id}
                isPlaying={isPlaying && currentTrack?.id === featuredTrack.id}
                barCount={36}
                className="h-6 sm:h-8"
              />
            </div>
          )}

          <div className="flex items-center gap-3 sm:gap-4 mt-1 sm:mt-2">
            <button
              onClick={() => featuredTrack && handleTrackSelect(featuredTrack)}
              onMouseEnter={playHoverSound}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-[11px] sm:text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 sm:gap-2 border-2 border-black shadow-[2px_2px_0_#ffffff] sm:shadow-[3px_3px_0_#ffffff] hover:shadow-[2px_2px_0_#00FF66] active:translate-x-0.5 active:translate-y-0.5"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
              }}
            >
              {isPlaying && currentTrack?.id === featuredTrack?.id ? (
                <>
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" />
                  <span>PAUSE // 停止</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current ml-0.5" />
                  <span>PLAY LP // 再生</span>
                </>
              )}
            </button>

            <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
              SYNTHWAVE &times; DARK ORCHESTRA
            </span>
          </div>
        </div>
      </div>

      {/* Manga Tracklist: Minimal, Image-Rich, High Contrast */}
      <div className="bg-black border-2 border-white shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] overflow-hidden">
        <div className="divide-y-2 divide-zinc-900">
          {tracks.map((track, index) => {
            const isCurrent = currentTrack?.id === track.id;
            const isCurrentPlaying = isCurrent && isPlaying;

            return (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                onMouseEnter={playHoverSound}
                className={`flex items-center justify-between p-2.5 sm:p-3.5 sm:px-6 transition-all cursor-pointer group ${
                  isCurrent 
                    ? 'bg-white text-black border-l-4 border-l-[#00FF66]' 
                    : 'bg-black text-white hover:bg-[#0c0c0c] hover:border-l-4 hover:border-l-white'
                }`}
              >
                {/* Left: Track Number + Image Thumbnail + Title */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <span className={`font-mono text-[11px] sm:text-xs font-bold w-5 sm:w-6 text-center shrink-0 ${
                    isCurrent ? 'text-black' : 'text-zinc-500 group-hover:text-[#00FF66]'
                  }`}>
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {/* Album / Track Art Thumbnail */}
                  <div className="w-9 h-9 sm:w-12 sm:h-12 border-2 border-black bg-black shrink-0 overflow-hidden relative shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]">
                    <img 
                      src={track.coverUrl || '/src/assets/images/manga_sound_panel_1792583212523.jpg'} 
                      alt={track.title} 
                      className={`w-full h-full object-cover transition-all ${
                        isCurrent ? 'grayscale-0' : 'grayscale group-hover:grayscale-0'
                      }`}
                    />
                    {isCurrentPlaying && (
                      <div className="absolute inset-0 bg-[#00FF66]/30 flex items-center justify-center">
                        <Volume2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-black animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 pr-1.5 sm:pr-2">
                    <h4 className="font-game font-black text-xs sm:text-base tracking-tight uppercase truncate">
                      {track.title}
                    </h4>
                    <span className={`text-[9px] sm:text-[10px] font-mono tracking-wider truncate block ${
                      isCurrent ? 'text-zinc-700' : 'text-zinc-400'
                    }`}>
                      {track.album}
                    </span>
                  </div>
                </div>

                {/* Center: Waveform Preview */}
                <div className="hidden md:block w-36 lg:w-48 px-3">
                  <WaveformMiniPreview
                    trackTitle={track.title}
                    trackId={track.id}
                    isPlaying={isCurrentPlaying}
                    barCount={28}
                  />
                </div>

                {/* Right: Duration + Minimal Play Trigger */}
                <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                  <span className="font-mono text-[10px] sm:text-xs font-bold">
                    {track.duration}
                  </span>

                  <button
                    className={`w-7 h-7 sm:w-9 sm:h-9 border-2 flex items-center justify-center transition-all ${
                      isCurrent
                        ? 'bg-black text-[#00FF66] border-black shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]'
                        : 'bg-black text-white border-white group-hover:bg-[#00FF66] group-hover:text-black group-hover:border-black'
                    }`}
                  >
                    {isCurrentPlaying ? (
                      <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

