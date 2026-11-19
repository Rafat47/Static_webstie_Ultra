import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';
import { formatCurrency, calculateDiscount } from '../../utils/formatters';

export default function ProductCard({ product }) {
  const { addToCart, buyNow } = useCart();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [isWishlisted, setIsWishlisted] = useState(false);

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

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
  };

  return (
    <div className="group relative bg-white rounded-lg border border-gray-200 hover:border-black transition-all duration-200 flex flex-col h-full overflow-hidden shadow-2xs hover:shadow-subtle">
      {/* Product Image Stage */}
      <Link to={`/product/${product.slug}`} className="relative block aspect-square bg-gray-50 overflow-hidden">
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          loading="lazy"
          className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {discountPercent > 0 && (
            <span className="bg-black text-white text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded shadow-xs">
              {discountPercent}% off
            </span>
          )}
          {product.badge && (
            <span className="bg-gray-800 text-white text-[9px] font-semibold px-1.5 py-0.5 rounded">
              {product.badge}
            </span>
          )}
        </div>

        {/* Wishlist Heart Icon */}
        <button
          onClick={handleWishlistToggle}
          title="Save to Wishlist"
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-700 hover:text-red-500 transition-colors shadow-xs z-10"
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-black text-white font-bold text-[10px] uppercase px-2.5 py-1 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Product Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category / Brand label */}
          <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
            {product.category}
          </p>

          {/* Product Title */}
          <Link to={`/product/${product.slug}`} className="block">
            <h3 className="font-bold text-xs sm:text-sm text-gray-900 group-hover:text-black line-clamp-2 leading-snug">
              {product.name}
            </h3>
          </Link>
        </div>

        {/* Price & Actions */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 space-y-2.5">
          {/* Price line */}
          <div className="flex items-baseline gap-2">
            <span className="text-sm sm:text-base font-extrabold text-gray-900">
              {formatCurrency(product.salePrice, currency)}
            </span>
            {product.regularPrice > product.salePrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatCurrency(product.regularPrice, currency)}
              </span>
            )}
            {discountPercent > 0 && (
              <span className="text-[11px] font-bold text-red-600 ml-auto">
                {discountPercent}% off
              </span>
            )}
          </div>

          {/* Buttons: Add to Cart and Buy Now */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="py-1.5 sm:py-2 px-2 rounded border border-gray-300 hover:border-black text-gray-900 text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1 transition-colors disabled:opacity-40"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Cart</span>
              <span className="sm:hidden">Cart</span>
            </button>

            <button
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="py-1.5 sm:py-2 px-2 rounded bg-black hover:bg-gray-800 text-white text-[11px] sm:text-xs font-extrabold flex items-center justify-center gap-1 transition-colors disabled:opacity-40 shadow-xs"
            >
              <span>Buy Now</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
