import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu, X, Sparkles, ChevronRight, Phone } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useConfig } from '../../context/ConfigContext';

export default function Navbar() {
  const { totalItemsCount, setIsCartOpen } = useCart();
  const { config } = useConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const siteSettings = config?.siteSettings || {};
  const logoText = siteSettings.logoText || 'REGROW';
  const logoUrl = siteSettings.logoUrl;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleNavClick = (href, isSection) => {
    setMobileMenuOpen(false);
    if (isSection) {
      if (location.pathname !== '/') {
        navigate(`/${href}`);
      } else {
        const el = document.querySelector(href);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    } else {
      navigate(href);
    }
  };

  const navItems = [
    { label: 'Home', href: '#hero', isSection: true },
    { label: 'Shop', href: '/shop', isSection: false },
    { label: 'Hair Thinning', href: '#hair-thinning', isSection: true },
    { label: 'How It Works', href: '#how-it-works', isSection: true },
    { label: 'Progress', href: '#progress', isSection: true },
    { label: 'How to Use', href: '#how-to-use', isSection: true },
    { label: 'Contact', href: '#contact', isSection: true },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-brand-dark/95 backdrop-blur-md shadow-lg border-b border-white/10 py-3'
            : 'bg-brand-dark border-b border-white/5 py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2 group">
              {logoUrl ? (
                <img src={logoUrl} alt={logoText} className="h-9 w-auto object-contain" />
              ) : (
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-accent to-blue-400 flex items-center justify-center text-white shadow-md">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-extrabold text-xl tracking-wider text-white group-hover:text-brand-accent transition-colors">
                      {logoText}
                    </span>
                    <span className="text-[10px] text-gray-300 uppercase tracking-widest font-medium -mt-1">
                      Hair Care BD
                    </span>
                  </div>
                </div>
              )}
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-7">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href, item.isSection)}
                  className="text-sm font-medium text-gray-200 hover:text-white transition-colors duration-200 relative py-1 group"
                >
                  {item.label}
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-accent transition-all duration-300 group-hover:w-full"></span>
                </button>
              ))}
            </nav>

            {/* Desktop CTA & Cart Actions */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <Link
                to="/shop"
                className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-white bg-brand-accent hover:bg-blue-600 transition-all duration-200 shadow-md hover:shadow-brand-accent/30"
              >
                Shop Now
              </Link>

              {/* Cart Trigger */}
              <button
                onClick={() => setIsCartOpen(true)}
                aria-label="Open Shopping Cart"
                className="relative p-2.5 rounded-lg text-white hover:bg-white/10 transition-colors duration-200 focus:outline-none"
              >
                <ShoppingBag className="w-5 h-5 text-gray-100" />
                {totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-accent text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-brand-dark animate-pulse">
                    {totalItemsCount}
                  </span>
                )}
              </button>

              {/* Mobile Hamburger Toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation menu"
                className="lg:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-brand-navy border-b border-white/10 px-4 pt-3 pb-6 animate-fadeIn">
            <div className="flex flex-col space-y-3">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.href, item.isSection)}
                  className="flex items-center justify-between text-left py-2.5 px-3 rounded-md text-sm font-medium text-gray-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </button>
              ))}

              <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
                <Link
                  to="/shop"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-lg bg-brand-accent text-white font-semibold text-sm shadow hover:bg-blue-600 transition-colors"
                >
                  Shop All Products
                </Link>
                {siteSettings.contactPhone && (
                  <a
                    href={`tel:${siteSettings.contactPhone}`}
                    className="flex items-center justify-center gap-2 py-2 text-xs text-gray-300 hover:text-white"
                  >
                    <Phone className="w-3.5 h-3.5 text-brand-accent" />
                    <span>Call Helpline: {siteSettings.contactPhone}</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer to prevent fixed header from hiding top page content */}
      <div className="h-16 sm:h-20"></div>
    </>
  );
}

