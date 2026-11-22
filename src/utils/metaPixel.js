// Meta Facebook Pixel and Conversions API (CAPI) Client Utility

// Helper to safely read a browser cookie by name
export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : '';
}

// Helper to safely set a first-party cookie
export function setCookie(name, value, days = 90) {
  if (typeof document === 'undefined' || !name || !value) return;
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = '; expires=' + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // Non-blocking cookie set fallback
  }
}

// Validation helpers for Meta identifiers
export function isValidFbp(val) {
  return typeof val === 'string' &&
    val.startsWith('fb.') &&
    val.split('.').length >= 3 &&
    !val.includes('undefined') &&
    !val.includes('null');
}

export function isValidFbc(val) {
  return typeof val === 'string' &&
    val.startsWith('fb.') &&
    val.split('.').length >= 4 &&
    !val.includes('undefined') &&
    !val.includes('null');
}

// 1. Capture and persist UTM, fbclid, and Facebook browser/click cookies
export function captureAttribution() {
  if (typeof window === 'undefined') return {};

  try {
    const params = new URLSearchParams(window.location.search);
    const existing = JSON.parse(sessionStorage.getItem('regrow_attribution') || localStorage.getItem('regrow_attribution') || '{}');
    const attributionData = { ...existing };

    const keys = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    let foundNew = false;

    keys.forEach(key => {
      const val = params.get(key);
      if (val) {
        attributionData[key] = val.trim();
        foundNew = true;
      }
    });

    // --- META CLICK ID (_fbc) CAPTURE / GENERATION ---
    // Prefer actual _fbc cookie if available and valid
    const fbcCookie = getCookie('_fbc');
    const rawFbclid = params.get('fbclid');

    if (isValidFbc(fbcCookie)) {
      attributionData.fbc = fbcCookie;
      attributionData.fbcSource = 'fbc_cookie';
    } else if (rawFbclid && typeof rawFbclid === 'string' && rawFbclid.trim().length > 0) {
      // Generate Meta format: fb.1.<creationTime>.<fbclid>
      const cleanFbclid = rawFbclid.trim();
      const creationTime = Date.now();
      const computedFbc = `fb.1.${creationTime}.${cleanFbclid}`;

      attributionData.fbc = computedFbc;
      attributionData.fbcSource = 'fbclid_generated';
      attributionData.fbclid = cleanFbclid;

      // Set first-party cookie for 90 days as per Meta documentation
      setCookie('_fbc', computedFbc, 90);
    } else if (isValidFbc(existing.fbc)) {
      // Preserve previously captured FBC from current session or storage
      attributionData.fbc = existing.fbc;
      attributionData.fbcSource = existing.fbcSource || 'stored_session';
      if (!fbcCookie) {
        setCookie('_fbc', existing.fbc, 90);
      }
    } else {
      delete attributionData.fbc;
      attributionData.fbcSource = 'none';
    }

    // --- META BROWSER ID (_fbp) CAPTURE ---
    // Read actual _fbp cookie created by Meta Pixel. Do NOT generate fake random values.
    const fbpCookie = getCookie('_fbp');
    if (isValidFbp(fbpCookie)) {
      attributionData.fbp = fbpCookie;
    } else if (isValidFbp(existing.fbp)) {
      attributionData.fbp = existing.fbp;
    } else {
      delete attributionData.fbp;
    }

    if (foundNew || !attributionData.landingPage) {
      attributionData.landingPage = window.location.href;
      attributionData.referrer = document.referrer || '';
      attributionData.timestamp = Date.now();
    }

    localStorage.setItem('regrow_attribution', JSON.stringify(attributionData));
    sessionStorage.setItem('regrow_attribution', JSON.stringify(attributionData));

    return attributionData;
  } catch (e) {
    return {};
  }
}

// 2. Initialize Meta Pixel in browser
let isPixelInitialized = false;

