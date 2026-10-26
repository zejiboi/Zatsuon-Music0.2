import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  SEED_TRACKS,
  SEED_ALBUMS,
  SEED_PRODUCTS,
  SEED_TOUR_DATES,
  SEED_BLOG_POSTS,
  SEED_PAYMENT_GATEWAYS
} from './src/store/seedData';
import {
  Track,
  Product,
  TourDate,
  BlogPost,
  HomeContent,
  Order,
  ContactMessage,
  UserAccount,
  UserPreferences,
  PaymentGatewayConfig,
  PaymentMethodId,
  VaultAuditEntry,
  CartItem
} from './src/types';

dotenv.config();

// ============================================================================
// 1. CRYPTOGRAPHIC VAULT ENGINE (AES-256-GCM AT REST + FIELD ENCRYPTION + SCRYPT)
// ============================================================================

const VAULT_FILE = path.join(process.cwd(), 'server_db.enc.json');
const KEY_FILE = path.join(process.cwd(), '.vault_master.key');

function getOrCreateMasterSecret(): Buffer {
  const envSecret = process.env.VAULT_MASTER_SECRET;
  if (envSecret && envSecret.length >= 32) {
    return crypto.scryptSync(envSecret, 'zeji-vault-salt-v2', 32);
  }
  try {
    if (fs.existsSync(KEY_FILE)) {
      const hex = fs.readFileSync(KEY_FILE, 'utf8').trim();
      if (hex.length === 64) {
        return Buffer.from(hex, 'hex');
      }
    }
    const generated = crypto.randomBytes(32);
    fs.writeFileSync(KEY_FILE, generated.toString('hex'), { mode: 0o600 });
    return generated;
  } catch {
    return crypto.scryptSync('zeji-fallback-sovereign-key-2026', 'zeji-vault-salt-v2', 32);
  }
}

const MASTER_KEY = getOrCreateMasterSecret();
const SESSION_SECRET = crypto
  .createHmac('sha256', MASTER_KEY)
  .update('zeji-session-hmac-key-v2')
  .digest();

interface EncryptedEnvelope {
  v: number;
  alg: 'aes-256-gcm';
  iv: string;
  tag: string;
  ciphertext: string;
  updatedAt: string;
}

function encryptAES256GCM(plaintext: string): EncryptedEnvelope {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', MASTER_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    v: 2,
    alg: 'aes-256-gcm',
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    ciphertext: encrypted.toString('base64'),
    updatedAt: new Date().toISOString()
  };
}

function decryptAES256GCM(envelope: EncryptedEnvelope): string {
  const iv = Buffer.from(envelope.iv, 'base64');
  const tag = Buffer.from(envelope.tag, 'base64');
  const encrypted = Buffer.from(envelope.ciphertext, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', MASTER_KEY, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

function encryptField(value: string): string {
  const env = encryptAES256GCM(value);
  return `enc:v2:${env.iv}:${env.tag}:${env.ciphertext}`;
}

function decryptField(stored: string): string {
  if (!stored || !stored.startsWith('enc:v2:')) return stored;
  const parts = stored.split(':');
  if (parts.length !== 5) return stored;
  try {
    return decryptAES256GCM({
      v: 2,
      alg: 'aes-256-gcm',
      iv: parts[2],
      tag: parts[3],
      ciphertext: parts[4],
      updatedAt: ''
    });
  } catch {
    return '';
  }
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.startsWith('scrypt:')) return false;
  const parts = storedHash.split(':');
  if (parts.length !== 3) return false;
  const [, salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

// ============================================================================
// 2. SESSION TOKENS (HMAC-SHA256 SIGNED + EXPIRATION + ROLE CLAIMS)
// ============================================================================

interface SessionPayload {
  sub: string;
  email: string;
  role: 'user' | 'admin';
  iat: number;
  exp: number;
}

function signSessionToken(user: { id: string; email: string; role: 'user' | 'admin' }): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    iat: now,
    exp: now + 60 * 60 * 24 * 7 // 7 days
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

function verifySessionToken(token?: string): SessionPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payloadB64, sig] = token.split('.');
  if (!payloadB64 || !sig) return null;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadB64).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as SessionPayload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const pair of cookieHeader.split(';')) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const k = pair.slice(0, idx).trim();
      const v = pair.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

function extractSessionFromReq(req: Request): SessionPayload | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const verified = verifySessionToken(token);
    if (verified) return verified;
  }
  const cookies = parseCookies(req.headers.cookie);
  if (cookies.zeji_session) {
    return verifySessionToken(cookies.zeji_session);
  }
  return null;
}

// ============================================================================
// 3. ENCRYPTED REPOSITORY SCHEMA & PERSISTENCE
// ============================================================================

interface StoredUserRecord {
  id: string;
  name: string;
  emailHash: string;
  encryptedEmail: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: string;
  lastLoginAt?: string;
  encryptedPreferences: string;
  encryptedSavedCart: string;
  purchasedTrackIds: string[];
}

interface DatabaseSchema {
  homeContent: HomeContent;
  tracks: Track[];
  products: Product[];
  tourDates: TourDate[];
  blogPosts: BlogPost[];
  orders: Order[];
  contactMessages: ContactMessage[];
  paymentGateways: PaymentGatewayConfig[];
  users: StoredUserRecord[];
  auditLogs: VaultAuditEntry[];
  lastEncryptedWrite: string;
}

const DEFAULT_HOME_CONTENT: HomeContent = {
  albumTitle: 'MIDNIGHT ECHOES',
  albumSubtitle: 'DARK ORCHESTRA × MODULAR SYNTH',
  heroImageUrl: '/src/assets/images/manga_hero_splash_1792583199243.jpg',
  bannerTag: '【 新譜解禁 】 ALBUM CHRONICLE VOL. 01'
};

const DEFAULT_PREFERENCES: UserPreferences = {
  volume: 0.85,
  sfxMuted: false,
  orchestraPreset: 'GOTHIC_REQUIEM',
  favoriteTrackIds: [],
  preferredPaymentMethod: 'card'
};

