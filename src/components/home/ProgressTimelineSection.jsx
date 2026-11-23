import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function ProgressTimelineSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.progressTimeline || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="progress">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
            {sectionData.overline || 'Realistic Expectations'}
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight uppercase">
            {sectionData.title || 'Every Journey Takes Time'}
          </h2>
          <p className="text-sm sm:text-base text-gray-700">
            {sectionData.subtitle || 'What to realistically expect with consistent daily application. Results vary by individual.'}
          </p>

          {/* Ethical Disclaimer */}
          <div className="inline-flex items-center gap-2 p-2.5 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium mt-2">
            <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span>{sectionData.disclaimer || 'Important: Consistent twice-daily application is essential. Individual biological response, timeline, and degree of recovery naturally vary.'}</span>
          </div>
        </div>

        {/* Timeline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs hover:border-brand-dark transition-all flex flex-col justify-between group"
            >
              {/* Image Preview if provided in JSON */}
              {stage.image ? (
                <div className="relative aspect-4/3 overflow-hidden bg-gray-50 border-b border-gray-100">
                  <img
                    src={stage.image}
                    alt={stage.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-brand-dark text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                    {stage.period || stage.stage}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <div className="bg-brand-dark text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-xs">
                    {stage.period || stage.stage}
                  </div>
                </div>
              )}

              {/* Text Content */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                    {stage.stage || `Stage 0${idx + 1}`}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm sm:text-base mt-0.5">
                    {stage.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-1.5">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-gray-100 text-xs font-semibold text-gray-500 flex items-center justify-between">
                  <span>{sectionData.milestoneLabel || 'Milestone:'}</span>
                  <span className="text-gray-900 font-bold">{stage.period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
