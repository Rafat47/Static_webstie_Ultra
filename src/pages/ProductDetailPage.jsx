import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  ShoppingBag,
  ArrowRight,
  Heart,
  Share2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  Check
} from 'lucide-react';
import SEOHead from '../components/common/SEOHead';
import ProductCard from '../components/common/ProductCard';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useWebsiteData } from '../context/WebsiteDataContext';
import { formatCurrency, calculateDiscount } from '../utils/formatters';
import { metaEvents } from '../utils/metaPixel';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { addToCart, buyNow } = useCart();
  const { config, products, getProductBySlug, loading: websiteDataLoading } = useWebsiteData();

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const currency = config?.siteSettings?.currency || '৳';

  useEffect(() => {
    window.scrollTo(0, 0);
    setQuantity(1);
    setSelectedImageIndex(0);

    if (websiteDataLoading) {
      setLoading(true);
      return;
    }

    const found = getProductBySlug(slug);
    if (found) {
      setProduct(found);
      setError(null);
      setLoading(false);
      metaEvents.viewContent(found);

      // Related products from same category
      if (found.category) {
        const related = products.filter(
          p => p.category && p.category.toLowerCase() === found.category.toLowerCase() && p.slug !== slug
        ).slice(0, 4);
        setRelatedProducts(related);
      }
    } else {
      // Fallback query if not yet loaded in local store
      api.getProductBySlug(slug)
        .then(res => {
          if (res && res.success && res.data) {
            setProduct(res.data);
            metaEvents.viewContent(res.data);
            setError(null);
          } else {
            setError('Product not found');
          }
        })
        .catch(() => setError('Unable to load product information.'))
        .finally(() => setLoading(false));
    }
  }, [slug, websiteDataLoading, getProductBySlug, products]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center space-y-3 py-20">
        <RefreshCw className="w-8 h-8 text-black animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading product details...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white py-20 px-4">
        <div className="max-w-md mx-auto bg-white rounded-lg border border-gray-200 p-8 text-center space-y-4 shadow-sm">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-gray-900">Product Not Found</h2>
          <p className="text-xs text-gray-500">
            The requested product is currently unavailable or may have been updated.
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
          >
            <span>Return to Shop</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : [];

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
    <div className="min-h-screen bg-white py-3 sm:py-8">
      <SEOHead
        title={`${product.name} | Buy Online Bangladesh`}
        description={product.shortDescription || product.description}
        image={images[0]}
      />

      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center space-x-2 text-xs text-gray-500 mb-3 sm:mb-6">
          <Link to="/" className="hover:text-black transition-colors">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-black transition-colors">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${encodeURIComponent(product.category)}`} className="hover:text-black transition-colors">
            {product.category}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-semibold truncate max-w-xs">{product.name}</span>
        </nav>

        {/* =========================================================================
            MAIN PRODUCT PRESENTATION — BuyAzz Reference Design (Page 3 of PDF)
           ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-14 pb-12 border-b border-gray-200">
          
          {/* Left Column: Image Stage & Thumbnails (Restrained to fit fully on mobile viewport without vertical scrolling) */}
          <div className="lg:col-span-6 space-y-3 sm:space-y-4 max-w-[280px] xs:max-w-[320px] sm:max-w-[420px] lg:max-w-[500px] mx-auto w-full lg:sticky lg:top-32 self-start">
            {/* Primary Main Image Card - 100% visible on mobile screen without scrolling */}
            <div className="relative aspect-square w-full max-h-[35vh] xs:max-h-[38vh] sm:max-h-[46vh] lg:max-h-[calc(100vh-190px)] rounded-xl overflow-hidden border border-gray-200 bg-white flex items-center justify-center group shadow-xs">
              <img
                src={images[selectedImageIndex] || images[0]}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-300"
              />

              {/* Discount Tag on Top Left (BuyAzz Red Tag) */}
              {discountPercent > 0 && (
                <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded shadow-xs">
                  {discountPercent}% off
                </div>
              )}
            </div>

            {/* Thumbnail Strip */}
            {images.length > 1 && (
              <div className="flex items-center justify-center sm:justify-start gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-12 h-12 sm:w-18 sm:h-18 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx
                        ? 'border-brand-dark shadow-xs'
                        : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Title, Price, Quantity & Purchase Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              {/* Category / Size Badge Pill */}
              <div className="inline-block px-3 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-bold text-gray-800">
                Category: {product.category}
              </div>

              {/* Product Title */}
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-snug">
                {product.name}
              </h1>

              {/* Short Description */}
              {product.shortDescription && (
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  {product.shortDescription}
                </p>
              )}

              {/* Price Line (BuyAzz style) */}
              <div className="flex items-baseline gap-3 pt-1">
                <span className="text-2xl sm:text-3xl font-black text-gray-900">
                  {formatCurrency(product.salePrice, currency)}
                </span>
                {product.regularPrice > product.salePrice && (
                  <span className="text-sm sm:text-base text-gray-400 line-through">
                    {formatCurrency(product.regularPrice, currency)}
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="text-xs font-bold text-red-600">
                    {discountPercent}% off
                  </span>
                )}
              </div>

              {/* In Stock Status Pill (BuyAzz style) */}
              <div className="pt-1">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${
                  !isOutOfStock
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${!isOutOfStock ? 'bg-emerald-600' : 'bg-red-600'}`}></span>
                  <span>{!isOutOfStock ? `In stock - ${product.stock} available` : 'Out of stock'}</span>
                </span>
              </div>

              {/* Quantity Stepper (BuyAzz style) */}
              <div className="pt-2 flex items-center gap-4">
                <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Quantity:
                </span>
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    className="px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 text-xs font-extrabold text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock > 0 ? product.stock : 99, quantity + 1))}
                    disabled={isOutOfStock}
                    className="px-3 py-1.5 text-gray-600 hover:text-black hover:bg-gray-100 disabled:opacity-30 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Action Buttons Row: Add to Cart, Buy Now, Wishlist, Share */}
              <div className="pt-3 flex flex-wrap items-center gap-3">
                {/* Add to Cart (White Outline with Bag) */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="flex-1 py-3 px-5 rounded-lg border-2 border-brand-dark bg-white hover:bg-slate-50 text-brand-dark font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors disabled:opacity-40"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>

                {/* Buy Now (Solid Dark Navy) */}
                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="flex-1 py-3 px-5 rounded-lg bg-brand-dark hover:bg-brand-navy text-white font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-colors disabled:opacity-40"
                >
                  <span>Buy Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Wishlist Button */}
                <button
                  onClick={() => setIsWishlisted(!isWishlisted)}
                  title="Save to Wishlist"
                  className="p-3 rounded-lg border border-gray-300 hover:border-brand-dark text-gray-700 hover:text-brand-dark transition-colors"
                >
                  <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                </button>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  title="Share Product"
                  className="p-3 rounded-lg border border-gray-300 hover:border-brand-dark text-gray-700 hover:text-brand-dark transition-colors"
                >
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
                </button>
              </div>

              {/* Combo Contents List (if applicable) */}
              {isCombo && product.comboItems && product.comboItems.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-gray-50 border border-gray-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-900">
                    <Layers className="w-4 h-4 text-black" />
                    <span>Included in this Combo Package:</span>
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

              {/* Delivery Guarantees */}
              <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-3 text-xs text-gray-600">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-black flex-shrink-0" />
                  <span>Cash on Delivery across BD</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black flex-shrink-0" />
                  <span>24-48 Hours Express Delivery</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* =========================================================================
            BELOW PRIMARY INFORMATION: Description, Benefits & Specs
           ========================================================================= */}
        <div className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Detailed Product Description */}
          <div className="lg:col-span-8 space-y-6">
            <div>
              <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2 mb-4">
                Product Details
              </h3>
              <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line space-y-3">
                {product.description || product.shortDescription}
              </div>
            </div>

            {/* Key Benefits */}
            {product.keyBenefits && product.keyBenefits.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-gray-900">Key Benefits:</h4>
                <ul className="space-y-2">
                  {product.keyBenefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Specifications Table */}
          <div className="lg:col-span-4 space-y-4">
            <h3 className="text-base font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-2">
              Specifications
            </h3>
            <div className="divide-y divide-gray-100 text-xs">
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Category</span>
                <span className="font-semibold text-gray-900">{product.category}</span>
              </div>
              <div className="py-2.5 flex justify-between">
                <span className="text-gray-500">Authenticity</span>
                <span className="font-semibold text-emerald-700">100% Genuine Imported</span>
              </div>
              {product.specifications && product.specifications.map((spec, idx) => (
                <div key={idx} className="py-2.5 flex justify-between">
                  <span className="text-gray-500">{spec.label}</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[60%]">{spec.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <div className="pt-8 border-t border-gray-200 space-y-6">
            <h3 className="text-xl font-bold tracking-tight text-gray-900">
              Related Products
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