export function initMetaPixel(pixelId) {
  if (!pixelId || typeof window === 'undefined') return;
  if (isPixelInitialized || window.fbq) {
    return;
  }

  /* eslint-disable */
  (function(f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function() {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = '2.0';
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq('init', pixelId);
  isPixelInitialized = true;
  console.log(`[Meta Pixel] Initialized with ID: ${pixelId}`);
}

// 3. Helper to generate unique event ID for deduplication between Pixel and CAPI
export function generateEventId(prefix = 'evt') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// 4. Dual Track Event (Browser Pixel + Server CAPI Forwarding)
export async function trackMetaEvent(eventName, customData = {}, userData = {}, customEventId = null, skipServerCapi = false) {
  if (typeof window === 'undefined') return;

  const eventId = customEventId || generateEventId(eventName.toLowerCase());
  const attribution = captureAttribution();

  // Validate and extract FBP (strictly unhashed, real cookie value only)
  const effectiveFbp = (isValidFbp(userData.fbp) ? userData.fbp.trim() : null) ||
                       (isValidFbp(attribution.fbp) ? attribution.fbp.trim() : null) ||
                       (isValidFbp(getCookie('_fbp')) ? getCookie('_fbp').trim() : null) ||
                       null;

  // Validate and extract FBC
  const effectiveFbc = (isValidFbc(userData.fbc) ? userData.fbc.trim() : null) ||
                       (isValidFbc(attribution.fbc) ? attribution.fbc.trim() : null) ||
                       (isValidFbc(getCookie('_fbc')) ? getCookie('_fbc').trim() : null) ||
                       null;

  const fbcSource = userData.fbcSource || attribution.fbcSource || (effectiveFbc ? 'fbc_cookie' : 'none');

  // Build clean merged user data (omit missing fields, never send empty/null)
  const mergedUserData = {
    ...userData,
    clientUserAgent: navigator.userAgent
  };

  if (effectiveFbp) {
    mergedUserData.fbp = effectiveFbp;
  } else {
    delete mergedUserData.fbp;
  }

  if (effectiveFbc) {
    mergedUserData.fbc = effectiveFbc;
    mergedUserData.fbcSource = fbcSource;
  } else {
    delete mergedUserData.fbc;
    delete mergedUserData.fbcSource;
  }

  // A. Fire Browser Pixel
  if (window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (err) {
      console.warn('[Meta Pixel] Browser tracking error:', err);
    }
  }

  // B. Forward to Server CAPI for Deduplication (unless handled exclusively on server)
  if (!skipServerCapi) {
    try {
      fetch('/api/meta/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          eventName,
          eventId,
          eventSourceUrl: window.location.href,
          userData: mergedUserData,
          customData: customData || {},
          attribution
        })
      }).catch(() => {
        // Non-blocking background catch
      });
    } catch (err) {
      // Silent catch
    }
  }

  return eventId;
}

// 5. Centralized PageView Tracker with Deduplication against StrictMode double-invocations
let lastTrackedPath = null;
let lastTrackedTime = 0;

export function trackRoutePageView(pathname) {
  if (!pathname || pathname.startsWith('/admin')) return;

  const now = Date.now();
  // Deduplicate exact same pathname if called within 500ms (e.g. React StrictMode)
  if (pathname === lastTrackedPath && now - lastTrackedTime < 500) {
    return;
  }

  lastTrackedPath = pathname;
  lastTrackedTime = now;
  trackMetaEvent('PageView');
}

