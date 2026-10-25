import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { Track, Product, TourDate, BlogPost, Album, HomeContent, Order, ContactMessage } from '../types';
import { SEED_TRACKS, SEED_ALBUMS, SEED_PRODUCTS, SEED_TOUR_DATES, SEED_BLOG_POSTS } from './seedData';
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
  isLoaded: boolean;
  isProductsLoading: boolean;
  isBlogLoading: boolean;
  user: User | null;
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

  // E-commerce Orders
  createOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  updateOrderReceipt: (orderId: string, receiptUrl: string) => Promise<void>;

  // Contact Transmissions
  sendContactMessage: (msg: Omit<ContactMessage, 'id' | 'createdAt' | 'status'>) => Promise<void>;
  updateMessageStatus: (id: string, status: ContactMessage['status']) => Promise<void>;
  updateMessageAttachment: (id: string, attachmentUrl: string) => Promise<void>;
  
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
  } catch (e) {
    return '';
  }
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
  isLoaded: false,
  isProductsLoading: true,
  isBlogLoading: true,
  user: null,
  isAuthLoaded: false,

  updateHomeContent: async (content) => {
    const updated = { ...getStore().homeContent, ...content };
    setStore({ homeContent: updated });
    await set('home_content', updated);
    try {
      await setDoc(doc(db, 'home_content', 'config'), updated, { merge: true });
    } catch (e) {
      console.warn('Firestore home_content sync error, using local persistence', e);
    }
  },

  addTrack: async (trackDb) => {
    const track: Track = {
      id: trackDb.id || `track-${Date.now()}`,
      title: trackDb.title,
      album: trackDb.album,
      duration: trackDb.duration || '3:30',
      coverUrl: trackDb.coverUrl || createUrl(trackDb.coverFile) || '/src/assets/images/manga_sound_panel_1792583212523.jpg',
      audioUrl: trackDb.audioUrl || createUrl(trackDb.audioFile) || 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg'
    };
    
    const newTracks = [...getStore().tracks, track];
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      await setDoc(doc(db, 'tracks', track.id), track);
    } catch (e) {
      console.warn('Firestore track sync error', e);
    }
  },

  updateTrack: async (id, updatedFields) => {
    const newTracks = getStore().tracks.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      await updateDoc(doc(db, 'tracks', id), updatedFields);
    } catch (e) {
      console.warn('Firestore track update error', e);
    }
  },

  deleteTrack: async (id) => {
    const newTracks = getStore().tracks.filter(t => t.id !== id);
    setStore({ tracks: newTracks });
    await set('tracks', newTracks);
    try {
      await deleteDoc(doc(db, 'tracks', id));
    } catch (e) {
      console.warn('Firestore track delete error', e);
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
      price: productDb.price,
      category: productDb.category,
      description: productDb.description,
      image: productDb.image || createUrl(productDb.imageFile) || '/src/assets/images/manga_gear_panel_1792583224309.jpg',
      inStock: productDb.inStock ?? true,
      downloadUrl: productDb.downloadUrl || ''
    };
    
    const newProducts = [...getStore().products, product];
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      await setDoc(doc(db, 'merchandise', product.id), product);
    } catch (e) {
      console.warn('Firestore product sync error', e);
    }
  },

  updateProduct: async (id, updatedFields) => {
    const newProducts = getStore().products.map(p => p.id === id ? { ...p, ...updatedFields } : p);
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      await updateDoc(doc(db, 'merchandise', id), updatedFields);
    } catch (e) {
      console.warn('Firestore product update error', e);
    }
  },

  deleteProduct: async (id) => {
    const newProducts = getStore().products.filter(p => p.id !== id);
    setStore({ products: newProducts });
    await set('products', newProducts);
    try {
      await deleteDoc(doc(db, 'merchandise', id));
    } catch (e) {
      console.warn('Firestore product delete error', e);
    }
  },

  fetchProducts: async () => {
    setStore({ isProductsLoading: true });
    try {
      const snap = await getDocs(collection(db, 'merchandise'));
      if (!snap.empty) {
        const firestoreProducts = snap.docs.map(d => d.data() as Product);
        setStore({ products: firestoreProducts });
        await set('products', firestoreProducts);
      }
    } catch (e) {
      console.warn('Firestore fetchProducts fallback:', e);
    } finally {
      // Ensure smooth, pleasant transition
      setTimeout(() => {
        setStore({ isProductsLoading: false });
      }, 350);
    }
  },

  addTourDate: async (tourDate) => {
    const date: TourDate = {
      ...tourDate,
      id: tourDate.id || `tour-${Date.now()}`
    };
    const newDates = [...getStore().tourDates, date];
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      await setDoc(doc(db, 'tour_dates', date.id), date);
    } catch (e) {
      console.warn('Firestore tour sync error', e);
    }
  },

  updateTourDate: async (id, updatedFields) => {
    const newDates = getStore().tourDates.map(t => t.id === id ? { ...t, ...updatedFields } : t);
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      await updateDoc(doc(db, 'tour_dates', id), updatedFields);
    } catch (e) {
      console.warn('Firestore tour update error', e);
    }
  },

  deleteTourDate: async (id) => {
    const newDates = getStore().tourDates.filter(t => t.id !== id);
    setStore({ tourDates: newDates });
    await set('tourDates', newDates);
    try {
      await deleteDoc(doc(db, 'tour_dates', id));
    } catch (e) {
      console.warn('Firestore tour delete error', e);
    }
  },

  addBlogPost: async (blogPostDb) => {
    const post: BlogPost = {
      id: blogPostDb.id || `log-${Date.now()}`,
      title: blogPostDb.title,
      excerpt: blogPostDb.excerpt,
      content: blogPostDb.content,
      date: blogPostDb.date || new Date().toISOString(),
      imageUrl: blogPostDb.imageUrl || createUrl(blogPostDb.imageFile) || '/src/assets/images/manga_tour_panel_1792583237044.jpg'
    };
    const newPosts = [...getStore().blogPosts, post];
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      await setDoc(doc(db, 'blog_posts', post.id), post);
    } catch (e) {
      console.warn('Firestore blog sync error', e);
    }
  },

  updateBlogPost: async (id, updatedFields) => {
    const newPosts = getStore().blogPosts.map(b => b.id === id ? { ...b, ...updatedFields } : b);
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      await updateDoc(doc(db, 'blog_posts', id), updatedFields);
    } catch (e) {
      console.warn('Firestore blog update error', e);
    }
  },

  deleteBlogPost: async (id) => {
    const newPosts = getStore().blogPosts.filter(b => b.id !== id);
    setStore({ blogPosts: newPosts });
    await set('blogPosts', newPosts);
    try {
      await deleteDoc(doc(db, 'blog_posts', id));
    } catch (e) {
      console.warn('Firestore blog delete error', e);
    }
  },

  fetchBlogPosts: async () => {
    setStore({ isBlogLoading: true });
    try {
      const snap = await getDocs(collection(db, 'blog_posts'));
      if (!snap.empty) {
        const firestoreBlog = snap.docs.map(d => d.data() as BlogPost);
        setStore({ blogPosts: firestoreBlog });
        await set('blogPosts', firestoreBlog);
      }
    } catch (e) {
      console.warn('Firestore fetchBlogPosts fallback:', e);
    } finally {
      setTimeout(() => {
        setStore({ isBlogLoading: false });
      }, 350);
    }
  },

  createOrder: async (order) => {
    const newOrders = [order, ...getStore().orders];
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (e) {
      console.warn('Firestore order create error', e);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    const newOrders = getStore().orders.map(o => o.id === orderId ? { ...o, status } : o);
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await updateDoc(doc(db, 'orders', orderId), { status });
    } catch (e) {
      console.warn('Firestore order status update error', e);
    }
  },

  updateOrderReceipt: async (orderId, receiptUrl) => {
    const newOrders = getStore().orders.map(o => o.id === orderId ? { ...o, receiptUrl } : o);
    setStore({ orders: newOrders });
    await set('orders', newOrders);
    try {
      await updateDoc(doc(db, 'orders', orderId), { receiptUrl });
    } catch (e) {
      console.warn('Firestore order receipt update error', e);
    }
  },

  sendContactMessage: async (msgData) => {
    const message: ContactMessage = {
      ...msgData,
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'unread'
    };
    const newMessages = [message, ...getStore().contactMessages];
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
    try {
      await setDoc(doc(db, 'contact_messages', message.id), message);
    } catch (e) {
      console.warn('Firestore contact message send error', e);
    }
  },

  updateMessageStatus: async (id, status) => {
    const newMessages = getStore().contactMessages.map(m => m.id === id ? { ...m, status } : m);
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status });
    } catch (e) {
      console.warn('Firestore contact status error', e);
    }
  },

  updateMessageAttachment: async (id, attachmentUrl) => {
    const newMessages = getStore().contactMessages.map(m => m.id === id ? { ...m, attachmentUrl } : m);
    setStore({ contactMessages: newMessages });
    await set('contact_messages', newMessages);
    try {
      await updateDoc(doc(db, 'contact_messages', id), { attachmentUrl });
    } catch (e) {
      console.warn('Firestore contact attachment error', e);
    }
  },

  loadData: async () => {
    // 1. Try local cache first for instant boot
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

    // 2. Try fetching live Firestore collections if available
    try {
      const [tracksSnap, productsSnap, tourSnap, blogSnap, ordersSnap, msgSnap] = await Promise.allSettled([
        getDocs(collection(db, 'tracks')),
        getDocs(collection(db, 'merchandise')),
        getDocs(collection(db, 'tour_dates')),
        getDocs(collection(db, 'blog_posts')),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'contact_messages')),
      ]);

      if (tracksSnap.status === 'fulfilled' && !tracksSnap.value.empty) {
        const firestoreTracks = tracksSnap.value.docs.map(d => d.data() as Track);
        setStore({ tracks: firestoreTracks });
        await set('tracks', firestoreTracks);
      }
      if (productsSnap.status === 'fulfilled' && !productsSnap.value.empty) {
        const firestoreProducts = productsSnap.value.docs.map(d => d.data() as Product);
        setStore({ products: firestoreProducts });
        await set('products', firestoreProducts);
      }
      if (tourSnap.status === 'fulfilled' && !tourSnap.value.empty) {
        const firestoreTour = tourSnap.value.docs.map(d => d.data() as TourDate);
        setStore({ tourDates: firestoreTour });
        await set('tourDates', firestoreTour);
      }
      if (blogSnap.status === 'fulfilled' && !blogSnap.value.empty) {
        const firestoreBlog = blogSnap.value.docs.map(d => d.data() as BlogPost);
        setStore({ blogPosts: firestoreBlog });
        await set('blogPosts', firestoreBlog);
      }
      if (ordersSnap.status === 'fulfilled' && !ordersSnap.value.empty) {
        const firestoreOrders = ordersSnap.value.docs.map(d => d.data() as Order);
        setStore({ orders: firestoreOrders });
        await set('orders', firestoreOrders);
      }
      if (msgSnap.status === 'fulfilled' && !msgSnap.value.empty) {
        const firestoreMsgs = msgSnap.value.docs.map(d => d.data() as ContactMessage);
        setStore({ contactMessages: firestoreMsgs });
        await set('contact_messages', firestoreMsgs);
      }
    } catch (e) {
      console.warn('Firestore load fallback to local store:', e);
    } finally {
      // Ensure visual feedback persists for a moment so skeleton states are visible and smooth
      setTimeout(() => {
        setStore({ isProductsLoading: false, isBlogLoading: false });
      }, 400);
    }
  },

  initAuth: () => {
    onAuthStateChanged(auth, (user) => {
      setStore({ user, isAuthLoaded: true });
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
    await logoutFirebase();
  }
}));
