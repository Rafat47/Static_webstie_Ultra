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
        className="absolute inset-0 bg-black/60 transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-white text-brand-dark flex items-center justify-between border-b border-brand-border">
            <div className="flex items-center space-x-2.5">
              <ShoppingBag className="w-5 h-5 text-brand-dark stroke-[2]" />
              <h2 className="text-base font-black tracking-wide uppercase">Shopping Cart ({totalItemsCount})</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 text-gray-400 hover:text-brand-dark transition-colors"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-brand-border no-scrollbar">
            {cartItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 border border-brand-border flex items-center justify-center text-brand-dark">
                  <ShoppingBag className="w-8 h-8 stroke-[1.5]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-brand-dark">Your cart is currently empty</h3>
                  <p className="text-xs text-brand-muted mt-1 max-w-xs">
                    Browse our authentic Minoxidil and Derma Roller products to begin your hair restoration journey.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="mt-2 px-6 py-3 bg-brand-dark hover:bg-black text-white text-xs font-black uppercase tracking-wider transition-colors"
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
                    className="w-20 h-20 object-cover border border-brand-border bg-gray-50 flex-shrink-0"
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-brand-dark truncate leading-snug uppercase">
                      {item.productName}
                    </h4>
                    <p className="text-xs text-brand-muted mt-0.5">
                      {formatCurrency(item.unitPrice, currency)}
                    </p>

                    {/* Quantity Controls & Delete */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center border border-brand-border">
                        <button
                          onClick={() => updateQuantity(item.productId || item.slug, -1)}
                          disabled={item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center text-brand-dark hover:bg-gray-100 disabled:opacity-30"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-brand-dark">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.productId || item.slug, 1)}
                          className="w-7 h-7 flex items-center justify-center text-brand-dark hover:bg-gray-100"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="text-xs font-black text-brand-dark">
                          {formatCurrency(item.unitPrice * item.quantity, currency)}
                        </span>
                        <button
                          onClick={() => removeFromCart(item.productId || item.slug)}
                          className="text-gray-400 hover:text-brand-red transition-colors p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
            <div className="p-4 sm:p-5 bg-white border-t border-brand-border space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-brand-muted">
                  <span>Subtotal</span>
                  <span className="font-semibold text-brand-dark">{formatCurrency(subtotal, currency)}</span>
                </div>
                <div className="flex justify-between text-brand-muted">
                  <span>Estimated Delivery (Inside Dhaka)</span>
                  <span className="font-semibold text-brand-dark">{formatCurrency(insideDhaka, currency)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-brand-dark pt-2 border-t border-brand-border">
                  <span className="uppercase">Estimated Total</span>
                  <span>{formatCurrency(subtotal + insideDhaka, currency)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-brand-dark bg-gray-50 p-2 border border-brand-border">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span>Cash on Delivery: Inspect and pay at your doorstep!</span>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 px-4 bg-brand-dark hover:bg-black text-white font-black text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-colors"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsCartOpen(false)}
                className="w-full text-center text-xs text-brand-muted hover:text-brand-dark py-1 underline font-medium"
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
