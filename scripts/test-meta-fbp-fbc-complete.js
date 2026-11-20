import assert from 'assert';
import http from 'http';
import {
  captureAttribution,
  trackMetaEvent,
  isValidFbp,
  isValidFbc,
  getCookie,
  setCookie
} from '../src/utils/metaPixel.js';
import {
  sendMetaCapiEvent,
  maskIdentifier,
  maskIp,
  extractClientIp
} from '../netlify/functions/utils/metaCapi.js';
import MetaEventLog from '../netlify/functions/models/MetaEventLog.js';

// Setup Mock Meta Graph API Server
let mockMetaServer;
let lastReceivedPayload = null;
let lastReceivedHeaders = null;
let serverPort = 9877;

async function startMockServer() {
  return new Promise((resolve) => {
    mockMetaServer = http.createServer((req, res) => {
      lastReceivedHeaders = req.headers;
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        lastReceivedPayload = body ? JSON.parse(body) : null;
        res.writeHead(200, 'OK', { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ events_received: 1, fbtrace_id: 'test_fbp_fbc_trace' }));
      });
    });
    mockMetaServer.listen(serverPort, () => resolve());
  });
}

async function stopMockServer() {
  return new Promise((resolve) => {
    if (mockMetaServer) mockMetaServer.close(() => resolve());
    else resolve();
  });
}

// Simulated Browser Environment setup
function setupBrowserEnv(initialUrl = 'https://hairshurokkha.com/', cookies = {}) {
  const cookieStore = { ...cookies };

  global.window = {
    location: new URL(initialUrl),
    fbq: function() {}
  };

  global.document = {
    get cookie() {
      return Object.entries(cookieStore)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
    },
    set cookie(str) {
      const [pair] = str.split(';');
      const [key, val] = pair.split('=');
      if (key && val) {
        cookieStore[key.trim()] = val.trim();
      }
    },
    referrer: ''
  };

  Object.defineProperty(global, 'navigator', {
    value: {
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 TestBrowser/1.0'
    },
    configurable: true,
    writable: true
  });

  const localStorageData = {};
  const sessionStorageData = {};

  global.localStorage = {
    getItem: (k) => localStorageData[k] || null,
    setItem: (k, v) => { localStorageData[k] = String(v); },
    removeItem: (k) => { delete localStorageData[k]; },
    clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
  };

  global.sessionStorage = {
    getItem: (k) => sessionStorageData[k] || null,
    setItem: (k, v) => { sessionStorageData[k] = String(v); },
    removeItem: (k) => { delete sessionStorageData[k]; },
    clear: () => { Object.keys(sessionStorageData).forEach(k => delete sessionStorageData[k]); }
  };

  return { cookieStore, localStorageData, sessionStorageData };
}

