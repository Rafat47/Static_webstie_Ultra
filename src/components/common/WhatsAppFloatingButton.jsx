import React from 'react';
import { MessageCircle, ArrowUp } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';
import { metaEvents } from '../../utils/metaPixel';

export default function WhatsAppFloatingButton() {
  const { config } = useConfig();
  const siteSettings = config?.siteSettings || {};
  const whatsappNum = siteSettings.whatsappNumber?.replace(/[^0-9]/g, '') || '8801711234567';
  const defaultMsg = siteSettings.whatsappDefaultMessage || 'Hello Regrow Hair Care BD, I want to learn more about your authentic Minoxidil packages.';
  const message = encodeURIComponent(defaultMsg);
  const buttonLabel = siteSettings.whatsappButtonLabel || 'Chat with Us';

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleWhatsAppClick = () => {
    metaEvents.contact('WhatsApp', { channel: 'floating_button' });
  };

  return (
    <div className="fixed bottom-6 right-5 sm:right-6 z-40 flex flex-col items-center gap-2.5">
      {/* Scroll to Top Arrow Button - Mobile Only */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label="Scroll to top"
        className="sm:hidden w-11 h-11 bg-brand-dark hover:bg-brand-navy active:scale-90 text-white rounded-full shadow-xl flex items-center justify-center transition-all duration-200 border border-white/20 focus:outline-none"
      >
        <ArrowUp className="w-5 h-5 stroke-[2.5]" />
      </button>

      {/* WhatsApp Button */}
      <a
        href={`https://wa.me/${whatsappNum}?text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        aria-label="Chat with us on WhatsApp"
        className="relative bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group focus:outline-none focus:ring-4 focus:ring-emerald-300"
      >
        <MessageCircle className="w-6 h-6 stroke-[2.2]" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-semibold pl-0 group-hover:pl-2">
          {buttonLabel}
        </span>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
        </span>
      </a>
    </div>
  );
}
