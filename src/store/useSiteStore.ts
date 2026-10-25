import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import {
  Track,
  Product,
  TourDate,
  BlogPost,
  Album,
  HomeContent,
  Order,
  ContactMessage,
  UserAccount,
  UserPreferences,
  PaymentGatewayConfig,
  PaymentMethodId,
  AdminVaultSnapshot,
  CartItem
} from '../types';
import {
  SEED_TRACKS,
  SEED_ALBUMS,
  SEED_PRODUCTS,
  SEED_TOUR_DATES,
  SEED_BLOG_POSTS,
  SEED_PAYMENT_GATEWAYS
} from './seedData';
import { auth, db, loginWithGoogle, logout as logoutFirebase } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, doc, getDocs, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

export interface TrackDB extends Omit<Track, 'coverUrl' | 'audioUrl'> {
  coverFile?: File | Blob | string;
  audioFile?: File | Blob | string;
  coverUrl?: string;
  audioUrl?: string;
}

export interface ProductDB extends Omit<Product, 'image'> {
  imageFile?: File | Blob | string;
  image?: string;
}

export interface BlogPostDB extends Omit<BlogPost, 'imageUrl'> {
  imageFile?: File | Blob | string;
  imageUrl?: string;
}

export const DEFAULT_HOME_CONTENT: HomeContent = {
  albumTitle: 'MIDNIGHT ECHOES',
  albumSubtitle: 'DARK ORCHESTRA × MODULAR SYNTH',
  heroImageUrl: '/src/assets/images/manga_hero_splash_1792583199243.jpg',
  bannerTag: '【 新譜解禁 】 ALBUM CHRONICLE VOL. 01'
};

interface SiteState {
  tracks: Track[];
  albums: Album[];
  products: Product[];
  tourDates: TourDate[];
  blogPosts: BlogPost[];
  homeContent: HomeContent;
  orders: Order[];
  contactMessages: ContactMessage[];
  paymentGateways: PaymentGatewayConfig[];
  vaultSnapshot: AdminVaultSnapshot | null;
  isLoaded: boolean;
  isProductsLoading: boolean;
  isBlogLoading: boolean;
  user: User | null;
  account: UserAccount | null;
  authToken: string | null;
  isAuthLoaded: boolean;

  // Home Content Actions
  updateHomeContent: (content: Partial<HomeContent>) => Promise<void>;

  // Tracks Actions
  addTrack: (track: TrackDB) => Promise<void>;
  updateTrack: (id: string, track: Partial<Track>) => Promise<void>;
  deleteTrack: (id: string) => Promise<void>;

  // Albums Actions
  addAlbum: (album: Album) => Promise<void>;
  deleteAlbum: (id: string) => Promise<void>;

  // Products Actions
  addProduct: (product: ProductDB) => Promise<void>;
  updateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  fetchProducts: () => Promise<void>;

  // Tour Actions
  addTourDate: (tourDate: TourDate) => Promise<void>;
  updateTourDate: (id: string, tourDate: Partial<TourDate>) => Promise<void>;
  deleteTourDate: (id: string) => Promise<void>;

  // Blog Actions
  addBlogPost: (blogPost: BlogPostDB) => Promise<void>;
  updateBlogPost: (id: string, blogPost: Partial<BlogPost>) => Promise<void>;
  deleteBlogPost: (id: string) => Promise<void>;
  fetchBlogPosts: () => Promise<void>;

  // E-commerce Orders & Payment Gateways
  createOrder: (order: Order) => Promise<void>;
  submitServerCheckout: (payload: {
    items: CartItem[];
    customer: Order['customer'];
    paymentMethod: PaymentMethodId;
    shippingMethod: 'standard' | 'express';
    discountCode?: string;
  }) => Promise<Order>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateOrderReceipt: (orderId: string, receiptUrl: string) => Promise<void>;
  updatePaymentGateway: (
    id: PaymentMethodId,
    updates: Partial<PaymentGatewayConfig>
  ) => Promise<void>;

