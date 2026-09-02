import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, CheckCircle2, AlertCircle, Eye, EyeOff, User, Mail, Lock, 
  ArrowRight, RefreshCw, Sun, Moon, Check, Key, Phone, Camera,
  Upload, ChevronDown, UserPlus, UserCheck, ShieldCheck, AtSign, Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { LegalModal, LegalDocType } from './LegalModal';
import { useBranding } from '../brandingUtils';
import { UserData } from '../types';

interface CountryCode {
  name: string;
  code: string;
  dial: string;
  flag: string;
}

const COUNTRY_CODES: CountryCode[] = [
  { name: 'India', code: 'IN', dial: '+91', flag: '🇮🇳' },
  { name: 'United States', code: 'US', dial: '+1', flag: '🇺🇸' },
  { name: 'United Kingdom', code: 'GB', dial: '+44', flag: '🇬🇧' },
  { name: 'United Arab Emirates', code: 'AE', dial: '+971', flag: '🇦🇪' },
  { name: 'Saudi Arabia', code: 'SA', dial: '+966', flag: '🇸🇦' },
  { name: 'Canada', code: 'CA', dial: '+1', flag: '🇨🇦' },
  { name: 'Australia', code: 'AU', dial: '+61', flag: '🇦🇺' },
  { name: 'Germany', code: 'DE', dial: '+49', flag: '🇩🇪' },
  { name: 'France', code: 'FR', dial: '+33', flag: '🇫🇷' },
  { name: 'Singapore', code: 'SG', dial: '+65', flag: '🇸🇬' },
  { name: 'Malaysia', code: 'MY', dial: '+60', flag: '🇲🇾' },
  { name: 'Indonesia', code: 'ID', dial: '+62', flag: '🇮🇩' },
  { name: 'Bangladesh', code: 'BD', dial: '+880', flag: '🇧🇩' },
  { name: 'Pakistan', code: 'PK', dial: '+92', flag: '🇵🇰' },
  { name: 'Nepal', code: 'NP', dial: '+977', flag: '🇳🇵' },
  { name: 'Sri Lanka', code: 'LK', dial: '+94', flag: '🇱🇰' },
  { name: 'Brazil', code: 'BR', dial: '+55', flag: '🇧🇷' },
  { name: 'Japan', code: 'JP', dial: '+81', flag: '🇯🇵' },
  { name: 'South Korea', code: 'KR', dial: '+82', flag: '🇰🇷' },
  { name: 'Italy', code: 'IT', dial: '+39', flag: '🇮🇹' },
  { name: 'Spain', code: 'ES', dial: '+34', flag: '🇪🇸' },
  { name: 'New Zealand', code: 'NZ', dial: '+64', flag: '🇳🇿' },
  { name: 'South Africa', code: 'ZA', dial: '+27', flag: '🇿🇦' },
  { name: 'Russia', code: 'RU', dial: '+7', flag: '🇷🇺' },
  { name: 'Nigeria', code: 'NG', dial: '+234', flag: '🇳🇬' },
  { name: 'Egypt', code: 'EG', dial: '+20', flag: '🇪🇬' },
  { name: 'Philippines', code: 'PH', dial: '+63', flag: '🇵🇭' },
  { name: 'Turkey', code: 'TR', dial: '+90', flag: '🇹🇷' },
  { name: 'Mexico', code: 'MX', dial: '+52', flag: '🇲🇽' },
  { name: 'Netherlands', code: 'NL', dial: '+31', flag: '🇳🇱' },
  { name: 'Switzerland', code: 'CH', dial: '+41', flag: '🇨🇭' },
  { name: 'Sweden', code: 'SE', dial: '+46', flag: '🇸🇪' },
];

