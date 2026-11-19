import React from 'react';
import { ShieldAlert, Droplets, CheckCircle, Info } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function UsageGuideSection() {
  const { config } = useConfig();
  const sectionData = config?.sections?.usageGuide || {};

  if (sectionData.enabled === false) return null;

  const steps = sectionData.steps || [];

  return (
    <section className="py-16 sm:py-24 bg-white" id="how-to-use">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-accent">
            Application Protocol
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-brand-dark tracking-tight">
            {sectionData.title || 'How to Use Minoxidil'}
          </h2>
          <p className="text-sm sm:text-base text-brand-muted">
            {sectionData.subtitle || 'Simple 5-step daily routine for maximum absorption and safety.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Numbered Steps */}
          <div className="lg:col-span-7 space-y-5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="p-4 sm:p-5 rounded-xl bg-brand-light border border-brand-border/80 flex items-start gap-4 hover:border-brand-accent/50 transition-all group"
              >
                {/* Step Number Circle */}
                <div className="w-10 h-10 rounded-full bg-brand-dark text-white font-extrabold text-sm flex items-center justify-center flex-shrink-0 group-hover:bg-brand-accent transition-colors shadow-sm">
                  {step.stepNumber || `0${idx + 1}`}
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm sm:text-base font-bold text-brand-dark">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}

            {/* Safety Information Callout */}
            {sectionData.safetyNotice && (
              <div className="p-4 rounded-xl bg-amber-50/80 border border-amber-200 flex gap-3 text-xs text-amber-900 leading-relaxed font-medium">
                <ShieldAlert className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Safety Instructions: </span>
                  {sectionData.safetyNotice}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Visual Infographic & Application Guide */}
          <div className="lg:col-span-5">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-brand-border bg-brand-navy p-3 text-white">
              <img
                src={sectionData.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800&auto=format&fit=crop&q=80'}
                alt="Minoxidil Calibrated Dropper Application"
                className="w-full h-80 sm:h-96 object-cover rounded-xl shadow-inner"
              />

              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2 text-brand-accent font-bold text-xs uppercase tracking-wider">
                  <Droplets className="w-4 h-4" />
                  <span>Precision Application</span>
                </div>
                <h4 className="text-base font-bold text-white">
                  1 mL Twice Daily Routine
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed">
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

