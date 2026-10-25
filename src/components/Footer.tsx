import React, { useState } from 'react';
import { useSiteStore } from '../store/useSiteStore';

export const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const { user, login, logout } = useSiteStore();

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      // In a real app, send this to Firebase or an API
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative z-10 border-t border-[#ffffff10] pt-16 pb-24 md:pb-16 bg-[#0a0011]">
      <div className="max-w-[1400px] mx-auto px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-8">
          
          {/* Brand & Socials */}
          <div className="md:col-span-4 flex flex-col justify-between">
            <div>
              <h3 className="text-2xl font-bold tracking-tighter text-[#e0e0e0] mb-6">ZEJI<span className="text-[#D4AF37]">.</span></h3>
              <p className="text-[#888] text-sm leading-relaxed max-w-sm mb-8">
                Explorations in electronic modular synthesis and cinematic soundscapes.
              </p>
              <div className="flex gap-6">
                <a href="#" className="text-[#666] hover:text-[#D4AF37] text-xs transition-colors font-bold tracking-widest">INSTAGRAM</a>
                <a href="#" className="text-[#666] hover:text-[#D4AF37] text-xs transition-colors font-bold tracking-widest">SPOTIFY</a>
                <a href="#" className="text-[#666] hover:text-[#D4AF37] text-xs transition-colors font-bold tracking-widest">YOUTUBE</a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-4">
            <h4 className="text-[10px] font-semibold text-[#666] uppercase tracking-[0.2em] mb-6">Explore</h4>
            <ul className="space-y-3 text-[13px] font-medium text-[#e0e0e0]">
              <li><a href="/music" className="hover:text-[#D4AF37] transition-colors block border-b border-[#ffffff05] pb-2">Discography</a></li>
              <li><a href="/tour" className="hover:text-[#D4AF37] transition-colors block border-b border-[#ffffff05] pb-2">Tour Dates</a></li>
              <li><a href="/store" className="hover:text-[#D4AF37] transition-colors block border-b border-[#ffffff05] pb-2">Merch Store</a></li>
              <li><a href="/contact" className="hover:text-[#D4AF37] transition-colors block pb-2">Booking & Contact</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-4">
            <div className="bg-[#D4AF37] p-6 rounded-xl text-black">
              <h4 className="font-bold text-sm mb-2 uppercase tracking-tight">Newsletter</h4>
              <p className="text-[10px] mb-4 leading-tight font-medium">
                Get exclusive behind-the-scenes content and early ticket access.
              </p>
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  name="email"
                  className="w-full bg-black/10 border-b border-black placeholder-black/50 text-[10px] py-2 outline-none mb-3 font-medium"
                  placeholder="EMAIL ADDRESS"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="text-[10px] font-bold uppercase tracking-widest border border-black px-4 py-2 w-full hover:bg-black hover:text-white transition-colors"
                >
                  Join Circuit
                </button>
              </form>
              {subscribed && (
                <p className="mt-3 text-[10px] font-bold tracking-widest text-black">THANKS FOR SUBSCRIBING!</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-16 pt-6 border-t border-[#ffffff10] flex justify-between items-center">
          <p className="text-[10px] text-[#444] tracking-widest uppercase">
            &copy; {new Date().getFullYear()} ZEJI MUSIC GROUP
          </p>
          <button 
            onClick={user ? logout : login}
            className="text-[10px] text-[#222] hover:text-[#666] tracking-widest uppercase transition-colors"
          >
            {user ? 'LOGOUT' : 'ADMIN LOGIN'}
          </button>
        </div>
      </div>
    </footer>
  );
};
