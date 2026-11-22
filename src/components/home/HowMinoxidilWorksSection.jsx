import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function HowMinoxidilWorksSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.howMinoxidilWorks || {};

  if (sectionData.enabled === false) return null;

  const points = sectionData.mechanismPoints || [];
  const desktopImg = sectionData.desktopImage || sectionData.image || '';
  const mobileImg = sectionData.mobileImage || desktopImg;

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="how-it-works">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Educational Content & Mechanism Cards */}
          <div className="lg:col-span-7 space-y-5">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
                Dermatological Science
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-tight uppercase">
                {sectionData.title || 'How Does Minoxidil Work?'}
              </h2>
              <p className="text-sm sm:text-base text-gray-700 font-medium">
                {sectionData.subtitle || 'The science behind follicular reactivation and prolonged Anagen growth cycles.'}
              </p>
            </div>

            {/* Scientific Explanation Steps with Readable Text */}
            <div className="space-y-3 pt-1">
              {points.map((pt, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg bg-white border border-gray-200 hover:border-brand-dark transition-colors flex gap-3.5 items-start shadow-2xs"
                >
                  <div className="w-8 h-8 rounded bg-gray-100 text-gray-900 text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                    0{idx + 1}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm sm:text-base font-bold text-gray-900">{pt.title}</h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {pt.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Clinical Authority Note */}
            {sectionData.scienceNote && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 text-xs sm:text-sm text-gray-800 leading-relaxed font-medium">
                <strong>Clinical Authority: </strong> {sectionData.scienceNote}
              </div>
            )}
          </div>

          {/* Right Column: Visual Anatomy Illustration with Restrained Mobile Height */}
          {desktopImg && (
            <div className="lg:col-span-5">
              <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
                <picture>
                  {sectionData.mobileImage && (
                    <source media="(max-width: 640px)" srcSet={mobileImg} />
                  )}
                  <img
                    src={desktopImg}
                    alt="Hair follicle cellular activity and microcirculation"
                    className="w-full h-52 sm:h-80 lg:h-96 object-cover object-center"
                  />
                </picture>
                <div className="p-4 sm:p-5 bg-white border-t border-gray-200 space-y-1.5">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    Follicular Anatomy
                  </span>
                  <h4 className="text-sm sm:text-base font-bold text-gray-900">
                    Targeted Microvascular Circulation
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                    Topical application widens dormant scalp capillaries, delivering oxygen directly to hair dermal papilla roots.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
