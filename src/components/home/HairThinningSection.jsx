import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HairThinningSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.hairThinning || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  const getStageIcon = (iconName, index) => {
    switch (iconName) {
      case 'ShieldCheck':
        return <ShieldCheck className="w-6 h-6 text-emerald-600" />;
      case 'TrendingDown':
        return <TrendingDown className="w-6 h-6 text-amber-600" />;
      case 'AlertCircle':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return index === 0 ? (
          <ShieldCheck className="w-6 h-6 text-emerald-600" />
        ) : index === 1 ? (
          <TrendingDown className="w-6 h-6 text-amber-600" />
        ) : (
          <AlertCircle className="w-6 h-6 text-red-600" />
        );
    }
  };

  return (
    <section className="py-16 sm:py-24 bg-brand-light border-y border-brand-border/60" id="hair-thinning">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            Biological Progression
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight">
            {sectionData.title || 'Understanding Hair Thinning'}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {sectionData.subtitle || 'Why hair loses density and how early detection saves thinning crowns & temples.'}
          </p>
          {sectionData.intro && (
            <p className="text-xs sm:text-sm text-gray-600 pt-1 max-w-2xl mx-auto">
              {sectionData.intro}
            </p>
          )}
        </div>

        {/* 3 Visual Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl p-6 sm:p-7 border border-brand-border shadow-sm hover:shadow-card-hover transition-all duration-300 flex flex-col justify-between relative overflow-hidden"
            >
              {/* Top Accent Bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 ${
                  idx === 0 ? 'bg-emerald-500' : idx === 1 ? 'bg-amber-500' : 'bg-red-500'
                }`}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    {getStageIcon(stage.icon, idx)}
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                    {stage.badge || `Stage ${stage.stageNumber || idx + 1}`}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-brand-accent">
                    Stage {stage.stageNumber || `0${idx + 1}`}
                  </span>
                  <h3 className="text-lg font-bold text-brand-dark mt-0.5">
                    {stage.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between text-xs font-medium">
                <span className="text-gray-500">
                  {idx === 0 ? 'Optimal Growth' : idx === 1 ? 'Early Signal' : 'Medical Action'}
                </span>
                <span className={`font-bold ${idx === 0 ? 'text-emerald-600' : idx === 1 ? 'text-amber-600' : 'text-red-600'}`}>
                  {idx === 0 ? '85% Anagen' : idx === 1 ? 'Miniaturizing' : 'Urgent'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            to={sectionData.ctaLink || '/shop'}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand-accent hover:bg-blue-600 text-white text-sm font-bold shadow-md transition-all"
          >
            <span>{sectionData.ctaText || 'Start Recovery Routine'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
