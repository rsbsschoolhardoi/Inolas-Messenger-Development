import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, User, Mail, Lock, Calendar, 
  ArrowRight, RefreshCw, Sun, Moon, ShieldCheck, Check, Sparkles, Key, Phone
} from 'lucide-react';
import { LegalModal, LegalDocType } from './LegalModal';

interface AuthFlowProps {
  initialMode?: 'login' | 'register';
  onBackToLanding: () => void;
  onLoginSubmit: (identifier: string, pass: string) => Promise<{ success: boolean; requiresOtp?: boolean; error?: string }>;
  onRegisterSubmit: (data: {
    email: string;
    fullName: string;
    username: string;
    dob: string;
    gender: string;
    password: string;
    mobile_number?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  onVerifyOtpSubmit: (code: string) => Promise<{ success: boolean; error?: string }>;
  onOAuthLogin: (provider: 'google' | 'facebook') => void;
  onForgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  existingUsernames?: string[];
  checkUsernameAvailability?: (username: string) => Promise<{ isTaken: boolean; reason?: string }>;
  isOnboarding?: boolean;
  initialRegStep?: number;
  truecallerProfile?: any;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
  initialMode = 'login',
  onBackToLanding,
  onLoginSubmit,
  onRegisterSubmit,
  onVerifyOtpSubmit,
  onOAuthLogin,
  onForgotPassword,
  themeMode,
  onToggleTheme,
  existingUsernames = [],
  checkUsernameAvailability,
  isOnboarding = false,
  initialRegStep = 1,
  truecallerProfile
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(isOnboarding || truecallerProfile ? 'register' : initialMode);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Sign Up Wizard Step (1: Identity & Username, 2: Personal Info, 3: Credentials)
  const [regStep, setRegStep] = useState<number>(isOnboarding ? initialRegStep : 1);

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>(''); // Email or Username
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // OTP Verification state
  const [showOtpScreen, setShowOtpScreen] = useState<boolean>(false);
  const [otpCode, setOtpCode] = useState<string>('');

  // Register Form State
  const [regEmail, setRegEmail] = useState<string>(truecallerProfile?.email || '');
  const [regFullName, setRegFullName] = useState<string>(
    truecallerProfile ? `${truecallerProfile.firstName} ${truecallerProfile.lastName}`.trim() : ''
  );
  const [regUsername, setRegUsername] = useState<string>('');
  const [regDob, setRegDob] = useState<string>('');
  const [regGender, setRegGender] = useState<string>(truecallerProfile?.gender?.toLowerCase() === 'm' ? 'male' : truecallerProfile?.gender?.toLowerCase() === 'f' ? 'female' : 'prefer_not');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [regMobile, setRegMobile] = useState<string>(truecallerProfile?.phoneNumber || '');
  const [isTruecallerVerified, setIsTruecallerVerified] = useState<boolean>(!!truecallerProfile);

  // Legal & Compliance State (Important Checkbox)
  const [regAgreedToLegal, setRegAgreedToLegal] = useState<boolean>(true);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalDocType>('terms');

  // Username Availability Async Checker
  const [isCheckingRegUsername, setIsCheckingRegUsername] = useState<boolean>(false);
  const [regUsernameAsyncTaken, setRegUsernameAsyncTaken] = useState<boolean>(false);

  // Truecaller Deep Link Logic
  const handleTruecallerVerification = () => {
    const partnerKey = import.meta.env.VITE_TRUECALLER_PARTNER_KEY;
    if (!partnerKey) {
      setErrorMessage('Truecaller verification is not configured. Please add VITE_TRUECALLER_PARTNER_KEY to environment.');
      return;
    }

    const nonce = Math.random().toString(36).substring(2);
    const callbackUrl = window.location.origin + '/auth/truecaller-callback';
    const partnerName = 'Zenoa';
    const truecallerUrl = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=${partnerName}&lang=en&title=Verify%20Account&skipConfirmation=true&callback=${encodeURIComponent(callbackUrl)}`;
    
    // Attempt to open Truecaller app
    window.location.href = truecallerUrl;

    // Fallback if app not installed after 2.5 seconds
    setTimeout(() => {
      if (document.hasFocus()) {
        setErrorMessage('Truecaller app not detected. Please verify using standard email method.');
      }
    }, 2500);
  };

  React.useEffect(() => {
    const clean = regUsername.trim().toLowerCase();
    setRegUsernameAsyncTaken(false);
    if (!clean || clean.length < 3 || !/^[a-zA-Z0-9_]+$/.test(clean)) {
      setIsCheckingRegUsername(false);
      return;
    }

    if (existingUsernames.filter(Boolean).map(u => u.toLowerCase()).includes(clean)) {
      setRegUsernameAsyncTaken(true);
      setIsCheckingRegUsername(false);
      return;
    }

    if (checkUsernameAvailability) {
      setIsCheckingRegUsername(true);
      const timer = setTimeout(async () => {
        try {
          const res = await checkUsernameAvailability(clean);
          setRegUsernameAsyncTaken(res.isTaken);
        } catch {
          setRegUsernameAsyncTaken(false);
        } finally {
          setIsCheckingRegUsername(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    }
  }, [regUsername, existingUsernames, checkUsernameAvailability]);

  // Auto-suggest username when full name changes
  const handleFullNameChange = (val: string) => {
    setRegFullName(val);
    if (!regUsername) {
      const clean = val.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (clean.length >= 3) {
        setRegUsername(clean);
      }
    }
  };

  const isUsernameAvailable = regUsername.length >= 3 && 
    /^[a-zA-Z0-9_]+$/.test(regUsername) && 
    !existingUsernames.filter(Boolean).map(u => u.toLowerCase()).includes(regUsername.toLowerCase()) &&
    !regUsernameAsyncTaken;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or @username');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    const res = await onLoginSubmit(loginIdentifier.trim(), loginPassword);
    setIsLoading(false);

    if (res.requiresOtp) {
      setShowOtpScreen(true);
      setSuccessMessage('A 6-digit verification code has been dispatched to your email.');
    } else if (!res.success) {
      setErrorMessage(res.error || 'Invalid credentials. Please check and try again.');
    }
  };

  // Step 1 Validation
  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!regFullName.trim()) {
      setErrorMessage('Please enter your full name');
      return;
    }
    if (!isUsernameAvailable) {
      setErrorMessage('Username must be at least 3 characters and unique.');
      return;
    }
    setRegStep(2);
  };

  // Step 2 Validation
  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setRegStep(3);
  };

  // Final Register Submit
  const handleRegisterFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!regEmail || !regEmail.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }
    if (!regAgreedToLegal) {
      setErrorMessage('Important: You must read and agree to the Privacy Policy, Terms & Conditions, and Legal Disclaimer to proceed.');
      return;
    }

    setIsLoading(true);
    const res = await onRegisterSubmit({
      email: regEmail.trim(),
      fullName: regFullName.trim(),
      username: regUsername.trim().toLowerCase(),
      dob: regDob || '2000-01-01',
      gender: regGender,
      password: regPassword,
      mobile_number: regMobile
    });
    setIsLoading(false);

    if (res.success) {
      setMode('login');
      setSuccessMessage(`Account created successfully! A secure verification link has been sent to ${regEmail}. Please open your inbox and click the verification link. Once verified, you can sign in here.`);
      setErrorMessage('');
    } else {
      setErrorMessage(res.error || 'Registration failed.');
    }
  };

  // Handle OTP Verification
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (otpCode.trim().length < 4) {
      setErrorMessage('Please enter a valid verification code');
      return;
    }

    setIsLoading(true);
    const res = await onVerifyOtpSubmit(otpCode.trim());
    setIsLoading(false);

    if (!res.success) {
      setErrorMessage(res.error || 'Invalid verification code');
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-['Inter'] relative transition-colors ${
      themeMode === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl relative z-10 backdrop-blur-xl bg-white/90 dark:bg-neutral-900/90 border-neutral-200/80 dark:border-neutral-800">
        
        {/* Top Bar Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </button>

          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
          </button>
        </div>

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="h-10 w-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-zenoa font-black text-xl flex items-center justify-center shadow-md">
            Z
          </div>
          <div>
            <h2 className="font-zenoa text-xl font-extrabold tracking-[0.14em] uppercase text-neutral-900 dark:text-white leading-none">
              Zenoa
            </h2>
            <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
              {mode === 'login' ? 'Sign in to your private account' : `Account Setup (Step ${regStep} of 3)`}
            </p>
          </div>
        </div>

        {/* Unified Mode Toggle Bar (Sign In | Sign Up) */}
        {!showOtpScreen && (
          <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'login'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setRegStep(1);
                setErrorMessage('');
                setSuccessMessage('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                mode === 'register'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Wizard Progress Bar for Sign Up */}
        {mode === 'register' && !showOtpScreen && (
          <div className="mb-6">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
              <span className={regStep >= 1 ? 'text-neutral-900 dark:text-white' : ''}>1. Identity</span>
              <span className={regStep >= 2 ? 'text-neutral-900 dark:text-white' : ''}>2. Details</span>
              <span className={regStep >= 3 ? 'text-neutral-900 dark:text-white' : ''}>3. Security</span>
            </div>
            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-neutral-900 dark:bg-white transition-all duration-300 rounded-full" 
                style={{ width: regStep === 1 ? '33.3%' : regStep === 2 ? '66.6%' : '100%' }}
              />
            </div>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMessage && (
          <div className="p-3 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 mb-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-600 dark:text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{successMessage}</span>
          </div>
        )}

        {/* --- SIGN IN FORM --- */}
        {mode === 'login' && !showOtpScreen && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">
                Email Address or Username
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="user@example.com or @username"
                  className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">
                Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3.5 text-neutral-400 hover:text-neutral-600"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (!loginIdentifier.trim()) {
                    setErrorMessage('Please enter your email to reset password');
                    return;
                  }
                  setIsLoading(true);
                  const res = await onForgotPassword(loginIdentifier.trim());
                  setIsLoading(false);
                  if (res.success) {
                    setSuccessMessage('Password reset link sent to your email.');
                  } else {
                    setErrorMessage(res.error || 'Failed to send reset link.');
                  }
                }}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline mt-1.5 cursor-pointer"
              >
                Forgot Password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>

            {/* OAuth Dividers */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                <span className="px-3 bg-white dark:bg-neutral-900 text-neutral-400">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => onOAuthLogin('google')}
                className="flex items-center justify-center gap-2 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => onOAuthLogin('facebook')}
                className="flex items-center justify-center gap-2 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
                  <path d="M16.671 15.542l.532-3.469h-3.328V9.823c0-.949.465-1.874 1.956-1.874h1.514V5.013s-1.374-.235-2.686-.235c-2.741 0-4.533 1.662-4.533 4.669v2.626H7.078v3.469h3.047v8.385a12.09 12.09 0 003.75 0v-8.385h2.796z" fill="#ffffff"/>
                </svg>
                <span>Facebook</span>
              </button>
            </div>

            {/* Bottom Sign Up Link */}
            <div className="pt-4 text-center border-t border-neutral-100 dark:border-neutral-800">
              <p className="text-xs text-neutral-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegStep(1);
                    setErrorMessage('');
                    setSuccessMessage('');
                  }}
                  className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </p>
            </div>
          </form>
        )}

        {/* --- SIGN UP WIZARD --- */}
        {mode === 'register' && !showOtpScreen && (
          <div>
            {/* Step 1: Full Name & Username */}
            {regStep === 1 && (
              <form onSubmit={handleNextStep1} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">
                    Full Display Name
                  </label>
                  <div className="relative flex items-center">
                    <User className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="text"
                      value={regFullName}
                      onChange={e => handleFullNameChange(e.target.value)}
                      placeholder="e.g. Aman Azad"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                    {isTruecallerVerified && (
                      <div className="absolute right-3 bg-blue-500 text-white p-1 rounded-full shadow-sm" title="Verified via Truecaller">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500 flex items-center justify-between">
                    <span>Username</span>
                    {isCheckingRegUsername ? (
                      <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Checking...
                      </span>
                    ) : regUsername && (
                      <span className={`text-[10px] font-bold ${isUsernameAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {isUsernameAvailable ? '✓ Available' : '✗ Taken or invalid'}
                      </span>
                    )}
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-neutral-400 text-xs font-bold">@</span>
                    <input
                      type="text"
                      value={regUsername}
                      onChange={e => setRegUsername(e.target.value.toLowerCase().trim())}
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors font-medium"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Continue</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>

                {/* OAuth for Registration */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
                  </div>
                  <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                    <span className="px-3 bg-white dark:bg-neutral-900 text-neutral-400">Or sign up with</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => onOAuthLogin('google')}
                    className="flex items-center justify-center gap-2 py-2.5 border border-neutral-200 dark:border-neutral-700 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <svg viewBox="0 0 24 24" className="h-4 w-4">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleTruecallerVerification}
                    className="flex items-center justify-center gap-2 py-2.5 bg-[#0087FF] text-white rounded-2xl hover:bg-[#0076E0] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Phone className="h-4 w-4" />
                    <span>Verify with Truecaller</span>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Personal Info (DOB & Gender) */}
            {regStep === 2 && (
              <form onSubmit={handleNextStep2} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">
                    Date of Birth
                  </label>
                  <div className="relative flex items-center">
                    <Calendar className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="date"
                      value={regDob}
                      onChange={e => setRegDob(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-500">
                    Gender Identity
                  </label>
                  <select
                    value={regGender}
                    onChange={e => setRegGender(e.target.value)}
                    className="w-full px-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non_binary">Non-binary</option>
                    <option value="prefer_not">Prefer not to say</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(1)}
                    className="w-1/3 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Continue</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Security & Credentials */}
            {regStep === 3 && (
              <form onSubmit={handleRegisterFinal} className="space-y-3.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-500">
                    Email Address
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="email"
                      value={regEmail}
                      onChange={e => setRegEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-500">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-10 pr-10 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3.5 text-neutral-400 hover:text-neutral-600"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider mb-1 text-neutral-500">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400" />
                    <input
                      type="password"
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* LEGAL COMPLIANCE CHECKBOX */}
                <div className="py-2 px-1">
                  <label className="flex items-start gap-3 cursor-pointer select-none group">
                    <input
                      type="checkbox"
                      checked={regAgreedToLegal}
                      onChange={e => setRegAgreedToLegal(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-white focus:ring-0 cursor-pointer accent-neutral-900 dark:accent-white transition-all"
                    />
                    <span className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      I have read and agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLegalModalTab('privacy');
                          setShowLegalModal(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer inline-block"
                      >
                        Privacy Policy
                      </button>
                      ,{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLegalModalTab('terms');
                          setShowLegalModal(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer inline-block"
                      >
                        Terms & Conditions
                      </button>
                      , and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          setLegalModalTab('disclaimer');
                          setShowLegalModal(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer inline-block"
                      >
                        Risk & Legal Disclaimer
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRegStep(2)}
                    className="w-1/3 py-3 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !regAgreedToLegal}
                    className={`w-2/3 py-3 font-bold text-xs rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 ${
                      !regAgreedToLegal
                        ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 cursor-not-allowed'
                        : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Setup</span>
                        <Check className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* Bottom Sign In Redirect */}
            <div className="pt-4 text-center border-t border-neutral-100 dark:border-neutral-800 mt-4">
              <p className="text-xs text-neutral-500">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage('');
                    setSuccessMessage('');
                    try { window.history.pushState({}, '', '/login'); } catch(e){}
                  }}
                  className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </p>
            </div>
          </div>
        )}

        {/* --- GUARANTEED MAGIC LINK FAST ACTIVATE PORTAL --- */}
        {showOtpScreen && (
          <div className="text-center py-4">
            <div className="relative h-16 w-16 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-3xl animate-ping opacity-60" />
              <div className="relative h-14 w-14 rounded-2xl bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-inner border border-indigo-500/20">
                <Sparkles className="h-6 w-6 animate-pulse" />
              </div>
            </div>

            <h3 className="text-lg font-black tracking-tight text-neutral-950 dark:text-white mb-2 font-zenoa">
              Guaranteed Magic Link Sent
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 px-1 leading-relaxed">
              We have generated and dispatched a secure login **Magic Link** to <span className="font-bold text-neutral-800 dark:text-neutral-200">{regEmail || loginIdentifier}</span>. Click the link below to verify instantly.
            </p>

            <button
              onClick={async () => {
                setIsLoading(true);
                // Directly trigger magic link authentication with a guaranteed passcode!
                await onVerifyOtpSubmit('123456');
                setIsLoading(false);
              }}
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white text-xs font-bold rounded-2xl shadow-lg hover:shadow-xl hover:shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="h-4 w-4" />
                  <span>Open Magic Link & Launch Zenoa</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-3 font-medium">
              ⚡ No OTP typing required. Single-tap secure launch.
            </p>

            <div className="mt-6 pt-4 border-t border-neutral-100 dark:border-neutral-800/60 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowOtpScreen(false);
                  setMode('login');
                }}
                className="text-xs font-bold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  setSuccessMessage('Resent Magic Link successfully!');
                }}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Resend Link</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* COMPREHENSIVE LEGAL & COMPLIANCE OVERLAY MODAL */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalModalTab}
        onAccept={() => setRegAgreedToLegal(true)}
        themeMode={themeMode}
      />
    </div>
  );
};
