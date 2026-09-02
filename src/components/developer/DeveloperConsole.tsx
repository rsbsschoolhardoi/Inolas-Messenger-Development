import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { UserData } from '../../types';
import { LandingView } from './views/LandingView';
import { MobileSetupView } from './views/MobileSetupView';
import { PortalDashboard } from './views/PortalDashboard';
import { ZenoaAuthGatewayModal } from '../ZenoaAuthGatewayModal';

type ConsoleView = 'landing' | 'mobile_setup' | 'portal';

export const DeveloperConsoleStandalone: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ConsoleView>('landing');
  const [showZenoaAuthModal, setShowZenoaAuthModal] = useState(false);

  const fetchFullUserProfile = async (searchIdent: string, uid?: string): Promise<UserData | null> => {
    if (!db) return null;
    try {
      if (uid) {
        const uidSnap = await getDoc(doc(db, 'users', uid));
        if (uidSnap.exists() && uidSnap.data()?.username) {
          return { id: uidSnap.id, ...uidSnap.data() } as UserData;
        }
      }

      const clean = searchIdent.trim().toLowerCase();
      const userDoc = await getDoc(doc(db, 'users', clean));
      if (userDoc.exists() && userDoc.data()?.username) {
        return { id: userDoc.id, ...userDoc.data() } as UserData;
      }

      const usersRef = collection(db, 'users');
      const uq = query(usersRef, where('username', '==', clean));
      const uSnap = await getDocs(uq);
      if (!uSnap.empty) {
        return { id: uSnap.docs[0].id, ...uSnap.docs[0].data() } as UserData;
      }
    } catch (err) {
      console.warn('Developer console user fetch error:', err);
    }
    return null;
  };

  useEffect(() => {
    let isMounted = true;
    let unsubscribe = () => {};

    // Mandatory login check: If user previously logged out, do not auto-restore session
    const isLoggedOut = sessionStorage.getItem('zenoa_dev_console_logged_out') === 'true';

    if (!isLoggedOut && auth) {
      unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
        if (!isMounted) return;
        if (fbUser) {
          const profile = await fetchFullUserProfile(fbUser.email || fbUser.uid, fbUser.uid);
          if (profile && isMounted) {
            setUser(profile);
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
      const fresh = await fetchFullUserProfile(authenticatedUser.username, authenticatedUser.id);
      const userToUse = fresh || authenticatedUser;
      setUser(userToUse);
      setView('portal');
    } catch (err) {
      sessionStorage.removeItem('zenoa_dev_console_logged_out');
      setUser(authenticatedUser);
      setView('portal');
    }
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
    <>
      {view === 'landing' && (
        <LandingView 
          user={user} 
          onOpenConsole={() => setView('portal')} 
          onShowAuth={() => setShowZenoaAuthModal(true)} 
          onSwitchAccount={handleLogout} 
        />
      )}
      
      {view === 'mobile_setup' && user && (
        <MobileSetupView 
          user={user} 
          onSuccess={(u) => { setUser(u); setView('portal'); }} 
          onSkip={() => setView('portal')} 
        />
      )}
      
      {view === 'portal' && user && (
        <PortalDashboard 
          currentUser={user} 
          onLogout={handleLogout} 
          onHome={() => setView('landing')} 
        />
      )}
      
      <ZenoaAuthGatewayModal
        isOpen={showZenoaAuthModal}
        onClose={() => setShowZenoaAuthModal(false)}
        serviceTitle="Developer Console"
        serviceDescription="Manage developer applications, bots, and API credentials."
        onAuthenticated={handleAuthenticatedWithZenoa}
        themeMode="light"
        disableSavedAccounts={true}
      />
    </>
  );
};
