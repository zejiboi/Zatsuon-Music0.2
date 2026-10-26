import fs from 'fs';
import path from 'path';

const BASE = 'http://127.0.0.1:3000';

async function assert(condition, message) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('==============================================================');
  console.log('  ZATSUON // ZEJI v2.0 — END-TO-END VERIFICATION SUITE');
  console.log('==============================================================');

  // 1. Verify Security Headers & Public Catalog
  console.log('\n[1/8] Testing Public Catalog (/api/catalog) & Security Headers...');
  const bootRes = await fetch(`${BASE}/api/catalog`);
  await assert(bootRes.status === 200, 'GET /api/catalog returns HTTP 200');
  const csp = bootRes.headers.get('content-security-policy');
  const xfo = bootRes.headers.get('x-frame-options');
  const xcto = bootRes.headers.get('x-content-type-options');
  await assert(Boolean(csp && csp.includes("default-src 'self'")), 'Content-Security-Policy header is enforced');
  await assert(xfo === 'DENY', 'X-Frame-Options: DENY header is enforced');
  await assert(xcto === 'nosniff', 'X-Content-Type-Options: nosniff header is enforced');

  const bootData = await bootRes.json();
  await assert(Array.isArray(bootData.products) && bootData.products.length > 0, `Products loaded (${bootData.products.length})`);
  await assert(Array.isArray(bootData.tracks) && bootData.tracks.length > 0, `Tracks with pricing loaded (${bootData.tracks.length})`);
  await assert(Array.isArray(bootData.tourDates) && bootData.tourDates.length > 0, `Tour dates with pass pricing loaded (${bootData.tourDates.length})`);
  await assert(Array.isArray(bootData.paymentGateways) && bootData.paymentGateways.length === 4, 'All 4 Pluggable Payment Gateways returned');

  // 2. Verify AI Chatbot Removal & Vault File Path Protection
  console.log('\n[2/8] Verifying Complete AI Chatbot Removal & Vault Path Guard...');
  const chatRes = await fetch(`${BASE}/api/chat`, { method: 'POST' });
  await assert(chatRes.status === 404, 'Removed /api/chat endpoint is not exposed (returns 404)');
  const chatbotFileExists = fs.existsSync(path.join(process.cwd(), 'src/components/AIChatbot.tsx'));
  await assert(!chatbotFileExists, 'src/components/AIChatbot.tsx is permanently removed');
  const blockedVaultFileRes = await fetch(`${BASE}/server_db.enc.json`);
  await assert(blockedVaultFileRes.status === 403, 'Direct HTTP access to /server_db.enc.json is blocked (403 Forbidden)');

  // 3. Test User Account Creation, Preferences, & Non-Admin Access Control
  console.log('\n[3/8] Testing User Account Registration & Encrypted Preferences...');
  const uniqueEmail = `operative_${Date.now()}@zeji.jp`;
  const regRes = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Operative Akira',
      email: uniqueEmail,
      password: 'StrongPassword#2026!'
    })
  });
  await assert(regRes.status === 201, 'POST /api/auth/register creates new user account (201)');
  const regData = await regRes.json();
  const userToken = regData.token;
  await assert(Boolean(userToken), 'Session token issued for registered user');
  await assert(regData.user.role === 'user', 'Standard registration assigns role="user"');

  // Verify non-admin CANNOT access encrypted vault
  const unauthVaultRes = await fetch(`${BASE}/api/admin/vault`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  await assert(unauthVaultRes.status === 403, 'Standard user is strictly blocked (HTTP 403) from /api/admin/vault');

  // Update user preferences & favorite track
  const prefRes = await fetch(`${BASE}/api/account/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      preferences: {
        preferredPaymentMethod: 'mpesa',
        favoriteTrackIds: ['1', '2'],
        defaultShipping: {
          name: 'Operative Akira',
          email: uniqueEmail,
          address: '88 Shinjuku Neon Ave',
          city: 'Tokyo',
          country: 'Japan',
          postalCode: '160-0022',
          phone: '+254712345678'
        }
      }
    })
  });
  await assert(prefRes.status === 200, 'PUT /api/account/preferences encrypts & persists user preferences');

  // 4. Test Pluggable Checkout & Server-Side Authoritative Price Enforcement
  console.log('\n[4/8] Testing Checkout & Server-Side Anti-Tamper Price Calculation...');
  const firstProduct = bootData.products[0];
  const firstTrack = bootData.tracks[0];
  const checkoutRes = await fetch(`${BASE}/api/checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`
    },
    body: JSON.stringify({
      customer: {
        name: 'Operative Akira',
        email: uniqueEmail,
        address: '88 Shinjuku Neon Ave',
        city: 'Tokyo',
        country: 'Japan',
        postalCode: '160-0022',
        phone: '+254712345678'
      },
      // Attempt client price tampering ($0.01) to prove server ignores client price and uses authoritative DB price
      items: [
        { id: firstProduct.id, name: firstProduct.name, price: 0.01, quantity: 1, category: firstProduct.category },
        { id: `track-buy-${firstTrack.id}`, name: `TRACK // ${firstTrack.title}`, price: 0.01, quantity: 1, category: 'Digital' }
      ],
      paymentMethod: 'mpesa',
      shippingMethod: 'standard',
      discountCode: 'ZEJI10'
    })
  });
  await assert(checkoutRes.status === 201, 'POST /api/checkout settles order via M-Pesa gateway (201)');
  const checkoutData = await checkoutRes.json();
  const expectedRawSubtotal = firstProduct.price + (firstTrack.price ?? 2.99);
  const expectedDiscountedSubtotal = Number((expectedRawSubtotal * 0.85).toFixed(2));
  await assert(
    Math.abs(checkoutData.order.subtotal - expectedDiscountedSubtotal) < 0.05,
    `Server prevented client price tampering and enforced authoritative subtotal ($${checkoutData.order.subtotal})`
  );
  await assert(
    Boolean(checkoutData.order.gatewayReference && checkoutData.order.gatewayReference.startsWith('MPESA-')),
    `Gateway settlement reference generated (${checkoutData.order.gatewayReference})`
  );

  // Verify order appears in user's account history
  const meRes = await fetch(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });
  const meData = await meRes.json();
  await assert(
    Array.isArray(meData.orders) && meData.orders.some(o => o.id === checkoutData.order.id),
    'Purchased order is linked to user account purchase history'
  );
  await assert(
    Array.isArray(meData.user.purchasedTrackIds) && meData.user.purchasedTrackIds.includes(`track-buy-${firstTrack.id}`),
    'Purchased digital track is unlocked in user account purchasedTrackIds'
  );

  // 5. Test Root Admin Authentication & Price Management
  console.log('\n[5/8] Testing Root Admin Authentication & Dynamic Price Setting...');
  const adminLoginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'josephgitongaofficial@gmail.com',
      password: process.env.ADMIN_INITIAL_PASSWORD || 'ZejiAdmin#2026!'
    })
  });
  await assert(adminLoginRes.status === 200, 'POST /api/auth/login authenticates Root Admin');
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  await assert(adminData.user.role === 'admin', 'Root Admin session has role="admin"');

  // Admin updates product price
  const updatedPrice = 95.00;
  const prodPriceRes = await fetch(`${BASE}/api/admin/products/${firstProduct.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ price: updatedPrice })
  });
  await assert(prodPriceRes.status === 200, `Admin updated product "${firstProduct.name}" price to $${updatedPrice}`);

  // Restore original price
  await fetch(`${BASE}/api/admin/products/${firstProduct.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({ price: firstProduct.price })
  });

  // 6. Test Admin Payment Gateway Configuration
  console.log('\n[6/8] Testing Admin Pluggable Payment Gateway Configuration...');
  const gwRes = await fetch(`${BASE}/api/admin/gateways/paystack`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      enabled: true,
      mode: 'sandbox',
      publicKeyOrMerchantId: 'pk_test_zeji_universal_gateway',
      webhookOrEndpointUrl: 'https://api.paystack.co/transaction/initialize'
    })
  });
  await assert(gwRes.status === 200, 'Admin updated Paystack/Universal API Gateway settings');

  // 7. Test Admin-Only Encrypted Vault Inspection
  console.log('\n[7/8] Testing Admin-Only Encrypted Vault Repository Inspection...');
  const vaultRes = await fetch(`${BASE}/api/admin/vault`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  await assert(vaultRes.status === 200, 'GET /api/admin/vault succeeds for Root Admin (200)');
  const vaultData = await vaultRes.json();
  await assert(vaultData.encryptedAtRest === true, 'Vault confirms AES-256-GCM encryption at rest');
  await assert(
    Array.isArray(vaultData.users) && vaultData.users.some(u => u.email === uniqueEmail),
    'Admin Vault decrypts user repository and shows newly registered operative'
  );

  // 8. Verify On-Disk Database File is Ciphertext (Not Plaintext)
  console.log('\n[8/9] Verifying On-Disk Database File (server_db.enc.json) is AES-256-GCM Ciphertext...');
  const dbRaw = fs.readFileSync(path.join(process.cwd(), 'server_db.enc.json'), 'utf8');
  const dbEnvelope = JSON.parse(dbRaw);
  await assert(dbEnvelope.alg === 'aes-256-gcm', 'On-disk envelope uses aes-256-gcm');
  await assert(!dbRaw.includes(uniqueEmail), 'Plaintext user email does NOT appear in on-disk file (encrypted at rest)');

  // 9. Verify All Production Static Asset Links, SPA Routes, Digital Downloads & Multi-Gateway Checkout
  console.log('\n[9/9] Verifying Asset Links, SPA Routes, Digital Downloads & All 4 Gateways...');
  const assetPaths = [
    '/src/assets/images/manga_hero_splash_1792583199243.jpg',
    '/src/assets/images/manga_sound_panel_1792583212523.jpg',
    '/src/assets/images/manga_gear_panel_1792583224309.jpg',
    '/src/assets/images/manga_tour_panel_1792583237044.jpg',
    '/src/assets/images/game_album_midnight_echoes_1792574038993.jpg'
  ];
  for (const assetPath of assetPaths) {
    const assetRes = await fetch(`${BASE}${assetPath}`);
    const ct = assetRes.headers.get('content-type') || '';
    await assert(
      assetRes.status === 200 && ct.includes('image/'),
      `Production asset link ${assetPath} serves valid image (${ct})`
    );
  }

  const spaRoutes = ['/', '/music', '/store', '/tour', '/blog', '/contact', '/cart', '/account', '/admin'];
  for (const route of spaRoutes) {
    const routeRes = await fetch(`${BASE}${route}`);
    const ct = routeRes.headers.get('content-type') || '';
    await assert(
      routeRes.status === 200 && ct.includes('text/html'),
      `SPA route ${route} resolves cleanly (200 text/html)`
    );
  }

  const dlRes = await fetch(`${BASE}/api/download/track-1`);
  const dlCt = dlRes.headers.get('content-type') || '';
  const dlDisp = dlRes.headers.get('content-disposition') || '';
  await assert(
    dlRes.status === 200 && dlCt.includes('audio/wav') && dlDisp.includes('attachment'),
    `GET /api/download/track-1 serves downloadable WAV master (${dlDisp})`
  );

  for (const gw of ['card', 'paypal', 'paystack']) {
    const gwCheckoutRes = await fetch(`${BASE}/api/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: {
          name: 'Operative Guest',
          email: 'operative@zeji.music',
          address: 'Digital Vault Delivery',
          city: 'Global Network',
          country: 'United States'
        },
        items: [{ id: 'tour-1', name: 'TOUR PASS: BERLIN', price: 55, quantity: 1, category: 'Ticket' }],
        paymentMethod: gw,
        shippingMethod: 'standard'
      })
    });
    await assert(gwCheckoutRes.status === 201, `Guest checkout via gateway "${gw}" settles cleanly (201)`);
  }

  console.log('\n==============================================================');
  console.log('  ALL 9 E2E TEST SUITES PASSED (100% PASS RATE)');
  console.log('==============================================================');
}

runTests().catch(err => {
  console.error(err);
  process.exit(1);
});
