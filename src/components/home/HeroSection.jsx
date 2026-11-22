import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function HeroSection() {
  const { config } = useConfig();
  const hero = config?.hero || {};

  const desktopImg = hero.desktopImage || hero.heroImage || '';
  const mobileImg = hero.mobileImage || hero.heroMobileImage || desktopImg;

  return (
    <section className="bg-[#F8FAFD] py-2 sm:py-4 w-full overflow-hidden" id="hero">
      <div className="max-w-[1536px] w-full mx-auto px-3 sm:px-6">
        {/* Main Banner Container - Pure Visual Photography Banner */}
        <div className="relative w-full rounded-xl overflow-hidden border border-gray-200 bg-gray-50 aspect-[16/9] sm:aspect-[21/9] min-h-[220px] sm:min-h-[380px] lg:min-h-[460px] shadow-xs">
          {desktopImg && (
            /* Responsive Art Direction: Mobile vs Desktop Image */
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
          )}
        </div>
      </div>
    </section>
  );
}
