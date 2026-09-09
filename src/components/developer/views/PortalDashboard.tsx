import React, { useState, useEffect } from 'react';
import { 
  Server, Lock, History, FileText, Sliders, LogOut, ShieldCheck, Zap, Key, 
  Copy, Check, RefreshCw, AlertTriangle, Download, Plus, ChevronRight, Menu, X,
  Webhook, Terminal, ArrowLeft, FileCode, CreditCard, Users, Shield, Radio,
  LayoutDashboard, Eye, EyeOff
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseClient';
import { UserData } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';
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
  const [environment, setEnvironment] = useState<'test' | 'live'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_dev_active_env');
      if (saved === 'test' || saved === 'live') return saved;
    } catch(e) {}
    return 'test';
  });

  // App Creation
  const [isCreating, setIsCreating] = useState(false);
  const [appName, setAppName] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [selectedEnvOnCreate, setSelectedEnvOnCreate] = useState<'test' | 'live'>('test');

  // SDK Generator Language Selection (TypeScript by default)
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'node' | 'python' | 'go' | 'php' | 'java' | 'curl' | 'env'>('typescript');

  // One time secret
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    fetchApps();
  }, [currentUser]);

  // Restore active environment whenever selectedAppId or apps list updates
  useEffect(() => {
    if (selectedAppId && apps.length > 0) {
      const targetApp = apps.find(a => a.id === selectedAppId);
      if (targetApp) {
        // 1. If the target app has an explicit environment stored in Firestore, use it
        if (targetApp.environment === 'test' || targetApp.environment === 'live') {
          setEnvironment(targetApp.environment);
          try {
            localStorage.setItem(`zenoa_dev_env_${selectedAppId}`, targetApp.environment);
            localStorage.setItem('zenoa_dev_active_env', targetApp.environment);
          } catch (e) {}
          return;
        }
        if (targetApp.is_live === true) {
          setEnvironment('live');
          try {
            localStorage.setItem(`zenoa_dev_env_${selectedAppId}`, 'live');
            localStorage.setItem('zenoa_dev_active_env', 'live');
          } catch (e) {}
          return;
        }
        // 2. Check localStorage as fallback
        try {
          const appSpecificEnv = localStorage.getItem(`zenoa_dev_env_${selectedAppId}`) as 'test' | 'live' | null;
          if (appSpecificEnv === 'test' || appSpecificEnv === 'live') {
            setEnvironment(appSpecificEnv);
            return;
          }
        } catch (e) {}
      }
    }
  }, [selectedAppId, apps]);

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

      setApps(fetchedApps);
      if (fetchedApps.length > 0) {
        const firstApp = fetchedApps[0];
        const firstAppId = firstApp.id;
        setSelectedAppId(firstAppId);
        
        let appEnv: 'test' | 'live' = 'test';
        if (firstApp.environment === 'test' || firstApp.environment === 'live') {
          appEnv = firstApp.environment;
        } else if (firstApp.is_live === true) {
          appEnv = 'live';
        } else {
          try {
            const savedLocal = localStorage.getItem(`zenoa_dev_env_${firstAppId}`) || localStorage.getItem('zenoa_dev_active_env');
            if (savedLocal === 'test' || savedLocal === 'live') {
              appEnv = savedLocal as 'test' | 'live';
            }
          } catch (e) {}
        }

        setEnvironment(appEnv);
        try {
          localStorage.setItem('zenoa_dev_active_env', appEnv);
          localStorage.setItem(`zenoa_dev_env_${firstAppId}`, appEnv);
        } catch (e) {}
      }
    } catch (err) {
      console.error("Fetch developer apps error:", err);
    } finally {
      setLoading(false);
    }
  };

  const containsZenoa = (text: string): boolean => {
    return /zenoa/i.test(text || '');
  };

  const handleSetEnvironment = async (newEnv: 'test' | 'live') => {
    setEnvironment(newEnv);
    try {
      localStorage.setItem('zenoa_dev_active_env', newEnv);
      if (selectedAppId) {
        localStorage.setItem(`zenoa_dev_env_${selectedAppId}`, newEnv);
      }
    } catch (e) {}

    if (!selectedApp) return;

    try {
      if (db) {
        const appRef = doc(db, 'developer_apps', selectedApp.id);
        await setDoc(appRef, {
          environment: newEnv,
          is_live: newEnv === 'live',
          updated_at: Date.now()
        }, { merge: true });

        const cleanDevUser = currentUser.username.toLowerCase();
        const directAppRef = doc(db, 'developer_apps', `sa_${cleanDevUser}`);
        await setDoc(directAppRef, {
          environment: newEnv,
          is_live: newEnv === 'live',
          updated_at: Date.now()
        }, { merge: true }).catch(() => {});

        const botU = selectedApp.bot_username?.toLowerCase().replace(/^@/, '');
        if (botU) {
          await setDoc(doc(db, 'users', botU), {
            environment: newEnv,
            is_live: newEnv === 'live',
            avatar_url: selectedApp.avatar_url || null,
            updated_at: Date.now()
          }, { merge: true }).catch(() => {});
        }

        const devUserRef = doc(db, 'users', currentUser.id || cleanDevUser);
        await setDoc(devUserRef, {
          service_account_environment: newEnv,
          updated_at: Date.now()
        }, { merge: true }).catch(() => {});
      }

      setApps(prev => prev.map(a => (a.id === selectedApp.id || a.id === `sa_${currentUser.username.toLowerCase()}`) ? {
        ...a,
        environment: newEnv,
        is_live: newEnv === 'live'
      } : a));

      showToast(`Environment switched to ${newEnv === 'live' ? 'Live Production' : 'Sandbox (Test)'}. Saved permanently.`);
    } catch (err: any) {
      showToast(`Failed to set environment: ${err.message}`);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAppName = appName.trim();
    if (!finalAppName) return;

    if (apps.length > 0) {
      showToast('Limit Reached: Only 1 service account per user is allowed.');
      return;
    }

    if (containsZenoa(finalAppName) || containsZenoa(botUsername)) {
      showToast("Security Violation: The word 'Zenoa' is strictly reserved for official system accounts and cannot be used anywhere in service account names or handles.");
      return;
    }

    setIsCreating(true);
    try {
      const cleanDevUser = currentUser.username.toLowerCase().replace(/[^a-z0-9._]/g, '');
      const clientId = `zen_client_${Math.random().toString(36).substring(2,15)}`;
      const clientSecret = `zen_sec_${Math.random().toString(36).substring(2,20)}`;
      const testClientId = `zen_test_${Math.random().toString(36).substring(2,15)}`;
      const testClientSecret = `zen_test_sec_${Math.random().toString(36).substring(2,20)}`;
      
      // Username allows only (a-z0-9._), while Name remains As-It-Is (e.g. "Azad")
      const rawBot = botUsername.trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');
      const finalBotUsername = rawBot ? rawBot : (finalAppName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._]/g, '') || cleanDevUser);

      if (containsZenoa(finalBotUsername)) {
        showToast("Security Violation: The word 'Zenoa' cannot be used in service account handles.");
        setIsCreating(false);
        return;
      }

      const newAppData = {
        owner: currentUser.username,
        owner_id: currentUser.id || '',
        app_name: finalAppName, // Exactly as entered (e.g. "Azad")
        bot_username: finalBotUsername, // Standard handle (a-z0-9._)
        environment: selectedEnvOnCreate,
        is_live: selectedEnvOnCreate === 'live',
        client_id: clientId,
        client_secret: clientSecret,
        test_client_id: testClientId,
        test_client_secret: testClientSecret,
        api_key: clientId,
        is_locked: true,
        is_verified: true,
        verified_type: 'purple',
        created_at: Date.now()
      };

      if (db) {
        const appRef = doc(collection(db, 'developer_apps'), `sa_${cleanDevUser}`);
        await setDoc(appRef, newAppData);
        (newAppData as any).id = appRef.id;

        // Register bot user profile in the users collection with exact Name casing preserved
        const botUserDocRef = doc(db, 'users', finalBotUsername);
        await setDoc(botUserDocRef, {
          id: finalBotUsername,
          username: finalBotUsername,
          display_name: finalAppName, // Exactly as registered (e.g. "Azad")
          name: finalAppName, // Exactly as registered (e.g. "Azad")
          is_service_account: true,
          is_business_account: true,
          is_bot: true,
          is_verified: true,
          verified_type: 'purple',
          role: 'service_account',
          owner: currentUser.username,
          environment: selectedEnvOnCreate,
          is_live: selectedEnvOnCreate === 'live',
          created_at: Date.now(),
          updated_at: Date.now()
        }, { merge: true });

        // Register service account metadata on the developer's user profile directly
        const devUserDocRef = doc(db, 'users', currentUser.id || cleanDevUser);
        await setDoc(devUserDocRef, {
          has_service_account: true,
          service_account_id: appRef.id,
          service_account_app_name: finalAppName, // Exactly as registered (e.g. "Azad")
          service_account_bot_username: finalBotUsername,
          service_account_client_id: clientId,
          service_account_environment: selectedEnvOnCreate,
          updated_at: Date.now()
        }, { merge: true });
      }

      try {
        localStorage.setItem('zenoa_dev_active_env', selectedEnvOnCreate);
        localStorage.setItem(`zenoa_dev_env_sa_${cleanDevUser}`, selectedEnvOnCreate);
      } catch (e) {}

      setApps([newAppData]);
      setSelectedAppId((newAppData as any).id);
      setEnvironment(selectedEnvOnCreate);
      setNewlyGeneratedSecret({ clientId, clientSecret, appName: finalAppName, botUsername: finalBotUsername });
      showToast(`Service account @${finalBotUsername} (${finalAppName}) created in ${selectedEnvOnCreate === 'test' ? 'Sandbox' : 'Production'} mode.`);
    } catch (err: any) {
      showToast('Error: ' + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteApp = async () => {
    if (!selectedApp) return;
    try {
      if (db) {
        const cleanDevUser = currentUser.username.toLowerCase();
        // Delete developer app document
        await deleteDoc(doc(db, 'developer_apps', selectedApp.id)).catch(() => {});
        await deleteDoc(doc(db, 'developer_apps', `sa_${cleanDevUser}`)).catch(() => {});

        // Unlink service account on developer user profile
        const devUserDocRef = doc(db, 'users', currentUser.id || cleanDevUser);
        await setDoc(devUserDocRef, {
          has_service_account: false,
          service_account_id: null,
          service_account_app_name: null,
          service_account_bot_username: null,
          updated_at: Date.now()
        }, { merge: true }).catch(() => {});

        // Clean up legacy service account entry if present
        if (selectedApp.bot_username) {
          const botU = selectedApp.bot_username.toLowerCase().replace(/^@/, '');
          await deleteDoc(doc(db, 'service_accounts', botU)).catch(() => {});
          await deleteDoc(doc(db, 'sso_applications', selectedApp.id)).catch(() => {});
        }
      }

      setApps([]);
      setSelectedAppId(null);
      showToast('Service account permanently deleted. You can now create a new service account whenever required.');
    } catch (err: any) {
      showToast('Failed to delete service account: ' + err.message);
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

        const botU = selectedApp.bot_username?.toLowerCase().replace(/^@/, '');
        if (botU) {
          const userUpdates: any = {
            updated_at: Date.now()
          };
          if ('avatar_url' in updates) {
            userUpdates.avatar_url = updates.avatar_url || null;
          }
          if ('app_description' in updates) {
            userUpdates.bio = updates.app_description || null;
            userUpdates.app_description = updates.app_description || null;
          }
          if ('website_url' in updates) {
            userUpdates.website_url = updates.website_url || null;
          }
          if ('additional_websites' in updates) {
            userUpdates.additional_websites = updates.additional_websites || null;
          }
          if ('office_address' in updates) {
            userUpdates.office_address = updates.office_address || null;
            userUpdates.address = updates.office_address || null;
          }
          if ('support_email' in updates) {
            userUpdates.support_email = updates.support_email || null;
          }
          if ('support_phone' in updates) {
            userUpdates.support_phone = updates.support_phone || null;
          }
          await setDoc(doc(db, 'users', botU), userUpdates, { merge: true });
          await setDoc(doc(db, 'service_accounts', botU), {
            ...userUpdates,
            updated_at: Date.now()
          }, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'sso_applications', selectedApp.id), updates, { merge: true }).catch(() => {});
        }
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
            <BrandLogo
              src={activeLogo}
              name={branding.app_name || 'Zenoa'}
              size="sm"
            />
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">{branding.app_name || 'Zenoa'} Developer Console</h1>
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
          <button onClick={() => setShowLogoutConfirm(true)} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200 cursor-pointer">
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

          <div className="flex items-center gap-3">
            {/* Environment Switcher Pills */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetEnvironment('test')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  environment === 'test'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Sandbox Test Environment"
              >
                <span className={`h-2 w-2 rounded-full ${environment === 'test' ? 'bg-white' : 'bg-amber-500'}`} />
                <span>Sandbox</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetEnvironment('live')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  environment === 'live'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
                title="Switch to Live Production Environment"
              >
                <span className={`h-2 w-2 rounded-full ${environment === 'live' ? 'bg-white animate-pulse' : 'bg-emerald-500'}`} />
                <span>Production</span>
              </button>
            </div>

            <span className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Gateway Online
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
              onClick={() => handleSetEnvironment('live')}
              className="text-xs font-bold text-amber-900 hover:text-amber-950 underline hidden sm:inline cursor-pointer"
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
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Application / Service Name <span className="text-xs text-slate-400 font-normal">(Display Name, case preserved as-is)</span>
                      </label>
                      <input 
                        type="text" 
                        value={appName} 
                        onChange={e => {
                          const val = e.target.value;
                          setAppName(val);
                        }} 
                        placeholder="e.g. Azad" 
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
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Bot Username / Handle <span className="text-xs text-slate-400 font-normal">(Only a-z, 0-9, ., _)</span>
                      </label>
                      <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm font-mono">@</span>
                        <input 
                          type="text" 
                          value={botUsername} 
                          onChange={e => {
                            // Username strictly allows only lowercase letters, numbers, dot, and underscore (a-z0-9._)
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
                            setBotUsername(val);
                          }} 
                          placeholder="e.g. azad_bot" 
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
                        <li>Secrets are stored securely on backend servers via <code>ZENOA_SA_CLIENT_SECRET</code> environment variable.</li>
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

                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/80">
                        <Lock className="h-3.5 w-3.5 text-amber-600" />
                        <span>Secrets Encrypted &amp; Masked</span>
                      </div>
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
                            <span className="truncate text-slate-400 tracking-widest font-mono">
                              {environment === 'test' ? 'zen_test_sec_••••••••••••••••••••••••' : 'zen_sec_••••••••••••••••••••••••'}
                            </span>
                            <span className="text-[10px] uppercase font-sans font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded ml-2 shrink-0">Protected</span>
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
                            Authorization: <span className="text-emerald-400">Bearer</span> <span className="text-slate-400 tracking-wider font-mono">{environment === 'test' ? 'zen_test_sec_••••••••••••••••' : 'zen_sec_••••••••••••••••'}</span>
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
              onSetEnvironment={handleSetEnvironment}
              showToast={showToast} 
              onUpdateApp={handleUpdateApp}
              onRotateKey={handleRotateKey}
              onDeleteApp={handleDeleteApp}
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

      {/* Developer Console Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 space-y-5">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <LogOut className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Sign Out of Developer Console</h3>
                <p className="text-xs text-slate-500 mt-0.5">Confirm console session termination</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
              Are you sure you want to sign out from the Zenoa Developer Console? You will need to re-authenticate to manage service accounts and API credentials.
            </p>

            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem('zenoa_dev_console_logged_out', 'true');
                    localStorage.removeItem('zenoa_dev_console_user');
                  } catch (e) {}
                  setShowLogoutConfirm(false);
                  onLogout();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
              >
                Yes, Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
