import React from 'react';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useSiteStore } from '../store/useSiteStore';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { BlogSkeleton } from '../components/BlogSkeleton';

export const Blog: React.FC = () => {
  const { blogPosts, isBlogLoading, fetchBlogPosts } = useSiteStore();
  
  if (isBlogLoading) {
    return <BlogSkeleton />;
  }

  return (
    <div className="max-w-[1280px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-10 md:py-16 relative z-10 font-sans w-full pb-20">
      
      {/* Header: Manga Volume Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-10 pb-3 sm:pb-6 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-bold shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              第伍章 // CHAPTER 05
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400 font-bold">
              DATALOGS & CHRONICLES
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 速報 】</span>
            STUDIO INTEL
          </h1>
        </div>

        <div className="text-right flex flex-col items-start sm:items-end gap-1">
          <button
            onClick={() => {
              playSelectSound();
              fetchBlogPosts();
            }}
            className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 hover:text-[#00FF66] transition-colors border border-zinc-800 hover:border-[#00FF66] px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black"
            title="Sync live logs from Firebase"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00FF66]" />
            <span>SYNC CLOUD // 同期</span>
          </button>
          <p className="text-[10px] sm:text-xs text-zinc-400 font-mono">
            STUDIO CHRONICLES & DEV DISPATCHES
          </p>
        </div>
      </div>

      {/* Manga Comic Panel Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
        {blogPosts.map((post, idx) => (
          <article 
            key={post.id} 
            onMouseEnter={playHoverSound}
            onClick={playSelectSound}
            className="flex flex-col group bg-black p-3.5 sm:p-7 border-2 border-white hover:border-[#00FF66] transition-all shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] hover:shadow-[3px_3px_0_#ffffff] sm:hover:shadow-[6px_6px_0_#ffffff] hover:translate-x-[-1px] hover:translate-y-[-1px] relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            }}
          >
            {/* Background Screentone */}
            <div className="absolute inset-0 manga-screentone-white opacity-5 group-hover:opacity-10 pointer-events-none transition-opacity"></div>

            <div className="flex items-center justify-between mb-2 sm:mb-3 text-[10px] sm:text-xs font-mono relative z-10">
              <span className="px-1 sm:px-1.5 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] text-[9px] sm:text-[10px] font-bold">
                記録 {String(idx + 1).padStart(2, '0')} // INTEL
              </span>
              <span className="text-zinc-400 text-[10px] sm:text-[11px]">
                {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>

            <div className="aspect-video overflow-hidden mb-3 sm:mb-5 bg-black border-2 border-white relative z-10">
              <img 
                src={post.imageUrl} 
                alt={post.title} 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
            </div>

            <h3 className="text-base sm:text-2xl font-game font-black text-white uppercase mb-1.5 sm:mb-2 group-hover:text-[#00FF66] transition-colors relative z-10 truncate">
              {post.title}
            </h3>

            <p className="text-[11px] sm:text-sm text-zinc-400 font-serif leading-relaxed line-clamp-2 mb-3 sm:mb-4 flex-1 relative z-10">
              {post.excerpt || post.content}
            </p>

            <div className="pt-2 sm:pt-3 border-t-2 border-zinc-900 flex items-center justify-between text-[10px] sm:text-xs font-mono font-bold text-zinc-400 relative z-10">
              <span className="text-[9px] sm:text-[10px] text-zinc-500 uppercase tracking-wider">INTEL LOG</span>
              <span className="flex items-center gap-1 sm:gap-1.5 text-[#00FF66] [font-family:var(--font-manga)]">
                閲覧 <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </span>
            </div>
          </article>
        ))}
      </div>

    </div>
  );
};
