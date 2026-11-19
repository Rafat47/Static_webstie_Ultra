import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Sparkles, Star, Award, CheckCircle2 } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function HeroSection() {
  const { config } = useConfig();
  const hero = config?.hero || {};

  const handleScrollToGuide = (e) => {
    e.preventDefault();
    const el = document.querySelector('#how-to-use');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative bg-brand-dark text-white pt-10 sm:pt-16 pb-20 sm:pb-28 overflow-hidden" id="hero">
      {/* Background Radial Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-brand-accent/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headline, Description & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-blue-200">
              <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
              <span>{hero.badge || '100% Authentic Guaranteed'}</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              {hero.title || 'Your Hair Care Journey Starts Here.'}
            </h1>

            {/* Supporting Description */}
            <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              {hero.subtitle || 'Reactivate dormant hair follicles, increase scalp blood microcirculation, and reclaim thicker hair with dermatologically proven Minoxidil 5% and micro-needling systems.'}
            </p>

            {/* CTA Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5">
              <Link
                to={hero.primaryBtnLink || '/shop'}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-brand-accent hover:bg-blue-600 text-white font-bold text-sm sm:text-base shadow-lg shadow-brand-accent/25 hover:shadow-brand-accent/40 transition-all flex items-center justify-center gap-2 group"
              >
                <span>{hero.primaryBtnText || 'Shop Now'}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              <a
                href={hero.secondaryBtnLink || '#how-to-use'}
                onClick={handleScrollToGuide}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm sm:text-base border border-white/15 backdrop-blur-md transition-all flex items-center justify-center"
              >
                {hero.secondaryBtnText || 'How to Use'}
              </a>
            </div>

            {/* Customer Rating & Social Proof */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 text-xs text-gray-300">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                ))}
              </div>
              <span className="font-medium text-gray-200">
                {hero.rating || '4.9 / 5.0 Rating across Bangladesh'}
              </span>
            </div>
          </div>

          {/* Right Column: Premium Hero Product Imagery */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Decorative Frame */}
              <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-gradient-to-b from-white/10 to-transparent p-2.5 shadow-2xl backdrop-blur-xs">
                <img
                  src={hero.heroImage || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=1000&auto=format&fit=crop&q=80'}
                  alt="Minoxidil 5% & Derma Roller Solution"
                  className="w-full h-80 sm:h-96 object-cover rounded-xl shadow-inner"
                />

                {/* Floating Badge 1: Verification */}
                <div className="absolute top-6 left-6 bg-brand-dark/90 backdrop-blur-md border border-white/15 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <div className="text-[11px]">
                    <p className="font-bold text-white">Genuine Seal</p>
                    <p className="text-gray-300 text-[10px]">Verified Batch</p>
                  </div>
                </div>

                {/* Floating Badge 2: Cash on Delivery */}
                <div className="absolute bottom-6 right-6 bg-brand-dark/90 backdrop-blur-md border border-white/15 px-3 py-2 rounded-lg shadow-lg flex items-center gap-2">
                  <Award className="w-4 h-4 text-brand-accent" />
                  <div className="text-[11px]">
                    <p className="font-bold text-white">Cash on Delivery</p>
                    <p className="text-gray-300 text-[10px]">Nationwide BD</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