  // Contact Transmissions
  sendContactMessage: (msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateMessageStatus: (id: string, status: ContactMessage['status']) => Promise<void>;
  updateMessageAttachment: (id: string, attachmentUrl: string) => Promise<void>;

  // Account & Encrypted Vault Actions
  registerAccount: (data: {
    name: string;
    email: string;
    password: string;
    adminInviteCode?: string;
  }) => Promise<UserAccount>;
  loginWithPassword: (email: string, password: string) => Promise<UserAccount>;
  updatePreferences: (
    prefs: Partial<UserPreferences>,
    savedCart?: CartItem[],
    newName?: string
  ) => Promise<void>;
  toggleFavoriteTrack: (trackId: string) => Promise<void>;
  fetchAdminVault: () => Promise<void>;
  updateUserRole: (userId: string, role: 'user' | 'admin') => Promise<void>;

  loadData: () => Promise<void>;
  initAuth: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const createUrl = (file?: File | Blob | string) => {
  if (!file) return '';
  if (typeof file === 'string') return file;
  try {
    return URL.createObjectURL(file);
  } catch {
    return '';
  }
};

const getAuthHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const useSiteStore = create<SiteState>((setStore, getStore) => ({
  tracks: [],
  albums: [],
  products: [],
  tourDates: [],
  blogPosts: [],
  homeContent: DEFAULT_HOME_CONTENT,
  orders: [],
  contactMessages: [],
  paymentGateways: SEED_PAYMENT_GATEWAYS,
  vaultSnapshot: null,
  isLoaded: false,
  isProductsLoading: true,
  isBlogLoading: true,
  user: null,
  account: null,
  authToken: typeof window !== 'undefined' ? localStorage.getItem('zeji_auth_token') : null,
  isAuthLoaded: false,

  updateHomeContent: async (content) => {
    const updated = { ...getStore().homeContent, ...content };
    setStore({ homeContent: updated });
    await set('home_content', updated);
    try {
      await fetch('/api/admin/home', {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updated)
      });
    } catch {
      // fallback
    }
    try {
      await setDoc(doc(db, 'home_content', 'config'), updated, { merge: true });
    } catch {
      // local persistence fallback
    }
  },

  addTrack: async (trackDb) => {
    const track: Track = {
      id: trackDb.id || `track-${Date.now()}`,
      title: trackDb.title,
      album: trackDb.album,
      duration: trackDb.duration || '3:30',
      price: trackDb.price !== undefined ? Number(trackDb.price) : 2.99,
      coverUrl:
        trackDb.coverUrl ||
        createUrl(trackDb.coverFile) ||
        '/src/assets/images/manga_sound_panel_1792583212523.jpg',
      audioUrl:
        trackDb.audioUrl ||
        createUrl(trackDb.audioFile) ||
        'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg'
    };

    const newTracks = [...getStore().tracks, track];
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      const res = await fetch('/api/admin/tracks', {
        method: 'POST',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(track)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tracks) setStore({ tracks: data.tracks });
      }
    } catch {
      // fallback
    }
    try {
      await setDoc(doc(db, 'tracks', track.id), track);
    } catch {
      // fallback
    }
  },

  updateTrack: async (id, updatedFields) => {
    const newTracks = getStore().tracks.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      const res = await fetch(`/api/admin/tracks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tracks) setStore({ tracks: data.tracks });
      }
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'tracks', id), updatedFields);
    } catch {
      // fallback
    }
  },

  deleteTrack: async (id) => {
    const newTracks = getStore().tracks.filter(t => t.id !== id);
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      await fetch(`/api/admin/tracks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(getStore().authToken)
      });
    } catch {
      // fallback
    }
    try {
      await deleteDoc(doc(db, 'tracks', id));
    } catch {
      // fallback
    }
  },

  addAlbum: async (album) => {
    const newAlbums = [...getStore().albums, album];
    setStore({ albums: newAlbums });
    await set('albums', newAlbums);
  },
  deleteAlbum: async (id) => {
    const newAlbums = getStore().albums.filter(a => a.id !== id);
    setStore({ albums: newAlbums });
    await set('albums', newAlbums);
  },

