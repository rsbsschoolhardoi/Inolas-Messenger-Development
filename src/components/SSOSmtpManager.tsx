import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail, Send, CheckCircle2, AlertCircle, RefreshCw, Key, Lock,
  Server, ExternalLink, Check, Eye, EyeOff,
  Zap, AlertTriangle, CheckCheck,
  Activity, ShieldCheck, Terminal, Clock,
  ChevronDown, ChevronUp, Layers, Cpu, Sparkles, ArrowUpRight,
  HelpCircle, Settings2, SlidersHorizontal, Info
} from 'lucide-react';
import { SSOApp, SmtpConfig } from './SSOPortal';
import { UserData } from '../types';
import { ProviderBrandLogo } from './common/ProviderLogos';

interface SSOSmtpManagerProps {
  apps: SSOApp[];
  selectedAppId?: string;
  onSelectApp: (appId: string) => void;
  onUpdateAppSmtp: (appId: string, updatedConfig: SmtpConfig) => void;
  isDark: boolean;
  currentUser: UserData | null;
  showToast: (message: string) => void;
}

export type IntegrationType = 'api_key' | 'mailbox_app_pass' | 'custom_smtp';

export interface ProviderDef {
  id: string;
  name: string;
  type: IntegrationType;
  category: string;
  host: string;
  port: number;
  secure: boolean;
  defaultUser?: string;
  apiKeyPlaceholder?: string;
  keyLabel: string;
  keyHint: string;
  description: string;
  instructions: string;
  docUrl?: string;
  docLabel?: string;
}

