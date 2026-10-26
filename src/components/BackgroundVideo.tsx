import React, { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteStore } from '../store/useSiteStore';
import { PageRouteKey, PageBackgroundVideo } from '../types';

export const BackgroundVideo: React.FC = () => {
  const location = useLocation();
  const { backgroundVideos } = useSiteStore();
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Map pathname to PageRouteKey
  const getPageKey = (pathname: string): PageRouteKey => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/music')) return 'music';
    if (pathname.startsWith('/tour')) return 'tour';
    if (pathname.startsWith('/store')) return 'store';
    if (pathname.startsWith('/blog')) return 'blog';
    if (pathname.startsWith('/contact')) return 'contact';
    if (pathname.startsWith('/cart')) return 'cart';
    return 'global';
  };

  const pageKey = getPageKey(location.pathname);
  
  // Resolve active page configuration or fall back to global
  const pageConfig: PageBackgroundVideo | undefined = backgroundVideos?.[pageKey];
  const globalConfig: PageBackgroundVideo | undefined = backgroundVideos?.global;

  const activeConfig: PageBackgroundVideo | null = (() => {
    if (pageConfig && pageConfig.enabled && pageConfig.videoUrl) {
      return pageConfig;
    }
    if (globalConfig && globalConfig.enabled && globalConfig.videoUrl) {
      return globalConfig;
    }
    return null;
  })();

  // Apply playback rate whenever video mounts or playbackRate changes
  useEffect(() => {
    if (videoRef.current && activeConfig?.playbackRate) {
      videoRef.current.playbackRate = activeConfig.playbackRate;
    }
  }, [activeConfig?.playbackRate, activeConfig?.videoUrl]);

  if (!activeConfig || !activeConfig.videoUrl) {
    return null;
  }

  const blurStyle = activeConfig.blur > 0 ? `blur(${activeConfig.blur}px)` : undefined;

  return (
    <div 
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-700 ease-out"
      style={{ opacity: activeConfig.opacity ?? 0.35 }}
    >
      {/* Background Video Element */}
      <video
        key={activeConfig.videoUrl}
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover object-center grayscale contrast-125 filter"
        style={{ filter: blurStyle ? `${blurStyle} grayscale(100%) contrast(125%)` : undefined }}
      >
        <source src={activeConfig.videoUrl} type="video/mp4" />
        <source src={activeConfig.videoUrl} type="video/webm" />
      </video>

      {/* Cyber Manga Overlay Texture Options */}
      {activeConfig.overlayStyle === 'screentone' && (
        <div className="absolute inset-0 manga-screentone-white opacity-25 pointer-events-none"></div>
      )}

      {activeConfig.overlayStyle === 'scanlines' && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'repeating-linear-gradient(0deg, #000000, #000000 2px, transparent 2px, transparent 4px)',
            backgroundSize: '100% 4px'
          }}
        ></div>
      )}

      {activeConfig.overlayStyle === 'vignette' && (
        <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-60"></div>
      )}

      {/* Atmospheric Vignette & Contrast Gradients for Content Legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60 pointer-events-none"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-transparent to-black/80 pointer-events-none"></div>
    </div>
  );
};
