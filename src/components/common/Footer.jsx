import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Clock, Sparkles, Phone, Mail, MapPin } from 'lucide-react';
import { useConfig } from '../../context/ConfigContext';

// Clean SVG Brand Icons for Social Platforms
function FacebookIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
    </svg>
  );
}

function InstagramIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function YoutubeIcon({ className }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export default function Footer() {
  const { config } = useConfig();
  const siteSettings = config?.siteSettings || {};
  const footerData = config?.footer || {};

  return (
    <footer className="bg-brand-dark text-white border-t border-brand-border" id="contact">
      {/* Value Proposition Badges */}
      <div className="border-b border-white/10">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3.5 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 pr-4">
              <ShieldCheck className="w-5 h-5 text-white flex-shrink-0 mt-0.5 stroke-[2]" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">100% Authentic Guarantee</h4>
                <p className="text-xs text-gray-400 mt-1">USA formulation Kirkland 5% & sterile titanium micro-needles.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5 border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 pr-4">
              <Truck className="w-5 h-5 text-white flex-shrink-0 mt-0.5 stroke-[2]" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">Nationwide Cash on Delivery</h4>
                <p className="text-xs text-gray-400 mt-1">Pay safely after inspecting your parcel in all 64 districts of Bangladesh.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3.5">
              <Clock className="w-5 h-5 text-white flex-shrink-0 mt-0.5 stroke-[2]" />
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-white">Fast Dispatch</h4>
                <p className="text-xs text-gray-400 mt-1">24-48 hours inside Dhaka; 2-4 days across Bangladesh.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links & Info */}
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span className="font-black text-xl tracking-wider text-white uppercase">
                {siteSettings.logoText || 'REGROW'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {footerData.aboutText || 'Science-backed topical Minoxidil 5% solutions and titanium micro-needling systems for men & women experiencing hair thinning.'}
            </p>
            {/* Social Links */}
            <div className="flex items-center space-x-3 pt-2">
              {siteSettings.socialLinks?.facebook && (
                <a
                  href={siteSettings.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 border border-white/20 hover:border-white hover:bg-white hover:text-brand-dark flex items-center justify-center text-gray-300 transition-colors"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="w-4 h-4" />
                </a>
              )}
              {siteSettings.socialLinks?.instagram && (
                <a
                  href={siteSettings.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 border border-white/20 hover:border-white hover:bg-white hover:text-brand-dark flex items-center justify-center text-gray-300 transition-colors"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="w-4 h-4" />
                </a>
              )}
              {siteSettings.socialLinks?.youtube && (
                <a
                  href={siteSettings.socialLinks.youtube}
                  target="_blank"
                  rel="noreferrer"
                  className="w-8 h-8 border border-white/20 hover:border-white hover:bg-white hover:text-brand-dark flex items-center justify-center text-gray-300 transition-colors"
                  aria-label="YouTube"
                >
                  <YoutubeIcon className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-4">Quick Navigation</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/shop" className="hover:text-white transition-colors">Shop All Products</Link>
              </li>
              <li>
                <Link to="/shop?category=Minoxidil" className="hover:text-white transition-colors">Minoxidil Solutions</Link>
              </li>
              <li>
                <Link to="/shop?category=Derma%20Roller" className="hover:text-white transition-colors">Derma Rollers (0.5mm)</Link>
              </li>
              <li>
                <Link to="/shop?category=Combo%20Packages" className="hover:text-white transition-colors">Combo Packages & Savings</Link>
              </li>
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-4">Customer Care & Policies</h5>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery Policy</Link>
              </li>
              <li>
                <Link to="/refund-policy" className="hover:text-white transition-colors">Return & Refund Policy</Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              </li>
              <li>
                <Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms & Conditions</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-white transition-colors opacity-50">Admin Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h5 className="font-bold text-xs uppercase tracking-widest text-white mb-4">Direct Contact</h5>
            <div className="space-y-2.5 text-xs text-gray-400">
              {siteSettings.contactPhone && (
                <div className="flex items-start space-x-2.5">
                  <Phone className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                  <span>{siteSettings.contactPhone}</span>
                </div>
              )}
              {siteSettings.contactEmail && (
                <div className="flex items-start space-x-2.5">
                  <Mail className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                  <span>{siteSettings.contactEmail}</span>
                </div>
              )}
              {siteSettings.address && (
                <div className="flex items-start space-x-2.5">
                  <MapPin className="w-3.5 h-3.5 text-white mt-0.5 flex-shrink-0" />
                  <span>{siteSettings.address}</span>
                </div>
              )}
              <div className="pt-2 text-[11px] text-gray-500">
                Support Hours: 10:00 AM – 9:00 PM (Everyday)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-white/10">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-400 gap-2">
          <p>{footerData.copyrightText || '© 2026 Regrow Hair Care BD. All rights reserved.'}</p>
          <p className="text-[11px] text-gray-400">
            Disclaimer: For cosmetic & topical use. Consult a physician for chronic dermatological conditions.
          </p>
        </div>
      </div>
    </footer>
  );
}
