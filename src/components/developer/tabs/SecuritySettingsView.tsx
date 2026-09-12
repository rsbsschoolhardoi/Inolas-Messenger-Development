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
  themeMode?: 'light' | 'dark';
}

export const SecuritySettingsView: React.FC<SecuritySettingsViewProps> = ({
  app,
  environment = 'test',
  onSetEnvironment,
  showToast,
  onUpdateApp,
  onRotateKey,
  onDeleteApp,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';

  const formatAllowedIps = (ips: any): string => {
    if (Array.isArray(ips)) return ips.join(', ');
    if (typeof ips === 'string') return ips;
    return '';
  };

  const [appName, setAppName] = useState(app?.app_name || '');
  const [appDescription, setAppDescription] = useState(app?.app_description || app?.bio || '');
  const [websiteUrl, setWebsiteUrl] = useState(app?.website_url || '');
  const [additionalWebsites, setAdditionalWebsites] = useState(app?.additional_websites || '');
  const [officeAddress, setOfficeAddress] = useState(app?.office_address || app?.address || '');
  const [supportEmail, setSupportEmail] = useState(app?.support_email || '');
  const [supportPhone, setSupportPhone] = useState(app?.support_phone || '');
  const [allowedIps, setAllowedIps] = useState(formatAllowedIps(app?.allowed_ips));
  const [isSaving, setIsSaving] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setAppName(app?.app_name || '');
    setAppDescription(app?.app_description || app?.bio || '');
    setWebsiteUrl(app?.website_url || '');
    setAdditionalWebsites(app?.additional_websites || '');
    setOfficeAddress(app?.office_address || app?.address || '');
    setSupportEmail(app?.support_email || '');
    setSupportPhone(app?.support_phone || '');
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
          showToast('Profile picture updated and visible on service account profile!');
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
        additional_websites: additionalWebsites.trim(),
        office_address: officeAddress.trim(),
        support_email: supportEmail.trim(),
        support_phone: supportPhone.trim(),
        allowed_ips: ipList
      });
      showToast('Application profile & security settings updated successfully!');
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2 text-[#0d253d] dark:text-white">
          <Settings className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
          Settings & Security Controls
        </h2>
        <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
          Manage operational environment mode, service account profiles, and network IP whitelisting.
        </p>
      </div>

      {/* 1. COMPACT ACCOUNT ENVIRONMENT & OPERATIONAL MODE */}
      <div className={`rounded-2xl p-5 shadow-xs space-y-4 border ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
        }`}>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Layers className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Environment & Gateway Mode
            </h3>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
              Select active gateway mode for API calls and client SDKs.
            </p>
          </div>
          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
            environment === 'test' 
              ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
              : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
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
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              environment === 'test'
                ? isDark 
                  ? 'border-amber-500/80 bg-amber-500/10 ring-1 ring-amber-500/30' 
                  : 'border-amber-500 bg-amber-50/50 shadow-2xs'
                : isDark 
                  ? 'border-[#273951] hover:border-[#384b66] bg-[#121624]' 
                  : 'border-[#e3e8ee] hover:border-[#cbd5e1] bg-[#f6f9fc]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 font-bold text-xs text-amber-500">
                <Radio className={`h-3.5 w-3.5 ${environment === 'test' ? 'animate-pulse' : ''}`} />
                Test (Sandbox) Environment
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 uppercase">
                Free • 0 Credits
              </span>
            </div>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-normal">
              Simulates all dispatches &amp; events with zero balance deduction.
            </p>
            <div className="mt-2.5 text-[11px] font-bold text-amber-500">
              {environment === 'test' ? '✓ Currently Active' : 'Click to Select'}
            </div>
          </div>

          {/* Live Production Option */}
          <div 
            onClick={() => {
              onSetEnvironment?.('live');
              showToast('Account environment switched to Live Production Mode.');
            }}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              environment === 'live'
                ? isDark 
                  ? 'border-emerald-500/80 bg-emerald-500/10 ring-1 ring-emerald-500/30' 
                  : 'border-emerald-600 bg-emerald-50/50 shadow-2xs'
                : isDark 
                  ? 'border-[#273951] hover:border-[#384b66] bg-[#121624]' 
                  : 'border-[#e3e8ee] hover:border-[#cbd5e1] bg-[#f6f9fc]/50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 font-bold text-xs text-emerald-500">
                <Shield className="h-3.5 w-3.5" />
                Live (Production) Environment
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase">
                Production SLA
              </span>
            </div>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-normal">
              Connects directly to live carrier gateways &amp; production channels.
            </p>
            <div className="mt-2.5 text-[11px] font-bold text-emerald-500">
              {environment === 'live' ? '✓ Currently Active' : 'Click to Select'}
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Service Account Profile */}
        <div className={`rounded-2xl p-5 shadow-xs space-y-4 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Lock className="h-4 w-4 text-amber-500" />
              Service Account Profile
            </h3>
            <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
              isDark ? 'bg-[#121624] border-[#273951] text-[#94a3b8]' : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#64748d]'
            }`}>
              Locked Identity
            </span>
          </div>

          {/* Minimal Square Photo Upload & Auto-Circle UI */}
          <div className={`rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative h-12 w-12 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-800 border-2 border-[#533afd]/40 shadow-xs shrink-0 flex items-center justify-center">
                {app?.avatar_url ? (
                  <img src={app.avatar_url} alt="Service Account Avatar" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <Bot className="h-6 w-6 text-[#64748d] dark:text-[#94a3b8]" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#0d253d] dark:text-white">Profile Picture / Avatar</h4>
                <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8]">Upload a square image; will be displayed as circular avatar.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="cursor-pointer px-3 py-1.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors">
                <Upload className="h-3 w-3" />
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
              </label>

              {app?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isDark ? 'bg-[#1c1e54] border-[#273951] text-rose-400 hover:bg-rose-500/20' : 'bg-white border-[#e3e8ee] text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                Bio / Service Description
              </label>
              <textarea
                rows={2}
                value={appDescription}
                onChange={e => setAppDescription(e.target.value)}
                placeholder="Official communications and transactional alerts service."
                className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs resize-none transition-all ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                  Primary Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                  Additional Websites / Links
                </label>
                <input
                  type="text"
                  value={additionalWebsites}
                  onChange={e => setAdditionalWebsites(e.target.value)}
                  placeholder="https://docs.example.com, https://status.example.com"
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  placeholder="support@example.com"
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                  Customer Support Mobile / Phone
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
                Office / Physical Address
              </label>
              <textarea
                rows={2}
                value={officeAddress}
                onChange={e => setOfficeAddress(e.target.value)}
                placeholder="Innovation Tower, Sovereign Tech District, Suite 400"
                className={`w-full px-3.5 py-2 rounded-xl border outline-none text-xs resize-none transition-all ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* IP Whitelist & Network Security */}
        <div className={`rounded-2xl p-5 shadow-xs space-y-3 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Globe className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              IP Access Control &amp; Network Whitelisting
            </h3>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1">
              Allowed IP Addresses (Comma-separated CIDRs or IPs)
            </label>
            <input
              type="text"
              value={allowedIps}
              onChange={e => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.1, 10.0.0.0/24 (Leave empty for any IP)"
              className={`w-full px-3.5 py-2 rounded-xl border font-mono text-xs outline-none transition-all ${
                isDark 
                  ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                  : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
              }`}
            />
          </div>
        </div>

        {/* Save Settings Button */}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            {isSaving ? 'Saving Changes...' : 'Save Configuration'}
          </button>
        </div>
      </form>

      {/* Danger Zone: Credential Rotation */}
      <div className={`rounded-2xl p-5 shadow-xs space-y-3 border ${
        isDark ? 'bg-rose-950/20 border-rose-500/30' : 'bg-rose-50/70 border-rose-200'
      }`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-rose-500 flex items-center gap-2 uppercase tracking-wider">
            <AlertTriangle className="h-4 w-4 text-rose-500" />
            Cryptographic Credential Rotation
          </h3>
          <button
            type="button"
            onClick={handleTriggerRotation}
            disabled={isRotating}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RotateCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
            {isRotating ? 'Rotating...' : 'Rotate Keys'}
          </button>
        </div>
        <p className="text-xs text-rose-400 dark:text-rose-300 leading-relaxed">
          Cycling credentials invalidates prior API secret tokens. Generated SDK files will immediately update with new cryptographic keys.
        </p>
      </div>

      {/* Irreversible Danger Zone: Delete Service Account */}
      {onDeleteApp && (
        <div className={`rounded-2xl p-5 shadow-xs space-y-3 border ${
          isDark ? 'bg-red-950/30 border-red-500/40' : 'bg-red-50/70 border-red-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-red-500 flex items-center gap-2 uppercase tracking-wider">
                <Trash2 className="h-4 w-4 text-red-500" />
                Delete Service Account
              </h3>
              <p className="text-xs text-red-400 dark:text-red-300 mt-0.5">
                Permanently destroy this service account, revoking API keys, webhook endpoints, and credentials.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Service Account</span>
            </button>
          </div>
        </div>
      )}

      {/* Red Warning Confirmation Modal for Deleting Service Account */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`border w-full max-w-lg rounded-2xl p-6 sm:p-8 shadow-2xl space-y-5 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/20 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Delete Service Account
                </h3>
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mt-0.5">
                  ⚠️ Action Cannot Be Undone
                </p>
              </div>
            </div>

            <div className={`p-4 rounded-xl space-y-2 text-xs leading-relaxed border ${
              isDark ? 'bg-red-950/20 border-red-500/30 text-red-200' : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <p className="font-bold">
                DANGER: Are you sure you want to permanently delete this service account ({app?.app_name || 'Service Account'})?
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>All active client IDs, client secrets, and API keys will be immediately revoked.</li>
                <li>Webhook endpoints and automated messaging integrations will stop functioning.</li>
                <li>This action is permanent and cannot be reversed from backend or database.</li>
              </ul>
              <p className="pt-1 text-[11px] font-semibold opacity-80">
                After deletion, you can freely create a new clean service account from your Developer Console.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isDark ? 'bg-[#121624] text-white hover:bg-[#1c1e54]' : 'bg-[#f6f9fc] text-[#0d253d] hover:bg-[#e3e8ee]'
                }`}
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
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
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
