import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreVertical, UserPlus, ArrowLeft, Trash2, 
  ShieldCheck, ChevronRight, Check
} from 'lucide-react';
import { SavedDeviceAccount } from '../types';
import { useBranding } from '../brandingUtils';

interface SavedAccountsViewProps {
  savedAccounts: SavedDeviceAccount[];
  onSelectAccount: (account: SavedDeviceAccount) => void;
  onRemoveAccount: (username: string) => void;
  onUseAnotherAccount: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme?: () => void;
  renderAvatar: (seed?: string, name?: string, avatarUrl?: string, sizeClass?: string) => React.ReactNode;
}

export const SavedAccountsView: React.FC<SavedAccountsViewProps> = ({
  savedAccounts,
  onSelectAccount,
  onRemoveAccount,
  onUseAnotherAccount,
  themeMode,
  renderAvatar,
}) => {
  const branding = useBranding();
  const [viewState, setViewState] = useState<'select' | 'manage'>('select');
  const [showTopMenu, setShowTopMenu] = useState<boolean>(false);
  const [activeAccountMenu, setActiveAccountMenu] = useState<string | null>(null);
  const topMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (topMenuRef.current && !topMenuRef.current.contains(e.target as Node)) {
        setShowTopMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAccountRemove = (username: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setActiveAccountMenu(null);
    onRemoveAccount(username);
  };

  return (
    <div className={`min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-200 select-none ${
      themeMode === 'dark' ? 'bg-[#090b10] text-neutral-100' : 'bg-[#f8f9fa] text-neutral-900'
    }`}>
      {/* Central Apple-Grade Card Container */}
      <div className="w-full max-w-sm sm:max-w-md flex flex-col">
        
        {/* VIEW 1: ONE-TAP ACCOUNT SELECTION */}
        {viewState === 'select' && (
          <motion.div
            key="select-account-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl shadow-2xl relative ${
              themeMode === 'dark'
                ? 'bg-[#12151d]/90 border-neutral-800/80 shadow-black/60'
                : 'bg-white/95 border-neutral-200/90 shadow-neutral-200/50'
            }`}
          >
            {/* Top Bar: Brand + Top Three-Dot Menu */}
            <div className="flex items-center justify-between pb-6">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-sm flex items-center justify-center shadow-xs">
                  {branding.app_name ? branding.app_name.charAt(0).toUpperCase() : 'Z'}
                </div>
                <span className="font-bold text-sm tracking-wider uppercase opacity-80">
                  {branding.app_name || 'Zenoa'}
                </span>
              </div>

              {/* Three-Dot Menu at the Top */}
              <div className="relative" ref={topMenuRef}>
                <button
                  id="saved-accounts-top-menu-btn"
                  onClick={() => setShowTopMenu(prev => !prev)}
                  className={`p-2 rounded-full transition-colors cursor-pointer ${
                    themeMode === 'dark' 
                      ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' 
                      : 'hover:bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                  }`}
                  title="Device Account Options"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>

                {/* Dropdown Menu right there */}
                <AnimatePresence>
                  {showTopMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className={`absolute right-0 top-9 z-50 w-56 p-1.5 rounded-2xl border shadow-xl backdrop-blur-md ${
                        themeMode === 'dark'
                          ? 'bg-[#181c26] border-neutral-700/80 text-neutral-200 shadow-black/80'
                          : 'bg-white border-neutral-200 text-neutral-800 shadow-neutral-300/60'
                      }`}
                    >
                      <button
                        id="top-menu-remove-account-btn"
                        onClick={() => {
                          setShowTopMenu(false);
                          setViewState('manage');
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                          themeMode === 'dark'
                            ? 'hover:bg-neutral-800 text-neutral-200'
                            : 'hover:bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        <Trash2 className="h-4 w-4 opacity-70" />
                        <span>Remove account from device</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Header copy */}
            <div className="text-left pb-5">
              <h1 className="text-xl font-bold tracking-tight">
                Choose an account
              </h1>
              <p className="text-xs opacity-60 mt-1">
                Tap your profile to sign in instantly without password.
              </p>
            </div>

            {/* List of Saved Accounts (Clickable for Instant 1-Tap Login) */}
            <div className="space-y-2.5">
              {savedAccounts.map((account) => {
                // Display username strictly without '@' as requested: (without @)
                const cleanUsernameWithoutAt = (account.username || '').replace(/^@/, '');
                const cleanZenoaId = account.zenoaId || `${cleanUsernameWithoutAt}@zenoa`;

                return (
                  <button
                    key={account.username}
                    id={`saved-account-card-${cleanUsernameWithoutAt}`}
                    onClick={() => onSelectAccount(account)}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-150 group cursor-pointer active:scale-[0.985] ${
                      themeMode === 'dark'
                        ? 'bg-neutral-900/60 hover:bg-neutral-800/80 border-neutral-800 hover:border-neutral-700'
                        : 'bg-neutral-50 hover:bg-neutral-100/90 border-neutral-200/80 hover:border-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="relative shrink-0">
                        {renderAvatar(
                          account.avatarSeed || cleanUsernameWithoutAt,
                          account.displayName || cleanUsernameWithoutAt,
                          account.avatarUrl,
                          'h-11 w-11 text-base shadow-xs'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold truncate">
                          {account.displayName || cleanUsernameWithoutAt}
                        </div>
                        {/* Username strictly without '@' */}
                        <div className="text-xs opacity-65 font-medium truncate mt-0.5">
                          {cleanUsernameWithoutAt}
                        </div>
                        <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-1">
                          <ShieldCheck className="h-3 w-3 shrink-0" />
                          <span className="truncate">{cleanZenoaId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pl-2">
                      <div className={`p-2 rounded-full transition-colors ${
                        themeMode === 'dark' ? 'group-hover:bg-neutral-700/60 text-neutral-400' : 'group-hover:bg-neutral-200/60 text-neutral-400'
                      }`}>
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Action: Use Another Account */}
            <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-neutral-800/70">
              <button
                id="use-another-account-btn"
                onClick={onUseAnotherAccount}
                className={`w-full py-3 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 ${
                  themeMode === 'dark'
                    ? 'border-neutral-800 hover:bg-neutral-800/80 text-neutral-300 hover:text-white'
                    : 'border-neutral-200 hover:bg-neutral-100 text-neutral-700 hover:text-neutral-900'
                }`}
              >
                <UserPlus className="h-3.5 w-3.5" />
                <span>Use another account</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* VIEW 2: REMOVE ACCOUNTS FROM DEVICE */}
        {viewState === 'manage' && (
          <motion.div
            key="manage-remove-view"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className={`w-full rounded-3xl p-6 sm:p-7 border backdrop-blur-xl shadow-2xl relative ${
              themeMode === 'dark'
                ? 'bg-[#12151d]/90 border-neutral-800/80 shadow-black/60'
                : 'bg-white/95 border-neutral-200/90 shadow-neutral-200/50'
            }`}
          >
            {/* Top Bar with Back Button */}
            <div className="flex items-center gap-3 pb-5 border-b border-neutral-100 dark:border-neutral-800/70 mb-5">
              <button
                id="manage-accounts-back-btn"
                onClick={() => {
                  setActiveAccountMenu(null);
                  setViewState('select');
                }}
                className={`p-2 -ml-2 rounded-full transition-colors cursor-pointer ${
                  themeMode === 'dark' ? 'hover:bg-neutral-800 text-neutral-300' : 'hover:bg-neutral-100 text-neutral-700'
                }`}
                title="Back"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <h2 className="text-base font-bold tracking-tight">
                  Remove account from device
                </h2>
                <p className="text-[11px] opacity-60">
                  Select an account to remove from this browser.
                </p>
              </div>
            </div>

            {/* List of Accounts with Three-Dot Menu for each account */}
            <div className="space-y-3">
              {savedAccounts.map((account) => {
                const cleanUsernameWithoutAt = (account.username || '').replace(/^@/, '');
                const isMenuOpen = activeAccountMenu === cleanUsernameWithoutAt;

                return (
                  <div
                    key={account.username}
                    className={`p-3.5 rounded-2xl border relative flex items-center justify-between transition-colors ${
                      themeMode === 'dark'
                        ? 'bg-neutral-900/40 border-neutral-800/80'
                        : 'bg-neutral-50/80 border-neutral-200/70'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0">
                        {renderAvatar(
                          account.avatarSeed || cleanUsernameWithoutAt,
                          account.displayName || cleanUsernameWithoutAt,
                          account.avatarUrl,
                          'h-10 w-10 text-sm'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold truncate">
                          {account.displayName || cleanUsernameWithoutAt}
                        </div>
                        {/* Username strictly without '@' */}
                        <div className="text-xs opacity-65 font-medium truncate">
                          {cleanUsernameWithoutAt}
                        </div>
                      </div>
                    </div>

                    {/* Three-dot menu for THIS account */}
                    <div className="relative shrink-0">
                      <button
                        id={`account-menu-trigger-${cleanUsernameWithoutAt}`}
                        onClick={() => setActiveAccountMenu(isMenuOpen ? null : cleanUsernameWithoutAt)}
                        className={`p-2 rounded-full transition-colors cursor-pointer ${
                          themeMode === 'dark' ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-200 text-neutral-500 hover:text-neutral-900'
                        }`}
                        title="Account options"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>

                      {/* Dropdown with 'Remove account' */}
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className={`absolute right-0 top-9 z-50 w-44 p-1.5 rounded-2xl border shadow-xl backdrop-blur-md ${
                              themeMode === 'dark'
                                ? 'bg-[#181c26] border-neutral-700/80 text-neutral-200 shadow-black/80'
                                : 'bg-white border-neutral-200 text-neutral-800 shadow-neutral-300/60'
                            }`}
                          >
                            <button
                              id={`confirm-remove-account-${cleanUsernameWithoutAt}`}
                              onClick={(e) => handleAccountRemove(account.username, e)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5 shrink-0" />
                              <span>Remove account</span>
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Done button */}
            <div className="pt-5 mt-4">
              <button
                onClick={() => {
                  setActiveAccountMenu(null);
                  setViewState('select');
                }}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800'
                }`}
              >
                Done
              </button>
            </div>
          </motion.div>
        )}

      </div>
    </div>
  );
};
