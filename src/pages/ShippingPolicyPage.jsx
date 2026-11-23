import React from 'react';
import SEOHead from '../components/common/SEOHead';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency } from '../utils/formatters';

export default function ShippingPolicyPage() {
  const { config } = useConfig();
  const delivery = config?.deliverySettings || { insideDhakaFee: 70, outsideDhakaFee: 130 };
  const currency = config?.siteSettings?.currency || '৳';
  const policy = config?.policies?.shipping || {};
  const sections = policy.sections || [];

  return (
    <div className="min-h-screen bg-brand-light py-12 sm:py-16">
      <SEOHead title={`${policy.title || 'Shipping & Delivery Policy'} | Regrow Hair Care BD`} />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-xs space-y-6">
          <div className="space-y-2 border-b border-gray-100 pb-4">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark">{policy.title || 'Shipping & Delivery Policy'}</h1>
            <p className="text-xs text-brand-muted">Last updated: {policy.lastUpdated || 'November 2026'}</p>
          </div>

          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <h3 className="text-base font-bold text-brand-dark">{sections[0]?.heading || '1. Nationwide Cash on Delivery (COD)'}</h3>
            <p>
              {sections[0]?.body || 'We provide dependable Cash on Delivery services to all 64 districts in Bangladesh. You pay only upon receipt of your parcel.'}
            </p>

            <h3 className="text-base font-bold text-brand-dark">{sections[1]?.heading || '2. Delivery Timeframes & Charges'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-xs font-bold text-brand-accent uppercase">{sections[1]?.cards?.[0]?.area || 'Inside Dhaka City'}</span>
                <p className="text-base font-extrabold text-brand-dark">Delivery Charge: {formatCurrency(delivery.insideDhakaFee ?? sections[1]?.cards?.[0]?.fee ?? 70, currency)}</p>
                <p className="text-xs text-brand-muted">{sections[1]?.cards?.[0]?.timeline || 'Timeline: 24 to 48 Hours'}</p>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-1">
                <span className="text-xs font-bold text-brand-accent uppercase">{sections[1]?.cards?.[1]?.area || 'Outside Dhaka (All BD)'}</span>
                <p className="text-base font-extrabold text-brand-dark">Delivery Charge: {formatCurrency(delivery.outsideDhakaFee ?? sections[1]?.cards?.[1]?.fee ?? 130, currency)}</p>
                <p className="text-xs text-brand-muted">{sections[1]?.cards?.[1]?.timeline || 'Timeline: 2 to 4 Business Days'}</p>
              </div>
            </div>

            <h3 className="text-base font-bold text-brand-dark pt-3">{sections[2]?.heading || '3. Parcel Inspection'}</h3>
            <p>
              {sections[2]?.body || 'Customers are encouraged to visually inspect the external packaging before completing payment with the delivery courier. If the parcel appears damaged or tampered with, please reject it immediately and contact our customer helpline.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
