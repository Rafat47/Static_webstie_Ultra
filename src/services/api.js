import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// In-Memory cache & deduplication
const apiCache = new Map();
const inFlightRequests = new Map();
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

const getCachedOrFetch = async (cacheKey, fetchFn, ttlMs = DEFAULT_TTL_MS, force = false) => {
  const now = Date.now();
  const cached = apiCache.get(cacheKey);

  if (!force && cached && (now - cached.timestamp < ttlMs)) {
    return cached.data;
  }

  if (!force && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const requestPromise = (async () => {
    try {
      const data = await fetchFn();
      apiCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, requestPromise);
  return requestPromise;
};

export const clearApiCache = (keyPrefix = '') => {
  if (typeof window !== 'undefined') {
    try {
      if (window.sessionStorage) {
        window.sessionStorage.removeItem('hair_shurokkha_website_data_cache');
      }
      window.dispatchEvent(new CustomEvent('website-data-invalidated', { detail: { keyPrefix } }));
    } catch (e) {
      // Non-blocking
    }
  }

  if (!keyPrefix) {
    apiCache.clear();
  } else {
    for (const key of apiCache.keys()) {
      if (key.startsWith(keyPrefix)) {
        apiCache.delete(key);
      }
    }
  }
};

export const api = {
  clearCache: clearApiCache,

  // Centralized Public Website Data API (reads static /data/website-data.json)
  getWebsiteData: async (force = false) => {
    return getCachedOrFetch('website-data', async () => {
      try {
        const query = force ? `?t=${Date.now()}` : '';
        const localRes = await axios.get(`/data/website-data.json${query}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });

        if (localRes.data && (localRes.data.categories || localRes.data.products || localRes.data.siteSettings)) {
          const payload = localRes.data;
          return {
            success: true,
            version: payload.version || 1,
            updatedAt: payload.updatedAt,
            data: payload
          };
        }
      } catch (err) {
        console.warn('Direct static fetch of website-data.json failed:', err.message);
      }
      return { success: false, data: null };
    }, 5 * 60 * 1000, force);
  },

  // Public compatibility aliases
  getSiteConfig: async (force = false) => {
    const res = await api.getWebsiteData(force);
    return res?.data ? { success: true, data: res.data } : { success: false };
  },

  getCategories: async (force = false) => {
    const res = await api.getWebsiteData(force);
    return res?.data?.categories ? { success: true, data: res.data.categories } : { success: false, data: [] };
  },

  getProducts: async (params = {}, force = false) => {
    const res = await api.getWebsiteData(force);
    return res?.data?.products ? { success: true, data: res.data.products } : { success: false, data: [] };
  },

  getProductBySlug: async (slug) => {
    const res = await api.getWebsiteData();
    const product = res?.data?.products?.find(p => p.slug === slug || String(p._id) === String(slug));
    return product ? { success: true, data: product } : { success: false, message: 'Product not found' };
  },

  // Submit Order to Netlify Function create-order
  createOrder: async (orderPayload) => {
    const res = await apiClient.post('/orders', orderPayload);
    return res.data;
  },

  // Order status inquiry
  getOrderById: async (orderId) => {
    // If order was cached in sessionStorage after checkout
    if (typeof sessionStorage !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(`order_${orderId}`);
        if (saved) {
          return { success: true, data: JSON.parse(saved) };
        }
      } catch (e) {
        // Continue
      }
    }
    const res = await apiClient.get(`/orders/${orderId}`);
    return res.data;
  }
};

export default api;
