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

  // Filter active categories and sort by serial number (displayOrder)
  const activeCategories = categories
    .filter(c => c.isActive !== false)
    .sort((a, b) => (Number(a.displayOrder) || 0) - (Number(b.displayOrder) || 0));
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
    <section className="bg-[#F8FAFD] py-3 sm:py-5 border-b border-gray-100" id="categories-carousel">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">

        {/* =========================================================================
            DESKTOP LAYOUT WITH FLOATING OVERLAY ARROWS:
            - Wider rectangular cards (~20% wider: w-72 lg:w-80)
            - Box is 100% filled by image (No text inside the box)
            - Category name cleanly placed underneath the box
            - Floating Left and Right arrow buttons directly on top/sides of carousel
           ========================================================================= */}
        <div className="relative group hidden sm:block">
          {/* Floating Left Arrow */}
          {!isFewCategories && (
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="absolute -left-2 lg:-left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/95 hover:bg-brand-dark text-gray-800 hover:text-white border border-gray-200 shadow-md flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className={`flex items-center ${isFewCategories ? 'justify-center' : 'justify-start'
              } space-x-5 lg:space-x-7 overflow-x-auto no-scrollbar scroll-smooth py-1 select-none ${isDragging ? 'cursor-grabbing' : isFewCategories ? 'cursor-default' : 'cursor-grab'
              }`}
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            {activeCategories.map((cat) => (
              <div
                key={cat._id || cat.slug}
                onClick={() => handleCategoryClick(cat.slug)}
                className="w-72 lg:w-80 flex-shrink-0 group/card cursor-pointer transition-all duration-200"
              >
                {/* Pure Rectangular Image Box - 100% Image Filled, Zero Text Inside */}
                <div className="w-full h-44 lg:h-48 rounded-xl overflow-hidden border border-gray-200 group-hover/card:border-brand-dark transition-all shadow-2xs group-hover/card:shadow-subtle bg-gray-50">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80'}
                    alt={cat.name}
                    draggable="false"
                    className="w-full h-full object-cover object-center group-hover/card:scale-104 transition-transform duration-300 pointer-events-none"
                  />
                </div>
                {/* Category Name Cleanly Below the Box */}
                <div className="mt-2.5 text-center">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 group-hover/card:text-brand-dark line-clamp-1 uppercase tracking-wide">
                    {cat.name}
                  </h3>
                </div>
              </div>
            ))}
          </div>

          {/* Floating Right Arrow */}
          {!isFewCategories && (
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="absolute -right-2 lg:-right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-white/95 hover:bg-brand-dark text-gray-800 hover:text-white border border-gray-200 shadow-md flex items-center justify-center transition-all hover:scale-105"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
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
                  <div className="w-full h-32 rounded-lg overflow-hidden border border-gray-200 active:border-brand-dark bg-gray-50 shadow-2xs">
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
                  <div className="w-full h-28 rounded-lg overflow-hidden border border-gray-200 active:border-brand-dark bg-gray-50 shadow-2xs">
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
