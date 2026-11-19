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
  MapPin,
  User,
  FileText
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
    district: 'Dhaka',
    deliveryArea: 'inside_dhaka',
    address: '',
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
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-brand-border p-8 text-center space-y-4 shadow-sm">
          <ShoppingBag className="w-12 h-12 text-brand-accent mx-auto" />
          <h2 className="text-xl font-bold text-brand-dark">Your Cart is Empty</h2>
          <p className="text-sm text-brand-muted">
            Please select at least one hair restoration product before proceeding to checkout.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark text-white text-xs font-bold shadow hover:bg-brand-navy transition-colors"
          >
            <span>Browse Products</span>
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
    if (!formData.district.trim()) {
      errors.district = 'District or City is required';
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
          district: formData.district.trim(),
          deliveryArea: formData.deliveryArea,
          address: formData.address.trim(),
          notes: formData.notes.trim()
        },
        items: cartItems.map(item => ({
          productId: item.productId || item.slug,
          slug: item.slug,
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

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <div className="mb-6">
          <Link to="/shop" className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-muted hover:text-brand-dark transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Mobile-First Checkout Form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs">
            <div className="mb-6 space-y-1">
              <h1 className="text-2xl font-extrabold text-brand-dark">
                Delivery & Order Information
              </h1>
              <p className="text-xs text-brand-muted">
                Complete your details below. You will pay in cash upon receiving the parcel.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Customer Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Tanvir Ahmed"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 ${
                      formErrors.fullName ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-brand-accent'
                    }`}
                  />
                </div>
                {formErrors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Mobile Phone Number (Active) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 01712345678"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 ${
                      formErrors.phoneNumber ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-brand-accent'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-brand-muted mt-1">Our delivery agent will call this number before arrival.</p>
                {formErrors.phoneNumber && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.phoneNumber}</p>
                )}
              </div>

              {/* Delivery Area Radio Selection */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-2">
                  Select Delivery Area *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Inside Dhaka */}
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      formData.deliveryArea === 'inside_dhaka'
                        ? 'border-brand-accent bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="inside_dhaka"
                      checked={formData.deliveryArea === 'inside_dhaka'}
                      onChange={() => setFormData({ ...formData, deliveryArea: 'inside_dhaka', district: 'Dhaka' })}
                      className="mt-1 text-brand-accent focus:ring-brand-accent"
                    />
                    <div>
                      <p className="text-sm font-bold text-brand-dark">Inside Dhaka City</p>
                      <p className="text-xs text-brand-muted">Delivery Charge: {formatCurrency(deliverySettings.insideDhakaFee ?? 70, currency)}</p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Estimated 1-2 Days</p>
                    </div>
                  </label>

                  {/* Outside Dhaka */}
                  <label
                    className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                      formData.deliveryArea === 'outside_dhaka'
                        ? 'border-brand-accent bg-blue-50/50 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="deliveryArea"
                      value="outside_dhaka"
                      checked={formData.deliveryArea === 'outside_dhaka'}
                      onChange={() => setFormData({ ...formData, deliveryArea: 'outside_dhaka', district: '' })}
                      className="mt-1 text-brand-accent focus:ring-brand-accent"
                    />
                    <div>
                      <p className="text-sm font-bold text-brand-dark">Outside Dhaka (All BD)</p>
                      <p className="text-xs text-brand-muted">Delivery Charge: {formatCurrency(deliverySettings.outsideDhakaFee ?? 130, currency)}</p>
                      <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Estimated 2-4 Days</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* District / City */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  District / City *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dhaka, Chittagong, Sylhet, Rajshahi..."
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 ${
                      formErrors.district ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-brand-accent'
                    }`}
                  />
                </div>
                {formErrors.district && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.district}</p>
                )}
              </div>

              {/* Detailed Delivery Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Full Delivery Address (House, Road, Area) *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. House #14, Road #5, Block C, Banani, Dhaka"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 ${
                    formErrors.address ? 'border-red-400 bg-red-50/30' : 'border-gray-200 focus:border-brand-accent'
                  }`}
                />
                {formErrors.address && (
                  <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                )}
              </div>

              {/* Special Delivery Instructions (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-brand-dark mb-1.5">
                  Special Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Deliver after 3 PM or call before arrival"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
                />
              </div>

              {/* Payment Method Notice: COD */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-dark">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Payment Method: Cash on Delivery (COD)</span>
                </div>
                <p className="text-xs text-brand-muted leading-relaxed">
                  You don't need to pay anything right now. Hand over the exact amount to the delivery rider once you receive and inspect your package.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 px-6 bg-brand-dark hover:bg-brand-navy text-white font-extrabold text-base rounded-xl shadow-xl shadow-brand-dark/25 hover:shadow-brand-dark/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Securing Order...</span>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>Confirm Order ({formatCurrency(finalTotal, currency)})</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Order Summary Card */}
          <div className="lg:col-span-5 bg-white rounded-3xl border border-brand-border p-6 sm:p-7 shadow-xs space-y-5 sticky top-24">
            <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs text-brand-muted font-normal">
                {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
              </span>
            </h3>

            {/* Items Mini List */}
            <div className="divide-y divide-gray-100 max-h-72 overflow-y-auto no-scrollbar">
              {cartItems.map((item) => (
                <div key={item.productId || item.slug} className="py-3 flex gap-3 items-center">
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100&auto=format&fit=crop&q=80'}
                    alt={item.productName}
                    className="w-12 h-12 rounded-lg object-cover border border-gray-200 bg-gray-50 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-bold text-brand-dark truncate leading-tight">
                      {item.productName}
                    </h5>
                    <p className="text-[11px] text-brand-muted">
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
            <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
              <div className="flex justify-between text-brand-muted">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-brand-text">{formatCurrency(subtotal, currency)}</span>
              </div>
              <div className="flex justify-between text-brand-muted">
                <span>Delivery Charge ({formData.deliveryArea === 'inside_dhaka' ? 'Inside Dhaka' : 'Outside Dhaka'})</span>
                <span className="font-semibold text-brand-text">{formatCurrency(deliveryCharge, currency)}</span>
              </div>
              <div className="flex justify-between text-base font-black text-brand-dark pt-3 border-t border-gray-200">
                <span>Final Payable (COD)</span>
                <span className="text-brand-accent">{formatCurrency(finalTotal, currency)}</span>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Zero Advance Payment Required</span>
              </div>
              <p className="text-emerald-700 leading-tight pl-5">
                Inspect your parcel when delivered and hand over cash to the courier.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
