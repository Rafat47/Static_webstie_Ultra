import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function CategoryCarousel({ categories = [] }) {
  const { config } = useConfig();
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // Filter active categories
  const activeCategories = categories.filter(c => c.isActive !== false);
  if (activeCategories.length === 0) return null;

  const isFewCategories = activeCategories.length <= 4;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -360 : 360;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e) => {
    if (isFewCategories) return;
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCategoryClick = (categorySlug) => {
    if (hasMoved) return;
    const targetAnchor = `category-${categorySlug}`;
    const element = document.getElementById(targetAnchor);
    if (element) {
      const offset = 110; // accounts for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className="bg-white py-5 sm:py-8 border-b border-gray-100" id="categories-carousel">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 uppercase">
              Shop by Category
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Select a category to jump directly to specialized solutions & value bundles
            </p>
          </div>

          {/* Desktop Arrow Controls (Visible only if more than 4 categories) */}
          {!isFewCategories && (
            <div className="hidden sm:flex items-center space-x-1.5">
              <button
                onClick={() => scroll('left')}
                aria-label="Scroll left"
                className="p-2 rounded-full border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll('right')}
                aria-label="Scroll right"
                className="p-2 rounded-full border border-gray-200 hover:border-black hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* =========================================================================
            DESKTOP LAYOUT:
            - Wider rectangular cards (~20% wider: w-72 lg:w-80)
            - Box is 100% filled by image (No text inside the box)
            - Category name cleanly placed underneath the box
            - Centered when <= 4 categories
           ========================================================================= */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`hidden sm:flex items-center ${
            isFewCategories ? 'justify-center' : 'justify-start'
          } space-x-5 lg:space-x-7 overflow-x-auto no-scrollbar scroll-smooth py-1 select-none ${
            isDragging ? 'cursor-grabbing' : isFewCategories ? 'cursor-default' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {activeCategories.map((cat) => (
            <div
              key={cat._id || cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className="w-72 lg:w-80 flex-shrink-0 group cursor-pointer transition-all duration-200"
            >
              {/* Pure Rectangular Image Box - 100% Image Filled, Zero Text Inside */}
              <div className="w-full h-44 lg:h-48 rounded-xl overflow-hidden border border-gray-200 group-hover:border-black transition-all shadow-2xs group-hover:shadow-subtle bg-gray-50">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80'}
                  alt={cat.name}
                  draggable="false"
                  className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-300 pointer-events-none"
                />
              </div>
              {/* Category Name Cleanly Below the Box */}
              <div className="mt-2.5 text-center">
                <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-black line-clamp-1 uppercase tracking-wide">
                  {cat.name}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* =========================================================================
            MOBILE LAYOUT:
            - Full-Width 100% utilization
            - Rectangular image boxes, no text inside the box
            - Category name placed underneath each box
           ========================================================================= */}
        <div className="sm:hidden w-full">
          {activeCategories.length <= 4 ? (
            /* Clean Full-Width 2-Column Grid on Mobile */
            <div className="grid grid-cols-2 gap-3 w-full">
              {activeCategories.map((cat) => (
                <div
                  key={cat._id || cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="w-full flex flex-col group cursor-pointer transition-all"
                >
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 active:border-black bg-gray-50 shadow-2xs">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=350&auto=format&fit=crop&q=80'}
                      alt={cat.name}
                      draggable="false"
                      className="w-full h-full object-cover object-center pointer-events-none"
                    />
                  </div>
                  <div className="mt-1.5 text-center">
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-1 uppercase tracking-wider">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* More than 4: 2-row horizontal swipe filling full viewport */
            <div
              className="grid grid-rows-2 grid-flow-col gap-3 overflow-x-auto no-scrollbar scroll-smooth auto-cols-[calc(50%-6px)] pb-1"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {activeCategories.map((cat) => (
                <div
                  key={cat._id || cat.slug}
                  onClick={() => handleCategoryClick(cat.slug)}
                  className="flex flex-col group cursor-pointer transition-all"
                >
                  <div className="w-full h-28 rounded-lg overflow-hidden border border-gray-200 active:border-black bg-gray-50 shadow-2xs">
                    <img
                      src={cat.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=350&auto=format&fit=crop&q=80'}
                      alt={cat.name}
                      draggable="false"
                      className="w-full h-full object-cover object-center pointer-events-none"
                    />
                  </div>
                  <div className="mt-1.5 text-center">
                    <h3 className="text-xs font-bold text-gray-800 line-clamp-1 uppercase tracking-wider">
                      {cat.name}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
