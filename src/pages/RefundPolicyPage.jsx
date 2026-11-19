import React from 'react';
import SEOHead from '../components/common/SEOHead';

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-brand-light py-12 sm:py-16">
      <SEOHead title="Return & Refund Policy | Regrow Hair Care BD" />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">Return & Refund Policy</h1>
            <p className="text-xs text-brand-muted">Last updated: November 2026</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-brand-dark">1. 7-Day Replacement Guarantee</h3>
            <p>
              If your received product has a manufacturer defect, transit damage, or if an incorrect package was delivered, you are eligible for an immediate replacement within 7 calendar days of delivery.
            </p>

            <h3 className="text-base font-bold text-brand-dark">2. Conditions for Return</h3>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>Item must be in its original, unopened, and sealed packaging.</li>
              <li>Due to personal hygiene and pharmaceutical safety regulations, opened bottles of Minoxidil solution or used Derma Rollers cannot be returned.</li>
              <li>Proof of purchase (Order ID or invoice) must be provided.</li>
            </ul>

            <h3 className="text-base font-bold text-brand-dark">3. Refund Processing</h3>
            <p>
              Once your returned package is received and verified by our Banani, Dhaka depot, refunds are disbursed via bKash, Nagad, or Bank Transfer within 3 to 5 business days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

