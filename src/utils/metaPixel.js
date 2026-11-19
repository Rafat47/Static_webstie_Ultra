// Meta Facebook Pixel and Conversions API (CAPI) Client Utility

// 1. Capture and persist UTM and Facebook attribution parameters
export function captureAttribution() {
  if (typeof window === 'undefined') return {};

  try {
    const params = new URLSearchParams(window.location.search);
    const attributionData = {};

    const keys = ['fbclid', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
    let foundNew = false;

    keys.forEach(key => {
      const val = params.get(key);
      if (val) {
        attributionData[key] = val;
        foundNew = true;
      }
    });

    if (foundNew) {
      attributionData.landingPage = window.location.href;
      attributionData.referrer = document.referrer || '';
      attributionData.timestamp = Date.now();
      localStorage.setItem('regrow_attribution', JSON.stringify(attributionData));
      sessionStorage.setItem('regrow_attribution', JSON.stringify(attributionData));
    }

    const saved = sessionStorage.getItem('regrow_attribution') || localStorage.getItem('regrow_attribution');
    return saved ? JSON.parse(saved) : {};
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

// 4. Dual Track Event (Browser Pixel + Server CAPI)
export async function trackMetaEvent(eventName, customData = {}, userData = {}, customEventId = null) {
  if (typeof window === 'undefined') return;

  const eventId = customEventId || generateEventId(eventName.toLowerCase());
  const attribution = captureAttribution();

  // A. Fire Browser Pixel
  if (window.fbq) {
    try {
      window.fbq('track', eventName, customData, { eventID: eventId });
    } catch (err) {
      console.warn('[Meta Pixel] Browser tracking error:', err);
    }
  }

  // B. Forward to Server CAPI for Deduplication
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
        userData: {
          ...userData,
          clientUserAgent: navigator.userAgent
        },
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

  return eventId;
}

// Predefined Standard Event Helpers
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
    trackMetaEvent('InitiateCheckout', {
      content_ids: cartItems.map(item => String(item.productId || item.slug || item._id)),
      content_type: 'product',
      num_items: cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0),
      value: subtotal,
      currency: 'BDT'
    });
  },
  purchase: (order) => {
    if (!order) return;
    const eventId = order.metaEventId || `order_${order.orderId}`;
    trackMetaEvent(
      'Purchase',
      {
        content_name: 'Order Purchase',
        content_type: 'product',
        content_ids: (order.items || []).map(i => String(i.productId || i.slug)),
        num_items: (order.items || []).reduce((acc, i) => acc + i.quantity, 0),
        value: order.finalTotal,
        currency: 'BDT',
        order_id: order.orderId
      },
      {
        phone: order.customer?.phoneNumber,
        firstName: order.customer?.fullName?.split(' ')[0],
        lastName: order.customer?.fullName?.split(' ').slice(1).join(' '),
        city: order.customer?.district
      },
      eventId
    );
  }
};
