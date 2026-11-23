import React from 'react';
import { useConfig } from '../../context/ConfigContext';

export default function UsageGuideSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.usageGuide;

  if (!sectionData || sectionData.enabled === false || !sectionData.title) return null;

  const steps = sectionData.steps || [];

  return (
    <section className="py-10 sm:py-16 bg-[#F8FAFD] border-b border-gray-100" id="how-to-use">
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

        {/* Visual Step Cards */}
        {steps.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {steps.map((step, idx) => {
              const stepImg = step.image || '';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl border border-gray-200 hover:border-brand-dark transition-all overflow-hidden flex flex-col justify-between shadow-2xs hover:shadow-subtle group"
                >
                  {stepImg ? (
                    <div className="w-full h-56 sm:h-64 overflow-hidden bg-gray-50 relative border-b border-gray-100">
                      <img
                        src={stepImg}
                        alt={step.title || `Step ${idx + 1}`}
                        className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-300"
                      />
                      <div className="absolute top-3 left-3 bg-brand-dark text-white font-mono font-bold text-xs sm:text-sm px-3 py-1 rounded shadow-xs">
                        STEP {step.stepNumber || `0${idx + 1}`}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                      <div className="bg-brand-dark text-white font-mono font-bold text-xs px-2.5 py-1 rounded shadow-xs">
                        STEP {step.stepNumber || `0${idx + 1}`}
                      </div>
                    </div>
                  )}

                  {/* Step Content */}
                  <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-2.5">
                    <div className="space-y-1.5">
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                        {step.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {step.proTip && (
                      <div className="pt-2 text-xs font-medium text-gray-700 border-t border-gray-100 flex items-start gap-1.5">
                        <span className="font-bold text-brand-dark uppercase tracking-wider text-[10px]">
                          PRO TIP:
                        </span>
                        <span>{step.proTip}</span>
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
