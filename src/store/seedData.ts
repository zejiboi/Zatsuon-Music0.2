import { Track, Product, TourDate, BlogPost, Album, PaymentGatewayConfig } from '../types';

export const SEED_TRACKS: Track[] = [
  {
    id: 'track-01',
    title: 'Neon Odyssey (Overdrive Edit)',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg',
    duration: '3:48',
    price: 2.99
  },
  {
    id: 'track-02',
    title: 'Cyber Protocol 004',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/teleport_arrival.ogg',
    duration: '4:15',
    price: 2.99
  },
  {
    id: 'track-03',
    title: 'Sector 7 Transmission',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_beacon.ogg',
    duration: '2:56',
    price: 2.49
  },
  {
    id: 'track-04',
    title: 'Solar Flare Reverb',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg',
    duration: '5:02',
    price: 3.49
  }
];

export const SEED_ALBUMS: Album[] = [
  {
    id: 'album-01',
    title: 'MIDNIGHT ECHOES',
    year: 2026,
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    tracks: SEED_TRACKS,
    price: 9.99
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'item-01',
    name: 'ZEJI Tactical Hoodie [MK-III]',
    price: 110,
    image: '/src/assets/images/manga_gear_panel_1792583224309.jpg',
    category: 'Apparel',
    description: 'Black & white heavyweight organic cotton with neon green tactical accent tag.',
    inStock: true
  },
  {
    id: 'item-02',
    name: 'Midnight Echoes Vinyl Edition',
    price: 45,
    image: '/src/assets/images/manga_hero_splash_1792583199243.jpg',
    category: 'Music',
    description: 'Special manga gatefold jacket with exclusive collector screentone art.',
    inStock: true
  },
  {
    id: 'item-03',
    name: 'Modular Synth Stems & Patches',
    price: 25,
    image: '/src/assets/images/manga_sound_panel_1792583212523.jpg',
    category: 'Digital',
    description: 'Raw analog oscillator stems, modular patch sessions, and impulse responses.',
    inStock: true,
    downloadUrl: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg'
  },
  {
    id: 'item-04',
    name: 'Midnight Echoes — 24-Bit Lossless Master LP',
    price: 14,
    image: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    category: 'Digital',
    description: 'Complete 24-bit/96kHz studio master digital album with digital manga booklet.',
    inStock: true,
    downloadUrl: 'https://actions.google.com/sounds/v1/science_fiction/teleport_arrival.ogg'
  }
];

export const SEED_TOUR_DATES: TourDate[] = [
  {
    id: 'tour-01',
    date: '2026-11-15T20:00:00Z',
    venue: 'Cyber Arena Zero',
    city: 'Tokyo',
    country: 'Japan',
    ticketUrl: '#',
    isSoldOut: false,
    price: 65
  },
  {
    id: 'tour-02',
    date: '2026-11-28T21:00:00Z',
    venue: 'Alchemist Warehouse',
    city: 'Berlin',
    country: 'Germany',
    ticketUrl: '#',
    isSoldOut: false,
    price: 55
  },
  {
    id: 'tour-03',
    date: '2026-12-10T19:30:00Z',
    venue: 'Nairobi National Theatre (Soundstage)',
    city: 'Nairobi',
    country: 'Kenya',
    ticketUrl: '#',
    isSoldOut: false,
    price: 40
  },
  {
    id: 'tour-04',
    date: '2026-12-22T20:00:00Z',
    venue: 'The Subterfuge Concourse',
    city: 'London',
    country: 'United Kingdom',
    ticketUrl: '#',
    isSoldOut: true,
    price: 70
  }
];

export const SEED_BLOG_POSTS: BlogPost[] = [
  {
    id: 'log-01',
    title: 'Mission Log 01: Recording with Vintage Analog Moog & Eurorack',
    excerpt: 'Behind the sound architecture of Midnight Echoes. Pushing discrete oscillators to tape saturation.',
    content: 'The journey behind Midnight Echoes began in a late-night session surrounded by patch cables and glowing vacuum tubes...',
    date: '2026-10-18T14:30:00Z',
    imageUrl: '/src/assets/images/manga_sound_panel_1792583212523.jpg'
  },
  {
    id: 'log-02',
    title: 'Mission Log 02: World Tour Stage Audio & Laser Design',
    excerpt: 'Custom reactive audio-visual rigs synced with dark orchestra stems.',
    content: 'Designing the custom laser lighting and monolithic audio array for the 2026 worldwide sector dates.',
    date: '2026-10-05T09:15:00Z',
    imageUrl: '/src/assets/images/manga_tour_panel_1792583237044.jpg'
  }
];

export const SEED_PAYMENT_GATEWAYS: PaymentGatewayConfig[] = [
  {
    id: 'card',
    name: 'CARD (STRIPE / VISA / MASTERCARD)',
    provider: 'Stripe PaymentIntents & Checkout API',
    enabled: true,
    mode: 'sandbox',
    publicKeyOrMerchantId: 'pk_test_zeji_stripe_gateway',
    webhookOrEndpointUrl: '/api/payment/webhooks/stripe',
    currency: 'USD',
    description: 'Global credit/debit cards via Stripe API or compatible card processor.'
  },
  {
    id: 'paypal',
    name: 'PAYPAL EXPRESS',
    provider: 'PayPal Orders v2 REST Gateway',
    enabled: true,
    mode: 'sandbox',
    publicKeyOrMerchantId: 'sb-zeji-merchant@business.example.com',
    webhookOrEndpointUrl: '/api/payment/webhooks/paypal',
    currency: 'USD',
    description: 'Instant PayPal wallet & international buyer protection checkout.'
  },
  {
    id: 'mpesa',
    name: 'M-PESA DARAJA STK',
    provider: 'Safaricom Daraja 2.0 STK Push API',
    enabled: true,
    mode: 'sandbox',
    publicKeyOrMerchantId: '174379',
    webhookOrEndpointUrl: '/api/payment/webhooks/mpesa',
    currency: 'KES / USD',
    description: 'Instant mobile money STK push prompt to Safaricom handsets.'
  },
  {
    id: 'paystack',
    name: 'PAYSTACK / CUSTOM API',
    provider: 'Universal Webhook & Paystack/Flutterwave Adapter',
    enabled: true,
    mode: 'sandbox',
    publicKeyOrMerchantId: 'pk_test_zeji_universal_adapter',
    webhookOrEndpointUrl: '/api/payment/webhooks/custom',
    currency: 'USD',
    description: 'Plug-and-play universal REST gateway for Paystack, Flutterwave, or custom processors.'
  }
];
