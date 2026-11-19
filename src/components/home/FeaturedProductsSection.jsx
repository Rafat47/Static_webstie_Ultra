import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import ProductCard from '../common/ProductCard';
import { useConfig } from '../../context/ConfigContext';

export default function FeaturedProductsSection({ products = [] }) {
  const { config } = useConfig();
  const sectionConfig = config?.featuredProducts || {};

  if (sectionConfig.enabled === false) return null;

  // Filter featured products or fallback to top products
  const featured = products.filter(p => p.isActive !== false && p.isFeatured);
  const displayList = featured.length > 0 ? featured : products.filter(p => p.isActive !== false).slice(0, 4);

  if (displayList.length === 0) return null;

  return (
    <section className="py-16 sm:py-24 bg-brand-light border-t border-brand-border/60" id="featured-products">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-12 gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-brand-accent">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dermatological Range</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight">
              {sectionConfig.title || 'Recommended Hair Restoration Solutions'}
            </h2>
            <p className="text-sm sm:text-base text-brand-muted max-w-2xl">
              {sectionConfig.subtitle || 'Dermatologically selected formulations & packages delivered straight to your door across Bangladesh.'}
            </p>
          </div>

          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-accent hover:text-blue-600 transition-colors group flex-shrink-0"
          >
            <span>View All Packages</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayList.map((product) => (
            <ProductCard key={product._id || product.slug} product={product} />
          ))}
        </div>
      </div>
    </section>
  );
}
