import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function StartNowSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.startNow || {};

  if (sectionData.enabled === false) return null;

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100" id="start-now">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Clean Image Presentation */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'}
                alt="Hair and Scalp Care"
                className="w-full h-72 sm:h-96 object-cover object-center"
              />
            </div>
          </div>

          {/* Right Column: Editorial Copy */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-4 sm:space-y-5">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Early Action Strategy
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {sectionData.title || "It's Not Too Late to Start Now."}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {sectionData.subtitle || 'Recognizing and addressing hair thinning early makes a significant biological difference.'}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
              {sectionData.content || 'Hair thinning is a progressive biological process. DHT gradually binds to vulnerable receptors, shrinking follicles and shortening growth cycles. However, as long as hair follicles remain alive, targeted topical stimulation can help restore blood flow, nutrients, and cellular regeneration.'}
            </p>

            {/* Bullet Points */}
            {sectionData.bulletPoints && sectionData.bulletPoints.length > 0 && (
              <div className="space-y-2 pt-1">
                {sectionData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-2">
              <Link
                to={sectionData.ctaLink || '/shop'}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-black hover:bg-gray-800 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                <span>{sectionData.ctaText || 'Explore Hair Care Products'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
