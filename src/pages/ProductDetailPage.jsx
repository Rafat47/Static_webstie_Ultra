import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  ArrowRight,
  Package,
  Layers,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/common/ProductCard';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useConfig } from '../context/ConfigContext';
import { formatCurrency, calculateDiscount } from '../utils/formatters';
import { metaEvents } from '../utils/metaPixel';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  const { config } = useConfig();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const currency = config?.siteSettings?.currency || '৳';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setSelectedImageIndex(0);
    loadProductDetail();
  }, [slug]);

  const loadProductDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getProductBySlug(slug);
      if (res && res.success && res.data) {
        setProduct(res.data);
        // Fire Meta ViewContent event
        metaEvents.viewContent(res.data);

        // Fetch related products from same category
        try {
          const relRes = await api.getProducts({ category: res.data.category });
          if (relRes && relRes.success && relRes.data) {
            setRelatedProducts(relRes.data.filter(p => p.slug !== slug).slice(0, 4));
          }
        } catch (e) {
          // Non-blocking
        }
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error('Failed to load product detail:', err);
      setError('Unable to load product information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-light flex flex-col items-center justify-center space-y-4 py-20">
        <RefreshCw className="w-10 h-10 text-brand-accent animate-spin" />
        <p className="text-sm font-semibold text-brand-muted">Loading product specifications...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-brand-light py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-brand-border p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-brand-dark">Product Not Found</h2>
          <p className="text-sm text-brand-muted">
            The requested product is currently unavailable or may have been updated.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-dark text-white text-xs font-bold shadow hover:bg-brand-navy transition-colors"
          >
            <span>Return to Shop</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'];

  const discountPercent = calculateDiscount(product.regularPrice, product.salePrice);
  const isOutOfStock = product.stock <= 0;
  const isCombo = product.productType === 'combo' || (product.comboItems && product.comboItems.length > 0);

  const handleAddToCart = () => {
    if (!isOutOfStock) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (!isOutOfStock) {
      buyNow(product, quantity, navigate);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light py-8 sm:py-12">
      <SEOHead
        title={`${product.name} | Regrow Hair Care BD`}
        description={product.shortDescription || product.description}
        image={images[0]}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-brand-muted mb-6">
          <Link to="/" className="hover:text-brand-dark transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-brand-dark transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-brand-dark transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-brand-dark font-medium truncate max-w-xs">{product.name}</span>
        </nav>

        {/* Main Product Section */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs mb-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Left Column: Image Gallery */}
            <div className="lg:col-span-6 space-y-4">
              {/* Main Image Stage */}
              <div className="relative aspect-square rounded-2xl overflow-hidden border border-brand-border bg-gray-50 shadow-inner group">
                <img
                  src={images[selectedImageIndex] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Floating Discount & Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10">
                  {discountPercent > 0 && (
                    <span className="bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-md shadow">
                      SAVE {discountPercent}%
                    </span>
                  )}
                  {product.badge && (
                    <span className="bg-brand-dark/90 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-md shadow border border-white/20">
                      {product.badge}
                    </span>
                  )}
                </div>

                {/* Authenticity Watermark Badge */}
                <div className="absolute bottom-4 right-4 bg-brand-dark/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-white text-[11px] font-semibold flex items-center gap-1.5 border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Genuine Imported</span>
                </div>
              </div>

              {/* Multi-Image Thumbnails */}
              {images.length > 1 && (
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                        selectedImageIndex === idx
                          ? 'border-brand-accent shadow-md scale-102'
                          : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Pricing, Specs, Controls & Purchase */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Category & Stock Status */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-accent px-2.5 py-1 rounded-md bg-blue-50">
                    {product.category}
                  </span>
                  <div className="flex items-center gap-1.5 text-xs font-semibold">
                    {!isOutOfStock ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-700">In Stock ({product.stock} units available)</span>
                      </>
                    ) : (
                      <span className="text-red-500">Currently Sold Out</span>
                    )}
                  </div>
                </div>

                {/* Product Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-dark leading-snug">
                  {product.name}
                </h1>

                {/* Short Description */}
                {product.shortDescription && (
                  <p className="text-sm text-brand-muted leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}

                {/* Price Display */}
                <div className="p-4 rounded-xl bg-gray-50 border border-brand-border/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-brand-muted font-medium">Special Offer Price</span>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black text-brand-dark">
                        {formatCurrency(product.salePrice, currency)}
                      </span>
                      {product.regularPrice > product.salePrice && (
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(product.regularPrice, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                  {product.regularPrice > product.salePrice && (
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                        You Save {formatCurrency(product.regularPrice - product.salePrice, currency)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Combo Items Included (if applicable) */}
                {isCombo && product.comboItems && product.comboItems.length > 0 && (
                  <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/60 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-navy">
                      <Layers className="w-4 h-4 text-brand-accent" />
                      <span>This Combo Package Includes:</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-gray-700">
                      {product.comboItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span>
                            <strong>{item.quantity}x {item.name}</strong>
                            {item.description && ` — ${item.description}`}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quantity Controls & Action Buttons */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      Quantity:
                    </span>
                    <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-xs">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1 || isOutOfStock}
                        className="p-2 text-gray-600 hover:text-brand-dark disabled:opacity-30"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm font-bold text-brand-text">
                        {quantity}
                      </span>
                      <button
                        onClick={() => setQuantity(Math.min(product.stock > 0 ? product.stock : 99, quantity + 1))}
                        disabled={isOutOfStock}
                        className="p-2 text-gray-600 hover:text-brand-dark disabled:opacity-30"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dual CTA: Add to Cart & Buy Now */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock}
                      className="py-3.5 px-4 rounded-xl border-2 border-brand-accent text-brand-accent hover:bg-brand-accent hover:text-white font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Cart</span>
                    </button>

                    <button
                      onClick={handleBuyNow}
                      disabled={isOutOfStock}
                      className="py-3.5 px-4 rounded-xl bg-brand-dark hover:bg-brand-navy text-white font-extrabold text-sm shadow-lg shadow-brand-dark/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40"
                    >
                      <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
                      <span>Order Cash on Delivery</span>
                    </button>
                  </div>
                </div>

                {/* Delivery & Guarantee Badges */}
                <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-brand-muted">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span>Cash on Delivery across BD</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-brand-accent flex-shrink-0" />
                    <span>24-48 Hours Express Dhaka</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs / Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Left Column: Full Description & Benefits */}
          <div className="lg:col-span-8 space-y-6">
            {/* Detailed Description */}
            <div className="bg-white rounded-2xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-4">
              <h3 className="text-lg font-bold text-brand-dark border-b border-gray-100 pb-3">
                Product Overview & Clinical Action
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {product.description || product.shortDescription}
              </p>

              {/* Key Benefits */}
              {product.keyBenefits && product.keyBenefits.length > 0 && (
                <div className="pt-4 space-y-3">
                  <h4 className="text-sm font-bold text-brand-dark">Key Highlights:</h4>
                  <ul className="space-y-2">
                    {product.keyBenefits.map((benefit, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Specifications Table */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-brand-border p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-brand-dark border-b border-gray-100 pb-3">
                Technical Specifications
              </h3>
              <div className="divide-y divide-gray-100 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-brand-muted">Category</span>
                  <span className="font-semibold text-brand-text">{product.category}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-brand-muted">Authenticity</span>
                  <span className="font-semibold text-emerald-700">100% Genuine</span>
                </div>
                {product.specifications && product.specifications.map((spec, idx) => (
                  <div key={idx} className="py-2.5 flex justify-between">
                    <span className="text-brand-muted">{spec.label}</span>
                    <span className="font-semibold text-brand-text text-right max-w-[60%]">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-extrabold text-brand-dark">
                Frequently Bought Together
              </h3>
              <p className="text-xs text-brand-muted">Complement your hair restoration routine with these packages.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((rel) => (
                <ProductCard key={rel._id || rel.slug} product={rel} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
