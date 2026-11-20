import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  Eye,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
  Plus,
  Trash2,
  Layers,
  Clock,
  BookOpen
} from 'lucide-react';
import api from '../services/api';
import { useConfig } from '../context/ConfigContext';

export default function AdminHomepageEditor() {
  const { refreshConfig } = useConfig();
  const [configData, setConfigData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Active accordion tab
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminWebsiteData();
      if (res && res.success && res.data) {
        setConfigData(res.data);
      }
    } catch (err) {
      console.warn('Failed to load site config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaveError('');
    setSaveSuccess(false);

    try {
      setSaving(true);
      const res = await api.updateAdminWebsiteData(configData, configData.version);
      if (res && res.success) {
        setSaveSuccess(true);
        if (res.data) setConfigData(res.data);
        refreshConfig(); // Refresh public store context immediately!
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res?.message || 'Failed to save configuration');
      }
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !configData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-accent animate-spin" />
        <p className="text-xs font-semibold text-brand-muted">Loading CMS configuration...</p>
      </div>
    );
  }

  // Nested property updater helper
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

  const tabs = [
    { id: 'hero', label: 'Hero Section', icon: '✨' },
    { id: 'carousel', label: 'Floating Carousel', icon: '🔘' },
    { id: 'startNow', label: 'Start Now Section', icon: '🌱' },
    { id: 'hairThinning', label: 'Understanding Thinning', icon: '🔬' },
    { id: 'howMinoxidilWorks', label: 'How Minoxidil Works', icon: '⚙️' },
    { id: 'timeline', label: 'Progress Timeline', icon: '📅' },
    { id: 'usageGuide', label: 'Usage Guide', icon: '📖' },
    { id: 'featuredProducts', label: 'Featured Products', icon: '⭐' },
    { id: 'footer', label: 'Footer & Policies', icon: '📄' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & Sticky Save Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-16 md:top-0 bg-gray-100 py-2 z-20">
        <div>
          <h1 className="text-2xl font-black text-brand-dark">Homepage CMS Editor</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Modify text headlines, photography, instructions, and timeline stages in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {saveSuccess && (
            <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-xl flex items-center gap-1.5 animate-fadeIn">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Published to Live Store!</span>
            </span>
          )}
          {saveError && (
            <span className="text-xs font-bold text-red-600 bg-red-100 px-3 py-1.5 rounded-xl flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{saveError}</span>
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-brand-navy text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Publishing...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === tab.id
                ? 'bg-brand-dark text-white shadow-sm'
                : 'bg-white text-brand-muted hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-3xl border border-brand-border p-6 sm:p-8 shadow-xs space-y-6">
        {/* 1. HERO TAB */}
        {activeTab === 'hero' && (
          <div className="space-y-5 text-xs">
            <h3 className="text-base font-bold text-brand-dark border-b border-gray-100 pb-2">
              Hero Section Settings
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Trust Badge Text
                </label>
                <input
                  type="text"
                  value={configData.hero?.badge || ''}
                  onChange={(e) => updateNested('hero.badge', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Customer Rating Text
                </label>
                <input
                  type="text"
                  value={configData.hero?.rating || ''}
                  onChange={(e) => updateNested('hero.rating', e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Main Headline *
              </label>
              <input
                type="text"
                value={configData.hero?.title || ''}
                onChange={(e) => updateNested('hero.title', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-sm"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                Supporting Subtitle
              </label>
              <textarea
                rows={3}
                value={configData.hero?.subtitle || ''}
                onChange={(e) => updateNested('hero.subtitle', e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Primary Button Text
                </label>
                <input
                  type="text"
                  value={configData.hero?.primaryBtnText || ''}
                  onChange={(e) => updateNested('hero.primaryBtnText', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Secondary Button Text
                </label>
                <input
                  type="text"
                  value={configData.hero?.secondaryBtnText || ''}
                  onChange={(e) => updateNested('hero.secondaryBtnText', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Desktop Hero Image URL (21:9 Aspect Ratio)
                </label>
                <input
                  type="text"
                  placeholder="https://... (1600x685 recommended)"
                  value={configData.hero?.desktopImage || configData.hero?.heroImage || ''}
                  onChange={(e) => {
                    updateNested('hero.desktopImage', e.target.value);
                    updateNested('hero.heroImage', e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
                {(configData.hero?.desktopImage || configData.hero?.heroImage) && (
                  <div className="mt-2 w-36 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={configData.hero.desktopImage || configData.hero.heroImage} alt="Desktop Hero Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Mobile Hero Image URL (16:9 Aspect Ratio)
                </label>
                <input
                  type="text"
                  placeholder="https://... (800x450 recommended)"
                  value={configData.hero?.mobileImage || ''}
                  onChange={(e) => updateNested('hero.mobileImage', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
                {configData.hero?.mobileImage && (
                  <div className="mt-2 w-24 h-16 rounded-lg overflow-hidden border border-gray-200">
                    <img src={configData.hero.mobileImage} alt="Mobile Hero Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. FLOATING PRODUCT CAROUSEL TAB */}
        {activeTab === 'carousel' && (
          <div className="space-y-5 text-xs">
            <h3 className="text-base font-bold text-brand-dark border-b border-gray-100 pb-2">
              Floating Story-Style Carousel Settings
            </h3>

            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.productCarousel?.enabled !== false}
                  onChange={(e) => updateNested('productCarousel.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-bold text-sm text-brand-dark">Enable Floating Product Carousel on Homepage</span>
              </label>
              <p className="text-[11px] text-brand-muted">
                When enabled, active products appear automatically as floating circular story-style thumbnails overlapping the hero section.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Carousel Title
                </label>
                <input
                  type="text"
                  value={configData.productCarousel?.title || ''}
                  onChange={(e) => updateNested('productCarousel.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">
                  Carousel Subtitle
                </label>
                <input
                  type="text"
                  value={configData.productCarousel?.subtitle || ''}
                  onChange={(e) => updateNested('productCarousel.subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. START NOW SECTION */}
        {activeTab === 'startNow' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-dark">
                "It's Not Too Late to Start Now" Section
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.sections?.startNow?.enabled !== false}
                  onChange={(e) => updateNested('sections.startNow.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-semibold text-brand-muted">Visible</span>
              </label>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
              <input
                type="text"
                value={configData.sections?.startNow?.title || ''}
                onChange={(e) => updateNested('sections.startNow.title', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Subtitle</label>
              <input
                type="text"
                value={configData.sections?.startNow?.subtitle || ''}
                onChange={(e) => updateNested('sections.startNow.subtitle', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Paragraph Content</label>
              <textarea
                rows={4}
                value={configData.sections?.startNow?.content || ''}
                onChange={(e) => updateNested('sections.startNow.content', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">CTA Button Text</label>
                <input
                  type="text"
                  value={configData.sections?.startNow?.ctaText || ''}
                  onChange={(e) => updateNested('sections.startNow.ctaText', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Desktop Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={configData.sections?.startNow?.desktopImage || configData.sections?.startNow?.image || ''}
                  onChange={(e) => {
                    updateNested('sections.startNow.desktopImage', e.target.value);
                    updateNested('sections.startNow.image', e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Mobile Image URL (Optional)</label>
              <input
                type="text"
                placeholder="https://..."
                value={configData.sections?.startNow?.mobileImage || ''}
                onChange={(e) => updateNested('sections.startNow.mobileImage', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>
          </div>
        )}

        {/* 4. UNDERSTANDING THINNING SECTION */}
        {activeTab === 'hairThinning' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-dark">Understanding Hair Thinning</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.sections?.hairThinning?.enabled !== false}
                  onChange={(e) => updateNested('sections.hairThinning.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-semibold text-brand-muted">Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
                <input
                  type="text"
                  value={configData.sections?.hairThinning?.title || ''}
                  onChange={(e) => updateNested('sections.hairThinning.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Subtitle</label>
                <input
                  type="text"
                  value={configData.sections?.hairThinning?.subtitle || ''}
                  onChange={(e) => updateNested('sections.hairThinning.subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            {/* Stages Editor */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-brand-dark">3 Follicle Stages</h4>
              {configData.sections?.hairThinning?.stages?.map((stage, sIdx) => (
                <div key={sIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Title"
                      value={stage.title || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.hairThinning.stages];
                        copy[sIdx].title = e.target.value;
                        updateNested('sections.hairThinning.stages', copy);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Badge"
                      value={stage.badge || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.hairThinning.stages];
                        copy[sIdx].badge = e.target.value;
                        updateNested('sections.hairThinning.stages', copy);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Description"
                    value={stage.description || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.hairThinning.stages];
                      copy[sIdx].description = e.target.value;
                      updateNested('sections.hairThinning.stages', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200"
                  />
                  <input
                    type="text"
                    placeholder="Stage Image URL (e.g. photo or diagram)"
                    value={stage.image || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.hairThinning.stages];
                      copy[sIdx].image = e.target.value;
                      updateNested('sections.hairThinning.stages', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                  {stage.image && (
                    <div className="w-24 h-16 rounded overflow-hidden border border-gray-200">
                      <img src={stage.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. HOW MINOXIDIL WORKS */}
        {activeTab === 'howMinoxidilWorks' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-dark">How Minoxidil Works Section</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.sections?.howMinoxidilWorks?.enabled !== false}
                  onChange={(e) => updateNested('sections.howMinoxidilWorks.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-semibold text-brand-muted">Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
                <input
                  type="text"
                  value={configData.sections?.howMinoxidilWorks?.title || ''}
                  onChange={(e) => updateNested('sections.howMinoxidilWorks.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Subtitle</label>
                <input
                  type="text"
                  value={configData.sections?.howMinoxidilWorks?.subtitle || ''}
                  onChange={(e) => updateNested('sections.howMinoxidilWorks.subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Clinical Insight Note</label>
              <textarea
                rows={2}
                value={configData.sections?.howMinoxidilWorks?.scienceNote || ''}
                onChange={(e) => updateNested('sections.howMinoxidilWorks.scienceNote', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Desktop Illustration Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={configData.sections?.howMinoxidilWorks?.desktopImage || configData.sections?.howMinoxidilWorks?.image || ''}
                  onChange={(e) => {
                    updateNested('sections.howMinoxidilWorks.desktopImage', e.target.value);
                    updateNested('sections.howMinoxidilWorks.image', e.target.value);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Mobile Illustration Image URL (Optional)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={configData.sections?.howMinoxidilWorks?.mobileImage || ''}
                  onChange={(e) => updateNested('sections.howMinoxidilWorks.mobileImage', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* 6. PROGRESS TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-dark">Progress Timeline / Stages</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.sections?.progressTimeline?.enabled !== false}
                  onChange={(e) => updateNested('sections.progressTimeline.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-semibold text-brand-muted">Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
                <input
                  type="text"
                  value={configData.sections?.progressTimeline?.title || ''}
                  onChange={(e) => updateNested('sections.progressTimeline.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Disclaimer</label>
                <input
                  type="text"
                  value={configData.sections?.progressTimeline?.disclaimer || ''}
                  onChange={(e) => updateNested('sections.progressTimeline.disclaimer', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            {/* Stages List */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-brand-dark">Chronological Milestones</h4>
              {configData.sections?.progressTimeline?.stages?.map((stage, tIdx) => (
                <div key={tIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Stage (e.g. Stage 1)"
                      value={stage.stage || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.progressTimeline.stages];
                        copy[tIdx].stage = e.target.value;
                        updateNested('sections.progressTimeline.stages', copy);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Period (e.g. Month 1)"
                      value={stage.period || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.progressTimeline.stages];
                        copy[tIdx].period = e.target.value;
                        updateNested('sections.progressTimeline.stages', copy);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="Highlight Badge"
                      value={stage.highlight || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.progressTimeline.stages];
                        copy[tIdx].highlight = e.target.value;
                        updateNested('sections.progressTimeline.stages', copy);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Milestone Title"
                    value={stage.title || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.progressTimeline.stages];
                      copy[tIdx].title = e.target.value;
                      updateNested('sections.progressTimeline.stages', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 font-semibold"
                  />

                  <textarea
                    rows={2}
                    placeholder="Milestone Description"
                    value={stage.description || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.progressTimeline.stages];
                      copy[tIdx].description = e.target.value;
                      updateNested('sections.progressTimeline.stages', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200"
                  />

                  <input
                    type="text"
                    placeholder="Image URL"
                    value={stage.image || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.progressTimeline.stages];
                      copy[tIdx].image = e.target.value;
                      updateNested('sections.progressTimeline.stages', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-[11px]"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. USAGE GUIDE */}
        {activeTab === 'usageGuide' && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-base font-bold text-brand-dark">How to Use Minoxidil Guide</h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configData.sections?.usageGuide?.enabled !== false}
                  onChange={(e) => updateNested('sections.usageGuide.enabled', e.target.checked)}
                  className="rounded text-brand-accent focus:ring-brand-accent"
                />
                <span className="font-semibold text-brand-muted">Visible</span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
                <input
                  type="text"
                  value={configData.sections?.usageGuide?.title || ''}
                  onChange={(e) => updateNested('sections.usageGuide.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Subtitle</label>
                <input
                  type="text"
                  value={configData.sections?.usageGuide?.subtitle || ''}
                  onChange={(e) => updateNested('sections.usageGuide.subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Safety Notice Callout</label>
              <textarea
                rows={2}
                value={configData.sections?.usageGuide?.safetyNotice || ''}
                onChange={(e) => updateNested('sections.usageGuide.safetyNotice', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>

            {/* Steps List */}
            <div className="space-y-3 pt-2">
              <h4 className="font-bold text-brand-dark">Routine Steps (1 to 5)</h4>
              {configData.sections?.usageGuide?.steps?.map((step, uIdx) => (
                <div key={uIdx} className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                  <div className="flex gap-2 items-center">
                    <span className="font-bold text-brand-accent w-16">Step {step.stepNumber || uIdx + 1}:</span>
                    <input
                      type="text"
                      placeholder="Step Title"
                      value={step.title || ''}
                      onChange={(e) => {
                        const copy = [...configData.sections.usageGuide.steps];
                        copy[uIdx].title = e.target.value;
                        updateNested('sections.usageGuide.steps', copy);
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 font-semibold"
                    />
                  </div>
                  <textarea
                    rows={2}
                    placeholder="Step Instructions"
                    value={step.description || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.usageGuide.steps];
                      copy[uIdx].description = e.target.value;
                      updateNested('sections.usageGuide.steps', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200"
                  />
                  <input
                    type="text"
                    placeholder="Step Illustrative Image URL (e.g. wash, dropper, roller, massage)"
                    value={step.image || ''}
                    onChange={(e) => {
                      const copy = [...configData.sections.usageGuide.steps];
                      copy[uIdx].image = e.target.value;
                      updateNested('sections.usageGuide.steps', copy);
                    }}
                    className="w-full px-3 py-1.5 rounded-lg border border-gray-200 text-xs"
                  />
                  {step.image && (
                    <div className="w-24 h-16 rounded overflow-hidden border border-gray-200">
                      <img src={step.image} alt="Step Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 8. FEATURED PRODUCTS */}
        {activeTab === 'featuredProducts' && (
          <div className="space-y-5 text-xs">
            <h3 className="text-base font-bold text-brand-dark border-b border-gray-100 pb-2">
              Featured Products Section
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Section Title</label>
                <input
                  type="text"
                  value={configData.featuredProducts?.title || ''}
                  onChange={(e) => updateNested('featuredProducts.title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div>
                <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Subtitle</label>
                <input
                  type="text"
                  value={configData.featuredProducts?.subtitle || ''}
                  onChange={(e) => updateNested('featuredProducts.subtitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* 9. FOOTER */}
        {activeTab === 'footer' && (
          <div className="space-y-5 text-xs">
            <h3 className="text-base font-bold text-brand-dark border-b border-gray-100 pb-2">
              Footer Content & Bio
            </h3>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">About Store Bio</label>
              <textarea
                rows={3}
                value={configData.footer?.aboutText || ''}
                onChange={(e) => updateNested('footer.aboutText', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-brand-dark mb-1">Copyright Line</label>
              <input
                type="text"
                value={configData.footer?.copyrightText || ''}
                onChange={(e) => updateNested('footer.copyrightText', e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-mono"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

