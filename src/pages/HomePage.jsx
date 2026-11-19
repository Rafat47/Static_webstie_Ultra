import React, { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import FloatingProductCarousel from '../components/home/FloatingProductCarousel';
import StartNowSection from '../components/home/StartNowSection';
import HairThinningSection from '../components/home/HairThinningSection';
import HowMinoxidilWorksSection from '../components/home/HowMinoxidilWorksSection';
import ProgressTimelineSection from '../components/home/ProgressTimelineSection';
import UsageGuideSection from '../components/home/UsageGuideSection';
import FeaturedProductsSection from '../components/home/FeaturedProductsSection';
import SEOHead from '../components/common/SEOHead';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { metaEvents } from '../utils/metaPixel';

export default function HomePage() {
  const { config } = useConfig();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metaEvents.pageView();

    const loadProducts = async () => {
      try {
        const res = await api.getProducts();
        if (res && res.success && res.data) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn('Failed to load products for homepage:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const seo = config?.seo || {};

  return (
    <div className="min-h-screen">
      <SEOHead
        title={seo.metaTitle || 'Regrow Hair Care — Premium Minoxidil & Scalp Wellness Bangladesh'}
        description={seo.metaDescription || 'Authentic topical Minoxidil 5%, Titanium Derma Rollers, and targeted scalp care routines in Bangladesh. Cash on Delivery nationwide.'}
        image={seo.ogImage}
      />

      {/* 1. Hero Section */}
      <HeroSection />

      {/* 2. Floating Product Carousel (Overlapping Hero) */}
      <FloatingProductCarousel products={products} />

      {/* 3. It's Not Too Late to Start Now */}
      <StartNowSection />

      {/* 4. Understanding Hair Thinning */}
      <HairThinningSection />

      {/* 5. How Minoxidil Works */}
      <HowMinoxidilWorksSection />

      {/* 6. Progress Timeline / Before and After */}
      <ProgressTimelineSection />

      {/* 7. How to Use Minoxidil */}
      <UsageGuideSection />

      {/* 8. Featured Products Grid */}
      <FeaturedProductsSection products={products} />
    </div>
  );
}

