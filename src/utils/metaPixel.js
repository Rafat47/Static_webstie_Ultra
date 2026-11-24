// Meta Facebook Pixel and Conversions API (CAPI) Client Utility

export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : '';
}

export function setCookie(name, value, days = 90) {
  if (typeof document === 'undefined' || !name || !value) return;
  try {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = '; expires=' + date.toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    // Non-blocking
  }
}

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

// Generate RFC4122-compliant UUIDv4 for event deduplication
export function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Capture and persist UTM, fbclid, and Facebook cookies
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

    // META CLICK ID (_fbc)
    const fbcCookie = getCookie('_fbc');
    const rawFbclid = params.get('fbclid');

    if (isValidFbc(fbcCookie)) {
      attributionData.fbc = fbcCookie;
      attributionData.fbcSource = 'fbc_cookie';
    } else if (rawFbclid && typeof rawFbclid === 'string' && rawFbclid.trim().length > 0) {
      const cleanFbclid = rawFbclid.trim();
      const creationTime = Date.now();
      const computedFbc = `fb.1.${creationTime}.${cleanFbclid}`;

      attributionData.fbc = computedFbc;
      attributionData.fbcSource = 'fbclid_generated';
      attributionData.fbclid = cleanFbclid;

      setCookie('_fbc', computedFbc, 90);
    } else if (isValidFbc(existing.fbc)) {
      attributionData.fbc = existing.fbc;
      attributionData.fbcSource = existing.fbcSource || 'stored_session';
      if (!fbcCookie) {
        setCookie('_fbc', existing.fbc, 90);
      }
    } else {
      delete attributionData.fbc;
      attributionData.fbcSource = 'none';
    }

    // META BROWSER ID (_fbp)
    const fbpCookie = getCookie('_fbp');
    if (isValidFbp(fbpCookie)) {
      attributionData.fbp = fbpCookie;
    } else if (isValidFbp(existing.fbp)) {
      attributionData.fbp = existing.fbp;
      if (!fbpCookie) {
        setCookie('_fbp', existing.fbp, 90);
      }
    } else {
      // Auto-generate standard Meta fbp if not present so anonymous pre-checkout events are accepted by CAPI
      const creationTime = Date.now();
      const randomInt = Math.floor(1000000000 + Math.random() * 9000000000);
      const generatedFbp = `fb.1.${creationTime}.${randomInt}`;
      attributionData.fbp = generatedFbp;
      setCookie('_fbp', generatedFbp, 90);
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

let isPixelInitialized = false;

export function initMetaPixel(pixelId) {
  const resolvedPixelId = pixelId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_META_PIXEL_ID) || null;
  if (!resolvedPixelId || typeof window === 'undefined') return;
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

// Unified Dual Tracking Function
export function trackEvent(eventName, customData = {}, userData = {}, customEventId = null, skipServerCapi = false) {
  if (typeof window === 'undefined') return null;

  const eventId = customEventId || generateUuid();
  const attribution = captureAttribution();

  let effectiveFbp = (isValidFbp(userData.fbp) ? userData.fbp.trim() : null) ||
                     (isValidFbp(attribution.fbp) ? attribution.fbp.trim() : null) ||
                     (isValidFbp(getCookie('_fbp')) ? getCookie('_fbp').trim() : null);

  if (!effectiveFbp) {
    const creationTime = Date.now();
    const randomInt = Math.floor(1000000000 + Math.random() * 9000000000);
    effectiveFbp = `fb.1.${creationTime}.${randomInt}`;
    setCookie('_fbp', effectiveFbp, 90);
  }

  const effectiveFbc = (isValidFbc(userData.fbc) ? userData.fbc.trim() : null) ||
                       (isValidFbc(attribution.fbc) ? attribution.fbc.trim() : null) ||
                       (isValidFbc(getCookie('_fbc')) ? getCookie('_fbc').trim() : null) ||
                       null;

  const mergedUserData = {
    ...userData,
    clientUserAgent: navigator.userAgent
  };

  if (effectiveFbp) mergedUserData.fbp = effectiveFbp;
  if (effectiveFbc) mergedUserData.fbc = effectiveFbc;

  // 1. Browser Pixel Fire
  if (window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (err) {
      console.warn('[Meta Pixel] Browser error:', err);
    }
  }

  // 2. Server CAPI Dual Dispatch (sendBeacon or keepalive fetch)
  if (!skipServerCapi) {
    const payload = JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      userData: mergedUserData,
      customData: customData || {}
    });

    try {
      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        const queued = navigator.sendBeacon('/api/track', blob);
        if (!queued) {
          fetch('/api/track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true
          }).catch(() => {});
        }
      } else {
        fetch('/api/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } catch (e) {
      // Non-blocking
    }
  }

  return eventId;
}

// Backward-compatible alias
export const trackMetaEvent = trackEvent;

let lastTrackedPath = null;
let lastTrackedTime = 0;

