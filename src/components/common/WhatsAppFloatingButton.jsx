import React from 'react';
import { MessageCircle } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

export default function WhatsAppFloatingButton() {
  const { config } = useConfig();
  const whatsappNum = config?.siteSettings?.whatsappNumber?.replace(/[^0-9]/g, '') || '8801711234567';
  const message = encodeURIComponent('Hello Regrow Hair Care BD, I want to learn more about your authentic Minoxidil packages.');

  return (
    <a
      href={`https://wa.me/${whatsappNum}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 group focus:outline-none focus:ring-4 focus:ring-emerald-300"
    >
      <MessageCircle className="w-6 h-6 stroke-[2.2]" />
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 ease-in-out text-sm font-semibold pl-0 group-hover:pl-2">
        Chat with Us
      </span>
      <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
      </span>
    </a>
  );
}

