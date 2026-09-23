import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, ShieldCheck, Lock, Globe, AlertTriangle, 
  RotateCw, Check, Copy, Radio, Shield, Sparkles, Layers,
  Bot, Camera, Trash2, Upload, ExternalLink, KeyRound, 
  Info, AlertCircle, RefreshCw, X, ChevronRight
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

const safeTrim = (val: unknown): string => {
  if (typeof val === 'string') return val.trim();
  if (val === null || val === undefined) return '';
  return String(val).trim();
};

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

  // Profile & Contact Inputs
  const [appDescription, setAppDescription] = useState(app?.app_description || app?.bio || '');
  const [websiteUrl, setWebsiteUrl] = useState(app?.website_url || '');
  const [additionalWebsites, setAdditionalWebsites] = useState(app?.additional_websites || '');
  const [officeAddress, setOfficeAddress] = useState(app?.office_address || app?.address || '');
  const [supportEmail, setSupportEmail] = useState(app?.support_email || '');
  const [supportPhone, setSupportPhone] = useState(app?.support_phone || '');
  const [allowedIps, setAllowedIps] = useState(formatAllowedIps(app?.allowed_ips));

  // Form State
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Controlled Modals (Zero native window.confirm)
  const [showRotateModal, setShowRotateModal] = useState(false);
  const [rotateConfirmedTerms, setRotateConfirmedTerms] = useState(false);
  const [isRotating, setIsRotating] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Sync state when app prop changes
  useEffect(() => {
    setAppDescription(app?.app_description || app?.bio || '');
    setWebsiteUrl(app?.website_url || '');
    setAdditionalWebsites(app?.additional_websites || '');
    setOfficeAddress(app?.office_address || app?.address || '');
    setSupportEmail(app?.support_email || '');
    setSupportPhone(app?.support_phone || '');
    setAllowedIps(formatAllowedIps(app?.allowed_ips));
  }, [
    app?.id, 
    app?.updated_at, 
    app?.avatar_url,
    app?.app_description,
    app?.bio,
    app?.website_url,
    app?.additional_websites,
    app?.office_address,
    app?.address,
    app?.support_email,
    app?.support_phone
  ]);

  // Compute whether there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    const initialDesc = app?.app_description || app?.bio || '';
    const initialWeb = app?.website_url || '';
    const initialAddWeb = app?.additional_websites || '';
    const initialAddress = app?.office_address || app?.address || '';
    const initialEmail = app?.support_email || '';
    const initialPhone = app?.support_phone || '';
    const initialIps = formatAllowedIps(app?.allowed_ips);

    return (
      safeTrim(appDescription) !== safeTrim(initialDesc) ||
      safeTrim(websiteUrl) !== safeTrim(initialWeb) ||
      safeTrim(additionalWebsites) !== safeTrim(initialAddWeb) ||
      safeTrim(officeAddress) !== safeTrim(initialAddress) ||
      safeTrim(supportEmail) !== safeTrim(initialEmail) ||
      safeTrim(supportPhone) !== safeTrim(initialPhone) ||
      safeTrim(allowedIps) !== safeTrim(initialIps)
    );
  }, [
    app,
    appDescription,
    websiteUrl,
    additionalWebsites,
    officeAddress,
    supportEmail,
    supportPhone,
    allowedIps
  ]);

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
          showToast('Profile picture updated and synced with service account profile.');
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
    setSaveSuccess(false);

    try {
      const ipList = safeTrim(allowedIps)
        ? allowedIps
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        : [];

      // Validate email format if provided
      const trimmedEmail = safeTrim(supportEmail);
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        showToast('Please provide a valid support email address.');
        setIsSaving(false);
        return;
      }

      await onUpdateApp({
        app_description: safeTrim(appDescription),
        website_url: safeTrim(websiteUrl),
        additional_websites: safeTrim(additionalWebsites),
        office_address: safeTrim(officeAddress),
        support_email: trimmedEmail,
        support_phone: safeTrim(supportPhone),
        allowed_ips: ipList
      });

      setSaveSuccess(true);
      showToast('Service account settings saved & applied permanently!');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      showToast('Failed to save settings: ' + (err?.message || 'Network error'));
    } finally {
      setIsSaving(false);
    }
  };

  const executeKeyRotation = async () => {
    if (!rotateConfirmedTerms) return;
    setIsRotating(true);
    try {
      await onRotateKey();
      setShowRotateModal(false);
      setRotateConfirmedTerms(false);
      showToast('API credentials rotated successfully! Active secrets refreshed.');
    } catch (err: any) {
      showToast('Key rotation failed: ' + (err?.message || 'Server error'));
    } finally {
      setIsRotating(false);
    }
  };

  const executeDeleteApp = async () => {
    const requiredHandle = (app?.bot_username || app?.id || '').toLowerCase().replace(/^@/, '');
    const entered = deleteConfirmationInput.trim().toLowerCase().replace(/^@/, '');
    
    if (entered !== requiredHandle) {
      showToast(`Please type @${requiredHandle} to confirm decommissioning.`);
      return;
    }

    setIsDeleting(true);
    try {
      if (onDeleteApp) {
        await onDeleteApp();
        setShowDeleteModal(false);
        setDeleteConfirmationInput('');
      }
    } catch (err: any) {
      showToast('Decommission failed: ' + (err?.message || 'Server error'));
    } finally {
      setIsDeleting(false);
    }
  };

  const rawBotHandle = (app?.bot_username || app?.id || 'service_account').replace(/^@/, '');

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2.5 text-[#0d253d] dark:text-white">
            <Settings className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
            Settings & Service Account Controls
          </h2>
          <p className="text-xs sm:text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
            Configure service account identity, customer support endpoints, network whitelisting, and credential lifecycle.
          </p>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold animate-pulse self-start sm:self-auto">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Unsaved Changes</span>
          </div>
        )}
      </div>

      {/* 1. OPERATIONAL ENVIRONMENT MODE */}
      <div className={`rounded-2xl p-5 shadow-xs space-y-4 border ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
      }`}>
        <div className={`flex items-center justify-between border-b pb-3 ${
          isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
        }`}>
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Layers className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Gateway Environment Mode
            </h3>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
              Toggles between the zero-credit sandbox simulator and the live carrier-backed production network.
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
              showToast('Switched to Sandbox (Test) mode.');
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
              Simulates webhook deliveries, transactional dispatches, and SDK calls with zero quota consumption.
            </p>
            <div className="mt-2.5 text-[11px] font-bold text-amber-500">
              {environment === 'test' ? '✓ Currently Active' : 'Click to Activate'}
            </div>
          </div>

          {/* Live Production Option */}
          <div 
            onClick={() => {
              onSetEnvironment?.('live');
              showToast('Switched to Live Production mode.');
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
              Directly delivers authenticated messages and OTPs to real destination end-users across carrier networks.
            </p>
            <div className="mt-2.5 text-[11px] font-bold text-emerald-500">
              {environment === 'live' ? '✓ Currently Active' : 'Click to Activate'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. PRIMARY FORM: PROFILE & OPERATIONAL SETTINGS */}
      <form onSubmit={handleSaveSettings} className="space-y-4">
        {/* Immutable Protocol Identifiers (Read-only banner) */}
        <div className={`rounded-2xl p-5 shadow-xs border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 mb-4 border-[#e3e8ee] dark:border-[#273951]">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-amber-500" />
              <h3 className="text-sm font-bold">Service Account Protocol Identity</h3>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-[#e3e8ee] dark:border-[#273951] text-[#64748d] dark:text-[#94a3b8]">
              Fixed Protocol Binding
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'}`}>
              <div className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8]">Service Account Name</div>
              <div className="text-sm font-bold text-[#0d253d] dark:text-white mt-0.5">{app?.app_name || 'Business Service'}</div>
              <div className="text-[10px] text-[#94a3b8] dark:text-[#64748d] mt-1">Immutable across protocol certificates</div>
            </div>

            <div className={`p-3 rounded-xl border ${isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'}`}>
              <div className="text-[11px] font-medium text-[#64748d] dark:text-[#94a3b8]">Bot Handle / Protocol ID</div>
              <div className="text-sm font-bold text-[#533afd] dark:text-[#818cf8] mt-0.5 font-mono">@{rawBotHandle}</div>
              <div className="text-[10px] text-[#94a3b8] dark:text-[#64748d] mt-1">Unique sovereign routing address</div>
            </div>
          </div>
        </div>

        {/* Public Profile & Contact Info */}
        <div className={`rounded-2xl p-5 shadow-xs space-y-4 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className={`flex items-center justify-between border-b pb-3 ${
            isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
          }`}>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Bot className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Public Entity Profile & Contacts
            </h3>
            <span className="text-xs text-[#64748d] dark:text-[#94a3b8]">
              Shown to users in conversation info
            </span>
          </div>

          {/* Avatar Upload */}
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
                <h4 className="text-xs font-bold text-[#0d253d] dark:text-white">Profile Photo / Brand Logo</h4>
                <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8]">Square JPG, PNG, or WebP. Centered into a circular avatar.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="cursor-pointer px-3.5 py-1.5 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Logo</span>
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
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                Bio / Service Description
              </label>
              <textarea
                rows={2}
                value={appDescription}
                onChange={e => setAppDescription(e.target.value)}
                placeholder="Official transactional alerts and customer communication channel."
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs resize-none transition-all ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                  Primary Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://company.example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                  Additional Documentation or Status Links
                </label>
                <input
                  type="text"
                  value={additionalWebsites}
                  onChange={e => setAdditionalWebsites(e.target.value)}
                  placeholder="https://docs.example.com, https://status.example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                  Customer Support Email
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  placeholder="support@company.example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                  Customer Support Phone / Hotline
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  placeholder="+91 1800 123 4567"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-all ${
                    isDark 
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                      : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
                Physical Office / Corporate Address
              </label>
              <textarea
                rows={2}
                value={officeAddress}
                onChange={e => setOfficeAddress(e.target.value)}
                placeholder="Tech Tower, 4th Floor, Electronic City, Bengaluru, Karnataka, 560100"
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs resize-none transition-all ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* IP Access Control */}
        <div className={`rounded-2xl p-5 shadow-xs space-y-3 border ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
        }`}>
          <div className="flex items-center justify-between border-b pb-3 border-[#e3e8ee] dark:border-[#273951]">
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <Globe className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Network IP Access Whitelist
            </h3>
            <span className="text-[11px] text-[#64748d] dark:text-[#94a3b8]">Optional Security Layer</span>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748d] dark:text-[#94a3b8] mb-1.5">
              Allowed Server IP Addresses / CIDRs (Comma-separated)
            </label>
            <input
              type="text"
              value={allowedIps}
              onChange={e => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.10, 10.0.0.0/24 (Leave blank to permit any ingress source)"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs outline-none transition-all ${
                isDark 
                  ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' 
                  : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
              }`}
            />
            <p className="text-[11px] text-[#64748d] dark:text-[#94a3b8] mt-1.5">
              When configured, API dispatches matching this service account will reject incoming requests from unauthorized origins.
            </p>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-[#64748d] dark:text-[#94a3b8]">
            {hasUnsavedChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                You have unsaved changes. Remember to click save.
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                <Check className="h-3.5 w-3.5" /> All settings synced
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || (!hasUnsavedChanges && !saveSuccess)}
            className="px-6 py-2.5 bg-[#533afd] hover:bg-[#432ec4] disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-300" />
                <span>Saved Successfully!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                <span>Save Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 3. DEDICATED CRYPTOGRAPHIC GOVERNANCE & LIFECYCLE (Structured, High-Security UI) */}
      <div className={`rounded-2xl p-5 shadow-xs border ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
      }`}>
        <div className="flex items-start justify-between gap-4 border-b pb-4 mb-4 border-[#e3e8ee] dark:border-[#273951]">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2 text-[#0d253d] dark:text-white">
              <KeyRound className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              Cryptographic Credentials & Lifecycle Governance
            </h3>
            <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">
              Actions in this section carry immediate operational impact. Access is restricted and requires explicit confirmation.
            </p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[#64748d] dark:text-[#94a3b8] shrink-0">
            High Privilege
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Rotation Action Card */}
          <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#0d253d] dark:text-white">
                <RotateCw className="h-4 w-4 text-amber-500" />
                <span>Rotate API Credentials</span>
              </div>
              <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                Immediately revokes the active Client Secret and provisions a fresh key. All deployed SDKs and backend processes will require updated secrets.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRotateConfirmedTerms(false);
                setShowRotateModal(true);
              }}
              className="mt-2 w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>Initiate Key Rotation</span>
            </button>
          </div>

          {/* Delete Service Account Action Card */}
          {onDeleteApp && (
            <div className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
              isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
            }`}>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-[#0d253d] dark:text-white">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Decommission Service Account</span>
                </div>
                <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1.5 leading-relaxed">
                  Permanently deletes this service account, revokes all API tokens, deletes webhook routes, and unbinds the bot handle.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationInput('');
                  setShowDeleteModal(true);
                }}
                className="mt-2 w-full py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Decommission Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: HIGH PRIVILEGE KEY ROTATION MODAL */}
      {showRotateModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rotate-modal-title"
        >
          <div className={`border w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <RotateCw className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="rotate-modal-title" className="text-base font-bold text-[#0d253d] dark:text-white">
                    Rotate Service Account Secrets
                  </h3>
                  <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-0.5">
                    Target: @{rawBotHandle} ({app?.app_name})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className="p-1.5 rounded-lg text-[#64748d] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2.5 ${
              isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                <span>Operational Downtime Warning</span>
              </div>
              <p>
                When credentials are cycled, the existing Client Secret becomes invalid immediately. Any active production server, worker, or SDK instance sending dispatches with the old secret will receive <strong>HTTP 401 Unauthorized</strong>.
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                <li>Active tokens will expire instantly.</li>
                <li>New client secret must be copied and updated in your <code>.env</code> file.</li>
                <li>Sandbox mode credentials can be independently tested before production rotation.</li>
              </ul>
            </div>

            {/* Checkbox acknowledgment */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
              rotateConfirmedTerms 
                ? isDark ? 'bg-[#1b233a] border-[#533afd]' : 'bg-indigo-50 border-[#533afd]'
                : isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
            }`}>
              <input
                type="checkbox"
                checked={rotateConfirmedTerms}
                onChange={e => setRotateConfirmedTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded accent-[#533afd] cursor-pointer"
              />
              <span className="text-xs text-[#0d253d] dark:text-white font-medium leading-normal">
                I understand the operational blast radius and confirm that I am ready to replace the credentials in my production infrastructure.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'bg-[#121624] hover:bg-[#1b233a] text-white' : 'bg-[#f6f9fc] hover:bg-[#e3e8ee] text-[#0d253d]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rotateConfirmedTerms || isRotating}
                onClick={executeKeyRotation}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <RotateCw className={`h-3.5 w-3.5 ${isRotating ? 'animate-spin' : ''}`} />
                <span>{isRotating ? 'Generating Secrets...' : 'Execute Key Rotation'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: DECOMMISSION SERVICE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className={`border w-full max-w-lg rounded-2xl p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 id="delete-modal-title" className="text-base font-bold text-[#0d253d] dark:text-white">
                    Decommission Service Account
                  </h3>
                  <p className="text-xs text-rose-500 font-semibold mt-0.5">
                    Permanent & Irreversible Operation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1.5 rounded-lg text-[#64748d] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2.5 ${
              isDark ? 'bg-rose-950/20 border-rose-500/30 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <p className="font-bold">
                You are about to permanently decommission @{rawBotHandle} ({app?.app_name}).
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] opacity-90">
                <li>All active client credentials will be revoked immediately.</li>
                <li>Configured webhooks and active carrier dispatch queues will terminate.</li>
                <li>The bot handle will be freed from the directory.</li>
              </ul>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0d253d] dark:text-white mb-2">
                Type <span className="font-mono font-bold text-rose-500 select-all">@{rawBotHandle}</span> to confirm decommissioning:
              </label>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={e => setDeleteConfirmationInput(e.target.value)}
                placeholder={`@${rawBotHandle}`}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none transition-all ${
                  isDark 
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-rose-500' 
                    : 'bg-white border-[#e3e8ee] text-[#0d253d] focus:border-rose-500'
                }`}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  isDark ? 'bg-[#121624] hover:bg-[#1b233a] text-white' : 'bg-[#f6f9fc] hover:bg-[#e3e8ee] text-[#0d253d]'
                }`}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmationInput.trim().toLowerCase().replace(/^@/, '') !== rawBotHandle.toLowerCase() ||
                  isDeleting
                }
                onClick={executeDeleteApp}
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 shadow-xs flex items-center gap-2 cursor-pointer transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isDeleting ? 'Decommissioning...' : 'Permanently Decommission'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
