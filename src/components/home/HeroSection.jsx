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
    <section className="bg-white py-3 sm:py-6" id="hero">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        {/* Main Banner Container - BuyAzz Inspired Large Presentation */}
        <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[16/9] sm:aspect-[21/9] min-h-[280px] sm:min-h-[400px] lg:min-h-[460px] flex items-center shadow-xs">
          
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

          {/* Clean Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:from-black/70 sm:via-black/35" />

          {/* Content Overlay */}
          <div className="relative z-10 max-w-xl px-4 sm:px-12 py-6 sm:py-8 text-white space-y-3 sm:space-y-4">
            {hero.badge && (
              <span className="inline-block text-[11px] sm:text-xs font-bold uppercase tracking-wider text-amber-400 bg-black/50 px-3 py-1 rounded backdrop-blur-xs border border-white/10">
                {hero.badge}
              </span>
            )}

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
              {hero.title || 'Your Hair Care Journey Starts Here.'}
            </h1>

            <p className="text-xs sm:text-sm lg:text-base text-gray-200 leading-relaxed font-normal line-clamp-3">
              {hero.subtitle || 'Reactivate dormant hair follicles, increase scalp blood microcirculation, and reclaim thicker hair with dermatologically proven Minoxidil 5% and micro-needling systems.'}
            </p>

            <div className="pt-2 flex items-center gap-3">
              <Link
                to={hero.primaryBtnLink || '/shop'}
                className="px-6 py-3 rounded bg-white hover:bg-gray-100 text-black font-extrabold text-xs uppercase tracking-wider shadow transition-all flex items-center gap-2"
              >
                <span>{hero.primaryBtnText || 'Shop Collection'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