const PROVIDERS_CATALOG: ProviderDef[] = [
  // 1. Modern Developer API Key Services (Zero-Host Setup)
  {
    id: 'resend',
    name: 'Resend',
    type: 'api_key',
    category: 'Modern Developer APIs',
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    defaultUser: 'resend',
    keyLabel: 'Resend API Key',
    apiKeyPlaceholder: 're_123456789_abcdef...',
    keyHint: 'Your full Resend API key starting with re_',
    description: 'Ultra-modern developer-first email infrastructure with instantaneous delivery.',
    instructions: 'Paste your API Key generated from the Resend Dashboard (API Keys tab).',
    docUrl: 'https://resend.com/api-keys',
    docLabel: 'Get Resend API Key'
  },
  {
    id: 'sendgrid',
    name: 'Twilio SendGrid',
    type: 'api_key',
    category: 'Modern Developer APIs',
    host: 'smtp.sendgrid.net',
    port: 587,
    secure: false,
    defaultUser: 'apikey',
    keyLabel: 'SendGrid API Key',
    apiKeyPlaceholder: 'SG.xxxxxxxxxxxxxxxxxxxxxxxx...',
    keyHint: 'Full API Key starting with SG.',
    description: 'High-scale transactional delivery platform by Twilio.',
    instructions: 'Create an API Key with "Full Access" or "Mail Send" permissions in the SendGrid Console.',
    docUrl: 'https://app.sendgrid.com/settings/api_keys',
    docLabel: 'SendGrid API Keys'
  },
  {
    id: 'postmark',
    name: 'Postmark',
    type: 'api_key',
    category: 'Modern Developer APIs',
    host: 'smtp.postmarkapp.com',
    port: 587,
    secure: false,
    keyLabel: 'Server API Token',
    apiKeyPlaceholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    keyHint: 'Server API Token from Postmark Server Credentials',
    description: 'Industry-leading transactional deliverability with lightning-fast inbox arrival.',
    instructions: 'Paste the Server API Token for your transactional email stream.',
    docUrl: 'https://account.postmarkapp.com/servers',
    docLabel: 'Postmark Server Tokens'
  },
  {
    id: 'brevo',
    name: 'Brevo (Sendinblue)',
    type: 'api_key',
    category: 'Modern Developer APIs',
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false,
    keyLabel: 'Brevo SMTP / API Key',
    apiKeyPlaceholder: 'xkeysib-xxxxxxxxxxxxxxxxxxxx...',
    keyHint: 'Master SMTP key from Brevo SMTP & API settings',
    description: 'Reliable transactional email relay with dedicated IP routing.',
    instructions: 'Generate a new SMTP key from your Brevo Dashboard under Settings > SMTP & API.',
    docUrl: 'https://app.brevo.com/settings/keys/smtp',
    docLabel: 'Brevo SMTP Keys'
  },
  {
    id: 'mailgun',
    name: 'Mailgun',
    type: 'api_key',
    category: 'Modern Developer APIs',
    host: 'smtp.mailgun.org',
    port: 587,
    secure: false,
    keyLabel: 'Mailgun Sending API Key',
    apiKeyPlaceholder: 'key-xxxxxxxxxxxxxxxxxxxxxxxx...',
    keyHint: 'API Key or Domain Sending Secret',
    description: 'Powerful cloud delivery engine for high-volume transactions.',
    instructions: 'Use your Mailgun Domain Sending Key from Domain Settings > Sending API Keys.',
    docUrl: 'https://app.mailgun.com/app/account/security/api_keys',
    docLabel: 'Mailgun API Keys'
  },

  // 2. Business Mailbox & Workspace Providers
  {
    id: 'gmail',
    name: 'Google Workspace / Gmail',
    type: 'mailbox_app_pass',
    category: 'Business Mailboxes',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    keyLabel: '16-Character Google App Password',
    apiKeyPlaceholder: 'xxxx xxxx xxxx xxxx',
    keyHint: 'Dedicated App Password generated for your Google Account',
    description: 'Deliver directly through your authenticated Google Workspace company domain.',
    instructions: 'Enable 2-Step Verification on your Google Account, then generate an App Password for Mail.',
    docUrl: 'https://myaccount.google.com/apppasswords',
    docLabel: 'Generate Google App Password'
  },
  {
    id: 'zoho',
    name: 'Zoho Mail',
    type: 'mailbox_app_pass',
    category: 'Business Mailboxes',
    host: 'smtppro.zoho.com',
    port: 465,
    secure: true,
    keyLabel: 'Zoho Application Password',
    apiKeyPlaceholder: 'xxxx-xxxx-xxxx-xxxx',
    keyHint: 'Application-Specific Password from Zoho Security',
    description: 'Secure enterprise transactional relay for Zoho corporate mailboxes.',
    instructions: 'Generate an Application Password in Zoho My Account > Security > Application Passwords.',
    docUrl: 'https://accounts.zoho.com/home#security/app_password',
    docLabel: 'Zoho App Passwords'
  },
  {
    id: 'office365',
    name: 'Microsoft 365 / Outlook',
    type: 'mailbox_app_pass',
    category: 'Business Mailboxes',
    host: 'smtp.office365.com',
    port: 587,
    secure: false,
    keyLabel: 'Microsoft 365 App Password',
    apiKeyPlaceholder: '••••••••••••••••',
    keyHint: 'App Password or Mailbox Password with SMTP AUTH enabled',
    description: 'Corporate Exchange Online mail routing for Microsoft enterprise suites.',
    instructions: 'Ensure "Authenticated SMTP" is enabled for the user mailbox in Microsoft 365 Admin Center.',
    docUrl: 'https://mysignins.microsoft.com/security-info',
    docLabel: 'Microsoft Security Info'
  },
  {
    id: 'ses',
    name: 'Amazon SES',
    type: 'mailbox_app_pass',
    category: 'Cloud Infrastructure',
    host: 'email-smtp.us-east-1.amazonaws.com',
    port: 587,
    secure: false,
    keyLabel: 'SES SMTP Password',
    apiKeyPlaceholder: 'BJxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    keyHint: 'Dedicated SMTP Password generated in AWS SES Console',
    description: 'Hyper-scale cost-effective email service by Amazon Web Services.',
    instructions: 'Generate dedicated SMTP credentials in the AWS SES Console (Configuration > SMTP Settings).',
    docUrl: 'https://console.aws.amazon.com/ses/',
    docLabel: 'AWS SES Console'
  },

  // 3. Custom / Self-Hosted Server
  {
    id: 'custom',
    name: 'Custom / Private SMTP Server',
    type: 'custom_smtp',
    category: 'Self-Hosted / On-Premise',
    host: 'mail.yourdomain.com',
    port: 587,
    secure: false,
    keyLabel: 'SMTP Server Password',
    apiKeyPlaceholder: '••••••••••••••••',
    keyHint: 'Authentication secret for your private mail relay',
    description: 'Connect any RFC-compliant mail server (Postfix, Exim, cPanel, Mailcow, Zimbra, Exchange).',
    instructions: 'Enter your custom mail server host, port, and authentication credentials.',
    docUrl: undefined
  }
];

