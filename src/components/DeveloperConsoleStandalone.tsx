import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseClient';
import { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DeveloperPortal } from './DeveloperPortal';
import { UserData } from '../types';
import { Terminal, Lock, Phone, User, ArrowRight, ShieldCheck, Zap, Chrome } from 'lucide-react';
import { motion } from 'motion/react';

export const DeveloperConsoleStandalone: React.FC = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [authMode, setAuthMode] = useState<'login' | 'mobile_setup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [mobile, setMobile] = useState('');
    const [error, setError] = useState('');
    const [isLinking, setIsLinking] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // Try to find user by display name (username) or email
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
                        if (!userData.mobile_number) {
                            setAuthMode('mobile_setup');
                        } else {
                            setAuthMode('login');
                        }
                    } else {
                        setUser(null);
                        setAuthMode('login');
                        setError('No Zenoa profile found for this account. Please sign up on the main app first.');
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setUser(null);
                    setAuthMode('login');
                }
            } else {
                setUser(null);
                setAuthMode('login');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(auth, provider);
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLinkMobile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !mobile) return;
        setIsLinking(true);
        setError('');
        try {
            await updateDoc(doc(db, 'users', user.username), {
                mobile_number: mobile
            });
            setUser({ ...user, mobile_number: mobile });
            setAuthMode('login'); 
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLinking(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-16 w-16 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-4">
                            <Terminal className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center">Business Developer Portal</h1>
                        <p className="text-slate-500 text-sm text-center mt-2">Sign in with your Zenoa account to manage bots</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                    placeholder="name@example.com"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                                {error}
                            </p>
                        )}

                        <button 
                            type="submit" 
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <span>Authenticate Access</span>
                            <ArrowRight className="h-5 w-5" />
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white dark:bg-slate-900 px-3 font-bold text-slate-400 tracking-widest">Or continue with</span>
                            </div>
                        </div>

                        <button 
                            type="button"
                            onClick={handleGoogleLogin}
                            className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold py-4 rounded-2xl shadow-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all active:scale-95 flex items-center justify-center gap-3 cursor-pointer"
                        >
                            <Chrome className="h-5 w-5 text-indigo-500" />
                            <span>Sign in with Google</span>
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    if (authMode === 'mobile_setup') {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 p-8"
                >
                    <div className="flex flex-col items-center mb-8">
                        <div className="h-16 w-16 bg-emerald-500 rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-4">
                            <Phone className="h-8 w-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white text-center">Link Business Number</h1>
                        <p className="text-slate-500 text-sm text-center mt-2">Associated mobile number for business operations</p>
                    </div>

                    <form onSubmit={handleLinkMobile} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Mobile Number</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">+91</span>
                                <input 
                                    type="tel" 
                                    value={mobile}
                                    onChange={e => setMobile(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl pl-14 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                                    placeholder="9876543210"
                                    required
                                />
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                            <div className="flex gap-3">
                                <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                    This number will be linked to your profile as a **Business Account**. OTPs for developer access will be routed through this identity.
                                </p>
                            </div>
                        </div>

                        {error && (
                            <p className="text-rose-500 text-xs font-bold bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30 text-center">
                                {error}
                            </p>
                        )}

                        <button 
                            type="submit" 
                            disabled={isLinking}
                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {isLinking ? 'Linking identity...' : 'Complete Business Setup'}
                            <Zap className="h-5 w-5" />
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            <DeveloperPortal 
                currentUser={user} 
                onBack={() => {
                    window.location.href = '/';
                }} 
            />
        </div>
    );
};
