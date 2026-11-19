import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function ProgressTimelineSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.progressTimeline || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100" id="progress">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Realistic Expectations
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {sectionData.title || 'Every Journey Takes Time'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {sectionData.subtitle || 'What to realistically expect with consistent daily application. Results vary by individual.'}
          </p>

          {/* Ethical Disclaimer */}
          <div className="inline-flex items-center gap-2 p-2 rounded bg-gray-50 border border-gray-200 text-gray-700 text-xs font-medium mt-2">
            <AlertCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
            <span>{sectionData.disclaimer || 'Important: Consistent application is essential. Individual biological response and timelines vary.'}</span>
          </div>
        </div>

        {/* Timeline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-2xs hover:border-black transition-all flex flex-col justify-between"
            >
              {/* Image Preview */}
              <div className="relative aspect-4/3 overflow-hidden bg-gray-50">
                <img
                  src={stage.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'}
                  alt={stage.title}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                  {stage.period || stage.stage}
                </div>
              </div>

              {/* Text Content */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                    {stage.stage || `Stage 0${idx + 1}`}
                  </span>
                  <h4 className="font-bold text-gray-900 text-sm mt-0.5">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed mt-1">
                    {stage.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 text-[11px] font-semibold text-gray-500 flex items-center justify-between">
                  <span>Milestone:</span>
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
