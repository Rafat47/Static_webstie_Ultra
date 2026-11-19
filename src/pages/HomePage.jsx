import React, { useState, useEffect } from 'react';
import HeroSection from '../components/home/HeroSection';
import CategoryCarousel from '../components/home/CategoryCarousel';
import CategoryProductSection from '../components/home/CategoryProductSection';
import StartNowSection from '../components/home/StartNowSection';
import HairThinningSection from '../components/home/HairThinningSection';
import HowMinoxidilWorksSection from '../components/home/HowMinoxidilWorksSection';
import ProgressTimelineSection from '../components/home/ProgressTimelineSection';
import UsageGuideSection from '../components/home/UsageGuideSection';
import SEOHead from '../components/common/SEOHead';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';
import { metaEvents } from '../utils/metaPixel';
import { RefreshCw } from 'lucide-react';

export default function HomePage() {
  const { config } = useConfig();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    metaEvents.pageView();

    const loadData = async () => {
      try {
        setLoading(true);
        const [catRes, prodRes] = await Promise.all([
          api.getCategories(),
          api.getProducts()
        ]);

        if (catRes && catRes.success && catRes.data) {
          // Sort categories by displayOrder
          const sortedCats = [...catRes.data].sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
          setCategories(sortedCats.filter(c => c.isActive !== false));
        }

        if (prodRes && prodRes.success && prodRes.data) {
          setProducts(prodRes.data);
        }
      } catch (err) {
        console.warn('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const seo = config?.seo || {};

  return (
    <div className="min-h-screen bg-white">
      <SEOHead
        title={seo.metaTitle || 'Regrow Hair Care — Premium Minoxidil & Scalp Wellness Bangladesh'}
        description={seo.metaDescription || 'Authentic topical Minoxidil 5%, Titanium Derma Rollers, and targeted scalp care routines in Bangladesh. Cash on Delivery nationwide.'}
        image={seo.ogImage}
      />

      {/* 1. Main Hero Banner */}
      <HeroSection />

      {/* 2. Shop by Category Image Carousel (Desktop 1-row, Mobile 2-rows synchronized) */}
      <CategoryCarousel categories={categories} />

      {/* 3. Category-Wise Product Collections (Shopping First!) */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-black animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Loading authentic products...</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <CategoryProductSection
              key={cat._id || cat.slug}
              category={cat}
              products={products}
            />
          ))}
        </div>
      )}

      {/* 4. Educational & Haircare Information Sections (After all product collections) */}
      <StartNowSection />
      <HairThinningSection />
      <HowMinoxidilWorksSection />
      <ProgressTimelineSection />
      <UsageGuideSection />
    </div>
  );
}