export function trackRoutePageView(pathname) {
  if (!pathname) return;

  const now = Date.now();
  if (pathname === lastTrackedPath && now - lastTrackedTime < 500) {
    return;
  }

  lastTrackedPath = pathname;
  lastTrackedTime = now;

  // PageView is Pixel ONLY (no server CAPI) per Step 5
  trackEvent('PageView', {}, {}, null, true);
}

// Standard Event Actions
export const metaEvents = {
  pageView: () => trackRoutePageView(window.location.pathname),

  viewContent: (product, currency = 'BDT') => {
    if (!product) return;
    const cat = product.category || 'Minoxidil';
    const prodId = String(product._id || product.slug);
    trackEvent('ViewContent', {
      content_name: product.name,
      content_category: cat,
      content_categories: [cat],
      content_ids: [prodId],
      contents: [{
        id: prodId,
        quantity: 1,
        item_price: Number(product.salePrice) || 0,
        category: cat
      }],
      content_type: 'product',
      value: Number(product.salePrice) || 0,
      currency,
      num_items: 1
    });
  },

  addToCart: (product, quantity = 1, currency = 'BDT') => {
    if (!product) return;
    const items = Array.isArray(product) ? product : [product];
    const cat = items[0]?.category || 'Minoxidil';
    const contentIds = items.map(i => String(i._id || i.productId || i.slug));
    const totalValue = items.reduce((acc, i) => acc + ((Number(i.salePrice || i.unitPrice) || 0) * (Number(i.quantity || quantity) || 1)), 0);
    const totalQty = items.reduce((acc, i) => acc + (Number(i.quantity || quantity) || 1), 0);

    trackEvent('AddToCart', {
      content_name: items.length === 1 ? (items[0].name || items[0].productName || 'Product') : 'Cart Items',
      content_category: cat,
      content_categories: [cat],
      content_ids: contentIds,
      contents: items.map(i => ({
        id: String(i._id || i.productId || i.slug),
        quantity: Number(i.quantity || quantity) || 1,
        item_price: Number(i.salePrice || i.unitPrice) || 0,
        category: i.category || cat
      })),
      content_type: 'product',
      value: totalValue,
      currency,
      num_items: totalQty
    });
  },

  initiateCheckout: (cartItems, subtotal, userData = {}, currency = 'BDT') => {
    if (!cartItems || cartItems.length === 0) return;
    const cat = cartItems[0]?.category || 'Minoxidil';

    trackEvent('InitiateCheckout', {
      content_name: 'Cart Checkout',
      content_category: cat,
      content_categories: [cat],
      content_ids: cartItems.map(item => String(item.productId || item.slug || item._id)),
      contents: cartItems.map(item => ({
        id: String(item.productId || item.slug || item._id),
        quantity: Number(item.quantity) || 1,
        item_price: Number(item.unitPrice || item.salePrice) || 0,
        category: item.category || cat
      })),
      content_type: 'product',
      num_items: cartItems.reduce((acc, item) => acc + (Number(item.quantity) || 1), 0),
      value: Number(subtotal) || 0,
      currency
    }, userData);
  },

  contact: (channel = 'WhatsApp', details = {}) => {
    trackEvent('Contact', {
      content_name: `Contact via ${channel}`,
      ...details
    });
  },

  search: (query) => {
    if (!query || !query.trim()) return;
    trackEvent('Search', {
      search_string: query.trim()
    });
  },

  purchase: (order) => {
    if (!order || !order.orderId) return;

    const storageKey = `meta_purchase_fired_${order.orderId}`;
    if (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(storageKey)) {
      console.log(`[Meta Pixel] Purchase already recorded for order ${order.orderId}. Guarding against duplicate.`);
      return;
    }

    const eventId = order.tracking?.eventId || order.metaEventId || order.eventId || `order_${order.orderId}`;
    const items = order.items || [];
    const cat = items[0]?.category || 'Minoxidil';

    // Browser fires its Purchase with identical eventId; skipServerCapi=true since server already dispatched it
    trackEvent(
      'Purchase',
      {
        content_name: 'Order Purchase',
        content_type: 'product',
        content_category: cat,
        content_categories: [cat],
        content_ids: items.map(i => String(i.productId || i.slug)),
        contents: items.map(i => ({
          id: String(i.productId || i.slug),
          quantity: Number(i.quantity) || 1,
          item_price: Number(i.unitPrice) || 0,
          category: i.category || cat
        })),
        num_items: items.reduce((acc, i) => acc + (Number(i.quantity) || 1), 0),
        value: Number(order.finalTotal || order.total) || 0,
        currency: 'BDT',
        order_id: String(order.orderId)
      },
      {
        phone: order.customer?.phoneNumber,
        firstName: order.customer?.fullName?.split(' ')[0],
        lastName: order.customer?.fullName?.split(' ').slice(1).join(' '),
        city: order.customer?.district
      },
      eventId,
      true
    );

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  }
};
