import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Check, AlertCircle, RefreshCw, Sparkles, ArrowRight, LogOut } from 'lucide-react';

interface AccountSetupProps {
  initialFullName?: string;
  initialUsername?: string;
  initialEmail?: string;
  onComplete: (data: { fullName: string; username: string; bio: string; avatarSeed: string }) => Promise<{ success: boolean; error?: string }>;
  checkUsernameAvailability: (username: string) => Promise<{ isTaken: boolean; reason?: string }>;
  themeMode: 'light' | 'dark';
  onSignOut?: () => void;
}

export const AccountSetup: React.FC<AccountSetupProps> = ({
  initialFullName = '',
  initialUsername = '',
  initialEmail = '',
  onComplete,
  checkUsernameAvailability,
  themeMode,
  onSignOut
}) => {
  const [fullName, setFullName] = useState(initialFullName);
  const [username, setUsername] = useState(() => initialUsername.toLowerCase().replace(/[^a-z0-9_.]/g, ''));
  const [bio, setBio] = useState('Hey there! I am using Zenoa Messenger.');
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
            message: res.reason || `@${clean} is already taken. Please choose another.`
          });
        } else {
          setUsernameStatus({
            isAvailable: true,
            message: `✓ @${clean} is available!`
          });
        }
      } catch (err) {
        setUsernameStatus({ isAvailable: true, message: 'Username format valid' });
      } finally {
        setIsCheckingUsername(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [username, checkUsernameAvailability]);

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

    setIsLoading(true);
    const result = await onComplete({
      fullName: cleanFullName,
      username: cleanUsername,
      bio: bio.trim(),
      avatarSeed: avatarSeed || cleanUsername
    });
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || 'Failed to complete profile setup. Please try again.');
    }
  };

  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 sm:p-6 font-['Inter'] transition-colors ${
      themeMode === 'dark' ? 'bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'
    }`}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl relative"
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-zenoa font-black text-xl flex items-center justify-center shadow-md">
              Z
            </div>
            <div>
              <h2 className="font-zenoa text-lg font-extrabold tracking-[0.14em] uppercase text-neutral-900 dark:text-white leading-none">
                Zenoa
              </h2>
              <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                Mandatory Account Setup
              </p>
            </div>
          </div>

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          )}
        </div>

        {/* Security / Mandatory Banner */}
        <div className="p-3 mb-5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs space-y-1">
          <p className="font-bold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Set your unique Zenoa identity</span>
          </p>
          <p className="text-[11px] leading-relaxed text-neutral-600 dark:text-neutral-400">
            Every Zenoa user must have a verified Full Name and a unique @username to ensure account security and private messaging.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 mb-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-tight font-medium">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email (Readonly if available) */}
          {initialEmail && (
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider mb-1 text-neutral-400">
                Connected Email
              </label>
              <input
                type="text"
                disabled
                value={initialEmail}
                className="w-full px-4 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800/60 text-neutral-500 cursor-not-allowed font-mono"
              />
            </div>
          )}

          {/* Full Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-600 dark:text-neutral-300">
              Full Display Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <User className="absolute left-3.5 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Aman Azad"
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors font-medium text-neutral-900 dark:text-white"
                required
              />
            </div>
          </div>

          {/* Unique Username */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">
                Unique Username <span className="text-rose-500">*</span>
              </label>
              
              {isCheckingUsername ? (
                <span className="text-[10px] font-bold text-neutral-400 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3 animate-spin" />
                  Checking...
                </span>
              ) : username && (
                <span className={`text-[10px] font-bold ${usernameStatus.isAvailable ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {usernameStatus.message}
                </span>
              )}
            </div>

            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-neutral-400 text-xs font-bold">@</span>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.]/g, '').trim())}
                placeholder="username"
                className={`w-full pl-8 pr-4 py-2.5 text-xs rounded-2xl border bg-neutral-50/50 dark:bg-neutral-800/40 outline-none transition-colors font-mono font-bold text-neutral-900 dark:text-white ${
                  usernameStatus.isAvailable
                    ? 'border-emerald-500/60 focus:border-emerald-500'
                    : username
                    ? 'border-rose-300 dark:border-rose-900 focus:border-rose-500'
                    : 'border-neutral-200 dark:border-neutral-700 focus:border-indigo-500'
                }`}
                required
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">
              3-20 characters. Lowercase letters, numbers, and underscores only.
            </p>
          </div>

          {/* About / Bio */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider mb-1.5 text-neutral-600 dark:text-neutral-300">
              Bio / About (Optional)
            </label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="What do you want your contacts to know?"
              rows={2}
              className="w-full p-3 text-xs rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50/50 dark:bg-neutral-800/40 outline-none focus:border-indigo-500 transition-colors font-normal text-neutral-900 dark:text-white resize-none"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || isCheckingUsername || !usernameStatus.isAvailable || !fullName.trim()}
            className="w-full py-3.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 disabled:opacity-50 text-white dark:text-neutral-900 text-xs font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white dark:border-black/30 dark:border-t-black rounded-full animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Complete Account & Enter Zenoa</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

