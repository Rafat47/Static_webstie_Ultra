import React, { useState, useEffect } from 'react';
import {
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Share2,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  Key,
  Database,
  ListFilter,
  Search,
  Eye,
  RotateCw,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X
} from 'lucide-react';
import api from '../services/api';
import { formatDate } from '../utils/formatters';

export default function AdminMeta() {
  const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'logs'

  // Settings State
  const [metaSettings, setMetaSettings] = useState({
    pixelId: '',
    capiAccessToken: '',
    testEventCode: '',
    isPixelEnabled: true,
    isCapiEnabled: true,
    isLoggingEnabled: true,
    logRetentionDays: 7
  });
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Logs State
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, totalCount: 0, totalPages: 1 });
  const [stats, setStats] = useState({ total: 0, success: 0, partial_success: 0, failed: 0, pending: 0 });
  const [filterEventName, setFilterEventName] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState(null); // for inspection modal
  const [retryingId, setRetryingId] = useState(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearDays, setClearDays] = useState(0); // 0 = all
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    loadMetaSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs(1);
    }
  }, [activeTab, filterEventName, filterStatus]);

  const loadMetaSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminSiteConfig();
      if (res && res.success && res.data?.metaSettings) {
        setMetaSettings({
          pixelId: res.data.metaSettings.pixelId || '',
          capiAccessToken: res.data.metaSettings.capiAccessToken || '',
          testEventCode: res.data.metaSettings.testEventCode || '',
          isPixelEnabled: res.data.metaSettings.isPixelEnabled !== false,
          isCapiEnabled: res.data.metaSettings.isCapiEnabled !== false,
          isLoggingEnabled: res.data.metaSettings.isLoggingEnabled !== false,
          logRetentionDays: res.data.metaSettings.logRetentionDays || 7
        });
      }
    } catch (err) {
      console.warn('Failed to load Meta settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async (page = 1) => {
    try {
      setLogsLoading(true);
      const params = {
        page,
        limit: 20,
        eventName: filterEventName,
        status: filterStatus,
        search: searchQuery.trim()
      };
      const res = await api.getAdminMetaLogs(params);
      if (res && res.success) {
        setLogs(res.data || []);
        setPagination(res.pagination || { page: 1, limit: 20, totalCount: 0, totalPages: 1 });
        if (res.stats) setStats(res.stats);
      }
    } catch (err) {
      console.warn('Failed to load Meta CAPI logs:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLogs(1);
  };

  const handleSave = async (e) => {
    e?.preventDefault();
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

  const handleRetry = async (logId) => {
    try {
      setRetryingId(logId);
      const res = await api.retryAdminMetaLog(logId);
      if (res && res.success) {
        setActionMessage({ type: 'success', text: `Event successfully redelivered! (Status: ${res.status})` });
        loadLogs(pagination.page);
        if (selectedLog && selectedLog._id === logId) {
          setSelectedLog(res.logRecord);
        }
      } else {
        setActionMessage({ type: 'error', text: res.error || 'Retry attempt failed to reach Meta.' });
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setRetryingId(null);
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const handleClearLogs = async () => {
    try {
      const res = await api.clearAdminMetaLogs(clearDays > 0 ? clearDays : null);
      if (res && res.success) {
        setClearConfirmOpen(false);
        setActionMessage({ type: 'success', text: res.message });
        loadLogs(1);
      }
    } catch (err) {
      setActionMessage({ type: 'error', text: 'Failed to clear logs: ' + err.message });
    } finally {
      setTimeout(() => setActionMessage(null), 5000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Success
          </span>
        );
      case 'partial_success':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800" title="Accepted with diagnostic warnings">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> Warnings
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 animate-pulse">
            <Clock className="w-3 h-3 text-blue-600" /> Pending
          </span>
        );
      case 'failed':
      case 'timeout':
      case 'invalid_payload':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 text-red-600" /> {status.replace('_', ' ')}
          </span>
        );
      case 'retrying':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 animate-pulse">
            <RotateCw className="w-3 h-3 text-purple-600 animate-spin" /> Retrying
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-dark animate-spin" />
        <p className="text-xs font-semibold text-brand-muted">Loading Meta configuration...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-dark tracking-tight">Meta Facebook Integration</h1>
          <p className="text-xs text-brand-muted mt-0.5">
            Manage Meta Pixel, Server-Side Conversions API (CAPI), and Live Event Audit Logs.
          </p>
        </div>

        {activeTab === 'settings' ? (
          <button
            onClick={handleSave}
            disabled={saving}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-brand-dark hover:bg-black text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Meta Configuration'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => loadLogs(pagination.page)}
              disabled={logsLoading}
              className="px-4 py-2 rounded-xl bg-white border border-gray-200 hover:border-black text-brand-dark text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? 'animate-spin' : ''}`} />
              <span>Refresh Logs</span>
            </button>
            <button
              onClick={() => setClearConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean Logs</span>
            </button>
          </div>
        )}
      </div>

      {/* Global Action Message */}
      {actionMessage && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center justify-between animate-fadeIn ${
          actionMessage.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-red-600" />}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="p-1 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Meta settings updated successfully! Browser Pixel and CAPI will apply these rules.</span>
        </div>
      )}

      {saveError && (
        <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs font-bold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('settings')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'settings'
              ? 'border-black text-brand-dark'
              : 'border-transparent text-gray-400 hover:text-brand-dark'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Configuration & Credentials</span>
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'logs'
              ? 'border-black text-brand-dark'
              : 'border-transparent text-gray-400 hover:text-brand-dark'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>CAPI Event Logs</span>
          {stats.total > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-700">
              {stats.total}
            </span>
          )}
        </button>
      </div>

      {/* =========================================================================
          TAB 1: CONFIGURATION & CREDENTIALS
         ========================================================================= */}
      {activeTab === 'settings' && (
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
                  Meta Pixel ID / Dataset ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. 123456789012345"
                  value={metaSettings.pixelId}
                  onChange={(e) => setMetaSettings({ ...metaSettings, pixelId: e.target.value.trim() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:ring-2 focus:ring-black"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  Found in Meta Events Manager under Data Sources &gt; Settings.
                </p>
              </div>

              {/* Conversions API (CAPI) Access Token */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold uppercase tracking-wider text-brand-dark">
                    Conversions API (CAPI) Access Token
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="text-[11px] text-gray-500 hover:text-black font-bold underline"
                  >
                    {showToken ? 'Hide Token' : 'Show Token'}
                  </button>
                </div>
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="Paste your Conversions API Access Token (EAAB...)"
                  value={metaSettings.capiAccessToken || ''}
                  onChange={(e) => setMetaSettings({ ...metaSettings, capiAccessToken: e.target.value.trim() })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs focus:ring-2 focus:ring-black"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  Paste token here OR set via <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-gray-800">META_CAPI_ACCESS_TOKEN</code> in your <code className="bg-gray-100 px-1 py-0.5 rounded font-mono font-bold text-gray-800">.env</code> / Netlify settings.
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-mono text-xs uppercase focus:ring-2 focus:ring-black"
                />
                <p className="text-[11px] text-brand-muted mt-1">
                  Found under Meta Events Manager &gt; Test Events tab. Clear this field in production.
                </p>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={metaSettings.isPixelEnabled}
                    onChange={(e) => setMetaSettings({ ...metaSettings, isPixelEnabled: e.target.checked })}
                    className="mt-0.5 rounded text-black focus:ring-black"
                  />
                  <div>
                    <p className="font-bold text-brand-dark">Enable Browser Meta Pixel</p>
                    <p className="text-[11px] text-brand-muted">Fires standard PageView, ViewContent, Search, AddToCart, InitiateCheckout, and Purchase events in the customer's browser.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={metaSettings.isCapiEnabled}
                    onChange={(e) => setMetaSettings({ ...metaSettings, isCapiEnabled: e.target.checked })}
                    className="mt-0.5 rounded text-black focus:ring-black"
                  />
                  <div>
                    <p className="font-bold text-brand-dark">Enable Server-Side Conversions API (CAPI)</p>
                    <p className="text-[11px] text-brand-muted">Dispatches deduplicated server-side Purchase and conversion signals via Netlify Functions directly to Facebook.</p>
                  </div>
                </label>

                {/* Independent CAPI Logging Control */}
                <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={metaSettings.isLoggingEnabled}
                      onChange={(e) => setMetaSettings({ ...metaSettings, isLoggingEnabled: e.target.checked })}
                      className="mt-0.5 rounded text-black focus:ring-black"
                    />
                    <div>
                      <p className="font-bold text-brand-dark">Enable CAPI Event Logging in MongoDB</p>
                      <p className="text-[11px] text-brand-muted">
                        Audits outgoing sanitized CAPI payloads and Meta API responses. <em>Disabling logging never stops Meta event delivery; it only stops saving audit records.</em>
                      </p>
                    </div>
                  </label>

                  {metaSettings.isLoggingEnabled && (
                    <div className="pt-2 pl-7 flex items-center gap-3">
                      <label className="font-bold text-brand-dark text-xs">Log Retention Period:</label>
                      <select
                        value={metaSettings.logRetentionDays}
                        onChange={(e) => setMetaSettings({ ...metaSettings, logRetentionDays: parseInt(e.target.value) || 7 })}
                        className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white font-bold text-xs"
                      >
                        <option value={3}>3 Days</option>
                        <option value={7}>7 Days (Recommended)</option>
                        <option value={14}>14 Days</option>
                        <option value={30}>30 Days</option>
                      </select>
                      <span className="text-[11px] text-gray-500">(Auto-purged via MongoDB TTL)</span>
                    </div>
                  )}
                </div>
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
                  <li>Navigate pages &rarr; Triggers <code>PageView</code></li>
                  <li>Search for items &rarr; Triggers <code>Search</code></li>
                  <li>Open product page &rarr; Triggers <code>ViewContent</code></li>
                  <li>Add to cart &rarr; Triggers <code>AddToCart</code></li>
                  <li>Go to checkout &rarr; Triggers <code>InitiateCheckout</code></li>
                  <li>Complete order &rarr; Triggers <code>Purchase</code></li>
                </ul>
              </li>
              <li>
                <strong className="text-brand-dark">Inspect CAPI Logs:</strong> Switch to the <strong>CAPI Event Logs</strong> tab above to view real-time delivery status, Meta response bodies, and latency metrics!
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CAPI EVENT LOGS AUDIT VIEWER
         ========================================================================= */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          {/* Summary Stat Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-gray-400 uppercase">Total Events</span>
              <p className="text-2xl font-black text-brand-dark mt-1">{stats.total || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-emerald-600 uppercase">Success</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{stats.success || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-amber-600 uppercase">With Warnings</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{stats.partial_success || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200">
              <span className="text-xs font-bold text-red-600 uppercase">Failed / Timeout</span>
              <p className="text-2xl font-black text-red-600 mt-1">{(stats.failed || 0) + (stats.timeout || 0) + (stats.invalid_payload || 0)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-gray-200 col-span-2 sm:col-span-1">
              <span className="text-xs font-bold text-blue-600 uppercase">Pending</span>
              <p className="text-2xl font-black text-blue-600 mt-1">{stats.pending || 0}</p>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <ListFilter className="w-3.5 h-3.5 text-gray-400" />
                <span className="font-bold text-gray-700">Event:</span>
                <select
                  value={filterEventName}
                  onChange={(e) => setFilterEventName(e.target.value)}
                  className="bg-transparent font-semibold text-gray-900 outline-none"
                >
                  <option value="ALL">All Events</option>
                  <option value="Purchase">Purchase</option>
                  <option value="InitiateCheckout">InitiateCheckout</option>
                  <option value="AddToCart">AddToCart</option>
                  <option value="ViewContent">ViewContent</option>
                  <option value="Search">Search</option>
                  <option value="PageView">PageView</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200">
                <span className="font-bold text-gray-700">Status:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-transparent font-semibold text-gray-900 outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="success">Success</option>
                  <option value="partial_success">Warnings</option>
                  <option value="failed">Failed</option>
                  <option value="pending">Pending</option>
                  <option value="timeout">Timeout</option>
                  <option value="invalid_payload">Invalid Payload</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search Event ID or Order ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-gray-200 text-xs focus:ring-1 focus:ring-black outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-1.5 bg-black text-white font-bold rounded-xl text-xs"
              >
                Search
              </button>
            </form>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-3xl border border-brand-border overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-gray-100">
                <thead className="bg-gray-50 text-gray-500 uppercase font-black tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Event Name</th>
                    <th className="py-3.5 px-4">Event ID</th>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Delivery Status</th>
                    <th className="py-3.5 px-4">HTTP</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-black" />
                        Loading CAPI logs...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-gray-400 space-y-2">
                        <Database className="w-8 h-8 mx-auto text-gray-300 stroke-[1.5]" />
                        <p className="font-bold text-gray-600">No CAPI logs found</p>
                        <p className="text-[11px] text-gray-400">Perform an action on the site (or create an order) to see server CAPI transmission records.</p>
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-black text-brand-dark">
                          {log.eventName}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-gray-600 truncate max-w-[140px]" title={log.eventId}>
                          {log.eventId}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-800">
                          {log.orderId ? `#${log.orderId}` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">
                          {formatDate(log.createdAt)}
                        </td>
                        <td className="py-3.5 px-4">
                          {getStatusBadge(log.status)}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-600">
                          {log.response?.httpStatus || '—'}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500">
                          {log.durationMs !== null ? `${log.durationMs}ms` : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-1.5 rounded-lg border border-gray-200 hover:border-black text-gray-700 hover:text-black transition-colors"
                            title="Inspect Log Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {(log.status === 'failed' || log.status === 'timeout') && (
                            <button
                              onClick={() => handleRetry(log._id)}
                              disabled={retryingId === log._id}
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 transition-colors disabled:opacity-50"
                              title="Retry Event Transmission"
                            >
                              <RotateCw className={`w-3.5 h-3.5 ${retryingId === log._id ? 'animate-spin' : ''}`} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500">
                  Showing page <strong>{pagination.page}</strong> of <strong>{pagination.totalPages}</strong> ({pagination.totalCount} events)
                </span>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => loadLogs(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-bold disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => loadLogs(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-1 bg-white border border-gray-200 rounded-lg font-bold disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          LOG INSPECTION MODAL (Payload & Meta Response Viewer)
         ========================================================================= */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-brand-dark" />
                <div>
                  <h3 className="font-black text-sm text-brand-dark">
                    CAPI Event Inspection: {selectedLog.eventName}
                  </h3>
                  <p className="font-mono text-[11px] text-gray-500">ID: {selectedLog.eventId}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-black hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Status & Meta Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Delivery Status</span>
                  <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">HTTP Status</span>
                  <p className="font-mono font-black text-brand-dark mt-1">
                    {selectedLog.response?.httpStatus || 'N/A'}
                    {selectedLog.response?.httpStatusText ? ` (${selectedLog.response.httpStatusText})` : ''}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Events Received</span>
                  <p className="font-mono font-black text-brand-dark mt-1">{selectedLog.response?.eventsReceived ?? 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400">Request Duration</span>
                  <p className="font-mono font-black text-brand-dark mt-1">{selectedLog.durationMs !== null ? `${selectedLog.durationMs}ms` : 'N/A'}</p>
                </div>
              </div>

              {/* Warnings / Diagnostic Warnings Alert */}
              {selectedLog.response?.messages?.length > 0 && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Meta Diagnostic Warnings</span>
                  </div>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5">
                    {selectedLog.response.messages.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Meta API Error Alert (Detailed) */}
              {(selectedLog.response?.errorMessage || selectedLog.response?.errorCode || selectedLog.response?.parseError) && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-red-800">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span>Meta Error: {selectedLog.response.errorCode || 'Request Failed'}</span>
                    {selectedLog.response?.metaResponseBody?.error?.error_subcode && (
                      <span className="text-[10px] bg-red-200 text-red-800 px-1.5 py-0.5 rounded font-mono">
                        Subcode: {selectedLog.response.metaResponseBody.error.error_subcode}
                      </span>
                    )}
                  </div>
                  {selectedLog.response?.errorMessage && (
                    <p className="text-[11px] font-medium">{selectedLog.response.errorMessage}</p>
                  )}
                  {selectedLog.response?.metaResponseBody?.error?.error_user_title && (
                    <p className="text-[11px] font-bold text-red-950 mt-1">
                      {selectedLog.response.metaResponseBody.error.error_user_title}: {selectedLog.response.metaResponseBody.error.error_user_msg}
                    </p>
                  )}
                  {selectedLog.response?.parseError && (
                    <p className="text-[10px] font-mono text-red-700">JSON Parse Status: {selectedLog.response.responseParseStatus} ({selectedLog.response.parseError})</p>
                  )}
                </div>
              )}

              {/* Outgoing Sanitized Payload */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                    Sanitized Outgoing Payload (Transmitted to Meta)
                  </span>
                  <span className="text-[10px] text-gray-400">Cleaned & Hashed SHA-256 Customer Data</span>
                </div>
                <pre className="bg-gray-900 text-emerald-400 p-4 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                  {JSON.stringify(selectedLog.request?.payload, null, 2)}
                </pre>
              </div>

              {/* Meta API Response */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                      Complete Meta Graph API Response Body
                    </span>
                    {selectedLog.response?.responseParseStatus && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase font-bold ${
                        selectedLog.response.responseParseStatus === 'success' ? 'bg-emerald-100 text-emerald-700' :
                        selectedLog.response.responseParseStatus === 'empty' ? 'bg-gray-100 text-gray-600' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {selectedLog.response.responseParseStatus}
                      </span>
                    )}
                  </div>
                  {selectedLog.response?.fbtraceId && (
                    <span className="text-[10px] font-mono text-gray-500">fbtrace_id: {selectedLog.response.fbtraceId}</span>
                  )}
                </div>
                <pre className="bg-gray-900 text-blue-300 p-4 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed max-h-60">
                  {JSON.stringify(
                    selectedLog.response?.metaResponseBody ?? (
                      typeof selectedLog.response?.rawBody === 'string'
                        ? selectedLog.response.rawBody
                        : (selectedLog.response?.rawBody || selectedLog.response)
                    ),
                    null,
                    2
                  )}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <span className="text-[11px] text-gray-500">
                Created: {formatDate(selectedLog.createdAt)}
              </span>
              <div className="flex items-center gap-2">
                {(selectedLog.status === 'failed' || selectedLog.status === 'timeout') && (
                  <button
                    onClick={() => handleRetry(selectedLog._id)}
                    disabled={retryingId === selectedLog._id}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${retryingId === selectedLog._id ? 'animate-spin' : ''}`} />
                    <span>{retryingId === selectedLog._id ? 'Retrying...' : 'Retry Event Now'}</span>
                  </button>
                )}
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-brand-dark rounded-xl font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOG CLEANUP MODAL
         ========================================================================= */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-brand-dark">Clean CAPI Audit Logs</h3>
              <p className="text-xs text-gray-500">
                Choose the cleanup range. This only purges CAPI event logs to conserve MongoDB storage; it will NEVER affect orders or products.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-bold text-gray-700">Delete Scope:</label>
              <select
                value={clearDays}
                onChange={(e) => setClearDays(parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 font-bold"
              >
                <option value={0}>Delete ALL Logs (Full Reset)</option>
                <option value={7}>Delete logs older than 7 days</option>
                <option value={14}>Delete logs older than 14 days</option>
                <option value={30}>Delete logs older than 30 days</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 font-bold text-xs text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleClearLogs}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 font-bold text-xs text-white shadow-md transition-colors"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
