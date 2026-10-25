import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, ArrowRight, ShoppingBag } from 'lucide-react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { playHoverSound, playSelectSound, playCancelSound } from '../lib/gameSound';

export const CartSidebar: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, getCartTotal } = useStore();
  const navigate = useNavigate();

  const handleCheckout = () => {
    playSelectSound();
    setIsCartOpen(false);
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              playCancelSound();
              setIsCartOpen(false);
            }}
            className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50"
          />

          {/* Sidebar Drawer Styled as Japanese Manga Requisition Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-black border-l-2 border-white z-50 flex flex-col shadow-[0_0_50px_rgba(0,0,0,1)] font-sans relative overflow-hidden"
          >
            {/* Background Screentone */}
            <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b-2 border-white bg-black relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 border border-[#00FF66] bg-black text-[#00FF66]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] [font-family:var(--font-manga)] text-[#00FF66] font-bold">
                      【 装備一覧 】
                    </span>
                    <h2 className="text-lg font-game font-black text-white uppercase tracking-wider">
                      ARMORY CART
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    REQUISITION COUNT: {cart.reduce((t, i) => t + i.quantity, 0)} 点
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  playCancelSound();
                  setIsCartOpen(false);
                }}
                className="p-1.5 text-white hover:text-[#00FF66] border border-zinc-750 hover:border-white transition-colors"
                aria-label="Close cart"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 relative z-10">
              {cart.length === 0 ? (
                <div className="text-center text-zinc-500 py-16 flex flex-col items-center gap-3">
                  <div className="p-4 border-2 border-zinc-800 bg-zinc-950">
                    <ShoppingBag className="w-10 h-10 text-zinc-600" />
                  </div>
                  <p className="font-game font-bold text-sm text-zinc-400 uppercase">
                    NO REQUISITION ITEMS EQUIPPED
                  </p>
                  <span className="text-[11px] [font-family:var(--font-manga)] text-zinc-600">
                    装備スロットは空です
                  </span>
                  <button 
                    onClick={() => {
                      playSelectSound();
                      setIsCartOpen(false);
                      navigate('/store');
                    }}
                    className="mt-2 px-4 py-2 border-2 border-[#00FF66] bg-black text-[#00FF66] hover:bg-[#00FF66] hover:text-black font-game font-bold text-xs uppercase shadow-[2px_2px_0_#ffffff] transition-all"
                  >
                    BROWSE ARMORY STORE &rarr;
                  </button>
                </div>
              ) : (
                cart.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-black border-2 border-zinc-800 hover:border-white transition-all relative shadow-[3px_3px_0_#00FF66]"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))'
                    }}
                  >
                    <div className="relative w-16 h-16 border-2 border-white bg-black shrink-0 overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-0 right-0 bg-black text-[9px] font-mono text-[#00FF66] px-1 font-bold">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-game font-black text-white uppercase truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-[#00FF66] font-mono font-bold mb-2">
                        ${item.price.toFixed(2)}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border-2 border-zinc-700 bg-black">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-white">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs text-zinc-400 hover:text-white"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer / Checkout in Manga Styling */}
            {cart.length > 0 && (
              <div className="p-5 border-t-2 border-white bg-black space-y-4 relative z-10 shadow-[0_-4px_0_#00FF66]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400 uppercase">
                    TOTAL ESTIMATE // 合計
                  </span>
                  <span className="text-2xl font-game font-black text-[#00FF66]">
                    ${getCartTotal().toFixed(2)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  onMouseEnter={playHoverSound}
                  className="w-full py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0_#ffffff] active:translate-x-0.5 active:translate-y-0.5"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                  }}
                >
                  <span>PROCEED TO CHECKOUT // 会計手続</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
