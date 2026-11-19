import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HeroSection() {
  const { config } = useConfig();
  const hero = config?.hero || {};

  const desktopImg = hero.desktopImage || hero.heroImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1600&auto=format&fit=crop&q=85';
  const mobileImg = hero.mobileImage || hero.heroMobileImage || desktopImg;

  return (
    <section className="bg-white py-2 sm:py-4 w-full overflow-hidden" id="hero">
      <div className="max-w-[1536px] w-full mx-auto px-3 sm:px-6">
        {/* Main Banner Container - Pure Visual Photography Banner */}
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[16/9] sm:aspect-[21/9] min-h-[220px] sm:min-h-[380px] lg:min-h-[460px] shadow-xs">
          
          {/* Responsive Art Direction: Mobile vs Desktop Image */}
          <picture className="absolute inset-0 w-full h-full">
            {hero.mobileImage && (
              <source media="(max-width: 640px)" srcSet={mobileImg} />
            )}
            <img
              src={desktopImg}
              alt="Hair Care & Minoxidil Solutions"
              className="w-full h-full object-cover object-center"
            />
          </picture>

          {/* Subtle Bottom Vignette so the Button Pops Cleanly */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent pointer-events-none" />

          {/* Prominent Bottom-Left CTA Button (15-20% Larger, Pure Minimalist Clean Style) */}
          <div className="absolute bottom-4 left-4 sm:bottom-8 sm:left-8 z-10">
            <Link
              to={hero.primaryBtnLink || '/shop'}
              className="px-7 py-3.5 sm:px-9 sm:py-4 rounded-lg bg-white hover:bg-gray-100 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg hover:shadow-xl transition-all flex items-center gap-2.5 border border-black/10"
            >
              <span>{hero.primaryBtnText || 'Shop Now'}</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
