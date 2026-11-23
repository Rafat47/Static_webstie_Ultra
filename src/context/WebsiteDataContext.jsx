import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { initMetaPixel, captureAttribution } from '../utils/metaPixel';

const WebsiteDataContext = createContext(null);
const CACHE_KEY = 'hair_shurokkha_website_data_cache';
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes cache freshness window

export function WebsiteDataProvider({ children }) {
  // 1. Synchronously try to hydrate from sessionStorage for zero-latency initial render
  const [websiteData, setWebsiteData] = useState(() => {
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.data && (Date.now() - parsed.timestamp < CACHE_TTL_MS)) {
          return parsed.data;
        }
      }
    } catch (e) {
      // Non-blocking sessionStorage error
    }
    return null;
  });

  const [loading, setLoading] = useState(() => !websiteData);
  const [error, setError] = useState(null);
  const isFetchingRef = useRef(false);

  // 2. Centralized fetch: called exactly ONCE on initial mount
  const fetchWebsiteData = useCallback(async (force = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      if (!websiteData || force) {
        setLoading(true);
      }

      const res = await api.getWebsiteData(force);
      if (res && res.success && res.data) {
        setWebsiteData(res.data);
        setError(null);

        // Update sessionStorage
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify({
            data: res.data,
            version: res.version,
            timestamp: Date.now()
          }));
        } catch (e) {
          // Non-blocking
        }

        // Initialize Meta Pixel once data arrives (resolve pixelId from UI content first, env fallback)
        const meta = res.data.metaSettings;
        const resolvedPixelId = meta?.pixelId || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_META_PIXEL_ID) || null;
        if (resolvedPixelId && meta?.isPixelEnabled !== false) {
          initMetaPixel(resolvedPixelId);
        }
      }
    } catch (err) {
      console.warn('Failed to load centralized website data:', err);
      setError(err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [websiteData]);

  useEffect(() => {
    // Capture any Facebook attribution cookies or UTM query params immediately
    captureAttribution();
    fetchWebsiteData();

    // Listen for data invalidation events triggered by admin updates
    const handleInvalidation = () => {
      fetchWebsiteData(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('website-data-invalidated', handleInvalidation);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('website-data-invalidated', handleInvalidation);
      }
    };
  }, [fetchWebsiteData]);

  // Derived state (memoized helpers for instant storefront access)
  const allCategories = websiteData?.categories || [];
  const categories = allCategories
    .filter(c => c.isActive !== false)
    .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));

  const allProducts = websiteData?.products || [];
  const products = allProducts
    .filter(p => p.isActive !== false)
    .sort((a, b) => (Number(a.displayOrder ?? a.carouselOrder) || 0) - (Number(b.displayOrder ?? b.carouselOrder) || 0));

  const config = websiteData || null;
  const version = websiteData?.version || 1;

  // Instant in-memory helper functions (no network calls needed!)
  const getProductBySlug = useCallback((slug) => {
    if (!slug) return null;
    return allProducts.find(p => p.slug === slug || String(p._id) === String(slug)) || null;
  }, [allProducts]);

  const getCategoryBySlug = useCallback((slug) => {
    if (!slug) return null;
    return allCategories.find(c => c.slug === slug || String(c._id) === String(slug)) || null;
  }, [allCategories]);

  const getProductsByCategory = useCallback((catName) => {
    if (!catName || catName === 'All' || catName === 'All Products') {
      return products;
    }
    return products.filter(p => p.category && p.category.toLowerCase() === catName.toLowerCase());
  }, [products]);

  const contextValue = {
    websiteData,
    config,
    categories,
    allCategories,
    products,
    allProducts,
    loading,
    error,
    version,
    refreshWebsiteData: () => fetchWebsiteData(true),
    refreshConfig: () => fetchWebsiteData(true), // Alias for backward compatibility
    getProductBySlug,
    getCategoryBySlug,
    getProductsByCategory
  };

  return (
    <WebsiteDataContext.Provider value={contextValue}>
      {children}
    </WebsiteDataContext.Provider>
  );
}

export function useWebsiteData() {
  const context = useContext(WebsiteDataContext);
  if (!context) {
    throw new Error('useWebsiteData must be used within a WebsiteDataProvider');
  }
  return context;
}

// Backward compatibility alias for components calling useConfig()
export function useConfig() {
  const context = useContext(WebsiteDataContext);
  if (!context) {
    throw new Error('useConfig must be used within a WebsiteDataProvider');
  }
  return {
    config: context.config,
    loading: context.loading,
    error: context.error,
    refreshConfig: context.refreshConfig
  };
}

