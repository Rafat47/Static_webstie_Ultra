import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Package, RefreshCw, X } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import SEOHead from '../components/common/SEOHead';
import api from '../services/api';
import { metaEvents } from '../utils/metaPixel';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    metaEvents.pageView();
    loadCategories();
  }, []);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchTerm, sortBy, featuredOnly]);

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res && res.success && res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.warn('Failed to load categories:', err);
    }
  };

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'All Products') {
        params.category = selectedCategory;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (featuredOnly) {
        params.featured = 'true';
      }
      if (sortBy === 'price-low') params.sort = 'price-low';
      if (sortBy === 'price-high') params.sort = 'price-high';
      if (sortBy === 'newest') params.sort = 'newest';

      const res = await api.getProducts(params);
      if (res && res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err) {
      console.warn('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(categoryName);
    if (categoryName === 'All' || categoryName === 'All Products') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', categoryName);
    }
    setSearchParams(searchParams);
  };

  const clearFilters = () => {
    setSelectedCategory('All');
    setSearchTerm('');
    setSortBy('featured');
    setFeaturedOnly(false);
    searchParams.delete('category');
    setSearchParams(searchParams);
  };

  return (
    <div className="min-h-screen bg-brand-light py-8 sm:py-12">
      <SEOHead
        title="Shop Authentic Minoxidil & Hair Care Packages | Bangladesh"
        description="Browse authentic Minoxidil 5%, Titanium Derma Rollers, and value combo packages. Fast Cash on Delivery across Bangladesh."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Banner */}
        <div className="mb-8 sm:mb-10 text-center sm:text-left space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight">
            Explore All Hair Care Products
          </h1>
          <p className="text-sm sm:text-base text-brand-muted max-w-2xl">
            Authentic dermatological formulations, titanium micro-needle systems, and cost-saving combo sets with nationwide Cash on Delivery.
          </p>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-brand-border shadow-xs mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search Minoxidil, Derma Roller, Combos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sorting Dropdown */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-48 py-2.5 px-3 rounded-xl border border-gray-200 text-sm text-brand-text bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/50 font-medium"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>

              {/* Featured toggle */}
              <button
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`py-2.5 px-3.5 rounded-xl text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  featuredOnly
                    ? 'bg-brand-navy text-white border-brand-navy'
                    : 'bg-gray-50 text-brand-muted border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span>⭐ Top Picks</span>
              </button>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 pb-1">
            <button
              onClick={() => handleCategorySelect('All')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === 'All'
                  ? 'bg-brand-accent text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Products
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                onClick={() => handleCategorySelect(cat.name)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-brand-accent text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid State */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
            <p className="text-sm font-semibold text-brand-muted">Loading authentic products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-brand-border p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-brand-accent flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 opacity-75" />
            </div>
            <h3 className="text-lg font-bold text-brand-dark">No products found</h3>
            <p className="text-xs text-brand-muted">
              We couldn't find any products matching your current filters. Try searching with a different term.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-semibold text-xs shadow transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-brand-muted mb-4 px-1">
              <span>Showing {products.length} {products.length === 1 ? 'product' : 'products'}</span>
              {(selectedCategory !== 'All' || searchTerm || featuredOnly) && (
                <button
                  onClick={clearFilters}
                  className="text-brand-accent hover:underline font-semibold"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product._id || product.slug} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

