import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Check, AlertCircle, RefreshCw, Sparkles, LogOut, Calendar, Mail, Shield, ChevronDown } from 'lucide-react';
import { ZenoaLogo } from './common/ZenoaLogo';

interface AccountSetupProps {
  initialFullName?: string;
  initialUsername?: string;
  initialEmail?: string;
  initialDob?: string;
  initialGender?: string;
  onComplete: (data: { 
    fullName: string; 
    username: string; 
    zenoa_id: string;
    dob: string;
    gender: string;
    bio: string; 
    avatarSeed: string;
  }) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ isTaken: boolean; reason?: string }>;
  themeMode: 'light' | 'dark';
  onSignOut?: () => void;
}

export const AccountSetup: React.FC<AccountSetupProps> = ({
  initialFullName = '',
  initialUsername = '',
  initialEmail = '',
  initialDob = '',
  initialGender = '',
  onComplete,
  checkUsernameAvailability,
  themeMode,
  onSignOut
}) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(() => initialUsername.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
  const [dob, setDob] = useState(initialDob);
  const [gender, setGender] = useState(initialGender || 'prefer_not_to_say');
  const [bio, setBio] = useState('Hey there! I am using Zenoa.');
  const [avatarSeed, setAvatarSeed] = useState(() => initialUsername || 'zenoa');

  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<{ isAvailable: boolean; message: string }>({
    isAvailable: false,
    message: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Auto-suggest username when full name changes if username is empty
  useEffect(() => {
    if (initialFullName && !fullName) {
      setFullName(initialFullName);
    }
    if (initialUsername && !username) {
      setUsername(initialUsername.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
    }
  }, [initialFullName, initialUsername]);

  // Debounced Username Availability Checking
  useEffect(() => {
    const clean = username.trim().toLowerCase();
    setErrorMessage('');

    if (!clean) {
      setUsernameStatus({ isAvailable: false, message: 'Username is required' });
      setIsCheckingUsername(false);
      return;
    }

    if (clean.length < 3 || clean.length > 25) {
      setUsernameStatus({ isAvailable: false, message: 'Username must be 3-25 characters' });
      setIsCheckingUsername(false);
      return;
    }

    if (!/^[a-z0-9_.]+$/.test(clean)) {
      setUsernameStatus({ isAvailable: false, message: 'Only letters, numbers, underscores, and dots (.) allowed' });
      setIsCheckingUsername(false);
      return;
    }

    setIsCheckingUsername(true);
    const timer = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailability(clean);
        if (res.isTaken) {
          setUsernameStatus({
            isAvailable: false,
            message: res.reason || `@${clean} is already taken`
          });
        } else {
          setUsernameStatus({
            isAvailable: true,
            message: `✓ @${clean} is available`
          });
        }
      } catch (err) {
        setUsernameStatus({ isAvailable: true, message: 'Format valid' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

  const zenoaIdPreview = username ? `@${username.toLowerCase()}@zenoa` : '@yourname@zenoa';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanFullName = fullName.trim();
    const cleanUsername = username.trim().toLowerCase();

    if (!cleanFullName) {
      setErrorMessage('Full Display Name is required.');
      return;
    }

    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }

    if (!usernameStatus.isAvailable && !isCheckingUsername) {
      setErrorMessage(usernameStatus.message || 'Please choose a valid unique username.');
      return;
    }

    if (!dob) {
      setErrorMessage('Please select your Date of Birth.');
      return;
    }

    if (!gender) {
      setErrorMessage('Please select your gender.');
      return;
    }

    setIsLoading(true);
    const result = await onComplete({
      fullName: cleanFullName,
      username: cleanUsername,
      zenoa_id: `${cleanUsername}@zenoa`,
      dob,
      gender,
      bio: bio.trim(),
      avatarSeed: avatarSeed || cleanUsername
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to complete profile setup. Please try again.');
    }
  };

  const genderOptions = [
    { id: 'male', label: 'Male' },
    { id: 'female', label: 'Female' },
    { id: 'other', label: 'Other' },
    { id: 'prefer_not_to_say', label: 'Prefer not to say' }
  ];

  return (
    <div 
      className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors duration-200 select-none ${
        themeMode === 'dark' ? 'bg-[#090d16] text-slate-100' : 'bg-slate-50 text-slate-900'
      }`}
      style={{
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, system-ui, sans-serif'
      }}
    >
      {/* Subtle Background Radial Glow */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
        style={{
          background: themeMode === 'dark' 
            ? 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.12) 0%, transparent 60%)'
            : 'radial-gradient(circle at 50% 15%, rgba(99, 102, 241, 0.06) 0%, transparent 60%)'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-2xl rounded-3xl p-6 sm:p-8 relative z-10 max-h-[92vh] overflow-y-auto"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-slate-100 dark:border-slate-800/80 mb-5">
          <div className="flex items-center gap-3">
            <ZenoaLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-[0.16em] uppercase text-slate-900 dark:text-slate-100">
                  ZENOA
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/50">
                  Sovereign Identity
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Complete Sovereign Profile
              </p>
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-2.5 py-1.5 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="text-[11px]">Sign Out</span>
            </button>
          )}
        </div>

        {/* Security / Verification Banner */}
        <div className="p-4 mb-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
          <div className="font-semibold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5 text-xs">
            <Shield className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span>Identity Verification Complete</span>
          </div>
          <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
            Finalize your display name, permanent @username, and cryptographic profile to enter Zenoa.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Connected Email (Readonly) */}
          {initialEmail && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                Connected Email
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-3.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  disabled
                  value={initialEmail}
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/70 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 cursor-not-allowed font-mono"
                />
              </div>
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Full Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Aman Azad"
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition"
                required
              />
            </div>
          </div>

          {/* Unique Username & Zenoa ID */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                Unique Username <span className="text-rose-500">*</span>
              </label>
              
              {isCheckingUsername ? (
                <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin text-indigo-500" />
                  Checking...
                </span>
              ) : username && (
                <span className={`text-[10px] font-semibold ${usernameStatus.isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {usernameStatus.message}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-slate-400 text-xs font-semibold select-none">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim())}
                placeholder="username"
                className={`w-full pl-8 pr-3.5 py-2.5 text-xs rounded-xl border bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none transition font-mono ${
                  usernameStatus.isAvailable
                    ? 'border-emerald-500/80 focus:ring-2 focus:ring-emerald-500/20'
                    : username
                    ? 'border-rose-300 dark:border-rose-900 focus:ring-2 focus:ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700/80 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500'
                }`}
                required
              />
            </div>

            {/* Permanent Zenoa ID Preview Badge */}
            <div className="mt-2 flex items-center justify-between px-3.5 py-2 rounded-xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60">
              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Sovereign Zenoa ID:
              </span>
              <span className="text-[11px] font-mono font-semibold text-slate-900 dark:text-slate-100">
                {zenoaIdPreview}
              </span>
            </div>
          </div>

          {/* Date of Birth & Gender Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {/* DOB */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={dob}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium"
                  required
                />
              </div>
            </div>

            {/* Gender Selection */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Gender <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full pl-3.5 pr-8 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition font-medium cursor-pointer appearance-none"
                  required
                >
                  {genderOptions.map(opt => (
                    <option key={opt.id} value={opt.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                      {opt.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* About / Bio */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio / About (Optional)
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What do you want your contacts to know?"
              rows={2}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isCheckingUsername || !usernameStatus.isAvailable || !fullName.trim() || !dob}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer mt-5"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Complete Profile & Enter Zenoa</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
