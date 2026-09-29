import React, { useState, useEffect } from 'react';
import { 
  Building2, Zap, Layers, ArrowRight, ArrowLeft, 
  Check, AlertTriangle, Key, ShieldCheck, Sparkles,
  Terminal, Globe, Lock, Eye, EyeOff, Copy
} from 'lucide-react';
import { DeveloperCategoryTier } from '../../../types';
import { CustomSelect } from './CustomSelect';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';

export const generateLongApiKey = (env: 'test' | 'live' = 'live') => {
  const prefix = env === 'test' ? 'zen_test_' : 'zen_live_';
  const bytes = new Uint8Array(20);
  if (window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 20; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${prefix}${hex}`;
};

interface DeveloperGettingStartedViewProps {
  currentUsername: string;
  onCreateApp: (data: {
    appName: string;
    botUsername: string;
    categoryTier: DeveloperCategoryTier;
    industryCategory: string;
    environment: 'test' | 'live';
    websiteUrl?: string;
    apiKeyName?: string;
    customApiKey?: string;
  }) => Promise<void>;
  onCancel?: () => void;
  themeMode?: 'light' | 'dark';
}

const EXPANDED_CATEGORIES = [
  { value: 'ecommerce', label: 'E-Commerce & Digital Commerce' },
  { value: 'saas', label: 'SaaS & Enterprise Platforms' },
  { value: 'fintech', label: 'Financial Technology & Banking' },
  { value: 'healthcare', label: 'Healthcare & Telemedicine' },
  { value: 'ai_agent', label: 'AI Agents & Autonomous Copilots' },
  { value: 'customer_support', label: 'Customer Support & Helpdesk CRM' },
  { value: 'edtech', label: 'EdTech & Online Learning' },
  { value: 'hospitality', label: 'Hospitality & Food Delivery' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'realestate', label: 'Real Estate & Property Tech' },
  { value: 'media', label: 'Media, Streaming & Entertainment' },
  { value: 'agency', label: 'Marketing & Digital Agencies' },
  { value: 'devtools', label: 'Developer Tools & Infrastructure' },
  { value: 'automotive', label: 'Automotive & Mobility Services' },
  { value: 'telecom', label: 'Telecommunications & Messaging' },
  { value: 'manufacturing', label: 'Manufacturing, Industrial & IoT' },
  { value: 'nonprofit', label: 'Non-Profit & Public Sector' },
  { value: 'legal', label: 'Legal & Professional Services' },
  { value: 'ondemand', label: 'On-Demand Delivery & Gig Apps' },
  { value: 'general', label: 'General Custom API Integration' },
];

const PLATFORM_TARGETS = [
  { value: 'web', label: 'Web Application' },
  { value: 'mobile', label: 'Mobile Application' },
  { value: 'hybrid', label: 'Multi-Platform Hybrid' },
];

export const DeveloperGettingStartedView: React.FC<DeveloperGettingStartedViewProps> = ({
  currentUsername,
  onCreateApp,
  onCancel,
  themeMode = 'dark'
}) => {
  const isDark = themeMode === 'dark';
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;

  // Step 1: Application Category & Organization Profile
  // Step 2: Service Architecture Tier Selection
  // Step 3: Unified API Key Minting & Console Launch
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [industryCategory, setIndustryCategory] = useState('ecommerce');
  const [organizationName, setOrganizationName] = useState('');
  const [appName, setAppName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [platformTarget, setPlatformTarget] = useState('hybrid');

  const [selectedCategoryTier, setSelectedCategoryTier] = useState<DeveloperCategoryTier>('business');
  const [botUsername, setBotUsername] = useState('');
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');

  // Key Generation State
  const [apiKeyName, setApiKeyName] = useState('Primary Key');
  const [generatedApiKey, setGeneratedApiKey] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);
  const [revealKey, setRevealKey] = useState(false);

  useEffect(() => {
    // Reset key when environment changes
    setGeneratedApiKey(null);
    setApiKeyName(environment === 'test' ? 'Sandbox Test Key' : 'Production Primary Key');
  }, [environment]);

  const containsZenoa = (text: string): boolean => {
    return /zenoa/i.test(text || '');
  };

  const handleNextStep = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      const cleanAppName = appName.trim();
      if (!cleanAppName) {
        setErrorMessage('Please specify your Application or Project Name.');
        return;
      }
      if (containsZenoa(cleanAppName) || containsZenoa(organizationName)) {
        setErrorMessage('The name Zenoa is reserved for platform infrastructure.');
        return;
      }
    }

    if (currentStep === 2) {
      if (containsZenoa(botUsername)) {
        setErrorMessage('The handle Zenoa is reserved for platform infrastructure.');
        return;
      }
    }

    setCurrentStep(prev => Math.min(3, prev + 1));
  };

  const handlePrevStep = () => {
    setErrorMessage(null);
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleGenerateKey = () => {
    setErrorMessage(null);
    const key = generateLongApiKey(environment);
    setGeneratedApiKey(key);
  };

  const handleCompleteOnboarding = async () => {
    setErrorMessage(null);
    if (!generatedApiKey) {
      setErrorMessage('Please click "Generate API Key" before completing onboarding.');
      return;
    }

    const cleanAppName = appName.trim() || 'My Application';
    const cleanOrg = organizationName.trim();
    
    if (containsZenoa(cleanAppName) || containsZenoa(botUsername) || containsZenoa(cleanOrg)) {
      setErrorMessage('The name Zenoa is reserved for platform infrastructure.');
      return;
    }

    const cleanBot = botUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');
    const finalBot = cleanBot || cleanAppName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._]/g, '') || currentUsername.toLowerCase();

    setIsCompleting(true);
    setIsSubmitting(true);

    try {
      await onCreateApp({
        appName: cleanOrg ? `${cleanOrg} - ${cleanAppName}` : cleanAppName,
        botUsername: `@${finalBot}`,
        categoryTier: selectedCategoryTier,
        industryCategory,
        environment,
        websiteUrl,
        apiKeyName: apiKeyName.trim() || 'Primary API Key',
        customApiKey: generatedApiKey
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to complete onboarding');
      setIsSubmitting(false);
      setIsCompleting(false);
    }
  };

  const handleCopyApiKey = () => {
    if (!generatedApiKey) return;
    navigator.clipboard.writeText(generatedApiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <>
      {/* Smooth Loading Overlay with Flying Zenoa Logo */}
      {isCompleting && (
        <div className="fixed inset-0 z-[300] bg-[#080c14] text-white flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-gradient-to-r from-[#533afd]/50 to-indigo-500/50 rounded-full blur-xl animate-pulse" />
            <div className="relative transform animate-bounce">
              <BrandLogo src={activeLogo} name={branding.app_name || 'Zenoa'} size="xl" className="shadow-2xl ring-2 ring-[#533afd]/50 rounded-2xl" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            Provisioning {branding.app_name || 'Zenoa'} Developer Vault
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            Initializing secure API credentials and environment endpoints...
          </p>
        </div>
      )}

      <div className={`fixed inset-0 z-[100] overflow-y-auto flex flex-col justify-between p-6 sm:p-12 transition-colors ${
        isDark ? 'bg-[#080c14] text-white' : 'bg-[#f8fafc] text-zinc-900'
      }`}>

      {/* Top Header */}
      <div className="max-w-3xl mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-3">
          <BrandLogo src={activeLogo} name={branding.app_name || 'Zenoa'} size="sm" />
          <div>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-white">
              {branding.app_name || 'Zenoa'} Developer Console
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
              Developer Account Setup
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
            Step {currentStep} of 3
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Center Form Frame */}
      <div className="max-w-2xl mx-auto w-full py-8 space-y-8 my-auto">
        {/* Progress Line */}
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto">
          {[1, 2, 3].map(num => (
            <div
              key={num}
              className={`h-1 flex-1 rounded-full transition-all ${
                num === currentStep
                  ? 'bg-[#533afd]'
                  : num < currentStep
                  ? 'bg-emerald-500'
                  : isDark ? 'bg-zinc-800' : 'bg-zinc-200'
              }`}
            />
          ))}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STEP 1: CATEGORY & ORGANIZATION PROFILE */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Select Your Category
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Provide your application category and organization details to personalize your integration endpoints.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-5 ${
              isDark ? 'bg-[#0f1524] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              {/* Category Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Application Industry Category <span className="text-rose-500">*</span>
                </label>
                <CustomSelect
                  value={industryCategory}
                  onChange={(val) => setIndustryCategory(val)}
                  options={EXPANDED_CATEGORIES}
                  size="md"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Acme Inc"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#151d30] border-zinc-800 text-white focus:border-[#533afd]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#533afd]'
                    }`}
                  />
                </div>

                {/* Application Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Application Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="Customer Portal"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#151d30] border-zinc-800 text-white focus:border-[#533afd]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#533afd]'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Website URL */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Website or Domain
                  </label>
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#151d30] border-zinc-800 text-white focus:border-[#533afd]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#533afd]'
                    }`}
                  />
                </div>

                {/* Platform Target */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                    Platform Target
                  </label>
                  <CustomSelect
                    value={platformTarget}
                    onChange={(val) => setPlatformTarget(val)}
                    options={PLATFORM_TARGETS}
                    size="md"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: PLAN & INTEGRATION SUITE */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Choose Integration Plan
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                Select your integration architecture. You can upgrade or change tiers anytime inside the console.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Option 1: Business Suite */}
              <div
                onClick={() => setSelectedCategoryTier('business')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedCategoryTier === 'business'
                    ? 'border-[#533afd] bg-[#533afd]/10 shadow-xs'
                    : isDark 
                    ? 'border-zinc-800 bg-[#0f1524] hover:border-zinc-700' 
                    : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Business
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Business Suite
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      AI Customer Copilot, Storefront Live Chat Widget, Analytics and Support Automation.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>AI Customer Copilot</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                    <span>Storefront Live Chat</span>
                  </div>
                </div>
              </div>

              {/* Option 2: Messenger Plan */}
              <div
                onClick={() => setSelectedCategoryTier('messenger')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedCategoryTier === 'messenger'
                    ? 'border-[#533afd] bg-[#533afd]/10 shadow-xs'
                    : isDark 
                    ? 'border-zinc-800 bg-[#0f1524] hover:border-zinc-700' 
                    : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                      <Zap className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Messenger
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Messenger Plan
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Carrier Passcode OTP Dispatches, Direct Bot DM Notifications and Webhook Stream.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Carrier Passcode Verification</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                    <span>Direct Bot DM Delivery</span>
                  </div>
                </div>
              </div>

              {/* Option 3: Hybrid Enterprise */}
              <div
                onClick={() => setSelectedCategoryTier('hybrid')}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 ${
                  selectedCategoryTier === 'hybrid'
                    ? 'border-[#533afd] bg-[#533afd]/10 shadow-xs'
                    : isDark 
                    ? 'border-zinc-800 bg-[#0f1524] hover:border-zinc-700' 
                    : 'border-zinc-200 bg-white hover:border-zinc-300 shadow-xs'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                      <Layers className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      Hybrid
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">
                      Hybrid Plan
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                      Unified Omnichannel Gateway combining Carrier OTPs, Bot DMs, and Autonomous AI.
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-600 dark:text-zinc-300">
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>Full API & Bot Gateway</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>AI Copilot & Analytics</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Bot Username handle if messenger selected */}
            {selectedCategoryTier === 'messenger' && (
              <div className={`p-4 rounded-2xl border space-y-2 ${
                isDark ? 'bg-[#0f1524] border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Bot Handle or Username
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-zinc-400">
                    @
                  </span>
                  <input
                    type="text"
                    value={botUsername}
                    onChange={(e) => setBotUsername(e.target.value)}
                    placeholder="support_bot"
                    className={`w-full pl-8 pr-3.5 py-2 rounded-xl text-xs border outline-none transition-colors ${
                      isDark 
                        ? 'bg-[#151d30] border-zinc-800 text-white focus:border-[#533afd]' 
                        : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#533afd]'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Environment Choice */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#0f1524] border-zinc-800' : 'bg-white border-zinc-200'
            }`}>
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Environment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setEnvironment('test')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    environment === 'test'
                      ? 'border-amber-500/50 bg-amber-500/10'
                      : isDark ? 'border-zinc-800 bg-[#151d30]' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-amber-500">
                    Sandbox Mode
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Free simulated API requests
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setEnvironment('live')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    environment === 'live'
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : isDark ? 'border-zinc-800 bg-[#151d30]' : 'border-zinc-200 bg-zinc-50'
                  }`}
                >
                  <div className="text-xs font-semibold text-emerald-400">
                    Production Mode
                  </div>
                  <div className="text-[11px] text-zinc-400 mt-0.5">
                    Live delivery and SLA
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevStep}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                onClick={handleNextStep}
                className="px-6 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium rounded-xl flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <span>Configure API Key</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: API KEY NAME & MINTING */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="text-center space-y-1.5">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <Key className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Generate API Credentials
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                Name your API Key and click generate to mint your secure credential.
              </p>
            </div>

            <div className={`p-6 rounded-2xl border space-y-5 ${
              isDark ? 'bg-[#0f1524] border-zinc-800' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              {/* API Key Label / Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>API Key Name / Description</span>
                  <span className="text-[10px] text-zinc-500">Editable</span>
                </label>
                <input
                  type="text"
                  value={apiKeyName}
                  onChange={(e) => setApiKeyName(e.target.value)}
                  placeholder="e.g. Primary Server Key"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                    isDark 
                      ? 'bg-[#151d30] border-zinc-800 text-white focus:border-[#533afd]' 
                      : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:border-[#533afd]'
                  }`}
                />
              </div>

              {/* Generated Key Section */}
              {!generatedApiKey ? (
                <div className={`p-5 rounded-xl border text-center space-y-3 ${
                  isDark ? 'bg-[#080c14] border-zinc-800/80' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <p className="text-xs text-zinc-400">
                    Click below to mint your secure, long-format API key for <strong className="text-white">{environment === 'test' ? 'Sandbox' : 'Production'}</strong> mode.
                  </p>

                  <button
                    type="button"
                    onClick={handleGenerateKey}
                    className="px-5 py-2.5 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium rounded-xl flex items-center gap-2 mx-auto shadow-xs transition-colors cursor-pointer"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Secure API Key</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* API Key Display Box */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span>{apiKeyName || 'API Key'}</span>
                      </label>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setRevealKey(!revealKey)}
                          className="text-xs font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                        >
                          {revealKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          <span>{revealKey ? 'Hide' : 'Reveal'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleCopyApiKey}
                          className="text-xs font-medium text-[#533afd] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          {copiedKey ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    <div className={`p-3.5 rounded-xl border font-mono text-xs select-all flex items-center justify-between ${
                      isDark ? 'bg-[#080c14] border-zinc-800 text-emerald-400' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}>
                      <span className="truncate tracking-wide font-mono text-[11px]">
                        {revealKey ? generatedApiKey : `${generatedApiKey.substring(0, 16)}••••••••••••••••••••••••••••••••••••`}
                      </span>
                      <span className="text-[10px] uppercase font-sans font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded ml-2 shrink-0">
                        Minted
                      </span>
                    </div>
                  </div>

                  {/* HTTP Header Preview */}
                  <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                      <span>HTTP Authorization Header</span>
                    </label>
                    <div className="bg-[#080c14] text-zinc-300 p-3 rounded-xl font-mono text-xs border border-zinc-800 overflow-x-auto">
                      <code>Authorization: <span className="text-emerald-400">Bearer</span> <span className="text-zinc-400">{generatedApiKey.substring(0, 16)}...</span></code>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handlePrevStep}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>

              <button
                disabled={isSubmitting || !generatedApiKey}
                onClick={handleCompleteOnboarding}
                className="px-8 py-3 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium rounded-xl flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Enter Developer Console</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding */}
      <div className="max-w-3xl mx-auto w-full text-center text-[11px] text-zinc-500 dark:text-zinc-500 pb-2 font-normal">
        {branding.app_name || 'Zenoa'} Developer Console &bull; API Infrastructure & Security
      </div>
    </div>
  </>
  );
};
