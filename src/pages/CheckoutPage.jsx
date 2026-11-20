import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  Lock,
  Phone,
  User,
  Home,
  MessageSquare
} from 'lucide-react';
import SEOHead from '../components/common/SEOHead';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, validateBDPhone } from '../utils/formatters';
import { metaEvents, captureAttribution } from '../utils/metaPixel';
import api from '../services/api';

export default function CheckoutPage() {
  const { cartItems, subtotal, clearCart } = useCart();
  const { config } = useConfig();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    phoneNumber: '',
    address: '',
    deliveryArea: 'inside_dhaka',
    notes: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [formErrors, setFormErrors] = useState({});

  const currency = config?.siteSettings?.currency || '৳';
  const deliverySettings = config?.deliverySettings || {
    insideDhakaFee: 70,
    outsideDhakaFee: 130
  };

  const deliveryCharge = formData.deliveryArea === 'inside_dhaka'
    ? (deliverySettings.insideDhakaFee ?? 70)
    : (deliverySettings.outsideDhakaFee ?? 130);

  const finalTotal = subtotal + deliveryCharge;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (cartItems.length > 0) {
      metaEvents.initiateCheckout(cartItems, subtotal);
    }
  }, []);

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-brand-light py-20 px-4">
        <div className="max-w-md mx-auto bg-white border border-brand-border p-8 text-center space-y-4">
          <ShoppingBag className="w-12 h-12 text-brand-dark mx-auto stroke-[1.5]" />
          <h2 className="text-xl font-bold text-brand-dark tracking-tight">Your Cart is Empty</h2>
          <p className="text-sm text-brand-muted">
            Please add a product to your cart before proceeding to checkout.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-dark text-white text-xs font-bold uppercase tracking-wider hover:bg-brand-navy transition-colors shadow-xs"
          >
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const validate = () => {
    const errors = {};
    if (!formData.fullName.trim()) {
      errors.fullName = 'Full Name is required';
    }
    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!validateBDPhone(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678)';
    }
    if (!formData.address.trim()) {
      errors.address = 'Full delivery address is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validate()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const attribution = captureAttribution();

      const payload = {
        customer: {
          fullName: formData.fullName.trim(),
          phoneNumber: formData.phoneNumber.trim(),
          district: formData.deliveryArea === 'inside_dhaka' ? 'Dhaka' : 'Outside Dhaka',
          deliveryArea: formData.deliveryArea,
          address: formData.address.trim(),
          notes: formData.notes.trim()
        },
        items: cartItems.map(item => ({
          productId: item.productId || item.slug,
          slug: item.slug || '',
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice
        })),
        attribution
      };

      const res = await api.createOrder(payload);

      if (res && res.success && res.orderId) {
        clearCart();
        navigate(`/order-success/${res.orderId}`);
      } else {
        setErrorMessage(res?.message || 'Failed to place order. Please check your information and try again.');
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Order submission error:', err);
      setErrorMessage(err.response?.data?.message || 'Network error occurred while submitting your order. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light py-8 sm:py-12">
      <SEOHead title="Checkout — Cash on Delivery | Regrow Hair Care BD" />

      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Checkout Form in Exact Requested Order */}
          {/* Order: Full Name -> Phone Number -> Full Address -> Delivery Area (Inside/Outside Dhaka) */}
          <div className="lg:col-span-7 bg-white border border-brand-border p-6 sm:p-8">
            <div className="mb-6 space-y-1 pb-4 border-b border-brand-border">
              <h1 className="text-xl sm:text-2xl font-black text-brand-dark tracking-tight uppercase">
                Checkout & Delivery Information
              </h1>
              <p className="text-xs text-brand-muted">
                Complete your delivery details below. Cash on delivery — pay when you receive your package.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* 1. Customer Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-dark transition-colors ${
                      formErrors.fullName ? 'border-red-400 bg-red-50/20' : 'border-brand-border'
                    }`}
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* 2. Mobile Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Mobile Phone Number (Active) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="017XXXXXXXX"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-dark transition-colors ${
                      formErrors.phoneNumber ? 'border-red-400 bg-red-50/20' : 'border-brand-border'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-brand-muted mt-1">Our delivery rider will call this number before delivery.</p>
                {formErrors.phoneNumber && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.phoneNumber}</p>
                )}
              </div>

              {/* 3. Full Delivery Address (Placed BEFORE Delivery Area Selector as requested) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Full Delivery Address *
                </label>
                <div className="relative">
                  <Home className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <textarea
                    rows={3}
                    required
                    placeholder="House / Flat no, Road no, Area, Thana, District"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-dark transition-colors ${
                      formErrors.address ? 'border-red-400 bg-red-50/20' : 'border-brand-border'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-brand-muted mt-1">Provide your complete street address for accurate doorstep delivery.</p>
                {formErrors.address && (
                  <p className="text-xs text-red-600 mt-1">{formErrors.address}</p>
                )}
              </div>

              {/* 4. Delivery Area Selection (Inside Dhaka / Outside Dhaka) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  Select Delivery Area *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Inside Dhaka */}
                  <label
                    className={`p-4 border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.deliveryArea === 'inside_dhaka'
                        ? 'border-brand-dark bg-gray-50'
                        : 'border-brand-border hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="inside_dhaka"
                      checked={formData.deliveryArea === 'inside_dhaka'}
                      onChange={() => setFormData({ ...formData, deliveryArea: 'inside_dhaka' })}
                      className="mt-1 text-brand-dark focus:ring-brand-dark accent-brand-dark"
                    />
                    <div>
                      <p className="text-sm font-bold text-brand-dark">Inside Dhaka City</p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Delivery Charge: <span className="font-semibold text-brand-dark">{formatCurrency(deliverySettings.insideDhakaFee ?? 70, currency)}</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">1 - 2 Business Days</p>
                    </div>
                  </label>

                  {/* Outside Dhaka */}
                  <label
                    className={`p-4 border cursor-pointer transition-all flex items-start gap-3 ${
                      formData.deliveryArea === 'outside_dhaka'
                        ? 'border-brand-dark bg-gray-50'
                        : 'border-brand-border hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="outside_dhaka"
                      checked={formData.deliveryArea === 'outside_dhaka'}
                      onChange={() => setFormData({ ...formData, deliveryArea: 'outside_dhaka' })}
                      className="mt-1 text-brand-dark focus:ring-brand-dark accent-brand-dark"
                    />
                    <div>
                      <p className="text-sm font-bold text-brand-dark">Outside Dhaka (All Bangladesh)</p>
                      <p className="text-xs text-brand-muted mt-0.5">
                        Delivery Charge: <span className="font-semibold text-brand-dark">{formatCurrency(deliverySettings.outsideDhakaFee ?? 130, currency)}</span>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-semibold mt-1">2 - 4 Business Days</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Special Delivery Instructions (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Order Note (Optional)
                </label>
                <div className="relative">
                  <MessageSquare className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="e.g. Call before delivery, deliver after 4 PM"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-brand-border text-sm text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-dark transition-colors"
                  />
                </div>
              </div>

              {/* Payment Method Notice: COD */}
              <div className="p-4 bg-gray-50 border border-brand-border space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Payment Method: Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">
                  Zero advance payment required. Hand over the exact cash to the delivery courier after you inspect your parcel.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-brand-dark hover:bg-brand-navy text-white font-black text-sm uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
              >
                {isSubmitting ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-white" />
                    <span>Confirm Order ({formatCurrency(finalTotal, currency)})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5 bg-white border border-brand-border p-6 sm:p-7 space-y-5 sticky top-24">
            <h3 className="text-base font-black uppercase tracking-wider text-brand-dark border-b border-brand-border pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-brand-muted font-normal lowercase">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </h3>

            {/* Items Mini List */}
            <div className="divide-y divide-brand-border max-h-72 overflow-y-auto no-scrollbar">
              {cartItems.map((item) => (
                <div key={item.productId || item.slug} className="py-3 flex gap-3 items-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=80'}
                    alt={item.productName}
                    className="w-14 h-14 object-cover border border-brand-border bg-gray-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-brand-dark truncate leading-tight">
                      {item.productName}
                    </h5>
                    <p className="text-[11px] text-brand-muted mt-0.5">
                      Qty: {item.quantity} × {formatCurrency(item.unitPrice, currency)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-brand-dark">
                    {formatCurrency(item.unitPrice * item.quantity, currency)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations Breakdown */}
            <div className="pt-3 border-t border-brand-border space-y-2 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>Subtotal</span>
                <span className="font-semibold text-brand-dark">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Delivery Charge ({formData.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                <span className="font-semibold text-brand-dark">{formatCurrency(deliveryCharge, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-brand-dark pt-3 border-t border-brand-border">
                <span>Total Payable (COD)</span>
                <span>{formatCurrency(finalTotal, currency)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-3 bg-gray-50 border border-brand-border text-[11px] text-brand-dark space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>100% Genuine Kirkland Minoxidil & Derma Rollers</span>
              </div>
              <p className="text-brand-muted leading-tight pl-5">
                Carefully packaged in tamper-evident containers with full hygiene seals.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
