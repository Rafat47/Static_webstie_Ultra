import React from 'react';
import SEOHead from '../components/common/SEOHead';
import { useConfig } from '../context/ConfigContext';

export default function PrivacyPolicyPage() {
  const { config } = useConfig();
  const policy = config?.policies?.privacy || {};
  const sections = policy.sections || [];

  return (
    <div className="min-h-screen bg-brand-light py-12 sm:py-16">
      <SEOHead title={`${policy.title || 'Privacy Policy'} | Regrow Hair Care BD`} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">{policy.title || 'Privacy Policy'}</h1>
            <p className="text-xs text-brand-muted">Last updated: {policy.lastUpdated || 'November 2026'}</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-brand-dark">{sections[0]?.heading || '1. Information We Collect'}</h3>
            <p>
              {sections[0]?.body || 'When placing an order on Regrow Hair Care BD, we collect essential fulfillment information: your name, contact phone number, delivery address, and order history.'}
            </p>

            <h3 className="text-base font-bold text-brand-dark">{sections[1]?.heading || '2. Advertising & Attribution'}</h3>
            <p>
              {sections[1]?.body || 'We use Facebook Meta Pixel and Conversions API (CAPI) to analyze advertisement effectiveness and deliver relevant product recommendations. Any customer identifiers transmitted are cryptographically hashed (SHA-256) prior to processing.'}
            </p>

            <h3 className="text-base font-bold text-brand-dark">{sections[2]?.heading || '3. Data Protection'}</h3>
            <p>
              {sections[2]?.body || 'We do not sell, rent, or trade your personal information to third parties. Customer details are strictly utilized for delivery dispatch and post-purchase customer support.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
