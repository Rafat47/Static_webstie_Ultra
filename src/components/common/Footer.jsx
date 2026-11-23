import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Truck, Sparkles, Phone, Mail, MapPin, CheckCircle2 } from 'lucide-react';
import { useWebsiteData } from '../../context/WebsiteDataContext';

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
  const { config } = useWebsiteData();
  const siteSettings = config?.siteSettings || {};
  const footerData = config?.footer || {};
  const trustBadges = footerData.trustBadges || [];

  const quickLinks = footerData.quickLinks || [];
  const legalLinks = footerData.legalLinks || [];

  return (
    <footer className="bg-brand-dark text-white border-t border-brand-border" id="contact">
      {/* 1. Value Proposition Cards / Trust Badges */}
      {trustBadges.length > 0 && (
        <div className="border-b border-white/10">
          <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {trustBadges.map((badge, idx) => {
                const titleLower = (badge.title || '').toLowerCase();
                let IconComponent = ShieldCheck;
                if (titleLower.includes('delivery') || titleLower.includes('dispatch') || titleLower.includes('fast')) {
                  IconComponent = Truck;
                } else if (titleLower.includes('guarantee') || titleLower.includes('authentic')) {
                  IconComponent = ShieldCheck;
                } else {
                  IconComponent = Sparkles;
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-start space-x-3.5 ${
                      idx < trustBadges.length - 1 ? 'border-b md:border-b-0 md:border-r border-white/10 pb-6 md:pb-0 pr-4' : ''
                    }`}
                  >
                    <IconComponent className="w-5 h-5 text-white flex-shrink-0 mt-0.5 stroke-[2]" />
                    <div>
                      <h4 className="font-bold text-xs uppercase tracking-wider text-white">
                        {badge.title}
                      </h4>
                      {badge.description && (
                        <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Footer Links */}
      <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          
          {/* Brand Info & Summary */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2.5">
              {siteSettings.logoUrl ? (
                <img
                  src={siteSettings.logoUrl}
                  alt={siteSettings.siteName || 'Hair Shurokkha'}
                  className="h-8 sm:h-9 w-auto brightness-0 invert object-contain"
                />
              ) : null}
              {siteSettings.siteName && (
                <span className="font-black text-lg sm:text-xl tracking-tight text-white uppercase">
                  {siteSettings.siteName}
                </span>
              )}
            </div>

            {/* About Text directly from website-data.json */}
            {footerData.aboutText ? (
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {footerData.aboutText}
              </p>
            ) : siteSettings.tagline ? (
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                {siteSettings.tagline}
              </p>
            ) : null}

            {/* Social Links */}
            {siteSettings.socialLinks && (
              <div className="flex items-center space-x-3 pt-2">
                {siteSettings.socialLinks.facebook && (
                  <a
                    href={siteSettings.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-accent text-white flex items-center justify-center transition-colors"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
                {siteSettings.socialLinks.instagram && (
                  <a
                    href={siteSettings.socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-accent text-white flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {siteSettings.socialLinks.youtube && (
                  <a
                    href={siteSettings.socialLinks.youtube}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-brand-accent text-white flex items-center justify-center transition-colors"
                    aria-label="YouTube"
                  >
                    <YoutubeIcon className="w-4 h-4" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Quick Navigation Links (Column 1) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {footerData.navCol1Title || footerData.quickLinksTitle || 'Quick Navigation'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              {quickLinks.length > 0 ? (
                quickLinks.map((link, idx) => {
                  const href = link.href || '/';
                  const isExternal = href.startsWith('http') || href.startsWith('//');
                  const isHash = href.startsWith('#');

                  if (isExternal || isHash) {
                    return (
                      <li key={link._id || idx}>
                        <a href={href} className="hover:text-white transition-colors">
                          {link.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={link._id || idx}>
                      <Link to={href} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <>
                  <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/shop" className="hover:text-white transition-colors">Shop All Products</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Customer Care & Legal Policies (Column 2) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {footerData.navCol2Title || footerData.legalTitle || 'Customer Care & Policies'}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-gray-400">
              {legalLinks.length > 0 ? (
                legalLinks.map((link, idx) => {
                  const href = link.href || '/';
                  const isExternal = href.startsWith('http') || href.startsWith('//');

                  if (isExternal) {
                    return (
                      <li key={link._id || idx}>
                        <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                          {link.label}
                        </a>
                      </li>
                    );
                  }

                  return (
                    <li key={link._id || idx}>
                      <Link to={href} className="hover:text-white transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  );
                })
              ) : (
                <>
                  <li><Link to="/shipping-policy" className="hover:text-white transition-colors">Shipping & Delivery</Link></li>
                  <li><Link to="/refund-policy" className="hover:text-white transition-colors">Return & Refund Policy</Link></li>
                  <li><Link to="/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms-and-conditions" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </>
              )}
            </ul>
          </div>

          {/* Contact Support (Column 3) */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              {footerData.contactColTitle || footerData.contactTitle || 'Direct Contact'}
            </h4>
            <div className="space-y-2.5 text-xs sm:text-sm text-gray-400">
              {siteSettings.contactPhone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`tel:${siteSettings.contactPhone.split(',')[0].trim()}`} className="hover:text-white transition-colors">
                    {siteSettings.contactPhone}
                  </a>
                </div>
              )}
              {siteSettings.contactEmail && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <a href={`mailto:${siteSettings.contactEmail}`} className="hover:text-white transition-colors">
                    {siteSettings.contactEmail}
                  </a>
                </div>
              )}
              {siteSettings.address && (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span>{siteSettings.address}</span>
                </div>
              )}
              {siteSettings.supportHours && (
                <p className="text-[11px] text-gray-500 pt-1">
                  {siteSettings.supportHours}
                </p>
              )}
              {footerData.showCODNotice && (
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    Cash on Delivery Available
                  </span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* 3. Medical / Cosmetic Disclaimer Text */}
      {footerData.disclaimerText && (
        <div className="border-t border-white/10 bg-black/25">
          <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-3.5">
            <p className="text-[11px] text-gray-400 text-center leading-relaxed">
              {footerData.disclaimerText}
            </p>
          </div>
        </div>
      )}

      {/* 4. Copyright & Admin Portal Bar */}
      <div className="border-t border-white/10 bg-brand-dark/95">
        <div className="max-w-[1536px] mx-auto px-3 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
          <p>
            {footerData.copyrightText || `© ${new Date().getFullYear()} ${siteSettings.siteName || 'Hair Shurokkha'}. All rights reserved.`}
          </p>
          <div className="flex items-center space-x-4">
            <a
              href={footerData.adminPortalUrl || 'https://admin-hairshurokkha.netlify.app'}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-300 transition-colors text-[11px] flex items-center gap-1"
            >
              <span>{footerData.adminPortalText || 'Admin Portal'}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
