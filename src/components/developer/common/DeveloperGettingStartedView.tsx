import React, { useState, useEffect } from 'react';
import { 
  Building2, Zap, ArrowRight, Check, AlertTriangle, Key, 
  ShieldCheck, Sparkles, Terminal, Copy, Shield, Layers,
  Globe, Mail, CheckCircle2, ChevronRight
} from 'lucide-react';
import { DeveloperCategoryTier, UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';

export const generateLongApiKey = (env: 'test' | 'live' = 'live', prefixOverride?: string) => {
  const prefix = prefixOverride || (env === 'test' ? 'zen_sandbox_' : 'zen_live_');
  const bytes = new Uint8Array(20);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex}`;
};

export interface DeveloperGettingStartedData {
  appName: string; // Project Name (Mandatory: Used as the Application Name)
  organizationName: string; // Organization Name (Mandatory)
  developerEmail: string; // Developer Contact Email
  botUsername: string;
  serviceType: 'service_account' | 'widget_automation' | 'hybrid';
  categoryTier: DeveloperCategoryTier;
  industryCategory: string;
  environment: 'test' | 'live';
  apiKeyName?: string;
  customApiKey?: string;
  serviceCategory?: string;
  selectedScopes?: string[];
  webhookUrl?: string;
  widgetCategory?: 'bubble' | 'in_app_embed' | 'high_priority_escalation';
  assistantName?: string;
  enableThirdPartyUserName?: boolean;
  aiSystemPrompt?: string;
}

interface DeveloperGettingStartedViewProps {
  currentUsername: string;
  currentUser?: UserData | null;
  onCreateApp: (data: DeveloperGettingStartedData) => Promise<void>;
  onCancel?: () => void;
  themeMode?: 'light' | 'dark';
}

export const DeveloperGettingStartedView: React.FC<DeveloperGettingStartedViewProps> = ({
  currentUsername,
  currentUser,
  onCreateApp,
  onCancel,
  themeMode = 'dark'
}) => {
  const isDark = themeMode === 'dark';
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;
  const appBrandName = branding.app_name || 'Zenoa';

  // Form State
  const [organizationName, setOrganizationName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [developerEmail, setDeveloperEmail] = useState(currentUser?.email || '');
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');
  
  // Credentials
  const [generatedApiKey, setGeneratedApiKey] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize pre-generated API key on mount and environment toggle
  useEffect(() => {
    const key = generateLongApiKey(environment);
    setGeneratedApiKey(key);
  }, [environment]);

  // Pre-fill email if user becomes available
  useEffect(() => {
    if (currentUser?.email && !developerEmail) {
      setDeveloperEmail(currentUser.email);
    }
  }, [currentUser, developerEmail]);

  const containsZenoa = (text: string): boolean => {
    return /zenoa/i.test(text || '');
  };

  const handleCopyKey = () => {
    if (!generatedApiKey) return;
    navigator.clipboard.writeText(generatedApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanOrg = organizationName.trim();
    const cleanProject = projectName.trim();
    const cleanEmail = developerEmail.trim();

    if (!cleanOrg) {
      setErrorMessage('Organization name is required.');
      return;
    }

    if (!cleanProject) {
      setErrorMessage('Project name is required.');
      return;
    }

    if (containsZenoa(cleanOrg) || containsZenoa(cleanProject)) {
      setErrorMessage('The name Zenoa is reserved for official infrastructure.');
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanDevUser = currentUsername.toLowerCase().replace(/[^a-z0-9._]/g, '');
      const projectSlug = cleanProject.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._]/g, '');
      const botHandle = `sa_${projectSlug || cleanDevUser}`;

      // Create app directly using the PROJECT NAME as requested
      await onCreateApp({
        appName: cleanProject, // Project name is the application name!
        organizationName: cleanOrg,
        developerEmail: cleanEmail,
        botUsername: `@${botHandle}`,
        serviceType: 'hybrid', // Hybrid tier provides both Web Widget & Automation and Business API
        categoryTier: 'hybrid',
        industryCategory: 'saas',
        environment,
        apiKeyName: environment === 'test' ? 'Sandbox Primary Key' : 'Production Primary Key',
        customApiKey: generatedApiKey,
        serviceCategory: 'System',
        selectedScopes: ['messages:send', 'otp:dispatch', 'webhooks:receive', 'users:verify'],
        assistantName: 'Support Concierge',
        enableThirdPartyUserName: true,
        aiSystemPrompt: `You are the intelligent virtual concierge for ${cleanProject}. Assist users accurately and courteously.`
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete project setup. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Smooth Provisioning Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-300 bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#533afd]/50 to-indigo-500/50 rounded-full blur-xl animate-pulse" />
            <div className="relative transform animate-bounce">
              <BrandLogo 
                src={activeLogo} 
                name={appBrandName} 
                size="xl" 
                className="shadow-2xl ring-2 ring-[#533afd]/50 rounded-2xl" 
              />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Provisioning {projectName || 'Developer Project'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1.5 max-w-sm leading-relaxed">
            Activating Free Tier environment, generating server keys, and initializing Web Widget and Business API consoles.
          </p>
        </div>
      )}

      <div className={`fixed inset-0 z-100 overflow-y-auto flex flex-col justify-between p-6 sm:p-12 transition-colors ${
        isDark ? 'bg-[#181d26] text-white' : 'bg-white text-[#181d26]'
      }`}>
        {/* Top Header */}
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <BrandLogo src={activeLogo} name={appBrandName} size="sm" />
            <div>
              <h1 className="text-sm font-medium tracking-tight text-[#181d26] dark:text-white">
                {appBrandName} Developer Platform
              </h1>
              <p className="text-xs text-[#333840] dark:text-zinc-400 font-normal">
                Workspace Onboarding · Developer Free Tier
              </p>
            </div>
          </div>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-xs font-medium text-[#333840] hover:text-[#181d26] dark:text-zinc-400 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Center Card */}
        <div className="max-w-xl mx-auto w-full py-8 my-auto">
          <div className={`rounded-xl border p-8 sm:p-10 space-y-6 transition-all ${
            isDark 
              ? 'bg-[#1d1f25] border-[#2d333f] text-white' 
              : 'bg-white border-[#dddddd] text-[#181d26] shadow-[0_1px_3px_rgba(24,29,38,0.04)]'
          }`}>
            {/* Title Section */}
            <div className="space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#181d26] dark:text-white">
                Create Developer Project
              </h2>
              <p className="text-sm font-normal text-[#333840] dark:text-zinc-400 leading-relaxed">
                Enter your organization and project details to activate your workspace. You will start with the Developer Free Tier by default.
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Organization Name (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#181d26] dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-[#181d26] dark:text-white" />
                    <span>Organization Name</span>
                    <span className="text-rose-600 text-xs font-bold">*</span>
                  </span>
                  <span className="text-[11px] text-[#333840] dark:text-zinc-400 font-normal">Mandatory</span>
                </label>
                <input
                  type="text"
                  required
                  value={organizationName}
                  onChange={e => setOrganizationName(e.target.value)}
                  placeholder="e.g. Acme Corp, Inolas Nexus, or Personal Workspace"
                  className={`w-full px-3.5 py-2.5 rounded-md border text-xs sm:text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-[#181d26] border-[#2d333f] text-white focus:border-white' 
                      : 'bg-white border-[#dddddd] text-[#181d26] focus:border-[#181d26]'
                  }`}
                />
              </div>

              {/* Project Name (Mandatory) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#181d26] dark:text-white flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Terminal className="h-3.5 w-3.5 text-[#181d26] dark:text-white" />
                    <span>Project Name</span>
                    <span className="text-rose-600 text-xs font-bold">*</span>
                  </span>
                  <span className="text-[11px] text-[#333840] dark:text-zinc-400 font-normal">Mandatory</span>
                </label>
                <input
                  type="text"
                  required
                  value={projectName}
                  onChange={e => setProjectName(e.target.value)}
                  placeholder="e.g. Customer Assistant, Checkout Bot, or Core Messaging API"
                  className={`w-full px-3.5 py-2.5 rounded-md border text-xs sm:text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-[#181d26] border-[#2d333f] text-white focus:border-white' 
                      : 'bg-white border-[#dddddd] text-[#181d26] focus:border-[#181d26]'
                  }`}
                />
                <p className="text-xs text-[#333840] dark:text-zinc-400 leading-normal">
                  Your developer console application will be named after this project name.
                </p>
              </div>

              {/* Developer Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#181d26] dark:text-white flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-[#181d26] dark:text-white" />
                  <span>Developer Contact Email</span>
                </label>
                <input
                  type="email"
                  value={developerEmail}
                  onChange={e => setDeveloperEmail(e.target.value)}
                  placeholder="developer@yourdomain.com"
                  className={`w-full px-3.5 py-2.5 rounded-md border text-xs sm:text-sm outline-none transition-all ${
                    isDark 
                      ? 'bg-[#181d26] border-[#2d333f] text-white focus:border-white' 
                      : 'bg-white border-[#dddddd] text-[#181d26] focus:border-[#181d26]'
                  }`}
                />
              </div>

              {/* Primary Environment Selection */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-[#181d26] dark:text-white block">
                  Primary Environment
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setEnvironment('test')}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      environment === 'test'
                        ? 'border-[#181d26] dark:border-white bg-[#f8fafc] dark:bg-[#181d26] text-[#181d26] dark:text-white'
                        : isDark
                        ? 'border-[#2d333f] bg-[#1d1f25] text-zinc-400 hover:border-zinc-500'
                        : 'border-[#dddddd] bg-white text-[#333840] hover:border-zinc-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-[#181d26] dark:text-white">Sandbox Mode</p>
                      <p className="text-[11px] text-[#333840] dark:text-zinc-400 mt-0.5">Simulated API testing</p>
                    </div>
                    {environment === 'test' && <Check className="h-4 w-4 text-[#181d26] dark:text-white" />}
                  </div>

                  <div
                    onClick={() => setEnvironment('live')}
                    className={`p-3.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between ${
                      environment === 'live'
                        ? 'border-[#181d26] dark:border-white bg-[#f8fafc] dark:bg-[#181d26] text-[#181d26] dark:text-white'
                        : isDark
                        ? 'border-[#2d333f] bg-[#1d1f25] text-zinc-400 hover:border-zinc-500'
                        : 'border-[#dddddd] bg-white text-[#333840] hover:border-zinc-400'
                    }`}
                  >
                    <div>
                      <p className="text-xs font-medium text-[#181d26] dark:text-white">Production Mode</p>
                      <p className="text-[11px] text-[#333840] dark:text-zinc-400 mt-0.5">Live customer delivery</p>
                    </div>
                    {environment === 'live' && <Check className="h-4 w-4 text-[#181d26] dark:text-white" />}
                  </div>
                </div>
              </div>

              {/* Developer Free Tier Assurance Card */}
              <div className={`p-4 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-[#181d26] border-[#2d333f]' 
                  : 'bg-[#f5e9d4]/60 border-[#d9a441]/40'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-medium text-[#181d26] dark:text-white">
                        Developer Free Tier Included
                      </h4>
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 whitespace-nowrap">
                        Free Default Plan
                      </span>
                    </div>
                    <p className="text-xs text-[#333840] dark:text-zinc-300 leading-relaxed">
                      Your project starts on the Developer Free Tier with 10,000 monthly events, unlimited sandbox simulation, full Web Widget automation, and Business API access. No credit card required.
                    </p>
                  </div>
                </div>
              </div>

              {/* Generated API Key Preview */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#181d26] dark:text-white flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-[#181d26] dark:text-white" />
                    <span>Generated API Key</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="text-xs font-medium text-[#181d26] dark:text-white hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                    <span>{copiedKey ? 'Copied' : 'Copy Key'}</span>
                  </button>
                </div>
                <div className={`p-3 rounded-md border font-mono text-xs select-all flex items-center justify-between ${
                  isDark ? 'bg-[#181d26] border-[#2d333f] text-emerald-400' : 'bg-[#f8fafc] border-[#dddddd] text-[#181d26]'
                }`}>
                  <span className="truncate">{generatedApiKey}</span>
                  <span className="text-[10px] font-sans font-medium text-[#333840] dark:text-zinc-400 uppercase tracking-wider ml-2 shrink-0">
                    {environment}
                  </span>
                </div>
              </div>

              {/* Submit CTA (Airtable Signature Primary Button) */}
              <div className="pt-3">
                <button
                  type="submit"
                  disabled={isSubmitting || !organizationName.trim() || !projectName.trim()}
                  className="w-full py-3.5 px-6 rounded-xl bg-[#181d26] hover:bg-[#0d1218] dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-[#181d26] disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Complete Verification &amp; Launch Console</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="max-w-2xl mx-auto w-full text-center pb-2">
          <p className="text-xs text-[#333840] dark:text-zinc-400 font-normal">
            {appBrandName} Sovereign Messaging Platform · Standard Developer Terms Apply
          </p>
        </div>
      </div>
    </>
  );
};
