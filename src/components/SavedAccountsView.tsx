import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MoreVertical, UserPlus, ArrowLeft, Trash2, 
  ChevronRight, Sun, Moon, Cpu, Shield, ShieldCheck, Lock, Terminal
} from 'lucide-react';
import { SavedDeviceAccount } from '../types';
import { useBranding } from '../brandingUtils';

interface SavedAccountsViewProps {
  savedAccounts: SavedDeviceAccount[];
  onSelectAccount: (account: SavedDeviceAccount) => void;
  onRemoveAccount: (username: string) => void;
  onUseAnotherAccount: () => void;
  onBackToLanding?: () => void;
  themeMode: 'light' | 'dark';
  onToggleTheme?: () => void;
  renderAvatar: (seed?: string, name?: string, avatarUrl?: string, sizeClass?: string) => React.ReactNode;
}

export const SavedAccountsView: React.FC<SavedAccountsViewProps> = ({
  savedAccounts,
  onSelectAccount,
  onRemoveAccount,
  onUseAnotherAccount,
  onBackToLanding,
  themeMode,
  onToggleTheme,
  renderAvatar,
}) => {
  const branding = useBranding();
  const activeLogo = branding.oauth_logo || branding.public_logo || branding.messenger_logo;
  const [viewState, setViewState] = useState<'select' | 'manage'>('select');
  const [showTopMenu, setShowTopMenu] = useState<boolean>(false);
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
    onRemoveAccount(username);
  };

  return (
    <div 
      className={`min-h-[100dvh] w-full flex flex-col justify-between items-center transition-colors duration-200 font-sans relative overflow-x-hidden select-none ${
        themeMode === 'dark' 
          ? 'bg-[#090d16] text-white selection:bg-[#533afd] selection:text-white' 
          : 'bg-[#f8fafc] text-[#0d253d] selection:bg-[#533afd]/20'
      }`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif' }}
    >
      {/* 1. Base Atmospheric Mesh */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-500 opacity-90 dark:opacity-85"
        style={{
          background: themeMode === 'dark' 
            ? `radial-gradient(circle at 50% 0%, rgba(83, 58, 253, 0.16) 0%, transparent 60%),
               radial-gradient(circle at 10% 20%, rgba(28, 30, 84, 0.35) 0%, transparent 50%),
               radial-gradient(circle at 90% 40%, rgba(68, 52, 212, 0.18) 0%, transparent 50%)`
            : `radial-gradient(circle at 50% -10%, rgba(245, 233, 212, 0.75) 0%, transparent 55%),
               radial-gradient(circle at 85% 15%, rgba(185, 185, 249, 0.5) 0%, transparent 50%),
               radial-gradient(circle at 15% 30%, rgba(253, 238, 231, 0.65) 0%, transparent 45%)`
        }}
      />

      {/* 2. Cryptographic Geometric Dot Matrix Grid */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-40 dark:opacity-25 transition-opacity duration-300"
        style={{
          backgroundImage: `radial-gradient(${themeMode === 'dark' ? 'rgba(129, 140, 248, 0.3)' : 'rgba(83, 58, 253, 0.18)'} 1.2px, transparent 1.2px)`,
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 78%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 78%)'
        }}
      />

      {/* 3. Concentric Cryptographic Orbital Rings Pattern */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden opacity-30 dark:opacity-20">
        <svg className="w-[840px] h-[840px] text-[#533afd] dark:text-[#818cf8]" viewBox="0 0 800 800" fill="none">
          <circle cx="400" cy="400" r="380" stroke="currentColor" strokeWidth="1" strokeDasharray="4 8" className="opacity-30" />
          <circle cx="400" cy="400" r="285" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 12" className="opacity-45" />
          <circle cx="400" cy="400" r="190" stroke="currentColor" strokeWidth="1" strokeDasharray="3 6" className="opacity-60" />
          <circle cx="400" cy="400" r="100" stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 4" className="opacity-70" />
          <line x1="400" y1="12" x2="400" y2="35" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
          <line x1="400" y1="765" x2="400" y2="788" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
          <line x1="12" y1="400" x2="35" y2="400" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
          <line x1="765" y1="400" x2="788" y2="400" stroke="currentColor" strokeWidth="1.5" className="opacity-60" />
          <circle cx="400" cy="115" r="3" fill="currentColor" className="opacity-70" />
          <circle cx="685" cy="400" r="3" fill="currentColor" className="opacity-70" />
          <circle cx="400" cy="685" r="3" fill="currentColor" className="opacity-70" />
          <circle cx="115" cy="400" r="3" fill="currentColor" className="opacity-70" />
        </svg>
      </div>

      {/* 4. Ambient Multi-Hue Soft Color Discs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-[460px] h-[460px] rounded-full blur-[130px] bg-[#f5e9d4]/60 dark:bg-[#4434d4]/15 pointer-events-none" />
        <div className="absolute top-1/4 -right-24 w-[480px] h-[480px] rounded-full blur-[140px] bg-[#533afd]/15 dark:bg-[#533afd]/20 pointer-events-none" />
        <div className="absolute -bottom-24 left-1/4 w-[500px] h-[500px] rounded-full blur-[130px] bg-[#b9b9f9]/30 dark:bg-[#1c1e54]/30 pointer-events-none" />
      </div>

      {/* 5. Desktop Marginal Telemetry Badges */}
      <div className="hidden xl:flex fixed left-8 2xl:left-12 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none z-10">
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono text-[#64748d] dark:text-[#94a3b8]">Vault:</span>
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">AES-256-GCM</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Cpu className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8] shrink-0" />
          <span className="font-mono text-[#64748d] dark:text-[#94a3b8]">Handshake:</span>
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">X25519 Curve</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Shield className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
          <span className="font-mono text-[#64748d] dark:text-[#94a3b8]">Relay:</span>
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">0ms Ephemeral</span>
        </div>
      </div>

      <div className="hidden xl:flex fixed right-8 2xl:right-12 top-1/2 -translate-y-1/2 flex-col gap-3 pointer-events-none z-10">
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <ShieldCheck className="h-3.5 w-3.5 text-[#533afd] dark:text-[#818cf8] shrink-0" />
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">Zero-Knowledge</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Lock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">Client-Side Keys</span>
        </div>
        <div className="px-3.5 py-2 rounded-2xl border border-[#e3e8ee]/80 dark:border-[#273951]/80 bg-white/70 dark:bg-[#121624]/70 backdrop-blur-md text-[12px] flex items-center gap-2.5 shadow-xs">
          <Terminal className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-mono font-medium text-[#0d253d] dark:text-white">IndexedDB Vault</span>
        </div>
      </div>

      {/* PERSISTENT TOP HEADER (Theme Toggle on Right) */}
      <header className="fixed top-0 left-0 right-0 z-30 w-full px-5 sm:px-10 py-4 sm:py-5 flex items-center justify-end pointer-events-none">
        {/* Right: Theme Toggle */}
        <div className="flex items-center pointer-events-auto">
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white hover:bg-[#f6f9fc] dark:hover:bg-[#1c1e54]/50 border border-[#e3e8ee] dark:border-[#273951] bg-white/80 dark:bg-[#121624]/80 backdrop-blur-md transition-all cursor-pointer shadow-xs"
              title="Toggle theme"
            >
              {themeMode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4" />}
            </button>
          )}
        </div>
      </header>

      {/* FULLSCREEN VERTICALLY CENTERED CONTENT VIEWPORT */}
      <main className="relative z-10 w-full flex-1 flex flex-col justify-center items-center px-4 sm:px-6 md:px-8 pt-24 pb-16">
        <div className="w-full max-w-[490px] mx-auto bg-white/80 dark:bg-[#0f1422]/85 backdrop-blur-xl border border-[#e3e8ee] dark:border-[#273951]/80 rounded-3xl p-6 sm:p-9 shadow-[0_20px_50px_-15px_rgba(13,37,61,0.07)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.6)] relative z-20 transition-all">
          
          {/* VIEW 1: ONE-TAP ACCOUNT SELECTION */}
          {viewState === 'select' && (
            <motion.div
              key="select-account-view"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              {/* Top Bar: Clean ZENOA Wordmark + Logo & Three-Dot Options Menu */}
              <div className="flex items-center justify-between pb-6 mb-6 border-b border-[#e3e8ee]/80 dark:border-[#273951]/80">
                <div className="flex items-center gap-2.5 select-none">
                  <div className="h-8 w-8 rounded-full bg-[#533afd] text-white font-bold text-xs sm:text-sm flex items-center justify-center shadow-[0_1px_3px_rgba(0,55,112,0.2)] overflow-hidden">
                    {activeLogo ? (
                      <img src={activeLogo} alt="Logo" className="h-full w-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      <span className="font-bold text-xs tracking-tight">Z</span>
                    )}
                  </div>
                  <span className="font-sf-pro font-black text-[19px] sm:text-[21px] tracking-[0.06em] uppercase text-[#0d253d] dark:text-white leading-none">
                    ZENOA
                  </span>
                </div>

                {/* Device Account Options Menu */}
                <div className="relative" ref={topMenuRef}>
                  <button
                    id="saved-accounts-top-menu-btn"
                    type="button"
                    onClick={() => setShowTopMenu(prev => !prev)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white hover:bg-[#f6f9fc] dark:hover:bg-[#1c2e42] transition-colors cursor-pointer border border-transparent hover:border-[#e3e8ee] dark:hover:border-[#273951]"
                    title="Account options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {showTopMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 top-10 z-50 w-56 p-1.5 rounded-2xl border border-[#e3e8ee] dark:border-[#273951] bg-white dark:bg-[#121624] shadow-xl backdrop-blur-md"
                      >
                        <button
                          id="top-menu-remove-account-btn"
                          type="button"
                          onClick={() => {
                            setShowTopMenu(false);
                            setViewState('manage');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium text-left transition-colors cursor-pointer text-[#0d253d] dark:text-white hover:bg-[#f6f9fc] dark:hover:bg-[#1c2e42]"
                        >
                          <Trash2 className="h-4 w-4 text-rose-500 shrink-0" />
                          <span>Remove account from device</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Confident Headline */}
              <div className="mb-7">
                <h1 className="text-[28px] sm:text-[32px] font-medium tracking-tight text-[#0d253d] dark:text-white leading-[1.15]">
                  Choose an account
                </h1>
                <p className="text-[14px] sm:text-[15px] text-[#64748d] dark:text-[#94a3b8] font-normal leading-relaxed mt-2">
                  Tap your profile to sign in instantly without entering a password.
                </p>
              </div>

              {/* List of Saved Accounts (Strictly Clean Name & Username with Great Typography - NO Zenoa ID) */}
              <div className="space-y-3">
                {savedAccounts.map((account) => {
                  const cleanUsernameWithoutAt = (account.username || '').replace(/^@/, '');
                  const displayName = account.displayName?.trim() || cleanUsernameWithoutAt;

                  return (
                    <button
                      key={account.username}
                      id={`saved-account-card-${cleanUsernameWithoutAt}`}
                      type="button"
                      onClick={() => onSelectAccount(account)}
                      className="w-full p-3.5 sm:p-4 rounded-2xl border border-[#e3e8ee] dark:border-[#273951] bg-white/70 dark:bg-[#121624]/70 hover:bg-[#533afd]/5 dark:hover:bg-[#533afd]/10 hover:border-[#533afd]/30 dark:hover:border-[#818cf8]/30 text-left flex items-center justify-between transition-all duration-200 group cursor-pointer shadow-xs active:scale-[0.985]"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="relative shrink-0 transition-transform group-hover:scale-105">
                          {renderAvatar(
                            account.avatarSeed || cleanUsernameWithoutAt,
                            displayName,
                            account.avatarUrl,
                            'h-12 w-12 text-base rounded-2xl shadow-xs'
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="text-[15px] sm:text-[16px] font-semibold text-[#0d253d] dark:text-white truncate tracking-tight">
                            {displayName}
                          </div>
                          <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] font-normal truncate mt-0.5">
                            @{cleanUsernameWithoutAt}
                          </div>
                        </div>
                      </div>

                      <div className="pl-3 shrink-0">
                        <div className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] dark:text-[#94a3b8] group-hover:text-[#533afd] dark:group-hover:text-[#818cf8] group-hover:bg-[#533afd]/10 transition-colors">
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action: Use Another Account (Clean, No Back to Home button at the bottom) */}
              <div className="pt-6 mt-6 border-t border-[#e3e8ee]/80 dark:border-[#273951]/80">
                <button
                  id="use-another-account-btn"
                  type="button"
                  onClick={onUseAnotherAccount}
                  className="w-full py-3.5 px-4 rounded-xl border border-[#e3e8ee] dark:border-[#273951] bg-white/70 dark:bg-[#121624]/70 hover:bg-[#533afd]/5 dark:hover:bg-[#533afd]/10 text-[14px] font-medium text-[#0d253d] dark:text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-[0.985]"
                >
                  <UserPlus className="h-4 w-4 text-[#533afd] dark:text-[#818cf8]" />
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
              className="w-full"
            >
              {/* Top Bar with Back Button */}
              <div className="flex items-center gap-3 pb-5 border-b border-[#e3e8ee]/80 dark:border-[#273951]/80 mb-5">
                <button
                  id="manage-accounts-back-btn"
                  type="button"
                  onClick={() => setViewState('select')}
                  className="h-8 w-8 rounded-full flex items-center justify-center text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white hover:bg-[#f6f9fc] dark:hover:bg-[#1c2e42] transition-colors cursor-pointer border border-[#e3e8ee] dark:border-[#273951]"
                  title="Back to account selection"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div>
                  <h2 className="text-[17px] font-semibold text-[#0d253d] dark:text-white tracking-tight">
                    Remove account from device
                  </h2>
                  <p className="text-[12px] text-[#64748d] dark:text-[#94a3b8]">
                    Select an account to remove from this browser.
                  </p>
                </div>
              </div>

              {/* List of Accounts with Direct Remove Action (No Zenoa ID) */}
              <div className="space-y-3">
                {savedAccounts.map((account) => {
                  const cleanUsernameWithoutAt = (account.username || '').replace(/^@/, '');
                  const displayName = account.displayName?.trim() || cleanUsernameWithoutAt;

                  return (
                    <div
                      key={account.username}
                      className="p-3.5 sm:p-4 rounded-2xl border border-[#e3e8ee] dark:border-[#273951] bg-white/70 dark:bg-[#121624]/70 flex items-center justify-between transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="shrink-0">
                          {renderAvatar(
                            account.avatarSeed || cleanUsernameWithoutAt,
                            displayName,
                            account.avatarUrl,
                            'h-11 w-11 text-sm rounded-2xl'
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-[15px] font-semibold text-[#0d253d] dark:text-white truncate">
                            {displayName}
                          </div>
                          <div className="text-[13px] text-[#64748d] dark:text-[#94a3b8] font-normal truncate mt-0.5">
                            @{cleanUsernameWithoutAt}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 pl-3">
                        <button
                          id={`confirm-remove-account-${cleanUsernameWithoutAt}`}
                          type="button"
                          onClick={(e) => handleAccountRemove(account.username, e)}
                          className="h-8 px-3 rounded-xl text-[12px] font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-1.5 transition-colors cursor-pointer"
                          title="Remove from device"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Done Button */}
              <div className="pt-5 mt-5 border-t border-[#e3e8ee]/80 dark:border-[#273951]/80">
                <button
                  type="button"
                  onClick={() => setViewState('select')}
                  className="w-full py-3 px-4 rounded-xl text-[13px] font-medium text-[#0d253d] dark:text-white bg-[#f6f9fc] dark:bg-[#1c2e42] hover:bg-[#e3e8ee] dark:hover:bg-[#273951] transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </main>
    </div>
  );
};
