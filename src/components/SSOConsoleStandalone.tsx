import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseClient';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { UserData } from '../types';
import { Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

export const SSOConsoleStandalone: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Check theme preference
    const savedTheme = localStorage.getItem('zenoa_theme_mode');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setThemeMode(savedTheme);
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          let userData: UserData | null = null;
          
          if (firebaseUser.displayName) {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.displayName));
            if (userDoc.exists()) {
              userData = { id: userDoc.id, ...userDoc.data() } as UserData;
            }
          }

          if (!userData && firebaseUser.email) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', firebaseUser.email));
            const snap = await getDocs(q);
            if (!snap.empty) {
              userData = { id: snap.docs[0].id, ...snap.docs[0].data() } as UserData;
            }
          }

          if (userData) {
            setUser(userData);
          } else {
            // Create a session user object from firebase auth info
            setUser({
              id: firebaseUser.uid,
              username: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'developer'),
              display_name: firebaseUser.displayName || 'Developer',
              email: firebaseUser.email || '',
              bio: 'Zenoa Developer',
              avatar_seed: firebaseUser.uid.substring(0, 8),
              online: true,
              last_seen: 'Online'
            });
          }
        } catch (err) {
          console.error('Error fetching user data in SSO Console:', err);
        }
      } else {
        // Check localStorage for demo/stored user session
        const storedUser = localStorage.getItem('zenoa_user_session');
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            setUser(null);
          }
        } else {
          // Allow guest/developer exploration or direct access
          setUser({
            id: 'dev_guest_user',
            username: 'developer_guest',
            display_name: 'Developer Guest',
            email: 'developer@example.com',
            bio: 'Guest Developer',
            avatar_seed: 'guest_dev',
            online: true,
            last_seen: 'Online'
          });
        }
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-6 text-white font-sans">
        <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mb-4">
          <RefreshCw className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-base font-bold">Initializing Zenoa SSO Console...</h2>
        <p className="text-xs text-neutral-400 mt-1">Connecting to OAuth 2.0 Client Registry</p>
      </div>
    );
  }

  return (
    <SSOPortal
      themeMode={themeMode}
      currentUser={user}
      onBack={() => {
        window.location.href = '/';
      }}
    />
  );
};
