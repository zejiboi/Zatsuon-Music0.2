export interface Track {
  id: string;
  title: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
  price?: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Apparel' | 'Music' | 'Digital' | 'Ticket' | string;
  description: string;
  inStock?: boolean;
  downloadUrl?: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface TourDate {
  id: string;
  date: string;
  venue: string;
  city: string;
  country: string;
  ticketUrl: string;
  isSoldOut: boolean;
  posterUrl?: string;
  price?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  imageUrl: string;
  attachmentUrl?: string;
}

export interface Album {
  id: string;
  title: string;
  year: number;
  coverUrl: string;
  tracks: Track[];
  price?: number;
}

export interface PanelSettings {
  heroHeight?: 'compact' | 'standard' | 'cinematic';
  mangaCardSize?: 'compact' | 'standard' | 'large';
  cornerCutSize?: 'subtle' | 'standard' | 'deep';
  shadowDepth?: 'flat' | 'standard' | 'deep';
  storeGridDensity?: 'compact' | 'standard' | 'large';
}

export type PageRouteKey = 'global' | 'home' | 'music' | 'tour' | 'store' | 'blog' | 'contact' | 'cart';

export interface PageBackgroundVideo {
  videoUrl: string;
  enabled: boolean;
  opacity: number;
  overlayStyle: 'screentone' | 'vignette' | 'scanlines' | 'none';
  playbackRate: number;
  blur: number;
  name?: string;
}

export type PageBackgroundConfig = Record<PageRouteKey, PageBackgroundVideo>;

export interface HomeContent {
  albumTitle: string;
  albumSubtitle: string;
  heroImageUrl: string;
  featuredTrackId?: string;
  bannerTag?: string;
  panelSettings?: PanelSettings;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  image?: string;
  downloadUrl?: string;
}

export interface CustomerDetails {
  name: string;
  email: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  phone?: string;
}

export type PaymentMethodId = 'card' | 'paypal' | 'mpesa' | 'paystack';

export interface PaymentGatewayConfig {
  id: PaymentMethodId;
  name: string;
  provider: string;
  enabled: boolean;
  mode: 'sandbox' | 'live';
  publicKeyOrMerchantId?: string;
  webhookOrEndpointUrl?: string;
  currency: string;
  description: string;
}

export interface Order {
  id: string;
  userId?: string;
  createdAt: string;
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethodId;
  gatewayReference?: string;
  status: 'processing' | 'dispatched' | 'delivered';
  receiptUrl?: string;
}

export interface ContactMessage {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'unread' | 'read' | 'replied';
  attachmentUrl?: string;
}

export interface UserPreferences {
  volume: number;
  sfxMuted: boolean;
  orchestraPreset: string;
  favoriteTrackIds: string[];
  preferredPaymentMethod: PaymentMethodId;
  defaultShipping?: CustomerDetails;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
  preferences: UserPreferences;
  savedCart?: CartItem[];
  purchasedTrackIds?: string[];
  encryptionBadge?: string;
}

export interface VaultAuditEntry {
  id: string;
  timestamp: string;
  actorEmail: string;
  actorRole: string;
  action: string;
  resource: string;
}

export interface AdminVaultSnapshot {
  cipherAlgorithm: string;
  keyDerivation: string;
  encryptedAtRest: boolean;
  lastEncryptedWrite: string;
  counts: {
    users: number;
    orders: number;
    products: number;
    tracks: number;
    tourDates: number;
    blogPosts: number;
    contactMessages: number;
  };
  users: UserAccount[];
  auditLogs: VaultAuditEntry[];
}
