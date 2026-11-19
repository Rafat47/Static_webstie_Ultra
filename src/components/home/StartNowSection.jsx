import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function StartNowSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.startNow || {};

  if (sectionData.enabled === false) return null;

  return (
    <section className="py-16 sm:py-24 bg-white" id="start-now">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Image with Subtle Frame */}
          <div className="lg:col-span-5 order-2 lg:order-1">
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-brand-border group">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80'}
                alt="Hair and Scalp Health Care"
                className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/60 via-transparent to-transparent flex items-end p-6">
                <div className="text-white">
                  <p className="text-xs font-semibold uppercase tracking-wider text-brand-accent">
                    Scalp Wellness
                  </p>
                  <p className="text-sm font-bold">
                    Preserving active follicles before permanent dormancy.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Educational Copy & CTAs */}
          <div className="lg:col-span-7 order-1 lg:order-2 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
                Early Action Strategy
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight leading-tight">
                {sectionData.title || "It's Not Too Late to Start Now."}
              </h2>
              <p className="text-sm sm:text-base text-brand-muted font-medium">
                {sectionData.subtitle || 'Recognizing and addressing hair thinning early makes a significant biological difference.'}
              </p>
            </div>

            <p className="text-sm text-gray-700 leading-relaxed">
              {sectionData.content || 'Hair thinning is a progressive biological process. DHT (Dihydrotestosterone) gradually binds to vulnerable receptors, shrinking follicles and shortening growth cycles. However, as long as hair follicles remain alive, targeted topical stimulation can help restore blood flow, nutrients, and cellular regeneration.'}
            </p>

            {/* Bullet Points */}
            {sectionData.bulletPoints && sectionData.bulletPoints.length > 0 && (
              <div className="space-y-3 pt-2">
                {sectionData.bulletPoints.map((point, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-gray-700 font-medium">{point}</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <div className="pt-4">
              <Link
                to={sectionData.ctaLink || '/shop'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-sm font-bold shadow-md hover:shadow-lg transition-all group"
              >
                <span>{sectionData.ctaText || 'Explore Hair Care Products'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
