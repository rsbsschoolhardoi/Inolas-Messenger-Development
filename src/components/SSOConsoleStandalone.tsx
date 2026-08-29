import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseClient';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  updateProfile 
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { SSOPortal } from './SSOPortal';
import { UserData } from '../types';
import { Shield, ArrowRight, Lock, Key, Sparkles, RefreshCw, User, Mail, Terminal, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export const SSOConsoleStandalone: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  
  // Auth Form State
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [fullNameInput, setFullNameInput] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

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
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      let emailToUse = emailInput.trim();
      if (!emailToUse.includes('@') && db) {
        const userDoc = await getDoc(doc(db, 'users', emailToUse.toLowerCase()));
        if (userDoc.exists() && userDoc.data().email) {
          emailToUse = userDoc.data().email;
        }
      }
      await signInWithEmailAndPassword(auth, emailToUse, passwordInput);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please check credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUser = usernameInput.trim().toLowerCase();
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUser)) {
      setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (db) {
        const existing = await getDoc(doc(db, 'users', cleanUser));
        if (existing.exists()) {
          setError('Username is already taken.');
          setIsSubmitting(false);
          return;
        }
      }

      const cred = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
      try {
        await updateProfile(cred.user, { displayName: cleanUser });
      } catch (e) {}

      const newUserData: UserData = {
        id: cred.user.uid,
        username: cleanUser,
        display_name: fullNameInput.trim() || cleanUser,
        email: emailInput.trim(),
        bio: 'Verified Zenoa SSO Developer',
        avatar_seed: cleanUser,
        online: true,
        last_seen: 'Online',
        registered_at: Date.now()
      };

      if (db) {
        await setDoc(doc(db, 'users', cleanUser), newUserData, { merge: true });
      }
      setUser(newUserData);
    } catch (err: any) {
      setError(err?.message || 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // FORCE MANDATORY LOGIN FOR SSO DEVELOPER PORTAL
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl"
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => { window.location.href = '/'; }}
              className="text-xs font-semibold text-neutral-400 hover:text-neutral-100 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Messenger</span>
            </button>
            <span className="text-[10px] font-mono uppercase bg-neutral-800 text-sky-400 px-2.5 py-0.5 rounded border border-neutral-700 font-bold">SSO Console</span>
          </div>

          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-2xl bg-sky-950/50 text-sky-400 border border-sky-800/50 flex items-center justify-center mx-auto mb-3">
              <Shield className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold text-neutral-100">Zenoa SSO & OAuth 2.0</h2>
            <p className="text-xs text-neutral-400 mt-1">Sign in with your Zenoa Developer Account to register client applications.</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs text-center font-medium">
              {error}
            </div>
          )}

          <div className="flex rounded-xl bg-neutral-950 p-1 border border-neutral-800 mb-5">
            <button
              onClick={() => { setAuthTab('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authTab === 'login' 
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setAuthTab('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authTab === 'register' 
                  ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm' 
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              Create Account
            </button>
          </div>

          {authTab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Email or Username</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input 
                    type="text" 
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                    placeholder="Username or email"
                    required
                  />
                </div>
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Sign In to SSO Console</span>}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={fullNameInput}
                  onChange={e => setFullNameInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                  placeholder="Developer Name"
                  required
                />
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Username</label>
                <input 
                  type="text" 
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                  placeholder="dev_username"
                  required
                />
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Email Address</label>
                <input 
                  type="email" 
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                  placeholder="developer@company.com"
                  required
                />
              </div>
              <div className="text-left">
                <label className="block text-[11px] font-semibold text-neutral-300 uppercase tracking-wider mb-1">Password</label>
                <input 
                  type="password" 
                  value={passwordInput}
                  onChange={e => setPasswordInput(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-neutral-100 focus:border-neutral-700 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
              >
                {isSubmitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Create SSO Account</span>}
              </button>
            </form>
          )}
        </motion.div>
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
