export interface Track {
  id: string;
  title: string;
  album: string;
  coverUrl: string;
  audioUrl: string;
  duration: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  category: 'Apparel' | 'Music' | 'Digital' | string;
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
}

export interface HomeContent {
  albumTitle: string;
  albumSubtitle: string;
  heroImageUrl: string;
  featuredTrackId?: string;
  bannerTag?: string;
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

export interface Order {
  id: string;
  createdAt: string;
  customer: CustomerDetails;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  paymentMethod: 'card' | 'paypal' | 'mpesa';
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