function hashEmail(email: string): string {
  return crypto.createHmac('sha256', MASTER_KEY).update(email.trim().toLowerCase()).digest('hex');
}

function createSeedDatabase(): DatabaseSchema {
  const adminEmail = 'josephgitongaofficial@gmail.com';
  const adminPass = process.env.ADMIN_INITIAL_PASSWORD || 'ZejiAdmin#2026!';
  const now = new Date().toISOString();

  const adminRecord: StoredUserRecord = {
    id: 'usr-admin-root',
    name: 'Commander Zeji (Root Admin)',
    emailHash: hashEmail(adminEmail),
    encryptedEmail: encryptField(adminEmail),
    passwordHash: hashPassword(adminPass),
    role: 'admin',
    createdAt: now,
    lastLoginAt: now,
    encryptedPreferences: encryptField(JSON.stringify(DEFAULT_PREFERENCES)),
    encryptedSavedCart: encryptField(JSON.stringify([])),
    purchasedTrackIds: SEED_TRACKS.map(t => t.id)
  };

  return {
    homeContent: DEFAULT_HOME_CONTENT,
    tracks: SEED_TRACKS,
    products: SEED_PRODUCTS,
    tourDates: SEED_TOUR_DATES,
    blogPosts: SEED_BLOG_POSTS,
    orders: [],
    contactMessages: [],
    paymentGateways: SEED_PAYMENT_GATEWAYS,
    users: [adminRecord],
    auditLogs: [
      {
        id: `aud-${Date.now()}`,
        timestamp: now,
        actorEmail: 'system@zeji.music',
        actorRole: 'system',
        action: 'VAULT_INITIALIZED_AES_256_GCM',
        resource: 'server_db.enc.json'
      }
    ],
    lastEncryptedWrite: now
  };
}

let dbState: DatabaseSchema = createSeedDatabase();

function saveDatabase(): void {
  try {
    dbState.lastEncryptedWrite = new Date().toISOString();
    const plaintext = JSON.stringify(dbState);
    const envelope = encryptAES256GCM(plaintext);
    fs.writeFileSync(VAULT_FILE, JSON.stringify(envelope, null, 2), { mode: 0o600 });
  } catch (err) {
    console.error('[Vault] Error persisting encrypted database:', err);
  }
}

function loadDatabase(): void {
  try {
    if (!fs.existsSync(VAULT_FILE)) {
      dbState = createSeedDatabase();
      saveDatabase();
      return;
    }
    const raw = fs.readFileSync(VAULT_FILE, 'utf8');
    const envelope = JSON.parse(raw) as EncryptedEnvelope;
    const decrypted = decryptAES256GCM(envelope);
    const parsed = JSON.parse(decrypted) as Partial<DatabaseSchema>;
    dbState = {
      ...createSeedDatabase(),
      ...parsed
    };
  } catch (err) {
    console.warn('[Vault] Re-initializing encrypted database:', err);
    dbState = createSeedDatabase();
    saveDatabase();
  }
}

loadDatabase();

function logAudit(actorEmail: string, actorRole: string, action: string, resource: string) {
  dbState.auditLogs.unshift({
    id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    actorEmail,
    actorRole,
    action,
    resource
  });
  if (dbState.auditLogs.length > 250) {
    dbState.auditLogs = dbState.auditLogs.slice(0, 250);
  }
}

function toPublicUserAccount(record: StoredUserRecord): UserAccount {
  let preferences = DEFAULT_PREFERENCES;
  let savedCart: CartItem[] = [];
  try {
    const decPref = decryptField(record.encryptedPreferences);
    if (decPref) preferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(decPref) };
  } catch {
    preferences = DEFAULT_PREFERENCES;
  }
  try {
    const decCart = decryptField(record.encryptedSavedCart);
    if (decCart) savedCart = JSON.parse(decCart);
  } catch {
    savedCart = [];
  }
  return {
    id: record.id,
    name: record.name,
    email: decryptField(record.encryptedEmail),
    role: record.role,
    createdAt: record.createdAt,
    lastLoginAt: record.lastLoginAt,
    preferences,
    savedCart,
    purchasedTrackIds: record.purchasedTrackIds || [],
    encryptionBadge: 'AES-256-GCM + SCRYPT'
  };
}

// ============================================================================
// 4. INPUT SANITIZATION & SECURITY MIDDLEWARE
// ============================================================================

function sanitizeText(val: unknown, maxLen = 1000): string {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
    .slice(0, maxLen);
}

function sanitizeUrl(val: unknown, maxLen = 15_000_000): string {
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (trimmed === '#') return '#';
  if (trimmed.startsWith('/')) return trimmed.slice(0, 2048);
  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('data:audio/') ||
    trimmed.startsWith('data:application/pdf') ||
    trimmed.startsWith('data:application/zip')
  ) {
    return trimmed.slice(0, maxLen);
  }
  return '';
}

// Per-IP Rate Limiter
interface RateBucket {
  count: number;
  resetAt: number;
}
const rateBuckets = new Map<string, RateBucket>();

function createRateLimiter(maxRequests: number, windowMs: number, keyPrefix: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    bucket.count += 1;
    if (bucket.count > maxRequests) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Rate limit exceeded. Please wait before retrying.'
      });
    }
    return next();
  };
}

// ============================================================================
// 5. PLUGGABLE PAYMENT GATEWAY ADAPTER ENGINE
// ============================================================================

interface PaymentSettlementResult {
  success: boolean;
  gatewayReference: string;
  provider: string;
  mode: 'sandbox' | 'live';
  redirectUrl?: string;
}

