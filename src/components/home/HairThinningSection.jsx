import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function HairThinningSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.hairThinning || {};

  if (sectionData.enabled === false) return null;

  const stages = sectionData.stages || [];

  // Default stage images if not provided in config
  const defaultStageImages = [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80'
  ];

  return (
    <section className="py-10 sm:py-16 bg-white border-b border-gray-100" id="hair-thinning">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
            Biological Progression
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight uppercase">
            {sectionData.title || 'Understanding Hair Thinning'}
          </h2>
          <p className="text-sm sm:text-base text-gray-700">
            {sectionData.subtitle || 'Visual guide: why follicles lose diameter and how timely topical stimulation prevents permanent loss.'}
          </p>
        </div>

        {/* 3 Visual Stage Cards with Real Photography / Illustrations */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {stages.map((stage, idx) => {
            const stageImg = stage.image || defaultStageImages[idx % defaultStageImages.length];

            return (
              <div
                key={idx}
                className="bg-white rounded-lg border border-gray-200 hover:border-black transition-all flex flex-col justify-between overflow-hidden shadow-2xs hover:shadow-subtle group"
              >
                {/* Visual Image Stage Header */}
                <div className="w-full h-40 sm:h-48 overflow-hidden bg-gray-50 border-b border-gray-100 relative">
                  <img
                    src={stageImg}
                    alt={stage.title}
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black/80 backdrop-blur-xs text-white text-[11px] font-mono font-bold px-2 py-0.5 rounded shadow-xs">
                    STAGE 0{idx + 1}
                  </div>
                  <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-xs text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-xs border border-gray-200">
                    {stage.badge || `Phase ${idx + 1}`}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                      {stage.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {stage.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-semibold text-gray-500">
                    <span>Follicle Health:</span>
                    <span className="text-gray-900 font-bold">
                      {idx === 0 ? 'Active Anagen' : idx === 1 ? 'Miniaturizing' : 'Action Required'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
