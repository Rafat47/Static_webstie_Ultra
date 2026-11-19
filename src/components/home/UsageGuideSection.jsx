import React from 'react';
import { ShieldAlert, Droplets } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function UsageGuideSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.usageGuide || {};

  if (sectionData.enabled === false) return null;

  const steps = sectionData.steps || [];

  // Default step-specific illustrative imagery if not provided in config
  const defaultStepImages = [
    // Step 1: Wash & Dry Scalp
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    // Step 2: Derma Roller Micro-Needling
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&auto=format&fit=crop&q=80',
    // Step 3: Precision Dropper Application
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600&auto=format&fit=crop&q=80',
    // Step 4: Gentle Scalp Massage
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=600&auto=format&fit=crop&q=80',
    // Step 5: Consistency Morning & Night
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&auto=format&fit=crop&q=80',
    // Step 6: Maintain & Monitor Progress
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80'
  ];

  return (
    <section className="py-10 sm:py-16 bg-white border-b border-gray-100" id="how-to-use">
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-2">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500">
            Application Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight uppercase">
            {sectionData.title || 'How to Use Minoxidil & Derma Roller'}
          </h2>
          <p className="text-sm sm:text-base text-gray-700">
            {sectionData.subtitle || 'Step-by-step visual routine for maximum follicular absorption and proven safety.'}
          </p>
        </div>

        {/* 
          Visual Step Cards:
          - 2 Rows with 3 Cards each on Desktop (grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8)
          - Double-size prominent images (h-56 sm:h-64) for maximum clarity and visual understanding
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {steps.map((step, idx) => {
            const stepImg = step.image || defaultStepImages[idx % defaultStepImages.length];

            return (
              <div
                key={idx}
                className="bg-white rounded-xl border border-gray-200 hover:border-black transition-all overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-subtle group"
              >
                {/* Double-Size Prominent Step Image on Top */}
                <div className="w-full h-56 sm:h-64 overflow-hidden bg-gray-50 relative border-b border-gray-100">
                  <img
                    src={stepImg}
                    alt={step.title}
                    className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                  />
                  <div className="absolute top-3 left-3 bg-black text-white font-mono font-bold text-xs sm:text-sm px-3 py-1 rounded shadow-xs">
                    STEP {step.stepNumber || `0${idx + 1}`}
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-2.5">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-gray-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Safety Notice Callout at the Bottom */}
        {sectionData.safetyNotice && (
          <div className="mt-8 p-4 sm:p-5 rounded-lg bg-amber-50 border border-amber-200 flex gap-3 text-xs sm:text-sm text-amber-950 leading-relaxed font-medium">
            <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Medical Safety Instructions: </strong>
              {sectionData.safetyNotice}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
