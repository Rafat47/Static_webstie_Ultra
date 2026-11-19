import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Zap, Check, AlertCircle } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency, calculateDiscount } from '../../utils/formatters';

export default function ProductCard({ product }) {
  const { addToCart, buyNow } = useCart();
  const { config } = useConfig();
  const navigate = useNavigate();

  if (!product) return null;

  const currency = config?.siteSettings?.currency || '৳';
  const discountPercent = calculateDiscount(product.regularPrice, product.salePrice);
  const isOutOfStock = product.stock <= 0;

  const handleBuyNow = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      buyNow(product, 1, navigate);
    }
  };

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product, 1);
    }
  };

  return (
    <div className="group relative bg-white rounded-xl border border-brand-border/80 shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col h-full overflow-hidden">
      {/* Product Image Link */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-gray-50">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {discountPercent > 0 && (
            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">
              -{discountPercent}% OFF
            </span>
          )}
          {product.badge && (
            <span className="bg-brand-navy/90 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-sm border border-white/20">
              {product.badge}
            </span>
          )}
        </div>

        {/* Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-white text-brand-dark font-bold text-xs uppercase px-3 py-1 rounded shadow">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Details */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Stock Indicator */}
          <div className="flex items-center justify-between text-xs text-brand-muted mb-1.5">
            <span className="font-medium text-brand-accent uppercase tracking-wider text-[11px]">
              {product.category}
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              {!isOutOfStock ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-emerald-700 font-medium">In Stock</span>
                </>
              ) : (
                <span className="text-red-500 font-medium">Sold Out</span>
              )}
            </span>
          </div>

          {/* Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-brand-text text-sm sm:text-base group-hover:text-brand-accent transition-colors line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          {product.shortDescription && (
            <p className="text-xs text-brand-muted mt-1.5 line-clamp-2 leading-relaxed">
              {product.shortDescription}
            </p>
          )}
        </div>

        {/* Pricing & CTA Actions */}
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-lg sm:text-xl font-extrabold text-brand-text">
              {formatCurrency(product.salePrice, currency)}
            </span>
            {product.regularPrice > product.salePrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.regularPrice, currency)}
              </span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="py-2 px-2.5 rounded-lg border border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white transition-all text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Add Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="py-2 px-2.5 rounded-lg bg-brand-dark hover:bg-brand-navy text-white transition-all text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:shadow disabled:opacity-40 disabled:pointer-events-none"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span>Buy Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
