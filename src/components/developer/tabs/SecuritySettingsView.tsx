import React, { useState, useEffect, useMemo } from 'react';
import { 
  Settings, ShieldCheck, Lock, Globe, AlertTriangle, 
  RotateCw, Check, Shield, Radio, Bot, Trash2, Upload, 
  KeyRound, RefreshCw, X, Layers, Building2, Zap, ArrowRight
} from 'lucide-react';
import { DeveloperCategoryTier } from '../../../types';

interface SecuritySettingsViewProps {
  app: any;
  environment?: 'test' | 'live';
  categoryTier?: DeveloperCategoryTier;
  onSetEnvironment?: (env: 'test' | 'live') => void;
  onOpenCategoryUpgrade?: () => void;
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
  categoryTier = 'business',
  onSetEnvironment,
  onOpenCategoryUpgrade,
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

  // Controlled Modals
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
      showToast('Please select a valid image file');
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
          showToast('Brand logo updated successfully');
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    onUpdateApp({ avatar_url: null });
    showToast('Brand logo removed');
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

      const trimmedEmail = safeTrim(supportEmail);
      if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        showToast('Please provide a valid support email address');
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
      showToast('Settings saved successfully');
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
      showToast('API credentials rotated and new keys generated');
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
      showToast(`Please type @${requiredHandle} to confirm decommissioning`);
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
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight flex items-center gap-2.5 text-zinc-900 dark:text-zinc-100">
            <Settings className="h-5 w-5 text-[#533afd] dark:text-[#818cf8]" />
            <span>Settings and Security Controls</span>
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Manage application identity, brand contacts, category tier, and API security.
          </p>
        </div>

