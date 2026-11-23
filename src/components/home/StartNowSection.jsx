import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function StartNowSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.startNow;

  if (!sectionData || sectionData.enabled === false || !sectionData.title) return null;

  const desktopImg = sectionData.desktopImage || sectionData.image || '';
  const mobileImg = sectionData.mobileImage || desktopImg;

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="start-now">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Image */}
          {desktopImg && (
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
                <picture>
                  {sectionData.mobileImage && (
                    <source media="(max-width: 640px)" srcSet={mobileImg} />
                  )}
                  <img
                    src={desktopImg}
                    alt={sectionData.title || "Hair and Scalp Care"}
                    className="w-full h-52 sm:h-80 lg:h-96 object-cover object-center"
                  />
                </picture>
              </div>
            </div>
          )}

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              {sectionData.overline && (
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
                  {sectionData.overline}
                </span>
              )}
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                {sectionData.title}
              </h2>
              {sectionData.subtitle && (
                <p className="text-sm sm:text-base text-gray-700 font-medium">
                  {sectionData.subtitle}
                </p>
              )}
            </div>

            {sectionData.content && (
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                {sectionData.content}
              </p>
            )}

            {/* Bullet Points */}
            {sectionData.bulletPoints && sectionData.bulletPoints.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {sectionData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-dark mt-2 flex-shrink-0" />
                    <div>
                      {point.title && (
                        <h4 className="text-sm font-bold text-gray-900 inline mr-1.5">
                          {point.title}:
                        </h4>
                      )}
                      <span className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {point.description || point}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
