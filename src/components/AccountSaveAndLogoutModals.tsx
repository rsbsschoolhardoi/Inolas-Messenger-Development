import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, Bookmark, X } from 'lucide-react';
import { UserData } from '../types';

interface SaveAccountBottomSheetProps {
  isOpen: boolean;
  username: string;
  displayName: string;
  avatarSeed?: string;
  avatarUrl?: string;
  themeMode: 'light' | 'dark';
  onSave: () => void;
  onCancel: () => void;
  renderAvatar: (seed?: string, name?: string, avatarUrl?: string, sizeClass?: string) => React.ReactNode;
}

export const SaveAccountBottomSheet: React.FC<SaveAccountBottomSheetProps> = ({
  isOpen,
  username,
  displayName,
  avatarSeed,
  avatarUrl,
  themeMode,
  onSave,
  onCancel,
  renderAvatar,
}) => {
  const cleanUsername = username.replace(/^@/, '');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] pointer-events-auto flex items-end justify-center sm:items-center sm:p-4 bg-black/40 backdrop-blur-xs">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`w-full max-w-md rounded-t-3xl sm:rounded-3xl p-6 sm:p-7 border-t sm:border shadow-2xl backdrop-blur-xl ${
              themeMode === 'dark'
                ? 'bg-[#12151f]/95 border-neutral-800 text-white shadow-black/80'
                : 'bg-white/98 border-neutral-200/90 text-neutral-900 shadow-neutral-400/30'
            }`}
          >
            {/* Top Indicator bar for mobile */}
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-4 sm:hidden" />

            <div className="flex items-center gap-3.5 mb-4">
              <div className="shrink-0">
                {renderAvatar(
                  avatarSeed || cleanUsername,
                  displayName || cleanUsername,
                  avatarUrl,
                  'h-12 w-12 text-lg shadow-sm'
                )}
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold tracking-tight truncate">
                  Save your account to this device?
                </h3>
                <p className="text-xs opacity-60 truncate mt-0.5">
                  {displayName || cleanUsername} ({cleanUsername})
                </p>
              </div>
            </div>

            <p className="text-xs opacity-70 leading-relaxed mb-6 font-normal">
              Save your account credentials locally for fast, secure one-tap sign-in next time without entering your password.
            </p>

            {/* Apple-grade Action Buttons */}
            <div className="space-y-2.5">
              <button
                id="save-account-confirm-btn"
                onClick={onSave}
                className={`w-full py-3.5 px-5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] shadow-sm ${
                  themeMode === 'dark'
                    ? 'bg-white hover:bg-neutral-200 text-neutral-950 shadow-white/10'
                    : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-neutral-900/15'
                }`}
              >
                <Bookmark className="h-4 w-4" />
                <span>Save Account</span>
              </button>

              <button
                id="save-account-cancel-btn"
                onClick={onCancel}
                className={`w-full py-3 px-5 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  themeMode === 'dark'
                    ? 'hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

interface LogoutModalProps {
  isOpen: boolean;
  isAccountAlreadySaved: boolean;
  username: string;
  themeMode: 'light' | 'dark';
  onSaveAndLogout: () => void;
  onLogoutOnly: () => void;
  onCancel: () => void;
}

export const LogoutModal: React.FC<LogoutModalProps> = ({
  isOpen,
  isAccountAlreadySaved,
  username,
  themeMode,
  onSaveAndLogout,
  onLogoutOnly,
  onCancel,
}) => {
  const cleanUsername = username.replace(/^@/, '');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] pointer-events-auto flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/45 backdrop-blur-xs">
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className={`w-full max-w-sm rounded-t-3xl sm:rounded-3xl p-6 border-t sm:border shadow-2xl backdrop-blur-xl text-center ${
              themeMode === 'dark'
                ? 'bg-[#131620]/95 border-neutral-800 text-white shadow-black/80'
                : 'bg-white/98 border-neutral-200/90 text-neutral-900 shadow-neutral-400/30'
            }`}
          >
            {/* Top Indicator bar for mobile */}
            <div className="w-10 h-1 rounded-full bg-neutral-300 dark:bg-neutral-700 mx-auto mb-4 sm:hidden" />

            <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-3">
              <LogOut className="h-5 w-5" />
            </div>

            <h3 className="text-base font-bold tracking-tight">
              Log out of Zenoa?
            </h3>
            <p className="text-xs opacity-60 mt-1 mb-5">
              {isAccountAlreadySaved 
                ? 'Your account is saved on this device for fast one-tap access.'
                : 'You have not saved your account on this device yet.'}
            </p>

            {/* Vertically Stacked Professional Options */}
            <div className="space-y-2">
              {/* Option 1: Save & Log Out (ONLY if not previously saved) */}
              {!isAccountAlreadySaved && (
                <button
                  id="logout-save-and-logout-btn"
                  onClick={onSaveAndLogout}
                  className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                    themeMode === 'dark'
                      ? 'bg-white hover:bg-neutral-200 text-neutral-950'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  }`}
                >
                  <Bookmark className="h-4 w-4" />
                  <span>Save & Log Out</span>
                </button>
              )}

              {/* Option 2: Log Out */}
              <button
                id="logout-only-btn"
                onClick={onLogoutOnly}
                className={`w-full py-3.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98] ${
                  isAccountAlreadySaved
                    ? (themeMode === 'dark' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-rose-600 hover:bg-rose-700 text-white')
                    : (themeMode === 'dark' ? 'bg-neutral-850 hover:bg-neutral-800 text-rose-400 border border-neutral-800' : 'bg-neutral-100 hover:bg-neutral-200 text-rose-600 border border-neutral-200')
                }`}
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out</span>
              </button>

              {/* Option 3: Cancel */}
              <button
                id="logout-cancel-btn"
                onClick={onCancel}
                className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer active:scale-[0.98] ${
                  themeMode === 'dark'
                    ? 'hover:bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
                    : 'hover:bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
