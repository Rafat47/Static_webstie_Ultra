import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function ProgressTimelineSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.progressTimeline;

  if (!sectionData || sectionData.enabled === false || !sectionData.title) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="progress">
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

          {/* Ethical Disclaimer */}
          {sectionData.disclaimer && (
            <div className="inline-flex items-center gap-2 p-2.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium mt-2">
              <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span>{sectionData.disclaimer}</span>
            </div>
          )}
        </div>

        {/* Timeline Cards Grid */}
        {stages.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
            {stages.map((stage, idx) => (
              <div
                key={idx}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs hover:border-brand-dark transition-all flex flex-col justify-between group"
              >
                {stage.image ? (
                  <div className="relative aspect-4/3 overflow-hidden bg-gray-50 border-b border-gray-100">
                    <img
                      src={stage.image}
                      alt={stage.title || stage.period || `Stage ${idx + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    {(stage.period || stage.stage) && (
                      <div className="absolute top-2.5 left-2.5 bg-brand-dark text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {stage.period || stage.stage}
                      </div>
                    )}
                  </div>
                ) : (
                  (stage.period || stage.stage) && (
                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="bg-brand-dark text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                        {stage.period || stage.stage}
                      </div>
                    </div>
                  )
                )}

                {/* Stage Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-gray-900 leading-snug">
                      {stage.title}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  {stage.biologicalProcess && (
                    <div className="pt-2 border-t border-gray-100 text-[11px]">
                      <span className="font-bold text-gray-700 block mb-0.5 uppercase tracking-wider text-[10px]">
                        Mechanism:
                      </span>
                      <span className="text-gray-500 font-medium">{stage.biologicalProcess}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
