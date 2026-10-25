import React, { useState } from 'react';
import { Send, Mail, MapPin, CheckCircle } from 'lucide-react';
import { playHoverSound, playSelectSound, playEquipSound } from '../lib/gameSound';

import { useSiteStore } from '../store/useSiteStore';

export const Contact: React.FC = () => {
  const { sendContactMessage } = useSiteStore();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();
    setStatus('submitting');
    try {
      await sendContactMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject || 'General Transmission',
        message: formData.message
      });
      playEquipSound();
      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err) {
      console.error('Contact error:', err);
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-[1280px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-10 md:py-16 relative z-10 font-sans w-full pb-20">
      
      {/* Header: Manga Volume Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 sm:gap-4 mb-4 sm:mb-10 pb-3 sm:pb-6 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-bold shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              第六話 // CHAPTER 06
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400 font-bold">
              DIRECT COMMS UPLINK
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl lg:text-6xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 交信 】</span>
            CONTACT & COMMS
          </h1>
        </div>

        <p className="text-[10px] sm:text-xs text-zinc-400 font-mono">
          OFFICIAL MANAGEMENT DIRECT TRANSMISSION
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8">
        
        {/* Contact Info: Manga Dossier Panel */}
        <div className="lg:col-span-5 space-y-4 sm:space-y-6">
          <div 
            className="bg-black border-2 border-white p-4 sm:p-8 space-y-4 sm:space-y-6 shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            }}
          >
            <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b-2 border-zinc-800 relative z-10">
              <h2 className="text-base sm:text-xl font-game font-black text-white uppercase tracking-wider">
                DIRECT CHANNELS
              </h2>
              <span className="text-xs [font-family:var(--font-manga)] text-[#00FF66] font-bold">
                公式回線
              </span>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm relative z-10">
              <div className="p-1.5 sm:p-2 border border-white bg-black text-[#00FF66]">
                <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="block text-[9px] sm:text-[10px] font-mono text-zinc-400 uppercase">Management & Bookings</span>
                <a href="mailto:booking@zeji.music" className="text-white hover:text-[#00FF66] font-mono text-xs sm:text-sm font-bold transition-colors">
                  booking@zeji.music
                </a>
              </div>
            </div>

            <div className="flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm relative z-10">
              <div className="p-1.5 sm:p-2 border border-white bg-black text-[#00FF66]">
                <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <span className="block text-[9px] sm:text-[10px] font-mono text-zinc-400 uppercase">Studio Headquarters</span>
                <span className="text-white font-mono text-xs sm:text-sm">London & Nairobi Studios</span>
              </div>
            </div>

            <div className="pt-3 sm:pt-4 border-t-2 border-zinc-800 text-[11px] sm:text-xs text-zinc-300 font-serif leading-relaxed relative z-10">
              For live festival inquiries, scoring commissions, press features, or direct communications, dispatch your message via this panel.
            </div>
          </div>
        </div>

        {/* Contact Form: Manga Panel Form */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handleSubmit}
            className="bg-black border-2 border-white p-4 sm:p-8 space-y-3.5 sm:space-y-5 shadow-[3px_3px_0_#00FF66] sm:shadow-[6px_6px_0_#00FF66] relative overflow-hidden"
            style={{
              clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
            }}
          >
            <div className="absolute inset-0 manga-screentone-neon opacity-5 pointer-events-none"></div>

            <div className="flex items-center justify-between pb-2 sm:pb-3 border-b-2 border-zinc-800 relative z-10">
              <h2 className="text-base sm:text-xl font-game font-black text-white uppercase tracking-wider">
                TRANSMIT MESSAGE
              </h2>
              <span className="text-xs [font-family:var(--font-manga)] text-[#00FF66] font-bold">
                通信送信
              </span>
            </div>

            {status === 'success' && (
              <div className="p-4 bg-white text-black border-2 border-black flex items-center gap-3 text-sm shadow-[4px_4px_0_#00FF66]">
                <CheckCircle className="w-5 h-5 text-black shrink-0" />
                <span className="font-mono font-bold">Transmission received. Operational response will deploy shortly.</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase mb-1 font-bold">
                  NAME // 氏名
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-black border-2 border-zinc-700 focus:border-[#00FF66] text-white text-sm outline-none transition-colors"
                  placeholder="Commander / Promoter"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-zinc-300 uppercase mb-1 font-bold">
                  EMAIL // 電子郵便
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-black border-2 border-zinc-700 focus:border-[#00FF66] text-white text-sm outline-none transition-colors"
                  placeholder="contact@agency.com"
                />
              </div>
            </div>

            <div className="relative z-10">
              <label className="block text-xs font-mono text-zinc-300 uppercase mb-1 font-bold">
                SUBJECT // 件名
              </label>
              <input
                type="text"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3 py-2 bg-black border-2 border-zinc-700 focus:border-[#00FF66] text-white text-sm outline-none transition-colors"
                placeholder="Live Booking / Soundtrack License / Press"
              />
            </div>

            <div className="relative z-10">
              <label className="block text-xs font-mono text-zinc-300 uppercase mb-1 font-bold">
                MESSAGE // 本文
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-3 py-2 bg-black border-2 border-zinc-700 focus:border-[#00FF66] text-white text-sm outline-none transition-colors resize-none"
                placeholder="Provide event details, dates, or transmission specifics..."
              />
            </div>

            <button
              type="submit"
              disabled={status === 'submitting'}
              onMouseEnter={playHoverSound}
              className="w-full py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0_#ffffff] hover:shadow-[4px_4px_0_#00FF66] active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50 relative z-10"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
              }}
            >
              <Send className="w-4 h-4" />
              <span>{status === 'submitting' ? 'DISPATCHING...' : 'DISPATCH TRANSMISSION // 送信'}</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
