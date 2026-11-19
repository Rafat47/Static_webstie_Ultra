import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, TrendingDown, AlertCircle, ArrowRight } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HairThinningSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.hairThinning || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100" id="hair-thinning">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Biological Progression
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {sectionData.title || 'Understanding Hair Thinning'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {sectionData.subtitle || 'Why hair loses density and how early detection saves thinning crowns & temples.'}
          </p>
        </div>

        {/* 3 Visual Stages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {stages.map((stage, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-5 sm:p-6 border border-gray-200 hover:border-black transition-all flex flex-col justify-between space-y-4 shadow-2xs"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-gray-400">
                    STAGE 0{idx + 1}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                    {stage.badge || `Phase ${idx + 1}`}
                  </span>
                </div>

                <h3 className="text-base font-bold text-gray-900">
                  {stage.title}
                </h3>

                <p className="text-xs text-gray-600 leading-relaxed">
                  {stage.description}
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                <span>Follicle State:</span>
                <span className="text-gray-900 font-bold">
                  {idx === 0 ? 'Active Anagen' : idx === 1 ? 'Miniaturizing' : 'Action Required'}
                </span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
