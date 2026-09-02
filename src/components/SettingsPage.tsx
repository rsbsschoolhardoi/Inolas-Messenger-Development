import React, { useState, useEffect } from 'react';
import { GoogleDriveLogo } from './GoogleDriveLogo';
import { VaultPasswordModal } from './VaultPasswordModal';
import { APP_BUILD_INFO } from '../version';
import { db } from '../firebaseClient';
import { doc, updateDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Palette,
  Bell,
  Lock,
  MessageSquare,
  Shield,
  PhoneCall,
  ChevronRight,
  ChevronDown,
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
  Copy,
  Key,
  Terminal,
  ExternalLink,
  Phone,
  ShieldCheck
} from 'lucide-react';
import { storageManager, StorageEstimateInfo } from '../storageManager';
import { UserData } from '../types';

interface SettingsPageProps {
  currentUser?: UserData;
  onOpenAdminConsole?: () => void;
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
  isVerified?: boolean;
  setIsAccountPrivate: (v: boolean) => void;
  showToast: (msg: string) => void;
  userDisplayName: string;
  userUsername: string;
  userAvatarSeed: string;
  userAvatarUrl?: string;
  userEmail?: string;
  userUid?: string;
  userPhone?: string;
  onUpdatePhone?: (phone: string) => void;
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

type SettingsSection = 'main' | 'appearance' | 'notifications' | 'privacy' | 'chats' | 'storage' | 'account' | 'calls' | 'private_account' | 'developer';

export const SettingsPage: React.FC<SettingsPageProps> = ({
  currentUser,
  onOpenAdminConsole,
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
  isVerified = false,
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
  onUpdatePhone,
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
  const [isRefreshingStorage, setIsRefreshingStorage] = useState<boolean>(false);
  const [isCompressionDropdownOpen, setIsCompressionDropdownOpen] = useState<boolean>(false);

  // Mobile Number / Verification State
  const [localPhone, setLocalPhone] = useState<string>(userPhone || currentUser?.mobile_number || '');
  const [isPhoneVerifyModalOpen, setIsPhoneVerifyModalOpen] = useState<boolean>(false);
  const [phoneVerifyInput, setPhoneVerifyInput] = useState<string>('');
  const [phoneOtpStep, setPhoneOtpStep] = useState<'number' | 'otp'>('number');
  const [phoneOtpInput, setPhoneOtpInput] = useState<string>('');
  const [generatedPhoneOtp, setGeneratedPhoneOtp] = useState<string>('');
  const [isVerifyingPhone, setIsVerifyingPhone] = useState<boolean>(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState<string>('');

  useEffect(() => {
    if (userPhone) setLocalPhone(userPhone);
    else if (currentUser?.mobile_number) setLocalPhone(currentUser.mobile_number);
  }, [userPhone, currentUser]);

  const handleSendPhoneCode = async () => {
    setPhoneVerifyError('');
    const target = phoneVerifyInput.trim();
    const digitsOnly = target.replace(/[^0-9]/g, '');
    if (!digitsOnly || digitsOnly.length < 7 || digitsOnly.length > 15) {
      setPhoneVerifyError('Please enter a valid mobile number with country code');
      return;
    }
    const formatted = target.startsWith('+') ? target : `+91${digitsOnly}`;
    setIsVerifyingPhone(true);

    try {
      // 1. Strict Uniqueness Check: Check if mobile number is already associated with another Zenoa account
      if (db) {
        const myUsername = (userUsername || '').toLowerCase();
        const myId = String(currentUser?.id || (currentUser as any)?.uid || '').toLowerCase();
        const candidateNumbers = Array.from(new Set([
          formatted,
          digitsOnly,
          digitsOnly.length >= 10 ? `+91${digitsOnly.slice(-10)}` : null,
          digitsOnly.length >= 10 ? digitsOnly.slice(-10) : null
        ].filter(Boolean))) as string[];

        const usersRef = collection(db, 'users');
        for (const cand of candidateNumbers) {
          const qMob = query(usersRef, where('mobile_number', '==', cand));
          const snapMob = await getDocs(qMob);
          const hasConflictMob = snapMob.docs.some(docSnap => {
            const uData = docSnap.data();
            const docUsername = (uData.username || docSnap.id).toLowerCase();
            const docId = String(uData.id || uData.zenoa_id || docSnap.id).toLowerCase();
            return (docUsername !== myUsername && docId !== myId && docUsername !== `@${myUsername}`);
          });

          if (hasConflictMob) {
            setPhoneVerifyError('This mobile number is already linked and verified with another Zenoa account. For account security, each mobile number can only be associated with a single account. Please use a different phone number or sign in to your existing account.');
            setIsVerifyingPhone(false);
            return;
          }

          const qPhone = query(usersRef, where('phone_number', '==', cand));
          const snapPhone = await getDocs(qPhone);
          const hasConflictPhone = snapPhone.docs.some(docSnap => {
            const uData = docSnap.data();
            const docUsername = (uData.username || docSnap.id).toLowerCase();
            const docId = String(uData.id || uData.zenoa_id || docSnap.id).toLowerCase();
            return (docUsername !== myUsername && docId !== myId && docUsername !== `@${myUsername}`);
          });

          if (hasConflictPhone) {
            setPhoneVerifyError('This mobile number is already linked and verified with another Zenoa account. For account security, each mobile number can only be associated with a single account. Please use a different phone number or sign in to your existing account.');
            setIsVerifyingPhone(false);
            return;
          }
        }
      }

      const partnerKey = import.meta.env.VITE_TRUECALLER_PARTNER_KEY;
      if (partnerKey && typeof window !== 'undefined') {
        const nonce = Math.random().toString(36).substring(2);
        const callbackUrl = window.location.origin + '/auth/truecaller-callback';
        const truecallerUrl = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Zenoa&lang=en&title=Verify%20Account&skipConfirmation=true&callback=${encodeURIComponent(callbackUrl)}`;
        try {
          window.location.href = truecallerUrl;
          setIsVerifyingPhone(false);
          return;
        } catch (e) {
          console.warn("Truecaller deeplink note:", e);
        }
      }

      // Generate secure 6-digit verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedPhoneOtp(code);
      setPhoneOtpStep('otp');
      showToast(`Verification code sent to ${formatted}`);
    } catch (err: any) {
      setPhoneVerifyError(err?.message || 'Failed to send verification code');
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleConfirmPhoneOtp = async () => {
    setPhoneVerifyError('');
    if (!phoneOtpInput || phoneOtpInput.trim() !== generatedPhoneOtp) {
      setPhoneVerifyError('Invalid verification code. Please check and try again.');
      return;
    }

    setIsVerifyingPhone(true);
    const target = phoneVerifyInput.trim();
    const digitsOnly = target.replace(/[^0-9]/g, '');
    const formatted = target.startsWith('+') ? target : `+91${digitsOnly}`;

    try {
      if (db) {
        // Re-verify uniqueness right before saving
        const myUsername = (userUsername || '').toLowerCase();
        const myId = String(currentUser?.id || (currentUser as any)?.uid || '').toLowerCase();
        const candidateNumbers = Array.from(new Set([
          formatted,
          digitsOnly,
          digitsOnly.length >= 10 ? `+91${digitsOnly.slice(-10)}` : null,
          digitsOnly.length >= 10 ? digitsOnly.slice(-10) : null
        ].filter(Boolean))) as string[];

        const usersRef = collection(db, 'users');
        for (const cand of candidateNumbers) {
          const qMob = query(usersRef, where('mobile_number', '==', cand));
          const snapMob = await getDocs(qMob);
          const hasConflict = snapMob.docs.some(docSnap => {
            const uData = docSnap.data();
            const docUsername = (uData.username || docSnap.id).toLowerCase();
            const docId = String(uData.id || uData.zenoa_id || docSnap.id).toLowerCase();
            return (docUsername !== myUsername && docId !== myId && docUsername !== `@${myUsername}`);
          });

          if (hasConflict) {
            setPhoneVerifyError('This mobile number is already linked and verified with another Zenoa account. For account security, each mobile number can only be associated with a single account. Please use a different phone number or sign in to your existing account.');
            setIsVerifyingPhone(false);
            return;
          }
        }

        const primaryZenoaId = currentUser?.id || (currentUser as any)?.uid || userUsername;
        const phonePayload = {
          id: primaryZenoaId,
          zenoa_id: currentUser?.zenoa_id || primaryZenoaId,
          username: userUsername,
          mobile_number: formatted,
          phone_number: formatted,
          is_phone_verified: true,
          phone_verified_at: Date.now(),
          updated_at: Date.now()
        };

        if (primaryZenoaId) {
          await setDoc(doc(db, 'users', primaryZenoaId), phonePayload, { merge: true });
        }
      }
      setLocalPhone(formatted);
      if (onUpdatePhone) {
        onUpdatePhone(formatted);
      }
      setIsPhoneVerifyModalOpen(false);
      setPhoneOtpStep('number');
      setPhoneOtpInput('');
      setGeneratedPhoneOtp('');
      showToast('Mobile number verified successfully!');
    } catch (err: any) {
      setPhoneVerifyError('Verification failed: ' + (err?.message || 'Error'));
    } finally {
      setIsVerifyingPhone(false);
    }
  };

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

  const handleRefreshStorageStats = async () => {
    setIsRefreshingStorage(true);
    try {
      const info = await storageManager.getStorageEstimate();
      setStorageInfo(info);
      showToast('Storage statistics updated');
    } catch (e) {
      console.warn("Storage stats fetch error:", e);
      showToast('Failed to calculate storage');
    } finally {
      setTimeout(() => {
        setIsRefreshingStorage(false);
      }, 500);
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
                  : section === 'storage'
                    ? 'Google Drive & Storage'
                    : section}
            </h1>
            <p className="text-[11px] text-neutral-400">
              {section === 'main' 
                ? 'Manage your account, privacy, and preferences' 
                : section === 'private_account'
                  ? 'Manage account visibility and access control'
                  : section === 'storage'
                    ? 'Google Drive encrypted cloud vault & local storage quota'
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
                      {!!isVerified && (
                        <CheckCircle2 className="h-4 w-4 text-purple-500 shrink-0 fill-purple-500/10" />
                      )}
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



            {/* 1. Standalone Account option card right below the Profile card */}
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

            {/* 2. Standalone Google Drive & Storage Card (Right below Account) */}
            <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 overflow-hidden shadow-sm">
              <button
                onClick={() => setSection('storage')}
                className="w-full p-4.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                    <GoogleDriveLogo className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Google Drive & Storage</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDriveConnected 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}>
                        {isDriveConnected ? 'Connected' : 'Not Connected'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400">Encrypted cloud backups, restore data, and local storage utilization</p>
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

                {/* Chats & Media */}
                <button
                  onClick={() => setSection('chats')}
                  className="w-full p-4 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">Chats & Media</p>
                      <p className="text-xs text-neutral-400">Media auto-download, enter key, conversation preferences</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-neutral-400" />
                </button>

                {/* Log Out Option (Right below Chats & Media) */}
                <button
                  onClick={handleLogout}
                  className="w-full p-4 flex items-center justify-between hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer border-t border-neutral-100 dark:border-neutral-800/60 group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/40">
                      <LogOut className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-rose-600 dark:text-rose-400">Log Out</p>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500">Sign out of your account on this device</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-rose-400 group-hover:translate-x-0.5 transition-transform" />
                </button>

              </div>
            </div>



            {/* App Build Version Footer */}
            <div className="text-center py-2 space-y-1">
              <p className="text-[11px] font-semibold text-neutral-400">
                Inolas Messenger v{APP_BUILD_INFO.version} ({APP_BUILD_INFO.buildId})
              </p>
              <p className="text-[10px] text-neutral-400/80">
                End-to-End Encrypted • Zero-Knowledge Cloud Backup
              </p>
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
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Enter Key,
  Terminal to Send</h3>
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
            {/* Google Drive Vault & Cloud Backup Card */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
                    <GoogleDriveLogo className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-base text-neutral-900 dark:text-white">Google Drive Backup</h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        isDriveConnected 
                          ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60' 
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-200/60 dark:border-neutral-700/60'
                      }`}>
                        {isDriveConnected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Client-side encrypted backup vault stored in your personal Google Drive application storage
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Last Cloud Sync</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white">
                    {lastBackupDate || 'No backups created yet'}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800/80 space-y-1">
                  <p className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Master Password Security</p>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{hasSavedPassword ? 'Configured & Active' : 'Not Set (Set During Backup)'}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {!isDriveConnected ? (
                  <button
                    onClick={onConnectDrive}
                    className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer shadow-sm active:scale-98"
                  >
                    <GoogleDriveLogo className="h-4 w-4" />
                    <span>Connect Google Drive</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setPasswordModalAction('backup');
                        setPasswordModalOpen(true);
                      }}
                      disabled={isBackingUp || isRestoring}
                      className="px-5 py-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm active:scale-98"
                    >
                      {isBackingUp ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Upload className="h-3.5 w-3.5" />
                      )}
                      <span>{isBackingUp ? 'Creating Backup...' : 'Back Up Now'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setPasswordModalAction('restore');
                        setPasswordModalOpen(true);
                      }}
                      disabled={isBackingUp || isRestoring}
                      className="px-5 py-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                    >
                      {isRestoring ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      <span>{isRestoring ? 'Restoring Data...' : 'Restore from Drive'}</span>
                    </button>

                    <button
                      onClick={onDisconnectDrive}
                      disabled={isBackingUp || isRestoring}
                      className="px-4 py-2.5 rounded-2xl border border-neutral-200 dark:border-neutral-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-300 dark:hover:border-rose-800 text-neutral-600 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ml-auto"
                      title="Disconnect Google Drive account"
                    >
                      <span>Disconnect</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Storage Quota Gauge with Working Refresh Button */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Device Storage Utilization</h3>
                    <p className="text-xs text-neutral-400">High-capacity IndexedDB local database engine</p>
                  </div>
                </div>
                <button
                  onClick={handleRefreshStorageStats}
                  disabled={isRefreshingStorage}
                  className="px-3 py-1.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 transition-all cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5 text-xs font-semibold"
                  title="Recalculate and refresh storage statistics"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isRefreshingStorage ? 'animate-spin text-neutral-900 dark:text-white' : ''}`} />
                  <span>{isRefreshingStorage ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 pt-1">
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
                <div className="flex justify-between text-[11px] text-neutral-400 font-medium pt-0.5">
                  <span>{storageInfo?.percentUsed || 0.1}% used</span>
                  <span className="text-neutral-700 dark:text-neutral-300 font-semibold">Local IndexedDB Storage</span>
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
                  <p className="text-[11px] font-medium text-neutral-400">Space Saved</p>
                  <p className="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                    ~82% Compressed
                  </p>
                </div>
              </div>
            </div>

            {/* Smart Media Compression - Sleek Dropdown Selection */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50">
                    <Zap className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Smart Media Compression</h3>
                    <p className="text-xs text-neutral-400">Optimize media before transfer to save bandwidth and storage</p>
                  </div>
                </div>
              </div>

              {/* Interactive Dropdown Selector */}
              {(() => {
                const presets = [
                  {
                    id: 'standard' as const,
                    title: 'Standard Balanced (Recommended)',
                    badge: '80% Saved',
                    desc: 'Optimized 1280px WebP with crisp visual clarity and fast transmission.'
                  },
                  {
                    id: 'hd' as const,
                    title: 'HD Crisp Quality',
                    badge: '40% Saved',
                    desc: '1920px Full HD preserving maximum resolution and fine details.'
                  },
                  {
                    id: 'data_saver' as const,
                    title: 'Ultra Data Saver',
                    badge: '90% Saved',
                    desc: 'Ultra lightweight 800px compression for minimal data and storage usage.'
                  }
                ];
                const activePreset = presets.find(p => p.id === (mediaUploadQuality || 'standard')) || presets[0];

                return (
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCompressionDropdownOpen(!isCompressionDropdownOpen)}
                      className="w-full p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 transition-all flex items-center justify-between text-left cursor-pointer focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:focus:ring-white/10"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-neutral-900 dark:text-white">
                            {activePreset.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                            {activePreset.badge}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">{activePreset.desc}</p>
                      </div>
                      <ChevronDown className={`h-5 w-5 text-neutral-400 transition-transform duration-200 shrink-0 ml-3 ${
                        isCompressionDropdownOpen ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                      }`} />
                    </button>

                    {isCompressionDropdownOpen && (
                      <div className="mt-2 p-2 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl space-y-1 z-20">
                        {presets.map((preset) => {
                          const isSelected = (mediaUploadQuality || 'standard') === preset.id;
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => {
                                if (setMediaUploadQuality) {
                                  setMediaUploadQuality(preset.id);
                                  showToast(`Media compression: ${preset.title}`);
                                }
                                setIsCompressionDropdownOpen(false);
                              }}
                              className={`w-full p-3.5 rounded-xl text-left transition-all flex items-start justify-between gap-3 cursor-pointer ${
                                isSelected
                                  ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-medium'
                                  : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40 text-neutral-700 dark:text-neutral-300'
                              }`}
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                    {preset.title}
                                  </span>
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                                    {preset.badge}
                                  </span>
                                </div>
                                <p className="text-[11px] text-neutral-400">{preset.desc}</p>
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-neutral-900 dark:text-white shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Storage Management & Cleanup Tools */}
            <div className="p-6 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4">
              <div>
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Storage Optimization Tools</h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Safely manage cached files and reclaim disk space without losing chat history.
                </p>
              </div>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <button
                  onClick={handleClearCachedMediaAction}
                  disabled={isCleaningStorage}
                  className="px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-white transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
                >
                  <Trash2 className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Clear Cached Media Files</span>
                </button>

                <button
                  onClick={handleOptimizeStorageAction}
                  disabled={isCleaningStorage}
                  className="px-4 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-xs font-bold text-white dark:text-neutral-900 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-98"
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Permanent Zenoa ID */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/60 dark:border-indigo-800/40 text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                          <Lock className="h-3 w-3" />
                          Zenoa ID
                        </p>
                        <span className="text-[9px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                          IMMUTABLE
                        </span>
                      </div>
                      <p className="text-xs font-mono font-bold text-indigo-950 dark:text-indigo-200 mt-1.5 truncate">
                        {currentUser?.zenoa_id || (userUsername ? `${userUsername}@zenoa` : 'user@zenoa')}
                      </p>
                    </div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-2">
                      Fixed upon setup. Permanent handle for APIs & OTP routing.
                    </p>
                  </div>

                  {/* Email address */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-150 dark:border-neutral-800/40 text-left">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Email Address</p>
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate">
                      {userEmail || 'Not available'}
                    </p>
                  </div>

                  {/* Phone Number */}
                  <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/10 border border-neutral-150 dark:border-neutral-800/40 text-left flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Phone Number</p>
                        {localPhone ? (
                          <span className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40 font-bold flex items-center gap-1">
                            <ShieldCheck className="h-2.5 w-2.5" />
                            Truecaller Verified
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 mt-1 truncate font-mono">
                        {localPhone || 'Not Connected'}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-neutral-200/60 dark:border-neutral-800/60 flex items-center justify-between">
                      <p className="text-[10px] text-neutral-500">
                        {localPhone ? 'Linked for direct Zenoa OTPs' : 'Required for direct OTPs'}
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPhoneVerifyInput(localPhone || '');
                          setIsPhoneVerifyModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90 transition-all cursor-pointer flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>{localPhone ? 'Change' : 'Verify (Truecaller)'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Mobile Verification Modal */}
      {isPhoneVerifyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Phone className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Verify Phone Number</h3>
              </div>
              <button 
                onClick={() => {
                  setIsPhoneVerifyModalOpen(false);
                  setPhoneOtpStep('number');
                }}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-neutral-500 mb-4 leading-relaxed text-left">
              {phoneOtpStep === 'number'
                ? 'Link your mobile number to receive instant one-time passwords (OTPs) and service alerts in your Zenoa chats.'
                : `Enter the 6-digit verification code sent to ${phoneVerifyInput}.`}
            </p>

            {phoneVerifyError && (
              <div className="p-3 mb-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs text-left">
                {phoneVerifyError}
              </div>
            )}

            {phoneOtpStep === 'number' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 text-left">
                    Mobile Number (with country code)
                  </label>
                  <input
                    type="tel"
                    value={phoneVerifyInput}
                    onChange={e => setPhoneVerifyInput(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs font-mono text-neutral-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendPhoneCode}
                  disabled={isVerifyingPhone || !phoneVerifyInput.trim()}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isVerifyingPhone ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                  <span>{isVerifyingPhone ? 'Sending Code...' : 'Send Verification Code'}</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 text-left">
                    6-Digit Verification Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={phoneOtpInput}
                    onChange={e => setPhoneOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="e.g. 123456"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center text-sm font-mono tracking-widest text-neutral-900 dark:text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneOtpStep('number')}
                    className="flex-1 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 text-xs font-bold transition-all cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmPhoneOtp}
                    disabled={isVerifyingPhone || phoneOtpInput.length < 6}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isVerifyingPhone ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                    <span>Verify Code</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
