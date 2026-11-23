import React from 'react';
import HeroSection from '../components/home/HeroSection';
import CategoryCarousel from '../components/home/CategoryCarousel';
import CategoryProductSection from '../components/home/CategoryProductSection';
import StartNowSection from '../components/home/StartNowSection';
import HairThinningSection from '../components/home/HairThinningSection';
import HowMinoxidilWorksSection from '../components/home/HowMinoxidilWorksSection';
import ProgressTimelineSection from '../components/home/ProgressTimelineSection';
import UsageGuideSection from '../components/home/UsageGuideSection';
import SEOHead from '../components/common/SEOHead';
import { useWebsiteData } from '../context/WebsiteDataContext';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { config, categories, products, loading } = useWebsiteData();

  if (loading || !config) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 min-h-[50vh]">
        <RefreshCw className="w-8 h-8 text-black animate-spin" />
        <p className="text-xs font-semibold text-gray-500">Loading authentic products...</p>
      </div>
    );
  }

  const seo = config?.seo || {};

  return (
    <div className="min-h-screen bg-brand-light">
      <SEOHead
        title={seo.metaTitle || 'Regrow Hair Care — Premium Minoxidil & Scalp Wellness Bangladesh'}
        description={seo.metaDescription || 'Authentic topical Minoxidil 5%, Titanium Derma Rollers, and targeted scalp care routines in Bangladesh. Cash on Delivery nationwide.'}
        image={seo.ogImage}
      />

      {/* 1. Main Hero Banner */}
      <HeroSection />

      {/* 2. Shop by Category Image Carousel */}
      <CategoryCarousel categories={categories} />

      {/* 3. Category-Wise Product Collections */}
      <div className="space-y-2">
        {categories.map((cat) => (
          <CategoryProductSection
            key={cat._id || cat.slug}
            category={cat}
            products={products}
          />
        ))}
      </div>

      {/* 4. Educational & Haircare Information Sections (Rendered strictly from JSON) */}
      <StartNowSection />
      <HairThinningSection />
      <HowMinoxidilWorksSection />
      <ProgressTimelineSection />
      <UsageGuideSection />
    </div>
  );
}
