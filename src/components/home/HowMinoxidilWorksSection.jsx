import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Activity, Zap, RefreshCw, Layers } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HowMinoxidilWorksSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.howMinoxidilWorks || {};

  if (sectionData.enabled === false) return null;

  const points = sectionData.mechanismPoints || [];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100" id="how-it-works">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Educational Content & Mechanism Cards */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Dermatological Science
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                {sectionData.title || 'How Does Minoxidil Work?'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {sectionData.subtitle || 'The science behind follicular reactivation and prolonged Anagen growth.'}
              </p>
            </div>

            {/* Scientific Explanation Steps */}
            <div className="space-y-3 pt-1">
              {points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-3.5 sm:p-4 rounded-lg bg-white border border-gray-200 hover:border-black transition-colors flex gap-3.5 items-start shadow-2xs"
                >
                  <div className="w-7 h-7 rounded bg-gray-100 text-gray-900 text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                    0{idx + 1}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-xs sm:text-sm font-bold text-gray-900">{pt.title}</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Authority Note */}
            {sectionData.scienceNote && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-700 leading-relaxed font-medium">
                <strong>Clinical Insight:</strong> {sectionData.scienceNote}
              </div>
            )}
          </div>

          {/* Right Column: Visual Anatomy Illustration */}
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&auto=format&fit=crop&q=80'}
                alt="Hair follicle cellular activity and microcirculation"
                className="w-full h-72 sm:h-96 object-cover object-center"
              />
              <div className="p-4 bg-white border-t border-gray-200 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Follicular Anatomy
                </span>
                <h4 className="text-sm font-bold text-gray-900">
                  Targeted Microvascular Circulation
                </h4>
                <p className="text-xs text-gray-600">
                  Topical application widens dormant scalp capillaries, delivering oxygen directly to hair dermal papilla roots.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
