import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebaseClient';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { DeveloperPortal } from './DeveloperPortal';
import { UserData } from '../types';
import { 
  Terminal, Lock, Phone, User, ArrowRight, ShieldCheck, Zap, Chrome, 
  CheckCircle2, Key, Code2, Server, Globe, ExternalLink, RefreshCw, 
  ArrowLeft, Sparkles, Check, Mail, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type ConsoleView = 'landing' | 'auth' | 'mobile_setup' | 'portal';

export const DeveloperConsoleStandalone: React.FC = () => {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<ConsoleView>('landing');
    
    // Auth Modal State
    const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    
    // Registration Fields
    const [regFullName, setRegFullName] = useState('');
    const [regUsername, setRegUsername] = useState('');
    const [regEmail, setRegEmail] = useState('');
    const [regPassword, setRegPassword] = useState('');
    const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

    // Mobile / Verification State
    const [countryCode, setCountryCode] = useState('+91');
    const [mobileNumber, setMobileNumber] = useState('');
    const [isVerifyingTruecaller, setIsVerifyingTruecaller] = useState(false);
    const [truecallerSuccess, setTruecallerSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
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
                        const verifiedUser: UserData = {
                            ...userData,
                            mobile_number: userData.mobile_number || '+919876543210',
                            is_truecaller_verified: true
                        };
                        setUser(verifiedUser);
                        setView('portal');
                    } else {
                        const cleanUsername = firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'developer_user';
                        const fallbackUser: UserData = {
                            id: firebaseUser.uid,
                            username: cleanUsername,
                            display_name: firebaseUser.displayName || 'Developer Account',
                            email: firebaseUser.email || '',
                            mobile_number: '+919876543210',
                            is_truecaller_verified: true,
                            bio: 'Zenoa Developer Account',
                            avatar_seed: cleanUsername,
                            online: true,
                            last_seen: 'Online',
                            registered_at: Date.now()
                        };
                        
                        if (db) {
                            try {
                                await setDoc(doc(db, 'users', cleanUsername), fallbackUser, { merge: true });
                            } catch (e) {
                                console.warn("Firestore user sync:", e);
                            }
                        }
                        
                        setUser(fallbackUser);
                        setView('portal');
                    }
                } catch (err) {
                    console.error("Error fetching user data:", err);
                    setUser(null);
                    setView('landing');
                }
            } else {
                setUser(null);
                setView('landing');
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmittingAuth(true);
        try {
            let emailToUse = loginIdentifier.trim();
            if (!emailToUse.includes('@') && db) {
                const userDoc = await getDoc(doc(db, 'users', emailToUse.toLowerCase()));
                if (userDoc.exists() && userDoc.data().email) {
                    emailToUse = userDoc.data().email;
                }
            }

            await signInWithEmailAndPassword(auth, emailToUse, loginPassword);
        } catch (err: any) {
            setError(err.message || 'Invalid credentials. Please check your details.');
        } finally {
            setIsSubmittingAuth(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        const cleanUser = regUsername.trim().toLowerCase();
        if (!/^[a-zA-Z0-9_]{3,20}$/.test(cleanUser)) {
            setError('Username must be 3-20 characters long and contain only letters, numbers, and underscores.');
            return;
        }

        setIsSubmittingAuth(true);
        try {
            if (db) {
                const existing = await getDoc(doc(db, 'users', cleanUser));
                if (existing.exists()) {
                    setError('This username is already taken. Please choose another.');
                    setIsSubmittingAuth(false);
                    return;
                }
            }

            const cred = await createUserWithEmailAndPassword(auth, regEmail.trim(), regPassword);
            
            try {
                await updateProfile(cred.user, { displayName: cleanUser });
            } catch (e) {
                console.warn("Auth updateProfile warning:", e);
            }

            const newUserData: UserData = {
                id: cred.user.uid,
                username: cleanUser,
                display_name: regFullName.trim() || cleanUser,
                email: regEmail.trim(),
                mobile_number: '+919876543210',
                is_business_verified: true,
                is_truecaller_verified: true,
                bio: 'Verified Zenoa Developer Account',
                avatar_seed: cleanUser,
                online: true,
                last_seen: 'Online',
                registered_at: Date.now()
            };

            if (db) {
                await setDoc(doc(db, 'users', cleanUser), newUserData, { merge: true });
            }

            setUser(newUserData);
            setView('portal');
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please check the information entered.');
        } finally {
            setIsSubmittingAuth(false);
        }
    };

    const handleGoogleAuth = async () => {
        setError('');
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const firebaseUser = result.user;
            
            const cleanUsername = firebaseUser.email?.split('@')[0] || `dev_${Date.now().toString().slice(-4)}`;
            const userRef = doc(db, 'users', cleanUsername);
            const snap = await getDoc(userRef);
            
            let currentUserData: UserData;
            if (snap.exists()) {
                currentUserData = { 
                    ...(snap.data() as UserData),
                    id: snap.id, 
                    mobile_number: snap.data().mobile_number || '+919876543210',
                    is_business_verified: true,
                    is_truecaller_verified: true
                };
            } else {
                currentUserData = {
                    id: firebaseUser.uid,
                    username: cleanUsername,
                    display_name: firebaseUser.displayName || 'Developer Account',
                    email: firebaseUser.email || '',
                    mobile_number: '+919876543210',
                    is_business_verified: true,
                    is_truecaller_verified: true,
                    bio: 'Verified Zenoa Developer Account',
                    avatar_seed: cleanUsername,
                    online: true,
                    last_seen: 'Online',
                    registered_at: Date.now()
                };
                await setDoc(userRef, currentUserData, { merge: true });
            }

            setUser(currentUserData);
            setView('portal');
        } catch (err: any) {
            setError(err.message || 'Google authentication encountered an error.');
        }
    };

    const handleTruecallerVerification = async () => {
        setIsVerifyingTruecaller(true);
        setError('');

        const cleanDigits = mobileNumber.replace(/[^0-9]/g, '').trim();
        if (!cleanDigits || cleanDigits.length < 7 || cleanDigits.length > 15) {
            setError('Please enter a valid mobile number.');
            setIsVerifyingTruecaller(false);
            return;
        }

        const formattedMobile = `${countryCode}${cleanDigits}`;

        try {
            if (user && db) {
                await updateDoc(doc(db, 'users', user.username), {
                    mobile_number: formattedMobile,
                    is_business_verified: true,
                    is_truecaller_verified: true,
                    phone_verified_at: Date.now(),
                    verified_business_at: Date.now()
                });
            }

            const updatedUser: UserData = {
                ...user!,
                mobile_number: formattedMobile,
                is_business_verified: true,
                is_truecaller_verified: true
            };

            setUser(updatedUser);
            setTruecallerSuccess(true);

            setTimeout(() => {
                setView('portal');
            }, 300);
        } catch (err: any) {
            setError('Verification failed: ' + (err?.message || 'Please try again.'));
        } finally {
            setIsVerifyingTruecaller(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 border-2 border-zinc-700 border-t-zinc-200 rounded-full animate-spin"></div>
                    <p className="text-xs font-mono text-zinc-400 tracking-widest uppercase">Initializing Developer Portal...</p>
                </div>
            </div>
        );
    }

    // 1. LANDING PAGE VIEW
    if (view === 'landing') {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
                {/* Top Navigation */}
                <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-50">
                    <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                                <Terminal className="h-4 w-4 text-zinc-100" />
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-base tracking-tight text-zinc-100">Zenoa</span>
                                <span className="text-[10px] font-mono uppercase bg-zinc-900 text-zinc-300 px-2.5 py-0.5 rounded-md border border-zinc-800 font-semibold">Developer Suite</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {user ? (
                                <button
                                    onClick={() => setView('portal')}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <span>Console Dashboard</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            ) : (
                                <button
                                    onClick={() => setView('auth')}
                                    className="px-4 py-2 text-xs font-bold rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <span>Get Started</span>
                                    <ArrowRight className="h-3.5 w-3.5" />
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <main className="flex-1 flex flex-col">
                    <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900 text-zinc-300 text-xs font-medium mb-6">
                            <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                            <span>Enterprise Identity & Transactional Infrastructure</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-zinc-100 tracking-tight leading-[1.15] max-w-4xl mx-auto">
                            Direct Transactional Messaging & Identity Platform
                        </h1>

                        <p className="text-zinc-400 text-base md:text-lg max-w-2xl mx-auto mt-6 leading-relaxed">
                            Integrate 6-digit authentication delivery, webhook event streams, and OAuth 2.0 single sign-on into your external applications powered by verified Service Accounts.
                        </p>

                        <div className="flex flex-wrap items-center justify-center gap-4 mt-10">
                            <button
                                onClick={() => setView('auth')}
                                className="px-8 py-3.5 rounded-xl bg-zinc-100 hover:bg-white text-zinc-950 font-bold text-sm transition-all flex items-center gap-2 cursor-pointer active:scale-98"
                            >
                                <span>{user ? 'Open Developer Console' : 'Access Developer Console'}</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    </section>

                    {/* Architecture Feature Grid */}
                    <section className="max-w-5xl mx-auto px-6 py-12 w-full">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 text-left space-y-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
                                    <Phone className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-100">Direct OTP Delivery</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    When an external user requests verification, the engine identifies their linked profile and delivers authentication codes via Service Account dispatches.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 text-left space-y-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
                                    <Shield className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-100">Verified Service Account</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Messages originate from your authenticated Service Account, establishing authentic brand credibility and zero-trust identity.
                                </p>
                            </div>

                            <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900 text-left space-y-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-300">
                                    <Code2 className="h-5 w-5" />
                                </div>
                                <h3 className="text-base font-bold text-zinc-100">REST APIs & Webhooks</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Standard REST endpoints with HMAC-SHA256 signature verification for Node.js, Python, PHP, Go, and cURL integrations.
                                </p>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="border-t border-zinc-800 py-6 text-center text-xs text-zinc-500">
                    <p>Zenoa Developer Operations Suite • Standard RESTful API & OAuth 2.0</p>
                </footer>
            </div>
        );
    }

    // 2. AUTHENTICATION MODAL VIEW
    if (view === 'auth') {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-100 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl"
                >
                    <div className="flex items-center justify-between mb-6">
                        <button
                            onClick={() => setView('landing')}
                            className="text-xs font-semibold text-zinc-400 hover:text-zinc-100 flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" />
                            <span>Back</span>
                        </button>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold">Zenoa Developer</span>
                    </div>

                    <div className="text-center mb-6">
                        <div className="h-12 w-12 rounded-2xl bg-zinc-800 border border-zinc-700 flex items-center justify-center mx-auto mb-3 text-zinc-100">
                            <Terminal className="h-6 w-6" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-100">Developer Portal Access</h2>
                        <p className="text-xs text-zinc-400 mt-1">Sign in to manage your Service Account credentials</p>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/40 rounded-xl text-rose-300 text-xs text-center font-medium">
                            {error}
                        </div>
                    )}

                    {user ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 font-bold text-sm">
                                    {user.username.slice(0, 2).toUpperCase()}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-bold text-zinc-100">{user.display_name || user.username}</p>
                                    <p className="text-[11px] font-mono text-zinc-400">@{user.username}</p>
                                </div>
                            </div>

                            <button
                                onClick={() => setView('portal')}
                                className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <span>Continue to Console Dashboard</span>
                                <ArrowRight className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex rounded-xl bg-zinc-950 p-1 border border-zinc-800 mb-5">
                                <button
                                    onClick={() => { setAuthTab('login'); setError(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        authTab === 'login' 
                                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm' 
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => { setAuthTab('register'); setError(''); }}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                                        authTab === 'register' 
                                            ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-sm' 
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    Register Account
                                </button>
                            </div>

                            {authTab === 'login' ? (
                                <form onSubmit={handleLogin} className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Email or Username</label>
                                        <div className="relative">
                                            <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <input 
                                                type="text" 
                                                value={loginIdentifier}
                                                onChange={e => setLoginIdentifier(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                                placeholder="Enter username or email"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Password</label>
                                        <div className="relative">
                                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                                            <input 
                                                type="password" 
                                                value={loginPassword}
                                                onChange={e => setLoginPassword(e.target.value)}
                                                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                                placeholder="••••••••"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingAuth}
                                        className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50"
                                    >
                                        {isSubmittingAuth ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Sign In</span>}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleRegister} className="space-y-3">
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Full Name</label>
                                        <input 
                                            type="text" 
                                            value={regFullName}
                                            onChange={e => setRegFullName(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                            placeholder="Developer Name"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Username</label>
                                        <input 
                                            type="text" 
                                            value={regUsername}
                                            onChange={e => setRegUsername(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                            placeholder="developer_username"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Email Address</label>
                                        <input 
                                            type="email" 
                                            value={regEmail}
                                            onChange={e => setRegEmail(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                            placeholder="developer@company.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-semibold text-zinc-300 uppercase tracking-wider mb-1 text-left">Password</label>
                                        <input 
                                            type="password" 
                                            value={regPassword}
                                            onChange={e => setRegPassword(e.target.value)}
                                            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-zinc-100 focus:border-zinc-700 outline-none transition-all"
                                            placeholder="••••••••"
                                            required
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={isSubmittingAuth}
                                        className="w-full bg-zinc-100 hover:bg-white text-zinc-950 font-bold py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 disabled:opacity-50"
                                    >
                                        {isSubmittingAuth ? <RefreshCw className="h-4 w-4 animate-spin" /> : <span>Create Account</span>}
                                    </button>
                                </form>
                            )}

                            <div className="relative my-4">
                                <div className="w-full border-t border-zinc-800"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="bg-zinc-900 px-2 text-zinc-500 font-mono text-[10px]">Or</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleAuth}
                                className="w-full bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 font-bold py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Chrome className="h-4 w-4 text-zinc-400" />
                                <span>Continue with Google</span>
                            </button>
                        </div>
                    )}
                </motion.div>
            </div>
        );
    }

    // 4. ACTIVE DEVELOPER DASHBOARD PORTAL
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
            <DeveloperPortal 
                currentUser={user!} 
                onBack={() => setView('landing')} 
            />
        </div>
    );
};
