import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Truck,
  Phone,
  MessageCircle,
  ArrowRight,
  Package,
  Calendar,
  MapPin,
  Clock,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import SEOHead from '../components/common/SEOHead';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import { metaEvents } from '../utils/metaPixel';

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const { config } = useConfig();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const currency = config?.siteSettings?.currency || '৳';
  const whatsappNum = config?.siteSettings?.whatsappNumber?.replace(/[^0-9]/g, '') || '8801711234567';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fire Confetti on Mount
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // Non-blocking
    }

    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await api.getOrderById(orderId);
      if (res && res.success && res.data) {
        setOrder(res.data);
        // Fire Meta Purchase Event only once after successful order creation
        metaEvents.purchase(res.data);
      }
    } catch (err) {
      console.warn('Failed to load order confirmation:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center space-y-4 py-20">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Retrieving order confirmation...</p>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hello Regrow Hair Care BD, I just placed order #${orderId}. Please confirm my order details.`
  );

  return (
    <div className="min-h-screen bg-brand-light py-10 sm:py-16">
      <SEOHead title={`Order Confirmed #${orderId} | Regrow Hair Care BD`} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-10 shadow-sm space-y-8 text-center sm:text-left">
          {/* Success Checkmark & Header */}
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-9 h-9 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Order Confirmed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark">
              Thank You For Your Order!
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted max-w-lg mx-auto">
              We have received your order. Our fulfillment team is preparing your package for Cash on Delivery shipment.
            </p>
          </div>

          {/* Order ID & Reference Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-brand-navy text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-[11px] text-gray-300 uppercase tracking-widest">Your Unique Order Reference</p>
              <p className="text-xl sm:text-2xl font-black text-brand-accent tracking-wider font-mono">
                {orderId}
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappNum}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Track via WhatsApp</span>
            </a>
          </div>

          {/* Delivery & Payment Timeline Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <Truck className="w-4 h-4 text-brand-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-dark">Delivery Estimate</p>
                <p className="text-brand-muted mt-0.5">
                  {order?.customer?.deliveryArea === 'inside_dhaka' ? '1 - 2 Business Days' : '2 - 4 Business Days'}
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-dark">Payment Method</p>
                <p className="text-brand-muted mt-0.5">Cash on Delivery (COD)</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-brand-dark">Order Status</p>
                <p className="text-brand-muted mt-0.5">{order?.orderStatus || 'Pending Dispatch'}</p>
              </div>
            </div>
          </div>

          {/* Customer & Address Details */}
          {order && (
            <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50/70 space-y-3 text-xs">
              <h4 className="font-bold text-sm text-brand-dark border-b border-gray-200 pb-2">
                Shipping Destination Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-700">
                <div>
                  <span className="text-brand-muted block">Recipient Name:</span>
                  <span className="font-semibold text-brand-dark">{order.customer?.fullName}</span>
                </div>
                <div>
                  <span className="text-brand-muted block">Contact Phone:</span>
                  <span className="font-semibold text-brand-dark">{order.customer?.phoneNumber}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-brand-muted block">Delivery Address:</span>
                  <span className="font-semibold text-brand-dark">{order.customer?.address}, {order.customer?.district}</span>
                </div>
              </div>
            </div>
          )}

          {/* Ordered Products Breakdown */}
          {order && order.items && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-sm text-brand-dark border-b border-gray-100 pb-2">
                Ordered Products
              </h4>
              <div className="divide-y divide-gray-100">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-accent">{item.quantity}x</span>
                      <span className="font-medium text-brand-dark">{item.productName}</span>
                    </div>
                    <span className="font-bold text-brand-dark">
                      {formatCurrency(item.unitPrice * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-gray-200 space-y-1.5 text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Delivery Charge:</span>
                  <span>{formatCurrency(order.deliveryCharge, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-brand-dark pt-2 border-t border-gray-200">
                  <span>Payable at Delivery (COD):</span>
                  <span className="text-brand-accent">{formatCurrency(order.finalTotal, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow text-center transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-text text-xs font-bold text-center transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

