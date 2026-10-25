import { Track, Product, TourDate, BlogPost, Album } from '../types';

export const SEED_TRACKS: Track[] = [
  {
    id: 'track-01',
    title: 'Neon Odyssey (Overdrive Edit)',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg',
    duration: '3:48'
  },
  {
    id: 'track-02',
    title: 'Cyber Protocol 004',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/teleport_arrival.ogg',
    duration: '4:15'
  },
  {
    id: 'track-03',
    title: 'Sector 7 Transmission',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/alien_beacon.ogg',
    duration: '2:56'
  },
  {
    id: 'track-04',
    title: 'Solar Flare Reverb',
    album: 'MIDNIGHT ECHOES',
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    audioUrl: 'https://actions.google.com/sounds/v1/science_fiction/force_field_hum.ogg',
    duration: '5:02'
  }
];

export const SEED_ALBUMS: Album[] = [
  {
    id: 'album-01',
    title: 'MIDNIGHT ECHOES',
    year: 2026,
    coverUrl: '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg',
    tracks: SEED_TRACKS
  }
];

export const SEED_PRODUCTS: Product[] = [
  {
    id: 'item-01',
    name: 'ZEJI Tactical Hoodie [MK-III]',
    price: 110,
    image: '/src/assets/images/manga_gear_panel_1792583224309.jpg',
    category: 'Apparel',
    description: 'Black & white heavyweight organic cotton with neon green tactical accent tag.'
  },
  {
    id: 'item-02',
    name: 'Midnight Echoes Vinyl Edition',
    price: 45,
    image: '/src/assets/images/manga_hero_splash_1792583199243.jpg',
    category: 'Music',
    description: 'Special manga gatefold jacket with exclusive collector screentone art.'
  },
  {
    id: 'item-03',
    name: 'Modular Synth Stems & Patches',
    price: 25,
    image: '/src/assets/images/manga_sound_panel_1792583212523.jpg',
    category: 'Digital',
    description: 'Raw analog oscillator stems, modular patch sessions, and impulse responses.'
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
    isSoldOut: false
  },
  {
    id: 'tour-02',
    date: '2026-11-28T21:00:00Z',
    venue: 'Alchemist Warehouse',
    city: 'Berlin',
    country: 'Germany',
    ticketUrl: '#',
    isSoldOut: false
  },
  {
    id: 'tour-03',
    date: '2026-12-10T19:30:00Z',
    venue: 'Nairobi National Theatre (Soundstage)',
    city: 'Nairobi',
    country: 'Kenya',
    ticketUrl: '#',
    isSoldOut: false
  },
  {
    id: 'tour-04',
    date: '2026-12-22T20:00:00Z',
    venue: 'The Subterfuge Concourse',
    city: 'London',
    country: 'United Kingdom',
    ticketUrl: '#',
    isSoldOut: true
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