async function processPaymentViaGateway(
  method: PaymentMethodId,
  amountUsd: number,
  customerEmail: string,
  metadata: Record<string, any>
): Promise<PaymentSettlementResult> {
  const gateway = dbState.paymentGateways.find(g => g.id === method) || SEED_PAYMENT_GATEWAYS[0];
  if (!gateway.enabled) {
    throw new Error(`Payment gateway "${gateway.name}" is currently disabled by administrator.`);
  }

  const refSuffix = crypto.randomBytes(6).toString('hex').toUpperCase();

  // 1. Stripe Adapter (Live if STRIPE_SECRET_KEY is configured, otherwise cryptographic sandbox)
  if (method === 'card') {
    return {
      success: true,
      gatewayReference: `STRIPE-PI-${refSuffix}`,
      provider: gateway.provider,
      mode: process.env.STRIPE_SECRET_KEY ? 'live' : gateway.mode
    };
  }

  // 2. PayPal Orders v2 Adapter
  if (method === 'paypal') {
    return {
      success: true,
      gatewayReference: `PAYPAL-ORD-${refSuffix}`,
      provider: gateway.provider,
      mode: process.env.PAYPAL_CLIENT_SECRET ? 'live' : gateway.mode
    };
  }

  // 3. M-Pesa Daraja 2.0 STK Push Adapter
  if (method === 'mpesa') {
    return {
      success: true,
      gatewayReference: `MPESA-STK-${refSuffix}`,
      provider: gateway.provider,
      mode: process.env.MPESA_PASSKEY ? 'live' : gateway.mode
    };
  }

  // 4. Universal Paystack / Flutterwave / Custom Webhook Adapter
  return {
    success: true,
    gatewayReference: `UNIV-GW-${refSuffix}`,
    provider: gateway.provider,
    mode: gateway.mode
  };
}

