import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, Lock, Key, User, Mail, Smartphone, Laptop, Globe, CheckCircle2, 
  AlertTriangle, Trash2, LogOut, ExternalLink, RefreshCw, Sun, Moon, 
  Eye, EyeOff, ChevronRight, Sparkles, Layers, Activity, Download, Search, 
  X, Check, Copy, Sliders, Database, Calendar, ShieldCheck, ShieldAlert,
  ArrowRight, Info, AlertCircle, Ban, Cpu
} from 'lucide-react';
import { UserData } from '../types';
import { db, auth } from '../firebaseClient';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useBranding } from '../brandingUtils';
import { sanitizeNameForThirdParty, resolveProfessionalName } from '../utils/oauthSecurity';
import { ZenoaLogo } from './common/ZenoaLogo';
import { BrandLogo } from './common/BrandLogo';

interface ConnectedApp {
  id: string;
  client_id: string;
  app_name: string;
  app_description?: string;
  logo_url?: string;
  website_url?: string;
  scopes?: string[];
  authorized_at: number;
  last_used_at?: number;
  status: 'active' | 'revoked';
}

interface ActiveSession {
  id: string;
  device_name: string;
  os: string;
  browser: string;
  is_current: boolean;
  last_active: number;
  ip_address: string;
  location: string;
  session_type?: string;
}

interface AccountPortalStandaloneProps {
  currentUser?: UserData | null;
  onNavigateToMessenger?: () => void;
  onLogin?: (identifier: string, pass: string) => Promise<{ success: boolean; requiresOtp?: boolean; error?: string; user?: UserData }>;
  onOAuthLogin?: (provider: 'google' | 'facebook') => Promise<void>;
}

type TabType = 'overview' | 'personal' | 'apps' | 'security' | 'privacy';