  addProduct: async (productDb) => {
    const product: Product = {
      id: productDb.id || `item-${Date.now()}`,
      name: productDb.name,
      price: Number(productDb.price) || 0,
      category: productDb.category,
      description: productDb.description,
      image:
        productDb.image ||
        createUrl(productDb.imageFile) ||
        '/src/assets/images/manga_gear_panel_1792583224309.jpg',
      inStock: productDb.inStock ?? true,
      downloadUrl: productDb.downloadUrl || ''
    };

    const newProducts = [...getStore().products, product];
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(product)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setStore({ products: data.products });
      }
    } catch {
      // fallback
    }
    try {
      await setDoc(doc(db, 'merchandise', product.id), product);
    } catch {
      // fallback
    }
  },

  updateProduct: async (id, updatedFields) => {
    const newProducts = getStore().products.map(p =>
      p.id === id ? { ...p, ...updatedFields } : p
    );
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      const res = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.products) setStore({ products: data.products });
      }
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'merchandise', id), updatedFields);
    } catch {
      // fallback
    }
  },

  deleteProduct: async (id) => {
    const newProducts = getStore().products.filter(p => p.id !== id);
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(getStore().authToken)
      });
    } catch {
      // fallback
    }
    try {
      await deleteDoc(doc(db, 'merchandise', id));
    } catch {
      // fallback
    }
  },

  fetchProducts: async () => {
    setStore({ isProductsLoading: true });
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.products) && data.products.length > 0) {
          setStore({ products: data.products });
          await set('products', data.products);
        }
      }
    } catch {
      // fallback to Firestore
      try {
        const snap = await getDocs(collection(db, 'merchandise'));
        if (!snap.empty) {
          const firestoreProducts = snap.docs.map(d => d.data() as Product);
          setStore({ products: firestoreProducts });
          await set('products', firestoreProducts);
        }
      } catch {
        // ignore
      }
    } finally {
      setTimeout(() => {
        setStore({ isProductsLoading: false });
      }, 250);
    }
  },

  addTourDate: async (tourDate) => {
    const date: TourDate = {
      ...tourDate,
      id: tourDate.id || `tour-${Date.now()}`,
      price: tourDate.price ?? 55
    };
    const newDates = [...getStore().tourDates, date];
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      const res = await fetch('/api/admin/tour', {
        method: 'POST',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(date)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tourDates) setStore({ tourDates: data.tourDates });
      }
    } catch {
      // fallback
    }
    try {
      await setDoc(doc(db, 'tour_dates', date.id), date);
    } catch {
      // fallback
    }
  },

  updateTourDate: async (id, updatedFields) => {
    const newDates = getStore().tourDates.map(t => (t.id === id ? { ...t, ...updatedFields } : t));
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      const res = await fetch(`/api/admin/tour/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.tourDates) setStore({ tourDates: data.tourDates });
      }
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'tour_dates', id), updatedFields);
    } catch {
      // fallback
    }
  },

  deleteTourDate: async (id) => {
    const newDates = getStore().tourDates.filter(t => t.id !== id);
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      await fetch(`/api/admin/tour/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(getStore().authToken)
      });
    } catch {
      // fallback
    }
    try {
      await deleteDoc(doc(db, 'tour_dates', id));
    } catch {
      // fallback
    }
  },

  addBlogPost: async (blogPostDb) => {
    const post: BlogPost = {
      id: blogPostDb.id || `log-${Date.now()}`,
      title: blogPostDb.title,
      excerpt: blogPostDb.excerpt,
      content: blogPostDb.content,
      date: blogPostDb.date || new Date().toISOString(),
      imageUrl:
        blogPostDb.imageUrl ||
        createUrl(blogPostDb.imageFile) ||
        '/src/assets/images/manga_tour_panel_1792583237044.jpg',
      attachmentUrl: blogPostDb.attachmentUrl
    };
    const newPosts = [post, ...getStore().blogPosts];
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      const res = await fetch('/api/admin/blog', {
        method: 'POST',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(post)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blogPosts) setStore({ blogPosts: data.blogPosts });
      }
    } catch {
      // fallback
    }
    try {
      await setDoc(doc(db, 'blog_posts', post.id), post);
    } catch {
      // fallback
    }
  },

  updateBlogPost: async (id, updatedFields) => {
    const newPosts = getStore().blogPosts.map(b => (b.id === id ? { ...b, ...updatedFields } : b));
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      const res = await fetch(`/api/admin/blog/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updatedFields)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blogPosts) setStore({ blogPosts: data.blogPosts });
      }
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'blog_posts', id), updatedFields);
    } catch {
      // fallback
    }
  },

  deleteBlogPost: async (id) => {
    const newPosts = getStore().blogPosts.filter(b => b.id !== id);
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      await fetch(`/api/admin/blog/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(getStore().authToken)
      });
    } catch {
      // fallback
    }
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
    } catch {
      // fallback
    }
  },

  fetchBlogPosts: async () => {
    setStore({ isBlogLoading: true });
    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.blogPosts) && data.blogPosts.length > 0) {
          setStore({ blogPosts: data.blogPosts });
          await set('blogPosts', data.blogPosts);
        }
      }
    } catch {
      // fallback
    } finally {
      setTimeout(() => {
        setStore({ isBlogLoading: false });
      }, 250);
    }
  },

  createOrder: async (order) => {
    const newOrders = [order, ...getStore().orders];
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch {
      // fallback
    }
  },

  submitServerCheckout: async (payload) => {
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: getAuthHeaders(getStore().authToken),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Checkout settlement failed');
    }
    const createdOrder = data.order as Order;
    const newOrders = [createdOrder, ...getStore().orders];
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    return createdOrder;
  },

  updateOrderStatus: async (orderId, status) => {
    const newOrders = getStore().orders.map(o => (o.id === orderId ? { ...o, status } : o));
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({ status })
      });
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch {
      // fallback
    }
  },

  updateOrderReceipt: async (orderId, receiptUrl) => {
    const newOrders = getStore().orders.map(o => (o.id === orderId ? { ...o, receiptUrl } : o));
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({ receiptUrl })
      });
    } catch {
      // fallback
    }
    try {
      await updateDoc(doc(db, 'orders', orderId), { receiptUrl });
    } catch {
      // fallback
    }
  },

  updatePaymentGateway: async (id, updates) => {
    const updatedGateways = getStore().paymentGateways.map(g =>
      g.id === id ? { ...g, ...updates } : g
    );
    setStore({ paymentGateways: updatedGateways });
    try {
      const res = await fetch(`/api/admin/gateways/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.paymentGateways) {
          setStore({ paymentGateways: data.paymentGateways });
        }
      }
    } catch {
      // fallback
    }
  },

  sendContactMessage: async (msgData) => {
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(msgData)
      });
      if (res.ok) {
        const data = await res.json();
        const newMessages = [data.message, ...getStore().contactMessages];
        setStore({ contactMessages: newMessages });
        await set('contact_messages', newMessages);
        return;
      }
    } catch {
      // fallback
    }
    const message: ContactMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'unread'
    };
    const newMessages = [message, ...getStore().contactMessages];
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
  },

  updateMessageStatus: async (id, status) => {
    const newMessages = getStore().contactMessages.map(m =>
      m.id === id ? { ...m, status } : m
    );
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
    try {
      await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({ status })
      });
    } catch {
      // fallback
    }
  },

  updateMessageAttachment: async (id, attachmentUrl) => {
    const newMessages = getStore().contactMessages.map(m =>
      m.id === id ? { ...m, attachmentUrl } : m
    );
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
    try {
      await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({ attachmentUrl })
      });
    } catch {
      // fallback
    }
  },

  // Account & Encrypted Vault Methods
  registerAccount: async (payload) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Account registration failed');
    }
    if (data.token) {
      localStorage.setItem('zeji_auth_token', data.token);
    }
    setStore({
      account: data.user,
      authToken: data.token,
      orders: Array.isArray(data.orders) ? data.orders : getStore().orders
    });
    return data.user as UserAccount;
  },

  loginWithPassword: async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid login credentials');
    }
    if (data.token) {
      localStorage.setItem('zeji_auth_token', data.token);
    }
    setStore({
      account: data.user,
      authToken: data.token,
      orders: Array.isArray(data.orders) ? data.orders : getStore().orders
    });
    if (data.user.role === 'admin') {
      getStore().fetchAdminVault();
    }
    return data.user as UserAccount;
  },

  updatePreferences: async (prefs, savedCart, newName) => {
    const currentAccount = getStore().account;
    if (!currentAccount) return;

    const mergedPrefs: UserPreferences = {
      ...currentAccount.preferences,
      ...prefs
    };

    setStore({
      account: {
        ...currentAccount,
        name: newName || currentAccount.name,
        preferences: mergedPrefs,
        savedCart: savedCart ?? currentAccount.savedCart
      }
    });

    try {
      const res = await fetch('/api/account/preferences', {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({
          preferences: mergedPrefs,
          savedCart,
          name: newName
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setStore({ account: data.user });
      }
    } catch {
      // local state preserved
    }
  },

  toggleFavoriteTrack: async (trackId) => {
    const currentAccount = getStore().account;
    if (!currentAccount) return;
    const currentFavs = currentAccount.preferences.favoriteTrackIds || [];
    const exists = currentFavs.includes(trackId);
    const updatedFavs = exists
      ? currentFavs.filter(id => id !== trackId)
      : [...currentFavs, trackId];
    await getStore().updatePreferences({ favoriteTrackIds: updatedFavs });
  },

  fetchAdminVault: async () => {
    try {
      const res = await fetch('/api/admin/vault', {
        headers: getAuthHeaders(getStore().authToken)
      });
      if (res.ok) {
        const data = await res.json();
        setStore({
          vaultSnapshot: data,
          orders: Array.isArray(data.orders) ? data.orders : getStore().orders,
          contactMessages: Array.isArray(data.contactMessages)
            ? data.contactMessages
            : getStore().contactMessages,
          paymentGateways: Array.isArray(data.paymentGateways)
            ? data.paymentGateways
            : getStore().paymentGateways
        });
      }
    } catch {
      // ignore if not admin
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PUT',
        headers: getAuthHeaders(getStore().authToken),
        body: JSON.stringify({ role })
      });
      if (res.ok) {
        await getStore().fetchAdminVault();
      }
    } catch {
      // ignore
    }
  },

  loadData: async () => {
    const localTracks = (await get('tracks')) || [];
    const localProducts = (await get('products')) || [];
    const localTourDates = (await get('tourDates')) || [];
    const localBlogPosts = (await get('blogPosts')) || [];
    const localHomeContent = (await get('home_content')) || DEFAULT_HOME_CONTENT;
    const localOrders = (await get('orders')) || [];
    const localMessages = (await get('contact_messages')) || [];

    setStore({
      tracks: localTracks.length > 0 ? localTracks : SEED_TRACKS,
      products: localProducts.length > 0 ? localProducts : SEED_PRODUCTS,
      tourDates: localTourDates.length > 0 ? localTourDates : SEED_TOUR_DATES,
      blogPosts: localBlogPosts.length > 0 ? localBlogPosts : SEED_BLOG_POSTS,
      homeContent: localHomeContent,
      orders: localOrders,
      contactMessages: localMessages,
      albums: SEED_ALBUMS,
      isLoaded: true
    });

    try {
      const res = await fetch('/api/catalog');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks) && data.tracks.length > 0) {
          setStore({ tracks: data.tracks });
          await set('tracks', data.tracks);
        }
        if (Array.isArray(data.products) && data.products.length > 0) {
          setStore({ products: data.products });
          await set('products', data.products);
        }
        if (Array.isArray(data.tourDates) && data.tourDates.length > 0) {
          setStore({ tourDates: data.tourDates });
          await set('tourDates', data.tourDates);
        }
        if (Array.isArray(data.blogPosts) && data.blogPosts.length > 0) {
          setStore({ blogPosts: data.blogPosts });
          await set('blogPosts', data.blogPosts);
        }
        if (data.homeContent) {
          setStore({ homeContent: data.homeContent });
          await set('home_content', data.homeContent);
        }
        if (Array.isArray(data.paymentGateways)) {
          setStore({ paymentGateways: data.paymentGateways });
        }
      }
    } catch {
      // Fallback to local/seed data
    } finally {
      setTimeout(() => {
        setStore({ isProductsLoading: false, isBlogLoading: false });
      }, 250);
    }
  },

  initAuth: () => {
    const existingToken = getStore().authToken;
    if (existingToken) {
      fetch('/api/auth/me', {
        headers: getAuthHeaders(existingToken)
      })
        .then(async res => {
          if (res.ok) {
            const data = await res.json();
            setStore({
              account: data.user,
              orders: Array.isArray(data.orders) ? data.orders : getStore().orders,
              isAuthLoaded: true
            });
            if (data.user?.role === 'admin') {
              getStore().fetchAdminVault();
            }
          } else {
            localStorage.removeItem('zeji_auth_token');
            setStore({ authToken: null, account: null, isAuthLoaded: true });
          }
        })
        .catch(() => {
          setStore({ isAuthLoaded: true });
        });
    } else {
      setStore({ isAuthLoaded: true });
    }

    onAuthStateChanged(auth, (firebaseUser) => {
      setStore({ user: firebaseUser, isAuthLoaded: true });
    });
  },

  login: async () => {
    try {
      await loginWithGoogle();
    } catch (e: any) {
      if (e.code === 'auth/popup-closed-by-user') {
        console.log('Login cancelled by user');
      } else {
        console.error('Login error:', e);
      }
    }
  },

  logout: async () => {
    localStorage.removeItem('zeji_auth_token');
    setStore({ account: null, authToken: null, vaultSnapshot: null });
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // ignore
    }
    try {
      await logoutFirebase();
    } catch {
      // ignore
    }
  }
}));