async function runFbpFbcTests() {
  console.log('--- STARTING COMPLETE FBP & FBC COLLECTION & META CAPI TEST SUITE ---');
  await startMockServer();

  const originalFetch = global.fetch;
  global.fetch = async (url, options) => {
    // Forward CAPI requests to our mock server
    const mockUrl = `http://localhost:${serverPort}/events`;
    return originalFetch(mockUrl, options);
  };

  // Mock Mongo MetaEventLog
  const createdLogs = [];
  const origCreate = MetaEventLog.create;
  MetaEventLog.create = async (doc) => {
    const mockDoc = {
      _id: 'log_' + Math.random().toString(36).substr(2, 9),
      ...doc,
      save: async function() { return this; }
    };
    createdLogs.push(mockDoc);
    return mockDoc;
  };

  try {
    // =========================================================================
    // SCENARIO 1: Direct visit without Facebook ad parameters
    // =========================================================================
    console.log('\n[Scenario 1] Visitor arrives directly without Facebook ad parameters');
    setupBrowserEnv('https://hairshurokkha.com/');

    const attr1 = captureAttribution();
    assert.strictEqual(attr1.fbc, undefined, 'fbc must be undefined when no fbclid and no cookie exists');
    assert.strictEqual(attr1.fbcSource, 'none');

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's1_pageview_001',
      userData: {
        fbp: attr1.fbp,
        fbc: attr1.fbc
      }
    });

    const s1Event = lastReceivedPayload.data[0];
    assert.strictEqual(s1Event.user_data.fbc, undefined, 'user_data.fbc MUST be omitted entirely!');
    assert.strictEqual('fbc' in s1Event.user_data, false);
    const s1Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s1Log.matching.hasFbc, false);
    console.log('✓ Scenario 1 Passed: No fake FBC created; fbc field omitted from CAPI user_data.');

    // =========================================================================
    // SCENARIO 2: Visitor arrives through Facebook ad with fbclid
    // =========================================================================
    console.log('\n[Scenario 2] Visitor arrives through Facebook ad with fbclid');
    const mockFbclid = 'IwAR3xYZ_test_facebook_click_id_999';
    setupBrowserEnv(`https://hairshurokkha.com/?fbclid=${mockFbclid}`);

    const attr2 = captureAttribution();
    assert.ok(attr2.fbc, 'fbc should be generated from fbclid');
    assert.strictEqual(attr2.fbcSource, 'fbclid_generated');
    assert.ok(attr2.fbc.startsWith('fb.1.'), 'fbc format must start with fb.1.');
    assert.ok(attr2.fbc.endsWith(mockFbclid), 'fbc must contain the fbclid');
    assert.strictEqual(attr2.fbc.split('.').length, 4, 'fbc must have 4 period-separated parts');
    // Check that _fbc cookie was set
    assert.ok(document.cookie.includes('_fbc='), '_fbc cookie must be set on document.cookie');

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's2_pageview_002',
      userData: {
        fbc: attr2.fbc,
        fbcSource: attr2.fbcSource
      }
    });

    const s2Event = lastReceivedPayload.data[0];
    assert.strictEqual(s2Event.user_data.fbc, attr2.fbc, 'user_data.fbc must match generated fbc unhashed');
    const s2Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s2Log.matching.hasFbc, true);
    assert.strictEqual(s2Log.matching.fbcSource, 'fbclid_generated');
    console.log(`✓ Scenario 2 Passed: FBC correctly generated as ${attr2.fbc} and passed to CAPI.`);

    // =========================================================================
    // SCENARIO 3: Visitor has existing _fbp cookie
    // =========================================================================
    console.log('\n[Scenario 3] Visitor has existing _fbp cookie');
    const existingFbp = 'fb.1.1685000000.1234567890';
    setupBrowserEnv('https://hairshurokkha.com/', { _fbp: existingFbp });

    const attr3 = captureAttribution();
    assert.strictEqual(attr3.fbp, existingFbp, 'Must capture real _fbp cookie');

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's3_pageview_003',
      userData: {
        fbp: attr3.fbp
      }
    });

    const s3Event = lastReceivedPayload.data[0];
    assert.strictEqual(s3Event.user_data.fbp, existingFbp, 'FBP must be transmitted unhashed');
    const s3Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s3Log.matching.hasFbp, true);
    console.log('✓ Scenario 3 Passed: Real _fbp cookie captured and included unhashed in CAPI user_data.');

    // =========================================================================
    // SCENARIO 4: Visitor has both _fbp and _fbc cookies
    // =========================================================================
    console.log('\n[Scenario 4] Visitor has both _fbp and _fbc cookies');
    const cookieFbp = 'fb.1.1685000000.9988776655';
    const cookieFbc = 'fb.1.1685000000.IwAR_existing_cookie_fbc';
    setupBrowserEnv('https://hairshurokkha.com/', { _fbp: cookieFbp, _fbc: cookieFbc });

    const attr4 = captureAttribution();
    assert.strictEqual(attr4.fbp, cookieFbp);
    assert.strictEqual(attr4.fbc, cookieFbc);
    assert.strictEqual(attr4.fbcSource, 'fbc_cookie');

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's4_pageview_004',
      userData: {
        fbp: attr4.fbp,
        fbc: attr4.fbc,
        fbcSource: attr4.fbcSource
      }
    });

    const s4Event = lastReceivedPayload.data[0];
    assert.strictEqual(s4Event.user_data.fbp, cookieFbp);
    assert.strictEqual(s4Event.user_data.fbc, cookieFbc);
    const s4Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s4Log.matching.hasFbp, true);
    assert.strictEqual(s4Log.matching.hasFbc, true);
    assert.strictEqual(s4Log.matching.fbcSource, 'fbc_cookie');
    console.log('✓ Scenario 4 Passed: Both cookies preferred and transmitted without hashing.');

    // =========================================================================
    // SCENARIO 5: Visitor navigates across multiple SPA routes
    // =========================================================================
    console.log('\n[Scenario 5] Visitor navigates across multiple SPA routes without losing FBC');
    // Step 5A: Land on home with fbclid
    const adFbclid = 'IwAR_ad_click_journey_555';
    setupBrowserEnv(`https://hairshurokkha.com/?fbclid=${adFbclid}`, { _fbp: 'fb.1.1690000000.55555' });
    const initialAttr = captureAttribution();
    const storedFbc = initialAttr.fbc;
    assert.ok(storedFbc);

    // Step 5B: User clicks to /shop (query string stripped/absent in SPA route)
    window.location = new URL('https://hairshurokkha.com/shop');
    const shopAttr = captureAttribution();
    assert.strictEqual(shopAttr.fbc, storedFbc, 'FBC must persist across SPA route changes when query string is gone');
    assert.strictEqual(shopAttr.fbp, 'fb.1.1690000000.55555');

    // Step 5C: User clicks to /product/kirkland-minoxidil
    window.location = new URL('https://hairshurokkha.com/product/kirkland-minoxidil');
    const productAttr = captureAttribution();
    assert.strictEqual(productAttr.fbc, storedFbc);
    console.log('✓ Scenario 5 Passed: FBP and FBC preserved across all SPA route transitions.');

    // =========================================================================
    // SCENARIO 6: AddToCart and InitiateCheckout events
    // =========================================================================
    console.log('\n[Scenario 6] AddToCart and InitiateCheckout events include FBP and FBC');
    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'AddToCart',
      eventId: 's6_cart_001',
      userData: {
        fbp: productAttr.fbp,
        fbc: productAttr.fbc,
        clientUserAgent: navigator.userAgent
      },
      customData: {
        currency: 'BDT',
        value: 1250,
        content_name: 'Kirkland Minoxidil'
      }
    });

    const s6CartEvent = lastReceivedPayload.data[0];
    assert.strictEqual(s6CartEvent.user_data.fbp, 'fb.1.1690000000.55555');
    assert.strictEqual(s6CartEvent.user_data.fbc, storedFbc);
    assert.strictEqual(s6CartEvent.custom_data.value, 1250);

    // InitiateCheckout with phone if filled
    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'InitiateCheckout',
      eventId: 's6_checkout_002',
      userData: {
        phone: '01711223344',
        fbp: productAttr.fbp,
        fbc: productAttr.fbc
      },
      customData: {
        currency: 'BDT',
        value: 1250
      }
    });

    const s6CheckoutEvent = lastReceivedPayload.data[0];
    assert.strictEqual(s6CheckoutEvent.user_data.fbp, 'fb.1.1690000000.55555');
    assert.strictEqual(s6CheckoutEvent.user_data.fbc, storedFbc);
    assert.ok(s6CheckoutEvent.user_data.ph, 'Phone should be hashed in InitiateCheckout');
    console.log('✓ Scenario 6 Passed: AddToCart & InitiateCheckout received valid unhashed FBP/FBC.');

    // =========================================================================
    // SCENARIO 7: Visitor refreshes page before placing an order
    // =========================================================================
    console.log('\n[Scenario 7] Visitor refreshes page before placing order');
    // Simulate refresh: cookie and localStorage preserved
    const refreshedAttr = captureAttribution();
    assert.strictEqual(refreshedAttr.fbc, storedFbc, 'FBC must survive page reload');
    assert.strictEqual(refreshedAttr.fbp, 'fb.1.1690000000.55555', 'FBP must survive page reload');
    console.log('✓ Scenario 7 Passed: Attribution correctly restored after page refresh.');

    // =========================================================================
    // SCENARIO 8: Successful Order & Server-Side Purchase CAPI Event
    // =========================================================================
    console.log('\n[Scenario 8] Order placement and server-side Purchase CAPI event');
    const orderAttribution = {
      fbp: refreshedAttr.fbp,
      fbc: refreshedAttr.fbc,
      fbcSource: refreshedAttr.fbcSource,
      fbclid: adFbclid,
      landingPage: 'https://hairshurokkha.com/',
      ip: '103.205.123.45',
      userAgent: navigator.userAgent
    };

    // Verify order attribution structure
    assert.strictEqual(orderAttribution.fbp, 'fb.1.1690000000.55555');
    assert.strictEqual(orderAttribution.fbc, storedFbc);

    const purchaseUserData = {
      phone: '01812345678',
      firstName: 'Rahim',
      lastName: 'Ahmed',
      city: 'Dhaka',
      clientIpAddress: orderAttribution.ip,
      clientUserAgent: orderAttribution.userAgent,
      fbp: orderAttribution.fbp,
      fbc: orderAttribution.fbc
    };

    const purchaseRes = await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'Purchase',
      eventId: 's8_purchase_order_9999',
      orderId: 'ORD-9999',
      eventSource: 'server_order',
      userData: purchaseUserData,
      customData: {
        currency: 'BDT',
        value: 2500,
        order_id: 'ORD-9999',
        content_type: 'product',
        contents: [{ id: 'kirkland-minox-2', quantity: 2, item_price: 1250 }]
      }
    });

    assert.strictEqual(purchaseRes.success, true);
    const s8Event = lastReceivedPayload.data[0];
    assert.strictEqual(s8Event.event_name, 'Purchase');
    assert.strictEqual(s8Event.user_data.fbp, 'fb.1.1690000000.55555');
    assert.strictEqual(s8Event.user_data.fbc, storedFbc);
    assert.strictEqual(s8Event.user_data.client_ip_address, '103.205.123.45');
    assert.ok(s8Event.user_data.ph, 'Phone must be hashed');
    assert.ok(s8Event.user_data.fn, 'First name must be hashed');
    assert.ok(s8Event.user_data.ct, 'City must be hashed');
    assert.strictEqual(s8Event.custom_data.value, 2500);
    assert.strictEqual(s8Event.custom_data.attribution, undefined, 'No nested attribution');

    const s8Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s8Log.matching.hasFbp, true);
    assert.strictEqual(s8Log.matching.hasFbc, true);
    assert.strictEqual(s8Log.matching.hasIp, true);
    assert.strictEqual(s8Log.matching.hasPhone, true);
    assert.strictEqual(s8Log.orderId, 'ORD-9999');
    console.log('✓ Scenario 8 Passed: Purchase CAPI includes genuine unhashed FBP & FBC, hashed PII, and clean custom_data.');

    // =========================================================================
    // SCENARIO 9: Visitor has no FBP or FBC available
    // =========================================================================
    console.log('\n[Scenario 9] Visitor has NO FBP or FBC available');
    setupBrowserEnv('https://hairshurokkha.com/');

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's9_pageview_no_fbp_fbc',
      userData: {
        fbp: undefined,
        fbc: undefined,
        clientIpAddress: '103.205.123.45'
      }
    });

    const s9Event = lastReceivedPayload.data[0];
    assert.strictEqual('fbp' in s9Event.user_data, false, 'fbp must NOT exist in user_data');
    assert.strictEqual('fbc' in s9Event.user_data, false, 'fbc must NOT exist in user_data');
    const s9Log = createdLogs[createdLogs.length - 1];
    assert.strictEqual(s9Log.matching.hasFbp, false);
    assert.strictEqual(s9Log.matching.hasFbc, false);
    console.log('✓ Scenario 9 Passed: Neither FBP nor FBC was sent; omitted cleanly without fake values.');

    // =========================================================================
    // SCENARIO 10: Ad Blocker Enabled (Pixel blocked, but fbclid present)
    // =========================================================================
    console.log('\n[Scenario 10] Ad blocker enabled: Pixel script blocked, fbclid in URL');
    // Ad blocker blocks fbevents.js, so window.fbq doesn't exist and _fbp cookie is never written
    setupBrowserEnv('https://hairshurokkha.com/?fbclid=IwAR_adblocker_click_777');
    delete global.window.fbq; // Pixel blocked

    const attr10 = captureAttribution();
    // App still captured fbclid and generated FBC!
    assert.ok(attr10.fbc);
    assert.ok(attr10.fbc.endsWith('IwAR_adblocker_click_777'));
    // But fbp is absent because Pixel was blocked
    assert.strictEqual(attr10.fbp, undefined);

    await sendMetaCapiEvent({
      pixelId: '1722516656187525',
      accessToken: 'test_token',
      eventName: 'PageView',
      eventId: 's10_adblock_001',
      userData: {
        fbp: attr10.fbp,
        fbc: attr10.fbc,
        clientIpAddress: '103.205.123.45'
      }
    });

    const s10Event = lastReceivedPayload.data[0];
    assert.strictEqual('fbp' in s10Event.user_data, false, 'fbp must be omitted since Pixel was blocked');
    assert.strictEqual(s10Event.user_data.fbc, attr10.fbc, 'fbc MUST still be sent via server CAPI!');
    console.log('✓ Scenario 10 Passed: Server CAPI successfully delivered FBC despite client-side ad blocker.');

    console.log('\n======================================================');
    console.log('ALL 10 FBP & FBC SCENARIOS VERIFIED AND PASSED 100%!');
    console.log('======================================================\n');
  } finally {
    global.fetch = originalFetch;
    MetaEventLog.create = origCreate;
    await stopMockServer();
  }
}

runFbpFbcTests().catch(err => {
  console.error('TEST SUITE FAILED:', err);
  process.exit(1);
});
