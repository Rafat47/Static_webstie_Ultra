import React, { useState, useEffect } from 'react';
import { Save, RefreshCw, CheckCircle, AlertCircle, Share2, ShieldCheck, ExternalLink, HelpCircle, Key } from 'lucide-react';
import api from '../services/api';

export default function AdminMeta() {
  const [metaSettings, setMetaSettings] = useState({
    pixelId: '',
    testEventCode: '',
    isPixelEnabled: true,
    isCapiEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    loadMetaSettings();
  }, []);

  const loadMetaSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSiteConfig();
      if (res && res.success && res.data?.metaSettings) {
        setMetaSettings({
          pixelId: res.data.metaSettings.pixelId || '',
          testEventCode: res.data.metaSettings.testEventCode || '',
          isPixelEnabled: res.data.metaSettings.isPixelEnabled !== false,
          isCapiEnabled: res.data.metaSettings.isCapiEnabled !== false
        });
      }
    } catch (err) {
      console.warn('Failed to load Meta settings:', err);
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
      const res = await api.updateAdminSiteConfig({ metaSettings });
      if (res && res.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res?.message || 'Failed to save Meta settings');
      }
    } catch (err) {
      setSaveError(err.message || 'Error updating Meta settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-xs font-semibold text-brand-muted">Loading Meta configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Meta Facebook Integration</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage Meta Pixel, Server-Side Conversions API (CAPI), and Deduplication for Facebook Ad traffic.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Meta Configuration'}</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Meta settings updated successfully! Browser Pixel will load with your Pixel ID.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Settings */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-5 text-xs">
            <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
              <Share2 className="w-4 h-4 text-brand-accent" />
              <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">
                Pixel & CAPI Credentials
              </h3>
            </div>

            {/* Meta Pixel ID */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Meta Pixel ID
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={metaSettings.pixelId}
                onChange={(e) => setMetaSettings({ ...metaSettings, pixelId: e.target.value.trim() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:ring-2 focus:ring-brand-accent/50"
              />
              <p className="text-[11px] text-brand-muted mt-1">
                Found in Meta Events Manager under Data Sources &gt; Settings.
              </p>
            </div>

            {/* Test Event Code */}
            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Test Event Code (Optional for Live Verification)
              </label>
              <input
                type="text"
                placeholder="e.g. TEST12345"
                value={metaSettings.testEventCode}
                onChange={(e) => setMetaSettings({ ...metaSettings, testEventCode: e.target.value.trim() })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs uppercase focus:ring-2 focus:ring-brand-accent/50"
              />
              <p className="text-[11px] text-brand-muted mt-1">
                Found under Meta Events Manager &gt; Test Events tab. Leave empty in production.
              </p>
            </div>

            {/* Toggles */}
            <div className="pt-2 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  checked={metaSettings.isPixelEnabled}
                  onChange={(e) => setMetaSettings({ ...metaSettings, isPixelEnabled: e.target.checked })}
                  className="mt-0.5 rounded text-brand-accent focus:ring-brand-accent"
                />
                <div>
                  <p className="font-bold text-brand-dark">Enable Browser Meta Pixel</p>
                  <p className="text-[11px] text-brand-muted">Fires standard PageView, ViewContent, AddToCart, InitiateCheckout, and Purchase events in the customer's browser.</p>
                </div>
              </label>

              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl bg-gray-50 border border-gray-200">
                <input
                  type="checkbox"
                  checked={metaSettings.isCapiEnabled}
                  onChange={(e) => setMetaSettings({ ...metaSettings, isCapiEnabled: e.target.checked })}
                  className="mt-0.5 rounded text-brand-accent focus:ring-brand-accent"
                />
                <div>
                  <p className="font-bold text-brand-dark">Enable Server-Side Conversions API (CAPI)</p>
                  <p className="text-[11px] text-brand-muted">Dispatches deduplicated server-side Purchase and conversion signals via Netlify Functions directly to Facebook.</p>
                </div>
              </label>
            </div>

            {/* Security Notice for CAPI Access Token */}
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Key className="w-4 h-4 text-brand-accent" />
                <span>Server-Side CAPI Access Token Security</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                For security, your Conversions API Access Token is configured exclusively via the server environment variable <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-950 font-bold">META_CAPI_ACCESS_TOKEN</code> on Netlify or in your <code className="bg-white px-1.5 py-0.5 rounded font-mono text-blue-950 font-bold">.env</code> file. It is never exposed in browser JavaScript.
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Step-by-Step Meta Testing Guide */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-5 text-xs">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
            <HelpCircle className="w-4 h-4 text-brand-accent" />
            <h3 className="font-bold text-sm text-brand-dark uppercase tracking-wider">
              How to Verify Meta Events
            </h3>
          </div>

          <ol className="space-y-4 list-decimal pl-4 text-gray-700 leading-relaxed">
            <li>
              <strong className="text-brand-dark">Find your Pixel ID:</strong> Go to <a href="https://business.facebook.com/events_manager2" target="_blank" rel="noreferrer" className="text-brand-accent hover:underline font-bold inline-flex items-center gap-0.5">Meta Events Manager <ExternalLink className="w-3 h-3" /></a> &gt; Data Sources &gt; Settings &gt; Copy Dataset/Pixel ID.
            </li>
            <li>
              <strong className="text-brand-dark">Paste your Pixel ID:</strong> Enter it into the field on the left and click <em>Save Meta Configuration</em>.
            </li>
            <li>
              <strong className="text-brand-dark">Test with Test Event Code:</strong> Under <em>Test Events</em> in Events Manager, copy your code (e.g. <code>TEST64219</code>) and paste it into the Test Event Code field above.
            </li>
            <li>
              <strong className="text-brand-dark">Perform Test Actions:</strong>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-brand-muted text-[11px]">
                <li>Open a product page &rarr; Triggers <code>ViewContent</code></li>
                <li>Add to cart &rarr; Triggers <code>AddToCart</code></li>
                <li>Go to checkout &rarr; Triggers <code>InitiateCheckout</code></li>
                <li>Complete COD order &rarr; Triggers <code>Purchase</code></li>
              </ul>
            </li>
            <li>
              <strong className="text-brand-dark">Observe Deduplication:</strong> In Meta Events Manager, verify that both Browser and Server events share the same <code>event_id</code> and are successfully merged.
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
