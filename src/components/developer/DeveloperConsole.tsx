import React, { useState, useEffect } from 'react';
import { resolveAndApplyMetadata } from '../../seoUtils';
import { auth, db } from '../../firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_dev_theme') || localStorage.getItem('zenoa_theme_mode');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch (e) {}
    return 'light';
  });

  const toggleTheme = () => {
    const next = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(next);
    try {
      localStorage.setItem('zenoa_dev_theme', next);
    } catch (e) {}
  };

  const fetchFullUserProfile = async (searchIdent: string, uid?: string): Promise<{ profile: UserData | null; status: 'ok' | 'not_found' | 'suspended' }> => {
    if (!db) return { profile: null, status: 'ok' };
    try {
      let snap = null;
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists()) snap = uidSnap;
      }

      if (!snap) {
        const clean = searchIdent.trim().toLowerCase().replace(/^@/, '');
        const userDoc = await getDoc(doc(db, 'users', clean));
        if (userDoc.exists()) snap = userDoc;
      }

      if (!snap) {
        const clean = searchIdent.trim().toLowerCase().replace(/^@/, '');
        const usersRef = collection(db, 'users');
        const uq = query(usersRef, where('username', '==', clean));
        const uSnap = await getDocs(uq);
        if (!uSnap.empty) snap = uSnap.docs[0];
      }

      if (!snap || !snap.exists()) {
        return { profile: null, status: 'not_found' };
      }

      const data = snap.data();
      const isBlocked = 
        data.status === 'suspended' || 
        data.status === 'blocked' || 
        data.status === 'deactivated' || 
        data.is_deleted === true || 
        data.deactivated === true || 
        data.disabled === true ||
        data.is_suspended === true;

      if (isBlocked) {
        return { profile: null, status: 'suspended' };
      }

      return { profile: { id: snap.id, ...data } as UserData, status: 'ok' };
    } catch (err) {
      console.warn('Developer console user fetch error:', err);
      return { profile: null, status: 'ok' };
    }
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    // Check if returning from OAuth handshake with code / payload
    const searchParams = new URLSearchParams(window.location.search);
    const hasOAuthReturn = searchParams.has('code') || searchParams.has('payload');
    
    if (hasOAuthReturn) {
      try {
        sessionStorage.removeItem('zenoa_dev_console_logged_out');
      } catch (e) {}

      let resolvedOAuthUser: UserData | null = null;

      // If payload is present in query, parse it as instant fallback
      const rawPayload = searchParams.get('payload');
      if (rawPayload) {
        try {
          const decoded = JSON.parse(safeBase64Decode(rawPayload));
          if (decoded && (decoded.username || decoded.sub || decoded.uid)) {
            resolvedOAuthUser = {
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
            localStorage.setItem('zenoa_dev_console_user', JSON.stringify(resolvedOAuthUser));
            localStorage.setItem('zenoa_user', JSON.stringify(resolvedOAuthUser));
          }
        } catch (e) {}
      }

      if (!resolvedOAuthUser) {
        try {
          const raw = localStorage.getItem('zenoa_dev_console_user') || localStorage.getItem('zenoa_user');
          if (raw) resolvedOAuthUser = JSON.parse(raw);
        } catch (e) {}
      }

      // Clean query parameters from address bar
      window.history.replaceState({}, document.title, window.location.pathname);

      if (resolvedOAuthUser) {
        setUser(resolvedOAuthUser);
        setView('portal');
        setLoading(false);
        // Refresh profile in background
        fetchFullUserProfile(resolvedOAuthUser.username, resolvedOAuthUser.id).then(res => {
          if (!isMounted) return;
          if (res.status === 'not_found' || res.status === 'suspended') {
            localStorage.removeItem('zenoa_dev_console_user');
            localStorage.removeItem('zenoa_user');
            setUser(null);
            setView('landing');
          } else if (res.profile) {
            setUser(res.profile);
          }
        }).catch(() => {});
        return;
      }
    }

    // Mandatory login check: If user explicitly logged out in this session and NOT returning from fresh OAuth
    const isLoggedOut = !hasOAuthReturn && sessionStorage.getItem('zenoa_dev_console_logged_out') === 'true';

    // 1. Check if user already authorized via Zenoa OAuth / SSO session
    if (!isLoggedOut) {
      try {
        const storedDevUser = localStorage.getItem('zenoa_dev_console_user') || localStorage.getItem('zenoa_user');
        if (storedDevUser) {
          const parsed = JSON.parse(storedDevUser);
          if (parsed && (parsed.username || parsed.id)) {
            // Instantly render portal synchronously
            setUser(parsed);
            setView('portal');
            setLoading(false);

            // Fetch any updated attributes asynchronously without blocking
            fetchFullUserProfile(parsed.username || parsed.id, parsed.id).then(res => {
              if (!isMounted) return;
              if (res.status === 'not_found' || res.status === 'suspended') {
                localStorage.removeItem('zenoa_dev_console_user');
                localStorage.removeItem('zenoa_user');
                setUser(null);
                setView('landing');
              } else if (res.profile) {
                setUser(res.profile);
              }
            }).catch(() => {});
            return;
          }
        }
      } catch (e) {}
    }

    if (!isLoggedOut && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;
        if (fbUser) {
          const res = await fetchFullUserProfile(fbUser.email || fbUser.uid, fbUser.uid);
          if (res.profile && isMounted) {
            setUser(res.profile);
            setView('portal');
            setLoading(false);
            return;
          }
        }

        if (isMounted) setLoading(false);
      });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const handleAuthenticatedWithZenoa = async (authenticatedUser: UserData) => {
    try {
      sessionStorage.removeItem('zenoa_dev_console_logged_out');
      const res = await fetchFullUserProfile(authenticatedUser.username, authenticatedUser.id);
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
    const isZenoaProdHost = host.endsWith('zenoa.in') || host.endsWith('zenoa.sbs');
    let redirectUri = `${window.location.origin}/developer`;
    if (isZenoaProdHost) {
      if (host.includes('developer.zenoa.sbs')) {
        redirectUri = 'https://developer.zenoa.sbs/developer';
      } else if (host.includes('developer.zenoa.in')) {
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
    try {
      localStorage.removeItem('zenoa_dev_console_user');
      sessionStorage.setItem('zenoa_dev_console_logged_out', 'true');
    } catch (e) {}
    setUser(null);
    setView('landing');
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
          onOpenConsole={() => setView('portal')} 
          onShowAuth={redirectToAccountsAuth} 
          onSwitchAccount={handleLogout}
          themeMode={themeMode}
          onToggleTheme={toggleTheme}
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
