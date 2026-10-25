import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track, CartItem, Product } from '../types';

interface StoreState {
  // Theme
  isDarkMode: boolean;
  toggleTheme: () => void;
  
  // Media Player
  currentTrack: Track | null;
  isPlaying: boolean;
  playTrack: (track: Track) => void;
  togglePlayPause: () => void;
  
  // Cart
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Theme
      isDarkMode: true, // Default to dark mode as requested
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      
      // Media Player
      currentTrack: null,
      isPlaying: false,
      playTrack: (track) => set({ currentTrack: track, isPlaying: true }),
      togglePlayPause: () => set((state) => ({ isPlaying: !state.isPlaying })),
      
      // Cart
      cart: [],
      isCartOpen: false,
      setIsCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      addToCart: (product) => set((state) => {
        const existingItem = state.cart.find((item) => item.id === product.id);
        if (existingItem) {
          return {
            cart: state.cart.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ),
          };
        }
        return { cart: [...state.cart, { ...product, quantity: 1 }] };
      }),
      removeFromCart: (productId) => set((state) => ({
        cart: state.cart.filter((item) => item.id !== productId),
      })),
      updateQuantity: (productId, quantity) => set((state) => ({
        cart: state.cart.map((item) =>
          item.id === productId ? { ...item, quantity: Math.max(1, quantity) } : item
        ),
      })),
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const state = get();
        return state.cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },
    }),
    {
      name: 'artist-store',
      partialize: (state) => ({ isDarkMode: state.isDarkMode, cart: state.cart }),
    }
  )
);
