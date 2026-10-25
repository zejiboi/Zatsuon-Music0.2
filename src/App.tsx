/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Music } from './pages/Music';
import { Tour } from './pages/Tour';
import { Store } from './pages/Store';
import { Blog } from './pages/Blog';
import { Contact } from './pages/Contact';
import { Cart } from './pages/Cart';
import { Admin } from './pages/Admin';
import { useSiteStore } from './store/useSiteStore';

export default function App() {
  const { loadData, isLoaded, initAuth } = useSiteStore();

  useEffect(() => {
    loadData();
    initAuth();
  }, [loadData, initAuth]);

  if (!isLoaded) return <div className="min-h-screen bg-black flex items-center justify-center"><div className="w-8 h-8 rounded-full border-2 border-[#00FF66] border-t-transparent animate-spin"></div></div>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="music" element={<Music />} />
          <Route path="tour" element={<Tour />} />
          <Route path="store" element={<Store />} />
          <Route path="blog" element={<Blog />} />
          <Route path="contact" element={<Contact />} />
          <Route path="cart" element={<Cart />} />
          <Route path="admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
