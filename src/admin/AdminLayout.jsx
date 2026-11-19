import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Edit3,
  Settings,
  Share2,
  LogOut,
  Menu,
  X,
  ExternalLink,
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AdminLayout() {
  const { adminUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', path: '/admin', icon: <LayoutDashboard className="w-4 h-4" /> },
    { label: 'Orders', path: '/admin/orders', icon: <ShoppingCart className="w-4 h-4" /> },
    { label: 'Products', path: '/admin/products', icon: <Package className="w-4 h-4" /> },
    { label: 'Categories', path: '/admin/categories', icon: <Layers className="w-4 h-4" /> },
    { label: 'Homepage Editor', path: '/admin/homepage-editor', icon: <Edit3 className="w-4 h-4" /> },
    { label: 'Website Settings', path: '/admin/settings', icon: <Settings className="w-4 h-4" /> },
    { label: 'Meta Integration', path: '/admin/meta', icon: <Share2 className="w-4 h-4" /> },
  ];

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Top Bar */}
      <div className="md:hidden bg-brand-dark text-white px-4 py-3 flex items-center justify-between border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-brand-accent flex items-center justify-center text-white font-bold text-xs">
            R
          </div>
          <span className="font-extrabold text-sm tracking-wider">Regrow Admin</span>
        </div>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-1.5 text-gray-300 hover:text-white"
        >
          {mobileSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-brand-dark text-white flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Link to="/admin" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-brand-accent flex items-center justify-center text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-black text-base tracking-wider leading-none">REGROW</h2>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest">Store CMS</span>
              </div>
            </Link>
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Badge */}
          <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white truncate max-w-[140px]">
                {adminUser?.username || 'Administrator'}
              </p>
              <p className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">Active Session</p>
            </div>
            <Link
              to="/"
              target="_blank"
              title="Open storefront"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.path || (link.path !== '/admin' && location.pathname.startsWith(link.path));
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-brand-accent text-white shadow-md'
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {link.icon}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-x-hidden p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}