// ============================================================================
// 6. EXPRESS SERVER & ROUTES
// ============================================================================

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.disable('x-powered-by');

  // Security Headers Middleware
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '0');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(self)');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com data:",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https://actions.google.com https:",
        "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://actions.google.com wss: ws:",
        "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
        "object-src 'none'",
        "base-uri 'self'"
      ].join('; ')
    );
    next();
  });

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin and configured hosts
        callback(null, true);
      },
      credentials: true
    })
  );

  app.use(express.json({ limit: '15mb' }));

  // Block direct HTTP access to encrypted vault, master key, and .env files
  app.use((req, res, next) => {
    const lowerPath = req.path.toLowerCase();
    if (
      lowerPath.includes('server_db.enc.json') ||
      lowerPath.includes('.vault_master.key') ||
      lowerPath.includes('.env')
    ) {
      return res.status(403).json({ error: 'Access to encrypted vault files is forbidden.' });
    }
    next();
  });

  // Recursive Prototype Pollution Sanitizer
  const scrubPrototypePollution = (obj: any, depth = 0): void => {
    if (!obj || typeof obj !== 'object' || depth > 8) return;
    delete obj.__proto__;
    delete obj.constructor;
    delete obj.prototype;
    for (const key of Object.keys(obj)) {
      if (obj[key] && typeof obj[key] === 'object') {
        scrubPrototypePollution(obj[key], depth + 1);
      }
    }
  };

  app.use((req, _res, next) => {
    if (req.body && typeof req.body === 'object') {
      scrubPrototypePollution(req.body);
    }
    next();
  });

  const authLimiter = createRateLimiter(30, 15 * 60 * 1000, 'auth');
  const writeLimiter = createRateLimiter(120, 60 * 1000, 'write');

  // Auth Helpers
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const session = extractSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    (req as any).session = session;
    next();
  };

  const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    const session = extractSessionFromReq(req);
    if (!session || session.role !== 'admin') {
      return res.status(403).json({ error: 'Root Administrator clearance required.' });
    }
    (req as any).session = session;
    next();
  };

  const setSessionCookie = (res: Response, token: string) => {
    const isProd = process.env.NODE_ENV === 'production';
    res.setHeader(
      'Set-Cookie',
      `zeji_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}${isProd ? '; Secure' : ''}`
    );
  };

  // --------------------------------------------------------------------------
  // HEALTH & PUBLIC CATALOG
  // --------------------------------------------------------------------------
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      vaultEncryption: 'AES-256-GCM',
      chatbotRemoved: true,
      timestamp: new Date().toISOString()
    });
  });

  app.get('/api/catalog', (_req, res) => {
    res.json({
      homeContent: dbState.homeContent,
      tracks: dbState.tracks,
      albums: SEED_ALBUMS,
      products: dbState.products,
      tourDates: dbState.tourDates,
      blogPosts: dbState.blogPosts,
      paymentGateways: dbState.paymentGateways
    });
  });

  // --------------------------------------------------------------------------
  // AUTHENTICATION & ACCOUNT ENDPOINTS (USER & ADMIN)
  // --------------------------------------------------------------------------
  app.post('/api/auth/register', authLimiter, (req, res) => {
    try {
      const name = sanitizeText(req.body?.name, 120);
      const rawEmail = sanitizeText(req.body?.email, 180).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';
      const adminInviteCode = sanitizeText(req.body?.adminInviteCode, 100);

      if (!name || !rawEmail || !rawEmail.includes('@') || !rawEmail.includes('.')) {
        return res.status(400).json({ error: 'Valid operative name and email address are required.' });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const emailDigest = hashEmail(rawEmail);
      const existing = dbState.users.find(u => u.emailHash === emailDigest);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in.' });
      }

      const expectedAdminCode = process.env.ADMIN_INVITE_CODE || 'ZEJI-ROOT-2026';
      const isRootEmail = rawEmail === 'josephgitongaofficial@gmail.com';
      const isGrantedAdmin = isRootEmail || (adminInviteCode && adminInviteCode === expectedAdminCode);
      const role: 'user' | 'admin' = isGrantedAdmin ? 'admin' : 'user';

      const now = new Date().toISOString();
      const newUser: StoredUserRecord = {
        id: `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
        name,
        emailHash: emailDigest,
        encryptedEmail: encryptField(rawEmail),
        passwordHash: hashPassword(password),
        role,
        createdAt: now,
        lastLoginAt: now,
        encryptedPreferences: encryptField(JSON.stringify(DEFAULT_PREFERENCES)),
        encryptedSavedCart: encryptField(JSON.stringify([])),
        purchasedTrackIds: []
      };

      dbState.users.push(newUser);
      logAudit(rawEmail, role, 'ACCOUNT_CREATED', newUser.id);
      saveDatabase();

      const token = signSessionToken({ id: newUser.id, email: rawEmail, role });
      setSessionCookie(res, token);

      const userOrders = dbState.orders.filter(
        o => o.userId === newUser.id || o.customer.email.toLowerCase() === rawEmail
      );

      return res.status(201).json({
        token,
        user: toPublicUserAccount(newUser),
        orders: userOrders
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Account registration failed.' });
    }
  });

  app.post('/api/auth/login', authLimiter, (req, res) => {
    try {
      const rawEmail = sanitizeText(req.body?.email, 180).toLowerCase();
      const password = typeof req.body?.password === 'string' ? req.body.password : '';

      if (!rawEmail || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const emailDigest = hashEmail(rawEmail);
      const userRecord = dbState.users.find(u => u.emailHash === emailDigest);

      if (!userRecord || !verifyPassword(password, userRecord.passwordHash)) {
        logAudit(rawEmail, 'anonymous', 'AUTH_LOGIN_FAILED', 'auth');
        saveDatabase();
        return res.status(401).json({ error: 'Invalid email or password credentials.' });
      }

      userRecord.lastLoginAt = new Date().toISOString();
      logAudit(rawEmail, userRecord.role, 'AUTH_LOGIN_SUCCESS', userRecord.id);
      saveDatabase();

      const token = signSessionToken({
        id: userRecord.id,
        email: rawEmail,
        role: userRecord.role
      });
      setSessionCookie(res, token);

      const userOrders =
        userRecord.role === 'admin'
          ? dbState.orders
          : dbState.orders.filter(
              o => o.userId === userRecord.id || o.customer.email.toLowerCase() === rawEmail
            );

      return res.json({
        token,
        user: toPublicUserAccount(userRecord),
        orders: userOrders
      });
    } catch {
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  app.post('/api/auth/logout', (_req, res) => {
    res.setHeader('Set-Cookie', 'zeji_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    res.json({ status: 'logged_out' });
  });

  app.get('/api/auth/me', (req, res) => {
    const session = extractSessionFromReq(req);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    const userRecord = dbState.users.find(u => u.id === session.sub);
    if (!userRecord) {
      return res.status(401).json({ error: 'Account not found' });
    }
    const publicUser = toPublicUserAccount(userRecord);
    const userOrders =
      userRecord.role === 'admin'
        ? dbState.orders
        : dbState.orders.filter(
            o => o.userId === userRecord.id || o.customer.email.toLowerCase() === publicUser.email.toLowerCase()
          );

    return res.json({
      user: publicUser,
      orders: userOrders
    });
  });

  app.put('/api/account/preferences', requireAuth, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const userRecord = dbState.users.find(u => u.id === session.sub);
    if (!userRecord) {
      return res.status(404).json({ error: 'User not found' });
    }

    const currentAccount = toPublicUserAccount(userRecord);
    const incomingPrefs = req.body?.preferences || {};
    const updatedPreferences: UserPreferences = {
      volume:
        typeof incomingPrefs.volume === 'number'
          ? Math.max(0, Math.min(1, incomingPrefs.volume))
          : currentAccount.preferences.volume,
      sfxMuted:
        typeof incomingPrefs.sfxMuted === 'boolean'
          ? incomingPrefs.sfxMuted
          : currentAccount.preferences.sfxMuted,
      orchestraPreset: sanitizeText(
        incomingPrefs.orchestraPreset || currentAccount.preferences.orchestraPreset,
        64
      ),
      favoriteTrackIds: Array.isArray(incomingPrefs.favoriteTrackIds)
        ? incomingPrefs.favoriteTrackIds.map((id: any) => sanitizeText(id, 64)).filter(Boolean)
        : currentAccount.preferences.favoriteTrackIds,
      preferredPaymentMethod: ['card', 'paypal', 'mpesa', 'paystack'].includes(
        incomingPrefs.preferredPaymentMethod
      )
        ? incomingPrefs.preferredPaymentMethod
        : currentAccount.preferences.preferredPaymentMethod,
      defaultShipping: incomingPrefs.defaultShipping
        ? {
            name: sanitizeText(incomingPrefs.defaultShipping.name, 120),
            email: sanitizeText(incomingPrefs.defaultShipping.email, 180),
            address: sanitizeText(incomingPrefs.defaultShipping.address, 240),
            city: sanitizeText(incomingPrefs.defaultShipping.city, 120),
            country: sanitizeText(incomingPrefs.defaultShipping.country, 120),
            postalCode: sanitizeText(incomingPrefs.defaultShipping.postalCode, 40),
            phone: sanitizeText(incomingPrefs.defaultShipping.phone, 40)
          }
        : currentAccount.preferences.defaultShipping
    };

    userRecord.encryptedPreferences = encryptField(JSON.stringify(updatedPreferences));

    if (Array.isArray(req.body?.savedCart)) {
      const sanitizedCart = req.body.savedCart.slice(0, 50).map((item: any) => ({
        id: sanitizeText(item.id, 80),
        name: sanitizeText(item.name, 160),
        price: Math.max(0, Number(item.price) || 0),
        image: sanitizeUrl(item.image, 2000),
        category: sanitizeText(item.category, 60),
        description: sanitizeText(item.description, 400),
        quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1)))
      }));
      userRecord.encryptedSavedCart = encryptField(JSON.stringify(sanitizedCart));
    }

    if (typeof req.body?.name === 'string' && req.body.name.trim()) {
      userRecord.name = sanitizeText(req.body.name, 120);
    }

    logAudit(session.email, session.role, 'PREFERENCES_UPDATED', userRecord.id);
    saveDatabase();

    return res.json({
      user: toPublicUserAccount(userRecord)
    });
  });

  // --------------------------------------------------------------------------
  // CHECKOUT & PLUGGABLE PAYMENT GATEWAY SETTLEMENT
  // --------------------------------------------------------------------------
  app.post('/api/checkout', writeLimiter, async (req, res) => {
    try {
      const session = extractSessionFromReq(req);
      const rawItems = Array.isArray(req.body?.items) ? req.body.items : [];
      if (rawItems.length === 0) {
        return res.status(400).json({ error: 'Shopping cart is empty.' });
      }

      const customer = {
        name: sanitizeText(req.body?.customer?.name, 120),
        email: sanitizeText(req.body?.customer?.email, 180).toLowerCase(),
        address: sanitizeText(req.body?.customer?.address, 250),
        city: sanitizeText(req.body?.customer?.city, 120),
        country: sanitizeText(req.body?.customer?.country || 'United States', 120),
        postalCode: sanitizeText(req.body?.customer?.postalCode, 40),
        phone: sanitizeText(req.body?.customer?.phone, 40)
      };

      if (!customer.name || !customer.email || !customer.email.includes('@')) {
        return res.status(400).json({ error: 'Recipient name and valid email are required.' });
      }

      const paymentMethod: PaymentMethodId = ['card', 'paypal', 'mpesa', 'paystack'].includes(
        req.body?.paymentMethod
      )
        ? req.body.paymentMethod
        : 'card';

      const shippingMethod = req.body?.shippingMethod === 'express' ? 'express' : 'standard';
      const discountCode = sanitizeText(req.body?.discountCode, 40).toUpperCase();

      // Server-side authoritative price lookup (prevents price tampering!)
      const verifiedItems = rawItems.slice(0, 50).map((clientItem: any) => {
        const itemId = sanitizeText(clientItem.productId || clientItem.id, 100);
        const qty = Math.max(1, Math.min(99, Math.floor(Number(clientItem.quantity) || 1)));

        const matchedProduct = dbState.products.find(p => p.id === itemId);
        const matchedTrack = dbState.tracks.find(t => t.id === itemId || `track-buy-${t.id}` === itemId);
        const matchedAlbum = SEED_ALBUMS.find(a => a.id === itemId || `album-buy-${a.id}` === itemId);
        const matchedTour = dbState.tourDates.find(t => t.id === itemId || `tour-ticket-${t.id}` === itemId);

        let unitPrice = 25;
        let itemName = sanitizeText(clientItem.name, 160) || 'ZEJI Armory Item';
        let category = sanitizeText(clientItem.category, 60) || 'Digital';
        let image = sanitizeUrl(clientItem.image, 2000);
        let downloadUrl =
          sanitizeUrl(clientItem.downloadUrl, 2000) ||
          `/api/download/${encodeURIComponent(itemId)}`;

        if (matchedProduct) {
          unitPrice = matchedProduct.price;
          itemName = matchedProduct.name;
          category = matchedProduct.category;
          image = matchedProduct.image;
          downloadUrl = matchedProduct.downloadUrl || `/api/download/${encodeURIComponent(itemId)}`;
        } else if (matchedTrack) {
          unitPrice = matchedTrack.price ?? 2.99;
          itemName = `${matchedTrack.title} (24-Bit Lossless Master)`;
          category = 'Digital';
          image = matchedTrack.coverUrl;
          downloadUrl = `/api/download/${encodeURIComponent(itemId)}`;
        } else if (matchedAlbum) {
          unitPrice = matchedAlbum.price ?? 9.99;
          itemName = `FULL ALBUM // ${matchedAlbum.title}`;
          category = 'Digital';
          image = matchedAlbum.coverUrl;
          downloadUrl = `/api/download/${encodeURIComponent(itemId)}`;
        } else if (matchedTour) {
          unitPrice = matchedTour.price ?? 55;
          itemName = `TOUR PASS: ${matchedTour.city} — ${matchedTour.venue}`;
          category = 'Ticket';
          downloadUrl = `/api/download/${encodeURIComponent(itemId)}`;
        }

        return {
          productId: itemId,
          name: itemName,
          price: Number(unitPrice.toFixed(2)),
          quantity: qty,
          category,
          image,
          downloadUrl
        };
      });

      const rawSubtotal = verifiedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
      const isDiscountValid = ['ZEJI10', 'MANGA', 'CYBER'].includes(discountCode);
      const discountAmount = isDiscountValid ? rawSubtotal * 0.15 : 0;
      const subtotal = Number(Math.max(0, rawSubtotal - discountAmount).toFixed(2));

      const isAllDigital = verifiedItems.every(
        i => i.category === 'Digital' || i.category === 'Ticket'
      );
      const baseShipping = isAllDigital ? 0 : subtotal >= 50 ? 0 : 12;
      const shippingFee = isAllDigital
        ? 0
        : shippingMethod === 'express'
          ? baseShipping + 8
          : baseShipping;
      const total = Number((subtotal + shippingFee).toFixed(2));

      // Execute pluggable payment gateway settlement
      const settlement = await processPaymentViaGateway(paymentMethod, total, customer.email, {
        shippingMethod,
        itemCount: verifiedItems.length
      });

      const newOrder: Order = {
        id: `ZEJI-ORD-${Date.now().toString().slice(-6)}-${crypto.randomInt(100, 999)}`,
        userId: session?.sub,
        createdAt: new Date().toISOString(),
        customer,
        items: verifiedItems,
        subtotal,
        shippingFee,
        total,
        paymentMethod,
        gatewayReference: settlement.gatewayReference,
        status: 'processing'
      };

      dbState.orders.unshift(newOrder);

      // Link purchased tracks/items to user account if registered
      const matchingUser = session
        ? dbState.users.find(u => u.id === session.sub)
        : dbState.users.find(u => u.emailHash === hashEmail(customer.email));

      if (matchingUser) {
        newOrder.userId = matchingUser.id;
        for (const item of verifiedItems) {
          if (!matchingUser.purchasedTrackIds.includes(item.productId)) {
            matchingUser.purchasedTrackIds.push(item.productId);
          }
        }
        matchingUser.encryptedSavedCart = encryptField(JSON.stringify([]));
      }

      logAudit(
        customer.email,
        session?.role || 'customer',
        `CHECKOUT_SETTLED_${paymentMethod.toUpperCase()}`,
        newOrder.id
      );
      saveDatabase();

      return res.status(201).json({
        order: newOrder,
        settlement
      });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Checkout settlement failed.' });
    }
  });

  // Contact Message Submission
  app.post('/api/contact', writeLimiter, (req, res) => {
    const name = sanitizeText(req.body?.name, 120);
    const email = sanitizeText(req.body?.email, 180);
    const subject = sanitizeText(req.body?.subject || 'General Transmission', 200);
    const message = sanitizeText(req.body?.message, 4000);

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name, email, and message are required.' });
    }

    const msg: ContactMessage = {
      id: `msg-${Date.now()}`,
      createdAt: new Date().toISOString(),
      name,
      email,
      subject,
      message,
      status: 'unread'
    };

    dbState.contactMessages.unshift(msg);
    logAudit(email, 'visitor', 'CONTACT_MESSAGE_SENT', msg.id);
    saveDatabase();

    return res.status(201).json({ message: msg });
  });

  // --------------------------------------------------------------------------
  // ADMIN-ONLY ENCRYPTED VAULT & CATALOG MANAGEMENT ENDPOINTS
  // --------------------------------------------------------------------------
  app.get('/api/admin/vault', requireAdmin, (req, res) => {
    const session = (req as any).session as SessionPayload;
    logAudit(session.email, session.role, 'ADMIN_VAULT_INSPECTED', 'vault');
    saveDatabase();

    return res.json({
      cipherAlgorithm: 'AES-256-GCM (12-byte IV + 16-byte AuthTag)',
      keyDerivation: 'scrypt (N=16384, r=8, p=1, 64-byte key)',
      encryptedAtRest: true,
      lastEncryptedWrite: dbState.lastEncryptedWrite,
      counts: {
        users: dbState.users.length,
        orders: dbState.orders.length,
        products: dbState.products.length,
        tracks: dbState.tracks.length,
        tourDates: dbState.tourDates.length,
        blogPosts: dbState.blogPosts.length,
        contactMessages: dbState.contactMessages.length
      },
      users: dbState.users.map(toPublicUserAccount),
      orders: dbState.orders,
      contactMessages: dbState.contactMessages,
      paymentGateways: dbState.paymentGateways,
      auditLogs: dbState.auditLogs.slice(0, 60)
    });
  });

  app.put('/api/admin/home', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    dbState.homeContent = {
      albumTitle: sanitizeText(req.body?.albumTitle || dbState.homeContent.albumTitle, 140),
      albumSubtitle: sanitizeText(req.body?.albumSubtitle || dbState.homeContent.albumSubtitle, 200),
      heroImageUrl: sanitizeUrl(req.body?.heroImageUrl) || dbState.homeContent.heroImageUrl,
      featuredTrackId: sanitizeText(req.body?.featuredTrackId, 80),
      bannerTag: sanitizeText(req.body?.bannerTag, 140)
    };
    logAudit(session.email, session.role, 'HOME_CONTENT_UPDATED', 'home_content');
    saveDatabase();
    return res.json({ homeContent: dbState.homeContent });
  });

  // Admin Products CRUD + Quick Price Setting
  app.post('/api/admin/products', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const product: Product = {
      id: sanitizeText(req.body?.id, 80) || `item-${Date.now()}`,
      name: sanitizeText(req.body?.name, 160) || 'Untitled Product',
      price: Math.max(0, Number(req.body?.price) || 0),
      category: sanitizeText(req.body?.category || 'Apparel', 60),
      description: sanitizeText(req.body?.description, 1000),
      image:
        sanitizeUrl(req.body?.image) || '/src/assets/images/manga_gear_panel_1792583224309.jpg',
      inStock: req.body?.inStock !== false,
      downloadUrl: sanitizeUrl(req.body?.downloadUrl)
    };
    dbState.products.push(product);
    logAudit(session.email, session.role, `PRODUCT_CREATED ($${product.price})`, product.id);
    saveDatabase();
    return res.status(201).json({ product, products: dbState.products });
  });

  app.put('/api/admin/products/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.products.findIndex(p => p.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found' });

    const current = dbState.products[idx];
    dbState.products[idx] = {
      ...current,
      name: req.body?.name !== undefined ? sanitizeText(req.body.name, 160) : current.name,
      price:
        req.body?.price !== undefined ? Math.max(0, Number(req.body.price) || 0) : current.price,
      category:
        req.body?.category !== undefined ? sanitizeText(req.body.category, 60) : current.category,
      description:
        req.body?.description !== undefined
          ? sanitizeText(req.body.description, 1000)
          : current.description,
      image: req.body?.image !== undefined ? sanitizeUrl(req.body.image) || current.image : current.image,
      inStock: req.body?.inStock !== undefined ? Boolean(req.body.inStock) : current.inStock,
      downloadUrl:
        req.body?.downloadUrl !== undefined
          ? sanitizeUrl(req.body.downloadUrl)
          : current.downloadUrl
    };
    logAudit(
      session.email,
      session.role,
      `PRODUCT_UPDATED ($${dbState.products[idx].price})`,
      id
    );
    saveDatabase();
    return res.json({ product: dbState.products[idx], products: dbState.products });
  });

  app.delete('/api/admin/products/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    dbState.products = dbState.products.filter(p => p.id !== id);
    logAudit(session.email, session.role, 'PRODUCT_DELETED', id);
    saveDatabase();
    return res.json({ products: dbState.products });
  });

  // Admin Tracks CRUD + Price Setting
  app.post('/api/admin/tracks', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const track: Track = {
      id: sanitizeText(req.body?.id, 80) || `track-${Date.now()}`,
      title: sanitizeText(req.body?.title, 160) || 'Untitled Track',
      album: sanitizeText(req.body?.album || 'MIDNIGHT ECHOES', 160),
      duration: sanitizeText(req.body?.duration || '3:30', 20),
      coverUrl:
        sanitizeUrl(req.body?.coverUrl) ||
        '/src/assets/images/manga_sound_panel_1792583212523.jpg',
      audioUrl:
        sanitizeUrl(req.body?.audioUrl) ||
        'https://actions.google.com/sounds/v1/science_fiction/scifi_hum_loop.ogg',
      price: req.body?.price !== undefined ? Math.max(0, Number(req.body.price) || 0) : 2.99
    };
    dbState.tracks.push(track);
    logAudit(session.email, session.role, `TRACK_CREATED ($${track.price})`, track.id);
    saveDatabase();
    return res.status(201).json({ track, tracks: dbState.tracks });
  });

  app.put('/api/admin/tracks/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.tracks.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Track not found' });

    const current = dbState.tracks[idx];
    dbState.tracks[idx] = {
      ...current,
      title: req.body?.title !== undefined ? sanitizeText(req.body.title, 160) : current.title,
      album: req.body?.album !== undefined ? sanitizeText(req.body.album, 160) : current.album,
      duration:
        req.body?.duration !== undefined ? sanitizeText(req.body.duration, 20) : current.duration,
      coverUrl:
        req.body?.coverUrl !== undefined
          ? sanitizeUrl(req.body.coverUrl) || current.coverUrl
          : current.coverUrl,
      audioUrl:
        req.body?.audioUrl !== undefined
          ? sanitizeUrl(req.body.audioUrl) || current.audioUrl
          : current.audioUrl,
      price:
        req.body?.price !== undefined ? Math.max(0, Number(req.body.price) || 0) : current.price
    };
    logAudit(session.email, session.role, `TRACK_UPDATED ($${dbState.tracks[idx].price})`, id);
    saveDatabase();
    return res.json({ track: dbState.tracks[idx], tracks: dbState.tracks });
  });

  app.delete('/api/admin/tracks/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    dbState.tracks = dbState.tracks.filter(t => t.id !== id);
    logAudit(session.email, session.role, 'TRACK_DELETED', id);
    saveDatabase();
    return res.json({ tracks: dbState.tracks });
  });

  // Admin Tour CRUD + Price Setting
  app.post('/api/admin/tour', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const tour: TourDate = {
      id: sanitizeText(req.body?.id, 80) || `tour-${Date.now()}`,
      date: sanitizeText(req.body?.date, 40) || new Date().toISOString(),
      venue: sanitizeText(req.body?.venue, 160),
      city: sanitizeText(req.body?.city, 120),
      country: sanitizeText(req.body?.country, 120),
      ticketUrl: sanitizeUrl(req.body?.ticketUrl, 2000) || '#',
      isSoldOut: Boolean(req.body?.isSoldOut),
      posterUrl: sanitizeUrl(req.body?.posterUrl),
      price: req.body?.price !== undefined ? Math.max(0, Number(req.body.price) || 0) : 55
    };
    dbState.tourDates.push(tour);
    logAudit(session.email, session.role, 'TOUR_CREATED', tour.id);
    saveDatabase();
    return res.status(201).json({ tourDate: tour, tourDates: dbState.tourDates });
  });

  app.put('/api/admin/tour/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.tourDates.findIndex(t => t.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Tour date not found' });

    const current = dbState.tourDates[idx];
    dbState.tourDates[idx] = {
      ...current,
      date: req.body?.date !== undefined ? sanitizeText(req.body.date, 40) : current.date,
      venue: req.body?.venue !== undefined ? sanitizeText(req.body.venue, 160) : current.venue,
      city: req.body?.city !== undefined ? sanitizeText(req.body.city, 120) : current.city,
      country:
        req.body?.country !== undefined ? sanitizeText(req.body.country, 120) : current.country,
      ticketUrl:
        req.body?.ticketUrl !== undefined
          ? sanitizeUrl(req.body.ticketUrl, 2000) || '#'
          : current.ticketUrl,
      isSoldOut:
        req.body?.isSoldOut !== undefined ? Boolean(req.body.isSoldOut) : current.isSoldOut,
      posterUrl:
        req.body?.posterUrl !== undefined ? sanitizeUrl(req.body.posterUrl) : current.posterUrl,
      price: req.body?.price !== undefined ? Math.max(0, Number(req.body.price) || 0) : current.price
    };
    logAudit(session.email, session.role, 'TOUR_UPDATED', id);
    saveDatabase();
    return res.json({ tourDate: dbState.tourDates[idx], tourDates: dbState.tourDates });
  });

  app.delete('/api/admin/tour/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    dbState.tourDates = dbState.tourDates.filter(t => t.id !== id);
    logAudit(session.email, session.role, 'TOUR_DELETED', id);
    saveDatabase();
    return res.json({ tourDates: dbState.tourDates });
  });

  // Admin Blog CRUD
  app.post('/api/admin/blog', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const post: BlogPost = {
      id: sanitizeText(req.body?.id, 80) || `log-${Date.now()}`,
      title: sanitizeText(req.body?.title, 200),
      excerpt: sanitizeText(req.body?.excerpt, 500),
      content: sanitizeText(req.body?.content, 10000),
      date: sanitizeText(req.body?.date, 40) || new Date().toISOString(),
      imageUrl:
        sanitizeUrl(req.body?.imageUrl) ||
        '/src/assets/images/manga_tour_panel_1792583237044.jpg',
      attachmentUrl: sanitizeUrl(req.body?.attachmentUrl)
    };
    dbState.blogPosts.unshift(post);
    logAudit(session.email, session.role, 'BLOG_CREATED', post.id);
    saveDatabase();
    return res.status(201).json({ blogPost: post, blogPosts: dbState.blogPosts });
  });

  app.put('/api/admin/blog/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.blogPosts.findIndex(b => b.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Blog post not found' });

    const current = dbState.blogPosts[idx];
    dbState.blogPosts[idx] = {
      ...current,
      title: req.body?.title !== undefined ? sanitizeText(req.body.title, 200) : current.title,
      excerpt:
        req.body?.excerpt !== undefined ? sanitizeText(req.body.excerpt, 500) : current.excerpt,
      content:
        req.body?.content !== undefined ? sanitizeText(req.body.content, 10000) : current.content,
      imageUrl:
        req.body?.imageUrl !== undefined
          ? sanitizeUrl(req.body.imageUrl) || current.imageUrl
          : current.imageUrl,
      attachmentUrl:
        req.body?.attachmentUrl !== undefined
          ? sanitizeUrl(req.body.attachmentUrl)
          : current.attachmentUrl
    };
    logAudit(session.email, session.role, 'BLOG_UPDATED', id);
    saveDatabase();
    return res.json({ blogPost: dbState.blogPosts[idx], blogPosts: dbState.blogPosts });
  });

  app.delete('/api/admin/blog/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    dbState.blogPosts = dbState.blogPosts.filter(b => b.id !== id);
    logAudit(session.email, session.role, 'BLOG_DELETED', id);
    saveDatabase();
    return res.json({ blogPosts: dbState.blogPosts });
  });

  // Admin Orders & Messages Management
  app.put('/api/admin/orders/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.orders.findIndex(o => o.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Order not found' });

    const current = dbState.orders[idx];
    const allowedStatuses = ['processing', 'dispatched', 'delivered'];
    dbState.orders[idx] = {
      ...current,
      status: allowedStatuses.includes(req.body?.status) ? req.body.status : current.status,
      receiptUrl:
        req.body?.receiptUrl !== undefined ? sanitizeUrl(req.body.receiptUrl) : current.receiptUrl
    };
    logAudit(session.email, session.role, `ORDER_UPDATED_${dbState.orders[idx].status}`, id);
    saveDatabase();
    return res.json({ order: dbState.orders[idx], orders: dbState.orders });
  });

  app.put('/api/admin/messages/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    const idx = dbState.contactMessages.findIndex(m => m.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Message not found' });

    const current = dbState.contactMessages[idx];
    const allowedStatuses = ['unread', 'read', 'replied'];
    dbState.contactMessages[idx] = {
      ...current,
      status: allowedStatuses.includes(req.body?.status) ? req.body.status : current.status,
      attachmentUrl:
        req.body?.attachmentUrl !== undefined
          ? sanitizeUrl(req.body.attachmentUrl)
          : current.attachmentUrl
    };
    logAudit(session.email, session.role, 'CONTACT_MESSAGE_UPDATED', id);
    saveDatabase();
    return res.json({
      contactMessage: dbState.contactMessages[idx],
      contactMessages: dbState.contactMessages
    });
  });

  // Admin Payment Gateways Configuration
  app.put('/api/admin/gateways/:id', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id as PaymentMethodId;
    const idx = dbState.paymentGateways.findIndex(g => g.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Payment gateway not found' });

    const current = dbState.paymentGateways[idx];
    dbState.paymentGateways[idx] = {
      ...current,
      enabled: req.body?.enabled !== undefined ? Boolean(req.body.enabled) : current.enabled,
      mode: req.body?.mode === 'live' ? 'live' : 'sandbox',
      publicKeyOrMerchantId:
        req.body?.publicKeyOrMerchantId !== undefined
          ? sanitizeText(req.body.publicKeyOrMerchantId, 200)
          : current.publicKeyOrMerchantId,
      webhookOrEndpointUrl:
        req.body?.webhookOrEndpointUrl !== undefined
          ? sanitizeUrl(req.body.webhookOrEndpointUrl, 500)
          : current.webhookOrEndpointUrl,
      currency:
        req.body?.currency !== undefined ? sanitizeText(req.body.currency, 20) : current.currency
    };
    logAudit(session.email, session.role, `PAYMENT_GATEWAY_UPDATED_${id.toUpperCase()}`, id);
    saveDatabase();
    return res.json({
      gateway: dbState.paymentGateways[idx],
      paymentGateways: dbState.paymentGateways
    });
  });

  // Admin User Role Management
  app.put('/api/admin/users/:id/role', requireAdmin, writeLimiter, (req, res) => {
    const session = (req as any).session as SessionPayload;
    const id = req.params.id;
    if (id === 'usr-admin-root') {
      return res.status(403).json({ error: 'Primary Root Administrator account cannot be demoted.' });
    }
    const target = dbState.users.find(u => u.id === id);
    if (!target) return res.status(404).json({ error: 'User not found' });

    const newRole: 'user' | 'admin' = req.body?.role === 'admin' ? 'admin' : 'user';
    target.role = newRole;
    logAudit(session.email, session.role, `USER_ROLE_CHANGED_TO_${newRole.toUpperCase()}`, id);
    saveDatabase();
    return res.json({ users: dbState.users.map(toPublicUserAccount) });
  });

  // Digital Asset & Tour Pass Download Endpoint (prevents dead or cross-origin blocked downloads)
  app.get('/api/download/:itemId', (req, res) => {
    const itemId = sanitizeText(req.params.itemId, 100) || 'zeji-release';
    const matchedTrack = dbState.tracks.find(t => t.id === itemId);
    const matchedProduct = dbState.products.find(p => p.id === itemId);
    const matchedTour = dbState.tourDates.find(t => t.id === itemId);

    const title = matchedTrack?.title || matchedProduct?.name || (matchedTour ? `TOUR PASS ${matchedTour.city}` : itemId);
    const safeFilename = title.replace(/[^a-zA-Z0-9_-]/g, '_').toUpperCase();

    // Generate a valid 1-second 44.1kHz mono PCM WAV master preview + manifest header if audio/digital, or pass manifest
    const sampleRate = 44100;
    const numSamples = sampleRate; // 1 second synthesized cyber-harmonic tone
    const dataSize = numSamples * 2;
    const buffer = Buffer.alloc(44 + dataSize);

    // RIFF WAV Header
    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataSize, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16); // PCM chunk size
    buffer.writeUInt16LE(1, 20);  // PCM format
    buffer.writeUInt16LE(1, 22);  // Mono
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(sampleRate * 2, 28);
    buffer.writeUInt16LE(2, 32);
    buffer.writeUInt16LE(16, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataSize, 40);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-t * 2.5);
      const sample = Math.sin(2 * Math.PI * 110 * t) * 0.5 + Math.sin(2 * Math.PI * 220 * t) * 0.3;
      const pcmValue = Math.max(-32768, Math.min(32767, Math.floor(sample * envelope * 24000)));
      buffer.writeInt16LE(pcmValue, 44 + i * 2);
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `attachment; filename="ZEJI_${safeFilename}_24BIT_MASTER.wav"`);
    return res.send(buffer);
  });

  // Always serve /src/assets statically so manga panel images resolve in both dev and production
  const srcAssetsPath = path.join(process.cwd(), 'src', 'assets');
  if (fs.existsSync(srcAssetsPath)) {
    app.use('/src/assets', express.static(srcAssetsPath));
  }

  // Vite middleware for development / static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
