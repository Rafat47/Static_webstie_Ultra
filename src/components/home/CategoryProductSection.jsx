import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import ProductCard from '../common/ProductCard';

export default function CategoryProductSection({ category, products = [] }) {
  if (!category) return null;

  // Filter products for this specific category (case-insensitive)
  const categoryProducts = products.filter(p =>
    p.isActive !== false &&
    p.category &&
    p.category.toLowerCase() === category.name.toLowerCase()
  );

  // If no products in this category, don't render an empty section
  if (categoryProducts.length === 0) return null;

  const anchorId = `category-${category.slug}`;

  return (
    <section className="bg-white py-6 sm:py-10 border-b border-gray-100" id={anchorId}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Category Section Header: Name on left, "View All >" on right */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900">
              {category.name}
            </h2>
            <span className="text-xs text-gray-400 font-semibold hidden sm:inline">
              ({categoryProducts.length})
            </span>
          </div>

          <Link
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className="text-xs sm:text-sm font-bold text-gray-700 hover:text-black flex items-center gap-1 transition-colors group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 
          Category Product Cards:
          - Desktop: Clean 4-column grid (sm:grid-cols-2 lg:grid-cols-4 gap-6)
          - Mobile: 2 to 2.5 cards visible with natural horizontal touch/swipe scrolling!
        */}
        <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 overflow-x-auto sm:overflow-visible no-scrollbar pb-2 sm:pb-0">
          {categoryProducts.map((product) => (
            <div
              key={product._id || product.slug}
              className="w-[160px] sm:w-auto flex-shrink-0 sm:flex-shrink"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
