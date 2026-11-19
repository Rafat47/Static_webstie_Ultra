import React from 'react';
import { Calendar, AlertCircle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function ProgressTimelineSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.progressTimeline || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-16 sm:py-24 bg-brand-light border-y border-brand-border/60" id="progress">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            Realistic Expectations
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight">
            {sectionData.title || 'Every Journey Takes Time'}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {sectionData.subtitle || 'What to realistically expect with consistent daily application. Results vary by individual.'}
          </p>

          {/* Ethical Disclaimer */}
          <div className="inline-flex items-center gap-2 p-2.5 px-4 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-medium">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{sectionData.disclaimer || 'Important: Consistent application is essential. Individual biological response and timelines vary.'}</span>
          </div>
        </div>

        {/* Timeline Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-brand-border overflow-hidden shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between group"
            >
              {/* Image Preview with Highlight Badge */}
              <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                <img
                  src={stage.image || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80'}
                  alt={stage.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-2.5 left-2.5 bg-brand-dark/90 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-md shadow flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-brand-accent" />
                  <span>{stage.period || stage.stage}</span>
                </div>
                {stage.highlight && (
                  <div className="absolute bottom-2.5 right-2.5 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    {stage.highlight}
                  </div>
                )}
              </div>

              {/* Text Info */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-[11px] font-bold text-brand-accent uppercase tracking-wider">
                    {stage.stage || `Stage 0${idx + 1}`}
                  </span>
                  <h4 className="font-bold text-brand-text text-base mt-0.5 leading-snug">
                    {stage.title}
                  </h4>
                  <p className="text-xs text-brand-muted mt-2 leading-relaxed">
                    {stage.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] font-semibold text-gray-500 flex items-center justify-between">
                  <span>Milestone</span>
                  <span className="text-brand-dark">{stage.period}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
