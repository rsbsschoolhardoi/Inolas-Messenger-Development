import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Lock, Globe, AlertTriangle, 
  RotateCw, Check, Copy, Radio, Shield, Sparkles, Layers
} from 'lucide-react';

interface SecuritySettingsViewProps {
  app: any;
  environment?: 'test' | 'live';
  onSetEnvironment?: (env: 'test' | 'live') => void;
  showToast: (msg: string) => void;
  onUpdateApp: (updates: any) => Promise<void>;
  onRotateKey: () => Promise<void>;
}

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({
  app,
  environment = 'test',
  onSetEnvironment,
  showToast,
  onUpdateApp,
  onRotateKey
}) => {
  const formatAllowedIps = (ips: any): string => {
    if (Array.isArray(ips)) return ips.join(', ');
    if (typeof ips === 'string') return ips;
    return '';
  };

  const [appName, setAppName] = useState(app?.app_name || '');
  const [appDescription, setAppDescription] = useState(app?.app_description || '');
  const [websiteUrl, setWebsiteUrl] = useState(app?.website_url || '');
  const [allowedIps, setAllowedIps] = useState(formatAllowedIps(app?.allowed_ips));
  const [isSaving, setIsSaving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    setAppName(app?.app_name || '');
    setAppDescription(app?.app_description || '');
    setWebsiteUrl(app?.website_url || '');
    setAllowedIps(formatAllowedIps(app?.allowed_ips));
  }, [app]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const ipList = allowedIps
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

      await onUpdateApp({
        app_description: appDescription.trim(),
        website_url: websiteUrl.trim(),
        allowed_ips: ipList
      });
      showToast('Application security settings updated successfully!');
    } catch (err: any) {
      showToast('Failed to save settings: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTriggerRotation = async () => {
    if (!window.confirm('Are you sure you want to rotate your API credentials? Any active SDK integration using the old keys will need to be re-copied.')) {
      return;
    }
    setIsRotating(true);
    try {
      await onRotateKey();
      showToast('API credentials rotated successfully! New keys have been embedded in SDKs.');
    } catch (err: any) {
      showToast('Rotation failed: ' + err.message);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-indigo-600" />
          Settings & Security Controls
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage operational environment mode, service account profiles, and network IP whitelisting.
        </p>
      </div>

      {/* 1. COMPACT ACCOUNT ENVIRONMENT & OPERATIONAL MODE */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" />
              Environment & Gateway Mode
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Select active gateway mode for API calls and client SDKs.
            </p>
          </div>
          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
            environment === 'test' 
              ? 'bg-amber-50 text-amber-800 border-amber-200' 
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {environment === 'test' ? 'Sandbox Mode' : 'Live Production'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Sandbox Option */}
          <div 
            onClick={() => {
              onSetEnvironment?.('test');
              showToast('Account environment switched to Test (Sandbox) Mode.');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              environment === 'test'
                ? 'border-amber-500 bg-amber-50/50 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 font-bold text-xs text-amber-950">
                <Radio className={`h-3.5 w-3.5 text-amber-600 ${environment === 'test' ? 'animate-pulse' : ''}`} />
                Test (Sandbox) Environment
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 uppercase">
                Free • 0 Credits
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Simulates all dispatches &amp; events with zero balance deduction.
            </p>
            <div className="mt-2 text-[10px] font-bold text-amber-800">
              {environment === 'test' ? '✓ Currently Active' : 'Click to Select'}
            </div>
          </div>

          {/* Live Production Option */}
          <div 
            onClick={() => {
              onSetEnvironment?.('live');
              showToast('Account environment switched to Live Production Mode.');
            }}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              environment === 'live'
                ? 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 font-bold text-xs text-emerald-950">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                Live (Production) Environment
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 uppercase">
                Production SLA
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              Connects directly to live carrier gateways &amp; production channels.
            </p>
            <div className="mt-2 text-[10px] font-bold text-emerald-800">
              {environment === 'live' ? '✓ Currently Active' : 'Click to Select'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Compact Service Account Profile */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-600" />
              Service Account Profile
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-600 border border-slate-200">
              Locked Identity
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <span>Application Name</span>
                <Lock className="h-3 w-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={appName}
                readOnly
                disabled
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-medium text-xs cursor-not-allowed select-none"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <span>Bot Username Handle</span>
                <Lock className="h-3 w-3 text-slate-400" />
              </label>
              <input
                type="text"
                value={app?.bot_username ? `@${app.bot_username.replace(/^@/, '')}` : ''}
                readOnly
                disabled
                className="w-full px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 font-mono text-xs cursor-not-allowed select-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Website / App URL
              </label>
              <input
                type="url"
                value={websiteUrl}
                onChange={e => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-xs text-slate-900"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                Service Description
              </label>
              <input
                type="text"
                value={appDescription}
                onChange={e => setAppDescription(e.target.value)}
                placeholder="Brief description of application"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none text-xs text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Compact Network Security / IP Whitelist */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 md:p-5 shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" />
              IP Access Control &amp; Network Whitelisting
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Allowed IP Addresses (Comma-separated CIDRs or IPs)
            </label>
            <input
              type="text"
              value={allowedIps}
              onChange={e => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.1, 10.0.0.0/24 (Leave empty for any IP)"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono text-xs text-slate-900 outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Compact Danger Zone: Credential Rotation */}
      <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 shadow-2xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-rose-900 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
            Cryptographic Credential Rotation
          </h3>
          <button
            type="button"
            onClick={handleTriggerRotation}
            disabled={isRotating}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            {isRotating ? 'Rotating...' : 'Rotate Keys'}
          </button>
        </div>
        <p className="text-[11px] text-rose-700 leading-snug">
          Cycling credentials invalidates prior API secret tokens. Generated SDK files will immediately update with new cryptographic keys.
        </p>
      </div>
    </div>
  );
};
