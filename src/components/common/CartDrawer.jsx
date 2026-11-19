import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency } from '../../utils/formatters';

export default function CartDrawer() {
  const { cartItems, isCartOpen, setIsCartOpen, updateQuantity, removeFromCart, subtotal, totalItemsCount } = useCart();
  const { config } = useConfig();
  const navigate = useNavigate();

  const currency = config?.siteSettings?.currency || '৳';
  const insideDhaka = config?.deliverySettings?.insideDhakaFee ?? 70;

  if (!isCartOpen) return null;

  const handleCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-brand-dark/70 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-brand-dark text-white flex items-center justify-between border-b border-white/10">
            <div className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5 text-brand-accent" />
              <h2 className="text-lg font-bold">Shopping Cart ({totalItemsCount})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-gray-100">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-brand-accent">
                  <ShoppingBag className="w-8 h-8 opacity-60" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-brand-text">Your cart is currently empty</h3>
                  <p className="text-sm text-brand-muted mt-1">Explore our Minoxidil & Derma Roller solutions to kickstart your routine.</p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="mt-2 px-5 py-2.5 bg-brand-accent hover:bg-blue-600 text-white font-medium rounded-lg text-sm shadow transition-colors"
                >
                  Browse Products
                </button>
              </div>
            ) : (
              cartItems.map((item) => (
                <div key={item.productId || item.slug} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <img
                    src={item.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'}
                    alt={item.productName}
                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg border border-brand-border bg-gray-50 flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-brand-text truncate leading-tight">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-brand-muted mt-0.5">
                      Unit: {formatCurrency(item.unitPrice, currency)}
                    </p>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.productId || item.slug, -1)}
                          disabled={item.quantity <= 1}
                          className="p-1 sm:p-1.5 text-gray-500 hover:text-brand-dark disabled:opacity-30 disabled:hover:text-gray-500"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 text-xs font-semibold text-brand-text">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId || item.slug, 1)}
                          className="p-1 sm:p-1.5 text-gray-500 hover:text-brand-dark"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-bold text-brand-text">
                          {formatCurrency(item.unitPrice * item.quantity, currency)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId || item.slug)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bottom Summary & Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 bg-gray-50 border-t border-gray-200 space-y-3">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-brand-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-text">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-brand-muted text-xs">
                  <span>Estimated Delivery (Inside Dhaka)</span>
                  <span>{formatCurrency(insideDhaka, currency)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-brand-text pt-2 border-t border-gray-200">
                  <span>Estimated Total</span>
                  <span className="text-brand-accent">{formatCurrency(subtotal + insideDhaka, currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Cash on Delivery: Pay after receiving your package!</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3 px-4 bg-brand-dark hover:bg-brand-navy text-white font-bold rounded-lg text-sm shadow-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:shadow-brand-dark/20"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full text-center text-xs text-brand-muted hover:text-brand-text py-1"
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

