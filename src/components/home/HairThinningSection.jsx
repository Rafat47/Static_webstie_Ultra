import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function HairThinningSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.hairThinning;

  if (!sectionData || sectionData.enabled === false || !sectionData.title) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="hair-thinning">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-2">
          {sectionData.overline && (
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
              {sectionData.overline}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight uppercase">
            {sectionData.title}
          </h2>
          {sectionData.subtitle && (
            <p className="text-sm sm:text-base text-gray-700">
              {sectionData.subtitle}
            </p>
          )}
        </div>

        {/* Stages Grid */}
        {stages.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {stages.map((stage, idx) => {
              const stageImg = stage.image || '';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 hover:border-brand-dark transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-subtle group h-full min-h-[380px] lg:min-h-[420px]"
                >
                  {stageImg ? (
                    <div className="w-full h-56 sm:h-64 overflow-hidden bg-gray-50 border-b border-gray-100 relative">
                      <img
                        src={stageImg}
                        alt={stage.title || `Stage 0${idx + 1}`}
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-brand-dark/90 backdrop-blur-xs text-white text-xs font-mono font-bold px-2.5 py-1 rounded shadow-xs">
                        STAGE 0{idx + 1}
                      </div>
                      {stage.badge && (
                        <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-xs border border-gray-200">
                          {stage.badge}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-5 pb-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="bg-brand-dark text-white text-xs font-mono font-bold px-2.5 py-1 rounded shadow-xs">
                        STAGE 0{idx + 1}
                      </div>
                      {stage.badge && (
                        <div className="bg-white text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded shadow-xs border border-gray-200">
                          {stage.badge}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Stage Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                        {stage.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {stage.description}
                      </p>
                    </div>

                    {stage.follicleStatus && (
                      <div className="pt-3 border-t border-gray-100 text-xs">
                        <span className="font-bold text-gray-800 uppercase tracking-wider text-[11px] block mb-0.5">
                          Follicle State:
                        </span>
                        <span className="text-gray-600 font-medium">{stage.follicleStatus}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