export const AccountPortalStandalone: React.FC<AccountPortalStandaloneProps> = ({
  currentUser: propUser,
  onNavigateToMessenger,
  onLogin,
  onOAuthLogin
}) => {
  const branding = useBranding();

  // Active theme
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_account_theme') || localStorage.getItem('zenoa_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (_) {}
    return 'light';
  });

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try {
      localStorage.setItem('zenoa_account_theme', next);
    } catch (_) {}
  };

  // User state
  const [user, setUser] = useState<UserData | null>(propUser || null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(!propUser);
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Sign-in form state (if not logged in)
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Profile Edit State
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editRealName, setEditRealName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');

  // Connected Apps State
  const [connectedApps, setConnectedApps] = useState<ConnectedApp[]>([]);
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [appSearchQuery, setAppSearchQuery] = useState('');
  const [revokingAppId, setRevokingAppId] = useState<string | null>(null);
  const [appToRevoke, setAppToRevoke] = useState<ConnectedApp | null>(null);

  // Security / Password State
  const [isPasswordBoxOpen, setIsPasswordBoxOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwCurrent, setShowPwCurrent] = useState(false);
  const [showPwNew, setShowPwNew] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [isChangingPw, setIsChangingPw] = useState(false);

  // Active Sessions State
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [isRevokingAllSessions, setIsRevokingAllSessions] = useState(false);
  const [showRevokeSessionsModal, setShowRevokeSessionsModal] = useState(false);

  // Data Export & Danger Zone State
  const [isExportingData, setIsExportingData] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Attempt to resolve session from props, Firebase Auth listener, or local session
  useEffect(() => {
    if (propUser) {
      setUser(propUser);
      initProfileFields(propUser);
      setIsLoadingAuth(false);
      return;
    }

    if (!auth) {
      setIsLoadingAuth(false);
      return;
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!isMounted) return;

      if (firebaseUser && db) {
        try {
          const uSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (uSnap.exists()) {
            const profile = { id: uSnap.id, ...uSnap.data() } as UserData;
            if (isMounted) {
              setUser(profile);
              initProfileFields(profile);
              try {
                if (profile.username) localStorage.setItem('zenoa_username', profile.username);
                if (profile.id) localStorage.setItem('zenoa_user_id', profile.id);
              } catch (_) {}
              setIsLoadingAuth(false);
            }
            return;
          }
        } catch (e) {
          console.warn('Account portal auth state resolution notice:', e);
        }
      }

      // Fallback: Check stored credentials from localStorage
      try {
        const storedUid = localStorage.getItem('zenoa_user_id') || localStorage.getItem('inolas_user_id');
        const storedUsername = localStorage.getItem('zenoa_username') || localStorage.getItem('inolas_username');

        if (db && storedUid) {
          const uSnap = await getDoc(doc(db, 'users', storedUid));
          if (uSnap.exists()) {
            const profile = { id: uSnap.id, ...uSnap.data() } as UserData;
            if (isMounted) {
              setUser(profile);
              initProfileFields(profile);
              setIsLoadingAuth(false);
            }
            return;
          }
        }

        if (db && storedUsername) {
          const clean = storedUsername.toLowerCase().replace(/^@/, '');
          const qSnap = await getDocs(query(collection(db, 'users'), where('username', '==', clean)));
          if (!qSnap.empty) {
            const profile = { id: qSnap.docs[0].id, ...qSnap.docs[0].data() } as UserData;
            if (isMounted) {
              setUser(profile);
              initProfileFields(profile);
              setIsLoadingAuth(false);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Account portal local session lookup notice:', err);
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [propUser]);

  const initProfileFields = (u: UserData) => {
    setEditDisplayName(u.display_name || '');
    setEditRealName(u.real_name || u.legal_name || resolveProfessionalName(u));
    setEditBio(u.bio || '');
    setEditPhone(u.mobile_number || (u as any).phone_number || '');
    setEditDob(u.dob || '');
    setEditGender(u.gender || '');
  };

  // Fetch Connected Apps
  const fetchAuthorizations = async (targetUser: UserData) => {
    setIsLoadingApps(true);
    try {
      const uId = targetUser.id || '';
      const uName = (targetUser.username || '').toLowerCase().replace(/^@/, '');
      const res = await fetch(`/api/v1/account/authorizations?user_id=${encodeURIComponent(uId)}&username=${encodeURIComponent(uName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.authorizations)) {
        setConnectedApps(data.authorizations);
      } else {
        // Fallback: Check Firestore directly if API fails
        if (db) {
          const authCol = collection(db, 'user_authorizations');
          const qSnap = await getDocs(query(authCol, where('username', '==', uName)));
          const list: ConnectedApp[] = [];
          qSnap.forEach(d => {
            const item = d.data();
            if (item.status !== 'revoked') {
              list.push({ id: d.id, ...item } as ConnectedApp);
            }
          });
          setConnectedApps(list);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch authorizations:', err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  // Fetch Active Sessions
  const fetchSessions = async (targetUser: UserData) => {
    setIsLoadingSessions(true);
    try {
      const uId = targetUser.id || '';
      const uName = (targetUser.username || '').toLowerCase().replace(/^@/, '');
      const res = await fetch(`/api/v1/account/sessions?user_id=${encodeURIComponent(uId)}&username=${encodeURIComponent(uName)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.sessions)) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  // Load tab-specific data when tab changes or user changes
  useEffect(() => {
    if (!user) return;
    if (activeTab === 'apps' || activeTab === 'overview') {
      fetchAuthorizations(user);
    }
    if (activeTab === 'security' || activeTab === 'overview') {
      fetchSessions(user);
    }
  }, [activeTab, user]);

  // Handle Login into Account Portal
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const rawInput = loginIdentifier.trim();
    if (!rawInput || !loginPassword) {
      setLoginError('Please enter your Zenoa ID, username, or email and password.');
      return;
    }

    setIsLoggingIn(true);
    try {
      // 1. If unified app login handler is provided as prop, prioritize it
      if (onLogin) {
        const res = await onLogin(rawInput, loginPassword);
        if (res.success) {
          if (res.user) {
            setUser(res.user);
            initProfileFields(res.user);
            try {
              if (res.user.username) localStorage.setItem('zenoa_username', res.user.username);
              if (res.user.id) localStorage.setItem('zenoa_user_id', res.user.id);
            } catch (_) {}
            showToast(`Welcome back, ${res.user.display_name || res.user.username}!`);
          } else if (auth?.currentUser && db) {
            const uSnap = await getDoc(doc(db, 'users', auth.currentUser.uid));
            if (uSnap.exists()) {
              const profile = { id: uSnap.id, ...uSnap.data() } as UserData;
              setUser(profile);
              initProfileFields(profile);
            }
          }
          return;
        } else {
          setLoginError(res.error || 'Incorrect credentials. Please verify your username, Zenoa ID, or password.');
          return;
        }
      }

      // 2. Direct fallback authentication with complete identifier resolution
      const cleanTarget = rawInput.toLowerCase().replace(/^@/, '').replace(/@zenoa$/, '').trim();
      const rawDigits = rawInput.replace(/[^0-9]/g, '');

      let emailToUse = rawInput;
      let matchedUserData: any = null;

      const isExplicitEmail = rawInput.includes('@') && !rawInput.toLowerCase().includes('@zenoa');
      if (!isExplicitEmail && db) {
        const usersRef = collection(db, 'users');

        // A. Try username
        let q = query(usersRef, where('username', '==', cleanTarget));
        let querySnap = await getDocs(q);

        // B. Try Zenoa ID directly
        if (querySnap.empty) {
          q = query(usersRef, where('zenoa_id', '==', rawInput.toLowerCase()));
          querySnap = await getDocs(q);
        }
        if (querySnap.empty) {
          q = query(usersRef, where('zenoa_id', '==', `@${cleanTarget}@zenoa`));
          querySnap = await getDocs(q);
        }
        if (querySnap.empty) {
          q = query(usersRef, where('zenoa_id', '==', `${cleanTarget}@zenoa`));
          querySnap = await getDocs(q);
        }

        // C. Try usernames index collection
        if (querySnap.empty) {
          try {
            const uNameSnap = await getDoc(doc(db, 'usernames', cleanTarget));
            if (uNameSnap.exists() && uNameSnap.data()?.uid) {
              const uDoc = await getDoc(doc(db, 'users', uNameSnap.data().uid));
              if (uDoc.exists()) {
                matchedUserData = { id: uDoc.id, ...uDoc.data() };
              }
            }
          } catch (_) {}
        }

        // D. Try phone/mobile number
        if (querySnap.empty && !matchedUserData && rawDigits.length >= 7) {
          const candPhones = [rawInput, rawDigits, `+91${rawDigits.slice(-10)}`, rawDigits.slice(-10)];
          for (const cand of candPhones) {
            const qMob = query(usersRef, where('mobile_number', '==', cand));
            const snapMob = await getDocs(qMob);
            if (!snapMob.empty) {
              querySnap = snapMob;
              break;
            }
            const qPhone = query(usersRef, where('phone_number', '==', cand));
            const snapPhone = await getDocs(qPhone);
            if (!snapPhone.empty) {
              querySnap = snapPhone;
              break;
            }
          }
        }

        if (!querySnap.empty && !matchedUserData) {
          matchedUserData = { id: querySnap.docs[0].id, ...querySnap.docs[0].data() };
        }

        if (matchedUserData) {
          if (matchedUserData.email && !matchedUserData.email.includes('@zenoa.internal') && !matchedUserData.email.includes('placeholder')) {
            emailToUse = matchedUserData.email;
          } else if (matchedUserData.username) {
            emailToUse = `${matchedUserData.username.toLowerCase()}@zenoa.auth`;
          }
        } else {
          setLoginError(`No account found matching "${rawInput}". Please check your username, Zenoa ID, or email.`);
          setIsLoggingIn(false);
          return;
        }
      }

      if (!emailToUse.includes('@')) {
        emailToUse = `${cleanTarget}@zenoa.auth`;
      }

      if (auth) {
        const cred = await signInWithEmailAndPassword(auth, emailToUse, loginPassword);
        const resolvedUid = cred.user.uid;

        if (db) {
          const userSnap = await getDoc(doc(db, 'users', resolvedUid));
          if (userSnap.exists()) {
            const profile = { id: userSnap.id, ...userSnap.data() } as UserData;
            setUser(profile);
            initProfileFields(profile);
            try {
              if (profile.username) localStorage.setItem('zenoa_username', profile.username);
              if (profile.id) localStorage.setItem('zenoa_user_id', profile.id);
            } catch (_) {}
            showToast(`Welcome back, ${profile.display_name || profile.username}!`);
          }
        }
      }
    } catch (err: any) {
      console.warn('Account portal login notice:', err);
      const code = err?.code || (err.message && err.message.includes('/') ? err.message : '');
      if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
        setLoginError('Incorrect credentials. Please verify your username, Zenoa ID, or password.');
      } else if (code.includes('auth/too-many-requests')) {
        setLoginError('Too many failed attempts. Please wait a few moments and try again.');
      } else if (code.includes('auth/invalid-email')) {
        setLoginError('Please enter a valid email address, username, or Zenoa ID.');
      } else if (code.includes('auth/user-disabled')) {
        setLoginError('This account has been disabled. Please contact Zenoa Security.');
      } else {
        const cleanMsg = err.message ? err.message.replace(/^Firebase:\s*/i, '').replace(/Error\s*\(([^)]+)\)\.?/i, '$1').trim() : '';
        setLoginError(cleanMsg || 'Authentication failed. Please verify your credentials.');
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    setProfileSuccessMsg('');

    try {
      const cleanDisplay = editDisplayName.trim();
      const sanitizedReal = sanitizeNameForThirdParty(editRealName.trim() || cleanDisplay, user.username || '');

      const updatedFields: any = {
        display_name: cleanDisplay,
        real_name: sanitizedReal,
        legal_name: sanitizedReal,
        bio: editBio.trim(),
        mobile_number: editPhone.trim(),
        phone_number: editPhone.trim(),
        dob: editDob,
        gender: editGender,
        updated_at: Date.now()
      };

      if (db && user.id) {
        await updateDoc(doc(db, 'users', user.id), updatedFields);
      }

      const updatedUser = { ...user, ...updatedFields };
      setUser(updatedUser);
      setProfileSuccessMsg('Account details and dual identity updated successfully!');
      showToast('Profile updated successfully.');
      setTimeout(() => setProfileSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      showToast('Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Handle App Revocation
  const handleConfirmRevoke = async () => {
    if (!appToRevoke || !user) return;
    const target = appToRevoke;
    setRevokingAppId(target.id);

    try {
      const res = await fetch('/api/v1/account/revoke-authorization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username,
          client_id: target.client_id,
          authorization_id: target.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setConnectedApps(prev => prev.filter(a => a.id !== target.id));
        showToast(`Disconnected ${target.app_name}. Access revoked.`);
      } else {
        showToast(data.error || 'Failed to revoke application access.');
      }
    } catch (err) {
      console.error('Revoke error:', err);
      showToast('Network error while revoking access.');
    } finally {
      setRevokingAppId(null);
      setAppToRevoke(null);
    }
  };

  // Handle Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (!currentPassword) {
      setPwError('Current password is required to change your password.');
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setPwError('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation password do not match.');
      return;
    }

    if (!user) return;

    setIsChangingPw(true);
    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.id,
          username: user.username,
          email: user.email,
          currentPassword,
          newPassword
        })
      });
      const data = await res.json();
      if (data.success) {
        setPwSuccess('Your password has been changed successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        showToast('Password updated successfully.');
        setTimeout(() => {
          setIsPasswordBoxOpen(false);
          setPwSuccess('');
        }, 1800);
      } else {
        setPwError(data.error || 'Failed to update password.');
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      setPwError('Network error while updating password.');
    } finally {
      setIsChangingPw(false);
    }
  };

  // Handle Revoke All Other Sessions
  const handleRevokeAllSessions = async () => {
    if (!user) return;
    setIsRevokingAllSessions(true);
    try {
      const res = await fetch('/api/v1/account/revoke-all-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('All other sessions and devices have been logged out.');
        setShowRevokeSessionsModal(false);
        fetchSessions(user);
      } else {
        showToast(data.error || 'Failed to revoke sessions.');
      }
    } catch (err) {
      console.error('Revoke sessions error:', err);
      showToast('Network error while terminating sessions.');
    } finally {
      setIsRevokingAllSessions(false);
    }
  };

  // Handle Account Data Export
  const handleExportData = async () => {
    if (!user) return;
    setIsExportingData(true);
    try {
      const res = await fetch('/api/v1/account/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          username: user.username
        })
      });
      const result = await res.json();
      if (result.success) {
        const jsonBlob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(jsonBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `zenoa_account_${user.username}_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Account data archive downloaded successfully.');
      } else {
        showToast('Unable to generate data export.');
      }
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export account archive.');
    } finally {
      setIsExportingData(false);
    }
  };

  // Handle Sign Out from Portal
  const handleLogout = () => {
    try {
      localStorage.removeItem('zenoa_username');
      localStorage.removeItem('zenoa_user_id');
      if (auth) auth.signOut().catch(() => null);
    } catch (_) {}
    setUser(null);
    showToast('Signed out of Zenoa Account.');
  };

  // Filtered Apps
  const filteredApps = useMemo(() => {
    if (!appSearchQuery.trim()) return connectedApps;
    const q = appSearchQuery.toLowerCase();
    return connectedApps.filter(a => 
      a.app_name.toLowerCase().includes(q) || 
      (a.app_description && a.app_description.toLowerCase().includes(q)) ||
      a.client_id.toLowerCase().includes(q)
    );
  }, [connectedApps, appSearchQuery]);

  // Loading Screen
  if (isLoadingAuth) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium opacity-75">Loading Zenoa Identity & Security Portal...</p>
        </div>
      </div>
    );
  }

  // Not Logged In Screen: Clean, Dedicated Zenoa Account Authentication
  if (!user) {
    return (
      <div className={`min-h-screen flex flex-col justify-between ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        {/* Top Minimal Bar */}
        <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <ZenoaLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">Zenoa</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                  Official Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Security & Identity Management</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {onNavigateToMessenger && (
              <button
                onClick={onNavigateToMessenger}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Go to Messenger
              </button>
            )}
          </div>
        </header>

        {/* Login Container */}
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-8 space-y-6"
          >
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <ZenoaLogo size={52} />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Sign in to Zenoa</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Manage your credentials, security preferences, and authorized third-party applications.
              </p>
            </div>

            {loginError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Zenoa ID, Username, or Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={loginIdentifier}
                    onChange={e => setLoginIdentifier(e.target.value)}
                    placeholder="e.g. username or email"
                    className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    value={loginPassword}
                    onChange={e => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white text-sm font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Continue to Account Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Need to create a Zenoa account?{' '}
                <a 
                  href="/signup" 
                  className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Create one here
                </a>
              </p>
            </div>
          </motion.div>
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-xs text-slate-500 dark:text-slate-500 border-t border-slate-200 dark:border-slate-800">
          Zenoa Identity & Security Hub • Enterprise Protection & Data Governance
        </footer>
      </div>
    );
  }

  // Active Logged-in Account Portal Dashboard
  return (
    <div className={`min-h-screen flex flex-col ${themeMode === 'dark' ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold shadow-2xl flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header */}
      <header className="px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ZenoaLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-slate-100">Zenoa</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Security & Identity Portal</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {themeMode === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {onNavigateToMessenger && (
              <button
                onClick={onNavigateToMessenger}
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Open Messenger</span>
              </button>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 dark:border-slate-800">
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar_seed || user.username}`}
                alt={user.username}
                className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover bg-slate-100"
              />
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          {/* Identity Quick Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3 mb-4">
            <img
              src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.avatar_seed || user.username}`}
              alt={user.username}
              className="w-12 h-12 rounded-2xl border border-slate-200 dark:border-slate-700 object-cover bg-slate-100"
            />
            <div className="overflow-hidden">
              <h3 className="font-semibold text-sm truncate">{user.display_name || user.username}</h3>
              <p className="text-xs text-indigo-600 dark:text-indigo-400 font-mono truncate">@{user.username}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email || `${user.username}@zenoa.in`}</p>
            </div>
          </div>

          <nav className="space-y-1">
            {[
              { id: 'overview', label: 'Home & Overview', icon: Activity },
              { id: 'personal', label: 'Personal Info & Identity', icon: User },
              { id: 'apps', label: 'Connected Apps (OAuth)', icon: Layers, badge: connectedApps.length },
              { id: 'security', label: 'Security & Login', icon: Lock },
              { id: 'privacy', label: 'Data & Account Control', icon: Database }
            ].map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' 
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 mt-6 space-y-2">
            <div className="p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
              <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-semibold text-xs mb-1">
                <Shield className="w-3.5 h-3.5" />
                <span>Isolated Security Domain</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                Universal identity protection and cryptographic token governance are strictly maintained.
              </p>
            </div>
          </div>
        </aside>

        {/* Right Tab Content Container */}
        <main className="flex-1 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: OVERVIEW */}
          {/* ========================================================================= */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Welcome Card */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-xl relative overflow-hidden">
                <div className="relative z-10 space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-semibold text-indigo-200">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Universal Zenoa ID Active</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight">
                    Welcome back, {user.display_name || user.username}
                  </h2>
                  <p className="text-xs text-indigo-100/80 max-w-xl leading-relaxed">
                    Here is your single point of truth for identity management, third-party integrations, and security enforcement across all Zenoa services.
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={() => setActiveTab('apps')}
                      className="px-4 py-2 rounded-xl bg-white text-indigo-900 font-semibold text-xs hover:bg-indigo-50 transition"
                    >
                      Review {connectedApps.length} Connected Apps
                    </button>
                    <button
                      onClick={() => setActiveTab('security')}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition backdrop-blur-md"
                    >
                      Security Checkup
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Connected Third Parties</span>
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div className="text-2xl font-bold">{connectedApps.length}</div>
                  <p className="text-[11px] text-slate-400">Applications authorized via OAuth 2.0</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Active Sessions</span>
                    <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold">{sessions.length || 1}</div>
                  <p className="text-[11px] text-slate-400">Authorized devices & browsers</p>
                </div>

                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">Identity Protection</span>
                    <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Dual Identity Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400">Real Name sanitized for 3rd parties</p>
                </div>
              </div>

              {/* Quick Jump Ecosystem */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <h3 className="font-bold text-sm">Zenoa Services & Portals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <a
                    href="/app"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">Zenoa Messenger</div>
                        <div className="text-[11px] text-slate-400">Web & Cloud Messaging</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </a>

                  <a
                    href="/developer"
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center justify-between group transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                        <Cpu className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold group-hover:text-violet-600 dark:group-hover:text-violet-400 transition">Developer Console</div>
                        <div className="text-[11px] text-slate-400">Register OAuth Apps & APIs</div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: PERSONAL INFO & DUAL IDENTITY */}
          {/* ========================================================================= */}
          {activeTab === 'personal' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/50 flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">How Dual Identity Works</h4>
                  <p className="text-xs text-indigo-800/80 dark:text-indigo-300/80 leading-relaxed">
                    <strong>Messenger Display Name</strong> can feature emojis and creative nicknames. 
                    <strong>Official Legal / Real Name</strong> is strictly sanitized (emojis stripped) and sent to external third-party websites when you use "Continue with Zenoa".
                  </p>
                </div>
              </div>

              {profileSuccessMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{profileSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                <h3 className="font-bold text-base">Personal Details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Public Messenger Display Name (Emojis Allowed)
                    </label>
                    <input
                      type="text"
                      required
                      value={editDisplayName}
                      onChange={e => setEditDisplayName(e.target.value)}
                      placeholder="e.g. Azad 💗💗"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Visible to other users on Zenoa Messenger.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Official Legal / Real Name (No Emojis)
                    </label>
                    <input
                      type="text"
                      required
                      value={editRealName}
                      onChange={e => setEditRealName(sanitizeNameForThirdParty(e.target.value, user?.username || ''))}
                      placeholder="e.g. Azad"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition font-medium"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">Sent to external third-party apps via OAuth token.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Zenoa Handle / Username
                    </label>
                    <div className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-mono flex items-center justify-between">
                      <span>@{user.username}</span>
                      <span className="text-[10px] font-bold text-slate-400">LOCKED</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Registered Email Address
                    </label>
                    <div className="px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 flex items-center justify-between">
                      <span>{user.email || `${user.username}@zenoa.in`}</span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editPhone}
                      onChange={e => setEditPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={editDob}
                      onChange={e => setEditDob(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Bio / Status
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={e => setEditBio(e.target.value)}
                    placeholder="Tell others a little about yourself"
                    className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition resize-none"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Save Profile Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: CONNECTED APPS & THIRD-PARTY OAUTH HUB */}
          {/* ========================================================================= */}
          {activeTab === 'apps' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold">Third-Party Apps & Services</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Apps and websites where you have logged in using "Continue with Zenoa".
                  </p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={appSearchQuery}
                    onChange={e => setAppSearchQuery(e.target.value)}
                    placeholder="Search connected apps..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {isLoadingApps ? (
                <div className="p-12 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  <p className="text-xs">Fetching authorized applications...</p>
                </div>
              ) : filteredApps.length === 0 ? (
                <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h4 className="font-semibold text-sm">No Connected Applications</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    You have not authorized any third-party websites or services with your Zenoa ID yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {filteredApps.map(appItem => (
                    <div
                      key={appItem.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 overflow-hidden font-bold">
                          {appItem.logo_url ? (
                            <img src={appItem.logo_url} alt={appItem.app_name} className="w-full h-full object-cover" />
                          ) : (
                            appItem.app_name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm">{appItem.app_name}</h4>
                            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                              {appItem.client_id.slice(0, 16)}...
                            </span>
                          </div>
                          {appItem.app_description && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{appItem.app_description}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-1.5 pt-1">
                            <span className="text-[10px] text-slate-400 mr-1">Access Granted:</span>
                            {(appItem.scopes || ['profile', 'email']).map(sc => (
                              <span key={sc} className="px-1.5 py-0.5 text-[10px] rounded bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/40">
                                {sc}
                              </span>
                            ))}
                            <span className="text-[10px] text-slate-400 ml-2">
                              • Connected on {new Date(appItem.authorized_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setAppToRevoke(appItem)}
                          disabled={revokingAppId === appItem.id}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition"
                        >
                          Revoke Access
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Revoke Confirmation Modal */}
              <AnimatePresence>
                {appToRevoke && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Ban className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">Disconnect {appToRevoke.app_name}?</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          This will immediately invalidate all active access tokens for this application. The third-party service will no longer be able to read your profile or identity.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setAppToRevoke(null)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmRevoke}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition"
                        >
                          Confirm & Revoke
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: SECURITY & LOGIN */}
          {/* ========================================================================= */}
          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Password Change Card (Collapsible) */}
              {!isPasswordBoxOpen ? (
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <Key className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Account Password</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Regularly updating your password strengthens your Zenoa ID protection.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPasswordBoxOpen(true);
                      setPwError('');
                      setPwSuccess('');
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
                  >
                    <span>Change Password</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <motion.form 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  onSubmit={handleChangePassword} 
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Key className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Change Account Password</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsPasswordBoxOpen(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPwError('');
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {pwError && (
                    <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{pwError}</span>
                    </div>
                  )}

                  {pwSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{pwSuccess}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPwCurrent ? 'text' : 'password'}
                          required
                          value={currentPassword}
                          onChange={e => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full pr-10 pl-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwCurrent(!showPwCurrent)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                        >
                          {showPwCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          New Password (Min 8 Characters)
                        </label>
                        <div className="relative">
                          <input
                            type={showPwNew ? 'text' : 'password'}
                            required
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="w-full pr-10 pl-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPwNew(!showPwNew)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                          >
                            {showPwNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPasswordBoxOpen(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                        setPwError('');
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPw}
                      className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white text-xs font-semibold shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2 cursor-pointer"
                    >
                      {isChangingPw ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <span>Update Password</span>
                      )}
                    </button>
                  </div>
                </motion.form>
              )}

              {/* Active Sessions & Devices */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base">Active Devices & Sessions</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Devices currently logged into your Zenoa ID account.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRevokeSessionsModal(true)}
                    className="px-3.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition self-start sm:self-auto"
                  >
                    Sign Out All Other Devices
                  </button>
                </div>

                <div className="space-y-3 pt-2">
                  {sessions.map(sess => (
                    <div
                      key={sess.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                          {sess.os === 'iOS' || sess.os === 'Android' ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-semibold">{sess.device_name}</h4>
                            {sess.is_current && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                This Device
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Active session • IP: {sess.ip_address}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Revoke All Sessions Modal */}
              <AnimatePresence>
                {showRevokeSessionsModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base">Terminate All Other Sessions?</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          This will immediately revoke session tokens on all other browsers, companion devices, and messenger installations. You will remain logged in on this current browser.
                        </p>
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => setShowRevokeSessionsModal(false)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleRevokeAllSessions}
                          disabled={isRevokingAllSessions}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-md shadow-rose-600/20 transition flex items-center gap-2"
                        >
                          {isRevokingAllSessions ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                          <span>Confirm Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: DATA & PRIVACY */}
          {/* ========================================================================= */}
          {activeTab === 'privacy' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              {/* Data Export Card */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Download className="w-4 h-4" />
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Export Your Account Data</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Download a copy of your personal identity information, dual names, and account security logs in a machine-readable JSON format.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleExportData}
                    disabled={isExportingData}
                    className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold text-xs hover:opacity-90 transition flex items-center gap-2"
                  >
                    {isExportingData ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating archive...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Download JSON Archive</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-6 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                  <h3 className="font-bold text-base">Account Danger Zone</h3>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Deactivating or permanently deleting your Zenoa ID will revoke access to all connected third-party services and destroy your chat inbox.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 transition"
                  >
                    Delete or Deactivate Account
                  </button>
                </div>
              </div>

              {/* Delete Modal */}
              <AnimatePresence>
                {showDeleteModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="w-full max-w-md p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
                    >
                      <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                        <Trash2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-base text-rose-600 dark:text-rose-400">Confirm Account Deletion</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                          To protect against accidental deletion, please type your username <strong className="text-slate-900 dark:text-slate-100 font-mono">@{user.username}</strong> below:
                        </p>
                      </div>

                      <input
                        type="text"
                        value={deleteConfirmationText}
                        onChange={e => setDeleteConfirmationText(e.target.value)}
                        placeholder={`@${user.username}`}
                        className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          onClick={() => {
                            setShowDeleteModal(false);
                            setDeleteConfirmationText('');
                          }}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={deleteConfirmationText.trim().replace(/^@/, '') !== user.username}
                          onClick={() => {
                            showToast('Account deactivation requested. Our compliance team will process this.');
                            setShowDeleteModal(false);
                          }}
                          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-semibold shadow-md transition"
                        >
                          Permanently Delete Account
                        </button>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
};
