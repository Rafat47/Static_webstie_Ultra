// Meta Facebook Pixel and Conversions API (CAPI) Client Utility

// Helper to safely read a browser cookie by name
export function getCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : '';
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
        attributionData[key] = val;
        foundNew = true;
      }
    });

    // Capture or compute Meta Click ID (_fbc)
    const fbcCookie = getCookie('_fbc');
    if (fbcCookie) {
      attributionData.fbc = fbcCookie;
    } else if (attributionData.fbclid) {
      // Official Meta fbc format: fb.1.<creationTime>.<fbclid>
      attributionData.fbc = `fb.1.${Date.now()}.${attributionData.fbclid}`;
    }

    // Capture Meta Browser ID (_fbp)
    const fbpCookie = getCookie('_fbp');
    if (fbpCookie) {
      attributionData.fbp = fbpCookie;
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

  // Merge fbp and fbc into user data if available
  const mergedUserData = {
    ...userData,
    fbp: userData.fbp || attribution.fbp || getCookie('_fbp') || undefined,
    fbc: userData.fbc || attribution.fbc || getCookie('_fbc') || undefined,
    clientUserAgent: navigator.userAgent
  };

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
          customData: {
            ...customData,
            attribution
          }
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
    trackMetaEvent('ViewContent', {
      content_name: product.name,
      content_category: product.category,
      content_ids: [String(product._id || product.slug)],
      content_type: 'product',
      value: product.salePrice,
      currency: 'BDT'
    });
  },

  search: (query) => {
    if (!query || !query.trim()) return;
    trackMetaEvent('Search', {
      search_string: query.trim(),
      content_category: 'Hair Care'
    });
  },

  addToCart: (product, quantity = 1) => {
    if (!product) return;
    trackMetaEvent('AddToCart', {
      content_name: product.name,
      content_ids: [String(product._id || product.slug)],
      content_type: 'product',
      value: (product.salePrice || 0) * quantity,
      currency: 'BDT',
      quantity
    });
  },

  initiateCheckout: (cartItems, subtotal) => {
    if (!cartItems || cartItems.length === 0) return;
    trackMetaEvent('InitiateCheckout', {
      content_ids: cartItems.map(item => String(item.productId || item.slug || item._id)),
      content_type: 'product',
      num_items: cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0),
      value: subtotal,
      currency: 'BDT'
    });
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

    // Fire browser pixel with identical eventID for deduplication.
    // Skip forwarding to /api/meta/events because the server order route already sent CAPI Purchase.
    trackMetaEvent(
      'Purchase',
      {
        content_name: 'Order Purchase',
        content_type: 'product',
        content_ids: (order.items || []).map(i => String(i.productId || i.slug)),
        num_items: (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
        value: order.finalTotal,
        currency: 'BDT',
        order_id: order.orderId
      },
      {
        phone: order.customer?.phoneNumber,
        firstName: order.customer?.fullName?.split(' ')[0],
        lastName: order.customer?.fullName?.split(' ').slice(1).join(' '),
        city: order.customer?.district,
        fbp: attribution.fbp || getCookie('_fbp'),
        fbc: attribution.fbc || getCookie('_fbc')
      },
      eventId,
      true // skipServerCapi = true (server already dispatched it)
    );

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(storageKey, 'true');
    }
  }
};
