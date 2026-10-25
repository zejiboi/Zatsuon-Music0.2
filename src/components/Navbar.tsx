import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Menu, X, ShoppingCart } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useSiteStore } from '../store/useSiteStore';

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, setIsCartOpen } = useStore();
  const { user } = useSiteStore();
  const isAdmin = user?.email === 'josephgitongaofficial@gmail.com';

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Music', path: '/music' },
    { name: 'Tour', path: '/tour' },
    { name: 'Store', path: '/store' },
    { name: 'Blog', path: '/blog' },
    { name: 'Contact', path: '/contact' },
    ...(isAdmin ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMenu = () => setIsMobileMenuOpen(false);

  return (
    <nav className="relative z-40 w-full pt-10 pb-6 px-10">
      <div className="max-w-[1400px] mx-auto flex items-baseline justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group" onClick={closeMenu}>
          <h1 className="text-2xl font-bold tracking-tighter text-[#e0e0e0]">ZEJI<span className="text-[#D4AF37]">.</span></h1>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-[10px] uppercase tracking-[0.2em] font-medium text-[#888]">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `hover:text-[#D4AF37] transition-colors ${
                  isActive ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-1' : 'pb-1 border-b border-transparent'
                }`
              }
            >
              {link.name}
            </NavLink>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setIsCartOpen(true)}
            className="text-[#888] hover:text-[#D4AF37] transition-colors relative focus:outline-none"
            aria-label="View cart"
          >
            <ShoppingCart className="w-5 h-5" />
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex items-center justify-center w-4 h-4 text-[9px] font-bold text-[#11001C] bg-[#D4AF37] rounded-full">
                {cart.reduce((total, item) => total + item.quantity, 0)}
              </span>
            )}
          </button>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={toggleMenu}
              className="text-[#888] hover:text-white focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#1A0129] border-b border-[#ffffff10] shadow-xl z-50">
          <div className="px-10 py-6 space-y-4 flex flex-col text-[10px] uppercase tracking-[0.2em] font-medium text-[#888]">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `block hover:text-[#D4AF37] transition-colors ${
                    isActive ? 'text-[#D4AF37]' : ''
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
