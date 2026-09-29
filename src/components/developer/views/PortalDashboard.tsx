import React, { useState, useEffect, useRef } from 'react';
import { 
  Server, Lock, History, FileText, Sliders, LogOut, ShieldCheck, Zap, Key, 
  Copy, Check, RefreshCw, AlertTriangle, Download, Plus, ChevronRight, Menu, X,
  Webhook, Terminal, ArrowLeft, FileCode, CreditCard, Users, Shield, Radio,
  LayoutDashboard, Eye, EyeOff, Sun, Moon, Building2, ShoppingBag, Sparkles, ExternalLink,
  Layers, BarChart3
} from 'lucide-react';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../../firebaseClient';
import { UserData, DeveloperCategoryTier } from '../../../types';
import { useBranding } from '../../../brandingUtils';
import { BrandLogo } from '../../common/BrandLogo';
import { generateDevConsoleSecret } from '../../../utils/oauthSecurity';
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
import { BusinessAutomationAiView } from '../tabs/BusinessAutomationAiView';
import { AnalyticsView } from '../tabs/AnalyticsView';
import { FeatureLockedCard } from '../common/FeatureLockedCard';
import { CategoryUpgradeModal } from '../common/CategoryUpgradeModal';
import { DeveloperGettingStartedView, generateLongApiKey } from '../common/DeveloperGettingStartedView';
import { CustomSelect } from '../common/CustomSelect';
import { CodeBlock } from '../common/CodeBlock';
import { ErrorBoundary } from '../../common/ErrorBoundary';

interface PortalDashboardProps {
  currentUser: UserData;
  onLogout: () => void;
  onHome: () => void;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
}

export type TabType = 
  | 'overview'
  | 'apps' 
  | 'analytics'
  | 'automation'
  | 'templates'
  | 'billing'
  | 'team'
  | 'otp' 
  | 'logs' 
  | 'webhooks' 
  | 'docs' 
  | 'settings';

