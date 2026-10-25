import React from 'react';
import { RefreshCw } from 'lucide-react';

export const StoreSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 md:py-12 relative z-10 font-sans w-full pb-20 animate-fadeIn">
      
      {/* Minimal Header Skeleton */}
      <div className="flex items-end justify-between mb-8 pb-4 border-b-2 border-white/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-black text-[#00FF66] border-2 border-[#00FF66] font-mono text-xs font-black shadow-[2px_2px_0_#ffffff] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping"></span>
              第弐話 // 02
            </span>
            <span className="text-xs font-mono text-[#00FF66] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-[#00FF66]" />
              <span className="tracking-widest uppercase">FETCHING ARMORY CATALOG FROM CLOUD...</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-9 sm:h-12 w-28 bg-zinc-900 border border-zinc-800 manga-skeleton-neon"></div>
            <div className="h-9 sm:h-12 w-48 sm:w-64 bg-zinc-900 border border-zinc-800 manga-skeleton"></div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="h-4 w-24 bg-zinc-900 mb-1 ml-auto manga-skeleton-neon"></div>
          <div className="h-3 w-36 bg-zinc-900 ml-auto manga-skeleton"></div>
        </div>
      </div>

      {/* Category Tabs Skeleton */}
      <div className="flex items-center gap-2 pb-4 mb-6 border-b border-zinc-900 overflow-x-auto no-scrollbar">
        {[
          { w: 'w-20', jp: '全' },
          { w: 'w-28', jp: '衣' },
          { w: 'w-24', jp: '盤' },
          { w: 'w-28', jp: '電' }
        ].map((tab, i) => (
          <div
            key={i}
            className={`flex items-center gap-2 px-4 py-2 border-2 border-zinc-800 bg-black text-xs font-mono shrink-0 ${tab.w}`}
          >
            <span className="text-[10px] px-1 bg-zinc-900 text-zinc-500">{tab.jp}</span>
            <div className="h-3 w-12 bg-zinc-800 manga-skeleton"></div>
          </div>
        ))}
      </div>

      {/* Product Cards Grid Skeleton (6 items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        {[1, 2, 3, 4, 5, 6].map((idx) => (
          <div
            key={idx}
            className="flex flex-col bg-black border-2 border-zinc-800 shadow-[6px_6px_0_#18181b] overflow-hidden relative"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            {/* Top Comic Index Label Skeleton */}
            <div className="px-3 py-1.5 border-b-2 border-zinc-900 bg-black flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-600 font-black text-[10px] flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#00FF66]/50 rounded-full animate-pulse"></span>
                ITEM 0{idx} // 装備
              </span>
              <div className="h-2.5 w-16 bg-zinc-800 manga-skeleton"></div>
            </div>

            {/* High-Impact Image Area Skeleton */}
            <div className="relative aspect-square w-full overflow-hidden bg-zinc-950 border-b-2 border-zinc-900 manga-skeleton">
              {/* Subtle manga screentone grid overlay */}
              <div className="absolute inset-0 manga-screentone-white opacity-5"></div>
              
              {/* Corner crosshairs for technical manga feel */}
              <span className="absolute top-2 left-2 text-[10px] text-zinc-700 font-mono">+</span>
              <span className="absolute top-2 right-2 text-[10px] text-zinc-700 font-mono">+</span>
              <span className="absolute bottom-2 right-2 text-[10px] text-zinc-700 font-mono">+</span>

              {/* Price Tag Badge Skeleton */}
              <div className="absolute bottom-3 left-3 px-2 py-0.5 bg-black border border-zinc-700 shadow-[2px_2px_0_#000000]">
                <div className="h-3 w-14 bg-zinc-800 manga-skeleton-neon"></div>
              </div>
            </div>

            {/* Minimal Bottom Bar Skeleton */}
            <div className="p-4 flex items-center justify-between bg-black gap-2">
              <div className="h-4 w-36 bg-zinc-800 manga-skeleton"></div>
              
              {/* Equip Button Placeholder */}
              <div className="h-8 w-20 bg-zinc-900 border-2 border-zinc-700 manga-skeleton-neon"></div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
