import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, Phone, Mail, MapPin, Truck, Store } from 'lucide-react';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';

export default function AdminSettings() {
  const { refreshConfig } = useConfig();
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSiteConfig();
      if (res && res.success && res.data) {
        setConfigData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    try {
      setSaving(true);
      const res = await api.updateAdminSiteConfig(configData);
      if (res && res.success) {
        setSaveSuccess(true);
        refreshConfig();
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res?.message || 'Failed to save settings');
      }
    } catch (err) {
      setSaveError(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !configData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-xs font-semibold text-brand-muted">Loading settings...</p>
      </div>
    );
  }

  const updateNested = (path, value) => {
    setConfigData(prev => {
      const copy = JSON.parse(JSON.stringify(prev));
      const parts = path.split('.');
      let current = copy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
      return copy;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Website & Store Settings</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Configure delivery charges, contact helplines, WhatsApp support, and branding.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Settings saved and applied successfully across storefront and checkout!</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Delivery Settings */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Truck className="w-4 h-4 text-brand-accent" />
            <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">
              Cash on Delivery Charges (Bangladesh)
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Inside Dhaka Delivery Fee (৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={configData.deliverySettings?.insideDhakaFee ?? 70}
                onChange={(e) => updateNested('deliverySettings.insideDhakaFee', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold"
              />
              <p className="text-[11px] text-brand-muted mt-1">Applied when customer selects Inside Dhaka</p>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Outside Dhaka Delivery Fee (৳) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={configData.deliverySettings?.outsideDhakaFee ?? 130}
                onChange={(e) => updateNested('deliverySettings.outsideDhakaFee', Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold"
              />
              <p className="text-[11px] text-brand-muted mt-1">Applied for all other 63 districts</p>
            </div>
          </div>
        </div>

        {/* Contact & Helplines */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Phone className="w-4 h-4 text-brand-accent" />
            <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">
              Contact & Customer Support Information
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Helpline Phone Number *
              </label>
              <input
                type="text"
                required
                value={configData.siteSettings?.contactPhone || ''}
                onChange={(e) => updateNested('siteSettings.contactPhone', e.target.value)}
                placeholder="+880 1711-234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                WhatsApp Business Number (With country code 880) *
              </label>
              <input
                type="text"
                required
                value={configData.siteSettings?.whatsappNumber || ''}
                onChange={(e) => updateNested('siteSettings.whatsappNumber', e.target.value)}
                placeholder="+8801711234567"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold font-mono"
              />
              <p className="text-[11px] text-brand-muted mt-1">Powers the floating WhatsApp chat widget</p>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Support Email Address
              </label>
              <input
                type="email"
                value={configData.siteSettings?.contactEmail || ''}
                onChange={(e) => updateNested('siteSettings.contactEmail', e.target.value)}
                placeholder="support@regrowhaircare.bd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Depot / Office Address
              </label>
              <input
                type="text"
                value={configData.siteSettings?.address || ''}
                onChange={(e) => updateNested('siteSettings.address', e.target.value)}
                placeholder="Banani, Dhaka, Bangladesh"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider border-b border-gray-100 pb-3">
            Social Media Page Links
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Facebook Page URL</label>
              <input
                type="text"
                value={configData.siteSettings?.socialLinks?.facebook || ''}
                onChange={(e) => updateNested('siteSettings.socialLinks.facebook', e.target.value)}
                placeholder="https://facebook.com/regrowhaircarebd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">Instagram URL</label>
              <input
                type="text"
                value={configData.siteSettings?.socialLinks?.instagram || ''}
                onChange={(e) => updateNested('siteSettings.socialLinks.instagram', e.target.value)}
                placeholder="https://instagram.com/regrowhaircarebd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">YouTube URL</label>
              <input
                type="text"
                value={configData.siteSettings?.socialLinks?.youtube || ''}
                onChange={(e) => updateNested('siteSettings.socialLinks.youtube', e.target.value)}
                placeholder="https://youtube.com/@regrowhaircarebd"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

