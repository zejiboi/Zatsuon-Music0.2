import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Compass, Disc, MapPin, ShieldAlert, Cpu, Radio, Package, Terminal } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../lib/gameSound';
import { useSiteStore } from '../store/useSiteStore';

interface MenuItem {
  key: string;
  name: string;
  sub: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  hotkey: string;
}

export const GameMenuNav: React.FC = () => {
  const { user } = useSiteStore();
  const location = useLocation();
  const isAdmin = user?.email === 'josephgitongaofficial@gmail.com';

  const menuItems: MenuItem[] = [
    { key: 'campaign', name: 'CAMPAIGN', sub: 'MAIN MISSION', path: '/', icon: Compass, hotkey: '1' },
    { key: 'music', name: 'SOUND TEST', sub: 'AUDIO ARCHIVE', path: '/music', icon: Disc, hotkey: '2' },
    { key: 'tour', name: 'WORLD MAP', sub: 'LIVE SECTORS', path: '/tour', icon: MapPin, hotkey: '3' },
    { key: 'store', name: 'ARMORY', sub: 'SUPPLY DEPOT', path: '/store', icon: ShieldAlert, hotkey: '4' },
    { key: 'blog', name: 'DATALOGS', sub: 'STUDIO INTEL', path: '/blog', icon: Cpu, hotkey: '5' },
    { key: 'contact', name: 'COMMS UPLINK', sub: 'FREQUENCY', path: '/contact', icon: Radio, hotkey: '6' },
    { key: 'cart', name: 'INVENTORY', sub: 'REQUISITION', path: '/cart', icon: Package, hotkey: '7' },
    ...(isAdmin ? [{ key: 'admin', name: 'DEV OVERRIDE', sub: 'ROOT CONSOLE', path: '/admin', icon: Terminal, hotkey: '8' }] : [])
  ];

  return (
    <nav className="w-full bg-[#0e0319] border-b border-[#ffffff10] px-4 sm:px-8 py-3 sticky top-[41px] z-30 shadow-2xl">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar py-1">
        <div className="flex items-center gap-1.5 sm:gap-3 flex-nowrap w-full justify-start md:justify-center">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.key}
                to={item.path}
                onMouseEnter={playHoverSound}
                onClick={playSelectSound}
                className={({ isActive: active }) =>
                  `group relative flex items-center gap-2.5 px-3.5 sm:px-5 py-2.5 rounded transition-all whitespace-nowrap shrink-0 border select-none ${
                    active
                      ? 'bg-[#220738] border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.25)]'
                      : 'bg-[#140424]/60 border-[#ffffff10] text-[#999] hover:bg-[#1f0633] hover:border-[#ffffff30] hover:text-white'
                  }`
                }
              >
                {/* Active indicator pip */}
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full animate-ping absolute -top-1 right-2"></span>
                )}

                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#D4AF37]' : 'text-[#777] group-hover:text-white'}`} />
                
                <div className="flex flex-col text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] sm:text-[13px] font-game font-bold tracking-wider leading-none">
                      {item.name}
                    </span>
                    <span className="text-[9px] font-hud text-[#666] group-hover:text-[#D4AF37] transition-colors hidden lg:inline">
                      [{item.hotkey}]
                    </span>
                  </div>
                  <span className="text-[8px] font-hud uppercase tracking-widest text-[#777] group-hover:text-[#aaa] transition-colors leading-tight mt-0.5 hidden sm:block">
                    {item.sub}
                  </span>
                </div>

                {/* Bottom line accent */}
                {isActive && (
                  <div className="absolute -bottom-[13px] left-0 right-0 h-[2px] bg-[#D4AF37]"></div>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
