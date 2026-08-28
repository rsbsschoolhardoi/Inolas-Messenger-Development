import React, { useState, useEffect } from 'react';
import { GoogleDriveLogo } from './GoogleDriveLogo';
import { VaultPasswordModal } from './VaultPasswordModal';
import {
  Palette,
  Bell,
  Lock,
  MessageSquare,
  Shield,
  PhoneCall,
  ChevronRight,
  ArrowLeft,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Eye,
  EyeOff,
  Download,
  Trash2,
  LogOut,
  Sparkles,
  Smartphone,
  Type,
  Check,
  Edit2,
  Database,
  HardDrive,
  RefreshCw,
  Zap,
  CheckCircle2,
  Sliders,
  Cloud,
  Upload,
  Mail,
  User,
  Copy
} from 'lucide-react';
import { storageManager, StorageEstimateInfo } from '../storageManager';

interface SettingsPageProps {
  themeMode: 'light' | 'dark';
  changeTheme: (theme: 'light' | 'dark') => void;
  chatColorTheme: string;
  setChatColorTheme: (theme: any) => void;
  activeFontSize: 'sm' | 'md' | 'lg';
  setActiveFontSize: (size: 'sm' | 'md' | 'lg') => void;
  chatBubbleStyle: 'modern' | 'minimal' | 'playful';
  setChatBubbleStyle: (style: 'modern' | 'minimal' | 'playful') => void;
  notificationsSound: boolean;
  setNotificationsSound: (v: boolean) => void;
  previewTextInNotif: boolean;
  setPreviewTextInNotif: (v: boolean) => void;
  privacyLastSeen: 'everyone' | 'contacts' | 'nobody';
  setPrivacyLastSeen: (v: 'everyone' | 'contacts' | 'nobody') => void;
  privacyReadReceipts: boolean;
  setPrivacyReadReceipts: (v: boolean) => void;
  privacyOnlineStatus: 'everyone' | 'contacts' | 'nobody';
  setPrivacyOnlineStatus: (v: 'everyone' | 'contacts' | 'nobody') => void;
  twoFactorAuth: boolean;
  setTwoFactorAuth: (v: boolean) => void;
  blockedUsers: string[];
  handleToggleBlockUser: (username: string) => void;
  enterToSend: boolean;
  setEnterToSend: (v: boolean) => void;
  autoDownloadMedia: boolean;
  setAutoDownloadMedia: (v: boolean) => void;
  mediaUploadQuality?: 'hd' | 'standard' | 'data_saver';
  setMediaUploadQuality?: (v: 'hd' | 'standard' | 'data_saver') => void;
  handleClearActiveChatHistory: () => void;
  handleResetLocalCache: () => void;
  handleExportChatData: () => void;
  handleLogout: () => void;
  callDataSaver: boolean;
  setCallDataSaver: (v: boolean) => void;
  noiseSuppression: boolean;
  setNoiseSuppression: (v: boolean) => void;
  isAccountPrivate: boolean;
  setIsAccountPrivate: (v: boolean) => void;
  showToast: (msg: string) => void;
  userDisplayName: string;
  userUsername: string;
  userAvatarSeed: string;
  userAvatarUrl?: string;
  userEmail?: string;
  userUid?: string;
  userPhone?: string;
  authMethod?: string;
  renderAvatar: (seed?: string, name?: string, url?: string, sizeClasses?: string) => React.ReactNode;
  onOpenEditProfile: () => void;
  isDriveConnected: boolean;
  isBackingUp: boolean;
  isRestoring: boolean;
  lastBackupDate: string | null;
  onConnectDrive: () => void;
  onDisconnectDrive: () => void;
  onBackupToDrive: (password: string) => void;
  onRestoreFromDrive: (password: string) => void;
  onDeleteBackupFromDrive: (password: string) => void;
}