        {hasUnsavedChanges && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-3.5 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Unsaved Changes</span>
          </div>
        )}
      </div>

      {/* 1. Category Tier Banner */}
      <div className={`rounded-2xl p-6 border transition-all ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-xl bg-[#533afd]/10 border border-[#533afd]/20 text-[#533afd] dark:text-[#818cf8] flex items-center justify-center shrink-0">
              {categoryTier === 'messenger' ? (
                <Zap className="h-6 w-6" />
              ) : categoryTier === 'business' ? (
                <Building2 className="h-6 w-6" />
              ) : (
                <Layers className="h-6 w-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  Current Category
                </span>
              </div>
              <h3 className="text-base font-bold capitalize mt-0.5">
                {categoryTier === 'messenger' ? 'Messenger Plan' : categoryTier === 'business' ? 'Business Suite' : 'Hybrid Enterprise'}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xl leading-relaxed">
                {categoryTier === 'messenger' 
                  ? 'Messaging bot endpoints, webhook event delivery, and OTP simulator are active.' 
                  : categoryTier === 'business' 
                    ? 'AI Customer Copilot, inbox management, canned replies, and rate limit protections are active.' 
                    : 'Unified Omnichannel Gateway with unrestricted access to Messenger and Business tools.'}
              </p>
            </div>
          </div>

          {onOpenCategoryUpgrade && (
            <button
              type="button"
              onClick={onOpenCategoryUpgrade}
              className="px-4 py-2.5 rounded-xl bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-[0.99]"
            >
              <span>Switch or Upgrade Category</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Runtime Environment Panel */}
      <div className={`rounded-xl p-5 border transition-all ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-zinc-200 text-zinc-900 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Runtime Environment
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {environment === 'test' 
                ? 'Sandbox Mode: Free simulated bot and webhook traffic without deducting quota balance.'
                : 'Production Mode: Live gateway routing real messages directly to end-users.'}
            </p>
          </div>

          {/* Clean Segmented Switcher */}
          <div className="inline-flex p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <button
              type="button"
              onClick={() => {
                onSetEnvironment?.('test');
                showToast('Switched to Sandbox Mode');
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                environment === 'test'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Sandbox (Test)
            </button>
            <button
              type="button"
              onClick={() => {
                onSetEnvironment?.('live');
                showToast('Switched to Production Mode');
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                environment === 'live'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Production (Live)
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Settings Form */}
      <form onSubmit={handleSaveSettings} className="space-y-8">
        {/* Protocol Identifiers */}
        <div className={`rounded-2xl p-6 border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Lock className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Service Details</span>
            </h3>
            <span className="text-xs text-zinc-400">Registered Handles</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
              <div className="text-xs text-zinc-500 font-medium">Service Account Name</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1">{app?.app_name || 'Business Service'}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Bound to registered service account</div>
            </div>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'}`}>
              <div className="text-xs text-zinc-500 font-medium">Routing Handle</div>
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-1 font-mono">@{rawBotHandle}</div>
              <div className="text-[11px] text-zinc-400 mt-1">Unique protocol destination address</div>
            </div>
          </div>
        </div>

        {/* Brand Profile and Information */}
        <div className={`rounded-2xl p-6 border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Bot className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Public Entity Profile and Branding</span>
            </h3>
            <span className="text-xs text-zinc-400">Visible to End Users</span>
          </div>

          {/* Logo Upload */}
          <div className={`rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border mb-5 ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}>
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 shrink-0 flex items-center justify-center">
                {app?.avatar_url ? (
                  <img src={app.avatar_url} alt="Brand Logo" className="w-full h-full object-cover" />
                ) : (
                  <Bot className="h-6 w-6 text-zinc-500" />
                )}
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Brand Logo and Icon</h4>
                <p className="text-xs text-zinc-500">Square image file in PNG or JPG format</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <label className="cursor-pointer px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs">
                <Upload className="h-3.5 w-3.5" />
                <span>Upload Logo</span>
                <input type="file" accept="image/*" onChange={handleImageFileSelect} className="hidden" />
              </label>

              {app?.avatar_url && (
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Service Description
              </label>
              <textarea
                rows={2}
                value={appDescription}
                onChange={e => setAppDescription(e.target.value)}
                placeholder="Official customer support and notification dispatch channel"
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs leading-relaxed transition-colors ${
                  isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                }`}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Official Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={e => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-colors ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Additional Documentation Link
                </label>
                <input
                  type="text"
                  value={additionalWebsites}
                  onChange={e => setAdditionalWebsites(e.target.value)}
                  placeholder="https://docs.example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-colors ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={e => setSupportEmail(e.target.value)}
                  placeholder="support@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-colors ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Support Telephone Hotline
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={e => setSupportPhone(e.target.value)}
                  placeholder="+91 1800 123 4567"
                  className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs transition-colors ${
                    isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Physical Office Address
              </label>
              <textarea
                rows={2}
                value={officeAddress}
                onChange={e => setOfficeAddress(e.target.value)}
                placeholder="Innovation Park, Electronic City, Bengaluru"
                className={`w-full px-3.5 py-2.5 rounded-xl border outline-none text-xs leading-relaxed transition-colors ${
                  isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Network IP Access Whitelist */}
        <div className={`rounded-2xl p-6 border transition-all ${
          isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
        }`}>
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <Globe className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Network IP Whitelist</span>
            </h3>
            <span className="text-xs text-zinc-400">Optional Security Layer</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Whitelisted Server IP Addresses
            </label>
            <input
              type="text"
              value={allowedIps}
              onChange={e => setAllowedIps(e.target.value)}
              placeholder="e.g. 192.168.1.10, 10.0.0.0/24 or leave empty to allow all"
              className={`w-full px-3.5 py-2.5 rounded-xl border font-mono text-xs outline-none transition-colors ${
                isDark ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]' : 'bg-white border-[#e3e8ee] text-zinc-900 focus:border-[#533afd]'
              }`}
            />
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              Comma-separated list of IPv4 or IPv6 addresses authorized to dispatch requests using your credentials.
            </p>
          </div>
        </div>

        {/* Sticky Save Bar */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-zinc-500">
            {hasUnsavedChanges ? (
              <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                <span>You have unsaved changes</span>
              </span>
            ) : (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="h-4 w-4" />
                <span>All settings saved and synchronized</span>
              </span>
            )}
          </div>

          <button
            type="submit"
            disabled={isSaving || (!hasUnsavedChanges && !saveSuccess)}
            className="px-6 py-2.5 bg-[#533afd] hover:bg-[#432ec4] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Saving Configuration...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4 text-emerald-300" />
                <span>Saved Successfully</span>
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

      {/* 4. Credentials & Decommission Governance */}
      <div className={`rounded-2xl p-6 border transition-all ${
        isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d] shadow-xs'
      }`}>
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
              <span>Key Lifecycle and Security</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Rotate authentication credentials or decommission service accounts.
            </p>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            Security Controls
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Key Rotation Card */}
          <div className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'
          }`}>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-zinc-100">
                <RotateCw className="h-4 w-4 text-amber-500" />
                <span>Rotate API Credentials</span>
              </div>
              <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                Immediately revokes the active Client Secret and generates fresh keys. Deployed services will require updated authorization headers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setRotateConfirmedTerms(false);
                setShowRotateModal(true);
              }}
              className="w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RotateCw className="h-3.5 w-3.5 text-amber-500" />
              <span>Rotate Secret Key</span>
            </button>
          </div>

          {/* Delete Service Account Card */}
          {onDeleteApp && (
            <div className={`p-5 rounded-xl border flex flex-col justify-between gap-4 ${
              isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f8fafc] border-[#e2e8f0]'
            }`}>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <Trash2 className="h-4 w-4 text-rose-500" />
                  <span>Decommission Service Account</span>
                </div>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Permanently deletes this service account, revokes all API tokens, disconnects webhooks, and releases the bot handle.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmationInput('');
                  setShowDeleteModal(true);
                }}
                className="w-full py-2.5 px-4 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border-rose-300 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Decommission Account</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Rotate Key Confirmation Modal */}
      {showRotateModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className={`border w-full max-w-md rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-zinc-900 shadow-2xl'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Rotate API Secret Key
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Target handle: @{rawBotHandle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
              isDark ? 'bg-amber-950/20 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}>
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <span>Service Interruption Notice</span>
              </div>
              <p>
                When credentials are cycled, the existing Client Secret becomes invalid immediately. Any active service instance using the old secret will receive HTTP 401 Unauthorized.
              </p>
            </div>

            <label className={`flex items-start gap-2.5 p-3.5 rounded-xl border cursor-pointer text-xs ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <input
                type="checkbox"
                checked={rotateConfirmedTerms}
                onChange={e => setRotateConfirmedTerms(e.target.checked)}
                className="mt-0.5 rounded border-zinc-300 text-[#533afd] focus:ring-0 cursor-pointer"
              />
              <span className="text-zinc-600 dark:text-zinc-400">
                I understand that rotating this secret will revoke current keys across deployed environments.
              </span>
            </label>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!rotateConfirmedTerms || isRotating}
                onClick={executeKeyRotation}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-[#533afd] text-white hover:bg-[#432ec4] disabled:opacity-40 cursor-pointer transition-colors"
              >
                {isRotating ? 'Rotating...' : 'Confirm Rotation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decommission Account Modal */}
      {showDeleteModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className={`border w-full max-w-md rounded-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150 ${
            isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-zinc-900 shadow-2xl'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-extrabold text-rose-600 dark:text-rose-400">
                  Decommission Service Account
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Permanent action for @{rawBotHandle}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="p-1 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              This will permanently revoke all API access, disable connected webhooks, and release the handle. Type <span className="font-mono font-bold text-zinc-900 dark:text-white">@{rawBotHandle}</span> to confirm.
            </p>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={e => setDeleteConfirmationInput(e.target.value)}
              placeholder={`@${rawBotHandle}`}
              className={`w-full px-3.5 py-2.5 rounded-xl border text-xs font-mono outline-none ${
                isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput.trim().toLowerCase().replace(/^@/, '') !== rawBotHandle.toLowerCase() || isDeleting}
                onClick={executeDeleteApp}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Decommission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
