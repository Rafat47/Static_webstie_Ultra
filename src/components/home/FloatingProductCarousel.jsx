import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function FloatingProductCarousel({ products = [] }) {
  const { config } = useConfig();
  const carouselConfig = config?.productCarousel || {};
  const navigate = useNavigate();

  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasMoved, setHasMoved] = useState(false);

  // If carousel is explicitly disabled by admin, don't render
  if (carouselConfig.enabled === false) return null;

  // Filter active products
  const displayProducts = products.filter(p => p.isActive !== false);
  if (displayProducts.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  // Mouse Drag Handlers for Desktop
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasMoved(false);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeftState(scrollRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 1.5; // Drag sensitivity
    if (Math.abs(walk) > 5) {
      setHasMoved(true);
    }
    scrollRef.current.scrollLeft = scrollLeftState - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleProductClick = (slug) => {
    // If the user was dragging/swiping, don't trigger the click navigation
    if (hasMoved) return;
    navigate(`/product/${slug}`);
  };

  return (
    <section className="relative z-20 -mt-12 sm:-mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Floating Card Container */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-brand-border/80 p-3 sm:p-5">
        {/* Subtle Header */}
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center space-x-2">
            <span className="flex h-2 w-2 rounded-full bg-brand-accent animate-ping" />
            <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand-dark">
              {carouselConfig.title || 'Quick Product Selector'}
            </h3>
            <span className="hidden sm:inline-block text-xs text-brand-muted">
              — {carouselConfig.subtitle || 'Tap any item to view packages'}
            </span>
          </div>

          {/* Desktop Arrow Buttons */}
          <div className="hidden sm:flex items-center space-x-1.5">
            <button
              onClick={() => scroll('left')}
              aria-label="Scroll left"
              className="p-1.5 rounded-full bg-gray-100 hover:bg-brand-accent hover:text-white text-brand-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              aria-label="Scroll right"
              className="p-1.5 rounded-full bg-gray-100 hover:bg-brand-accent hover:text-white text-brand-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Carousel Scroll Track */}
        <div
          ref={scrollRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`flex items-center space-x-4 sm:space-x-6 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1 select-none ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {displayProducts.map((product) => (
            <div
              key={product._id || product.slug}
              onClick={() => handleProductClick(product.slug)}
              className="flex-shrink-0 flex flex-col items-center group cursor-pointer w-20 sm:w-24 text-center focus:outline-none"
            >
              {/* Circular Thumbnail with Gradient Border Ring */}
              <div className="relative p-1 rounded-full bg-gradient-to-tr from-brand-accent via-blue-400 to-indigo-500 group-hover:scale-105 group-hover:shadow-float transition-all duration-300">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-white border-2 border-white shadow-inner flex items-center justify-center">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    draggable="false"
                    className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-300 pointer-events-none"
                  />
                </div>

                {/* Optional mini badge pill */}
                {product.badge && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[8px] font-bold px-1.5 py-0.2 rounded-full whitespace-nowrap shadow border border-white/20">
                    {product.badge}
                  </span>
                )}
              </div>

              {/* Product Label / Name Below Circle */}
              <span className="mt-2 text-[11px] sm:text-xs font-semibold text-brand-text group-hover:text-brand-accent transition-colors line-clamp-1 w-full px-1">
                {product.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
