import React, { useState } from 'react';
import { ShoppingBag, Plus, Check, RefreshCw } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';
import { Product } from '../types';
import { playHoverSound, playSelectSound, playEquipSound } from '../lib/gameSound';
import { StoreSkeleton } from '../components/StoreSkeleton';

export const Store: React.FC = () => {
  const { addToCart, setIsCartOpen } = useStore();
  const { products, isProductsLoading, fetchProducts, homeContent } = useSiteStore();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const panelSettings = homeContent?.panelSettings || {
    storeGridDensity: 'standard',
    cornerCutSize: 'standard',
    shadowDepth: 'standard'
  };

  const storeGridClass = {
    compact: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5',
    large: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 sm:gap-8',
    standard: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 lg:gap-8'
  }[panelSettings.storeGridDensity || 'standard'];

  const cardClipPath = {
    subtle: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
    deep: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
    standard: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
  }[panelSettings.cornerCutSize || 'standard'];

  const cardShadowClass = {
    flat: 'shadow-[2px_2px_0_#00FF66] sm:shadow-[3px_3px_0_#00FF66] hover:shadow-[2px_2px_0_#ffffff] sm:hover:shadow-[3px_3px_0_#ffffff]',
    deep: 'shadow-[5px_5px_0_#00FF66] sm:shadow-[9px_9px_0_#00FF66] hover:shadow-[5px_5px_0_#ffffff] sm:hover:shadow-[9px_9px_0_#ffffff]',
    standard: 'shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] hover:shadow-[3px_3px_0_#ffffff] sm:hover:shadow-[6px_6px_0_#ffffff]'
  }[panelSettings.shadowDepth || 'standard'];

  if (isProductsLoading) {
    return <StoreSkeleton />;
  }

  const categories = [
    { id: 'all', name: 'ALL', jp: '全' },
    { id: 'apparel', name: 'APPAREL', jp: '衣' },
    { id: 'music', name: 'VINYL', jp: '盤' },
    { id: 'digital', name: 'DIGITAL', jp: '電' },
  ];

  const filteredProducts = activeCategory === 'all' 
    ? products 
    : products.filter(p => p.category.toLowerCase().includes(activeCategory) || activeCategory.includes(p.category.toLowerCase()));

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation();
    playEquipSound();
    addToCart(product);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
    setIsCartOpen(true);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-8 md:py-12 relative z-10 font-sans w-full pb-20">
      
      {/* Minimal Header */}
      <div className="flex items-end justify-between mb-4 sm:mb-8 pb-2.5 sm:pb-4 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              第弐話 // 02
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
              OFFICIAL ARMORY
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 兵站 】</span>
            STORE
          </h1>
        </div>

        <div className="text-right flex flex-col items-end gap-1">
          <button
            onClick={() => {
              playSelectSound();
              fetchProducts();
            }}
            className="flex items-center gap-1 text-[9px] sm:text-[10px] font-mono font-bold text-zinc-400 hover:text-[#00FF66] transition-colors border border-zinc-800 hover:border-[#00FF66] px-1.5 sm:px-2 py-0.5 sm:py-1 bg-black"
            title="Sync live catalog from Firebase"
          >
            <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#00FF66]" />
            <span>SYNC CLOUD // 同期</span>
          </button>
          <span className="text-[10px] sm:text-xs font-mono text-[#00FF66] font-bold block">
            LIMITED RUN &bull; WORLDWIDE SHIPPING
          </span>
        </div>
      </div>

      {/* Minimal Category Filter Tabs */}
      <div className="flex items-center gap-1.5 sm:gap-2 pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-zinc-900 overflow-x-auto no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => {
                playSelectSound();
                setActiveCategory(cat.id);
              }}
              onMouseEnter={playHoverSound}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 transition-all shrink-0 text-[10px] sm:text-xs font-mono font-bold ${
                isActive
                  ? 'bg-white text-black border-white shadow-[2px_2px_0_#00FF66] sm:shadow-[3px_3px_0_#00FF66]'
                  : 'bg-black text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
              }`}
            >
              <span className={`text-[9px] sm:text-[10px] px-1 ${isActive ? 'bg-black text-[#00FF66]' : 'bg-zinc-900 text-zinc-400'}`}>
                {cat.jp}
              </span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      {/* Product Grid: High Visual Dominance Manga Cards */}
      <div className={storeGridClass}>
        {filteredProducts.map((product, idx) => (
          <div 
            key={product.id} 
            onMouseEnter={playHoverSound}
            className={`group flex flex-col bg-black border-2 border-white hover:border-[#00FF66] transition-all ${cardShadowClass} hover:translate-x-[-1px] hover:translate-y-[-1px] overflow-hidden relative`}
            style={{
              clipPath: cardClipPath
            }}
          >
            {/* Top Comic Index Label */}
            <div className="px-2.5 sm:px-3 py-1 sm:py-1.5 border-b-2 border-zinc-900 bg-black flex items-center justify-between text-[10px] sm:text-xs font-mono">
              <span className="text-[#00FF66] font-black text-[9px] sm:text-[10px]">
                ITEM 0{idx + 1} // 装備
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase">
                {product.category}
              </span>
            </div>

            {/* High-Impact Image Area */}
            <div className="relative aspect-square w-full overflow-hidden bg-black border-b-2 border-zinc-800">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
              />
              <span className="absolute bottom-2.5 left-2.5 px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] text-[10px] sm:text-xs font-mono font-black shadow-[1px_1px_0_#000000] sm:shadow-[2px_2px_0_#000000]">
                ${product.price} USD
              </span>
            </div>

            {/* Minimal Bottom Bar */}
            <div className="p-2.5 sm:p-4 flex items-center justify-between bg-black gap-2">
              <h3 className="font-game font-black text-xs sm:text-sm text-white uppercase group-hover:text-[#00FF66] transition-colors truncate">
                {product.name}
              </h3>

              <button
                onClick={(e) => handleAddToCart(product, e)}
                onMouseEnter={playHoverSound}
                className="px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#00FF66] hover:bg-white text-black font-game font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 border-2 border-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff] hover:shadow-[1px_1px_0_#00FF66] shrink-0 active:translate-x-0.5 active:translate-y-0.5"
              >
                {justAddedId === product.id ? (
                  <>
                    <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>ADDED</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span>EQUIP</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
