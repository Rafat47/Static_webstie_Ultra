import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, Phone, Mail, MapPin, Truck, Store, Image, Upload, Eye, Trash2 } from 'lucide-react';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';

export default function AdminSettings() {
  const { refreshConfig } = useConfig();
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
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

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const base64Data = reader.result;
          const res = await api.uploadImage(base64Data);
          if (res && res.success && res.url) {
            updateNested('siteSettings.logoUrl', res.url);
          } else {
            // fallback: use data URL or local public path
            updateNested('siteSettings.logoUrl', base64Data);
          }
        } catch (uploadErr) {
          console.warn('Image upload endpoint fallback to data URL:', uploadErr);
          updateNested('siteSettings.logoUrl', reader.result);
        } finally {
          setUploadingLogo(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Failed to read logo file:', err);
      setUploadingLogo(false);
    }
  };

  const currentLogoUrl = configData.siteSettings?.logoUrl || '/images/hair-shurokkha-logo-transparent.png';

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
        {/* Website Branding & Logo Settings */}
        <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <Image className="w-4 h-4 text-brand-accent" />
            <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">
              Website Branding & Logo Settings
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Brand Inputs & Uploader */}
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Store / Website Name *
                </label>
                <input
                  type="text"
                  required
                  value={configData.siteSettings?.siteName || ''}
                  onChange={(e) => updateNested('siteSettings.siteName', e.target.value)}
                  placeholder="Hair Shurokkha Bangladesh"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Header Logo Text (Fallback)
                </label>
                <input
                  type="text"
                  value={configData.siteSettings?.logoText || ''}
                  onChange={(e) => updateNested('siteSettings.logoText', e.target.value)}
                  placeholder="Hair Shurokkha"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-900"
                />
                <p className="text-[11px] text-brand-muted mt-1">Displayed when image logo is not configured</p>
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Logo Image URL (SVG, PNG, JPG, or WebP)
                </label>
                <input
                  type="text"
                  value={configData.siteSettings?.logoUrl || ''}
                  onChange={(e) => updateNested('siteSettings.logoUrl', e.target.value)}
                  placeholder="/images/hair-shurokkha-logo-transparent.png"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-[11px] text-gray-900"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  Path or CDN link (e.g. <code className="bg-gray-100 px-1 py-0.5 rounded">/images/hair-shurokkha-logo-transparent.png</code>)
                </p>
              </div>

              {/* Upload Button & Action Chips */}
              <div className="space-y-2 pt-1">
                <label className="block font-bold uppercase tracking-wider text-brand-dark">
                  Upload Logo File (Transparent PNG / SVG / JPG)
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-dark hover:bg-brand-navy text-white font-bold text-xs shadow-xs transition-colors">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploadingLogo ? 'Uploading...' : 'Choose File to Upload'}</span>
                    <input
                      type="file"
                      accept=".png,.svg,image/svg+xml,image/png,image/jpeg,image/webp"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => updateNested('siteSettings.logoUrl', '/images/hair-shurokkha-logo-transparent.png')}
                    className="px-3 py-2 rounded-xl border border-gray-200 hover:border-brand-dark text-gray-700 hover:text-brand-dark font-medium text-xs transition-colors"
                  >
                    Reset to Hair Shurokkha PNG
                  </button>

                  {configData.siteSettings?.logoUrl && (
                    <button
                      type="button"
                      onClick={() => updateNested('siteSettings.logoUrl', '')}
                      className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 font-medium text-xs flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Use Text Only</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Live Dual Logo Preview */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark uppercase tracking-wider">
                <Eye className="w-3.5 h-3.5 text-brand-muted" />
                <span>Live Logo Preview</span>
              </div>

              {/* Preview on Light Navbar Background (#F8FAFD) */}
              <div className="p-4 rounded-2xl border border-gray-200 bg-[#F8FAFD] space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <span>Storefront Header View (#F8FAFD)</span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-600 font-mono">Navbar</span>
                </div>
                <div className="h-16 flex items-center justify-center p-2 border border-dashed border-gray-300 rounded-xl bg-white/60">
                  {currentLogoUrl ? (
                    <img
                      src={currentLogoUrl}
                      alt="Logo Preview"
                      className="max-h-12 max-w-[200px] w-auto object-contain"
                    />
                  ) : (
                    <span className="text-xl font-black text-brand-dark">
                      {configData.siteSettings?.logoText || 'Hair Shurokkha'}
                    </span>
                  )}
                </div>
              </div>

              {/* Preview on Dark Footer Background (#080438) */}
              <div className="p-4 rounded-2xl border border-brand-navy bg-[#080438] text-white space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <span>Footer View (#080438)</span>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded border border-white/10 text-gray-300 font-mono">Footer</span>
                </div>
                <div className="h-16 flex items-center justify-center p-2 border border-dashed border-white/20 rounded-xl bg-white/5">
                  {currentLogoUrl ? (
                    <div className="bg-white/95 p-1 rounded-lg inline-block">
                      <img
                        src={currentLogoUrl}
                        alt="Logo Preview Footer"
                        className="max-h-10 max-w-[180px] w-auto object-contain"
                      />
                    </div>
                  ) : (
                    <span className="text-lg font-black text-white uppercase tracking-wider">
                      {configData.siteSettings?.logoText || 'Hair Shurokkha'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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

