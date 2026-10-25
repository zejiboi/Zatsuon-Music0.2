import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldAlert, ShieldCheck, Trash2, Edit3, Save, X, 
  Disc, ShoppingBag, MapPin, FileText, Mail, Home as HomeIcon, 
  CheckCircle, Package, Download,
  LogOut, LogIn, RefreshCw, Upload, CreditCard, Lock, Database,
  DollarSign, Users, KeyRound, Sparkles, Smartphone
} from 'lucide-react';
import { useSiteStore } from '../store/useSiteStore';
import { Track, Product, TourDate, BlogPost, HomeContent, PaymentGatewayConfig } from '../types';
import { playHoverSound, playSelectSound, playEquipSound, playCancelSound } from '../lib/gameSound';

// Utility: Convert File to base64 Data URL for persistent in-browser & DB playback
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Utility: Automatically extract duration from MP3/WAV audio file metadata
const extractAudioDuration = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();
    audio.src = objectUrl;

    const cleanup = () => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        // ignore
      }
    };

    audio.addEventListener('loadedmetadata', () => {
      const totalSeconds = Math.floor(audio.duration);
      if (!isNaN(totalSeconds) && totalSeconds > 0) {
        const mins = Math.floor(totalSeconds / 60);
        const secs = totalSeconds % 60;
        const formatted = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        cleanup();
        resolve(formatted);
      } else {
        cleanup();
        resolve('3:30');
      }
    });

    audio.addEventListener('error', () => {
      cleanup();
      resolve('3:30');
    });
  });
};

type AdminSectorId = 'home' | 'sound' | 'store' | 'orders' | 'tour' | 'intel' | 'comms' | 'gateways' | 'vault';

