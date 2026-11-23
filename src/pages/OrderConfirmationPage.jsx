import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import {
  CheckCircle,
  Truck,
  MessageCircle,
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
  const confirmationData = config?.orderConfirmation || {};

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Fire Confetti on Mount
    try {
      confetti({
        particleCount: 70,
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
      // Check session storage first for instantaneous offline render
      if (typeof sessionStorage !== 'undefined') {
        const cached = sessionStorage.getItem(`order_${orderId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            setOrder(parsed);
            metaEvents.purchase(parsed);
            setLoading(false);
            return;
          } catch (e) {}
        }
      }

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
        <RefreshCw className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Retrieving order details...</p>
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
        <div className="bg-white border border-brand-border p-6 sm:p-10 space-y-8">
          {/* Success Checkmark & Header */}
          <div className="text-center space-y-2.5 pb-6 border-b border-brand-border">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 stroke-[2]" />
            </div>
            <span className="inline-block text-[11px] font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 border border-emerald-200">
              Order Confirmed Successfully
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight uppercase">
              {confirmationData.heading || 'Thank You For Your Order!'}
            </h1>
            <p className="text-xs sm:text-sm text-brand-muted max-w-lg mx-auto">
              {confirmationData.subheading || 'We have received your order. Our team is dispatching your authentic package via Cash on Delivery.'}
            </p>
          </div>

          {/* Order ID & Reference Banner */}
          <div className="p-4 sm:p-5 bg-brand-dark text-white flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="text-[11px] text-gray-400 uppercase tracking-widest">{confirmationData.orderIdLabel || 'Order Reference Number'}</p>
              <p className="text-lg sm:text-xl font-black text-white tracking-wider font-mono">
                #{orderId}
              </p>
            </div>
            <a
              href={`https://wa.me/${whatsappNum}?text=${whatsappMessage}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white text-brand-dark hover:bg-gray-100 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>{confirmationData.whatsappSupportText || 'Track via WhatsApp'}</span>
            </a>
          </div>

          {/* Delivery & Payment Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-4 border border-brand-border bg-gray-50 flex items-start gap-3">
              <Truck className="w-4 h-4 text-brand-dark mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-brand-dark">Delivery Estimate</p>
                <p className="text-brand-muted mt-0.5">
                  {order?.customer?.deliveryArea === 'inside_dhaka' ? '1 - 2 Business Days' : '2 - 4 Business Days'}
                </p>
              </div>
            </div>

            <div className="p-4 border border-brand-border bg-gray-50 flex items-start gap-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-brand-dark">{confirmationData.paymentMethodLabel || 'Payment Method'}</p>
                <p className="text-brand-muted mt-0.5">{confirmationData.paymentMethodValue || 'Cash on Delivery (COD)'}</p>
              </div>
            </div>

            <div className="p-4 border border-brand-border bg-gray-50 flex items-start gap-3">
              <Clock className="w-4 h-4 text-brand-dark mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold uppercase tracking-wider text-brand-dark">{confirmationData.statusLabel || 'Status'}</p>
                <p className="text-brand-muted mt-0.5">{order?.orderStatus || 'Pending Dispatch'}</p>
              </div>
            </div>
          </div>

          {/* Customer & Address Details */}
          {order && (
            <div className="p-5 border border-brand-border bg-white space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-brand-border pb-2">
                {confirmationData.addressHeading || 'Shipping Details'}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-brand-dark">
                <div>
                  <span className="text-brand-muted block uppercase text-[10px] tracking-wider">Recipient Name:</span>
                  <span className="font-bold">{order.customer?.fullName}</span>
                </div>
                <div>
                  <span className="text-brand-muted block uppercase text-[10px] tracking-wider">Contact Phone:</span>
                  <span className="font-bold">{order.customer?.phoneNumber}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-brand-muted block uppercase text-[10px] tracking-wider">Delivery Address:</span>
                  <span className="font-bold">{order.customer?.address} ({order.customer?.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                </div>
              </div>
            </div>
          )}

          {/* Ordered Products Breakdown */}
          {order && order.items && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold uppercase tracking-wider text-brand-dark border-b border-brand-border pb-2">
                {confirmationData.itemsHeading || 'Ordered Products'}
              </h4>
              <div className="divide-y divide-brand-border">
                {order.items.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-brand-dark">{item.quantity}x</span>
                      <span className="font-medium text-brand-dark uppercase text-xs">{item.productName}</span>
                    </div>
                    <span className="font-bold text-brand-dark">
                      {formatCurrency(item.unitPrice * item.quantity, currency)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Total Summary */}
              <div className="pt-3 border-t border-brand-border space-y-1.5 text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>{confirmationData.subtotalLabel ? `${confirmationData.subtotalLabel}:` : 'Subtotal:'}</span>
                  <span className="font-semibold text-brand-dark">{formatCurrency(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>{confirmationData.deliveryLabel ? `${confirmationData.deliveryLabel}:` : 'Delivery Charge:'}</span>
                  <span className="font-semibold text-brand-dark">{formatCurrency(order.deliveryCharge, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-brand-dark pt-2 border-t border-brand-border uppercase">
                  <span>{confirmationData.totalLabel ? `${confirmationData.totalLabel} (COD):` : 'Payable at Delivery (COD):'}</span>
                  <span>{formatCurrency(order.finalTotal, currency)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Next Steps CTA */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3 border-t border-brand-border">
            <Link
              to="/shop"
              className="w-full sm:w-auto px-6 py-3 bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold uppercase tracking-wider text-center transition-colors shadow-xs"
            >
              {confirmationData.continueShoppingText || 'Continue Shopping'}
            </Link>
            <Link
              to="/"
              className="w-full sm:w-auto px-6 py-3 border border-brand-border hover:border-brand-dark text-brand-dark text-xs font-bold uppercase tracking-wider text-center transition-colors"
            >
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
