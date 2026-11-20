import React from 'react';
import { WebsiteDataProvider, useWebsiteData, useConfig as useConfigBase } from './WebsiteDataContext';

export function ConfigProvider({ children }) {
  return <WebsiteDataProvider>{children}</WebsiteDataProvider>;
}

export function useConfig() {
  return useConfigBase();
}

export { WebsiteDataProvider, useWebsiteData };
export default ConfigProvider;
