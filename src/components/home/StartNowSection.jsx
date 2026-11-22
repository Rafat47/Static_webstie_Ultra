import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function StartNowSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.startNow || {};

  if (sectionData.enabled === false) return null;

  const desktopImg = sectionData.desktopImage || sectionData.image || '';
  const mobileImg = sectionData.mobileImage || desktopImg;

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="start-now">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Clean Image Presentation with Art Direction & Restrained Mobile Height */}
          {desktopImg && (
            <div className="lg:col-span-5 order-2 lg:order-1">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
                <picture>
                  {sectionData.mobileImage && (
                    <source media="(max-width: 640px)" srcSet={mobileImg} />
                  )}
                  <img
                    src={desktopImg}
                    alt="Hair and Scalp Care"
                    className="w-full h-52 sm:h-80 lg:h-96 object-cover object-center"
                  />
                </picture>
              </div>
            </div>
          )}

          {/* Right Column: Editorial Copy with Larger, Readable Typography */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 sm:space-y-5">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
                Early Action Strategy
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                {sectionData.title || "It's Not Too Late to Start Now."}
              </h2>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                {sectionData.subtitle || 'Recognizing and addressing hair thinning early makes a significant biological difference.'}
              </p>
            </div>

            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              {sectionData.content || 'Hair thinning is a progressive biological process. DHT gradually binds to vulnerable receptors, shrinking follicles and shortening growth cycles. However, as long as hair follicles remain alive, targeted topical stimulation can help restore blood flow, nutrients, and cellular regeneration.'}
            </p>

            {/* Bullet Points */}
            {sectionData.bulletPoints && sectionData.bulletPoints.length > 0 && (
              <div className="space-y-2.5 pt-1">
                {sectionData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm sm:text-base text-gray-800 font-medium">{point}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              <Link
                to={sectionData.ctaLink || '/shop'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded bg-brand-dark hover:bg-brand-navy text-white text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <span>{sectionData.ctaText || 'Explore Hair Care Products'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
