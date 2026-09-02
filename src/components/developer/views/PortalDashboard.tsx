import React, { useState, useEffect } from 'react';
import { 
  Server, Lock, History, FileText, Sliders, LogOut, ShieldCheck, Zap, Key, 
  Copy, Check, RefreshCw, AlertTriangle, Download, Plus, ChevronRight, Menu, X,
  Webhook, Terminal, ArrowLeft, FileCode, CreditCard, Users, Shield, Radio,
  LayoutDashboard, Eye, EyeOff
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../../firebaseClient';
import { UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { 
  generateTsSdk, generateNodeSdk, generatePythonSdk, generatePhpSdk, 
  generateGoSdk, generateJavaSdk, generateEnvConfig, generateHtmlSnippet, generateCurlSnippets 
} from '../utils/sdkGenerators';
import { OverviewView } from '../tabs/OverviewView';
import { ApiLogsView } from '../tabs/ApiLogsView';
import { WebhooksView } from '../tabs/WebhooksView';
import { OtpSimulatorView } from '../tabs/OtpSimulatorView';
import { ApiDocsView } from '../tabs/ApiDocsView';
import { SecuritySettingsView } from '../tabs/SecuritySettingsView';
import { MessageTemplatesView } from '../tabs/MessageTemplatesView';
import { BillingQuotaView } from '../tabs/BillingQuotaView';
import { TeamMembersView } from '../tabs/TeamMembersView';

interface PortalDashboardProps {
  currentUser: UserData;
  onLogout: () => void;
  onHome: () => void;
}

export type TabType = 
  | 'overview'
  | 'apps' 
  | 'templates'
  | 'billing'
  | 'team'
  | 'otp' 
  | 'logs' 
  | 'webhooks' 
  | 'docs' 
  | 'settings';

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ currentUser, onLogout, onHome }) => {
  const branding = useBranding();
  const activeLogo = branding.dev_console_logo || branding.public_logo;
  // Landing tab is Overview for security and streamlined UX
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [revealSecrets, setRevealSecrets] = useState(false);

  // Environment Switcher: 'test' (Sandbox) vs 'live' (Production)
  const [environment, setEnvironment] = useState<'test' | 'live'>('test');

  // App Creation
  const [isCreating, setIsCreating] = useState(false);
  const [appName, setAppName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [selectedEnvOnCreate, setSelectedEnvOnCreate] = useState<'test' | 'live'>('test');

  // SDK Generator Language Selection (TypeScript by default)
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'node' | 'python' | 'go' | 'php' | 'java' | 'curl' | 'env'>('typescript');

  // One time secret
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<any>(null);

  useEffect(() => {
    fetchApps();
  }, [currentUser]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    showToast(`${label} copied to clipboard!`);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchApps = async () => {
    try {
      let fetchedApps: any[] = [];
      if (currentUser?.username && db) {
        const cleanUser = currentUser.username.toLowerCase();
        const q = query(collection(db, 'developer_apps'), where('owner', '==', currentUser.username));
        const snap = await getDocs(q);
        snap.docs.forEach(d => fetchedApps.push({ id: d.id, ...d.data() }));

        const directDoc = await getDoc(doc(db, 'developer_apps', `sa_${cleanUser}`));
        if (directDoc.exists() && !fetchedApps.some(a => a.id === directDoc.id)) {
          fetchedApps.push({ id: directDoc.id, ...directDoc.data() });
        }
      }

      // Fallback local memory app if none exists
      if (fetchedApps.length === 0) {
        const fallbackApp = {
          id: `sa_${currentUser.username.toLowerCase()}`,
          owner: currentUser.username,
          app_name: `${currentUser.display_name || currentUser.username}'s Application`,
          bot_username: `sa_${currentUser.username.toLowerCase()}`,
          client_id: `zen_client_${currentUser.username.toLowerCase()}`,
          client_secret: `zen_sec_${Math.random().toString(36).substring(2, 18)}`,
          test_client_id: `zen_test_${currentUser.username.toLowerCase()}`,
          test_client_secret: `zen_test_sec_${Math.random().toString(36).substring(2, 18)}`,
          created_at: Date.now()
        };
        fetchedApps.push(fallbackApp);
      }

      setApps(fetchedApps);
      if (fetchedApps.length > 0) setSelectedAppId(fetchedApps[0].id);
    } catch (err) {
      console.error("Fetch developer apps error:", err);
    } finally {
      setLoading(false);
    }
  };

  const containsZenoa = (text: string): boolean => {
    return /zenoa/i.test(text || '');
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appName.trim()) return;

    if (apps.length > 0) {
      showToast('Limit Reached: Only 1 service account per user is allowed.');
      return;
    }

    if (containsZenoa(appName) || containsZenoa(botUsername)) {
      showToast("Security Violation: The word 'Zenoa' is strictly reserved for official system accounts and cannot be used anywhere in service account names or handles.");
      return;
    }

    setIsCreating(true);
    try {
      const cleanDevUser = currentUser.username.toLowerCase();
      const clientId = `zen_client_${Math.random().toString(36).substring(2,15)}`;
      const clientSecret = `zen_sec_${Math.random().toString(36).substring(2,20)}`;
      const testClientId = `zen_test_${Math.random().toString(36).substring(2,15)}`;
      const testClientSecret = `zen_test_sec_${Math.random().toString(36).substring(2,20)}`;
      const rawBot = botUsername.trim().toLowerCase().replace(/^@/, '');
      const finalBotUsername = rawBot ? (rawBot.startsWith('sa_') ? rawBot : `sa_${rawBot}`) : `sa_${cleanDevUser}`;

      if (containsZenoa(finalBotUsername)) {
        showToast("Security Violation: The word 'Zenoa' cannot be used in service account handles.");
        setIsCreating(false);
        return;
      }

      const newAppData = {
        owner: currentUser.username,
        owner_id: currentUser.id || '',
        app_name: appName.trim(),
        bot_username: finalBotUsername,
        client_id: clientId,
        client_secret: clientSecret,
        test_client_id: testClientId,
        test_client_secret: testClientSecret,
        api_key: clientId,
        is_locked: true,
        created_at: Date.now()
      };

      if (db) {
        const appRef = doc(collection(db, 'developer_apps'), `sa_${cleanDevUser}`);
        await setDoc(appRef, newAppData);
        (newAppData as any).id = appRef.id;

        await setDoc(doc(db, 'users', finalBotUsername), {
          username: finalBotUsername,
          display_name: appName.trim(),
          is_service_account: true,
          is_business_account: true,
          is_verified: false,
          verified_type: null,
          is_official: false,
          owner_username: currentUser.username,
          created_at: Date.now()
        }, { merge: true });
      }

      setApps([newAppData]);
      setSelectedAppId((newAppData as any).id);
      setEnvironment(selectedEnvOnCreate);
      setNewlyGeneratedSecret({ clientId, clientSecret, appName: appName.trim(), botUsername: finalBotUsername });
      showToast(`Service account created in ${selectedEnvOnCreate === 'test' ? 'Sandbox' : 'Production'} mode and locked for security.`);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateApp = async (updates: any) => {
    if (!selectedApp) return;
    
    // Core parameters (name, bot username) are strictly immutable for service accounts
    if (updates.app_name && updates.app_name !== selectedApp.app_name) {
      showToast('Service Account Immutable: Registered service account name cannot be edited.');
      return;
    }
    if (updates.bot_username && updates.bot_username !== selectedApp.bot_username) {
      showToast('Service Account Immutable: Registered bot handle cannot be edited.');
      return;
    }

    try {
      if (db) {
        const appRef = doc(db, 'developer_apps', selectedApp.id);
        await setDoc(appRef, updates, { merge: true });
      }
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updates } : a));
    } catch (err: any) {
      setApps(prev => prev.map(a => a.id === selectedApp.id ? { ...a, ...updates } : a));
      console.warn("Firestore update notice:", err);
    }
  };

  const handleRotateKey = async () => {
    if (!selectedApp) return;
    const newSecret = `zen_sec_${Math.random().toString(36).substring(2, 22)}`;
    const newClientId = `zen_client_${Math.random().toString(36).substring(2, 16)}`;
    
    await handleUpdateApp({
      client_id: newClientId,
      client_secret: newSecret,
      api_key: newClientId
    });

    setNewlyGeneratedSecret({
      clientId: newClientId,
      clientSecret: newSecret,
      appName: selectedApp.app_name,
      botUsername: selectedApp.bot_username
    });
  };

  const rawSelectedApp = apps.find(a => a.id === selectedAppId) || apps[0];
  
  // Dynamic App projection depending on active environment
  const selectedApp = rawSelectedApp ? {
    ...rawSelectedApp,
    active_client_id: environment === 'test' 
      ? (rawSelectedApp.test_client_id || `zen_test_${rawSelectedApp.client_id?.replace('zen_client_', '') || 'dev'}`)
      : (rawSelectedApp.client_id || rawSelectedApp.api_key),
    active_client_secret: environment === 'test'
      ? (rawSelectedApp.test_client_secret || `zen_test_sec_sandbox_key`)
      : (rawSelectedApp.client_secret || 'zen_sec_production')
  } : null;

  const getGeneratedCode = (): string => {
    if (!selectedApp) return '';
    switch (selectedLanguage) {
      case 'typescript': return generateTsSdk(selectedApp);
      case 'node': return generateNodeSdk(selectedApp);
      case 'python': return generatePythonSdk(selectedApp);
      case 'go': return generateGoSdk(selectedApp);
      case 'php': return generatePhpSdk(selectedApp);
      case 'java': return generateJavaSdk(selectedApp);
      case 'curl': return generateCurlSnippets(selectedApp);
      case 'env': return generateEnvConfig(selectedApp);
      default: return generateTsSdk(selectedApp);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 border border-slate-700">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white shrink-0">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
              {activeLogo ? <img src={activeLogo} alt="Logo" className="h-full w-full object-contain p-1" /> : <Server className="h-5 w-5" />}
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Zenoa Developer Console</h1>
              <p className="text-[11px] text-slate-500 font-medium">Enterprise APIs & Platform Services</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-3.5 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">Main</div>
            <div className="space-y-1">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'apps', icon: Key, label: 'API Credentials', badge: 'Active' },
                { id: 'docs', icon: FileText, label: 'API Docs & Reference', badge: 'v2.4' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-100 text-slate-500">
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tools & Testing */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">Tools & Testing</div>
            <div className="space-y-1">
              {[
                { id: 'otp', icon: Zap, label: 'OTP Simulator' },
                { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
                { id: 'logs', icon: Terminal, label: 'Live Inspector' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Management & Quotas */}
          <div>
            <div className="px-3 pb-1.5 text-[10px] uppercase font-bold tracking-widest text-slate-400">Management</div>
            <div className="space-y-1">
              {[
                { id: 'templates', icon: FileCode, label: 'Templates' },
                { id: 'billing', icon: CreditCard, label: 'Billing & Quotas' },
                { id: 'team', icon: Users, label: 'Team Members' },
                { id: 'settings', icon: Sliders, label: 'Settings & Security' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-indigo-50 text-indigo-700 shadow-xs border border-indigo-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 space-y-3 bg-slate-50/50">
          <div className="flex items-center gap-3 px-1 pt-1">
            <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
              {currentUser.username.slice(0,2)}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">{currentUser.display_name || currentUser.username}</p>
              <p className="text-[11px] text-slate-500 truncate">@{currentUser.username}</p>
            </div>
          </div>
          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200">
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 overflow-y-auto">
        {/* Top Header - Zenoa Developer Console */}
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 -ml-2 text-slate-600">
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-indigo-600" />
                Zenoa Developer Console
              </h1>
              <span className="text-slate-300 hidden sm:inline">|</span>
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500">
                <span>Account:</span>
                <span className="font-mono text-slate-800 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                  {selectedApp?.app_name || 'sa_active'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              API Gateway Online
            </span>
          </div>
        </header>

        {/* Sandbox Notice Banner if in Test Mode */}
        {environment === 'test' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <span className="px-2 py-0.5 rounded-md font-bold uppercase bg-amber-200 text-amber-900 text-[10px]">
                SANDBOX MODE
              </span>
              <span>API calls simulate full verification and delivery flows with 0 balance deduction.</span>
            </div>
            <button
              onClick={() => setEnvironment('live')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline hidden sm:inline"
            >
              Switch to Live Mode →
            </button>
          </div>
        )}

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 bg-slate-900/20 backdrop-blur-sm md:hidden flex">
            <div className="w-64 bg-white h-full shadow-2xl flex flex-col">
              <div className="p-4 flex items-center justify-between border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm">Navigation</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'apps', label: 'API Credentials' },
                  { id: 'docs', label: 'API Reference' },
                  { id: 'otp', label: 'OTP Simulator' },
                  { id: 'webhooks', label: 'Webhooks' },
                  { id: 'logs', label: 'Live Inspector' },
                  { id: 'templates', label: 'Message Templates' },
                  { id: 'billing', label: 'Billing & Quotas' },
                  { id: 'team', label: 'Team Members' },
                  { id: 'settings', label: 'Settings & Security' },
                ].map(t => (
                  <button 
                    key={t.id} 
                    onClick={() => { setActiveTab(t.id as TabType); setMobileMenuOpen(false); }} 
                    className={`w-full text-left px-4 py-3 rounded-lg text-xs font-bold ${
                      activeTab === t.id ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)}></div>
          </div>
        )}

        <div className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-8">
          
          {/* 1. OVERVIEW TAB (LANDING VIEW) */}
          {activeTab === 'overview' && selectedApp && (
            <OverviewView
              app={selectedApp}
              environment={environment}
              onNavigate={(tab) => setActiveTab(tab)}
              showToast={showToast}
            />
          )}

          {/* 2. APPS & CREDENTIALS TAB */}
          {activeTab === 'apps' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Key className="h-6 w-6 text-indigo-600" />
                    API Credentials & Key Manager
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Manage your {environment === 'test' ? 'Sandbox (Test)' : 'Production (Live)'} authentication keys securely.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                    environment === 'test'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {environment === 'test' ? 'Sandbox Keys Active' : 'Live Production Keys Active'}
                  </span>
                </div>
              </div>

              {!selectedApp ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs max-w-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">Create New Service Account</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Strict limit: 1 permanent Service Account per developer account.</p>
                    </div>
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                      Immutable Setup
                    </span>
                  </div>

                  <form onSubmit={handleCreateApp} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Application / Service Name</label>
                      <input 
                        type="text" 
                        value={appName} 
                        onChange={e => {
                          const val = e.target.value;
                          setAppName(val);
                        }} 
                        placeholder="e.g. Acme Corp Authentication" 
                        className={`w-full px-4 py-2.5 rounded-lg border outline-none transition-all text-sm ${containsZenoa(appName) ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40 text-rose-900' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900'}`} 
                        required 
                      />
                      {containsZenoa(appName) && (
                        <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                          ⚠️ The reserved word &quot;Zenoa&quot; cannot be used anywhere in service account names.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Bot Username / Handle</label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-mono">@</span>
                        <input 
                          type="text" 
                          value={botUsername} 
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
                            setBotUsername(val);
                          }} 
                          placeholder={`sa_${currentUser.username}`} 
                          className={`w-full px-4 py-2.5 rounded-r-lg border outline-none transition-all text-sm font-mono ${containsZenoa(botUsername) ? 'border-rose-400 focus:border-rose-500 bg-rose-50/40 text-rose-900' : 'border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900'}`} 
                        />
                      </div>
                      {containsZenoa(botUsername) && (
                        <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                          ⚠️ The reserved word &quot;Zenoa&quot; cannot be used anywhere in bot handles.
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">Initial Operational Environment</label>
                      <select 
                        value={selectedEnvOnCreate} 
                        onChange={e => setSelectedEnvOnCreate(e.target.value as 'test' | 'live')} 
                        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-indigo-500 text-sm text-slate-900 outline-none bg-white font-medium cursor-pointer"
                      >
                        <option value="test">Test / Sandbox Environment (Free simulation &amp; mock dispatches)</option>
                        <option value="live">Live / Production Environment (Real Telecommunication Gateway)</option>
                      </select>
                      <p className="text-xs text-slate-500 mt-1">
                        You can change environment mode anytime later in Settings -&gt; Account Environment.
                      </p>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                      <p className="font-bold text-slate-800 flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5 text-indigo-600" />
                        Service Account Security Rules:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-600">
                        <li>Each user can register only <strong>1 service account</strong>.</li>
                        <li>Service account identity is <strong>immutable</strong> and locked after creation.</li>
                        <li>All credentials are cryptographically embedded directly into generated SDK files.</li>
                      </ul>
                    </div>

                    <button 
                      type="submit" 
                      disabled={isCreating || containsZenoa(appName) || containsZenoa(botUsername)} 
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-xs transition-all flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer"
                    >
                      {isCreating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Create Service Account
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Credentials & Key Master Panel */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                      <div>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-lg font-bold text-slate-900">{selectedApp.app_name}</h3>
                          <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                            environment === 'test'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}>
                            {environment === 'test' ? 'Sandbox Environment' : 'Live Production'}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 mt-1 flex items-center gap-2">
                          <span>Handle: @{selectedApp.bot_username || selectedApp.owner}</span>
                          <span>•</span>
                          <span>Account ID: sa_{selectedApp.owner.toLowerCase()}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRevealSecrets(!revealSecrets)}
                        className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer self-start md:self-auto"
                      >
                        {revealSecrets ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                        <span>{revealSecrets ? 'Hide Key Secrets' : 'Reveal Key Secrets'}</span>
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Client ID */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Key className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{environment === 'test' ? 'Test Client ID (Sandbox)' : 'Live Client ID (Production)'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedApp.active_client_id, "Client ID")}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === selectedApp.active_client_id ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedKey === selectedApp.active_client_id ? 'Copied' : 'Copy ID'}</span>
                            </button>
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs font-bold text-slate-800 select-all flex items-center justify-between">
                            <span className="truncate">{selectedApp.active_client_id}</span>
                            <span className="text-[10px] uppercase font-sans font-bold text-slate-400 bg-slate-200/60 px-2 py-0.5 rounded ml-2 shrink-0">Public</span>
                          </div>
                        </div>

                        {/* Client Secret */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                              <Lock className="h-3.5 w-3.5 text-rose-600" />
                              <span>{environment === 'test' ? 'Test Client Secret' : 'Live Client Secret'}</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => handleCopy(selectedApp.active_client_secret, "Client Secret")}
                              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === selectedApp.active_client_secret ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedKey === selectedApp.active_client_secret ? 'Copied' : 'Copy Secret'}</span>
                            </button>
                          </div>
                          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 font-mono text-xs text-slate-800 select-all flex items-center justify-between">
                            <span className="truncate">
                              {revealSecrets ? selectedApp.active_client_secret : (
                                <span className="text-slate-400 tracking-widest">
                                  {environment === 'test' ? 'zen_test_sec_••••••••••••••••••••••••' : 'zen_sec_••••••••••••••••••••••••'}
                                </span>
                              )}
                            </span>
                            <span className="text-[10px] uppercase font-sans font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded ml-2 shrink-0">Private</span>
                          </div>
                        </div>
                      </div>

                      {/* Quick REST API Authorization Header Box */}
                      <div className="pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                            <Terminal className="h-3.5 w-3.5 text-emerald-600" />
                            <span>HTTP Authorization Header (cURL / Postman / REST)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleCopy(`Authorization: Bearer ${selectedApp.active_client_secret}`, "Authorization Header")}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span>Copy Header</span>
                          </button>
                        </div>
                        <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl font-mono text-xs flex items-center justify-between overflow-x-auto selection:bg-indigo-800">
                          <code className="text-indigo-300">
                            Authorization: <span className="text-emerald-400">Bearer</span> {revealSecrets ? selectedApp.active_client_secret : `${environment === 'test' ? 'zen_test_sec_••••••••••••••••' : 'zen_sec_••••••••••••••••'}`}
                          </code>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Commercial Multi-Language SDK Generator Suite */}
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden space-y-0">
                    <div className="p-5 border-b border-slate-200 bg-slate-50/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <FileCode className="h-5 w-5 text-indigo-600" />
                          Multi-Language SDK Code Master
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Pre-configured integration code with embedded service account keys. Select language:
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <select
                          value={selectedLanguage}
                          onChange={e => setSelectedLanguage(e.target.value as any)}
                          className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer shadow-2xs"
                        >
                          <option value="typescript">TypeScript (Browser / React / Node)</option>
                          <option value="node">Node.js (CommonJS / ESM)</option>
                          <option value="python">Python 3 (requests)</option>
                          <option value="go">Go 1.18+ (net/http)</option>
                          <option value="php">PHP (cURL)</option>
                          <option value="java">Java 11+ (HttpClient)</option>
                          <option value="curl">cURL Command Snippet</option>
                          <option value="env">.env Config File</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => handleCopy(getGeneratedCode(), `${selectedLanguage.toUpperCase()} SDK Code`)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                        >
                          {copiedKey === getGeneratedCode() ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                          <span>{copiedKey === getGeneratedCode() ? 'Copied to Clipboard!' : 'Copy Code'}</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-0 bg-slate-950">
                      <pre className="p-6 text-xs font-mono text-indigo-200/90 leading-relaxed overflow-x-auto selection:bg-indigo-800 selection:text-white max-h-[500px]">
                        {getGeneratedCode()}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MESSAGE TEMPLATES TAB */}
          {activeTab === 'templates' && selectedApp && (
            <MessageTemplatesView
              app={selectedApp}
              showToast={showToast}
              environment={environment}
            />
          )}

          {/* BILLING & QUOTA TAB */}
          {activeTab === 'billing' && selectedApp && (
            <BillingQuotaView
              app={selectedApp}
              showToast={showToast}
            />
          )}

          {/* TEAM MEMBERS & ROLES TAB */}
          {activeTab === 'team' && selectedApp && (
            <TeamMembersView
              app={selectedApp}
              currentUser={currentUser}
              showToast={showToast}
            />
          )}

          {/* LIVE LOGS & INSPECTOR TAB */}
          {activeTab === 'logs' && selectedApp && (
            <ApiLogsView 
              app={selectedApp} 
              showToast={showToast} 
            />
          )}

          {/* WEBHOOKS MANAGER TAB */}
          {activeTab === 'webhooks' && selectedApp && (
            <WebhooksView 
              app={selectedApp} 
              showToast={showToast} 
              onUpdateApp={handleUpdateApp}
            />
          )}

          {/* OTP SIMULATOR TAB */}
          {activeTab === 'otp' && selectedApp && (
            <OtpSimulatorView 
              app={selectedApp} 
              currentUser={currentUser} 
              showToast={showToast} 
            />
          )}

          {/* DOCS TAB */}
          {activeTab === 'docs' && selectedApp && (
            <ApiDocsView 
              app={selectedApp} 
              showToast={showToast} 
            />
          )}

          {/* SETTINGS TAB */}
          {activeTab === 'settings' && selectedApp && (
            <SecuritySettingsView 
              app={selectedApp} 
              environment={environment}
              onSetEnvironment={setEnvironment}
              showToast={showToast} 
              onUpdateApp={handleUpdateApp}
              onRotateKey={handleRotateKey}
            />
          )}

        </div>
      </main>

      {/* Secret Revelation Modal */}
      {newlyGeneratedSecret && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-8 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Save Your Secret Key</h3>
                <p className="text-sm text-slate-500">This will only be shown once.</p>
              </div>
            </div>
            
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800 mb-6">
              <strong>Security Notice:</strong> Please copy this client secret now. For security reasons, it will never be displayed in plain text again.
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Client ID</label>
                <div className="flex gap-2">
                  <input readOnly value={newlyGeneratedSecret.clientId} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-800 outline-none" />
                  <button onClick={() => handleCopy(newlyGeneratedSecret.clientId, "Client ID")} className="px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-sm transition-colors shadow-sm">Copy</button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 block">Client Secret</label>
                <div className="flex gap-2">
                  <input readOnly value={newlyGeneratedSecret.clientSecret} className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-mono text-slate-800 outline-none" />
                  <button onClick={() => handleCopy(newlyGeneratedSecret.clientSecret, "Client Secret")} className="px-4 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 font-medium text-sm transition-colors shadow-sm">Copy</button>
                </div>
              </div>
            </div>

            <button onClick={() => setNewlyGeneratedSecret(null)} className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-semibold transition-all shadow-sm">
              I have saved my secret key
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
