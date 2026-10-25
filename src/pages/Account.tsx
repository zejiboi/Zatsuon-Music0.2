import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Lock,
  Package,
  Sliders,
  Heart,
  LogOut,
  LogIn,
  UserPlus,
  Download,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  KeyRound,
  Sparkles,
  ArrowRight,
  Terminal
} from 'lucide-react';
import { useSiteStore } from '../store/useSiteStore';
import { useStore } from '../store/useStore';
import { playHoverSound, playSelectSound, playEquipSound, toggleSfx, isSfxMuted } from '../lib/gameSound';
import { PaymentMethodId } from '../types';

export const Account: React.FC = () => {
  const {
    account,
    user: firebaseUser,
    orders,
    tracks,
    registerAccount,
    loginWithPassword,
    updatePreferences,
    toggleFavoriteTrack,
    logout
  } = useSiteStore();
  const { cart, playTrack, currentTrack, isPlaying, togglePlayPause } = useStore();
  const navigate = useNavigate();

  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [activeProfileTab, setActiveProfileTab] = useState<'orders' | 'preferences' | 'favorites'>('orders');

  // Login / Register state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminInviteCode, setAdminInviteCode] = useState('');
  const [showAdminCodeInput, setShowAdminCodeInput] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preferences form state
  const [prefVolume, setPrefVolume] = useState(0.85);
  const [prefSfxMuted, setPrefSfxMuted] = useState(isSfxMuted());
  const [prefGateway, setPrefGateway] = useState<PaymentMethodId>('card');
  const [prefOrchestra, setPrefOrchestra] = useState('GOTHIC_REQUIEM');
  const [shippingName, setShippingName] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingCountry, setShippingCountry] = useState('United States');
  const [shippingPostal, setShippingPostal] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');

  useEffect(() => {
    if (account) {
      setPrefVolume(account.preferences.volume ?? 0.85);
      setPrefSfxMuted(account.preferences.sfxMuted ?? false);
      setPrefGateway(account.preferences.preferredPaymentMethod || 'card');
      setPrefOrchestra(account.preferences.orchestraPreset || 'GOTHIC_REQUIEM');
      setShippingName(account.preferences.defaultShipping?.name || account.name || '');
      setShippingAddress(account.preferences.defaultShipping?.address || '');
      setShippingCity(account.preferences.defaultShipping?.city || '');
      setShippingCountry(account.preferences.defaultShipping?.country || 'United States');
      setShippingPostal(account.preferences.defaultShipping?.postalCode || '');
      setShippingPhone(account.preferences.defaultShipping?.phone || '');
    }
  }, [account]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    playSelectSound();

    try {
      if (authTab === 'login') {
        await loginWithPassword(email, password);
        playEquipSound();
      } else {
        await registerAccount({
          name,
          email,
          password,
          adminInviteCode: adminInviteCode.trim() || undefined
        });
        playEquipSound();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    playSelectSound();
    if (prefSfxMuted !== isSfxMuted()) {
      toggleSfx();
    }
    await updatePreferences(
      {
        volume: prefVolume,
        sfxMuted: prefSfxMuted,
        preferredPaymentMethod: prefGateway,
        orchestraPreset: prefOrchestra,
        defaultShipping: {
          name: shippingName,
          email: account?.email || '',
          address: shippingAddress,
          city: shippingCity,
          country: shippingCountry,
          postalCode: shippingPostal,
          phone: shippingPhone
        }
      },
      cart,
      shippingName || account?.name
    );
    playEquipSound();
    setSuccessMsg('Encrypted operative preferences & cart state synced to vault.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  const isAdmin =
    account?.role === 'admin' || firebaseUser?.email === 'josephgitongaofficial@gmail.com';

  // --------------------------------------------------------------------------
  // 1. UNAUTHENTICATED VIEW: SIGN IN & SIGN UP (USER + ADMIN)
  // --------------------------------------------------------------------------
  if (!account) {
    return (
      <div className="max-w-[920px] mx-auto px-2 xs:px-3 sm:px-8 py-6 sm:py-12 relative z-10 font-sans w-full pb-28">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b-2 border-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] sm:border-2 font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0_#ffffff]">
                隊員認証 // AUTHVAULT
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-zinc-400">
                AES-256-GCM ENCRYPTED REPOSITORY
              </span>
            </div>
            <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase flex items-center gap-2.5">
              <span className="text-[#00FF66] [font-family:var(--font-manga)]">【 登録・認証 】</span>
              OPERATIVE ACCOUNT
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-[#00FF66]">
            <Lock className="w-3.5 h-3.5" />
            <span>ZERO-PLAINTEXT VAULT</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Auth Form */}
          <div
            className="lg:col-span-7 bg-black border-2 border-white p-4 sm:p-8 shadow-[4px_4px_0_#00FF66] sm:shadow-[8px_8px_0_#00FF66] relative overflow-hidden"
            style={{
              clipPath:
                'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
            }}
          >
            <div className="absolute inset-0 manga-screentone-white opacity-5 pointer-events-none"></div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 mb-6 relative z-10">
              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setAuthTab('login');
                  setErrorMsg('');
                }}
                className={`py-2.5 px-3 border-2 font-game font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  authTab === 'login'
                    ? 'bg-white text-black border-white shadow-[3px_3px_0_#00FF66]'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>SIGN IN // ログイン</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playSelectSound();
                  setAuthTab('register');
                  setErrorMsg('');
                }}
                className={`py-2.5 px-3 border-2 font-game font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  authTab === 'register'
                    ? 'bg-white text-black border-white shadow-[3px_3px_0_#00FF66]'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>SIGN UP // 新規登録</span>
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-950/80 border-2 border-red-500 text-red-200 font-mono text-xs flex items-center gap-2 relative z-10">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 font-mono text-xs relative z-10">
              {authTab === 'register' && (
                <div>
                  <label className="block text-zinc-300 font-bold mb-1">
                    OPERATIVE NAME // 氏名 *
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Commander Kenji"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  EMAIL ADDRESS // 電子郵便 *
                </label>
                <input
                  required
                  type="email"
                  placeholder="operative@zeji.music"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-bold mb-1">
                  PASSWORD (MIN 8 CHARS) // 暗号鍵 *
                </label>
                <input
                  required
                  type="password"
                  minLength={8}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-950 border-2 border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
                />
              </div>

              {authTab === 'register' && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdminCodeInput(!showAdminCodeInput)}
                    className="text-[10px] text-zinc-400 hover:text-[#00FF66] flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3 text-[#00FF66]" />
                    <span>
                      {showAdminCodeInput
                        ? 'HIDE ADMIN CLEARANCE CODE'
                        : 'HAVE AN ADMIN CLEARANCE INVITE CODE?'}
                    </span>
                  </button>

                  {showAdminCodeInput && (
                    <div className="mt-2">
                      <label className="block text-[#00FF66] text-[10px] mb-1">
                        ADMIN CLEARANCE INVITE CODE (OPTIONAL)
                      </label>
                      <input
                        type="password"
                        placeholder="Enter Authorized Admin Clearance Code"
                        value={adminInviteCode}
                        onChange={e => setAdminInviteCode(e.target.value)}
                        className="w-full bg-black border border-[#00FF66] p-2 text-white outline-none"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                onMouseEnter={playHoverSound}
                className="w-full py-3.5 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 border-2 border-black shadow-[4px_4px_0_#ffffff] disabled:opacity-50"
                style={{
                  clipPath:
                    'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))'
                }}
              >
                <span>
                  {isSubmitting
                    ? 'AUTHENTICATING VAULT...'
                    : authTab === 'login'
                      ? 'ACCESS ACCOUNT // 認証実行'
                      : 'CREATE ENCRYPTED ACCOUNT // 登録'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Quick Autofill Helpers for Instant Verification */}
            <div className="mt-6 pt-4 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 relative z-10 font-mono text-[10px]">
              <span className="text-zinc-500">QUICK CREDENTIAL FILL:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setAuthTab('login');
                    setEmail('josephgitongaofficial@gmail.com');
                    setPassword('ZejiAdmin#2026!');
                  }}
                  className="px-2.5 py-1 border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black font-bold transition-colors flex items-center gap-1"
                >
                  <Terminal className="w-3 h-3" />
                  <span>FILL ROOT ADMIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playSelectSound();
                    setAuthTab('register');
                    setName('Operative Akira');
                    setEmail(`akira.${Math.floor(Math.random() * 900 + 100)}@zeji.music`);
                    setPassword('Operative#2026!');
                  }}
                  className="px-2.5 py-1 border border-zinc-700 text-zinc-300 hover:border-white hover:text-white transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#00FF66]" />
                  <span>FILL NEW USER</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right: Vault Security & Account Perks */}
          <div className="lg:col-span-5 space-y-4">
            <div
              className="bg-black border-2 border-white p-5 sm:p-6 shadow-[4px_4px_0_#00FF66] font-mono text-xs space-y-4"
              style={{
                clipPath:
                  'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))'
              }}
            >
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <ShieldCheck className="w-5 h-5 text-[#00FF66]" />
                <h2 className="font-game font-black text-sm text-white uppercase">
                  ENCRYPTED VAULT ARCHITECTURE
                </h2>
              </div>

              <ul className="space-y-2.5 text-zinc-300 text-[11px] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] font-bold">01</span>
                  <span>
                    <strong className="text-white">AES-256-GCM Encryption:</strong> All account
                    profiles, shipping details, preferences, and order histories are encrypted at
                    rest. Only Root Admin can inspect raw repositories.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] font-bold">02</span>
                  <span>
                    <strong className="text-white">Purchase History & Stems:</strong> Automatically
                    tracks every Armory order and unlocks 24-bit lossless audio downloads.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#00FF66] font-bold">03</span>
                  <span>
                    <strong className="text-white">Synced Preferences:</strong> Remembers your
                    playback volume, favorite tracks, cart items, and preferred checkout gateway
                    across desktop and mobile.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // 2. AUTHENTICATED OPERATIVE / ADMIN ACCOUNT DASHBOARD
  // --------------------------------------------------------------------------
  const favoriteIds = account.preferences?.favoriteTrackIds || [];
  const favoriteTracks = tracks.filter(
    t => favoriteIds.includes(t.id) || account.purchasedTrackIds?.includes(t.id)
  );

  return (
    <div className="max-w-[1440px] mx-auto px-2 xs:px-3 sm:px-8 py-4 sm:py-10 relative z-10 font-sans w-full pb-28 text-white">
      {/* Top Operative Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 pb-4 border-b-2 border-white">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 bg-black text-[#00FF66] border border-[#00FF66] font-mono text-[10px] sm:text-xs font-black shadow-[2px_2px_0_#ffffff]">
              {account.role === 'admin' ? '特務司令 // ROOT ADMIN' : '正規隊員 // VERIFIED OPERATIVE'}
            </span>
            <span className="px-2 py-0.5 bg-zinc-950 text-zinc-300 border border-zinc-700 font-mono text-[10px]">
              {account.encryptionBadge || 'AES-256-GCM ENCRYPTED'}
            </span>
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-5xl font-game font-black tracking-tight text-white uppercase">
            {account.name}
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-0.5">{account.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isAdmin && (
            <Link
              to="/admin"
              onMouseEnter={playHoverSound}
              onClick={playSelectSound}
              className="px-4 py-2 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#ffffff] flex items-center gap-1.5"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>ADMIN CONSOLE // 管理画面</span>
            </Link>
          )}

          <button
            onClick={() => {
              playSelectSound();
              logout();
            }}
            className="px-4 py-2 bg-black hover:bg-red-600 text-zinc-300 hover:text-white font-game font-black text-xs uppercase tracking-wider border-2 border-white transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT // 離脱</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-5 p-3.5 bg-zinc-950 border-2 border-[#00FF66] text-white font-mono text-xs flex items-center gap-2.5 shadow-[3px_3px_0_#ffffff]">
          <CheckCircle className="w-4 h-4 text-[#00FF66] shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Account Section Tabs */}
      <div className="flex items-center gap-2 pb-3 mb-6 border-b border-zinc-900 overflow-x-auto no-scrollbar">
        {[
          {
            id: 'orders',
            label: `01 PURCHASE HISTORY // 購入履歴 (${orders.length})`,
            icon: Package
          },
          { id: 'preferences', label: '02 USER PREFERENCES // 環境設定', icon: Sliders },
          {
            id: 'favorites',
            label: `03 SAVED & PURCHASED TRACKS // 愛聴曲 (${favoriteTracks.length})`,
            icon: Heart
          }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeProfileTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                playSelectSound();
                setActiveProfileTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-3.5 py-2 border-2 text-xs font-mono font-bold shrink-0 transition-all ${
                active
                  ? 'bg-white text-black border-white shadow-[3px_3px_0_#00FF66]'
                  : 'bg-black text-zinc-400 border-zinc-800 hover:border-white hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: PURCHASE HISTORY */}
      {activeProfileTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="p-10 bg-black border-2 border-white text-center shadow-[4px_4px_0_#00FF66]">
              <Package className="w-10 h-10 text-[#00FF66] mx-auto mb-3" />
              <h3 className="font-game font-black text-lg text-white uppercase mb-1">
                NO REQUISITION HISTORY RECORDED YET
              </h3>
              <p className="text-xs font-mono text-zinc-400 mb-5">
                Orders placed in the Armory Store or Music Archive will be encrypted and archived
                here.
              </p>
              <Link
                to="/store"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00FF66] text-black font-game font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                <span>BROWSE ARMORY STORE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                className="p-4 sm:p-6 bg-black border-2 border-white shadow-[4px_4px_0_#00FF66] font-mono text-xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-800">
                  <div>
                    <span className="text-[#00FF66] font-bold text-sm">{order.id}</span>
                    <span className="text-zinc-400 text-[11px] block">
                      {new Date(order.createdAt).toLocaleString()} &bull; Gateway Ref:{' '}
                      {order.gatewayReference || order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-[#00FF66]/15 border border-[#00FF66] text-[#00FF66] font-bold uppercase text-[10px]">
                      STATUS: {order.status.toUpperCase()}
                    </span>
                    <span className="px-2.5 py-1 bg-white text-black font-bold text-xs">
                      ${order.total.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-zinc-900">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-white font-bold">{item.name}</span>
                        <span className="text-zinc-500 ml-2">
                          ({item.category}) x{item.quantity}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[#00FF66] font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                        {item.downloadUrl && (
                          <a
                            href={item.downloadUrl}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 bg-[#00FF66] text-black font-bold text-[10px] flex items-center gap-1 hover:bg-white"
                          >
                            <Download className="w-3 h-3" />
                            <span>DOWNLOAD</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: USER PREFERENCES */}
      {activeProfileTab === 'preferences' && (
        <form
          onSubmit={handleSavePreferences}
          className="p-5 sm:p-8 bg-black border-2 border-white shadow-[6px_6px_0_#00FF66] max-w-3xl font-mono text-xs space-y-6"
        >
          <div className="pb-3 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-game font-black text-base text-white uppercase">
              ENCRYPTED USER PREFERENCES & DEFAULT LOGISTICS
            </h3>
            <span className="text-[10px] text-[#00FF66]">SYNCED ACROSS WEB & MOBILE</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-zinc-400 mb-1">OPERATIVE DISPLAY NAME</label>
              <input
                type="text"
                value={shippingName}
                onChange={e => setShippingName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">PREFERRED PAYMENT GATEWAY</label>
              <select
                value={prefGateway}
                onChange={e => setPrefGateway(e.target.value as PaymentMethodId)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              >
                <option value="card">CARD (STRIPE / VISA / MASTERCARD)</option>
                <option value="paypal">PAYPAL EXPRESS</option>
                <option value="mpesa">M-PESA DARAJA STK PUSH</option>
                <option value="paystack">PAYSTACK / UNIVERSAL GATEWAY</option>
              </select>
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">
                DEFAULT AUDIO VOLUME ({Math.round(prefVolume * 100)}%)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={prefVolume}
                onChange={e => setPrefVolume(parseFloat(e.target.value))}
                className="w-full accent-[#00FF66] mt-2"
              />
            </div>

            <div className="flex items-center gap-3 pt-5">
              <input
                type="checkbox"
                id="prefSfx"
                checked={!prefSfxMuted}
                onChange={e => setPrefSfxMuted(!e.target.checked)}
                className="w-4 h-4 accent-[#00FF66]"
              />
              <label htmlFor="prefSfx" className="text-white font-bold cursor-pointer">
                ENABLE GAME MENU SOUND EFFECTS (SFX)
              </label>
            </div>

            <div className="sm:col-span-2 pt-2 border-t border-zinc-900">
              <span className="text-[#00FF66] font-bold block mb-2">
                DEFAULT SHIPPING & DISPATCH COORDINATES
              </span>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-zinc-400 mb-1">STREET ADDRESS</label>
              <input
                type="text"
                value={shippingAddress}
                onChange={e => setShippingAddress(e.target.value)}
                placeholder="104 Shibuya Crossing, Studio B"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">CITY</label>
              <input
                type="text"
                value={shippingCity}
                onChange={e => setShippingCity(e.target.value)}
                placeholder="Tokyo / Nairobi / London"
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">COUNTRY</label>
              <input
                type="text"
                value={shippingCountry}
                onChange={e => setShippingCountry(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">POSTAL CODE</label>
              <input
                type="text"
                value={shippingPostal}
                onChange={e => setShippingPostal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-zinc-400 mb-1">PHONE / M-PESA NUMBER</label>
              <input
                type="tel"
                value={shippingPhone}
                onChange={e => setShippingPhone(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 focus:border-[#00FF66] p-2.5 text-white outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-8 py-3 bg-[#00FF66] hover:bg-white text-black font-game font-black text-xs uppercase tracking-wider border-2 border-black shadow-[3px_3px_0_#ffffff]"
          >
            SAVE & ENCRYPT PREFERENCES // 設定保存
          </button>
        </form>
      )}

      {/* TAB 3: FAVORITED & PURCHASED TRACKS */}
      {activeProfileTab === 'favorites' && (
        <div className="space-y-3">
          {favoriteTracks.length === 0 ? (
            <div className="p-10 bg-black border-2 border-white text-center shadow-[4px_4px_0_#00FF66]">
              <Heart className="w-10 h-10 text-[#00FF66] mx-auto mb-3" />
              <h3 className="font-game font-black text-lg text-white uppercase mb-1">
                NO FAVORITED OR PURCHASED TRACKS YET
              </h3>
              <p className="text-xs font-mono text-zinc-400 mb-4">
                Click the heart icon or purchase tracks in the Sound Archive to pin them to your
                operative profile.
              </p>
              <Link
                to="/music"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00FF66] text-black font-game font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0_#ffffff]"
              >
                <span>EXPLORE SOUND ARCHIVE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ) : (
            favoriteTracks.map(track => {
              const isCurrent = currentTrack?.id === track.id && isPlaying;
              return (
                <div
                  key={track.id}
                  className="p-4 bg-black border-2 border-white flex items-center justify-between gap-4 shadow-[3px_3px_0_#00FF66]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={track.coverUrl}
                      alt={track.title}
                      className="w-11 h-11 object-cover border border-white shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-game font-black text-sm text-white truncate">
                        {track.title}
                      </h4>
                      <span className="text-[10px] font-mono text-[#00FF66]">
                        {track.album} &bull; {track.duration}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleFavoriteTrack(track.id)}
                      className="p-2 border border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black transition-colors"
                      title="Toggle Favorite"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        if (currentTrack?.id === track.id) {
                          togglePlayPause();
                        } else {
                          playTrack(track);
                        }
                      }}
                      className="px-3 py-2 bg-[#00FF66] text-black font-game font-black text-xs flex items-center gap-1 border border-black"
                    >
                      {isCurrent ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{isCurrent ? 'PAUSE' : 'PLAY'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