// 6. Predefined Standard Event Helpers
export const metaEvents = {
  pageView: () => {
    trackMetaEvent('PageView');
  },

  viewContent: (product) => {
    if (!product) return;
    const cat = product.category || 'Hair Care';
    trackMetaEvent('ViewContent', {
      content_name: product.name,
      content_category: cat,
      content_categories: [cat],
      content_ids: [String(product._id || product.slug)],
      contents: [{
        id: String(product._id || product.slug),
        quantity: 1,
        item_price: product.salePrice || 0,
        category: cat
      }],
      content_type: 'product',
      value: product.salePrice,
      currency: 'BDT'
    });
  },

  search: (query) => {
    if (!query || !query.trim()) return;
    trackMetaEvent('Search', {
      search_string: query.trim(),
      content_category: 'Hair Care',
      content_categories: ['Hair Care']
    });
  },

  addToCart: (product, quantity = 1) => {
    if (!product) return;
    const items = Array.isArray(product) ? product : [product];
    const categories = [...new Set(items.map(i => i.category || i.content_category).filter(Boolean))];
    const contentCategory = categories.length > 0 ? categories.join(', ') : 'Hair Care';
    const contentIds = items.map(i => String(i._id || i.productId || i.slug));
    const totalValue = items.reduce((acc, i) => acc + ((i.salePrice || i.unitPrice || 0) * (i.quantity || quantity || 1)), 0);
    const totalQty = items.reduce((acc, i) => acc + (i.quantity || quantity || 1), 0);

    trackMetaEvent('AddToCart', {
      content_name: items.length === 1 ? (items[0].name || items[0].productName || 'Product') : 'Cart Items',
      content_category: contentCategory,
      content_categories: categories.length > 0 ? categories : ['Hair Care'],
      content_ids: contentIds,
      contents: items.map(i => ({
        id: String(i._id || i.productId || i.slug),
        quantity: i.quantity || quantity || 1,
        item_price: i.salePrice || i.unitPrice || 0,
        category: i.category || i.content_category || 'Hair Care'
      })),
      content_type: 'product',
      value: totalValue,
      currency: 'BDT',
      quantity: totalQty
    });
  },

  initiateCheckout: (cartItems, subtotal, userData = {}) => {
    if (!cartItems || cartItems.length === 0) return;
    const categories = [...new Set(cartItems.map(item => item.category || item.content_category).filter(Boolean))];
    const contentCategory = categories.length > 0 ? categories.join(', ') : 'Hair Care';

    trackMetaEvent('InitiateCheckout', {
      content_name: 'Cart Checkout',
      content_category: contentCategory,
      content_categories: categories.length > 0 ? categories : ['Hair Care'],
      content_ids: cartItems.map(item => String(item.productId || item.slug || item._id)),
      contents: cartItems.map(item => ({
        id: String(item.productId || item.slug || item._id),
        quantity: item.quantity || 1,
        item_price: item.unitPrice || item.salePrice || 0,
        category: item.category || item.content_category || 'Hair Care'
      })),
      content_type: 'product',
      num_items: cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0),
      value: subtotal,
      currency: 'BDT'
    }, userData);
  },

  purchase: (order) => {
    if (!order || !order.orderId) return;

    // Idempotency: Prevent duplicate Purchase on page refresh
    const storageKey = `meta_purchase_fired_${order.orderId}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) {
      console.log(`[Meta Pixel] Purchase event already fired for order ${order.orderId}. Skipping duplicate.`);
      return;
    }

    const eventId = order.metaEventId || `order_${order.orderId}`;
    const attribution = captureAttribution();

    const items = order.items || [];
    const categories = [...new Set(items.map(i => i.category || i.content_category).filter(Boolean))];
    const contentCategory = categories.length > 0 ? categories.join(', ') : 'Hair Care';

    // Fire browser pixel with identical eventID for deduplication.
    // Skip forwarding to /api/meta/events because the server order route already sent CAPI Purchase.
    trackMetaEvent(
      'Purchase',
      {
        content_name: 'Order Purchase',
        content_type: 'product',
        content_category: contentCategory,
        content_categories: categories.length > 0 ? categories : ['Hair Care'],
        content_ids: items.map(i => String(i.productId || i.slug)),
        contents: items.map(i => ({
          id: String(i.productId || i.slug),
          quantity: i.quantity || 1,
          item_price: i.unitPrice || 0,
          category: i.category || i.content_category || 'Hair Care'
        })),
        num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: order.finalTotal,
        currency: 'BDT',
        order_id: order.orderId
      },
      {
        phone: order.customer?.phoneNumber,
        firstName: order.customer?.fullName?.split(' ')[0],
        lastName: order.customer?.fullName?.split(' ').slice(1).join(' '),
        city: order.customer?.district,
        fbp: order.attribution?.fbp || attribution.fbp || getCookie('_fbp') || undefined,
        fbc: order.attribution?.fbc || attribution.fbc || getCookie('_fbc') || undefined,
        fbcSource: order.attribution?.fbcSource || attribution.fbcSource
      },
      eventId,
      true // skipServerCapi = true (server already dispatched it)
    );

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  }
};
