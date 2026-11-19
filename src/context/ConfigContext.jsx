import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { initMetaPixel, captureAttribution } from '../utils/metaPixel';

const ConfigContext = createContext(null);

export function ConfigProvider({ children }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getSiteConfig();
      if (res && res.success && res.data) {
        setConfig(res.data);

        // Initialize Meta Pixel if configured
        if (res.data.metaSettings?.pixelId && res.data.metaSettings?.isPixelEnabled !== false) {
          initMetaPixel(res.data.metaSettings.pixelId);
        }
      }
    } catch (err) {
      console.warn('Failed to load site config:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Capture any Facebook attribution or UTM tags immediately
    captureAttribution();
    fetchConfig();
  }, [fetchConfig]);

  return (
    <ConfigContext.Provider value={{ config, loading, error, refreshConfig: fetchConfig }}>
      {children}
    </ConfigContext.Provider>
  );
}

export function useConfig() {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

