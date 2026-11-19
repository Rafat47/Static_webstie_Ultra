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
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=80',
    // Step 2: Derma Roller
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=500&auto=format&fit=crop&q=80',
    // Step 3: Precision Dropper
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&auto=format&fit=crop&q=80',
    // Step 4: Gentle Massage
    'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=500&auto=format&fit=crop&q=80',
    // Step 5: Consistency
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&auto=format&fit=crop&q=80'
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
          - Image on TOP of each step card so customer visualizes the action immediately
          - Text acts as concise supporting guidance
          - Desktop: 5-column grid (sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5)
          - Mobile: Smooth horizontal swipe or 2-column cards
        */}
        <div
          className="flex sm:grid sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-4 lg:gap-5 overflow-x-auto sm:overflow-visible no-scrollbar pb-3 sm:pb-0 snap-x snap-mandatory"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {steps.map((step, idx) => {
            const stepImg = step.image || defaultStepImages[idx % defaultStepImages.length];

            return (
              <div
                key={idx}
                className="w-[240px] sm:w-auto flex-shrink-0 sm:flex-shrink snap-start bg-white rounded-lg border border-gray-200 hover:border-black transition-all overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-subtle group"
              >
                {/* Step Image on Top */}
                <div className="w-full h-36 sm:h-40 overflow-hidden bg-gray-50 relative border-b border-gray-100">
                  <img
                    src={stepImg}
                    alt={step.title}
                    className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-300"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-black text-white font-mono font-bold text-xs px-2.5 py-1 rounded shadow-xs">
                    STEP {step.stepNumber || `0${idx + 1}`}
                  </div>
                </div>

                {/* Step Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-600 leading-relaxed mt-1.5 line-clamp-4">
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
