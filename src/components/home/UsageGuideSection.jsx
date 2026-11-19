import React from 'react';
import { ShieldAlert, Droplets } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function UsageGuideSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.usageGuide || {};

  if (sectionData.enabled === false) return null;

  const steps = sectionData.steps || [];

  return (
    <section className="py-12 sm:py-16 bg-white border-b border-gray-100" id="how-to-use">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-8 sm:mb-12 space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
            Application Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {sectionData.title || 'How to Use Minoxidil'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600">
            {sectionData.subtitle || 'Simple 5-step daily routine for maximum absorption and safety.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Numbered Steps */}
          <div className="lg:col-span-7 space-y-3.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-3.5 sm:p-4 rounded-lg bg-white border border-gray-200 hover:border-black transition-colors flex items-start gap-3.5 shadow-2xs"
              >
                <div className="w-8 h-8 rounded bg-black text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {step.stepNumber || `0${idx + 1}`}
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900">
                    {step.title}
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Safety Notice Callout */}
            {sectionData.safetyNotice && (
              <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex gap-2.5 text-xs text-amber-900 leading-relaxed font-medium">
                <ShieldAlert className="w-4 h-4 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-950">Safety Instructions: </strong>
                  {sectionData.safetyNotice}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Dropper Application */}
          <div className="lg:col-span-5">
            <div className="rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-2xs">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'}
                alt="Minoxidil Calibrated Dropper Application"
                className="w-full h-72 sm:h-96 object-cover object-center"
              />
              <div className="p-4 bg-white border-t border-gray-200 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-900 font-bold text-xs uppercase tracking-wider">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  <span>Precision 1 mL Application</span>
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  Twice Daily Scalp Routine
                </h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  Apply morning and evening directly to the scalp. Use 0.5mm Derma Roller 1-2 times weekly before applying for enhanced follicular stimulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
