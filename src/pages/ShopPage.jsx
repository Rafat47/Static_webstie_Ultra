import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, Package, RefreshCw, X } from 'lucide-react';
import ProductCard from '../components/common/ProductCard';
import SEOHead from '../components/common/SEOHead';
import { useWebsiteData } from '../context/WebsiteDataContext';
import { metaEvents } from '../utils/metaPixel';

export default function ShopPage() {
  const { config, categories, products: allProducts, loading } = useWebsiteData();
  const shopData = config?.shop || {};
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryParam = searchParams.get('category') || 'All';

  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  const products = useMemo(() => {
    let result = [...allProducts];

    if (selectedCategory && selectedCategory !== 'All' && selectedCategory !== 'All Products') {
      result = result.filter(p => p.category && p.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      result = result.filter(p =>
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.title && p.title.toLowerCase().includes(q)) ||
        (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
      );
    }

    if (featuredOnly) {
      result = result.filter(p => p.isFeatured);
    }

    if (sortBy === 'price-low') {
      result.sort((a, b) => a.salePrice - b.salePrice);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.salePrice - a.salePrice);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      result.sort((a, b) => (Number(a.displayOrder ?? a.carouselOrder) || 0) - (Number(b.displayOrder ?? b.carouselOrder) || 0));
    }

    return result;
  }, [allProducts, selectedCategory, searchTerm, featuredOnly, sortBy]);

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

      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        {/* Header Banner */}
        <div className="mb-8 space-y-2 pb-6 border-b border-brand-border">
          <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight uppercase">
            {shopData.pageTitle || 'All Hair Care Products'}
          </h1>
          <p className="text-xs sm:text-sm text-brand-muted max-w-2xl">
            {shopData.pageSubtitle || '100% genuine Minoxidil 5% topical solutions, titanium micro-needles, and cost-effective combo packages. Cash on Delivery nationwide.'}
          </p>
        </div>

        {/* Filter & Search Bar Controls */}
        <div className="bg-white p-4 sm:p-5 border border-brand-border mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={shopData.searchPlaceholder || "Search products..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-brand-border text-xs text-brand-dark placeholder-gray-400 focus:outline-none focus:border-brand-dark transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
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
                className="w-full sm:w-48 py-2.5 px-3 border border-brand-border text-xs text-brand-dark bg-white focus:outline-none focus:border-brand-dark font-medium"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest Arrivals</option>
              </select>

              {/* Featured toggle */}
              <button
                onClick={() => setFeaturedOnly(!featuredOnly)}
                className={`py-2.5 px-3.5 text-xs font-bold border transition-colors whitespace-nowrap flex items-center gap-1.5 uppercase tracking-wider ${
                  featuredOnly
                    ? 'bg-brand-dark text-white border-brand-dark'
                    : 'bg-white text-brand-muted border-brand-border hover:border-brand-dark hover:text-brand-dark'
                }`}
              >
                <span>⭐ Top Picks</span>
              </button>
            </div>
          </div>

          {/* Dynamic Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-brand-border">
            <button
              onClick={() => handleCategorySelect('All')}
              className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                selectedCategory === 'All'
                  ? 'bg-brand-dark text-white'
                  : 'bg-white text-brand-muted border border-brand-border hover:border-brand-dark hover:text-brand-dark'
              }`}
            >
              {shopData.allCategoriesLabel || 'All Products'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat._id || cat.slug}
                onClick={() => handleCategorySelect(cat.name)}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-colors ${
                  selectedCategory.toLowerCase() === cat.name.toLowerCase()
                    ? 'bg-brand-dark text-white'
                    : 'bg-white text-brand-muted border border-brand-border hover:border-brand-dark hover:text-brand-dark'
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
            <RefreshCw className="w-8 h-8 text-brand-dark animate-spin" />
            <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white border border-brand-border p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-14 h-14 border border-brand-border text-brand-dark flex items-center justify-center mx-auto">
              <Package className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="text-base font-bold text-brand-dark uppercase">{shopData.emptyTitle || 'No products found'}</h3>
            <p className="text-xs text-brand-muted">
              {shopData.emptySubtitle || "We couldn't find any products matching your current filters. Try searching with a different term."}
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-brand-dark hover:bg-brand-navy text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
            >
              {shopData.clearFiltersText || 'Reset All Filters'}
            </button>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between text-xs text-brand-muted mb-4 px-1">
              <span>Showing {products.length} {products.length === 1 ? 'product' : 'products'}</span>
              {(selectedCategory !== 'All' || searchTerm || featuredOnly) && (
                <button
                  onClick={clearFilters}
                  className="text-brand-dark hover:underline font-bold uppercase tracking-wider"
                >
                  Clear filters
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