export const Admin: React.FC = () => {
  const {
    user, account, isAuthLoaded, login, loginWithPassword, logout,
    tracks, addTrack, updateTrack, deleteTrack,
    products, addProduct, updateProduct, deleteProduct,
    tourDates, addTourDate, updateTourDate, deleteTourDate,
    blogPosts, addBlogPost, updateBlogPost, deleteBlogPost,
    homeContent, updateHomeContent,
    orders, updateOrderStatus, updateOrderReceipt,
    contactMessages, updateMessageStatus, updateMessageAttachment,
    paymentGateways, updatePaymentGateway,
    vaultSnapshot, fetchAdminVault, updateUserRole
  } = useSiteStore();

  const [activeSector, setActiveSector] = useState<AdminSectorId>('store');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isExtractingDuration, setIsExtractingDuration] = useState(false);

  // Admin Login Form State (for direct encrypted backend auth on Desktop & Mobile)
  const [adminEmail, setAdminEmail] = useState('josephgitongaofficial@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [isAdminLoggingIn, setIsAdminLoggingIn] = useState(false);

  // Quick inline price state maps
  const [quickProductPrices, setQuickProductPrices] = useState<Record<string, string>>({});
  const [quickTrackPrices, setQuickTrackPrices] = useState<Record<string, string>>({});
  const [quickTourPrices, setQuickTourPrices] = useState<Record<string, string>>({});

  // 1. Home Sector File Upload State
  const [homeForm, setHomeForm] = useState<HomeContent>(homeContent);
  const [homeHeroFile, setHomeHeroFile] = useState<File | null>(null);
  const [homeHeroPreview, setHomeHeroPreview] = useState<string>('');

  useEffect(() => {
    setHomeForm(homeContent);
  }, [homeContent]);

  // 2. Sound Sector File Upload State
  const [newTrack, setNewTrack] = useState({
    title: '',
    album: 'MIDNIGHT ECHOES',
    duration: '',
    price: 1.99,
    coverUrl: '',
    audioUrl: ''
  });
  const [trackAudioFile, setTrackAudioFile] = useState<File | null>(null);
  const [trackCoverFile, setTrackCoverFile] = useState<File | null>(null);

  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [editTrackForm, setEditTrackForm] = useState({
    title: '',
    album: '',
    duration: '',
    price: 1.99,
    coverUrl: '',
    audioUrl: ''
  });
  const [editTrackAudioFile, setEditTrackAudioFile] = useState<File | null>(null);
  const [editTrackCoverFile, setEditTrackCoverFile] = useState<File | null>(null);

  // 3. Store Sector File Upload State (Image & Digital Asset File)
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: 0,
    category: 'Apparel',
    description: '',
    image: '',
    inStock: true,
    downloadUrl: ''
  });
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productDownloadFile, setProductDownloadFile] = useState<File | null>(null);

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProductForm, setEditProductForm] = useState({
    name: '',
    price: 0,
    category: 'Apparel',
    description: '',
    image: '',
    inStock: true,
    downloadUrl: ''
  });
  const [editProductImageFile, setEditProductImageFile] = useState<File | null>(null);
  const [editProductDownloadFile, setEditProductDownloadFile] = useState<File | null>(null);

  // 4. Tour Sector File Upload State (Flyer / Poster Artwork)
  const [newTour, setNewTour] = useState({
    date: '',
    venue: '',
    city: '',
    country: '',
    price: 45,
    ticketUrl: '',
    isSoldOut: false,
    posterUrl: ''
  });
  const [tourPosterFile, setTourPosterFile] = useState<File | null>(null);

  const [editingTour, setEditingTour] = useState<TourDate | null>(null);
  const [editTourForm, setEditTourForm] = useState({
    date: '',
    venue: '',
    city: '',
    country: '',
    price: 45,
    ticketUrl: '',
    isSoldOut: false,
    posterUrl: ''
  });
  const [editTourPosterFile, setEditTourPosterFile] = useState<File | null>(null);

  // 5. Intel / Blog Sector File Upload State (Header Art & Attached Dossier File)
  const [newBlog, setNewBlog] = useState({
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    attachmentUrl: ''
  });
  const [blogImageFile, setBlogImageFile] = useState<File | null>(null);
  const [blogAttachmentFile, setBlogAttachmentFile] = useState<File | null>(null);

  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  const [editBlogForm, setEditBlogForm] = useState({
    title: '',
    excerpt: '',
    content: '',
    imageUrl: '',
    attachmentUrl: ''
  });
  const [editBlogImageFile, setEditBlogImageFile] = useState<File | null>(null);
  const [editBlogAttachmentFile, setEditBlogAttachmentFile] = useState<File | null>(null);

  // Gateway edit state
  const [gatewayDrafts, setGatewayDrafts] = useState<Record<string, PaymentGatewayConfig>>({});

  useEffect(() => {
    const map: Record<string, PaymentGatewayConfig> = {};
    paymentGateways.forEach(gw => {
      map[gw.id] = { ...gw };
    });
    setGatewayDrafts(map);
  }, [paymentGateways]);

  const isAdmin = Boolean(
    account?.role === 'admin' ||
    (user && user.email === 'josephgitongaofficial@gmail.com')
  );

  useEffect(() => {
    if (isAdmin && activeSector === 'vault') {
      fetchAdminVault();
    }
  }, [isAdmin, activeSector]);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  const handleAdminPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError(null);
    setIsAdminLoggingIn(true);
    playSelectSound();
    try {
      await loginWithPassword(adminEmail, adminPassword);
      playEquipSound();
      showNotification('Root Admin clearance verified. Encrypted repositories unlocked.');
    } catch (err: any) {
      setAdminLoginError(err?.message || 'Invalid root credentials.');
      playCancelSound();
    } finally {
      setIsAdminLoggingIn(false);
    }
  };

  // 1. Loading State
  if (!isAuthLoaded) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 border-4 border-white border-t-[#00FF66] animate-spin mb-4"></div>
        <span className="font-mono text-xs text-[#00FF66] tracking-widest uppercase">
          VERIFYING BIOMETRIC CLEARANCE...
        </span>
      </div>
    );
  }

  // 2. Strict Security Access Guard: Root Admin Login Console (Works on Desktop & Mobile)
  if (!isAdmin) {
    return (
      <div className="max-w-[720px] mx-auto px-3 sm:px-8 py-10 sm:py-16 relative z-10 font-sans pb-28">
        <div 
          className="bg-black border-2 border-white p-5 sm:p-10 shadow-[8px_8px_0_#ff0055] text-white relative overflow-hidden"
          style={{
            clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))'
          }}
        >
          <div className="flex items-center gap-3 pb-4 mb-6 border-b-2 border-white">
            <span className="p-2 bg-red-600 text-white">
              <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
            </span>
            <div>
              <span className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-widest block">
                【 警報 】 ROOT CLEARANCE REQUIRED // 権限拒否
              </span>
              <h1 className="text-xl sm:text-3xl font-game font-black text-white uppercase tracking-tight">
                ADMIN COMMAND AUTHENTICATION
              </h1>
            </div>
          </div>

          <div className="p-4 bg-zinc-950 border border-zinc-800 font-mono text-xs space-y-2 mb-6">
            <p className="text-zinc-300 leading-relaxed">
              This master command terminal (Desktop &amp; Mobile Admin Pane) is restricted exclusively to authorized system administrators:
            </p>
            <div className="p-2 bg-black border border-zinc-700 text-[#00FF66] font-bold flex items-center justify-between flex-wrap gap-2">
              <span>josephgitongaofficial@gmail.com</span>
              <span className="text-[10px] text-zinc-400">AES-256-GCM VAULT GUARD</span>
            </div>
            <div className="text-zinc-500 text-[11px] pt-1">
              {user ? (
                <span>Current identity: <strong className="text-white">{user.email}</strong> (Standard Operative - Root Required)</span>
              ) : (
                <span>No active root operator session detected. Authenticate below.</span>
              )}
            </div>
          </div>

          {adminLoginError && (
            <div className="mb-4 p-3 bg-red-950/90 border-2 border-red-500 text-xs font-mono text-red-200">
              {adminLoginError}
            </div>
          )}

          {/* Direct Encrypted Vault Admin Sign-In Form */}
          <form onSubmit={handleAdminPasswordLogin} className="p-4 sm:p-5 bg-zinc-950 border-2 border-[#00FF66] space-y-4 font-mono text-xs mb-6">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-[#00FF66] font-game font-black uppercase flex items-center gap-1.5">
                <KeyRound className="w-4 h-4" /> DIRECT ROOT VAULT LOGIN
              </span>
              <button
                type="button"
                onClick={() => {
                  playEquipSound();
                  setAdminEmail('josephgitongaofficial@gmail.com');
                  setAdminPassword('ZejiAdmin#2026!');
                }}
                className="px-2 py-1 bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black text-[10px] font-bold transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>AUTOFILL ROOT DEMO</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">ADMIN EMAIL</label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={e => setAdminEmail(e.target.value)}
                  className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-zinc-400 text-[10px] mb-1">ROOT PASSWORD</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isAdminLoggingIn}
              className="w-full py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[3px_3px_0_#ffffff]"
            >
              <LogIn className="w-4 h-4" />
              <span>{isAdminLoggingIn ? 'DECRYPTING ROOT SESSION...' : 'UNLOCK MASTER ADMIN TERMINAL // 認証'}</span>
            </button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t-2 border-zinc-800">
            <button
              onClick={() => {
                playSelectSound();
                login();
              }}
              className="flex-1 px-5 py-3 bg-zinc-900 hover:bg-white text-white hover:text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border border-zinc-700"
            >
              <LogIn className="w-4 h-4 text-[#00FF66]" />
              <span>GOOGLE OAUTH SIGN-IN</span>
            </button>

            <Link
              to="/account"
              className="px-5 py-3 bg-black hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-mono font-bold text-xs uppercase tracking-wider transition-all border border-[#00FF66] text-center flex items-center justify-center"
            >
              ACCOUNT &amp; ADMIN INVITE
            </Link>

            <Link
              to="/"
              className="px-5 py-3 bg-black hover:bg-white text-zinc-400 hover:text-black font-mono text-xs uppercase tracking-wider transition-all border border-zinc-700 text-center flex items-center justify-center"
            >
              PUBLIC HUB
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Fully Authorized Admin Console Actions

  // Quick Price Update Handlers
  const handleQuickProductPriceSave = async (p: Product) => {
    const raw = quickProductPrices[p.id];
    const parsed = raw !== undefined ? parseFloat(raw) : p.price;
    if (isNaN(parsed) || parsed < 0) return;
    playEquipSound();
    await updateProduct(p.id, { price: Number(parsed.toFixed(2)) });
    showNotification(`Price for "${p.name}" updated to $${parsed.toFixed(2)} USD.`);
  };

  const handleQuickTrackPriceSave = async (t: Track) => {
    const raw = quickTrackPrices[t.id];
    const parsed = raw !== undefined ? parseFloat(raw) : (t.price ?? 1.99);
    if (isNaN(parsed) || parsed < 0) return;
    playEquipSound();
    await updateTrack(t.id, { price: Number(parsed.toFixed(2)) });
    showNotification(`Track price for "${t.title}" set to $${parsed.toFixed(2)} USD.`);
  };

  const handleQuickTourPriceSave = async (t: TourDate) => {
    const raw = quickTourPrices[t.id];
    const parsed = raw !== undefined ? parseFloat(raw) : (t.price ?? 45);
    if (isNaN(parsed) || parsed < 0) return;
    playEquipSound();
    await updateTourDate(t.id, { price: Number(parsed.toFixed(2)) });
    showNotification(`Tour pass price for ${t.city} set to $${parsed.toFixed(2)} USD.`);
  };

  // Save Home Content with File Upload Support
  const handleSaveHome = async (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();

    let finalHeroUrl = homeForm.heroImageUrl;
    if (homeHeroFile) {
      try {
        finalHeroUrl = await fileToDataUrl(homeHeroFile);
      } catch (err) {
        console.warn('Hero file conversion error', err);
      }
    }

    const updatedHome = {
      ...homeForm,
      heroImageUrl: finalHeroUrl
    };

    await updateHomeContent(updatedHome);
    setHomeForm(updatedHome);
    setHomeHeroFile(null);
    setHomeHeroPreview('');
    playEquipSound();
    showNotification('Home sector configuration and hero artwork committed live.');
  };

  // Upload Audio File for New Track & Extract Duration
  const handleNewTrackAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setTrackAudioFile(file);
    setIsExtractingDuration(true);
    playSelectSound();
    try {
      const duration = await extractAudioDuration(file);
      setNewTrack(prev => ({ ...prev, duration }));
    } catch (err) {
      console.error('Audio duration extraction error:', err);
    } finally {
      setIsExtractingDuration(false);
    }
  };

  // Create New Track
  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrack.title.trim()) return;
    playSelectSound();

    let finalAudioUrl = newTrack.audioUrl;
    if (trackAudioFile) {
      try {
        finalAudioUrl = await fileToDataUrl(trackAudioFile);
      } catch (e) {
        console.warn('Fallback to blob URL for audio', e);
      }
    }

    let finalCoverUrl = newTrack.coverUrl;
    if (trackCoverFile) {
      try {
        finalCoverUrl = await fileToDataUrl(trackCoverFile);
      } catch (e) {
        console.warn('Fallback to blob URL for cover', e);
      }
    }

    await addTrack({
      id: `track-${Date.now()}`,
      title: newTrack.title,
      album: newTrack.album,
      duration: newTrack.duration || '3:30',
      price: Number(newTrack.price) >= 0 ? Number(newTrack.price) : 1.99,
      coverUrl: finalCoverUrl || '/src/assets/images/manga_sound_panel_1792583212523.jpg',
      audioUrl: finalAudioUrl || 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg'
    });

    playEquipSound();
    setNewTrack({ title: '', album: 'MIDNIGHT ECHOES', duration: '', price: 1.99, coverUrl: '', audioUrl: '' });
    setTrackAudioFile(null);
    setTrackCoverFile(null);
    showNotification('Audio track registered with price & synced to playlist.');
  };

  // Start Editing Track
  const handleStartEditTrack = (track: Track) => {
    playSelectSound();
    setEditingTrack(track);
    setEditTrackForm({
      title: track.title,
      album: track.album,
      duration: track.duration,
      price: track.price ?? 1.99,
      coverUrl: track.coverUrl,
      audioUrl: track.audioUrl
    });
    setEditTrackAudioFile(null);
    setEditTrackCoverFile(null);
  };

  // Upload Audio File when Editing Track & Extract Duration
  const handleEditTrackAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setEditTrackAudioFile(file);
    setIsExtractingDuration(true);
    playSelectSound();
    try {
      const duration = await extractAudioDuration(file);
      setEditTrackForm(prev => ({ ...prev, duration }));
    } catch (err) {
      console.error('Audio duration extraction error:', err);
    } finally {
      setIsExtractingDuration(false);
    }
  };

  // Save Track Edits
  const handleSaveEditTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrack) return;
    playSelectSound();

    let finalAudioUrl = editTrackForm.audioUrl;
    if (editTrackAudioFile) {
      try {
        finalAudioUrl = await fileToDataUrl(editTrackAudioFile);
      } catch (err) {
        console.warn('DataURL conversion fallback', err);
      }
    }

    let finalCoverUrl = editTrackForm.coverUrl;
    if (editTrackCoverFile) {
      try {
        finalCoverUrl = await fileToDataUrl(editTrackCoverFile);
      } catch (err) {
        console.warn('DataURL conversion fallback', err);
      }
    }

    await updateTrack(editingTrack.id, {
      title: editTrackForm.title,
      album: editTrackForm.album,
      duration: editTrackForm.duration,
      price: Number(editTrackForm.price) >= 0 ? Number(editTrackForm.price) : 1.99,
      coverUrl: finalCoverUrl,
      audioUrl: finalAudioUrl
    });

    playEquipSound();
    setEditingTrack(null);
    setEditTrackAudioFile(null);
    setEditTrackCoverFile(null);
    showNotification(`Track "${editTrackForm.title}" updated successfully.`);
  };

  // Create Product with Image & Digital Download Asset Upload
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name.trim()) return;
    playSelectSound();

    let finalImage = newProduct.image;
    if (productImageFile) {
      try {
        finalImage = await fileToDataUrl(productImageFile);
      } catch (e) {
        console.warn('Fallback to blob URL for image', e);
      }
    }

    let finalDownloadUrl = newProduct.downloadUrl;
    if (productDownloadFile) {
      try {
        finalDownloadUrl = await fileToDataUrl(productDownloadFile);
      } catch (e) {
        console.warn('Fallback to blob URL for digital asset', e);
      }
    }

    await addProduct({
      id: `item-${Date.now()}`,
      name: newProduct.name,
      price: Number(newProduct.price),
      category: newProduct.category as any,
      description: newProduct.description,
      image: finalImage || '/src/assets/images/manga_gear_panel_1792583224309.jpg',
      inStock: newProduct.inStock,
      downloadUrl: finalDownloadUrl
    });

    playEquipSound();
    setNewProduct({ name: '', price: 0, category: 'Apparel', description: '', image: '', inStock: true, downloadUrl: '' });
    setProductImageFile(null);
    setProductDownloadFile(null);
    showNotification('Product item equipped and listed in Armory store.');
  };

  // Start Editing Product
  const handleStartEditProduct = (p: Product) => {
    playSelectSound();
    setEditingProduct(p);
    setEditProductForm({
      name: p.name,
      price: p.price,
      category: p.category,
      description: p.description,
      image: p.image,
      inStock: p.inStock ?? true,
      downloadUrl: p.downloadUrl || ''
    });
    setEditProductImageFile(null);
    setEditProductDownloadFile(null);
  };

  // Save Product Edits
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    playSelectSound();

    let finalImage = editProductForm.image;
    if (editProductImageFile) {
      try {
        finalImage = await fileToDataUrl(editProductImageFile);
      } catch (err) {
        console.warn('DataURL image fallback', err);
      }
    }

    let finalDownloadUrl = editProductForm.downloadUrl;
    if (editProductDownloadFile) {
      try {
        finalDownloadUrl = await fileToDataUrl(editProductDownloadFile);
      } catch (err) {
        console.warn('DataURL digital asset fallback', err);
      }
    }

    await updateProduct(editingProduct.id, {
      name: editProductForm.name,
      price: Number(editProductForm.price),
      category: editProductForm.category as any,
      description: editProductForm.description,
      image: finalImage,
      inStock: editProductForm.inStock,
      downloadUrl: finalDownloadUrl
    });

    playEquipSound();
    setEditingProduct(null);
    setEditProductImageFile(null);
    setEditProductDownloadFile(null);
    showNotification(`Product "${editProductForm.name}" updated successfully.`);
  };

  // Create Tour Stop with Poster / Flyer Upload
  const handleCreateTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTour.city.trim() || !newTour.date.trim()) return;
    playSelectSound();

    let finalPosterUrl = newTour.posterUrl;
    if (tourPosterFile) {
      try {
        finalPosterUrl = await fileToDataUrl(tourPosterFile);
      } catch (err) {
        console.warn('Tour poster fallback', err);
      }
    }

    await addTourDate({
      id: `tour-${Date.now()}`,
      date: newTour.date,
      venue: newTour.venue,
      city: newTour.city,
      country: newTour.country,
      price: Number(newTour.price) >= 0 ? Number(newTour.price) : 45,
      ticketUrl: newTour.ticketUrl || '#',
      isSoldOut: newTour.isSoldOut,
      posterUrl: finalPosterUrl
    });

    playEquipSound();
    setNewTour({ date: '', venue: '', city: '', country: '', price: 45, ticketUrl: '', isSoldOut: false, posterUrl: '' });
    setTourPosterFile(null);
    showNotification('World tour sector date & pass price logged.');
  };

  // Start Editing Tour Date
  const handleStartEditTour = (t: TourDate) => {
    playSelectSound();
    setEditingTour(t);
    setEditTourForm({
      date: t.date,
      venue: t.venue,
      city: t.city,
      country: t.country,
      price: t.price ?? 45,
      ticketUrl: t.ticketUrl,
      isSoldOut: t.isSoldOut ?? false,
      posterUrl: t.posterUrl || ''
    });
    setEditTourPosterFile(null);
  };

  // Save Tour Date Edits
  const handleSaveEditTour = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTour) return;
    playSelectSound();

    let finalPosterUrl = editTourForm.posterUrl;
    if (editTourPosterFile) {
      try {
        finalPosterUrl = await fileToDataUrl(editTourPosterFile);
      } catch (err) {
        console.warn('Tour poster fallback', err);
      }
    }

    await updateTourDate(editingTour.id, {
      date: editTourForm.date,
      venue: editTourForm.venue,
      city: editTourForm.city,
      country: editTourForm.country,
      price: Number(editTourForm.price) >= 0 ? Number(editTourForm.price) : 45,
      ticketUrl: editTourForm.ticketUrl,
      isSoldOut: editTourForm.isSoldOut,
      posterUrl: finalPosterUrl
    });

    playEquipSound();
    setEditingTour(null);
    setEditTourPosterFile(null);
    showNotification(`Tour stop for ${editTourForm.city} updated.`);
  };

  // Create Blog Post with Cover Art & Dossier Attachment Upload
  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlog.title.trim()) return;
    playSelectSound();

    let finalImage = newBlog.imageUrl;
    if (blogImageFile) {
      try {
        finalImage = await fileToDataUrl(blogImageFile);
      } catch (err) {
        console.warn('DataURL image fallback', err);
      }
    }

    let finalAttachment = newBlog.attachmentUrl;
    if (blogAttachmentFile) {
      try {
        finalAttachment = await fileToDataUrl(blogAttachmentFile);
      } catch (err) {
        console.warn('DataURL document fallback', err);
      }
    }

    await addBlogPost({
      id: `log-${Date.now()}`,
      title: newBlog.title,
      excerpt: newBlog.excerpt,
      content: newBlog.content,
      date: new Date().toISOString(),
      imageUrl: finalImage || '/src/assets/images/manga_tour_panel_1792583237044.jpg',
      attachmentUrl: finalAttachment
    });

    playEquipSound();
    setNewBlog({ title: '', excerpt: '', content: '', imageUrl: '', attachmentUrl: '' });
    setBlogImageFile(null);
    setBlogAttachmentFile(null);
    showNotification('Studio intel chronicle recorded.');
  };

  // Start Editing Blog Post
  const handleStartEditBlog = (b: BlogPost) => {
    playSelectSound();
    setEditingBlog(b);
    setEditBlogForm({
      title: b.title,
      excerpt: b.excerpt,
      content: b.content,
      imageUrl: b.imageUrl,
      attachmentUrl: b.attachmentUrl || ''
    });
    setEditBlogImageFile(null);
    setEditBlogAttachmentFile(null);
  };

  // Save Blog Post Edits
  const handleSaveEditBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBlog) return;
    playSelectSound();

    let finalImage = editBlogForm.imageUrl;
    if (editBlogImageFile) {
      try {
        finalImage = await fileToDataUrl(editBlogImageFile);
      } catch (err) {
        console.warn('DataURL image fallback', err);
      }
    }

    let finalAttachment = editBlogForm.attachmentUrl;
    if (editBlogAttachmentFile) {
      try {
        finalAttachment = await fileToDataUrl(editBlogAttachmentFile);
      } catch (err) {
        console.warn('DataURL document fallback', err);
      }
    }

    await updateBlogPost(editingBlog.id, {
      title: editBlogForm.title,
      excerpt: editBlogForm.excerpt,
      content: editBlogForm.content,
      imageUrl: finalImage,
      attachmentUrl: finalAttachment
    });

    playEquipSound();
    setEditingBlog(null);
    setEditBlogImageFile(null);
    setEditBlogAttachmentFile(null);
    showNotification(`Intel chronicle "${editBlogForm.title}" updated.`);
  };

  // Upload Order Fulfillment Receipt / Label
  const handleUploadOrderReceipt = async (orderId: string, file: File) => {
    playSelectSound();
    try {
      const dataUrl = await fileToDataUrl(file);
      await updateOrderReceipt(orderId, dataUrl);
      playEquipSound();
      showNotification(`Fulfillment receipt / label attached to Order #${orderId}.`);
    } catch (err) {
      console.error('Order receipt upload error', err);
    }
  };

  // Upload Comms Message Dispatch Attachment
  const handleUploadMessageAttachment = async (msgId: string, file: File) => {
    playSelectSound();
    try {
      const dataUrl = await fileToDataUrl(file);
      await updateMessageAttachment(msgId, dataUrl);
      playEquipSound();
      showNotification(`Transmission dispatch attachment uploaded.`);
    } catch (err) {
      console.error('Message attachment upload error', err);
    }
  };

  // Save Payment Gateway Configuration
  const handleSaveGateway = async (id: string) => {
    const draft = gatewayDrafts[id];
    if (!draft) return;
    playEquipSound();
    await updatePaymentGateway(id as any, draft);
    showNotification(`Gateway "${draft.name}" API configuration saved.`);
  };

  const sectorTabs: { id: AdminSectorId; label: string; shortLabel: string; icon: any }[] = [
    { id: 'store', label: `01 STORE & PRICING (${products.length})`, shortLabel: 'STORE/$', icon: ShoppingBag },
    { id: 'sound', label: `02 SOUND & TRACKS (${tracks.length})`, shortLabel: 'SOUND/$', icon: Disc },
    { id: 'tour', label: `03 TOUR & PASSES (${tourDates.length})`, shortLabel: 'TOUR/$', icon: MapPin },
    { id: 'gateways', label: '04 PAYMENT APIs // 決済', shortLabel: 'GATEWAYS', icon: CreditCard },
    { id: 'orders', label: `05 ORDERS (${orders.length})`, shortLabel: `ORDERS (${orders.length})`, icon: Package },
    { id: 'vault', label: '06 ENCRYPTED VAULT // 暗号庫', shortLabel: 'VAULT', icon: Database },
    { id: 'home', label: '07 HOME HERO // 起動', shortLabel: 'HOME', icon: HomeIcon },
    { id: 'intel', label: '08 INTEL // 記録', shortLabel: 'INTEL', icon: FileText },
    { id: 'comms', label: `09 COMMS (${contactMessages.length})`, shortLabel: 'COMMS', icon: Mail },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-8 md:py-12 relative z-10 font-sans w-full pb-28 text-white">
      
      {/* Admin Command Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 pb-3 sm:pb-5 border-b-2 border-white">
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
            <span className="px-1.5 sm:px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[1px_1px_0_#ffffff] sm:shadow-[2px_2px_0_#ffffff]">
              特務司令部 // ADMIN ROOT
            </span>
            <span className="text-[10px] sm:text-xs font-mono text-zinc-400 truncate">
              OPERATOR: {account?.email || user?.email}
            </span>
            <span className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-700 text-[9px] font-mono text-[#00FF66] md:hidden">
              MOBILE ADMIN PANE ACTIVE
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2 sm:gap-3">
            <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 統括指令 】</span>
            MASTER COMMAND TERMINAL
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="px-2 sm:px-3 py-1 bg-black text-[#00FF66] border border-[#00FF66] font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1.5 sm:gap-2">
            <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>AES-256 ROOT</span>
          </span>

          <button
            onClick={() => {
              playSelectSound();
              logout();
            }}
            className="px-2.5 sm:px-4 py-1.5 sm:py-2 border-2 border-white bg-black hover:bg-white text-zinc-300 hover:text-black font-game font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all flex items-center gap-1 sm:gap-1.5 shadow-[1px_1px_0_#00FF66] sm:shadow-[2px_2px_0_#00FF66]"
          >
            <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>EXIT ROOT</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessMsg && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-zinc-950 border-2 border-[#00FF66] text-white font-mono text-xs flex items-center gap-2 sm:gap-3 shadow-[2px_2px_0_#ffffff] sm:shadow-[4px_4px_0_#ffffff]">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00FF66] shrink-0" />
          <span className="font-bold">{saveSuccessMsg}</span>
        </div>
      )}

      {/* DEDICATED MOBILE ADMIN COMMAND MATRIX (3x3 Touch Grid for Mobile Viewports) */}
      <div className="lg:hidden mb-5 p-3 bg-zinc-950 border-2 border-[#00FF66] shadow-[3px_3px_0_#ffffff]">
        <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-800">
          <span className="text-[10px] font-game font-black text-[#00FF66] uppercase flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" /> MOBILE ADMIN PANE // 携帯司令盤
          </span>
          <span className="text-[9px] font-mono text-zinc-400">TAP SECTOR</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {sectorTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSector === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSelectSound();
                  setActiveSector(tab.id);
                }}
                className={`p-2 border flex flex-col items-center justify-center gap-1 text-[9px] font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-[#00FF66] text-black border-white shadow-[2px_2px_0_#ffffff]'
                    : 'bg-black text-zinc-300 border-zinc-800 hover:border-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate max-w-full">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop Sector Navigation Tabs */}
      <div className="hidden lg:flex items-center gap-2 pb-4 mb-6 border-b border-zinc-900 overflow-x-auto no-scrollbar">
        {sectorTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSector === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playSelectSound();
                setActiveSector(tab.id);
              }}
              onMouseEnter={playHoverSound}
              className={`flex items-center gap-2 px-3.5 py-2.5 border-2 transition-all shrink-0 text-xs font-mono font-bold ${
                isActive
                  ? 'bg-white text-black border-white shadow-[3px_3px_0_#00FF66] translate-x-[-1px] translate-y-[-1px]'
                  : 'bg-black text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
              }`}
              style={{
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Terminal Sector Workspace */}
      <div 
        className="bg-black border-2 border-white p-3.5 sm:p-8 shadow-[4px_4px_0_#00FF66] sm:shadow-[8px_8px_0_#00FF66] relative overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))'
        }}
      >
        {/* Subtle Screentone Backdrop */}
        <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

        {/* ---------------- SECTOR 01: HOME SECTOR CUSTOMIZATION ---------------- */}
        {activeSector === 'home' && (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-800">
              <h2 className="text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <HomeIcon className="w-5 h-5 text-[#00FF66]" /> HOME SECTOR CONFIGURATION // 起動画面調整
              </h2>
              <span className="text-xs font-mono text-zinc-400">APPLIES TO MAIN HERO DISPLAY</span>
            </div>

            <form onSubmit={handleSaveHome} className="space-y-4 max-w-3xl font-mono text-xs">
              <div>
                <label className="block text-zinc-400 mb-1">ALBUM / CAMPAIGN TITLE</label>
                <input
                  required
                  type="text"
                  value={homeForm.albumTitle}
                  onChange={e => setHomeForm({ ...homeForm, albumTitle: e.target.value })}
                  placeholder="e.g. MIDNIGHT ECHOES"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-3 text-sm text-white font-game font-bold outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">ALBUM SUBTITLE &amp; GENRE CODING</label>
                <input
                  required
                  type="text"
                  value={homeForm.albumSubtitle}
                  onChange={e => setHomeForm({ ...homeForm, albumSubtitle: e.target.value })}
                  placeholder="e.g. DARK ORCHESTRA × MODULAR SYNTH"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">TOP BANNER STAMP TAG</label>
                <input
                  type="text"
                  value={homeForm.bannerTag || ''}
                  onChange={e => setHomeForm({ ...homeForm, bannerTag: e.target.value })}
                  placeholder="e.g. 【 新譜解禁 】 ALBUM CHRONICLE VOL. 01"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-3 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">UPLOAD HERO SPLASH ARTWORK FILE (.PNG, .JPG, .WEBP)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        setHomeHeroFile(file);
                        setHomeHeroPreview(URL.createObjectURL(file));
                        playSelectSound();
                      }
                    }}
                    className="w-full text-zinc-400 file:mr-3 file:py-2 file:px-3 file:border-2 file:border-black file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-xs file:cursor-pointer bg-zinc-950 p-2 border border-zinc-700"
                  />
                  {homeHeroFile && (
                    <span className="text-[10px] text-[#00FF66] font-bold shrink-0">
                      SELECTED: {homeHeroFile.name}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 mb-1">HERO SPLASH ARTWORK IMAGE URL (OR USE FILE ABOVE)</label>
                <input
                  type="text"
                  value={homeForm.heroImageUrl}
                  onChange={e => setHomeForm({ ...homeForm, heroImageUrl: e.target.value })}
                  placeholder="/src/assets/images/manga_hero_splash_1792583199243.jpg or external HTTPS URL"
                  className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-3 text-white outline-none"
                />
              </div>

              {/* Live Preview of Current Hero Art */}
              <div className="pt-2">
                <span className="block text-[10px] text-zinc-500 mb-1 uppercase">CURRENT HERO ARTWORK PREVIEW:</span>
                <div className="w-full max-w-md aspect-video border-2 border-white bg-black overflow-hidden shadow-[3px_3px_0_#000000]">
                  <img
                    src={homeHeroPreview || homeForm.heroImageUrl || homeContent.heroImageUrl}
                    alt="Hero Preview"
                    className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  onMouseEnter={playHoverSound}
                  className="px-8 py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 border-2 border-black shadow-[3px_3px_0_#ffffff] hover:shadow-[3px_3px_0_#00FF66]"
                >
                  <Save className="w-4 h-4" />
                  <span>COMMIT HOME CONTENT LIVE // 保存</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------- SECTOR 02: SOUND & TRACKS (+ PRICE SETTING) ---------------- */}
        {activeSector === 'sound' && (
          <div className="relative z-10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-zinc-800">
              <h2 className="text-lg sm:text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Disc className="w-5 h-5 text-[#00FF66]" /> AUDIO ARCHIVES &amp; TRACK PRICING // 音響・価格管理
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{tracks.length} RECORDED TRACKS</span>
            </div>

            {/* Inline Track Edit Panel */}
            {editingTrack && (
              <form onSubmit={handleSaveEditTrack} className="p-4 sm:p-6 bg-zinc-950 border-2 border-[#00FF66] space-y-4 max-w-3xl font-mono text-xs shadow-[4px_4px_0_#ffffff]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-game font-black text-[#00FF66] uppercase flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> 【 編集 】 EDIT TRACK &amp; PRICE: {editingTrack.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingTrack(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">TRACK TITLE *</label>
                    <input
                      required
                      type="text"
                      value={editTrackForm.title}
                      onChange={e => setEditTrackForm({ ...editTrackForm, title: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">ALBUM NAME</label>
                    <input
                      type="text"
                      value={editTrackForm.album}
                      onChange={e => setEditTrackForm({ ...editTrackForm, album: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00FF66] font-bold mb-1">TRACK PRICE (USD) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={editTrackForm.price}
                      onChange={e => setEditTrackForm({ ...editTrackForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3 p-3 bg-black border border-zinc-700 flex items-center justify-between">
                    <div>
                      <span className="text-zinc-400 text-[10px] block font-mono">TRACK DURATION (EXTRACTED FROM AUDIO):</span>
                      <span className="text-[#00FF66] font-mono font-bold text-sm">
                        {isExtractingDuration ? 'CALCULATING AUDIO DURATION...' : editTrackForm.duration || '3:30'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500">AUTO-EXTRACTED</span>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">REPLACE AUDIO FILE (.MP3 / .WAV)</label>
                    <input
                      type="file"
                      accept="audio/mp3,audio/wav,audio/mpeg,audio/wave,audio/x-wav,.mp3,.wav"
                      onChange={handleEditTrackAudioFileChange}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-black file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">REPLACE COVER ART FILE (OPTIONAL)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && setEditTrackCoverFile(e.target.files[0])}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="block text-zinc-400 mb-1">AUDIO STREAM URL (FALLBACK)</label>
                    <input
                      type="text"
                      value={editTrackForm.audioUrl}
                      onChange={e => setEditTrackForm({ ...editTrackForm, audioUrl: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0_#ffffff]"
                  >
                    SAVE TRACK CHANGES // 更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTrack(null)}
                    className="px-4 py-2.5 bg-black border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}

            {/* Upload Track Form */}
            <form onSubmit={handleCreateTrack} className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 space-y-4 max-w-3xl font-mono text-xs">
              <span className="text-xs font-game font-black text-[#00FF66] block uppercase tracking-wider">
                + UPLOAD &amp; LIST NEW TRACK WITH PRICE (.MP3 / .WAV)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1">TRACK TITLE *</label>
                  <input
                    required
                    type="text"
                    placeholder="Neon Odyssey (Overdrive Edit)"
                    value={newTrack.title}
                    onChange={e => setNewTrack({ ...newTrack, title: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">ALBUM NAME</label>
                  <input
                    type="text"
                    placeholder="MIDNIGHT ECHOES"
                    value={newTrack.album}
                    onChange={e => setNewTrack({ ...newTrack, album: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#00FF66] font-bold mb-1">TRACK PRICE (USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTrack.price}
                    onChange={e => setNewTrack({ ...newTrack, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                  />
                </div>

                <div className="sm:col-span-3 p-3 bg-black border border-zinc-700 flex items-center justify-between">
                  <div>
                    <span className="text-zinc-400 text-[10px] block font-mono">AUTOMATIC AUDIO DURATION:</span>
                    <span className="text-[#00FF66] font-mono font-bold text-sm flex items-center gap-1.5">
                      {isExtractingDuration ? (
                        <span className="flex items-center gap-1.5 text-zinc-400">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00FF66]" />
                          EXTRACTING METADATA FROM MP3/WAV FILE...
                        </span>
                      ) : newTrack.duration ? (
                        <span>{newTrack.duration} (EXTRACTED FROM AUDIO)</span>
                      ) : (
                        <span className="text-zinc-500 text-xs">SELECT AN MP3 OR WAV FILE BELOW TO AUTO-EXTRACT</span>
                      )}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">UPLOAD AUDIO FILE (.MP3 / .WAV)</label>
                  <input
                    type="file"
                    accept="audio/mp3,audio/wav,audio/mpeg,audio/wave,audio/x-wav,.mp3,.wav"
                    onChange={handleNewTrackAudioFileChange}
                    className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-black file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">COVER ART FILE (OPTIONAL)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files && setTrackCoverFile(e.target.files[0])}
                    className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-zinc-400 mb-1">EXTERNAL STREAM URL (OPTIONAL FALLBACK)</label>
                  <input
                    type="text"
                    placeholder="https://... or leave blank to use uploaded file"
                    value={newTrack.audioUrl}
                    onChange={e => setNewTrack({ ...newTrack, audioUrl: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="px-6 py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                + ADD TRACK TO PLAYLIST &amp; STORE
              </button>
            </form>

            {/* Existing Tracks Management List with Inline Quick Price Setter */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-xs font-game font-black text-white block uppercase">
                EXISTING AUDIO CHRONICLES &amp; INLINE PRICE CONTROL
              </span>

              {tracks.map((t, idx) => (
                <div key={t.id} className="p-3 sm:p-4 bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#00FF66] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[#00FF66] font-bold">0{idx + 1}</span>
                    <div className="w-10 h-10 border border-white bg-zinc-900 shrink-0 overflow-hidden">
                      <img src={t.coverUrl} alt={t.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-game font-bold text-white text-sm truncate">{t.title}</h4>
                      <span className="text-zinc-500 text-[10px]">{t.album} &bull; {t.duration} &bull; <strong className="text-[#00FF66]">${(t.price ?? 1.99).toFixed(2)} USD</strong></span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Inline Quick Price Editor */}
                    <div className="flex items-center border border-zinc-700 bg-zinc-950">
                      <span className="px-2 text-[10px] text-[#00FF66] font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quickTrackPrices[t.id] !== undefined ? quickTrackPrices[t.id] : String(t.price ?? 1.99)}
                        onChange={e => setQuickTrackPrices({ ...quickTrackPrices, [t.id]: e.target.value })}
                        className="w-16 bg-black text-white px-1.5 py-1 text-xs outline-none border-x border-zinc-800"
                        aria-label={`Set price for ${t.title}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickTrackPriceSave(t)}
                        className="px-2 py-1 bg-[#00FF66] text-black hover:bg-white font-bold text-[10px] uppercase transition-colors"
                      >
                        SET PRICE
                      </button>
                    </div>

                    <button
                      onClick={() => handleStartEditTrack(t)}
                      className="px-2.5 py-1.5 border border-zinc-600 text-zinc-300 hover:border-[#00FF66] hover:text-[#00FF66] transition-colors text-[10px] uppercase font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDIT</span>
                    </button>
                    <button
                      onClick={() => {
                        playSelectSound();
                        deleteTrack(t.id);
                        showNotification(`Track "${t.title}" deleted.`);
                      }}
                      className="px-2.5 py-1.5 border border-red-500 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-[10px] uppercase font-bold"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 03: STORE PRODUCTS & PRICE SETTING ---------------- */}
        {activeSector === 'store' && (
          <div className="relative z-10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-zinc-800">
              <h2 className="text-lg sm:text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#00FF66]" /> ARMORY MERCHANDISE &amp; PRICE LISTING // 兵站・価格管理
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{products.length} CATALOG ITEMS</span>
            </div>

            {/* Inline Product Edit Panel */}
            {editingProduct && (
              <form onSubmit={handleSaveEditProduct} className="p-4 sm:p-6 bg-zinc-950 border-2 border-[#00FF66] space-y-4 max-w-3xl font-mono text-xs shadow-[4px_4px_0_#ffffff]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-game font-black text-[#00FF66] uppercase flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> 【 編集 】 EDIT PRODUCT: {editingProduct.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">PRODUCT NAME *</label>
                    <input
                      required
                      type="text"
                      value={editProductForm.name}
                      onChange={e => setEditProductForm({ ...editProductForm, name: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00FF66] font-bold mb-1">PRICE (USD) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={editProductForm.price}
                      onChange={e => setEditProductForm({ ...editProductForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">CATEGORY</label>
                    <select
                      value={editProductForm.category}
                      onChange={e => setEditProductForm({ ...editProductForm, category: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    >
                      <option value="Apparel">Apparel (戦闘服)</option>
                      <option value="Music">Music (盤音 / Vinyl &amp; CD)</option>
                      <option value="Digital">Digital (電脳 / Stems &amp; Patches)</option>
                      <option value="Accessories">Accessories (装具)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">STOCK STATUS</label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="editInStock"
                        checked={editProductForm.inStock}
                        onChange={e => setEditProductForm({ ...editProductForm, inStock: e.target.checked })}
                        className="accent-[#00FF66] w-4 h-4"
                      />
                      <label htmlFor="editInStock" className="text-white">IN STOCK &amp; AVAILABLE</label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">REPLACE PRODUCT IMAGE FILE</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && setEditProductImageFile(e.target.files[0])}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">REPLACE DIGITAL ASSET FILE (.ZIP, .MP3, .WAV, .PDF)</label>
                    <input
                      type="file"
                      accept=".zip,.mp3,.wav,.pdf,.rar,.7z,audio/*,application/zip,application/pdf"
                      onChange={e => e.target.files && setEditProductDownloadFile(e.target.files[0])}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-black file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">DIGITAL DOWNLOAD URL (OR USE FILE ABOVE)</label>
                    <input
                      type="text"
                      value={editProductForm.downloadUrl}
                      onChange={e => setEditProductForm({ ...editProductForm, downloadUrl: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-zinc-400 mb-1">DESCRIPTION</label>
                    <textarea
                      rows={2}
                      value={editProductForm.description}
                      onChange={e => setEditProductForm({ ...editProductForm, description: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0_#ffffff]"
                  >
                    SAVE PRODUCT CHANGES // 更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-4 py-2.5 bg-black border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}

            {/* Add Product Form */}
            <form onSubmit={handleCreateProduct} className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 space-y-4 max-w-3xl font-mono text-xs">
              <span className="text-xs font-game font-black text-[#00FF66] block uppercase tracking-wider">
                + EQUIP &amp; LIST NEW PRODUCT WITH PRICE
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1">PRODUCT NAME *</label>
                  <input
                    required
                    type="text"
                    placeholder="Tactical Neural Hoodie"
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#00FF66] font-bold mb-1">PRICE (USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="110.00"
                    value={newProduct.price || ''}
                    onChange={e => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CATEGORY</label>
                  <select
                    value={newProduct.category}
                    onChange={e => setNewProduct({ ...newProduct, category: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  >
                    <option value="Apparel">Apparel (戦闘服)</option>
                    <option value="Music">Music (盤音 / Vinyl &amp; CD)</option>
                    <option value="Digital">Digital (電脳 / Stems &amp; Patches)</option>
                    <option value="Accessories">Accessories (装具)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">IMAGE URL (OR SELECT FILE BELOW)</label>
                  <input
                    type="text"
                    placeholder="/src/assets/images/... or https://"
                    value={newProduct.image}
                    onChange={e => setNewProduct({ ...newProduct, image: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">UPLOAD PRODUCT IMAGE FILE</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files && setProductImageFile(e.target.files[0])}
                    className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">UPLOAD DIGITAL ASSET FILE (.ZIP, .MP3, .WAV, .PDF)</label>
                  <input
                    type="file"
                    accept=".zip,.mp3,.wav,.pdf,.rar,.7z,audio/*,application/zip,application/pdf"
                    onChange={e => e.target.files && setProductDownloadFile(e.target.files[0])}
                    className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-black file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-zinc-400 mb-1">DESCRIPTION</label>
                  <textarea
                    rows={2}
                    placeholder="Tactical fabric, limited edition vinyl press..."
                    value={newProduct.description}
                    onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="px-6 py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                + EQUIP PRODUCT TO ARMORY
              </button>
            </form>

            {/* Existing Products List with Quick Inline Price Setter */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-xs font-game font-black text-white block uppercase">
                ACTIVE STORE INVENTORY &amp; 1-CLICK PRICE SETTER
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(p => (
                  <div key={p.id} className="p-4 bg-black border-2 border-white hover:border-[#00FF66] transition-all flex flex-col justify-between shadow-[3px_3px_0_#000000]">
                    <div>
                      <div className="aspect-square bg-zinc-900 border border-zinc-800 mb-3 overflow-hidden relative">
                        <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-black/90 border border-[#00FF66] text-[#00FF66] text-[10px] font-bold">
                          {p.category}
                        </span>
                      </div>
                      <h4 className="font-game font-bold text-white text-sm truncate">{p.name}</h4>
                      <span className="text-[#00FF66] font-bold text-sm block mt-1">${p.price.toFixed(2)} USD</span>

                      {/* Inline Quick Price Control */}
                      <div className="mt-3 p-2 bg-zinc-950 border border-zinc-800 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-zinc-400 flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3 text-[#00FF66]" /> PRICE:
                        </span>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={quickProductPrices[p.id] !== undefined ? quickProductPrices[p.id] : String(p.price)}
                            onChange={e => setQuickProductPrices({ ...quickProductPrices, [p.id]: e.target.value })}
                            className="w-20 bg-black border border-zinc-700 focus:border-[#00FF66] text-white px-2 py-1 text-xs font-bold outline-none"
                            aria-label={`Set price for ${p.name}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleQuickProductPriceSave(p)}
                            className="px-2.5 py-1 bg-[#00FF66] text-black hover:bg-white font-bold text-[10px] uppercase transition-colors"
                          >
                            SET
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 mt-3 border-t border-zinc-800 flex items-center justify-between">
                      <button
                        onClick={() => handleStartEditProduct(p)}
                        className="text-zinc-300 hover:text-[#00FF66] text-xs font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>FULL EDIT</span>
                      </button>
                      <button
                        onClick={() => {
                          playSelectSound();
                          deleteProduct(p.id);
                          showNotification(`Product "${p.name}" removed from armory.`);
                        }}
                        className="text-red-400 hover:text-white text-xs font-bold"
                      >
                        DELETE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 04: PAYMENT API GATEWAYS ---------------- */}
        {activeSector === 'gateways' && (
          <div className="relative z-10 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-zinc-800">
              <div>
                <h2 className="text-lg sm:text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#00FF66]" /> PLUGGABLE PAYMENT API GATEWAYS // 決済API接続
                </h2>
                <p className="text-xs font-mono text-zinc-400 mt-1">
                  Hook up Stripe, PayPal, M-Pesa Daraja, or any custom webhook payment gateway. Changes apply immediately to Checkout.
                </p>
              </div>
              <span className="text-xs font-mono text-[#00FF66] font-bold">
                {paymentGateways.filter(g => g.enabled).length} ACTIVE GATEWAYS
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              {paymentGateways.map(gw => {
                const draft = gatewayDrafts[gw.id] || gw;
                return (
                  <div key={gw.id} className="p-5 bg-zinc-950 border-2 border-white hover:border-[#00FF66] transition-all space-y-4 shadow-[4px_4px_0_#000000]">
                    <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                      <div>
                        <span className="text-[10px] text-[#00FF66] font-bold uppercase block">GATEWAY ID: {gw.id.toUpperCase()}</span>
                        <h3 className="text-base font-game font-black text-white uppercase">{draft.name}</h3>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={draft.enabled}
                          onChange={e => setGatewayDrafts({
                            ...gatewayDrafts,
                            [gw.id]: { ...draft, enabled: e.target.checked }
                          })}
                          className="accent-[#00FF66] w-4 h-4"
                        />
                        <span className={draft.enabled ? 'text-[#00FF66] font-bold' : 'text-zinc-500'}>
                          {draft.enabled ? 'ENABLED' : 'DISABLED'}
                        </span>
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">ENVIRONMENT</label>
                        <select
                          value={draft.mode}
                          onChange={e => setGatewayDrafts({
                            ...gatewayDrafts,
                            [gw.id]: { ...draft, mode: e.target.value as 'sandbox' | 'live' }
                          })}
                          className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none uppercase"
                        >
                          <option value="sandbox">SANDBOX / TEST</option>
                          <option value="live">LIVE PRODUCTION</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-zinc-400 mb-1">SETTLEMENT CURRENCY</label>
                        <input
                          type="text"
                          value={draft.currency}
                          onChange={e => setGatewayDrafts({
                            ...gatewayDrafts,
                            [gw.id]: { ...draft, currency: e.target.value.toUpperCase() }
                          })}
                          className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none uppercase"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">PUBLIC API KEY / MERCHANT / PAYBILL ID</label>
                      <input
                        type="text"
                        value={draft.publicKeyOrMerchantId || ''}
                        onChange={e => setGatewayDrafts({
                          ...gatewayDrafts,
                          [gw.id]: { ...draft, publicKeyOrMerchantId: e.target.value }
                        })}
                        placeholder="pk_live_... or client_id or paybill"
                        className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">WEBHOOK / CALLBACK ENDPOINT URL</label>
                      <input
                        type="text"
                        value={draft.webhookOrEndpointUrl || ''}
                        onChange={e => setGatewayDrafts({
                          ...gatewayDrafts,
                          [gw.id]: { ...draft, webhookOrEndpointUrl: e.target.value }
                        })}
                        placeholder="/api/webhooks/..."
                        className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 mb-1">PROVIDER LABEL</label>
                      <input
                        type="text"
                        value={draft.provider || ''}
                        onChange={e => setGatewayDrafts({
                          ...gatewayDrafts,
                          [gw.id]: { ...draft, provider: e.target.value }
                        })}
                        className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveGateway(gw.id)}
                      className="w-full py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0_#ffffff]"
                    >
                      SAVE {gw.id.toUpperCase()} API CONFIG // 保存
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 05: CUSTOMER ORDERS & REQUISITIONS ---------------- */}
        {activeSector === 'orders' && (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-800">
              <h2 className="text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00FF66]" /> CUSTOMER ORDERS &amp; REQUISITIONS // 注文記録
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{orders.length} TOTAL REQUISITIONS</span>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-400">
                <Package className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p>No customer orders placed yet. Orders made via the Armory checkout appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 sm:p-5 bg-zinc-950 border-2 border-zinc-800 hover:border-[#00FF66] transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-zinc-800">
                      <div>
                        <span className="text-[#00FF66] font-bold block text-sm">{order.id}</span>
                        <span className="text-zinc-400 text-[11px]">{new Date(order.createdAt).toLocaleString()}</span>
                        {order.gatewayReference && (
                          <span className="text-zinc-500 text-[10px] block">REF: {order.gatewayReference}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-zinc-400 uppercase">Status:</span>
                        <select
                          value={order.status}
                          onChange={(e) => {
                            updateOrderStatus(order.id, e.target.value as any);
                            showNotification(`Order ${order.id} status updated to ${e.target.value.toUpperCase()}.`);
                          }}
                          className="bg-black border border-zinc-700 text-white p-1 text-xs uppercase"
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 mb-3 border-b border-zinc-800">
                      <div>
                        <span className="text-zinc-500 text-[10px] block">RECIPIENT:</span>
                        <span className="text-white font-bold">{order.customer.name}</span>
                        <span className="text-zinc-400 block">{order.customer.email}</span>
                        <span className="text-zinc-400 block">{order.customer.address}, {order.customer.city}</span>
                        {order.customer.phone && <span className="text-zinc-400 block">Tel: {order.customer.phone}</span>}
                      </div>

                      <div>
                        <span className="text-zinc-500 text-[10px] block">PAYMENT &amp; LOGISTICS:</span>
                        <span className="text-[#00FF66] font-bold block uppercase">{order.paymentMethod} &bull; ${order.total.toFixed(2)}</span>
                        <span className="text-zinc-400 block">Freight: ${order.shippingFee.toFixed(2)}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-zinc-500 text-[10px] block mb-1">MANIFEST ITEMS:</span>
                      <div className="space-y-1">
                        {order.items.map((i, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-300 text-[11px]">
                            <span>{i.name} ({i.category}) x{i.quantity}</span>
                            <span className="text-white">${(i.price * i.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* File Upload for Order Receipt / Shipping Label */}
                    <div className="pt-3 mt-3 border-t border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <label className="text-[10px] text-zinc-400 font-bold uppercase flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#00FF66]" />
                          <span>ATTACH RECEIPT / LABEL FILE:</span>
                        </label>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadOrderReceipt(order.id, e.target.files[0]);
                            }
                          }}
                          className="text-zinc-400 text-[10px] file:mr-2 file:py-1 file:px-2 file:border file:border-white file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-[10px] file:cursor-pointer"
                        />
                      </div>

                      {order.receiptUrl && (
                        <a
                          href={order.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black transition-colors text-[10px] font-bold flex items-center gap-1 shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>VIEW / DOWNLOAD RECEIPT</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---------------- SECTOR 06: ENCRYPTED VAULT & USER REPOSITORIES ---------------- */}
        {activeSector === 'vault' && (
          <div className="relative z-10 space-y-6 font-mono text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b-2 border-zinc-800">
              <div>
                <h2 className="text-lg sm:text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#00FF66]" /> ENCRYPTED REPOSITORY VAULT // 暗号化データベース
                </h2>
                <p className="text-zinc-400 text-xs mt-1">
                  All user accounts, emails, preferences, and order histories are encrypted at rest with AES-256-GCM. Only Admin can decrypt and inspect this repository.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  fetchAdminVault();
                  showNotification('Encrypted vault repository refreshed.');
                }}
                className="px-3 py-2 bg-[#00FF66] text-black font-game font-black text-xs uppercase flex items-center gap-1.5 border border-black shadow-[2px_2px_0_#ffffff]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>REFRESH VAULT</span>
              </button>
            </div>

            {/* Encryption Status Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-zinc-950 border-2 border-[#00FF66]">
                <span className="text-[10px] text-zinc-400 block">CIPHER ENGINE</span>
                <span className="text-sm font-game font-black text-[#00FF66] flex items-center gap-1.5 mt-1">
                  <Lock className="w-4 h-4" />
                  {vaultSnapshot?.cipherAlgorithm || 'AES-256-GCM'} ({vaultSnapshot?.keyDerivation || 'scrypt'})
                </span>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">REGISTERED OPERATIVES</span>
                <span className="text-lg font-game font-black text-white mt-1 block">
                  {vaultSnapshot?.users?.length || 1} ACCOUNTS
                </span>
              </div>
              <div className="p-4 bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block">ENCRYPTED RECORDS</span>
                <span className="text-lg font-game font-black text-[#00FF66] mt-1 block">
                  {(vaultSnapshot?.counts ? (vaultSnapshot.counts.users + vaultSnapshot.counts.orders + vaultSnapshot.counts.products + vaultSnapshot.counts.tracks) : (orders.length + products.length + tracks.length))} OBJECTS
                </span>
              </div>
            </div>

            {/* Decrypted User Accounts Repository */}
            <div className="space-y-3">
              <h3 className="text-xs font-game font-black text-[#00FF66] uppercase flex items-center gap-2">
                <Users className="w-4 h-4" /> DECRYPTED USER &amp; ADMIN ACCOUNTS REPOSITORY
              </h3>

              <div className="space-y-3">
                {(vaultSnapshot?.users || []).map((u) => (
                  <div key={u.id} className="p-4 bg-zinc-950 border border-zinc-800 hover:border-[#00FF66] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-game font-black text-white text-sm">{u.name}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                          u.role === 'admin' ? 'bg-[#00FF66] text-black' : 'bg-zinc-800 text-zinc-300'
                        }`}>
                          {u.role.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-zinc-400 text-xs">{u.email}</div>
                      <div className="text-zinc-500 text-[10px]">
                        Orders: {orders.filter(o => o.userId === u.id || o.customer?.email?.toLowerCase() === u.email.toLowerCase()).length} &bull; Saved Tracks: {u.preferences?.favoriteTrackIds?.length || 0} &bull; Preferred Gateway: {(u.preferences?.preferredPaymentMethod || 'card').toUpperCase()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.email !== 'josephgitongaofficial@gmail.com' && (
                        <button
                          type="button"
                          onClick={async () => {
                            const nextRole = u.role === 'admin' ? 'user' : 'admin';
                            playEquipSound();
                            await updateUserRole(u.id, nextRole);
                            showNotification(`Updated ${u.email} role to ${nextRole.toUpperCase()}.`);
                          }}
                          className="px-3 py-1.5 bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black font-bold text-[10px] uppercase transition-colors"
                        >
                          {u.role === 'admin' ? 'DEMOTE TO USER' : 'PROMOTE TO ADMIN'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Security & Vault Audit Log */}
            <div className="space-y-2 pt-2">
              <h3 className="text-xs font-game font-black text-white uppercase">
                SECURITY &amp; VAULT AUDIT LOG (LATEST EVENTS)
              </h3>
              <div className="max-h-60 overflow-y-auto border border-zinc-800 bg-zinc-950 divide-y divide-zinc-900">
                {(vaultSnapshot?.auditLogs || []).slice(0, 20).map((entry) => (
                  <div key={entry.id} className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[11px]">
                    <div>
                      <span className="text-[#00FF66] font-bold mr-2">[{entry.action}]</span>
                      <span className="text-white">{entry.actorEmail}</span>
                      <span className="text-zinc-400 ml-2">{entry.resource}</span>
                    </div>
                    <span className="text-zinc-500 text-[10px] shrink-0">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 05 (TAB 03): WORLD TOUR DATES (+ PASS PRICING) ---------------- */}
        {activeSector === 'tour' && (
          <div className="relative z-10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b-2 border-zinc-800">
              <h2 className="text-lg sm:text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#00FF66]" /> WORLD TOUR &amp; PASS PRICING // 遠征・チケット価格
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{tourDates.length} SCHEDULED DATES</span>
            </div>

            {/* Inline Tour Edit Panel */}
            {editingTour && (
              <form onSubmit={handleSaveEditTour} className="p-4 sm:p-6 bg-zinc-950 border-2 border-[#00FF66] space-y-4 max-w-3xl font-mono text-xs shadow-[4px_4px_0_#ffffff]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-game font-black text-[#00FF66] uppercase flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> 【 編集 】 EDIT TOUR STOP: {editingTour.city}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingTour(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">DATE *</label>
                    <input
                      required
                      type="date"
                      value={editTourForm.date}
                      onChange={e => setEditTourForm({ ...editTourForm, date: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#00FF66] font-bold mb-1">TOUR PASS PRICE (USD) *</label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      min="0"
                      value={editTourForm.price}
                      onChange={e => setEditTourForm({ ...editTourForm, price: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">CITY *</label>
                    <input
                      required
                      type="text"
                      value={editTourForm.city}
                      onChange={e => setEditTourForm({ ...editTourForm, city: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">COUNTRY *</label>
                    <input
                      required
                      type="text"
                      value={editTourForm.country}
                      onChange={e => setEditTourForm({ ...editTourForm, country: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">VENUE NAME *</label>
                    <input
                      required
                      type="text"
                      value={editTourForm.venue}
                      onChange={e => setEditTourForm({ ...editTourForm, venue: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">TICKET LINK URL</label>
                    <input
                      type="text"
                      value={editTourForm.ticketUrl}
                      onChange={e => setEditTourForm({ ...editTourForm, ticketUrl: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">UPLOAD TOUR POSTER / FLYER (IMAGE FILE)</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && setEditTourPosterFile(e.target.files[0])}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-6">
                    <input
                      type="checkbox"
                      id="editIsSoldOut"
                      checked={editTourForm.isSoldOut}
                      onChange={e => setEditTourForm({ ...editTourForm, isSoldOut: e.target.checked })}
                      className="w-4 h-4 accent-[#00FF66]"
                    />
                    <label htmlFor="editIsSoldOut" className="text-white font-bold">SOLD OUT STATUS // 完売</label>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0_#ffffff]"
                  >
                    SAVE TOUR CHANGES // 更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingTour(null)}
                    className="px-4 py-2.5 bg-black border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}

            {/* Add Tour Form */}
            <form onSubmit={handleCreateTour} className="p-4 sm:p-5 bg-zinc-950 border border-zinc-800 space-y-4 max-w-3xl font-mono text-xs">
              <span className="text-xs font-game font-black text-[#00FF66] block uppercase tracking-wider">
                + LOG NEW WORLD TOUR STOP &amp; PASS PRICE
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-zinc-400 mb-1">DATE *</label>
                  <input
                    required
                    type="date"
                    value={newTour.date}
                    onChange={e => setNewTour({ ...newTour, date: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[#00FF66] font-bold mb-1">TOUR PASS PRICE (USD) *</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={newTour.price}
                    onChange={e => setNewTour({ ...newTour, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border-2 border-[#00FF66] p-2.5 text-white font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CITY *</label>
                  <input
                    required
                    type="text"
                    placeholder="Tokyo"
                    value={newTour.city}
                    onChange={e => setNewTour({ ...newTour, city: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">COUNTRY *</label>
                  <input
                    required
                    type="text"
                    placeholder="Japan"
                    value={newTour.country}
                    onChange={e => setNewTour({ ...newTour, country: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">VENUE NAME *</label>
                  <input
                    required
                    type="text"
                    placeholder="Cyber Arena Zero"
                    value={newTour.venue}
                    onChange={e => setNewTour({ ...newTour, venue: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">TICKET LINK URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={newTour.ticketUrl}
                    onChange={e => setNewTour({ ...newTour, ticketUrl: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">UPLOAD TOUR POSTER / FLYER (IMAGE FILE)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => e.target.files && setTourPosterFile(e.target.files[0])}
                    className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="isSoldOut"
                    checked={newTour.isSoldOut}
                    onChange={e => setNewTour({ ...newTour, isSoldOut: e.target.checked })}
                    className="w-4 h-4 accent-[#00FF66]"
                  />
                  <label htmlFor="isSoldOut" className="text-white font-bold">SOLD OUT STATUS // 完売</label>
                </div>
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="px-6 py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                + ADD TOUR STOP
              </button>
            </form>

            {/* Existing Tour List with Quick Price Setter */}
            <div className="space-y-3 font-mono text-xs">
              <span className="text-xs font-game font-black text-white block uppercase">
                SCHEDULED WORLD EXPEDITION &amp; PASS PRICING
              </span>

              {tourDates.map((t, idx) => (
                <div key={t.id} className="p-3 sm:p-4 bg-black border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#00FF66] transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 w-10 h-10 border border-zinc-800 bg-zinc-900 flex items-center justify-center text-[#00FF66] font-bold">
                      0{idx + 1}
                    </div>
                    <div className="min-w-0">
                      <div>
                        <span className="font-game font-black text-white text-base mr-3">{t.city}, {t.country}</span>
                        {t.isSoldOut && <span className="px-1.5 py-0.5 bg-red-600 text-white text-[10px] font-bold">SOLD OUT</span>}
                      </div>
                      <div className="text-zinc-400 text-xs">
                        {t.venue} &bull; {new Date(t.date).toLocaleDateString()} &bull; <strong className="text-[#00FF66]">${(t.price ?? 45).toFixed(2)} USD</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Inline Quick Pass Price Setter */}
                    <div className="flex items-center border border-zinc-700 bg-zinc-950">
                      <span className="px-2 text-[10px] text-[#00FF66] font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={quickTourPrices[t.id] !== undefined ? quickTourPrices[t.id] : String(t.price ?? 45)}
                        onChange={e => setQuickTourPrices({ ...quickTourPrices, [t.id]: e.target.value })}
                        className="w-16 bg-black text-white px-1.5 py-1 text-xs outline-none border-x border-zinc-800"
                      />
                      <button
                        type="button"
                        onClick={() => handleQuickTourPriceSave(t)}
                        className="px-2 py-1 bg-[#00FF66] text-black hover:bg-white font-bold text-[10px] uppercase transition-colors"
                      >
                        SET PRICE
                      </button>
                    </div>

                    <button
                      onClick={() => handleStartEditTour(t)}
                      className="text-zinc-300 hover:text-[#00FF66] text-xs font-bold flex items-center gap-1 px-2 py-1 border border-zinc-700"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDIT</span>
                    </button>
                    <button
                      onClick={() => {
                        playSelectSound();
                        deleteTourDate(t.id);
                        showNotification(`Tour date for ${t.city} deleted.`);
                      }}
                      className="text-red-400 hover:text-white text-xs font-bold px-2 py-1 border border-red-900"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 08: INTEL / BLOG ---------------- */}
        {activeSector === 'intel' && (
          <div className="relative z-10 space-y-8">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-800">
              <h2 className="text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#00FF66]" /> STUDIO INTEL &amp; DISPATCHES // 記録管理
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{blogPosts.length} POSTED LOGS</span>
            </div>

            {editingBlog && (
              <form onSubmit={handleSaveEditBlog} className="p-6 bg-zinc-950 border-2 border-[#00FF66] space-y-4 max-w-3xl font-mono text-xs shadow-[4px_4px_0_#ffffff]">
                <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                  <span className="text-xs font-game font-black text-[#00FF66] uppercase flex items-center gap-2">
                    <Edit3 className="w-4 h-4" /> 【 編集 】 EDIT INTEL LOG: {editingBlog.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingBlog(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-zinc-400 mb-1">POST TITLE *</label>
                    <input
                      required
                      type="text"
                      value={editBlogForm.title}
                      onChange={e => setEditBlogForm({ ...editBlogForm, title: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">EXCERPT (SHORT SYNOPSIS)</label>
                    <input
                      type="text"
                      value={editBlogForm.excerpt}
                      onChange={e => setEditBlogForm({ ...editBlogForm, excerpt: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">REPLACE COVER ART FILE</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={e => e.target.files && setEditBlogImageFile(e.target.files[0])}
                      className="w-full text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-white file:bg-zinc-800 file:text-white file:font-mono file:font-bold file:text-xs file:cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-zinc-400 mb-1">CHRONICLE CONTENT</label>
                    <textarea
                      rows={4}
                      value={editBlogForm.content}
                      onChange={e => setEditBlogForm({ ...editBlogForm, content: e.target.value })}
                      className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[2px_2px_0_#ffffff]"
                  >
                    SAVE LOG CHANGES // 更新
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingBlog(null)}
                    className="px-4 py-2.5 bg-black border border-zinc-700 text-zinc-400 hover:text-white text-xs uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            )}

            <form onSubmit={handleCreateBlog} className="p-5 bg-zinc-950 border border-zinc-800 space-y-4 max-w-3xl font-mono text-xs">
              <span className="text-xs font-game font-black text-[#00FF66] block uppercase tracking-wider">
                + PUBLISH NEW FIELD INTEL LOG
              </span>

              <div className="space-y-4">
                <div>
                  <label className="block text-zinc-400 mb-1">POST TITLE *</label>
                  <input
                    required
                    type="text"
                    placeholder="Mission Log: Analog Moog Sessions"
                    value={newBlog.title}
                    onChange={e => setNewBlog({ ...newBlog, title: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">EXCERPT (SHORT SYNOPSIS)</label>
                  <input
                    type="text"
                    placeholder="Brief dispatches from the modular underground..."
                    value={newBlog.excerpt}
                    onChange={e => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">COVER IMAGE URL</label>
                  <input
                    type="text"
                    placeholder="/src/assets/images/... or https://"
                    value={newBlog.imageUrl}
                    onChange={e => setNewBlog({ ...newBlog, imageUrl: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 mb-1">CHRONICLE CONTENT</label>
                  <textarea
                    rows={4}
                    placeholder="Full field report..."
                    value={newBlog.content}
                    onChange={e => setNewBlog({ ...newBlog, content: e.target.value })}
                    className="w-full bg-black border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                onMouseEnter={playHoverSound}
                className="px-6 py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                + PUBLISH DISPATCH LOG
              </button>
            </form>

            <div className="space-y-3 font-mono text-xs">
              <span className="text-xs font-game font-black text-white block uppercase">
                DISPATCHED ARCHIVES
              </span>

              {blogPosts.map((b, idx) => (
                <div key={b.id} className="p-4 bg-black border border-zinc-800 flex items-center justify-between gap-4 hover:border-[#00FF66] transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="text-[#00FF66] font-bold">0{idx + 1}</span>
                    <div className="w-12 h-8 border border-white bg-zinc-900 shrink-0 overflow-hidden">
                      <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-game font-bold text-white text-sm truncate">{b.title}</h4>
                      <span className="text-zinc-500 text-[10px]">{new Date(b.date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleStartEditBlog(b)}
                      className="text-zinc-300 hover:text-[#00FF66] text-xs font-bold flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>EDIT</span>
                    </button>
                    <button
                      onClick={() => {
                        playSelectSound();
                        deleteBlogPost(b.id);
                        showNotification(`Intel chronicle "${b.title}" deleted.`);
                      }}
                      className="text-red-400 hover:text-white text-xs font-bold"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ---------------- SECTOR 09: COMMS / INBOX ---------------- */}
        {activeSector === 'comms' && (
          <div className="relative z-10 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b-2 border-zinc-800">
              <h2 className="text-xl font-game font-black uppercase text-white tracking-wider flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#00FF66]" /> TRANSMISSION INBOX // 交信記録
              </h2>
              <span className="text-xs font-mono text-[#00FF66] font-bold">{contactMessages.length} INCOMING DISPATCHES</span>
            </div>

            {contactMessages.length === 0 ? (
              <div className="p-12 text-center border border-zinc-800 bg-zinc-950 font-mono text-xs text-zinc-400">
                <Mail className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p>No transmissions logged yet. Messages submitted on the Contact page appear here automatically.</p>
              </div>
            ) : (
              <div className="space-y-4 font-mono text-xs">
                {contactMessages.map((msg) => (
                  <div key={msg.id} className="p-5 bg-zinc-950 border border-zinc-800 space-y-2">
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                      <div>
                        <span className="text-white font-bold block">{msg.name}</span>
                        <span className="text-zinc-400 text-[11px]">{msg.email} &bull; {new Date(msg.createdAt).toLocaleString()}</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-zinc-400 uppercase">Status:</span>
                        <select
                          value={msg.status}
                          onChange={(e) => {
                            updateMessageStatus(msg.id, e.target.value as any);
                            showNotification(`Transmission marked as ${e.target.value.toUpperCase()}.`);
                          }}
                          className="bg-black border border-zinc-700 text-white p-1 text-xs uppercase"
                        >
                          <option value="unread">Unread</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-1">
                      <span className="text-[#00FF66] font-bold block text-[11px] mb-1">
                        SUBJECT: {msg.subject}
                      </span>
                      <p className="text-zinc-300 leading-relaxed bg-black p-3 border border-zinc-800 font-mono text-xs whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>

                    <div className="mt-3 pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">
                          ATTACH DISPATCH FILE:
                        </label>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.zip,.mp3,.wav,image/*"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleUploadMessageAttachment(msg.id, e.target.files[0]);
                            }
                          }}
                          className="text-zinc-400 text-[10px] file:mr-2 file:py-1 file:px-2 file:border file:border-white file:bg-[#00FF66] file:text-black file:font-mono file:font-bold file:text-[10px] file:cursor-pointer"
                        />
                      </div>

                      {msg.attachmentUrl && (
                        <a
                          href={msg.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-black border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black transition-colors text-[10px] font-bold flex items-center gap-1 shrink-0"
                        >
                          <Download className="w-3 h-3" />
                          <span>VIEW / DOWNLOAD ATTACHMENT</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
