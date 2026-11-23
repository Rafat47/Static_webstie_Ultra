import React from 'react';
import SEOHead from '../components/common/SEOHead';
import { useConfig } from '../context/ConfigContext';

export default function TermsPage() {
  const { config } = useConfig();
  const policy = config?.policies?.terms || {};
  const sections = policy.sections || [];

  return (
    <div className="min-h-screen bg-brand-light py-12 sm:py-16">
      <SEOHead title={`${policy.title || 'Terms & Conditions'} | Regrow Hair Care BD`} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">{policy.title || 'Terms & Conditions'}</h1>
            <p className="text-xs text-brand-muted">Last updated: {policy.lastUpdated || 'November 2026'}</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-brand-dark">{sections[0]?.heading || '1. General Information & Health Disclaimer'}</h3>
            <p>
              {sections[0]?.body || 'Content presented on this website is for educational and product selection purposes only. It is not intended as a substitute for professional dermatological or medical diagnosis. Individual biological response to topical Minoxidil varies.'}
            </p>

            <h3 className="text-base font-bold text-brand-dark">{sections[1]?.heading || '2. Order Acceptance & Pricing'}</h3>
            <p>
              {sections[1]?.body || 'All orders are subject to stock availability and address verification. We reserve the right to cancel or decline orders with invalid contact numbers or fraudulent information.'}
            </p>

            <h3 className="text-base font-bold text-brand-dark">{sections[2]?.heading || '3. Intellectual Property'}</h3>
            <p>
              {sections[2]?.body || 'Product trademarks (e.g. Kirkland Signature) belong to their respective registered brand owners. Regrow Hair Care BD operates as an authentic importer and reseller in Bangladesh.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
