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
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Category Section Header: Name on left, Prominent "View All >" on right */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-baseline space-x-2">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 uppercase">
              {category.name}
            </h2>
            <span className="text-xs text-gray-400 font-bold hidden sm:inline">
              ({categoryProducts.length} items)
            </span>
          </div>

          <Link
            to={`/shop?category=${encodeURIComponent(category.name)}`}
            className="text-sm sm:text-base font-extrabold text-black hover:text-gray-600 flex items-center gap-1.5 transition-colors uppercase tracking-wider group"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform stroke-[2.5]" />
          </Link>
        </div>

        {/* 
          Category Product Cards:
          - Desktop: Clean 4-column grid (sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5) with slightly larger cards
          - Mobile: Single row, left-to-right horizontal scroll showing EXACTLY 2 to 2.5 cards (w-[calc(46vw-10px)]) with proper aspect ratio!
        */}
        <div
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-mandatory pb-2 sm:pb-0"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {categoryProducts.map((product) => (
            <div
              key={product._id || product.slug}
              className="w-[calc(46vw-10px)] sm:w-auto flex-shrink-0 sm:flex-shrink snap-start"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
