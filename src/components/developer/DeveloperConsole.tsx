import React, { useState, useEffect } from 'react';
import { resolveAndApplyMetadata } from '../../seoUtils';
import { auth, db } from '../../firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserData } from '../../types';
import { LandingView } from './views/LandingView';
import { MobileSetupView } from './views/MobileSetupView';
import { PortalDashboard } from './views/PortalDashboard';
import { buildSecureOAuthUrl } from '../../utils/oauthSecurity';
import { ErrorBoundary } from '../common/ErrorBoundary';

type ConsoleView = 'landing' | 'mobile_setup' | 'portal';

const safeBase64Decode = (str: string): string => {
  try {
    return decodeURIComponent(atob(str).split('').map((c) =>
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''));
  } catch (e) {
    try {
      return atob(str);
    } catch (e2) {
      return str;
    }
  }
};

export const DeveloperConsoleStandalone: React.FC = () => {
  useEffect(() => {
    resolveAndApplyMetadata();
  }, []);

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ConsoleView>('landing');
  const [securityAlert, setSecurityAlert] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_dev_theme') || localStorage.getItem('zenoa_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  // Strict synchronization between themeMode and documentElement class
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('zenoa_dev_theme', themeMode);
      localStorage.setItem('zenoa_theme_mode', themeMode);
    } catch (e) {}
  }, [themeMode]);

  const toggleTheme = () => {
    setThemeMode(prev => prev === 'light' ? 'dark' : 'light');
  };

  /**
   * Real-time verification of user against live Firestore database.
   * If user document does not exist, they are DELETED and must be rejected immediately!
   * NEVER re-create deleted users.
   */
  const fetchFullUserProfile = async (searchIdent: string, uid?: string): Promise<{ profile: UserData | null; status: 'ok' | 'not_found' | 'suspended' }> => {
    if (!db) return { profile: null, status: 'ok' };
    try {
      let snap = null;
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists()) snap = uidSnap;
      }

      if (!snap && searchIdent) {
        const clean = searchIdent.trim().toLowerCase().replace(/^@/, '');
        const userDoc = await getDoc(doc(db, 'users', clean));
        if (userDoc.exists()) snap = userDoc;
      }

      if (!snap && searchIdent) {
        const clean = searchIdent.trim().toLowerCase().replace(/^@/, '');
        const usersRef = collection(db, 'users');
        const uq = query(usersRef, where('username', '==', clean));
        const uSnap = await getDocs(uq);
        if (!uSnap.empty) snap = uSnap.docs[0];
      }

      // If document does NOT exist in Firestore, account has been deleted!
      if (!snap || !snap.exists()) {
        return { profile: null, status: 'not_found' };
      }

      const data = snap.data();
      const isBlocked = 
        data.status === 'suspended' || 
        data.status === 'blocked' || 
        data.status === 'deactivated' || 
        data.status === 'deleted' ||
        data.is_deleted === true || 
        data.deleted_at ||
        data.deactivated === true || 
        data.disabled === true ||
        data.is_suspended === true;

      if (isBlocked) {
        return { profile: null, status: 'suspended' };
      }

      return { profile: { id: snap.id, ...data } as UserData, status: 'ok' };
    } catch (err) {
      console.warn('Developer console user fetch error:', err);
      return { profile: null, status: 'not_found' };
    }
  };

  const purgeAllUserSessions = (reasonMsg: string) => {
    try {
      localStorage.removeItem('zenoa_dev_console_user');
      localStorage.removeItem('zenoa_user');
      localStorage.removeItem('zenoa_sso_console_user');
      sessionStorage.setItem('zenoa_dev_console_logged_out', 'true');
    } catch (e) {}
    setUser(null);
    setView('landing');
    setSecurityAlert(reasonMsg);
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    const resolveAuthHandshake = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hasOAuthReturn = searchParams.has('code') || searchParams.has('payload');
      const isExplicitPortal = searchParams.get('view') === 'portal';

      // 1. Check if returning from fresh OAuth handshake with code / payload
      if (hasOAuthReturn) {
        try {
          sessionStorage.removeItem('zenoa_dev_console_logged_out');
        } catch (e) {}

        let candidateOAuthUser: UserData | null = null;

        // Parse payload if present
        const rawPayload = searchParams.get('payload');
        if (rawPayload) {
          try {
            const decoded = JSON.parse(safeBase64Decode(rawPayload));
            if (decoded && (decoded.username || decoded.sub || decoded.uid)) {
              candidateOAuthUser = {
                id: decoded.sub || decoded.uid || `user_${decoded.username}`,
                zenoa_id: decoded.zenoa_id || `${decoded.username}@zenoa`,
                username: (decoded.username || 'developer').replace(/^@/, ''),
                display_name: decoded.name || decoded.display_name || decoded.username,
                bio: decoded.bio || 'Zenoa Developer',
                avatar_seed: decoded.avatar_seed || decoded.username || 'developer',
                online: true,
                last_seen: 'Just now',
                email: decoded.email || '',
                mobile_number: decoded.phone_number || decoded.mobile_number || '',
                avatar_url: decoded.picture || decoded.avatar_url || '',
                is_verified: true,
                is_official: false
              };
            }
          } catch (e) {}
        }

        // Fallback: If code is present without payload, lookup auth code from Firestore oauth_codes
        if (!candidateOAuthUser && searchParams.has('code') && db) {
          const codeParam = searchParams.get('code')!;
          try {
            const codeSnap = await getDoc(doc(db, 'oauth_codes', codeParam));
            if (codeSnap.exists()) {
              const cData = codeSnap.data();
              if (cData && cData.user_data) {
                candidateOAuthUser = cData.user_data;
              }
            }
          } catch (codeErr) {
            console.warn('OAuth code lookup note:', codeErr);
          }
        }

        // Clean query parameters from address bar to keep URL clean
        window.history.replaceState({}, document.title, window.location.pathname);

        if (candidateOAuthUser) {
          // MANDATORY REAL-TIME DATABASE VALIDATION: Verify account exists and is not deleted in DB
          const res = await fetchFullUserProfile(candidateOAuthUser.username, candidateOAuthUser.id);
          if (!isMounted) return;

          if (res.status === 'not_found') {
            // Account was deleted in DB! DO NOT RE-CREATE! Purge and block!
            purgeAllUserSessions(`Account Security Violation: User account @${candidateOAuthUser.username} has been deleted from the database. Access denied.`);
            setLoading(false);
            return;
          }

          if (res.status === 'suspended') {
            // Account is deactivated or suspended in DB
            purgeAllUserSessions(`Account Security Violation: User account @${candidateOAuthUser.username} has been deactivated or suspended. Access denied.`);
            setLoading(false);
            return;
          }

          // Verified active user from database
          const activeUser = res.profile || candidateOAuthUser;
          localStorage.setItem('zenoa_dev_console_user', JSON.stringify(activeUser));
          setUser(activeUser);
          setView('portal');
          setLoading(false);
          return;
        }
      }

      // 2. Check existing local dev session if not logged out
      const isLoggedOut = sessionStorage.getItem('zenoa_dev_console_logged_out') === 'true';

      if (!isLoggedOut) {
        try {
          const storedDevUser = localStorage.getItem('zenoa_dev_console_user');
          if (storedDevUser) {
            const parsed = JSON.parse(storedDevUser);
            if (parsed && (parsed.username || parsed.id)) {
              // Real-time verification against DB before setting state
              const res = await fetchFullUserProfile(parsed.username || parsed.id, parsed.id);
              if (!isMounted) return;

              if (res.status === 'not_found') {
                // Deleted user found in local cache! Purge it immediately!
                purgeAllUserSessions(`Account Security Alert: Account @${parsed.username || parsed.id} no longer exists in the database. Session terminated.`);
                setLoading(false);
                return;
              }

              if (res.status === 'suspended') {
                purgeAllUserSessions(`Account Security Alert: Account @${parsed.username || parsed.id} has been deactivated or suspended. Session terminated.`);
                setLoading(false);
                return;
              }

              const verifiedUser = res.profile || parsed;
              setUser(verifiedUser);
              localStorage.setItem('zenoa_dev_console_user', JSON.stringify(verifiedUser));

              // Authenticated users go directly to developer portal/onboarding
              const isExplicitLanding = searchParams.get('view') === 'landing';
              if (isExplicitLanding) {
                setView('landing');
              } else {
                setView('portal');
              }
              setLoading(false);
              return;
            }
          }
        } catch (e) {}
      }

      // Default: Landing page is active
      setUser(null);
      setView('landing');
      setLoading(false);
    };

    resolveAuthHandshake();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      sessionStorage.removeItem('zenoa_dev_console_logged_out');
      const res = await fetchFullUserProfile(authenticatedUser.username, authenticatedUser.id);
      if (res.status === 'not_found' || res.status === 'suspended') {
        purgeAllUserSessions(`Account Security Violation: User account @${authenticatedUser.username} has been deleted or deactivated in the database. Access denied.`);
        return;
      }
      const userToUse = res.profile || authenticatedUser;
      setUser(userToUse);
      setView('portal');
    } catch (err) {
      sessionStorage.removeItem('zenoa_dev_console_logged_out');
      setUser(authenticatedUser);
      setView('portal');
    }
  };

  const redirectToAccountsAuth = () => {
    const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
    const isZenoaProdHost = host.endsWith('zenoa.in');
    let redirectUri = `${window.location.origin}/developer`;
    if (isZenoaProdHost) {
      if (host.includes('developer.zenoa.in')) {
        redirectUri = 'https://developer.zenoa.in/developer';
      }
    }

    const secureUrl = buildSecureOAuthUrl({
      clientId: 'zenoa_developer_console',
      redirectUri,
      scope: 'openid profile email phone developer_access',
      prompt: 'select_account'
    });
    window.location.href = secureUrl;
  };

  const handleLogout = () => {
    purgeAllUserSessions('You have successfully signed out of Developer Platform.');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 uppercase tracking-widest">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Developer Console Error">
      {view === 'landing' && (
        <LandingView 
          user={user} 
          onOpenConsole={() => {
            if (user) {
              setView('portal');
            } else {
              redirectToAccountsAuth();
            }
          }} 
          onShowAuth={redirectToAccountsAuth} 
          onSwitchAccount={handleLogout}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
          securityAlert={securityAlert}
          onDismissAlert={() => setSecurityAlert(null)}
        />
      )}
      
      {view === 'mobile_setup' && user && (
        <MobileSetupView 
          user={user} 
          onSuccess={(u) => { setUser(u); setView('portal'); }} 
          onSkip={() => setView('portal')} 
          themeMode={themeMode}
        />
      )}
      
      {view === 'portal' && user && (
        <PortalDashboard 
          currentUser={user} 
          onLogout={handleLogout} 
          onHome={() => setView('landing')}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
        />
      )}
    </ErrorBoundary>
  );
};