type SettingsSection = 'main' | 'appearance' | 'notifications' | 'privacy' | 'chats' | 'storage' | 'account' | 'calls' | 'private_account';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  themeMode,
  changeTheme,
  chatColorTheme,
  setChatColorTheme,
  activeFontSize,
  setActiveFontSize,
  chatBubbleStyle,
  setChatBubbleStyle,
  notificationsSound,
  setNotificationsSound,
  previewTextInNotif,
  setPreviewTextInNotif,
  privacyLastSeen,
  setPrivacyLastSeen,
  privacyReadReceipts,
  setPrivacyReadReceipts,
  privacyOnlineStatus,
  setPrivacyOnlineStatus,
  twoFactorAuth,
  setTwoFactorAuth,
  blockedUsers,
  handleToggleBlockUser,
  enterToSend,
  setEnterToSend,
  autoDownloadMedia,
  setAutoDownloadMedia,
  handleClearActiveChatHistory,
  handleResetLocalCache,
  handleExportChatData,
  handleLogout,
  callDataSaver,
  setCallDataSaver,
  noiseSuppression,
  setNoiseSuppression,
  isAccountPrivate,
  setIsAccountPrivate,
  mediaUploadQuality,
  setMediaUploadQuality,
  showToast,
  userDisplayName,
  userUsername,
  userAvatarSeed,
  userAvatarUrl,
  userEmail,
  userUid,
  userPhone,
  authMethod,
  renderAvatar,
  onOpenEditProfile,
  isDriveConnected,
  isBackingUp,
  isRestoring,
  lastBackupDate,
  onConnectDrive,
  onDisconnectDrive,
  onBackupToDrive,
  onRestoreFromDrive,
  onDeleteBackupFromDrive,
}) => {
  const [section, setSection] = useState<SettingsSection>('main');
  const [storageInfo, setStorageInfo] = useState<StorageEstimateInfo | null>(null);
  const [isCleaningStorage, setIsCleaningStorage] = useState<boolean>(false);
  const [pendingPrivacyState, setPendingPrivacyState] = useState<boolean | null>(null);
  const [copiedUid, setCopiedUid] = useState<boolean>(false);
  const [vaultPassword, setVaultPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState<boolean>(false);
  const [passwordModalAction, setPasswordModalAction] = useState<'backup' | 'restore' | 'delete'>('backup');
  const [hasSavedPassword, setHasSavedPassword] = useState<boolean>(() => {
    return localStorage.getItem('zenoa_has_master_password') === 'true';
  });

  const handlePasswordModalSubmit = (pwd: string) => {
    localStorage.setItem('zenoa_has_master_password', 'true');
    setHasSavedPassword(true);
    setPasswordModalOpen(false);

    if (passwordModalAction === 'backup') {
      onBackupToDrive(pwd);
    } else if (passwordModalAction === 'restore') {
      onRestoreFromDrive(pwd);
    } else if (passwordModalAction === 'delete') {
      onDeleteBackupFromDrive(pwd);
    }
  };

  const refreshStorageStats = async () => {
    try {
      const info = await storageManager.getStorageEstimate();
      setStorageInfo(info);
    } catch (e) {
      console.warn("Storage stats fetch error:", e);
    }
  };

  useEffect(() => {
    refreshStorageStats();
  }, [section]);

  const handleClearCachedMediaAction = async () => {
    setIsCleaningStorage(true);
    try {
      const count = await storageManager.clearMediaCache();
      showToast(`Cleared ${count} cached media items`);
      await refreshStorageStats();
    } catch {
      showToast('Media cache cleared');
    } finally {
      setIsCleaningStorage(false);
    }
  };

  const handleOptimizeStorageAction = async () => {
    setIsCleaningStorage(true);
    try {
      handleResetLocalCache();
      await refreshStorageStats();
      showToast('Storage optimized successfully');
    } finally {
      setIsCleaningStorage(false);
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950 transition-colors pb-24 md:pb-8 overscroll-contain">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-10 backdrop-blur-md bg-white/85 dark:bg-neutral-900/85 border-b border-neutral-200/80 dark:border-neutral-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {section !== 'main' && (
            <button
              onClick={() => setSection('main')}
              className="p-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <div>
            <h1 className="text-base md:text-lg font-bold text-neutral-900 dark:text-white capitalize">
              {section === 'main' 
                ? 'Settings & Preferences' 
                : section === 'private_account' 
                  ? 'Private Account' 
                  : section}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {section === 'main' 
                ? 'Manage your account, privacy, and preferences' 
                : section === 'private_account'
                  ? 'Manage account visibility and access control'
                  : `Customize your ${section} settings`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Toggle theme"
          >
            {themeMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Main Settings Directory */}
        {section === 'main' && (
          <div className="space-y-6 animate-fade-in">
            {/* 1. TOP ITEM: USER PROFILE CARD (REDESIGNED) */}
            <div className="relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
              <div className="h-24 w-full bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 relative p-4 flex justify-between items-start">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
                <span className="relative z-10 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/10 dark:bg-black/30 backdrop-blur-md text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {isAccountPrivate ? 'Private Profile' : 'Public Profile'}
                </span>
                <button
                  onClick={onOpenEditProfile}
                  className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 text-xs font-bold"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <div className="px-6 pb-6 pt-0 relative flex flex-col sm:flex-row items-center sm:items-end justify-between gap-4 -mt-10">
                <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left min-w-0">
                  <div className="p-1.5 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-2xl shrink-0">
                    {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-20 w-20 text-2xl border-4 border-white dark:border-neutral-900')}
                  </div>
                  <div className="min-w-0 pb-1">
                    <h3 className="font-black text-xl text-neutral-900 dark:text-white truncate flex items-center justify-center sm:justify-start gap-1.5">
                      <span>{userDisplayName}</span>
                      <CheckCircle2 className="h-4 w-4 text-indigo-500 shrink-0 fill-indigo-500/10" />
                    </h3>
                    <p className="text-xs font-mono font-semibold text-neutral-400 truncate">@{userUsername}</p>
                  </div>
                </div>

                <button
                  onClick={onOpenEditProfile}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shrink-0 shadow-md active:scale-98"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  <span>Customize Profile</span>
                </button>
              </div>
            </div>

            {/* Stands standalone Account option card right below the Profile card */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-sm">
              <button
                onClick={() => setSection('account')}
                className="w-full p-4.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-neutral-900 dark:text-white">Account</p>
                    <p className="text-xs text-neutral-400">View and manage your connected credentials and profile details</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400" />
              </button>
            </div>

            {/* Category Groups */}
            <div className="space-y-3">
              <p className="text-xs uppercase font-bold tracking-wider text-neutral-400 px-1">Preferences</p>
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800/60 shadow-sm">
                
                {/* Appearance */}
                <button
                  onClick={() => setSection('appearance')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <Palette className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Appearance & Theme</p>
                      <p className="text-xs text-neutral-400">Color schemes, typography, message bubble styling</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

                {/* Notifications */}
                <button
                  onClick={() => setSection('notifications')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <Bell className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Notifications & Sounds</p>
                      <p className="text-xs text-neutral-400">Alert tones, previews, message sounds</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

                {/* Private Account (Dedicated Section) */}
                <button
                  onClick={() => setSection('private_account')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Private Account</p>
                      <p className="text-xs text-neutral-400">
                        {isAccountPrivate ? 'Enabled · Followers must be approved' : 'Disabled · Profile is visible to everyone'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      isAccountPrivate 
                        ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                    }`}>
                      {isAccountPrivate ? 'Private' : 'Public'}
                    </span>
                    <ChevronRight className="h-4 w-4 text-neutral-400" />
                  </div>
                </button>

                {/* Privacy & Security */}
                <button
                  onClick={() => setSection('privacy')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Privacy & Security</p>
                      <p className="text-xs text-neutral-400">End-to-end encryption, read receipts, blocked users</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

                {/* Chats & Storage */}
                <button
                  onClick={() => setSection('chats')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Chats & Storage</p>
                      <p className="text-xs text-neutral-400">Media auto-download, enter key, storage management</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

              </div>
            </div>
          </div>
        )}

        {/* SECTION: APPEARANCE */}
        {section === 'appearance' && (
          <div className="space-y-6 animate-fade-in">
            {/* Theme mode */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Theme Mode</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => changeTheme('light')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Sun className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-xs font-bold">Light</span>
                </button>
                <button
                  onClick={() => changeTheme('dark')}
                  className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                      : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400'
                  }`}
                >
                  <Moon className="h-5 w-5 text-neutral-700 dark:text-neutral-300" />
                  <span className="text-xs font-bold">Dark</span>
                </button>
              </div>
            </div>

            {/* Accent Theme */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Chat Accent Color</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'slate', name: 'Monochrome', color: 'bg-neutral-900 dark:bg-white' },
                  { id: 'indigo', name: 'Indigo Night', color: 'bg-indigo-600' },
                  { id: 'emerald', name: 'Emerald', color: 'bg-emerald-600' },
                  { id: 'rose', name: 'Rose', color: 'bg-rose-500' },
                  { id: 'amber', name: 'Amber', color: 'bg-amber-500' },
                  { id: 'violet', name: 'Violet', color: 'bg-purple-600' },
                  { id: 'ocean', name: 'Ocean', color: 'bg-cyan-600' },
                ].map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      setChatColorTheme(th.id);
                      showToast(`Accent set to ${th.name}`);
                    }}
                    className={`p-3 rounded-2xl border flex items-center gap-2.5 transition-all cursor-pointer ${
                      chatColorTheme === th.id
                        ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-bold'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${th.color} shrink-0 border border-black/10 dark:border-white/10`}></span>
                    <span className="text-xs font-semibold truncate">{th.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Font Size & Bubble Style */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Chat Text Size</h3>
                  <p className="text-xs text-neutral-400">Scale message text for comfortable reading</p>
                </div>
                <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  {(['sm', 'md', 'lg'] as const).map((sz) => (
                    <button
                      key={sz}
                      onClick={() => setActiveFontSize(sz)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                        activeFontSize === sz ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Bubble Shape</h3>
                  <p className="text-xs text-neutral-400">Choose message corner curvature</p>
                </div>
                <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl">
                  {(['modern', 'minimal', 'playful'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setChatBubbleStyle(st)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                        chatBubbleStyle === st ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-xs' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: NOTIFICATIONS */}
        {section === 'notifications' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Notification Sounds</h3>
                  <p className="text-xs text-neutral-400">Play chime audio when new messages arrive</p>
                </div>
                <input
                  type="checkbox"
                  checked={notificationsSound}
                  onChange={() => {
                    setNotificationsSound(!notificationsSound);
                    showToast(`Notification sound ${!notificationsSound ? 'enabled' : 'disabled'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Message Preview</h3>
                  <p className="text-xs text-neutral-400">Show message text preview in toasts and push alerts</p>
                </div>
                <input
                  type="checkbox"
                  checked={previewTextInNotif}
                  onChange={() => {
                    setPreviewTextInNotif(!previewTextInNotif);
                    showToast(`Previews ${!previewTextInNotif ? 'enabled' : 'hidden'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        
        {/* SECTION: PRIVATE ACCOUNT */}
        {section === 'private_account' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50">
                    <Lock className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Account Privacy</h3>
                    <p className="text-xs text-neutral-400">Manage who can see your profile and connect with you</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isAccountPrivate 
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700/60'
                }`}>
                  {isAccountPrivate ? 'Private' : 'Public'}
                </span>
              </div>

              <div className="space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Select Visibility
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Public Option */}
                  <div 
                    onClick={() => {
                      if (isAccountPrivate) {
                        setPendingPrivacyState(false);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      !isAccountPrivate 
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 shadow-xs' 
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">Public</span>
                        </div>
                        {!isAccountPrivate && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Your profile is visible to all users. Anyone can follow you and send direct messages without approval.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={!isAccountPrivate}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAccountPrivate) setPendingPrivacyState(false);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        !isAccountPrivate 
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {!isAccountPrivate ? 'Active' : 'Switch to Public'}
                    </button>
                  </div>

                  {/* Private Option */}
                  <div 
                    onClick={() => {
                      if (!isAccountPrivate) {
                        setPendingPrivacyState(true);
                      }
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                      isAccountPrivate 
                        ? 'border-neutral-900 dark:border-white bg-neutral-50 dark:bg-neutral-800/60 shadow-xs' 
                        : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                          <span className="font-bold text-sm text-neutral-900 dark:text-white">Private</span>
                        </div>
                        {isAccountPrivate && (
                          <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Only approved followers can view your profile and media. New followers must send a request.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={isAccountPrivate}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isAccountPrivate) setPendingPrivacyState(true);
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isAccountPrivate 
                          ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-2xs' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {isAccountPrivate ? 'Active' : 'Switch to Private'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: PRIVACY */}
        {section === 'privacy' && (
          <div className="space-y-6 animate-fade-in">
            {/* E2EE Info banner */}
            <div className="p-4 rounded-3xl bg-neutral-100/80 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-center space-y-1.5">
              <div className="flex items-center justify-center gap-1.5 text-neutral-900 dark:text-white font-bold text-xs">
                <Lock className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                <span>Zero-Knowledge End-to-End Encryption</span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300 font-medium">
                Your conversations are encrypted directly on your device. Third parties and external entities cannot read your messages — not even Zenoa.
              </p>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Read Receipts (Delivery Ticks)</h3>
                  <p className="text-xs text-neutral-400">Let senders know when you have read their messages</p>
                </div>
                <input
                  type="checkbox"
                  checked={privacyReadReceipts}
                  onChange={() => {
                    setPrivacyReadReceipts(!privacyReadReceipts);
                    showToast(`Read receipts ${!privacyReadReceipts ? 'enabled' : 'disabled'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Two-Factor Authentication</h3>
                  <p className="text-xs text-neutral-400">Extra security layer during account login</p>
                </div>
                <input
                  type="checkbox"
                  checked={twoFactorAuth}
                  onChange={() => {
                    setTwoFactorAuth(!twoFactorAuth);
                    showToast(`2FA ${!twoFactorAuth ? 'enabled' : 'disabled'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              {/* Account Privacy Row (navigates to dedicated section) */}
              <div 
                onClick={() => setSection('private_account')}
                className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between cursor-pointer group"
              >
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                    Account Privacy
                  </h3>
                  <p className="text-xs text-neutral-400">
                    {isAccountPrivate ? 'Private · Only approved followers can view profile' : 'Public · Anyone can view profile'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                    isAccountPrivate 
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900' 
                      : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {isAccountPrivate ? 'Private' : 'Public'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>

              {/* Blocked Users */}
              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 space-y-2.5">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Blocked Accounts ({blockedUsers.length})</h3>
                {blockedUsers.length === 0 ? (
                  <p className="text-xs text-neutral-400">No users blocked.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {blockedUsers.map((u) => (
                      <div key={u} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold">
                        <span>@{u}</span>
                        <button
                          onClick={() => handleToggleBlockUser(u)}
                          className="text-neutral-500 hover:text-rose-500 font-bold ml-1 cursor-pointer transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* SECTION: CHATS */}
        {section === 'chats' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Enter Key to Send</h3>
                  <p className="text-xs text-neutral-400">Pressing Enter immediately sends message</p>
                </div>
                <input
                  type="checkbox"
                  checked={enterToSend}
                  onChange={() => setEnterToSend(!enterToSend)}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Auto-Download Media</h3>
                  <p className="text-xs text-neutral-400">Cache incoming media files automatically</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoDownloadMedia}
                  onChange={() => setAutoDownloadMedia(!autoDownloadMedia)}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-wrap gap-2.5">
                <button
                  onClick={handleClearActiveChatHistory}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-white transition-colors cursor-pointer"
                >
                  Clear Current Chat
                </button>
                <button
                  onClick={handleResetLocalCache}
                  className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-white transition-colors cursor-pointer"
                >
                  Clear Local Cache
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: STORAGE & DATA */}
        {section === 'storage' && (
          <div className="space-y-6 animate-fade-in">
            {/* Storage Quota Gauge */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Device Storage Utilization</h3>
                    <p className="text-xs text-neutral-400">High-capacity IndexedDB engine active</p>
                  </div>
                </div>
                <button
                  onClick={refreshStorageStats}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors cursor-pointer"
                  title="Refresh storage statistics"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-extrabold text-neutral-900 dark:text-white">
                    {storageInfo?.usageFormatted || '0 B'}
                  </span>
                  <span className="text-xs font-semibold text-neutral-400">
                    of {storageInfo?.quotaFormatted || '50.0 GB'} available
                  </span>
                </div>
                <div className="h-2.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-500"
                    style={{ width: `${Math.max(2, Math.min(100, storageInfo?.percentUsed || 1))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-neutral-400 font-medium pt-1">
                  <span>{storageInfo?.percentUsed || 0.1}% used</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Virtually unlimited local space</span>
                </div>
              </div>

              {/* Breakdown Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[11px] font-medium text-neutral-400">Messages Stored</p>
                  <p className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    {storageInfo?.messageCount || 0}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[11px] font-medium text-neutral-400">Media Cache</p>
                  <p className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    {storageInfo?.mediaCount || 0} files
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-100 dark:border-neutral-800">
                  <p className="text-[11px] font-medium text-neutral-400">Space Saved (Avg)</p>
                  <p className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    ~82% Compressed
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Media Compression Settings */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Smart Media Compression</h3>
              </div>
              <p className="text-xs text-neutral-400">
                Automatically optimize photos, voice notes, and media before transmission to drastically expand available capacity.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'standard' as const,
                    title: 'Standard (Recommended)',
                    badge: '80% Saved',
                    desc: 'Optimized 1280px WebP, imperceptible compression'
                  },
                  {
                    id: 'hd' as const,
                    title: 'HD Crisp',
                    badge: '40% Saved',
                    desc: '1920px Full HD resolution with high bitrate'
                  },
                  {
                    id: 'data_saver' as const,
                    title: 'Ultra Data Saver',
                    badge: '90% Saved',
                    desc: 'Ultra lightweight, minimal data usage'
                  }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => {
                      if (setMediaUploadQuality) {
                        setMediaUploadQuality(mode.id);
                        showToast(`Media quality set to ${mode.title}`);
                      }
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                      (mediaUploadQuality || 'standard') === mode.id
                        ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white'
                        : 'border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900 dark:text-white">{mode.title}</span>
                      {(mediaUploadQuality || 'standard') === mode.id && (
                        <CheckCircle2 className="h-4 w-4 text-neutral-900 dark:text-white shrink-0" />
                      )}
                    </div>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                      {mode.badge}
                    </span>
                    <p className="text-[11px] text-neutral-400 mt-1.5">{mode.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Management & Cleanup Tools */}
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Storage Optimization Tools</h3>
              <p className="text-xs text-neutral-400">
                Safely manage cached files and reclaim disk space without losing chat history.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={handleClearCachedMediaAction}
                  disabled={isCleaningStorage}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Clear Cached Media Files</span>
                </button>

                <button
                  onClick={handleOptimizeStorageAction}
                  disabled={isCleaningStorage}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-xs font-bold text-white dark:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Optimize & Compact Database</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SECTION: CALLS & AUDIO */}
        {section === 'calls' && (
          <div className="space-y-6 animate-fade-in">
            <div className="p-5 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Call Data Saver</h3>
                  <p className="text-xs text-neutral-400">Reduce data consumed during audio calls</p>
                </div>
                <input
                  type="checkbox"
                  checked={callDataSaver}
                  onChange={() => {
                    setCallDataSaver(!callDataSaver);
                    showToast(`Call data saver ${!callDataSaver ? 'enabled' : 'disabled'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>

              <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Background Noise Suppression</h3>
                  <p className="text-xs text-neutral-400">Filter microphone background noise during voice recording</p>
                </div>
                <input
                  type="checkbox"
                  checked={noiseSuppression}
                  onChange={() => {
                    setNoiseSuppression(!noiseSuppression);
                    showToast(`Noise suppression ${!noiseSuppression ? 'active' : 'inactive'}`);
                  }}
                  className="h-4 w-4 accent-neutral-900 dark:accent-white border-neutral-300 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: ACCOUNT */}
        {section === 'account' && (
          <div className="space-y-6 animate-fade-in">
            {/* Professional Account Card */}
            <div className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-neutral-150 dark:border-neutral-800/80 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/40 dark:border-neutral-700/40">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-bold text-neutral-900 dark:text-white">Account Details</h2>
                  <p className="text-xs text-neutral-400">View and manage your connected credentials</p>
                </div>
              </div>

              {/* Account details body */}
              <div className="p-5 space-y-5">
                {/* Profile Information */}
                <div className="flex items-center gap-3.5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/20 border border-neutral-200/40 dark:border-neutral-800/40">
                  {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-12 w-12 text-sm border border-neutral-200 dark:border-neutral-700')}
                  <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Connected Identity</p>
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white truncate">{userDisplayName}</h4>
                    <p className="text-xs font-mono text-neutral-400 mt-0.5">@{userUsername}</p>
                  </div>
                </div>

                {/* Primary Credentials Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Email address */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-150 dark:border-neutral-800/40 text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Email Address</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                      {userEmail || 'Not available'}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-150 dark:border-neutral-800/40 text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Phone Number</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                      {userPhone || 'Not Connected'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      <VaultPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmit={handlePasswordModalSubmit}
        actionType={passwordModalAction}
        hasExistingPassword={hasSavedPassword}
        isLoading={isBackingUp || isRestoring}
        userEmail={userEmail}
        userUid={userUid}
        onPasswordResetComplete={(newPwd) => {
          handlePasswordModalSubmit(newPwd);
        }}
      />

      {/* Privacy Change Confirmation Modal */}
      {pendingPrivacyState !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 space-y-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white">
                {pendingPrivacyState ? <Lock className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </div>
              <div>
                <h3 className="font-bold text-lg text-neutral-900 dark:text-white">
                  Switch to {pendingPrivacyState ? 'Private' : 'Public'} Account?
                </h3>
                <p className="text-xs text-neutral-500">Please review what changes when you update your visibility.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/80 dark:border-neutral-700/80 space-y-2.5 text-xs text-neutral-700 dark:text-neutral-300">
              {pendingPrivacyState ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">•</span>
                    <p>Only people you approve will be able to view your profile details, followers, and following lists.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">•</span>
                    <p>New users must send a follow request to connect with you or view your profile.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">•</span>
                    <p>Existing followers and active conversations will remain unaffected.</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">•</span>
                    <p>Anyone on Zenoa will be able to view your profile details and send you direct messages.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-neutral-900 dark:text-white">•</span>
                    <p>Any pending follow requests will be automatically accepted.</p>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setPendingPrivacyState(null)}
                className="flex-1 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 font-bold text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsAccountPrivate(pendingPrivacyState);
                  showToast(`Account is now ${pendingPrivacyState ? 'Private' : 'Public'}`);
                  setPendingPrivacyState(null);
                }}
                className="flex-1 py-3 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer"
              >
                Confirm Change
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