export const PortalDashboard: React.FC<PortalDashboardProps> = ({ 
  currentUser, 
  onLogout, 
  onHome,
  themeMode = 'light',
  onToggleTheme 
}) => {
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

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
  const [selectedArchetype, setSelectedArchetype] = useState<'personal_dev' | 'business_enterprise' | 'hybrid_gateway'>('business_enterprise');
  const [selectedCategory, setSelectedCategory] = useState<'ecommerce' | 'saas' | 'hospitality' | 'services' | 'general'>('ecommerce');
  const [selectedPlatformTarget, setSelectedPlatformTarget] = useState<'web' | 'mobile' | 'hybrid'>('hybrid');

  // SDK Generator Language Selection & Collapsible Snippets
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'node' | 'python' | 'go' | 'php' | 'java' | 'curl' | 'env' | 'html'>('typescript');
  const [revealApiKey, setRevealApiKey] = useState(false);
  const [showSdkDrawer, setShowSdkDrawer] = useState(false);
  const [showSnippetCode, setShowSnippetCode] = useState(false);

  const [showRotateModal, setShowRotateModal] = useState(false);

  // One time secret
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<any>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showCategoryUpgradeModal, setShowCategoryUpgradeModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
    };
  }, [showProfileMenu]);

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

  const createServiceAccountCore = async ({
    appNameInput,
    botUsernameInput,
    categoryTierInput = 'business',
    industryCategoryInput = 'ecommerce',
    platformTargetInput = 'hybrid',
    envInput = 'test',
    apiKeyNameInput,
    customApiKeyInput
  }: {
    appNameInput: string;
    botUsernameInput?: string;
    categoryTierInput?: DeveloperCategoryTier;
    industryCategoryInput?: any;
    platformTargetInput?: any;
    envInput?: 'test' | 'live';
    apiKeyNameInput?: string;
    customApiKeyInput?: string;
  }) => {
    const finalAppName = appNameInput.trim();
    if (!finalAppName) return;

    const rawBot = (botUsernameInput || botUsername).trim().toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._]/g, '');

    if (containsZenoa(finalAppName) || containsZenoa(rawBot)) {
      showToast("Security Violation: The word Zenoa is strictly reserved for official system accounts.");
      return;
    }

    setIsCreating(true);
    try {
      const cleanDevUser = currentUser.username.toLowerCase().replace(/[^a-z0-9._]/g, '');
      const existingApp = apps.find(a => a.id === `sa_${cleanDevUser}`) || apps[0];

      const liveApiKey = (envInput === 'live' && customApiKeyInput) 
        ? customApiKeyInput 
        : existingApp?.api_key || generateLongApiKey('live');
      const testApiKey = (envInput === 'test' && customApiKeyInput) 
        ? customApiKeyInput 
        : existingApp?.test_api_key || generateLongApiKey('test');

      const clientId = liveApiKey;
      const clientSecret = existingApp?.client_secret || generateDevConsoleSecret('live');
      const testClientId = testApiKey;
      const testClientSecret = existingApp?.test_client_secret || generateDevConsoleSecret('test');
      
      const finalBotUsername = rawBot ? rawBot : (existingApp?.bot_username || finalAppName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9._]/g, '') || cleanDevUser);

      if (containsZenoa(finalBotUsername)) {
        showToast("Security Violation: The word Zenoa cannot be used in service account handles.");
        setIsCreating(false);
        return;
      }

      const mappedArchetype: 'personal_dev' | 'business_enterprise' | 'hybrid_gateway' = 
        categoryTierInput === 'messenger' ? 'personal_dev' : categoryTierInput === 'hybrid' ? 'hybrid_gateway' : 'business_enterprise';

      const appDocId = existingApp?.id || `sa_${cleanDevUser}`;

      const newAppData = {
        id: appDocId,
        owner: currentUser.username,
        owner_id: currentUser.id || '',
        app_name: finalAppName,
        bot_username: finalBotUsername,
        archetype: mappedArchetype,
        category_tier: categoryTierInput,
        category: industryCategoryInput,
        platform_target: platformTargetInput,
        environment: envInput,
        is_live: envInput === 'live',
        api_key_name: apiKeyNameInput || (envInput === 'live' ? 'Production Primary Key' : 'Sandbox Test Key'),
        client_id: liveApiKey,
        client_secret: clientSecret,
        test_client_id: testApiKey,
        test_client_secret: testClientSecret,
        api_key: liveApiKey,
        test_api_key: testApiKey,
        is_locked: true,
        is_verified: true,
        verified_type: 'purple',
        onboarding_completed: true,
        created_at: existingApp?.created_at || Date.now(),
        updated_at: Date.now()
      };

      try {
        localStorage.setItem(`zenoa_dev_onboarding_${cleanDevUser}`, 'true');
        localStorage.setItem('zenoa_dev_active_env', envInput);
        localStorage.setItem(`zenoa_dev_env_${appDocId}`, envInput);
      } catch (e) {}

      if (db) {
        const appRef = doc(collection(db, 'developer_apps'), appDocId);
        await setDoc(appRef, newAppData, { merge: true });

        const bizAppRef = doc(db, 'business_apps', appDocId);
        await setDoc(bizAppRef, {
          id: appDocId,
          client_id: clientId,
          app_name: finalAppName,
          bot_username: finalBotUsername,
          category: industryCategoryInput,
          platform_target: platformTargetInput,
          archetype: mappedArchetype,
          category_tier: categoryTierInput,
          owner_username: currentUser.username,
          owner_id: currentUser.id || '',
          assigned_agents: [`@${currentUser.username}`],
          ai_enabled: true,
          ai_model: 'gemini-2.5-flash',
          ai_system_prompt: `You are the friendly, expert assistant for ${finalAppName}. Help customers with product recommendations, order status, return policies, and sizing inquiries.`,
          pre_purchase_auto_respond: true,
          post_purchase_instant_escalate: true,
          widget_theme: {
            primary_color: '#533afd',
            greeting_title: `Welcome to ${finalAppName}!`,
            greeting_subtitle: 'How can we assist you today?',
            position: 'bottom-right'
          },
          updated_at: Date.now()
        }, { merge: true }).catch(() => {});

        const botUserDocRef = doc(db, 'users', finalBotUsername);
        await setDoc(botUserDocRef, {
          id: finalBotUsername,
          username: finalBotUsername,
          display_name: finalAppName,
          name: finalAppName,
          is_service_account: true,
          is_business_account: true,
          is_bot: true,
          is_verified: true,
          verified_type: 'purple',
          role: 'service_account',
          login_disabled: true,
          owner: currentUser.username,
          owner_id: currentUser.id || '',
          owner_username: currentUser.username,
          linked_user_id: currentUser.id || '',
          environment: envInput,
          is_live: envInput === 'live',
          updated_at: Date.now()
        }, { merge: true }).catch(() => {});
      }

      setApps([newAppData]);
      setSelectedAppId(appDocId);
      setEnvironment(envInput);
      setNewlyGeneratedSecret({ clientId, clientSecret, appName: finalAppName, botUsername: finalBotUsername });
      showToast(`Service account @${finalBotUsername} (${finalAppName}) saved successfully.`);
    } catch (err: any) {
      showToast('Error: ' + err.message);
      throw err;
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateApp = async (e: React.FormEvent) => {
    e.preventDefault();
    await createServiceAccountCore({
      appNameInput: appName,
      botUsernameInput: botUsername,
      categoryTierInput: selectedArchetype === 'personal_dev' ? 'messenger' : selectedArchetype === 'hybrid_gateway' ? 'hybrid' : 'business',
      industryCategoryInput: selectedCategory,
      platformTargetInput: selectedPlatformTarget,
      envInput: selectedEnvOnCreate
    });
  };

  const handleGettingStartedCreate = async (data: {
    appName: string;
    botUsername: string;
    categoryTier: DeveloperCategoryTier;
    industryCategory: string;
    environment: 'test' | 'live';
    apiKeyName?: string;
    customApiKey?: string;
  }) => {
    await createServiceAccountCore({
      appNameInput: data.appName,
      botUsernameInput: data.botUsername,
      categoryTierInput: data.categoryTier,
      industryCategoryInput: data.industryCategory,
      platformTargetInput: 'hybrid',
      envInput: data.environment,
      apiKeyNameInput: data.apiKeyName,
      customApiKeyInput: data.customApiKey
    });
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

        // Record Audit Log event for Admin tracking
        const deleteAuditId = `log_sa_delete_${Date.now()}`;
        await setDoc(doc(db, 'audit_logs', deleteAuditId), {
          id: deleteAuditId,
          action: 'DELETE_SERVICE_ACCOUNT',
          actor: currentUser.username,
          actor_uid: currentUser.id || cleanDevUser,
          zenoa_id: currentUser.zenoa_id || currentUser.id || currentUser.username,
          bot_name: selectedApp.app_name || selectedApp.name || selectedApp.bot_username || 'Business Service Account',
          bot_username: selectedApp.bot_username || selectedApp.id,
          client_id: selectedApp.client_id || selectedApp.id,
          timestamp: Date.now(),
          details: `Developer @${currentUser.username} deleted Business Service Account @${selectedApp.bot_username || selectedApp.id}`
        }).catch(() => {});
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
      const mergedUpdates = {
        ...updates,
        updated_at: Date.now()
      };

      if (db) {
        const appRef = doc(db, 'developer_apps', selectedApp.id);
        await setDoc(appRef, mergedUpdates, { merge: true });

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
          await setDoc(doc(db, 'users', botU), userUpdates, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'service_accounts', botU), {
            ...userUpdates,
            updated_at: Date.now()
          }, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'sso_applications', selectedApp.id), mergedUpdates, { merge: true }).catch(() => {});
        }
      }

      setApps(prev => {
        const updated = prev.map(a => a.id === selectedApp.id ? { ...a, ...mergedUpdates } : a);
        try {
          localStorage.setItem('zenoa_dev_apps', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
    } catch (err: any) {
      const mergedFallback = { ...updates, updated_at: Date.now() };
      setApps(prev => {
        const updated = prev.map(a => a.id === selectedApp.id ? { ...a, ...mergedFallback } : a);
        try {
          localStorage.setItem('zenoa_dev_apps', JSON.stringify(updated));
        } catch (_) {}
        return updated;
      });
      console.warn("Firestore update notice:", err);
    }
  };

  const handleRotateKey = async () => {
    if (!selectedApp) return;
    const isSandbox = environment === 'test';
    const newApiKey = generateLongApiKey(environment);
    
    if (isSandbox) {
      await handleUpdateApp({
        test_api_key: newApiKey,
        test_client_id: newApiKey
      });
    } else {
      await handleUpdateApp({
        api_key: newApiKey,
        client_id: newApiKey
      });
    }

    setShowRotateModal(false);
    setNewlyGeneratedSecret({
      clientId: newApiKey,
      appName: selectedApp.app_name,
      botUsername: selectedApp.bot_username
    });
    showToast(`API Key rotated successfully for ${isSandbox ? 'Sandbox' : 'Production'} mode.`);
  };

  const rawSelectedApp = apps.find(a => a.id === selectedAppId) || apps[0];
  
  // Dynamic App projection depending on active environment
  const selectedApp = rawSelectedApp ? {
    ...rawSelectedApp,
    active_api_key: environment === 'test'
      ? (rawSelectedApp.test_api_key || rawSelectedApp.test_client_secret || rawSelectedApp.test_client_id || `zen_test_98a72f0b4c81e2d93e`)
      : (rawSelectedApp.api_key || rawSelectedApp.client_secret || rawSelectedApp.client_id || 'zen_live_98a72f0b4c81e2d93e'),
    active_client_id: environment === 'test' 
      ? (rawSelectedApp.test_client_id || `zen_test_${rawSelectedApp.client_id?.replace('zen_client_', '') || 'dev'}`)
      : (rawSelectedApp.client_id || rawSelectedApp.api_key),
    active_client_secret: environment === 'test'
      ? (rawSelectedApp.test_client_secret || `zen_sa_test_sandbox_key`)
      : (rawSelectedApp.client_secret || 'zen_sa_production_key')
  } : null;

  const currentCategoryTier: DeveloperCategoryTier = (() => {
    const rawTier = selectedApp?.category_tier || selectedApp?.tier;
    if (rawTier === 'messenger' || rawTier === 'business' || rawTier === 'hybrid') {
      return rawTier;
    }
    if (selectedApp?.archetype === 'personal_dev') return 'messenger';
    if (selectedApp?.archetype === 'hybrid_gateway') return 'hybrid';
    if (selectedApp?.archetype === 'business_enterprise') return 'business';
    return 'business';
  })();

  const handleSelectCategoryTier = async (newTier: DeveloperCategoryTier) => {
    if (!selectedApp) return;
    const mappedArchetype: 'personal_dev' | 'business_enterprise' | 'hybrid_gateway' = 
      newTier === 'messenger' ? 'personal_dev' : newTier === 'hybrid' ? 'hybrid_gateway' : 'business_enterprise';
    
    await handleUpdateApp({
      category_tier: newTier,
      archetype: mappedArchetype
    });
    showToast(`Category updated to ${newTier.toUpperCase()}. Features unlocked.`);
  };

  const getGeneratedCode = (): string => {
    if (!selectedApp) return '';
    switch (selectedLanguage) {
      case 'typescript': return generateTsSdk(selectedApp, currentCategoryTier);
      case 'node': return generateNodeSdk(selectedApp, currentCategoryTier);
      case 'python': return generatePythonSdk(selectedApp, currentCategoryTier);
      case 'go': return generateGoSdk(selectedApp, currentCategoryTier);
      case 'php': return generatePhpSdk(selectedApp, currentCategoryTier);
      case 'java': return generateJavaSdk(selectedApp, currentCategoryTier);
      case 'curl': return generateCurlSnippets(selectedApp, currentCategoryTier);
      case 'env': return generateEnvConfig(selectedApp, currentCategoryTier);
      case 'html': return generateHtmlSnippet(selectedApp, currentCategoryTier);
      default: return generateTsSdk(selectedApp, currentCategoryTier);
    }
  };

  const isOnboarded = (() => {
    try {
      const cleanUser = currentUser?.username?.toLowerCase();
      if (cleanUser && localStorage.getItem(`zenoa_dev_onboarding_${cleanUser}`) === 'true') return true;
    } catch (e) {}
    return selectedApp?.onboarding_completed === true;
  })();

  const isDark = themeMode === 'dark';

  // Standalone Full-Screen Gated Onboarding View
  if (!selectedApp || isCreating || !isOnboarded) {
    return (
      <DeveloperGettingStartedView
        currentUsername={currentUser.username}
        onCreateApp={handleGettingStartedCreate}
        onCancel={apps.length > 0 && isOnboarded ? () => setIsCreating(false) : undefined}
        themeMode={themeMode}
      />
    );
  }

  return (
    <div className={`flex h-screen font-sans overflow-hidden transition-colors ${
      isDark ? 'dark bg-[#0c1024] text-white selection:bg-[#533afd] selection:text-white' : 'bg-[#f6f9fc] text-[#0d253d] selection:bg-[#533afd]/20 selection:text-[#533afd]'
    }`}>
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-[#0d253d] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-medium animate-in slide-in-from-top-2 border border-[#273951]">
          <ShieldCheck className="h-5 w-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Sidebar - Desktop */}
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 transition-colors ${
        isDark ? 'border-[#273951] bg-[#0d1326]' : 'border-[#e3e8ee] bg-white'
      }`}>
        <div className={`p-4 border-b flex items-center justify-between ${
          isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
        }`}>
          <div className="flex items-center gap-3">
            <BrandLogo
              src={activeLogo}
              name={branding.app_name || 'Zenoa'}
              size="sm"
            />
            <div>
              <h1 className="text-xs font-bold tracking-tight text-[#0d253d] dark:text-white">{branding.app_name || 'Zenoa'} Developer Console</h1>
              <p className="text-[10px] text-[#64748d] dark:text-[#94a3b8] font-medium">Inolas Nexus &bull; APIs & Bots</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 p-3 space-y-4 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Core</div>
            <div className="space-y-0.5">
              {[
                { id: 'overview', icon: LayoutDashboard, label: 'Overview' },
                { id: 'apps', icon: Key, label: 'API Credentials' },
                { id: 'analytics', icon: BarChart3, label: 'Analytics', locked: currentCategoryTier === 'messenger' },
                { id: 'docs', icon: FileText, label: 'Documentation' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 font-semibold' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-[#533afd] dark:text-[#818cf8]' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.locked && (
                    <Lock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Business Suite & AI */}
          <div>
            <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Business & AI</div>
            <div className="space-y-0.5">
              <button
                onClick={() => setActiveTab('automation')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate whitespace-nowrap ${
                  activeTab === 'automation' 
                    ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 font-semibold' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Sparkles className={`h-4 w-4 shrink-0 ${activeTab === 'automation' ? 'text-[#533afd] dark:text-[#818cf8]' : 'text-zinc-500 dark:text-zinc-400'}`} />
                  <span className="truncate">Automation and AI Studio</span>
                </div>
                {currentCategoryTier === 'messenger' && (
                  <Lock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1.5" />
                )}
              </button>

              <a
                href="/business"
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white cursor-pointer truncate whitespace-nowrap"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <Building2 className="h-4 w-4 shrink-0 text-zinc-500 dark:text-zinc-400" />
                  <span className="truncate">Business Console</span>
                </div>
              </a>
            </div>
          </div>

          {/* Tools & Testing */}
          <div>
            <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Developer Tools</div>
            <div className="space-y-0.5">
              {[
                { id: 'otp', icon: Zap, label: 'OTP Simulator', locked: currentCategoryTier === 'business' },
                { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
                { id: 'logs', icon: Terminal, label: 'Live Inspector' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 font-semibold' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-[#533afd] dark:text-[#818cf8]' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.locked && (
                    <Lock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Management & Quotas */}
          <div>
            <div className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400 dark:text-zinc-500">Account</div>
            <div className="space-y-0.5">
              {[
                { id: 'templates', icon: FileCode, label: 'Message Templates', locked: currentCategoryTier === 'messenger' },
                { id: 'billing', icon: CreditCard, label: 'Billing and Quotas', locked: currentCategoryTier === 'messenger' },
                { id: 'team', icon: Users, label: 'Team Members', locked: currentCategoryTier === 'messenger' },
                { id: 'settings', icon: Sliders, label: 'Settings' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20 font-semibold' 
                      : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <tab.icon className={`h-4 w-4 shrink-0 ${activeTab === tab.id ? 'text-[#533afd] dark:text-[#818cf8]' : 'text-zinc-500 dark:text-zinc-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.locked && (
                    <Lock className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500 shrink-0 ml-1.5" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer with User info & Theme preference */}
        <div className={`p-3 border-t space-y-2.5 ${
          isDark ? 'border-[#273951] bg-[#0c1024]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]/80'
        }`}>
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 overflow-hidden min-w-0">
              <div className="h-7 w-7 rounded-full bg-[#533afd] text-white flex items-center justify-center text-xs font-semibold uppercase shrink-0">
                {currentUser.username.slice(0, 2)}
              </div>
              <div className="overflow-hidden min-w-0">
                <p className="text-xs font-semibold truncate text-[#0d253d] dark:text-white">{currentUser.display_name || currentUser.username}</p>
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 truncate">@{currentUser.username}</p>
              </div>
            </div>

            {/* Theme switcher preference directly next to user name */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-1.5 rounded-lg border transition-colors cursor-pointer shrink-0 ${
                  isDark 
                    ? 'border-[#273951] hover:bg-[#1c1e54] text-amber-400' 
                    : 'border-[#e3e8ee] hover:bg-[#f6f9fc] text-zinc-600'
                }`}
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          <button onClick={() => setShowLogoutConfirm(true)} className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
            isDark ? 'bg-[#121624] hover:bg-[#1c1e54] text-[#cbd5e1] border-[#273951]' : 'bg-white hover:bg-[#f6f9fc] text-[#273951] border-[#e3e8ee]'
          }`}>
            <LogOut className="h-3.5 w-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${
        isDark ? 'bg-[#0c1024]' : 'bg-[#f6f9fc]'
      }`}>
        {/* Top Header - Clean, Minimal & Professional */}
        <header className={`border-b px-6 py-3 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md ${
          isDark ? 'border-[#273951] bg-[#0c1024]/90' : 'border-[#e3e8ee] bg-white/90 shadow-[0_1px_3px_rgba(0,55,112,0.04)]'
        }`}>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMobileMenuOpen(true)} 
              className="md:hidden p-1.5 -ml-1.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Developer Console
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Minimal Plan Indicator */}
            {selectedApp && (
              <button
                type="button"
                onClick={() => setShowCategoryUpgradeModal(true)}
                className="text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Change or Upgrade Plan"
              >
                <span>Plan:</span>
                <span className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                  {currentCategoryTier === 'messenger' ? 'Messenger' : currentCategoryTier === 'business' ? 'Business' : 'Hybrid'}
                </span>
              </button>
            )}

            {/* Profile Avatar with Account Dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setShowProfileMenu(prev => !prev)}
                className="h-8 w-8 rounded-full bg-[#533afd] text-white flex items-center justify-center text-xs font-semibold uppercase hover:ring-2 hover:ring-[#533afd]/30 transition-all cursor-pointer shadow-2xs"
                aria-label="User and Service Account Menu"
              >
                {currentUser.username.slice(0, 2)}
              </button>

              {/* Floating Profile & Account Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-50 bg-white dark:bg-[#0d1326] border-zinc-200 dark:border-[#273951] text-zinc-900 dark:text-zinc-100">
                  {/* User Profile Info */}
                  <div className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-[#533afd] text-white flex items-center justify-center text-xs font-bold uppercase shrink-0">
                        {currentUser.username.slice(0, 2)}
                      </div>
                      <div className="overflow-hidden min-w-0">
                        <p className="text-xs font-bold truncate text-zinc-900 dark:text-zinc-100">
                          {currentUser.display_name || currentUser.username}
                        </p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          @{currentUser.username}
                        </p>
                      </div>
                    </div>
                    {currentUser.email && (
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-1">
                        {currentUser.email}
                      </p>
                    )}
                  </div>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                  {/* Service Account Details */}
                  <div className="px-3 py-2 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      Service Account
                    </span>
                    <div className="p-2 rounded-xl bg-zinc-50 dark:bg-[#121624] border border-zinc-200/60 dark:border-zinc-800 space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        <span className="truncate">{selectedApp?.app_name || 'Active Service Account'}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 capitalize shrink-0">
                          {environment}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                        @{selectedApp?.bot_username || currentUser.username}
                      </div>
                      <div className="text-[10px] text-zinc-400 dark:text-zinc-500 flex items-center justify-between pt-1 border-t border-zinc-200/50 dark:border-zinc-800/50">
                        <span className="capitalize">{currentCategoryTier} Plan</span>
                        <button
                          type="button"
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowCategoryUpgradeModal(true);
                          }}
                          className="text-[#533afd] dark:text-[#818cf8] font-semibold hover:underline cursor-pointer"
                        >
                          Change Plan
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                  {/* Navigation Links */}
                  <div className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      <Sliders className="h-3.5 w-3.5 text-zinc-400" />
                      <span>Settings &amp; Preferences</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setActiveTab('apps');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                    >
                      <Key className="h-3.5 w-3.5 text-zinc-400" />
                      <span>API Credentials</span>
                    </button>

                    {onToggleTheme && (
                      <button
                        type="button"
                        onClick={onToggleTheme}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-zinc-500" />}
                          <span>Theme</span>
                        </div>
                        <span className="text-[11px] text-zinc-400 capitalize">{themeMode}</span>
                      </button>
                    )}
                  </div>

                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />

                  {/* Sign Out Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowLogoutConfirm(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
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
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm md:hidden flex">
            <div className={`w-64 h-full shadow-2xl flex flex-col border-r ${
              isDark ? 'bg-[#0d1326] border-[#273951] text-white' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
            }`}>
              <div className={`p-4 flex items-center justify-between border-b ${
                isDark ? 'border-[#273951]' : 'border-[#e3e8ee]'
              }`}>
                <span className="font-bold text-sm">Navigation</span>
                <button 
                  onClick={() => setMobileMenuOpen(false)} 
                  className="p-1.5 rounded-lg text-[#64748d] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="flex-1 p-3 space-y-1 overflow-y-auto">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'apps', label: 'API Credentials' },
                  { id: 'analytics', label: 'Analytics' },
                  { id: 'automation', label: 'Automation & AI Studio' },
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
                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      activeTab === t.id 
                        ? 'bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] dark:bg-[#533afd]/20' 
                        : 'text-[#64748d] dark:text-[#94a3b8] hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54] hover:text-[#0d253d] dark:hover:text-white'
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
          <ErrorBoundary fallbackTitle="Portal Module Error">
          {!selectedApp ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No developer application selected.
            </div>
          ) : (
            <>
              {/* 1. OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <OverviewView
                  app={selectedApp}
                  environment={environment}
                  categoryTier={currentCategoryTier}
                  onOpenCategoryUpgrade={() => setShowCategoryUpgradeModal(true)}
                  onNavigate={(tab) => setActiveTab(tab)}
                  showToast={showToast}
                  themeMode={themeMode}
                />
              )}

              {/* 2. APPS & CREDENTIALS TAB */}
              {activeTab === 'apps' && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <Key className="h-6 w-6 text-[#533afd] dark:text-[#818cf8]" />
                        <span>API Credentials and Key Manager</span>
                      </h2>
                      <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-1">
                        Manage your {environment === 'test' ? 'Sandbox' : 'Production'} authentication keys securely.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${
                        environment === 'test'
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      }`}>
                        {environment === 'test' ? 'Sandbox Keys Active' : 'Live Production Keys Active'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Zenoa Business Live Chat & Command Center Card */}
                    <div className={`rounded-xl p-5 border flex flex-col md:flex-row items-start md:items-center justify-between gap-5 transition-colors ${
                      isDark 
                        ? 'bg-[#121624] border-[#273951]' 
                        : 'bg-[#f8fafc] border-[#e2e8f0]'
                    }`}>
                      <div className="flex items-start gap-3.5">
                        <div className="p-2.5 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shrink-0">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-[#0d253d] dark:text-white">
                              Zenoa Business and Live Support
                            </h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                              Dual Track Ready
                            </span>
                          </div>
                          <p className="text-xs text-[#64748d] dark:text-[#94a3b8] max-w-xl leading-relaxed">
                            Embed live customer support into websites or storefronts. Automated assistance manages product discovery, while order issues route directly to human support with session context.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full md:w-auto">
                        <a
                          href="/business"
                          className="flex-1 md:flex-none px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Building2 className="h-3.5 w-3.5" />
                          <span>Business Console</span>
                        </a>
                        <button
                          type="button"
                          onClick={() => setActiveTab('automation')}
                          className="flex-1 md:flex-none px-3.5 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>AI Automation Studio</span>
                        </button>
                      </div>
                    </div>

                    {/* Credentials & Key Master Panel */}
                    <div className={`rounded-2xl shadow-xs overflow-hidden border ${
                      isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
                    }`}>
                      <div className={`p-6 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDark ? 'border-[#273951] bg-[#121624]/60' : 'border-[#e3e8ee] bg-[#f6f9fc]/80'
                      }`}>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <h3 className="text-lg font-bold text-[#0d253d] dark:text-white">{selectedApp.app_name}</h3>
                            <span className={`px-2.5 py-0.5 text-[11px] font-bold rounded-full border ${
                              environment === 'test'
                                ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                            }`}>
                              {environment === 'test' ? 'Sandbox Environment' : 'Live Production'}
                            </span>
                            <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/20 capitalize">
                              {currentCategoryTier} Plan
                            </span>
                          </div>
                          <p className="text-xs font-mono text-[#64748d] dark:text-[#94a3b8] mt-1 flex items-center gap-2">
                            <span>Handle: @{selectedApp.bot_username || selectedApp.owner}</span>
                            <span>&bull;</span>
                            <span>Account ID: sa_{selectedApp.owner.toLowerCase()}</span>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            environment === 'test' 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400' 
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {environment === 'test' ? 'Sandbox Environment' : 'Production Live'}
                          </span>
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border uppercase tracking-wider ${
                            currentCategoryTier === 'hybrid'
                              ? 'bg-purple-500/10 border-purple-500/30 text-purple-600 dark:text-purple-400'
                              : currentCategoryTier === 'business'
                              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-600 dark:text-indigo-400'
                              : 'bg-blue-500/10 border-blue-500/30 text-blue-600 dark:text-blue-400'
                          }`}>
                            {currentCategoryTier === 'hybrid' ? 'Hybrid Gateway' : currentCategoryTier === 'business' ? 'Business Suite' : 'Messenger Plan'}
                          </span>
                        </div>
                      </div>

                      <div className="p-6 space-y-6">
                        {/* 1. Primary Unified API Key Card */}
                        <div className={`p-4 rounded-xl border ${
                          isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                            <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                              <Key className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
                              <span>{environment === 'test' ? 'Sandbox API Key (Test Key)' : 'Production API Key (Live Key)'}</span>
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setRevealApiKey(!revealApiKey)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'border-[#273951] hover:bg-[#1e293b] text-zinc-300' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-700'
                                }`}
                              >
                                {revealApiKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                <span>{revealApiKey ? 'Hide Key' : 'Reveal Key'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopy(selectedApp.active_api_key, "API Key")}
                                className="px-3 py-1 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                              >
                                {copiedKey === selectedApp.active_api_key ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5" />}
                                <span>{copiedKey === selectedApp.active_api_key ? 'Copied' : 'Copy API Key'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setShowRotateModal(true)}
                                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                                  isDark ? 'border-rose-900/40 text-rose-400 hover:bg-rose-950/40' : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                }`}
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Rotate Key</span>
                              </button>
                            </div>
                          </div>

                          <div className={`p-3 rounded-lg border font-mono text-xs select-all flex items-center justify-between ${
                            isDark ? 'bg-[#0a0d1a] border-[#273951] text-emerald-400' : 'bg-white border-[#e3e8ee] text-[#0d253d]'
                          }`}>
                            <span className="truncate tracking-wide font-mono">
                              {revealApiKey 
                                ? selectedApp.active_api_key 
                                : `${selectedApp.active_api_key.substring(0, 10)}••••••••••••••••••••••••••••`}
                            </span>
                            <span className="text-[10px] uppercase font-sans font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded ml-2 shrink-0">
                              Active & Ready
                            </span>
                          </div>
                        </div>

                        {/* 2. Standard REST API Authentication Headers */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                                <Terminal className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8]" />
                                <span>Bearer Token Header</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleCopy(`Authorization: Bearer ${selectedApp.active_api_key}`, "Authorization Header")}
                                className="text-xs font-bold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Header</span>
                              </button>
                            </div>
                            <div className="bg-[#0c1024] text-slate-200 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-x-auto border border-[#273951]">
                              <code className="text-[#818cf8]">
                                Authorization: <span className="text-emerald-400">Bearer</span> <span className="text-[#94a3b8] font-mono">{selectedApp.active_api_key.substring(0, 8)}...</span>
                              </code>
                            </div>
                          </div>

                          <div className={`p-4 rounded-xl border ${
                            isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <label className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 text-[#0d253d] dark:text-white">
                                <Key className="h-3.5 w-3.5 text-indigo-400" />
                                <span>Custom API Key Header</span>
                              </label>
                              <button
                                type="button"
                                onClick={() => handleCopy(`X-Zenoa-Api-Key: ${selectedApp.active_api_key}`, "API Key Header")}
                                className="text-xs font-bold text-[#533afd] dark:text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Copy className="h-3.5 w-3.5" />
                                <span>Copy Header</span>
                              </button>
                            </div>
                            <div className="bg-[#0c1024] text-slate-200 p-3 rounded-lg font-mono text-xs flex items-center justify-between overflow-x-auto border border-[#273951]">
                              <code className="text-[#818cf8]">
                                X-Zenoa-Api-Key: <span className="text-amber-400 font-mono">{selectedApp.active_api_key.substring(0, 8)}...</span>
                              </code>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SDK Quickstart (Collapsed by default) */}
                    <div className={`rounded-2xl shadow-xs overflow-hidden border transition-all ${
                      isDark ? 'bg-[#0d1326] border-[#273951]' : 'bg-white border-[#e3e8ee]'
                    }`}>
                      <div className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDark ? 'bg-[#121624]/70' : 'bg-[#f6f9fc]/80'
                      } ${showSnippetCode ? 'border-b border-[#273951]' : ''}`}>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold flex items-center gap-2 text-[#0d253d] dark:text-white">
                              <FileCode className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
                              <span>SDK Quickstart</span>
                            </h3>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[#533afd]/10 text-[#533afd] dark:text-[#818cf8] border border-[#533afd]/20 capitalize">
                              {currentCategoryTier} Plan
                            </span>
                          </div>
                          <p className="text-xs text-[#64748d] dark:text-[#94a3b8] mt-1">
                            Production SDK code examples customized for your active application category.
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-56">
                            <CustomSelect
                              value={selectedLanguage}
                              onChange={(val) => {
                                setSelectedLanguage(val as any);
                                setShowSnippetCode(true);
                              }}
                              options={[
                                { value: 'typescript', label: 'TypeScript SDK' },
                                { value: 'node', label: 'Node.js SDK' },
                                { value: 'python', label: 'Python SDK' },
                                { value: 'go', label: 'Go SDK' },
                                { value: 'php', label: 'PHP SDK' },
                                { value: 'java', label: 'Java SDK' },
                                { value: 'curl', label: 'cURL Request' },
                                { value: 'env', label: 'Environment .env' },
                                { value: 'html', label: 'HTML Web Widget' },
                              ]}
                            />
                          </div>

                          <button
                            type="button"
                            onClick={() => setShowSnippetCode(!showSnippetCode)}
                            className="px-4 py-2 bg-[#533afd] hover:bg-[#432ec4] text-white text-xs font-medium rounded-xl flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer shrink-0"
                          >
                            <span>{showSnippetCode ? 'Hide SDK Code' : 'View SDK Code'}</span>
                          </button>
                        </div>
                      </div>

                      {showSnippetCode && (
                        <div className="p-0 animate-in fade-in duration-200">
                          <div className="p-3 border-b border-[#273951] bg-[#0c1024] flex items-center justify-between text-xs px-4">
                            <span className="text-zinc-400 font-mono text-[11px]">
                              {selectedLanguage.toUpperCase()} SDK Integration Code
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(getGeneratedCode(), `${selectedLanguage.toUpperCase()} SDK Code`)}
                              className="text-xs font-medium text-[#818cf8] hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              {copiedKey === getGeneratedCode() ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                              <span>{copiedKey === getGeneratedCode() ? 'Copied' : 'Copy Code'}</span>
                            </button>
                          </div>
                          <CodeBlock
                            code={getGeneratedCode()}
                            language={selectedLanguage}
                            themeMode={themeMode}
                            maxHeight="520px"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2.5. POWERFUL DEVELOPER ANALYTICS TAB */}
              {activeTab === 'analytics' && (
                currentCategoryTier === 'messenger' ? (
                  <FeatureLockedCard
                    featureName="Developer Analytics and Real-Time Telemetry"
                    requiredTier="business_or_hybrid"
                    currentTier={currentCategoryTier}
                    description="Discrete throughput telemetry, latency distributions (p95), SLA health tracking, top endpoint share breakdowns, and CSV reports are available on Business Suite and Hybrid plans."
                    benefits={[
                      'Throughput volume tracking across 15m, 1h, 24h, 7d, 30d, and Custom ranges',
                      'p95 & average response latency distribution meters',
                      'Top endpoint volume share and route-by-route performance',
                      'HTTP response status codes (2xx, 4xx, 5xx) health monitor',
                      'Multi-region global edge gateway latency benchmarks',
                      'Instant CSV analytics snapshot export'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <AnalyticsView
                    app={selectedApp}
                    environment={environment}
                    themeMode={themeMode}
                    showToast={showToast}
                  />
                )
              )}

              {/* 3. BUSINESS AUTOMATION & AI STUDIO TAB */}
              {activeTab === 'automation' && (
                currentCategoryTier === 'messenger' ? (
                  <FeatureLockedCard
                    featureName="Business Automation and AI Studio"
                    requiredTier="business_or_hybrid"
                    currentTier={currentCategoryTier}
                    description="AI Customer Copilot, multi-model BYOK credentials, automatic triage workflows, and customer bubble rate limiters are available on Business Suite and Hybrid plans."
                    benefits={[
                      'BYOK integration with Gemini, OpenAI, Claude, Groq, Mistral, and OpenRouter',
                      'Customer bubble cooldown timers and rapid reply anti-spam protection',
                      'Automated pre-purchase triage and order escalation rules',
                      'Custom AI system instructions and persona tuning'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <BusinessAutomationAiView
                    app={selectedApp}
                    showToast={showToast}
                    onUpdateApp={handleUpdateApp}
                    themeMode={themeMode}
                  />
                )
              )}

              {/* 4. MESSAGE TEMPLATES TAB */}
              {activeTab === 'templates' && (
                currentCategoryTier === 'messenger' ? (
                  <FeatureLockedCard
                    featureName="Message Templates and Commerce Cards"
                    requiredTier="business_or_hybrid"
                    currentTier={currentCategoryTier}
                    description="Commerce catalog templates, interactive quick replies, and marketing message formats are available on Business Suite and Hybrid plans."
                    benefits={[
                      'Interactive product cards and buttons',
                      'Pre-approved transactional notification formats',
                      'Dynamic parameter binding and variables',
                      'Localized language variants'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <MessageTemplatesView
                    app={selectedApp}
                    showToast={showToast}
                    environment={environment}
                    themeMode={themeMode}
                  />
                )
              )}

              {/* 5. BILLING & QUOTA TAB */}
              {activeTab === 'billing' && (
                currentCategoryTier === 'messenger' ? (
                  <FeatureLockedCard
                    featureName="Billing and Quotas"
                    requiredTier="business_or_hybrid"
                    currentTier={currentCategoryTier}
                    description="Enterprise quota controls, agent seat licensing, and commercial payment tiers are available on Business Suite and Hybrid plans."
                    benefits={[
                      'Scaled concurrent session limits',
                      'Multi-agent seats and delegation',
                      'Usage alerts and telemetry',
                      'Automated monthly reconciliation'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <BillingQuotaView
                    app={selectedApp}
                    showToast={showToast}
                    themeMode={themeMode}
                  />
                )
              )}

              {/* 6. TEAM MEMBERS & ROLES TAB */}
              {activeTab === 'team' && (
                currentCategoryTier === 'messenger' ? (
                  <FeatureLockedCard
                    featureName="Team Members and Role Permissions"
                    requiredTier="business_or_hybrid"
                    currentTier={currentCategoryTier}
                    description="Multi-engineer console access, agent inbox assignments, and role-based permissions are available on Business Suite and Hybrid plans."
                    benefits={[
                      'Multi-user team delegation',
                      'Developer, Support Agent, and Admin roles',
                      'Granular API secret key access control',
                      'Action audit logs for security compliance'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <TeamMembersView
                    app={selectedApp}
                    currentUser={currentUser}
                    showToast={showToast}
                    themeMode={themeMode}
                  />
                )
              )}

              {/* 7. LIVE LOGS & INSPECTOR TAB */}
              {activeTab === 'logs' && (
                <ApiLogsView 
                  app={selectedApp} 
                  showToast={showToast} 
                  themeMode={themeMode}
                />
              )}

              {/* 8. WEBHOOKS MANAGER TAB */}
              {activeTab === 'webhooks' && (
                <WebhooksView 
                  app={selectedApp} 
                  showToast={showToast} 
                  onUpdateApp={handleUpdateApp}
                  themeMode={themeMode}
                />
              )}

              {/* 9. OTP SIMULATOR TAB */}
              {activeTab === 'otp' && (
                currentCategoryTier === 'business' ? (
                  <FeatureLockedCard
                    featureName="Carrier OTP Telephony Simulator"
                    requiredTier="hybrid"
                    currentTier={currentCategoryTier}
                    description="Direct carrier SMS and WhatsApp verification simulation is reserved for Messenger and Hybrid Gateway tiers."
                    benefits={[
                      'Carrier latency and delivery simulation',
                      '6-digit numeric OTP generation and validation',
                      'Simulated user verification flows',
                      'Direct carrier failure condition testing'
                    ]}
                    onUpgrade={() => setShowCategoryUpgradeModal(true)}
                    themeMode={themeMode}
                  />
                ) : (
                  <OtpSimulatorView 
                    app={selectedApp} 
                    currentUser={currentUser} 
                    showToast={showToast} 
                    themeMode={themeMode}
                  />
                )
              )}

              {/* 10. DOCS TAB */}
              {activeTab === 'docs' && (
                <ApiDocsView 
                  app={selectedApp} 
                  showToast={showToast} 
                  themeMode={themeMode}
                />
              )}

              {/* 11. SETTINGS TAB */}
              {activeTab === 'settings' && (
                <SecuritySettingsView 
                  app={selectedApp} 
                  environment={environment}
                  categoryTier={currentCategoryTier}
                  onSetEnvironment={handleSetEnvironment}
                  onOpenCategoryUpgrade={() => setShowCategoryUpgradeModal(true)}
                  showToast={showToast} 
                  onUpdateApp={handleUpdateApp}
                  onRotateKey={handleRotateKey}
                  onDeleteApp={handleDeleteApp}
                  themeMode={themeMode}
                />
              )}
            </>
          )}
          </ErrorBoundary>
        </div>
      </main>

      {/* Category Upgrade & Tier Switcher Modal */}
      {showCategoryUpgradeModal && (
        <CategoryUpgradeModal
          currentTier={currentCategoryTier}
          isOpen={showCategoryUpgradeModal}
          onClose={() => setShowCategoryUpgradeModal(false)}
          onSelectCategory={async (tier: DeveloperCategoryTier) => {
            await handleSelectCategoryTier(tier);
            setShowCategoryUpgradeModal(false);
          }}
          themeMode={themeMode}
        />
      )}

      {/* Newly Minted API Key Revelation Modal */}
      {newlyGeneratedSecret && (
        <div className="fixed inset-0 z-50 bg-[#080c14]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-lg rounded-2xl p-6 border shadow-2xl animate-in zoom-in-95 space-y-5 ${
            isDark ? 'bg-[#0f1524] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">API Key Generated</h3>
                <p className="text-xs text-zinc-400">{newlyGeneratedSecret.appName || 'Developer Account'}</p>
              </div>
            </div>
            
            <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-500 leading-relaxed">
              <strong>Security Notice:</strong> Please copy your unified API key now. Store it safely in your server environment variables.
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1.5 block">
                  Unified API Key ({environment === 'test' ? 'Sandbox' : 'Production'})
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={newlyGeneratedSecret.clientId || selectedApp?.active_api_key}
                    className={`w-full border rounded-xl px-3.5 py-2 text-xs font-mono outline-none ${
                      isDark ? 'bg-[#080c14] border-zinc-800 text-emerald-400' : 'bg-zinc-50 border-zinc-200 text-zinc-900'
                    }`}
                  />
                  <button
                    onClick={() => handleCopy(newlyGeneratedSecret.clientId || selectedApp?.active_api_key, "API Key")}
                    className="px-4 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl font-semibold text-xs transition-colors shadow-xs cursor-pointer shrink-0"
                  >
                    Copy Key
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setNewlyGeneratedSecret(null)}
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-medium transition-all shadow-xs cursor-pointer"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* API Key Rotation Warning Modal */}
      {showRotateModal && (
        <div className="fixed inset-0 z-50 bg-[#080c14]/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-5 animate-in zoom-in-95 ${
            isDark ? 'bg-[#0f1524] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl border border-amber-500/20 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold tracking-tight">Rotate API Key?</h3>
                <p className="text-xs text-zinc-400">Security Action &bull; {environment === 'test' ? 'Sandbox' : 'Production'} Key</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-500 leading-relaxed">
              <strong>Warning:</strong> Rotating your API key will immediately revoke your current key. All active servers, webhooks, or SDK clients using the old key will lose access until updated.
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRotateModal(false)}
                className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRotateKey}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Confirm Rotation
              </button>
            </div>
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