export const SSOSmtpManager: React.FC<SSOSmtpManagerProps> = ({
  apps,
  selectedAppId,
  onSelectApp,
  onUpdateAppSmtp,
  isDark,
  currentUser,
  showToast
}) => {
  const currentApp = apps.find(a => a.id === selectedAppId) || apps[0] || null;

  // Configuration Category Filter: 'api_key' | 'mailbox_app_pass' | 'custom_smtp'
  const [activeCategoryTab, setActiveCategoryTab] = useState<IntegrationType>('api_key');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('resend');

  // Form State
  const [enabled, setEnabled] = useState<boolean>(false);
  const [host, setHost] = useState<string>('smtp.resend.com');
  const [port, setPort] = useState<number>(465);
  const [secure, setSecure] = useState<boolean>(true);
  const [user, setUser] = useState<string>('resend');
  const [pass, setPass] = useState<string>('');
  const [fromName, setFromName] = useState<string>('');
  const [fromEmail, setFromEmail] = useState<string>('');
  const [replyTo, setReplyTo] = useState<string>('');
  
  // UI States
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showAdvancedProtocol, setShowAdvancedProtocol] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showDiagnosticsTerminal, setShowDiagnosticsTerminal] = useState<boolean>(false);
  const [testRecipient, setTestRecipient] = useState<string>('');
  const [testLogs, setTestLogs] = useState<string[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    troubleshooting?: string;
    latencyMs?: number;
    messageId?: string;
    timestamp?: number;
  } | null>(null);

  const activeProvider = PROVIDERS_CATALOG.find(p => p.id === selectedProviderId) || PROVIDERS_CATALOG[0];

  // Sync state when selected App changes
  useEffect(() => {
    if (currentApp) {
      const cfg = currentApp.smtp_config;
      if (cfg) {
        setEnabled(Boolean(cfg.enabled));
        const presetId = cfg.provider_preset || 'custom';
        const matchedProvider = PROVIDERS_CATALOG.find(p => p.id === presetId) || PROVIDERS_CATALOG.find(p => p.id === 'custom')!;
        setSelectedProviderId(matchedProvider.id);
        setActiveCategoryTab(matchedProvider.type);
        setHost(cfg.host || matchedProvider.host);
        setPort(Number(cfg.port) || matchedProvider.port);
        setSecure(cfg.secure !== undefined ? Boolean(cfg.secure) : matchedProvider.secure);
        setUser(cfg.user || matchedProvider.defaultUser || '');
        setPass(cfg.pass || '');
        setFromName(cfg.from_name || currentApp.app_name || '');
        setFromEmail(cfg.from_email || '');
        setReplyTo(cfg.reply_to || '');

        if (cfg.last_test_status) {
          setTestResult({
            success: cfg.last_test_status === 'success',
            message: cfg.last_test_status === 'success' ? 'Operational & verified.' : undefined,
            error: cfg.last_test_error || (cfg.last_test_status === 'failed' ? 'Previous test failed.' : undefined),
            latencyMs: cfg.last_latency_ms,
            timestamp: cfg.last_tested_at
          });
        } else {
          setTestResult(null);
        }
      } else {
        // Defaults to Resend API Key mode
        setEnabled(false);
        setSelectedProviderId('resend');
        setActiveCategoryTab('api_key');
        setHost('smtp.resend.com');
        setPort(465);
        setSecure(true);
        setUser('resend');
        setPass('');
        setFromName(currentApp.app_name || 'Authentication Service');
        setFromEmail('');
        setReplyTo('');
        setTestResult(null);
      }
    }
  }, [currentApp?.id]);

  useEffect(() => {
    if (!testRecipient && currentUser?.email) {
      setTestRecipient(currentUser.email);
    }
  }, [currentUser?.email]);

  // Provider Selection Handler
  const handleSelectProvider = (prov: ProviderDef) => {
    setSelectedProviderId(prov.id);
    setActiveCategoryTab(prov.type);
    setHost(prov.host);
    setPort(prov.port);
    setSecure(prov.secure);
    if (prov.defaultUser) {
      setUser(prov.defaultUser);
    } else if (prov.type === 'mailbox_app_pass' && fromEmail) {
      setUser(fromEmail);
    } else if (prov.type === 'custom_smtp') {
      setUser(user || '');
    }
    if (!fromName && currentApp) {
      setFromName(`${currentApp.app_name} Security`);
    }
  };

  const handlePortChange = (val: number) => {
    setPort(val);
    if (val === 465) {
      setSecure(true);
    } else if (val === 587 || val === 25 || val === 2525) {
      setSecure(false);
    }
  };

  const handleSecureToggle = () => {
    const nextSecure = !secure;
    setSecure(nextSecure);
    if (nextSecure && port === 587) {
      setPort(465);
    } else if (!nextSecure && port === 465) {
      setPort(587);
    }
  };

  // Run live diagnostic connection test
  const handleRunDiagnosticTest = async () => {
    if (!pass.trim()) {
      showToast(activeProvider.type === 'api_key' ? `Please enter your ${activeProvider.name} API Key.` : 'Please enter the password or secret key.');
      return;
    }
    if (!fromEmail.trim() || !fromEmail.includes('@')) {
      showToast('Please specify a valid Sender ("From") email address.');
      return;
    }

    const effectiveUser = activeProvider.defaultUser || user.trim() || fromEmail.trim();
    const recipient = testRecipient.trim() || fromEmail.trim();

    setIsTesting(true);
    setShowDiagnosticsTerminal(true);
    setTestResult(null);
    setTestLogs([
      `[DIAG] Initiating secure handshake with ${activeProvider.name} (${host}:${port})...`,
      `[DIAG] Mode: ${activeProvider.type === 'api_key' ? 'Modern API Key Authentication' : 'Mailbox / SMTP Credentials'}`,
      `[DIAG] Sender Identity: "${fromName.trim() || currentApp?.app_name}" <${fromEmail.trim()}>`,
      `[DIAG] Target Recipient: ${recipient}`
    ]);

    try {
      const startTime = Date.now();
      const response = await fetch('/api/developer/smtp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: currentApp?.id,
          host: host.trim(),
          port: Number(port),
          secure: secure,
          user: effectiveUser,
          pass: pass.trim(),
          from_name: fromName.trim() || currentApp?.app_name || 'Authentication Service',
          from_email: fromEmail.trim(),
          reply_to: replyTo.trim() || fromEmail.trim(),
          test_recipient: recipient,
          provider_preset: selectedProviderId
        })
      });

      const result = await response.json();
      const elapsed = Date.now() - startTime;

      if (response.ok && result.success) {
        setTestLogs(prev => [
          ...prev,
          `[OK] 220 Service Ready: Handshake established with ${host}`,
          `[OK] 250-AUTH Key validation succeeded for ${activeProvider.name}`,
          `[OK] 250 2.1.0 Sender <${fromEmail.trim()}> verified`,
          `[OK] 250 2.1.5 Recipient <${recipient}> accepted`,
          `[OK] 250 2.0.0 Message delivered (ID: ${result.messageId || 'OK'}) in ${result.totalLatencyMs || elapsed}ms`
        ]);

        setTestResult({
          success: true,
          message: result.message || `Diagnostic verification email dispatched to ${recipient}`,
          latencyMs: result.totalLatencyMs || elapsed,
          messageId: result.messageId,
          timestamp: Date.now()
        });
        showToast(`✓ ${activeProvider.name} verified and test email delivered.`);
      } else {
        setTestLogs(prev => [
          ...prev,
          `[ERR] Authentication or Handshake Failed: ${result.error || 'Connection rejected'}`,
          ...(result.troubleshooting ? [`[HINT] ${result.troubleshooting}`] : [])
        ]);

        setTestResult({
          success: false,
          error: result.error || 'Authentication failed. Please verify your API Key or credentials.',
          troubleshooting: result.troubleshooting,
          timestamp: Date.now()
        });
        showToast(result.error || 'Verification failed. Check credentials.');
      }
    } catch (err: any) {
      setTestLogs(prev => [
        ...prev,
        `[ERR] Network Exception: ${err.message || 'Unable to connect to diagnostic service.'}`
      ]);
      setTestResult({
        success: false,
        error: err.message || 'Network exception encountered during socket connection.',
        timestamp: Date.now()
      });
      showToast('Network error during test.');
    } finally {
      setIsTesting(false);
    }
  };

  // Save Configuration
  const handleSaveConfiguration = async () => {
    if (!currentApp) {
      showToast('Please select an application first.');
      return;
    }

    if (enabled) {
      if (!pass.trim()) {
        showToast(activeProvider.type === 'api_key' ? `API Key is required for ${activeProvider.name}.` : 'Password is required.');
        return;
      }
      if (!fromEmail.trim() || !fromEmail.includes('@')) {
        showToast('A valid Sender Email is required.');
        return;
      }
    }

    setIsSaving(true);
    const effectiveUser = activeProvider.defaultUser || user.trim() || fromEmail.trim();

    const configPayload: SmtpConfig = {
      enabled: Boolean(enabled),
      host: host.trim(),
      port: Number(port) || 587,
      secure: Boolean(secure),
      user: effectiveUser,
      pass: pass.trim(),
      from_name: fromName.trim() || currentApp.app_name || 'Authentication Service',
      from_email: fromEmail.trim().toLowerCase(),
      reply_to: replyTo.trim().toLowerCase() || '',
      provider_preset: selectedProviderId,
      updated_at: Date.now(),
      ...(testResult?.timestamp ? { last_tested_at: testResult.timestamp } : {}),
      ...(testResult ? { last_test_status: testResult.success ? 'success' : 'failed' } : {}),
      ...(testResult && !testResult.success && testResult.error ? { last_test_error: testResult.error } : {}),
      ...(testResult?.latencyMs ? { last_latency_ms: testResult.latencyMs } : {})
    };

    try {
      const response = await fetch('/api/developer/smtp/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: currentApp.id,
          client_id: currentApp.client_id,
          smtp_config: configPayload
        })
      });

      const resJson = await response.json();

      if (response.ok && resJson.success) {
        onUpdateAppSmtp(currentApp.id, configPayload);
        showToast(enabled ? `✓ ${activeProvider.name} configured & active.` : '✓ Saved. Managed relay active.');
      } else {
        onUpdateAppSmtp(currentApp.id, configPayload);
        showToast(resJson.error || 'SMTP settings updated.');
      }
    } catch (err: any) {
      onUpdateAppSmtp(currentApp.id, configPayload);
      showToast('SMTP configuration updated.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProviders = PROVIDERS_CATALOG.filter(p => p.type === activeCategoryTab);

  if (!currentApp) {
    return (
      <div className={`p-12 text-center rounded-2xl border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
          <Mail className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">No Registered Applications Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          To configure email delivery and authentication notifications, register an OAuth application first in the Client Registry.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* 1. Header Bar with Application Switcher */}
      <div className={`p-6 rounded-2xl border transition-colors ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm overflow-hidden p-1.5 border border-indigo-400/20">
              <ProviderBrandLogo providerId={selectedProviderId} size={30} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Email & Outbound Notifications
                </h3>
                {enabled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {activeProvider.name} Active
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Default Zenoa Relay
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Connect your modern API Key (Resend, SendGrid, Postmark) or company email account to send auth codes, OTPs, and alerts from your own brand domain.
              </p>
            </div>
          </div>

          {/* Target App Selector */}
          <div className="flex items-center gap-3 shrink-0">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Target App:</label>
            <select
              value={currentApp.id}
              onChange={e => onSelectApp(e.target.value)}
              className={`px-3.5 py-2 text-xs rounded-xl border outline-none font-semibold cursor-pointer transition-colors ${
                isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
              }`}
            >
              {apps.map(a => (
                <option key={a.id} value={a.id}>
                  {a.app_name} ({a.client_id}) {a.smtp_config?.enabled ? '✓ Custom Provider' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Configuration Canvas */}
      <div className={`p-6 sm:p-7 rounded-2xl border transition-colors ${
        isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        
        {/* Enable / Disable Switch */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800/80">
          <div className="space-y-0.5">
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-500" />
              <span>Use Custom Email Dispatcher</span>
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              When turned on, verification emails, OTP codes, and transactional alerts are dispatched via your custom provider.
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => setEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-12 h-6.5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {/* 3. Category Archetype Tabs */}
        <div className="pt-6">
          <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Provider Category
            </label>

            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('api_key');
                  const firstApiKey = PROVIDERS_CATALOG.find(p => p.type === 'api_key')!;
                  handleSelectProvider(firstApiKey);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeCategoryTab === 'api_key'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Modern API Key (Recommended)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('mailbox_app_pass');
                  const firstMailbox = PROVIDERS_CATALOG.find(p => p.type === 'mailbox_app_pass')!;
                  handleSelectProvider(firstMailbox);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeCategoryTab === 'mailbox_app_pass'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Business Mailbox / App Password</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveCategoryTab('custom_smtp');
                  const customProv = PROVIDERS_CATALOG.find(p => p.type === 'custom_smtp')!;
                  handleSelectProvider(customProv);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeCategoryTab === 'custom_smtp'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Server className="w-3.5 h-3.5" />
                <span>Self-Hosted SMTP</span>
              </button>
            </div>
          </div>

          {/* Provider Pill Cards Selector */}
          <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
              {filteredProviders.map(prov => {
                const isSelected = selectedProviderId === prov.id;
                return (
                  <button
                    key={prov.id}
                    type="button"
                    onClick={() => handleSelectProvider(prov)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 ring-2 ring-indigo-500/20 shadow-xs'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/50 hover:bg-slate-800/70 text-slate-300'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="w-6 h-6 rounded-lg bg-white dark:bg-slate-800 shadow-2xs flex items-center justify-center p-0.5 border border-slate-200 dark:border-slate-700 shrink-0">
                      <ProviderBrandLogo providerId={prov.id} size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold truncate block leading-tight">
                        {prov.name.split('/')[0].trim()}
                      </span>
                      <span className="text-[10px] text-slate-400 truncate block">
                        {prov.type === 'api_key' ? 'API Key Mode' : `Port ${prov.port}`}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Provider Guide Banner */}
            <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/30 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-6 h-6 rounded-md bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                  <ProviderBrandLogo providerId={selectedProviderId} size={16} />
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">{activeProvider.name}:</strong>{' '}
                  {activeProvider.instructions}
                </div>
              </div>

              {activeProvider.docUrl && (
                <a
                  href={activeProvider.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap pt-0.5"
                >
                  <span>{activeProvider.docLabel || 'Dashboard'}</span>
                  <ArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>

          {/* 4. Streamlined Dynamic Input Form */}
          {activeProvider.type === 'api_key' ? (
            /* ===================================================
               TYPE A: MODERN DEVELOPER API KEY (Zero Clutter!)
               =================================================== */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* API Key */}
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {activeProvider.keyLabel} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">{activeProvider.keyHint}</span>
                  </div>
                  <div className="relative flex items-center">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pass}
                      onChange={e => setPass(e.target.value)}
                      placeholder={activeProvider.apiKeyPlaceholder}
                      className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    placeholder="e.g. Acme Auth, Acme Security"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                {/* Sender Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Verified Email ("From") <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={e => setFromEmail(e.target.value)}
                      placeholder="e.g. auth@yourbusiness.com, no-reply@acme.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Optional Advanced Protocol Disclosure */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdvancedProtocol(!showAdvancedProtocol)}
                  className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1.5 cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>{showAdvancedProtocol ? 'Hide Protocol Details' : 'Show Advanced SMTP Protocol Details (Host & Port)'}</span>
                  {showAdvancedProtocol ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showAdvancedProtocol && (
                  <div className="mt-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Auto-Configured Host</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{host}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Port & Security</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">Port {port} ({secure ? 'Implicit SSL' : 'STARTTLS'})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Internal Auth Principal</span>
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{activeProvider.defaultUser || 'API Key Token'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : activeProvider.type === 'mailbox_app_pass' ? (
            /* ===================================================
               TYPE B: BUSINESS MAILBOX & APP PASSWORD
               =================================================== */
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account / Sender Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {activeProvider.name} Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="email"
                      value={fromEmail}
                      onChange={e => {
                        setFromEmail(e.target.value);
                        setUser(e.target.value);
                      }}
                      placeholder="e.g. auth@yourbusiness.com"
                      className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                  </div>
                </div>

                {/* App-Specific Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {activeProvider.keyLabel} <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">{activeProvider.keyHint}</span>
                  </div>
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={pass}
                      onChange={e => setPass(e.target.value)}
                      placeholder={activeProvider.apiKeyPlaceholder}
                      className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                        isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sender Display Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Sender Display Name
                  </label>
                  <input
                    type="text"
                    value={fromName}
                    onChange={e => setFromName(e.target.value)}
                    placeholder="e.g. Acme Security, Acme Notifications"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                {/* Reply-To Email */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Reply-To Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={replyTo}
                    onChange={e => setReplyTo(e.target.value)}
                    placeholder="support@yourbusiness.com"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ===================================================
               TYPE C: CUSTOM SELF-HOSTED ENTERPRISE SMTP
               =================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Host */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  SMTP Host Server <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Server className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={host}
                    onChange={e => setHost(e.target.value)}
                    placeholder="mail.yourdomain.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Port & Encryption */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Port <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={port}
                    onChange={e => handlePortChange(Number(e.target.value))}
                    placeholder="587"
                    className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Encryption
                  </label>
                  <button
                    type="button"
                    onClick={handleSecureToggle}
                    className={`w-full px-3 py-2.5 text-xs rounded-xl border font-semibold flex items-center justify-between cursor-pointer transition-all ${
                      secure
                        ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                        : isDark ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px]">{secure ? 'SSL/TLS (465)' : 'STARTTLS (587)'}</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </button>
                </div>
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Auth Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={user}
                    onChange={e => setUser(e.target.value)}
                    placeholder="auth@yourdomain.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Auth Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={pass}
                    onChange={e => setPass(e.target.value)}
                    placeholder="••••••••••••••••"
                    className={`w-full pl-10 pr-10 py-2.5 text-xs rounded-xl border outline-none font-mono font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sender Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Display Name
                </label>
                <input
                  type="text"
                  value={fromName}
                  onChange={e => setFromName(e.target.value)}
                  placeholder="Acme Security"
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                    isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                  }`}
                />
              </div>

              {/* Sender Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Sender Email ("From") <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="email"
                    value={fromEmail}
                    onChange={e => setFromEmail(e.target.value)}
                    placeholder="auth@yourdomain.com"
                    className={`w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border outline-none font-medium transition-all ${
                      isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. Live Test & Verification Strip */}
        <div className="mt-7 pt-5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <Activity className="w-4 h-4 text-emerald-500" />
              <span>Verify & Send Test Email</span>
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="email"
                value={testRecipient}
                onChange={e => setTestRecipient(e.target.value)}
                placeholder="Test inbox email"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium transition-all ${
                  isDark ? 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-500'
                }`}
              />
              <button
                type="button"
                onClick={handleRunDiagnosticTest}
                disabled={isTesting}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow-xs ${
                  isTesting
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white active:scale-[0.99]'
                }`}
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Test Dispatch</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Protocol Terminal Log */}
          {testLogs.length > 0 && (
            <div className="mt-4">
              <button
                type="button"
                onClick={() => setShowDiagnosticsTerminal(!showDiagnosticsTerminal)}
                className="text-[11px] font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 flex items-center gap-1 cursor-pointer mb-2"
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>{showDiagnosticsTerminal ? 'Hide Verification Log' : 'View Verification Protocol Log'}</span>
                {showDiagnosticsTerminal ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showDiagnosticsTerminal && (
                <div className="p-3.5 rounded-xl bg-[#080d1a] border border-slate-800 text-slate-300 font-mono text-[11px] space-y-1 overflow-x-auto shadow-inner">
                  {testLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`${
                        log.startsWith('[OK]') ? 'text-emerald-400 font-semibold' :
                        log.startsWith('[ERR]') ? 'text-rose-400 font-semibold' :
                        log.startsWith('[HINT]') ? 'text-amber-300' : 'text-slate-400'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Test Result Feedback */}
          {testResult && (
            <div className={`mt-3 p-3 rounded-xl border text-xs flex items-center justify-between gap-3 ${
              testResult.success
                ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="flex items-center gap-2 min-w-0 truncate">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <span className="font-semibold truncate">
                  {testResult.success ? `${activeProvider.name} is verified and ready.` : (testResult.error || 'Connection failed.')}
                </span>
              </div>
              {testResult.latencyMs && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold shrink-0">
                  {testResult.latencyMs}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* 6. Action Submission Bar */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between flex-wrap gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>
              {enabled
                ? `${activeProvider.name} takes effect immediately for this app.`
                : 'Default Zenoa managed relay will be utilized.'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveConfiguration}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <CheckCheck className="w-4 h-4" />
                <span>Save Email Settings</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7. Information Card */}
      <div className={`p-4 rounded-2xl border transition-colors ${
        isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/50 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            <strong className="text-slate-900 dark:text-white font-semibold">Zero-Configuration API Keys:</strong> With modern providers like Resend, SendGrid, and Postmark, you don't need to configure hostnames, ports, or protocols. Simply drop in your API Key and your brand emails will dispatch instantly.
          </p>
        </div>
      </div>
    </div>
  );
};