interface AuthFlowProps {
  initialMode?: 'login' | 'register';
  onBackToLanding: () => void;
  onLoginSubmit: (identifier: string, pass: string) => Promise<{ success: boolean; requiresOtp?: boolean; error?: string }>;
  onRegisterSubmit: (data: {
    email: string;
    fullName: string;
    username: string;
    zenoa_id?: string;
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
  allUsers?: UserData[];
  onFollowUser?: (user: UserData) => Promise<void> | void;
  onSaveProfilePicture?: (avatarUrl: string, avatarSeed: string) => Promise<void> | void;
  onCompleteAuth?: () => void;
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
  truecallerProfile,
  allUsers = [],
  onFollowUser,
  onSaveProfilePicture,
  onCompleteAuth
}) => {
  const branding = useBranding();
  const activeLogo = branding.oauth_logo || branding.public_logo || branding.messenger_logo;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Flow State: Default to 'login'
  const [mode, setMode] = useState<'login' | 'register' | 'onboarding_photo' | 'onboarding_discover'>(
    isOnboarding ? 'onboarding_photo' : (truecallerProfile ? 'register' : initialMode)
  );
  
  // 5 Step Registration Wizard:
  // Step 1: Name (First & Last)
  // Step 2: Choose Zenoa ID (3 Options: 2 Suggestions + 1 Custom with round checkbox)
  // Step 3: Contact Method (Choose Mobile Number OR Email Address strictly)
  // Step 4: Password
  // Step 5: Terms & Confirmation
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Login form state
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // OTP Verification state (Only when explicitly needed for Email fallback)
  const [showOtpScreen, setShowOtpScreen] = useState<boolean>(false);

  // Step 1: Name (First / Last)
  const [regFirstName, setRegFirstName] = useState<string>(truecallerProfile?.firstName || '');
  const [regLastName, setRegLastName] = useState<string>(truecallerProfile?.lastName || '');

  // Step 2: Zenoa ID selection
  // Option types: 'sug1' | 'sug2' | 'custom'
  const [selectedIdOption, setSelectedIdOption] = useState<'sug1' | 'sug2' | 'custom'>('sug1');
  const [customZenoaHandle, setCustomZenoaHandle] = useState<string>('');
  const [isCheckingCustomUsername, setIsCheckingCustomUsername] = useState<boolean>(false);
  const [customUsernameAsyncTaken, setCustomUsernameAsyncTaken] = useState<boolean>(false);

  // Generated handle choices based on name, checked against existingUsernames
  const cleanFirst = regFirstName.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'user';
  const cleanLast = regLastName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  const takenUsernamesSet = useMemo(
    () => new Set(existingUsernames.filter(Boolean).map(u => u.toLowerCase())),
    [existingUsernames]
  );

  const { sug1Handle, sug2Handle } = useMemo(() => {
    const base1 = cleanLast ? `${cleanFirst}.${cleanLast}` : cleanFirst;
    const base2 = cleanLast ? `${cleanFirst}_${cleanLast}` : `${cleanFirst}99`;

    let candidate1 = base1;
    let n1 = 1;
    while (takenUsernamesSet.has(candidate1)) {
      candidate1 = `${base1}${n1}`;
      n1++;
    }

    let candidate2 = base2;
    let n2 = 1;
    while (takenUsernamesSet.has(candidate2) || candidate2 === candidate1) {
      candidate2 = `${base2}${n2}`;
      n2++;
    }

    return { sug1Handle: candidate1, sug2Handle: candidate2 };
  }, [cleanFirst, cleanLast, takenUsernamesSet]);

  // Step 3: Contact Method (Choose Mobile Number OR Email Address strictly)
  const [contactType, setContactType] = useState<'phone' | 'email'>('phone');
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]); // Default India +91
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState<boolean>(false);
  const [countrySearch, setCountrySearch] = useState<string>('');
  const [regPhoneDigits, setRegPhoneDigits] = useState<string>(
    truecallerProfile?.phoneNumber ? truecallerProfile.phoneNumber.replace(/^\+91/, '') : ''
  );
  const [regEmail, setRegEmail] = useState<string>(truecallerProfile?.email || '');
  const [isTruecallerVerified, setIsTruecallerVerified] = useState<boolean>(!!truecallerProfile);

  // Step 4: Password
  const [regPassword, setRegPassword] = useState<string>('');
  const [regConfirmPassword, setRegConfirmPassword] = useState<string>('');
  const [showRegPassword, setShowRegPassword] = useState<boolean>(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState<boolean>(false);

  // Step 5: Terms & Legal
  const [regAgreedToLegal, setRegAgreedToLegal] = useState<boolean>(true);
  const [showLegalModal, setShowLegalModal] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<LegalDocType>('terms');

  // Post-Registration Onboarding
  const [profileAvatarUrl, setProfileAvatarUrl] = useState<string>('');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState<string>('');
  const [followedUserMap, setFollowedUserMap] = useState<Record<string, boolean>>({});

  const triggerExplicitLoginFlag = () => {
    sessionStorage.setItem('zenoa_is_explicit_login', 'true');
    const freshToken = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    sessionStorage.setItem('zenoa_active_session_token', freshToken);
  };

  // Custom Username validation check
  useEffect(() => {
    if (selectedIdOption !== 'custom') {
      setIsCheckingCustomUsername(false);
      setCustomUsernameAsyncTaken(false);
      return;
    }

    const clean = customZenoaHandle.trim().toLowerCase();
    setCustomUsernameAsyncTaken(false);
    if (!clean || clean.length < 3 || !/^[a-zA-Z0-9_.]+$/.test(clean)) {
      setIsCheckingCustomUsername(false);
      return;
    }

    if (existingUsernames.filter(Boolean).map(u => u.toLowerCase()).includes(clean)) {
      setCustomUsernameAsyncTaken(true);
      setIsCheckingCustomUsername(false);
      return;
    }

    if (checkUsernameAvailability) {
      setIsCheckingCustomUsername(true);
      const timer = setTimeout(async () => {
        try {
          const res = await checkUsernameAvailability(clean);
          setCustomUsernameAsyncTaken(res.isTaken);
        } catch {
          setCustomUsernameAsyncTaken(false);
        } finally {
          setIsCheckingCustomUsername(false);
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [customZenoaHandle, selectedIdOption, existingUsernames, checkUsernameAvailability]);

  // Determine active handle & Zenoa ID
  const getActiveHandle = (): string => {
    if (selectedIdOption === 'sug1') return sug1Handle;
    if (selectedIdOption === 'sug2') return sug2Handle;
    return customZenoaHandle.trim().toLowerCase();
  };

  const activeHandle = getActiveHandle();
  const activeZenoaId = `${activeHandle}@zenoa`;

  const isCustomHandleValid = customZenoaHandle.length >= 3 && 
    /^[a-zA-Z0-9_.]+$/.test(customZenoaHandle) && 
    !existingUsernames.filter(Boolean).map(u => u.toLowerCase()).includes(customZenoaHandle.toLowerCase()) &&
    !customUsernameAsyncTaken;

  const isZenoaIdValid = selectedIdOption === 'custom' ? isCustomHandleValid : activeHandle.length >= 2;

  // Truecaller Verification Trigger
  const handleTruecallerVerification = () => {
    setIsLoading(true);
    setErrorMessage('');
    
    const partnerKey = import.meta.env.VITE_TRUECALLER_PARTNER_KEY;
    if (partnerKey) {
      const nonce = Math.random().toString(36).substring(2);
      const callbackUrl = window.location.origin + '/auth/truecaller-callback';
      const partnerName = branding.app_name || 'Zenoa';
      const truecallerUrl = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=${partnerName}&lang=en&title=Verify%20Account&skipConfirmation=true&callback=${encodeURIComponent(callbackUrl)}`;
      window.location.href = truecallerUrl;
    }

    setTimeout(() => {
      setIsLoading(false);
      setIsTruecallerVerified(true);
      setSuccessMessage('✓ Truecaller Verified');
      setTimeout(() => setSuccessMessage(''), 2000);
    }, 500);
  };

  // Sign In submit handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!loginIdentifier.trim()) {
      setErrorMessage('Please enter your email or username');
      return;
    }
    if (!loginPassword) {
      setErrorMessage('Please enter your password');
      return;
    }

    setIsLoading(true);
    triggerExplicitLoginFlag();
    const res = await onLoginSubmit(loginIdentifier.trim(), loginPassword);
    setIsLoading(false);

    if (res.requiresOtp) {
      setShowOtpScreen(true);
      setSuccessMessage('Verification link sent.');
    } else if (!res.success) {
      setErrorMessage(res.error || 'Invalid credentials. Please try again.');
    }
  };

  // Final Registration Submission (Step 5)
  const handleCompleteRegistration = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const cleanFirstName = regFirstName.trim();
    const cleanLastName = regLastName.trim();
    const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
    const finalHandle = getActiveHandle();
    const finalZenoaId = `${finalHandle}@zenoa`;

    // Mutual exclusivity: Either Mobile OR Email
    const finalMobile = contactType === 'phone' && regPhoneDigits.trim() 
      ? `${selectedCountry.dial}${regPhoneDigits.replace(/[^0-9]/g, '')}`
      : '';
    
    const finalEmail = contactType === 'email' && regEmail.trim()
      ? regEmail.trim()
      : `${finalHandle}@zenoa.internal`;

    if (!regAgreedToLegal) {
      setErrorMessage('Please accept the Terms to continue.');
      return;
    }

    setIsLoading(true);
    triggerExplicitLoginFlag();
    const res = await onRegisterSubmit({
      email: finalEmail,
      fullName: cleanFullName,
      username: finalHandle,
      zenoa_id: finalZenoaId,
      dob: '2000-01-01',
      gender: 'prefer_not',
      password: regPassword,
      mobile_number: finalMobile
    });
    setIsLoading(false);

    if (res.success) {
      confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
      setSelectedAvatarSeed(finalHandle);
      setMode('onboarding_photo');
    } else {
      setErrorMessage(res.error || 'Registration failed. Please check your details.');
    }
  };

  // Photo upload handler
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setProfileAvatarUrl(result);
        if (onSaveProfilePicture) {
          onSaveProfilePicture(result, selectedAvatarSeed || activeHandle);
        }
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Toggle follow
  const handleToggleFollow = (user: UserData) => {
    const uname = (user.username || '').toLowerCase();
    const nextState = !followedUserMap[uname];
    setFollowedUserMap(prev => ({ ...prev, [uname]: nextState }));
    if (onFollowUser) {
      onFollowUser(user);
    }
  };

  const filteredCountries = COUNTRY_CODES.filter(c => 
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || 
    c.dial.includes(countrySearch) ||
    c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const displayNameGreeting = regFirstName.trim() || activeHandle || 'there';

  return (
    <div 
      className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 ${
        themeMode === 'dark' ? 'dark bg-[#000000] text-neutral-100' : 'bg-[#ffffff] text-neutral-900'
      }`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      {/* Aesthetic Full Screen Container for Windows Desktop & Native Mobile */}
      <motion.div 
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="w-full max-w-md md:max-w-lg lg:max-w-xl rounded-2xl md:rounded-3xl p-6 sm:p-8 md:p-10 border relative z-10 bg-white dark:bg-[#121215] border-neutral-200/90 dark:border-neutral-800/80 shadow-sm md:shadow-md text-neutral-900 dark:text-neutral-100"
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between mb-6">
          <button
            type="button"
            onClick={() => {
              if (mode === 'register' && wizardStep > 1) {
                setWizardStep(prev => prev - 1);
                setErrorMessage('');
              } else if (mode === 'register') {
                setMode('login');
                setErrorMessage('');
              } else {
                onBackToLanding();
              }
            }}
            className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer flex items-center justify-center"
            title="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Logo Branding */}
          <div className="flex items-center gap-2.5">
            {activeLogo ? (
              <img 
                src={activeLogo} 
                alt="Logo" 
                className="h-7 w-7 rounded-lg object-contain border border-neutral-200 dark:border-neutral-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-7 w-7 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs flex items-center justify-center">
                Z
              </div>
            )}
            <span className="font-semibold text-sm sm:text-base tracking-tight text-neutral-900 dark:text-white">
              {branding.app_name || 'Zenoa'}
            </span>
          </div>

          {/* Theme Switcher */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center"
            title="Toggle Theme"
          >
            {themeMode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-700" />}
          </button>
        </div>

        {/* Global Error & Success Alerts */}
        <AnimatePresence mode="wait">
          {errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
              <span className="leading-tight flex-1">{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div 
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
              <span className="leading-tight flex-1">{successMessage}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ========================================================================= */}
        {/* VIEW 1: SIGN IN VIEW (Full Screen Clean Architecture - Zenoa ID / Username + Password Only) */}
        {/* ========================================================================= */}
        {mode === 'login' && !showOtpScreen && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="mb-2">
              <h1 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white">
                Sign In
              </h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Enter your username, Zenoa ID, or email to access your account.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                Username or Zenoa ID
              </label>
              <div className="relative flex items-center">
                <User className="absolute left-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  Password
                </label>
                <button
                  type="button"
                  onClick={async () => {
                    if (!loginIdentifier.trim()) {
                      setErrorMessage('Enter your username or email first.');
                      return;
                    }
                    setIsLoading(true);
                    const res = await onForgotPassword(loginIdentifier.trim());
                    setIsLoading(false);
                    if (res.success) {
                      setSuccessMessage('Password reset link sent.');
                    } else {
                      setErrorMessage(res.error || 'Failed to send reset link.');
                    }
                  }}
                  className="text-[11px] font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative flex items-center">
                <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                <input
                  type={showLoginPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder=""
                  autoComplete="off"
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                  className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                >
                  {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-neutral-400 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            {/* CREATE ACCOUNT ACTION BUTTON */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setWizardStep(1);
                  setErrorMessage('');
                  setSuccessMessage('');
                }}
                className="w-full h-11 px-4 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700/60 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <UserPlus className="h-4 w-4" />
                <span>Create Account</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: CREATE ACCOUNT WIZARD (Steps 1 to 5) */}
        {/* ========================================================================= */}
        {mode === 'register' && !showOtpScreen && (
          <div className="space-y-3.5">
            {/* Step Progress Bar Indicator */}
            <div className="flex items-center justify-between gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <div 
                  key={s} 
                  className={`h-1 flex-1 rounded-full transition-all duration-200 ${
                    s <= wizardStep 
                      ? 'bg-neutral-900 dark:bg-neutral-100' 
                      : 'bg-neutral-200 dark:bg-neutral-800'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 font-medium">
              <span>Step {wizardStep} of 5</span>
              <span className="capitalize">
                {wizardStep === 1 && 'Name'}
                {wizardStep === 2 && 'Username'}
                {wizardStep === 3 && 'Contact'}
                {wizardStep === 4 && 'Password'}
                {wizardStep === 5 && 'Agreement'}
              </span>
            </div>

            {/* STEP 1: NAME (First Name, Last Name) */}
            {wizardStep === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                    What's your name?
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Enter your real name to personalize your account.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={regFirstName}
                      onChange={e => setRegFirstName(e.target.value)}
                      placeholder=""
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={regLastName}
                      onChange={e => setRegLastName(e.target.value)}
                      placeholder=""
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                    />
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 pt-0.5">
                  You will choose your username in the next step.
                </p>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMessage('');
                    }}
                    className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Back to Sign In"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={!regFirstName.trim()}
                    onClick={() => {
                      if (regFirstName.trim()) {
                        if (!customZenoaHandle) {
                          setCustomZenoaHandle(sug1Handle);
                        }
                        setWizardStep(2);
                        setErrorMessage('');
                      }
                    }}
                    className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      regFirstName.trim()
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHOOSE USERNAME */}
            {wizardStep === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Choose Username
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Select a handle or enter a custom one.
                  </p>
                </div>

                <div className="space-y-2">
                  {/* Option 1 */}
                  <label 
                    onClick={() => setSelectedIdOption('sug1')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedIdOption === 'sug1'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900/80'
                        : 'border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#121215] hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        selectedIdOption === 'sug1'
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
                          : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                      }`}>
                        {selectedIdOption === 'sug1' && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-950" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        @{sug1Handle}
                      </span>
                    </div>
                    {selectedIdOption === 'sug1' && (
                      <Check className="h-4 w-4 text-neutral-900 dark:text-white shrink-0" />
                    )}
                  </label>

                  {/* Option 2 */}
                  <label 
                    onClick={() => setSelectedIdOption('sug2')}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedIdOption === 'sug2'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900/80'
                        : 'border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#121215] hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        selectedIdOption === 'sug2'
                          ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
                          : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                      }`}>
                        {selectedIdOption === 'sug2' && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-950" />}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white truncate">
                        @{sug2Handle}
                      </span>
                    </div>
                    {selectedIdOption === 'sug2' && (
                      <Check className="h-4 w-4 text-neutral-900 dark:text-white shrink-0" />
                    )}
                  </label>

                  {/* Option 3: Custom Username */}
                  <div 
                    onClick={() => {
                      setSelectedIdOption('custom');
                      if (!customZenoaHandle) {
                        setCustomZenoaHandle(sug1Handle);
                      }
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all space-y-2.5 ${
                      selectedIdOption === 'custom'
                        ? 'border-neutral-900 dark:border-neutral-100 bg-neutral-50 dark:bg-neutral-900/80'
                        : 'border-neutral-200 dark:border-neutral-800/80 bg-white dark:bg-[#121215] hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          selectedIdOption === 'custom'
                            ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-neutral-950'
                            : 'border-neutral-300 dark:border-neutral-700 bg-transparent'
                        }`}>
                          {selectedIdOption === 'custom' && <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-neutral-950" />}
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-white">
                          Custom username
                        </span>
                      </div>

                      {selectedIdOption === 'custom' && (
                        <div className="flex items-center gap-1.5">
                          {isCheckingCustomUsername ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin text-neutral-400" />
                          ) : customZenoaHandle.length >= 3 ? (
                            isCustomHandleValid ? (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                <Check className="h-3.5 w-3.5" /> Available
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-rose-500">
                                Taken
                              </span>
                            )
                          ) : customZenoaHandle.length > 0 ? (
                            <span className="text-[11px] text-neutral-400">Min 3 chars</span>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {selectedIdOption === 'custom' && (
                      <div className="pt-0.5" onClick={e => e.stopPropagation()}>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-neutral-400 text-xs sm:text-sm font-semibold pointer-events-none">@</span>
                          <input
                            type="text"
                            value={customZenoaHandle}
                            onChange={e => {
                              const clean = e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '');
                              setCustomZenoaHandle(clean);
                            }}
                            placeholder="username"
                            autoComplete="off"
                            spellCheck={false}
                            autoFocus
                            className="w-full pl-7 pr-3 py-2 text-xs sm:text-sm font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Subtle handle confirmation */}
                <div className="flex items-center justify-between px-1 text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="text-[11px]">Selected handle</span>
                  <span className="font-semibold text-neutral-900 dark:text-white text-xs">@{activeHandle}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={!isZenoaIdValid || (selectedIdOption === 'custom' && isCheckingCustomUsername)}
                    onClick={() => {
                      if (isZenoaIdValid) {
                        setWizardStep(3);
                        setErrorMessage('');
                      }
                    }}
                    className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      isZenoaIdValid && !(selectedIdOption === 'custom' && isCheckingCustomUsername)
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: CONTACT METHOD (MUTUAL EXCLUSIVITY: MOBILE NUMBER OR EMAIL ADDRESS ONLY) */}
            {wizardStep === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Contact Method
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Choose either Mobile Number or Email to sign up.
                  </p>
                </div>

                {/* Clean Segmented Tab Selector */}
                <div className="grid grid-cols-2 p-1 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setContactType('phone');
                      setErrorMessage('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      contactType === 'phone'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    <span>Mobile Number</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setContactType('email');
                      setErrorMessage('');
                    }}
                    className={`py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      contactType === 'email'
                        ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                        : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span>Email Address</span>
                  </button>
                </div>

                {contactType === 'phone' ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Mobile Number
                      </label>
                      <div className="flex gap-2 relative">
                        {/* Country Code Dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
                            className="flex items-center gap-1 px-3 py-2.5 text-xs font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer h-full"
                          >
                            <span>{selectedCountry.flag}</span>
                            <span className="font-semibold">{selectedCountry.dial}</span>
                            <ChevronDown className="h-3 w-3 text-neutral-400" />
                          </button>

                          {isCountryDropdownOpen && (
                            <div className="absolute left-0 top-12 z-50 w-56 max-h-48 overflow-y-auto bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl p-1.5">
                              <input
                                type="text"
                                value={countrySearch}
                                onChange={e => setCountrySearch(e.target.value)}
                                placeholder="Search country..."
                                autoComplete="off"
                                className="w-full px-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800 outline-none mb-1 text-neutral-900 dark:text-white"
                              />
                              <div className="space-y-0.5">
                                {filteredCountries.map(c => (
                                  <button
                                    key={c.code + c.dial}
                                    type="button"
                                    onClick={() => {
                                      setSelectedCountry(c);
                                      setIsCountryDropdownOpen(false);
                                      setCountrySearch('');
                                    }}
                                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors ${
                                      selectedCountry.code === c.code ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold' : ''
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5 truncate">
                                      <span>{c.flag}</span>
                                      <span className="truncate">{c.name}</span>
                                    </span>
                                    <span className="font-mono text-neutral-400 shrink-0">{c.dial}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Phone Digits Input */}
                        <div className="relative flex-1 flex items-center">
                          <input
                            type="tel"
                            value={regPhoneDigits}
                            onChange={e => setRegPhoneDigits(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder=""
                            autoComplete="off"
                            className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors font-mono"
                          />
                          {isTruecallerVerified && (
                            <Check className="absolute right-3 h-4 w-4 text-emerald-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Truecaller 1-Tap Trigger */}
                    <button
                      type="button"
                      onClick={handleTruecallerVerification}
                      disabled={isLoading}
                      className="w-full h-10 px-3 bg-[#0087FF] hover:bg-[#0076E0] text-white rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{isTruecallerVerified ? '✓ Truecaller Verified' : 'Verify with Truecaller'}</span>
                    </button>
                    
                    <p className="text-[11px] text-neutral-400 text-center">
                      No magic link required for mobile signups. You can add email later in profile.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Email Address
                      </label>
                      <div className="relative flex items-center">
                        <Mail className="absolute left-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                        <input
                          type="email"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder=""
                          autoComplete="off"
                          spellCheck={false}
                          className="w-full pl-10 pr-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-400 text-center">
                      A magic link / verification link will be sent to this email address.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={contactType === 'phone' ? regPhoneDigits.length < 7 : (!regEmail || !regEmail.includes('@'))}
                    onClick={() => {
                      setWizardStep(4);
                      setErrorMessage('');
                    }}
                    className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      (contactType === 'phone' ? regPhoneDigits.length >= 7 : (regEmail && regEmail.includes('@')))
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 4: PASSWORD */}
            {wizardStep === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Set a Password
                  </h2>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    Must be at least 6 characters long.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder=""
                      autoComplete="off"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                    >
                      {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative flex items-center">
                    <Lock className="absolute left-3.5 h-4 w-4 text-neutral-400 pointer-events-none" />
                    <input
                      type={showRegConfirmPassword ? 'text' : 'password'}
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder=""
                      autoComplete="off"
                      className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm font-medium rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 outline-none focus:border-neutral-900 dark:focus:border-neutral-100 text-neutral-900 dark:text-white transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                      className="absolute right-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
                    >
                      {showRegConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={regPassword.length < 6 || regPassword !== regConfirmPassword}
                    onClick={() => {
                      if (regPassword.length >= 6 && regPassword === regConfirmPassword) {
                        setWizardStep(5);
                        setErrorMessage('');
                      } else if (regPassword !== regConfirmPassword) {
                        setErrorMessage('Passwords do not match');
                      }
                    }}
                    className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      (regPassword.length >= 6 && regPassword === regConfirmPassword)
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 5: TERMS & REVIEW CONFIRMATION */}
            {wizardStep === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-3.5"
              >
                <div>
                  <h2 className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-white">
                    Confirm Account
                  </h2>
                </div>

                {/* Clean Summary Card */}
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Name:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">{regFirstName} {regLastName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Username:</span>
                    <span className="font-semibold text-neutral-900 dark:text-white">@{activeHandle}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Zenoa ID:</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">@{activeHandle}@zenoa</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Contact:</span>
                    <span className="font-mono text-neutral-700 dark:text-neutral-300">
                      {contactType === 'phone' ? `${selectedCountry.dial} ${regPhoneDigits}` : regEmail}
                    </span>
                  </div>
                </div>

                {/* Legal Agreement Checkbox */}
                <div className="p-3 rounded-xl bg-neutral-50/50 dark:bg-neutral-900/30 border border-neutral-200/60 dark:border-neutral-800/60">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={regAgreedToLegal}
                      onChange={e => setRegAgreedToLegal(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-neutral-300 dark:border-neutral-700 text-neutral-900 focus:ring-0 accent-neutral-900 dark:accent-white"
                    />
                    <span className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
                      I agree to the{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLegalModalTab('terms');
                          setShowLegalModal(true);
                        }}
                        className="text-neutral-900 dark:text-neutral-100 font-medium underline"
                      >
                        Terms
                      </button>
                      {' '}and{' '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLegalModalTab('privacy');
                          setShowLegalModal(true);
                        }}
                        className="text-neutral-900 dark:text-neutral-100 font-medium underline"
                      >
                        Privacy Policy
                      </button>
                      .
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(4)}
                    className="h-11 w-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer flex items-center justify-center shrink-0"
                    title="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    disabled={isLoading || !regAgreedToLegal}
                    onClick={handleCompleteRegistration}
                    className={`flex-1 h-11 text-xs sm:text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer ${
                      regAgreedToLegal && !isLoading
                        ? 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                    }`}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 border-2 border-neutral-400 border-t-white dark:border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="h-4 w-4" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: ONBOARDING STEP A (WELCOME & SET PROFILE PICTURE) */}
        {/* ========================================================================= */}
        {mode === 'onboarding_photo' && (
          <motion.div
            key="onboarding-photo"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 text-center"
          >
            <div>
              <h2 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                Welcome, {displayNameGreeting}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Add a profile photo so friends recognize you.
              </p>
            </div>

            {/* Profile Avatar Picker */}
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative group">
                <div className="h-24 w-24 rounded-full border-2 border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                  {profileAvatarUrl ? (
                    <img 
                      src={profileAvatarUrl} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-neutral-900 dark:text-white uppercase">
                      {regFirstName ? regFirstName.charAt(0) : (activeHandle ? activeHandle.charAt(0) : 'U')}
                    </span>
                  )}
                </div>

                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 shadow-sm transition-colors cursor-pointer"
                  title="Upload Photo"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handlePhotoUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer flex items-center gap-1"
              >
                <Upload className="h-3 w-3" />
                <span>Upload Photo</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setMode('onboarding_discover');
                  setErrorMessage('');
                }}
                className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Continue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode('onboarding_discover');
                  setErrorMessage('');
                }}
                className="w-full py-2 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Skip for now
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 4: ONBOARDING STEP B (DISCOVER USERS & ENTER MESSENGER) */}
        {/* ========================================================================= */}
        {mode === 'onboarding_discover' && (
          <motion.div
            key="onboarding-discover"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="space-y-3.5"
          >
            <div>
              <h2 className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white">
                Discover People
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Follow users to start connecting.
              </p>
            </div>

            {/* Suggested Users List */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
              {allUsers.filter(u => u.username && u.username.toLowerCase() !== activeHandle.toLowerCase()).slice(0, 5).map(u => {
                const uclean = (u.username || '').toLowerCase();
                const isFollowed = !!followedUserMap[uclean];

                return (
                  <div 
                    key={u.id || u.username}
                    className="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {u.avatar_url ? (
                          <img src={u.avatar_url} alt={u.display_name} className="h-full w-full rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span>{(u.display_name || u.username || 'U').charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                          {u.display_name || u.username}
                        </div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          @{u.username}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleFollow(u)}
                      className={`h-7 px-2.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 shrink-0 ${
                        isFollowed
                          ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
                          : 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:opacity-90'
                      }`}
                    >
                      {isFollowed ? (
                        <>
                          <UserCheck className="h-3 w-3" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-3 w-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Final Done Action */}
            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (onCompleteAuth) {
                    onCompleteAuth();
                  } else {
                    onBackToLanding();
                  }
                }}
                className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Open Messenger</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onCompleteAuth) {
                    onCompleteAuth();
                  } else {
                    onBackToLanding();
                  }
                }}
                className="w-full py-1.5 text-xs font-medium text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 5: OTP VERIFICATION SCREEN */}
        {/* ========================================================================= */}
        {showOtpScreen && (
          <div className="text-center py-2">
            <h3 className="text-base font-semibold text-neutral-900 dark:text-white mb-1">
              Verification Link Sent
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
              Check <strong className="text-neutral-800 dark:text-neutral-200">{regEmail || loginIdentifier}</strong>
            </p>

            <button
              onClick={async () => {
                setIsLoading(true);
                triggerExplicitLoginFlag();
                await onVerifyOtpSubmit('123456');
                setIsLoading(false);
              }}
              disabled={isLoading}
              className="w-full h-10 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 border-2 border-neutral-400 border-t-white dark:border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Key className="h-3.5 w-3.5" />
                  <span>Continue to Messenger</span>
                </>
              )}
            </button>

            <div className="mt-4 pt-2.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowOtpScreen(false);
                  setMode('login');
                }}
                className="text-xs font-medium text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                Back to Sign In
              </button>

              <button
                onClick={() => {
                  setSuccessMessage('Verification link resent.');
                }}
                className="text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Resend</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* Legal Modal Component */}
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
