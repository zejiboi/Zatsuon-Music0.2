import React, { useState } from 'react';
import { Ticket, MapPin, ShoppingBag, Check } from 'lucide-react';
import { useSiteStore } from '../store/useSiteStore';
import { useStore } from '../store/useStore';
import { playHoverSound, playSelectSound, playEquipSound } from '../lib/gameSound';
import { TourDate } from '../types';

export const Tour: React.FC = () => {
  const { tourDates } = useSiteStore();
  const { addToCart, setIsCartOpen } = useStore();
  const [addedTourId, setAddedTourId] = useState<string | null>(null);

  const handleEquipTicket = (date: TourDate) => {
    playEquipSound();
    const ticketPrice = date.price ?? 55;
    addToCart({
      id: date.id,
      name: `TOUR PASS: ${date.city.toUpperCase()} — ${date.venue}`,
      price: ticketPrice,
      image: date.posterUrl || '/src/assets/images/manga_tour_panel_1792583237044.jpg',
      category: 'Ticket',
      description: `Official Live Expedition General Admission Pass for ${date.city}, ${date.country} (${new Date(date.date).toLocaleDateString()}).`,
      inStock: !date.isSoldOut
    });
    setAddedTourId(date.id);
    setTimeout(() => setAddedTourId(null), 1200);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-8 md:py-12 relative z-10 font-sans w-full pb-20">
      {/* Minimal Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              第参話 // 03
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
              WORLD MISSION
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 巡業 】</span>
            TOUR
          </h1>
        </div>

        <div className="text-right">
          <span className="text-[10px] sm:text-xs font-mono text-[#00FF66] font-bold block">
            {tourDates.length} CITIES
          </span>
          <span className="text-[8px] sm:text-[10px] font-mono text-zinc-400">2026 WORLDWIDE</span>
        </div>
      </div>

      {/* Dramatic Live Concert Manga Panel Visual Banner */}
      <div
        className="mb-4 sm:mb-8 bg-black border-2 border-white overflow-hidden shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] relative group"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
        }}
      >
        <div className="relative aspect-[21/9] sm:aspect-[24/7] w-full overflow-hidden bg-black max-h-[280px]">
          <img
            src="/src/assets/images/manga_tour_panel_1792583237044.jpg"
            alt="Manga Tour Stage"
            className="w-full h-full object-cover object-center grayscale contrast-125 group-hover:scale-102 group-hover:grayscale-0 transition-all duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>

          <div className="absolute bottom-2.5 left-3 sm:bottom-4 sm:left-6 flex items-center gap-2">
            <span className="text-sm sm:text-2xl [font-family:var(--font-manga)] font-black text-[#00FF66] drop-shadow-[0_0_8px_#00FF66]">
              ズドドン！
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-white font-black uppercase tracking-wider">
              LIVE EXPEDITION 2026
            </span>
          </div>
        </div>
      </div>

      {/* Tour List: Minimal, Fast, High Contrast + Direct Add Pass to Cart */}
      <div className="space-y-2 sm:space-y-3">
        {tourDates.map((date, index) => {
          const d = new Date(date.date);
          const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
          const day = d.toLocaleDateString('en-US', { day: '2-digit' });
          const year = d.getFullYear();
          const passPrice = date.price ?? 55;

          return (
            <div
              key={date.id}
              onMouseEnter={playHoverSound}
              className="group flex items-center justify-between p-2.5 sm:p-4 sm:px-6 bg-black border-2 border-white hover:border-[#00FF66] transition-all shadow-[2px_2px_0_#00FF66] sm:shadow-[4px_4px_0_#00FF66] hover:shadow-[2px_2px_0_#ffffff] sm:hover:shadow-[4px_4px_0_#ffffff] hover:translate-x-[-1px] hover:translate-y-[-1px] gap-2.5 sm:gap-4"
            >
              {/* Left: Date Stamp + City */}
              <div className="flex items-center gap-2.5 sm:gap-6 min-w-0 flex-1">
                <div className="w-11 h-11 sm:w-14 sm:h-14 bg-black border-2 border-white group-hover:border-[#00FF66] flex flex-col items-center justify-center font-game shrink-0 shadow-[1px_1px_0_#000000] sm:shadow-[2px_2px_0_#000000]">
                  <span className="text-[8px] sm:text-[9px] font-mono font-bold text-[#00FF66] leading-none">{month}</span>
                  <span className="text-base sm:text-xl font-black text-white leading-none my-0.5">{day}</span>
                  <span className="text-[7px] sm:text-[8px] font-mono text-zinc-500 leading-none">{year}</span>
                </div>

                <div className="min-w-0 pr-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5">
                    <span className="text-[9px] sm:text-[10px] font-mono text-[#00FF66] font-bold">
                      0{index + 1}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono">
                      {date.country} &bull; ${passPrice} USD
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-2xl font-game font-black text-white uppercase group-hover:text-[#00FF66] transition-colors truncate">
                    {date.city}
                  </h3>
                  <div className="flex items-center gap-1 text-[10px] sm:text-xs text-zinc-400 truncate">
                    <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00FF66] shrink-0" />
                    <span className="truncate">{date.venue}</span>
                  </div>
                </div>
              </div>

              {/* Right: Ticket CTA */}
              <div className="flex items-center gap-2 shrink-0">
                {date.isSoldOut ? (
                  <span className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-zinc-950 border-2 border-zinc-800 text-zinc-500 text-[10px] sm:text-xs font-mono font-bold uppercase">
                    SOLD OUT
                  </span>
                ) : (
                  <button
                    onClick={() => handleEquipTicket(date)}
                    className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 border-2 border-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff] hover:shadow-[1px_1px_0_#00FF66]"
                  >
                    {addedTourId === date.id ? (
                      <>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                        <span>ADDED</span>
                      </>
                    ) : (
                      <>
                        <Ticket className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current" />
                        <span>TICKETS (${passPrice})</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
