import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Search, Heart, ChevronDown, Sparkles, X, Globe } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';
import api from '../../services/api';

export default function Navbar() {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { config } = useConfig();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ left: 0 });
  const [lang, setLang] = useState('EN');
  const hoverTimeoutRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  const siteSettings = config?.siteSettings || {};
  const logoText = siteSettings.logoText || 'BuyAzz';

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res && res.success && res.data) {
        setCategories(res.data.filter(c => c.isActive !== false));
      }
    } catch (e) {
      console.warn('Failed to load categories in navbar:', e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleCategoryHover = (cat, e) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const rect = e.currentTarget.getBoundingClientRect();
    setHoverPosition({ left: rect.left + rect.width / 2 });
    setHoveredCategory(cat);
  };

  const handleCategoryLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredCategory(null);
    }, 150);
  };

  const handleCategoryClick = (categorySlug) => {
    setHoveredCategory(null);
    const targetAnchor = `category-${categorySlug}`;

    if (location.pathname === '/') {
      const element = document.getElementById(targetAnchor);
      if (element) {
        const offset = 120; // accounts for double navbar height
        const bodyRect = document.body.getBoundingClientRect().top;
        const elementRect = element.getBoundingClientRect().top;
        const elementPosition = elementRect - bodyRect;
        const offsetPosition = elementPosition - offset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    } else {
      navigate(`/#${targetAnchor}`);
      setTimeout(() => {
        const element = document.getElementById(targetAnchor);
        if (element) {
          const offset = 120;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }
      }, 300);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200">
        {/* TOP BAR: Logo, Search, Actions */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-3 sm:gap-6">
            
            {/* 1. Brand Logo */}
            <Link to="/" className="flex items-center space-x-1.5 flex-shrink-0 group">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 group-hover:text-black">
                {logoText}
              </span>
              <span className="text-xs sm:text-sm font-black text-amber-500 uppercase tracking-widest -mb-1">
                .bd
              </span>
            </Link>

            {/* 2. BuyAzz-Style Search Bar with Solid SEARCH Button */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex-1 max-w-2xl mx-auto hidden sm:flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:border-black focus-within:ring-1 focus-within:ring-black bg-white transition-all shadow-xs"
            >
              <div className="pl-3.5 pr-2 text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder={lang === 'BN' ? "পণ্য, মিনোক্সিডিল, ডার্মা রোলার খুঁজুন..." : "Search products, brands, and daily essentials..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <button
                type="submit"
                className="px-6 py-2.5 bg-black hover:bg-gray-800 text-white font-bold text-xs uppercase tracking-wider transition-colors flex-shrink-0"
              >
                {lang === 'BN' ? "খুঁজুন" : "SEARCH"}
              </button>
            </form>

            {/* 3. Right Icons (Wishlist, Cart, Language) - No signin/signup per user note */}
            <div className="flex items-center space-x-3 sm:space-x-5 flex-shrink-0">
              
              {/* Wishlist Link */}
              <Link
                to="/shop"
                title="Favorites"
                className="p-1.5 text-gray-700 hover:text-black transition-colors"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
              </Link>

              {/* Shopping Cart Trigger with Counter Badge */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Open Shopping Cart"
                className="relative p-1.5 text-gray-900 hover:text-black transition-colors focus:outline-none"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 stroke-[1.8]" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-black text-white font-bold text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* Language Switcher (EN / বাংলা) */}
              <button
                onClick={() => setLang(lang === 'EN' ? 'BN' : 'EN')}
                className="flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-black px-2 py-1 rounded border border-gray-200 transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{lang}</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Visible only on small screens) */}
          <div className="sm:hidden pb-3">
            <form onSubmit={handleSearchSubmit} className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <input
                type="text"
                placeholder="Search products & essentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 text-xs text-gray-900 focus:outline-none"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-black text-white font-bold text-[11px] uppercase tracking-wider"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {/* BOTTOM BAR: Category Names Strip with Hover Image Preview */}
        <div className="border-t border-gray-100 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-6 sm:space-x-8 overflow-x-auto no-scrollbar py-2.5">
              <button
                onClick={() => navigate('/shop')}
                className="text-xs font-bold text-gray-800 hover:text-black whitespace-nowrap transition-colors uppercase tracking-wider flex-shrink-0"
              >
                All Products
              </button>

              {categories.map((cat) => (
                <div
                  key={cat._id || cat.slug}
                  onMouseEnter={(e) => handleCategoryHover(cat, e)}
                  onMouseLeave={handleCategoryLeave}
                  className="relative flex-shrink-0"
                >
                  <button
                    onClick={() => handleCategoryClick(cat.slug)}
                    className="text-xs font-semibold text-gray-700 hover:text-black whitespace-nowrap transition-colors py-1 relative group"
                  >
                    <span>{cat.name}</span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-black transition-all duration-200 group-hover:w-full"></span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FLOATING HOVER PREVIEW: Small Image Only (No Mega Menu, No Large Dropdown) */}
        {hoveredCategory && hoveredCategory.image && (
          <div
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
            }}
            onMouseLeave={handleCategoryLeave}
            style={{
              left: `${hoverPosition.left}px`,
              transform: 'translateX(-50%)'
            }}
            className="hidden lg:block fixed top-24 z-50 animate-fadeIn pointer-events-auto"
          >
            <div
              onClick={() => handleCategoryClick(hoveredCategory.slug)}
              className="bg-white border border-gray-200 rounded-lg p-2 shadow-preview cursor-pointer hover:border-black transition-all flex flex-col items-center"
            >
              <div className="w-36 h-28 rounded overflow-hidden bg-gray-50 flex items-center justify-center border border-gray-100">
                <img
                  src={hoveredCategory.image}
                  alt={hoveredCategory.name}
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <span className="mt-1.5 text-[11px] font-bold text-gray-900 tracking-tight">
                {hoveredCategory.name}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent fixed header from hiding page content */}
      <div className="h-28 sm:h-32"></div>
    </>
  );
}
