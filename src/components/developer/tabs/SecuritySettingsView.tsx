import React, { useState, useEffect } from 'react';
import { 
  Settings, ShieldCheck, Lock, Globe, AlertTriangle, 
  RotateCw, Check, Copy, Radio, Shield, Sparkles, Layers,
  Bot, Camera, Trash2, Upload
} from 'lucide-react';

interface SecuritySettingsViewProps {
  app: any;
  environment?: 'test' | 'live';
  onSetEnvironment?: (env: 'test' | 'live') => void;
  showToast: (msg: string) => void;
  onUpdateApp: (updates: any) => Promise<void>;
  onRotateKey: () => Promise<void>;
  onDeleteApp?: () => Promise<void>;
}

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({
  app,
  environment = 'test',
  onSetEnvironment,
  showToast,
  onUpdateApp,
  onRotateKey,
  onDeleteApp
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setAppName(app?.app_name || '');
    setAppDescription(app?.app_description || '');
    setWebsiteUrl(app?.website_url || '');
    setAllowedIps(formatAllowedIps(app?.allowed_ips));
  }, [app]);

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Center crop square & convert to 256x256 circular profile picture
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
          const base64Url = canvas.toDataURL('image/jpeg', 0.88);
          onUpdateApp({ avatar_url: base64Url });
          showToast(environment === 'live' 
            ? 'Profile picture updated! Active and visible to users in Live mode.' 
            : 'Profile picture saved! Photo is hidden in Sandbox mode and will show once switched to Live mode.');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onUpdateApp({ avatar_url: null });
    showToast('Service account profile picture removed.');
  };

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

          {/* Minimal Square Photo Upload & Auto-Circle UI */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-200 border-2 border-indigo-500/20 shadow-2xs shrink-0 flex items-center justify-center">
                {app?.avatar_url ? (
                  <img src={app.avatar_url} alt="Service Account Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Bot className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-slate-900">Profile Picture</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-indigo-50 text-indigo-700 border-indigo-200">
                    Official Service Account Avatar
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Square photo auto-customized to circle. Custom avatar for your service account.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="cursor-pointer px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-all flex items-center gap-1.5">
                <Camera className="h-3.5 w-3.5" />
                <span>{app?.avatar_url ? 'Change Photo' : 'Upload Photo'}</span>
                <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
              </label>
              {app?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-2 py-1.5 text-xs text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
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

      {/* Irreversible Danger Zone: Delete Service Account */}
      {onDeleteApp && (
        <div className="bg-red-950/10 border border-red-300 dark:border-red-900/60 rounded-xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-red-900 dark:text-red-400 flex items-center gap-2 uppercase tracking-wider">
                <Trash2 className="h-4 w-4 text-red-600 dark:text-red-500" />
                Delete Service Account
              </h3>
              <p className="text-[11px] text-red-700 dark:text-red-400/90 mt-0.5">
                Permanently destroy this service account, revoking API keys, webhook endpoints, and credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Service Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Red Warning Confirmation Modal for Deleting Service Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-red-300 dark:border-red-800/80 w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-800/80 shrink-0">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Delete Service Account
                </h3>
                <p className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest mt-0.5">
                  ⚠️ Action Cannot Be Undone
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl space-y-2 text-xs text-red-900 dark:text-red-200 leading-relaxed">
              <p className="font-bold">
                DANGER: Are you sure you want to permanently delete this service account ({app?.app_name || 'Service Account'})?
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-red-800 dark:text-red-300">
                <li>All active client IDs, client secrets, and API keys will be immediately revoked.</li>
                <li>Webhook endpoints and automated messaging integrations will stop functioning.</li>
                <li>This action is permanent and cannot be reversed from backend or database.</li>
              </ul>
              <p className="pt-1 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                After deletion, you can freely create a new clean service account from your Developer Console.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  setIsDeleting(true);
                  try {
                    if (onDeleteApp) {
                      await onDeleteApp();
                    }
                  } catch (err: any) {
                    showToast('Delete failed: ' + err.message);
                  } finally {
                    setIsDeleting(false);
                    setShowDeleteModal(false);
                  }
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'Deleting...' : 'Yes, Delete Service Account'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
