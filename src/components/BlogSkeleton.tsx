import React from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';

export const BlogSkeleton: React.FC = () => {
  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-10 md:py-16 relative z-10 font-sans w-full animate-fadeIn">
      
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-6 border-b-2 border-white/80">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-black text-[#00FF66] border-2 border-[#00FF66] font-mono text-xs font-bold shadow-[2px_2px_0_#ffffff] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-ping"></span>
              第伍章 // CHAPTER 05
            </span>
            <span className="text-xs font-mono text-[#00FF66] flex items-center gap-1.5">
              <RefreshCw className="w-3 h-3 animate-spin text-[#00FF66]" />
              <span className="tracking-widest uppercase">RETRIEVING DISPATCH ARCHIVES...</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-10 sm:h-14 w-28 bg-zinc-900 border border-zinc-800 manga-skeleton-neon"></div>
            <div className="h-10 sm:h-14 w-60 sm:w-80 bg-zinc-900 border border-zinc-800 manga-skeleton"></div>
          </div>
        </div>

        <div className="text-right hidden sm:block">
          <div className="h-3 w-48 bg-zinc-900 ml-auto manga-skeleton"></div>
        </div>
      </div>

      {/* Manga Comic Panel Cards Grid (4 items) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[1, 2, 3, 4].map((idx) => (
          <div
            key={idx}
            className="flex flex-col bg-black p-6 sm:p-7 border-2 border-zinc-800 shadow-[6px_6px_0_#18181b] relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            {/* Background Screentone */}
            <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

            {/* Top Index & Date Skeleton */}
            <div className="flex items-center justify-between mb-3 text-xs font-mono relative z-10">
              <span className="px-1.5 py-0.5 bg-black text-zinc-500 border border-zinc-700 text-[10px] font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-[#00FF66]/50 rounded-full animate-pulse"></span>
                記録 0{idx} // INTEL
              </span>
              <div className="h-3 w-20 bg-zinc-800 manga-skeleton"></div>
            </div>

            {/* Aspect Video Image Container Skeleton */}
            <div className="aspect-video overflow-hidden mb-5 bg-zinc-950 border-2 border-zinc-800 relative z-10 manga-skeleton">
              <div className="absolute inset-0 manga-screentone-neon opacity-10"></div>
              <span className="absolute top-2 left-2 text-[10px] text-zinc-700 font-mono">+</span>
              <span className="absolute top-2 right-2 text-[10px] text-zinc-700 font-mono">+</span>
              <span className="absolute bottom-2 right-2 text-[10px] text-zinc-700 font-mono">+</span>
            </div>

            {/* Title Skeleton */}
            <div className="h-6 w-3/4 bg-zinc-800 mb-3 manga-skeleton relative z-10"></div>

            {/* Excerpt Multi-line Skeleton */}
            <div className="space-y-2 mb-5 flex-1 relative z-10">
              <div className="h-3.5 w-full bg-zinc-900 manga-skeleton"></div>
              <div className="h-3.5 w-4/5 bg-zinc-900 manga-skeleton"></div>
            </div>

            {/* Footer Action Bar Skeleton */}
            <div className="pt-3 border-t-2 border-zinc-900 flex items-center justify-between text-xs font-mono font-bold text-zinc-500 relative z-10">
              <span className="text-[10px] text-zinc-600 uppercase tracking-wider">INTEL LOG</span>
              <span className="flex items-center gap-1.5 text-zinc-600 [font-family:var(--font-manga)]">
                閲覧 <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
