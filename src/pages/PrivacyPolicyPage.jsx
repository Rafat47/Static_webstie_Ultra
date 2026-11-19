import React from 'react';
import SEOHead from '../components/common/SEOHead';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-light py-12 sm:py-16">
      <SEOHead title="Privacy Policy | Regrow Hair Care BD" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">Privacy Policy</h1>
            <p className="text-xs text-brand-muted">Last updated: November 2026</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-brand-dark">1. Information We Collect</h3>
            <p>
              When placing an order on Regrow Hair Care BD, we collect essential fulfillment information: your name, contact phone number, delivery address, and order history.
            </p>

            <h3 className="text-base font-bold text-brand-dark">2. Advertising & Attribution</h3>
            <p>
              We use Facebook Meta Pixel and Conversions API (CAPI) to analyze advertisement effectiveness and deliver relevant product recommendations. Any customer identifiers transmitted are cryptographically hashed (SHA-256) prior to processing.
            </p>

            <h3 className="text-base font-bold text-brand-dark">3. Data Protection</h3>
            <p>
              We do not sell, rent, or trade your personal information to third parties. Customer details are strictly utilized for delivery dispatch and post-purchase customer support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
