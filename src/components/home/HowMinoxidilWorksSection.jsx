import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Activity, Zap, RefreshCw, Layers } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HowMinoxidilWorksSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.howMinoxidilWorks || {};

  if (sectionData.enabled === false) return null;

  const points = sectionData.mechanismPoints || [];

  const icons = [
    <Activity className="w-5 h-5 text-brand-accent" />,
    <Zap className="w-5 h-5 text-amber-500" />,
    <RefreshCw className="w-5 h-5 text-emerald-500" />,
    <Layers className="w-5 h-5 text-indigo-500" />
  ];

  return (
    <section className="py-16 sm:py-24 bg-white" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Educational Content & Mechanism Cards */}
          <div className="lg:col-span-7 space-y-6">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
                Dermatological Science
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight leading-tight">
                {sectionData.title || 'How Does Minoxidil Work?'}
              </h2>
              <p className="text-sm sm:text-base text-brand-muted font-medium">
                {sectionData.subtitle || 'The science behind follicular reactivation and prolonged Anagen growth.'}
              </p>
            </div>

            {/* Scientific Explanation Steps */}
            <div className="space-y-4 pt-2">
              {points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-brand-light border border-brand-border/70 flex gap-4 items-start hover:border-brand-accent/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                    {icons[idx % icons.length]}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-accent">Step {pt.step || `0${idx + 1}`}</span>
                      <h4 className="text-sm sm:text-base font-bold text-brand-dark">{pt.title}</h4>
                    </div>
                    <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Dermatological Authority Note */}
            {sectionData.scienceNote && (
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/60 text-xs text-blue-900 leading-relaxed font-medium">
                💡 <span className="font-bold">Clinical Insight:</span> {sectionData.scienceNote}
              </div>
            )}

            {/* CTA Button */}
            <div className="pt-2">
              <Link
                to={sectionData.ctaLink || '/shop'}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-sm font-bold shadow-md transition-all group"
              >
                <span>{sectionData.ctaText || 'View Minoxidil Solutions'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Right Column: Visual Anatomy Illustration */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-brand-border group">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80'}
                alt="Hair follicle cellular activity and microcirculation"
                className="w-full h-80 sm:h-96 lg:h-[450px] object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/80 via-brand-dark/20 to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-accent">
                  Follicular Anatomy
                </span>
                <h4 className="text-base font-bold">
                  Targeted Microvascular Circulation
                </h4>
                <p className="text-xs text-gray-200 mt-1">
                  Topical application widens dormant scalp capillaries, delivering oxygen and amino acids directly to the hair dermal papilla.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
