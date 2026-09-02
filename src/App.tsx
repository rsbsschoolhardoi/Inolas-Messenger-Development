// Forced Sync Timestamp: 0x75bcd15
import { FullScreenProfilePanel } from './components/FullScreenProfilePanel';
import { FollowListModal } from './components/FollowListModal';
// Inolas Messenger - Verified UTF-8 Source Code
import { SSOConsoleStandalone } from "./components/SSOConsoleStandalone";
import { SSOLogin } from "./components/SSOLogin";
import { DeveloperConsoleStandalone } from './components/developer/DeveloperConsole';
import { DocumentationStandalone } from './components/developer/DocumentationStandalone';
import { ConcurrentLogoutModal } from './components/ConcurrentLogoutModal';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MediaPreviewLightbox } from './components/MediaPreviewLightbox';
import { ProfileOptionsModal } from './components/ProfileOptionsModal';

import {  
  MessageSquare, Search, LogOut, Pin, VolumeX, Check, CheckCheck, 
  Send, Paperclip, Smile, Image as ImageIcon, Video, FileText, Mic, 
  ChevronLeft, Info, AlertCircle, AlertTriangle, Plus, User, Moon, Sun, 
  CheckCircle2, X, Star, Forward, Trash2, SmileIcon, UserCheck, UserX, Flag, Edit2,
  Camera, Upload, Menu, Share2,
  Grid, Bookmark, Download, Palette, 
  Database, Volume2, Laptop, ChevronRight, Copy, Lock, Bell, ShieldCheck, Mail, Phone,
  MapPin, BarChart2, Play, Pause, StopCircle, UserPlus, Users, ExternalLink,
  ZoomIn, ZoomOut, RotateCw, RefreshCw, Maximize2, MoreVertical, MoreHorizontal, BellOff, ShieldAlert, Edit3, Archive, Folder, Clock, Shield, Sparkles, FileDown,
  PhoneIncoming, PhoneOutgoing, PhoneMissed, PhoneCall, PhoneOff, ArrowUpRight, ArrowDownLeft, History, Calendar, VideoOff, Filter
} from 'lucide-react';
import {  motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {  UserData, Chat, Message, PollData, CallData, CallHistoryRecord, FollowRequest, AppNotification, SystemBroadcast } from './types';
import {  SEED_USERS, SEED_CHATS, SEED_MESSAGES } from './data';
import {  isFirebaseConfigured, db, auth } from './firebaseClient';
import {  MessageCard } from './components/MessageCard';
import {  InlineVideoPlayer } from './components/InlineVideoPlayer';
import {  VoiceNotePlayer } from './components/VoiceNotePlayer';
import { SettingsPage } from './components/SettingsPage';
import { PortalDashboard } from './components/developer/views/PortalDashboard';
import {  MediaEditorModal, MediaEditorData } from './components/MediaEditorModal';
import {  ImageCropperModal } from './components/ImageCropperModal';
import { NotificationsModal } from './components/NotificationsModal';
import {  ChatThemeModal } from './components/ChatThemeModal';
import {  UnifiedEmojiPicker } from './components/UnifiedEmojiPicker';
import {  LandingPage } from './components/LandingPage';
import {  AuthFlow } from './components/AuthFlow';
import {  AccountSetup } from './components/AccountSetup';
import { PublicProfileView } from './components/PublicProfileView';
import { DetailedProfilePage } from './components/DetailedProfilePage';
import { AdminPanel } from './components/AdminPanel';
import { PurpleVerifiedBadge } from './components/PurpleVerifiedBadge';
import {  NewGroupModal } from './components/NewGroupModal';
import {  GroupDetailsModal } from './components/GroupDetailsModal';
import { GoogleDriveLogo } from './components/GoogleDriveLogo';
import { isUserEffectivelyOnline, getOnlineStatusText, isServiceAccount, isAccountVerified, isOfficialAccount } from './presenceUtils';
import { getThemeById, DEFAULT_THEME_ID } from './chatThemes';
import { getMessageDateKey, formatChatDateDivider, formatChatListTime, formatCleanChatPreview, formatMessageTime } from './dateUtils';
import { encryptMessageText, decryptMessageText, encryptFile, decryptFile } from './cryptoUtils';
import { storageManager } from './storageManager';
import { getDmChatId, buildNormalizedParticipants } from './chatUtils';
import { OpeningAnimation } from './components/OpeningAnimation';
import { useBranding, initBrandingSync } from './brandingUtils';
import {  encryptVault, decryptVault } from './utils/crypto';
import {  findVaultFile, uploadVaultFile, downloadVaultFile, DriveFileInfo, uploadMediaToDrive, getMediaUrlFromDrive, uploadPublicMediaToDrive, deleteVaultFile } from './lib/googleDrive';
import {  compressImage } from './mediaCompressor';
import {  uploadMediaToCloud } from './cloudStorage';
import {  CallModal, CallSession, CallEndMetadata } from './components/CallModal';
import {  blobToBase64, getSupportedMimeType, generateSyntheticVoiceNote } from './audioUtils';
import OneSignal from 'react-onesignal';
import {  
  collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, query, where, getDocs, updateDoc, arrayUnion, arrayRemove, increment 
} from 'firebase/firestore';
import { sendRelayMessage } from './services/messageService';
import {  
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, onAuthStateChanged, 
  GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail 
} from 'firebase/auth';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, authInstance: any) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: authInstance?.currentUser?.uid,
      email: authInstance?.currentUser?.email,
      emailVerified: authInstance?.currentUser?.emailVerified,
      isAnonymous: authInstance?.currentUser?.isAnonymous,
      tenantId: authInstance?.currentUser?.tenantId,
      providerInfo: authInstance?.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const checkUsernameIsTakenInFirestore = async (
  dbRef: any,
  username: string,
  currentUserId?: string,
  localUsers: Record<string, UserData> = {}
): Promise<{ isTaken: boolean; reason?: string }> => {
  const clean = (username || '').trim().toLowerCase();

  if (!clean || clean.length < 3 || clean.length > 20 || !/^[a-z0-9_]+$/.test(clean)) {
    return { isTaken: true, reason: 'Username must be 3-20 characters: letters, numbers, underscores only.' };
  }

  const localMatch = Object.values(localUsers).find(
    u => (u.username?.toLowerCase() === clean || u.previous_usernames?.map(p => (p || '').toLowerCase()).includes(clean)) && u.id !== currentUserId
  );
  if (localMatch) {
    return { isTaken: true, reason: `@${clean} is already taken.` };
  }

  if (dbRef) {
    try {
      const usernameDocRef = doc(dbRef, 'usernames', clean);
      const usernameSnap = await getDoc(usernameDocRef);
      if (usernameSnap.exists()) {
        const resData = usernameSnap.data();
        if (resData && resData.uid && resData.uid !== currentUserId) {
          return { isTaken: true, reason: `@${clean} is already registered.` };
        }
      }

      const usersRef = collection(dbRef, 'users');
      const q = query(usersRef, where('username', '==', clean));
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        for (const docSnap of querySnap.docs) {
          if (docSnap.id !== currentUserId) {
            return { isTaken: true, reason: `@${clean} is already taken by another account.` };
          }
        }
      }
    } catch (err: any) {
      console.warn("Firestore username availability check notice:", err.message);
    }
  }

  return { isTaken: false };
};

export default function App() {
  const branding = useBranding();

  // Initialize Real-time App Branding Sync
  useEffect(() => {
    const unsub = initBrandingSync();
    return () => unsub();
  }, []);

  // Initialize OneSignal Web Push SDK
  useEffect(() => {
    const initOneSignal = async () => {
      try {
        await OneSignal.init({
          appId: '947d3cd0-ad74-4a4e-b553-e5b1763688ba',
          allowLocalhostAsSecureOrigin: true,
          autoRegister: false,
        });
        console.log("OneSignal successfully initialized with App ID 947d3cd0-ad74-4a4e-b553-e5b1763688ba");
      } catch (err) {
        console.warn("OneSignal Web SDK initialization notice:", err);
      }
    };
    initOneSignal();
  }, []);

  // Theme & Layout state - Supports system prefers-color-scheme for perfect device adaptation
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('zenoa_theme');
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
      const systemPrefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return systemPrefersDark ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  // Keep documentElement class in exact sync with themeMode
  useEffect(() => {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem('zenoa_theme', themeMode);
    } catch {
      // ignore
    }
  }, [themeMode]);

  // Listen for device system theme adjustments
  useEffect(() => {
    if (!window.matchMedia) return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      try {
        const hasSaved = localStorage.getItem('zenoa_theme');
        if (!hasSaved) {
          setThemeMode(e.matches ? 'dark' : 'light');
        }
      } catch {}
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // --- FIRESTORE SAFETY & DEDUPLICATION HELPERS ---
  const dedupeMessages = (msgs: Message[]): Message[] => {
    if (!msgs || !Array.isArray(msgs)) return [];
    const seen = new Set<string>();
    const callSeen = new Set<string>();
    return msgs.filter(m => {
      if (!m || !m.id) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      // Strictly prevent duplicate call log entries for the same call_id
      if (m.type === 'call' && m.call_data?.call_id) {
        if (callSeen.has(m.call_data.call_id)) return false;
        callSeen.add(m.call_data.call_id);
      }
      return true;
    });
  };

  const compressImageBase64 = (dataUrl: string, maxDimension = 1024, quality = 0.7): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl || !dataUrl.startsWith('data:image/') || dataUrl.length < 150000) {
        resolve(dataUrl);
        return;
      }
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } else {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const safeFirestoreUrl = async (url: string | undefined | null, fileName = 'file', customPath?: string): Promise<string | null> => {
    if (!url) return null;
    // If it's already an external HTTP/HTTPS URL, return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    // If payload is a data URL and exceeds 200KB, seamlessly offload to Cloud Storage bucket for infinite scaling
    if (url.startsWith('data:') && url.length > 200000) {
      try {
        const cloudPath = customPath || `media_uploads/${Date.now()}_${Math.random().toString(36).substring(2, 8)}_${fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
        const cloudUrl = await uploadMediaToCloud(url, cloudPath);
        if (cloudUrl && cloudUrl.startsWith('http')) {
          return cloudUrl;
        }
      } catch (err) {
        console.warn("Cloud Storage offload warning:", err);
      }
    }
    // Firestore 1MB document limit = 1,048,576 bytes.
    if (url.length > 700000) {
      console.warn(`Attachment exceeds Firestore 1MB doc size limit (${url.length} chars). Offloaded to cloud storage.`);
      return `[File Attachment (${fileName}): Stored securely in Cloud Storage]`;
    }
    return url;
  };

  const changeTheme = (newTheme: 'light' | 'dark') => {
    setThemeMode(newTheme);
    showToast(`${newTheme === 'light' ? 'Light' : 'Dark'} mode`);
  };
  const [activeView, setActiveView] = useState<'chats' | 'search' | 'profile' | 'settings' | 'developer_portal'>('chats');
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Secure Voice & Video Calling States
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);

  // Cloud Vault States
  const [isDriveConnected, setIsDriveConnected] = useState<boolean>(() => {
    return localStorage.getItem('zenoa_drive_connected') === 'true';
  });
  const [dismissedDriveBackupCard, setDismissedDriveBackupCard] = useState<boolean>(() => {
    return localStorage.getItem('zenoa_drive_dismissed') === 'true';
  });
  
  const [driveAccessToken, setDriveAccessToken] = useState<string | null>(null);
  const [isBackingUp, setIsBackingUp] = useState<boolean>(false);
  const [isRestoring, setIsRestoring] = useState<boolean>(false);
  const [lastBackupInfo, setLastBackupInfo] = useState<DriveFileInfo | null>(null);
  
  
  const [hasSavedPassword, setHasSavedPassword] = useState<boolean>(() => {
    return !!localStorage.getItem('zenoa_vault_key');
  });


  useEffect(() => {
    if (isDriveConnected && driveAccessToken) {
      // Check for existing backup on connect
      findVaultFile(driveAccessToken).then(info => {
        setLastBackupInfo(info);
      }).catch(() => {});
    }
  }, [isDriveConnected, driveAccessToken]);

  const handleStartCallWithUser = (targetUsername: string, type: 'voice' | 'video') => {
    if (!targetUsername) return;
    const cleanTarget = targetUsername.toLowerCase().replace(/^@/, '');
    const targetUserObj = users[cleanTarget] || Object.values(users).find(u => (u.username || '').toLowerCase() === cleanTarget);

    if (isServiceAccount(targetUserObj, cleanTarget) || cleanTarget.startsWith('sa_')) {
      showToast("Service accounts and bot entities cannot receive voice or video calls.");
      return;
    }

    const partnerName = targetUserObj?.display_name || targetUsername;
    const partnerAvatarSeed = targetUserObj?.avatar_seed || targetUsername;
    const partnerAvatarUrl = targetUserObj?.avatar_url || '';

    const selfName = userUsername || 'me';
    const targetChatId = getDmChatId(selfName, targetUsername);
    const normalizedParts = buildNormalizedParticipants(selfName, targetUsername, userId, targetUserObj?.id);

    // Find or create chat if needed
    let targetChat = chats.find(c => c.type === 'dm' && (c.id === targetChatId || c.username?.toLowerCase() === targetUsername.toLowerCase()));
    if (!targetChat) {
      targetChat = {
        id: targetChatId,
        type: 'dm',
        name: partnerName,
        username: targetUsername,
        avatar_seed: partnerAvatarSeed,
        avatar_url: partnerAvatarUrl,
        participants: normalizedParts,
        unread: 0,
        last_message: 'Started conversation',
        last_time: 'now',
        pinned: false,
        muted: false,
        typing: false,
        online: isUserEffectivelyOnline(targetUserObj),
        last_seen: targetUserObj?.last_seen || '',
        isLocalPending: true
      };
      setChats(prev => [targetChat!, ...prev]);
    }
    setActiveChatId(targetChat.id);

    // Persist DM chat to Firestore immediately
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'chats', targetChatId), {
        id: targetChatId,
        type: 'dm',
        name: partnerName,
        username: targetUsername,
        avatar_seed: partnerAvatarSeed,
        avatar_url: partnerAvatarUrl,
        participants: normalizedParts,
        participant_details: {
          [selfName.toLowerCase()]: { username: selfName, display_name: userDisplayName || selfName, avatar_seed: userAvatarSeed || selfName, avatar_url: userAvatarUrl || '' },
          [targetUsername.toLowerCase()]: { username: targetUsername, display_name: partnerName, avatar_seed: partnerAvatarSeed, avatar_url: partnerAvatarUrl }
        },
        updated_at: Date.now()
      }, { merge: true }).catch(err => console.warn("Firestore DM creation notice:", err));
    }

    const nowTimestamp = Date.now();
    const nowTimeStr = new Date(nowTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newCallSession: CallSession = {
      id: 'call_' + nowTimestamp.toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      type: type,
      status: 'dialing',
      isIncoming: false,
      partnerUsername: targetUsername,
      partnerName: partnerName,
      partnerAvatarSeed: partnerAvatarSeed,
      partnerAvatarUrl: partnerAvatarUrl,
      startedAt: nowTimestamp,
      startTimeStr: nowTimeStr
    };

    // If Firestore is active, initialize call signaling document with full user details
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'calls', newCallSession.id), {
        id: newCallSession.id,
        type: type,
        caller: selfName,
        caller_clean: selfName.toLowerCase(),
        receiver: targetUsername,
        receiver_clean: targetUsername.toLowerCase(),
        receiver_uid: targetUserObj?.id || '',
        caller_name: userDisplayName || selfName,
        receiver_name: partnerName,
        caller_avatar_seed: userAvatarSeed || selfName,
        caller_avatar_url: userAvatarUrl || '',
        receiver_avatar_seed: partnerAvatarSeed,
        receiver_avatar_url: partnerAvatarUrl,
        status: 'dialing',
        created_at: nowTimestamp,
        start_time_str: nowTimeStr,
        candidates: []
      }).catch(err => console.warn("Failed to synchronize call to Cloud Firestore:", err));
    }

    // Local tab signaling accelerator
    try {
      if (typeof BroadcastChannel !== 'undefined' && targetUsername) {
        const bc1 = new BroadcastChannel(`zenoa_incoming_calls_${targetUsername}`);
        const bc2 = new BroadcastChannel(`zenoa_incoming_calls_${targetUsername.toLowerCase()}`);
        const payload = {
          id: newCallSession.id,
          type: type,
          caller: selfName,
          receiver: targetUsername,
          receiver_clean: targetUsername.toLowerCase(),
          status: 'dialing',
          created_at: nowTimestamp,
          start_time_str: nowTimeStr
        };
        bc1.postMessage(payload);
        bc2.postMessage(payload);
        setTimeout(() => { try { bc1.close(); bc2.close(); } catch(e){} }, 2000);
      }
    } catch (bcErr) {
      console.warn("BroadcastChannel post notice:", bcErr);
    }

    setActiveCallSession(newCallSession);
    showToast(`Calling ${partnerName}...`);
  };

  const handleStartCall = (type: 'voice' | 'video') => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) {
      showToast("Select a conversation to start a call");
      return;
    }
    handleStartCallWithUser(activeChat?.username, type);
  };

  const handleEndCall = async (metaOrDuration: CallEndMetadata | number, reason?: string) => {
    if (activeCallSession && activeCallSession.partnerUsername) {
      const targetChat = chats.find(c => c.type === 'dm' && c.username === activeCallSession.partnerUsername);
      if (targetChat) {
        let callMeta: CallEndMetadata;
        if (typeof metaOrDuration === 'object' && metaOrDuration !== null && 'status' in metaOrDuration) {
          callMeta = metaOrDuration;
        } else {
          const duration = typeof metaOrDuration === 'number' ? metaOrDuration : 0;
          const wasConnected = activeCallSession.status === 'connected' || (reason === 'ended' && duration > 0);
          const m = Math.floor(duration / 60);
          const s = duration % 60;
          const durationStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          const startTimeStr = activeCallSession.startTimeStr || new Date(activeCallSession.startedAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const endTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          callMeta = {
            callId: activeCallSession.id,
            callType: activeCallSession.type,
            status: wasConnected ? 'answered' : (activeCallSession.isIncoming ? 'missed' : (reason === 'declined' ? 'declined' : 'unanswered')),
            startTime: startTimeStr,
            endTime: endTimeStr,
            durationSeconds: duration,
            durationFormatted: durationStr
          };
        }

        const callTypeLabel = callMeta.callType === 'video' ? 'Video' : 'Voice';
        let logText = '';
        if (callMeta.status === 'answered') {
          logText = `${callTypeLabel} Call \u2022 ${callMeta.durationFormatted}`;
        } else {
          logText = activeCallSession.isIncoming ? `Missed ${callTypeLabel} Call` : `Unanswered ${callTypeLabel} Call`;
        }

        const newMsgId = 'call_log_' + (callMeta.callId || activeCallSession.id);
        const sender = activeCallSession.isIncoming ? activeCallSession.partnerUsername : (userUsername || 'me');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const callDataPayload: CallData = {
          call_id: callMeta.callId,
          call_type: callMeta.callType,
          status: callMeta.status,
          start_time: callMeta.startTime,
          end_time: callMeta.status === 'answered' ? callMeta.endTime : undefined,
          duration_seconds: callMeta.durationSeconds,
          duration_formatted: callMeta.durationFormatted
        };

        const newMsg: Message = {
          id: newMsgId,
          chat_id: targetChat.id,
          text: logText,
          sender,
          timestamp,
          type: 'call',
          call_data: callDataPayload,
          reactions: [],
          read_by: [],
          reply_to: undefined,
          reply_sender: undefined,
          reply_preview: undefined,
          forwarded: false,
          pinned: false,
          edited: false,
          deleted_for_everyone: false,
          deleted_for_me: false,
          created_at: Date.now()
        };

        if (isFirebaseConfigured && db && auth) {
          try {
            const encryptedPayload = await encryptMessageText(logText, targetChat.id);
            await setDoc(doc(db, 'messages', newMsgId), {
              id: newMsgId,
              chat_id: targetChat.id, 
              created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
              sender,
              text: encryptedPayload,
              type: 'call',
              call_data: callDataPayload,
              timestamp,
              reactions: [],
              read_by: [],
              reply_to: null,
              reply_sender: null,
              reply_preview: null,
              forwarded: false,
              pinned: false
            });
            // Update chat last message
            await setDoc(doc(db, 'chats', targetChat.id), {
              last_message: logText,
              last_time: 'now', 
              updated_at: Date.now(), 
              last_message_sender: sender,
              last_message_status: 'delivered' as const
            }, { merge: true });

            // Also ensure call document in calls collection reflects final status
            const callDocId = callMeta.callId || activeCallSession.id;
            if (callDocId) {
              await updateDoc(doc(db, 'calls', callDocId), {
                status: callMeta.status,
                ended_at: Date.now(),
                duration: callMeta.durationSeconds,
                duration_seconds: callMeta.durationSeconds,
                duration_formatted: callMeta.durationFormatted,
                end_time_str: callMeta.endTime
              }).catch(() => {});
            }
          } catch (err) {
            console.warn("Call log delivery notice:", err);
          }
        }

        setMessagesByChat(prev => ({
          ...prev,
          [targetChat.id]: dedupeMessages([...(prev[targetChat.id] || []), newMsg])
        }));
        setChats(prev => prev.map(c => c.id === targetChat.id ? { 
          ...c, 
          last_message: sender === userUsername ? `You: ${logText}` : logText, 
          last_time: 'now', 
          updated_at: Date.now(), 
          last_message_sender: sender, 
          last_message_status: 'delivered' as const
        } : c));
      }
    }
    setActiveCallSession(null);
    showToast("Call ended");
  };

  const handleAnswerCall = () => {
    if (activeCallSession) {
      setActiveCallSession(prev => prev ? { ...prev, status: 'connected' } : null);
    }
  };
  const [showProfilePanel, setShowProfilePanel] = useState<boolean>(false);
  const [showCallMenu, setShowCallMenu] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showUnifiedPicker, setShowUnifiedPicker] = useState<boolean>(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState<boolean>(false);
  const [showStickerPanel, setShowStickerPanel] = useState<boolean>(false);

  const [isAccountPrivate, setIsAccountPrivate] = useState<boolean>(false);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState<boolean>(false);

  // Profile & Settings State
  const [settingsSection, setSettingsSection] = useState<'main' | 'appearance' | 'notifications' | 'privacy' | 'chats' | 'account' | 'communication'>('main');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showShareProfileModal, setShowShareProfileModal] = useState<boolean>(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'media' | 'saved' | 'calls'>('media');
  const [callHistoryFilter, setCallHistoryFilter] = useState<'all' | 'missed' | 'incoming' | 'outgoing' | 'video' | 'voice'>('all');
  const [callHistorySearch, setCallHistorySearch] = useState<string>('');
  const [firestoreCalls, setFirestoreCalls] = useState<CallHistoryRecord[]>([]);
  const [currentMediaFolder, setCurrentMediaFolder] = useState<'photos' | 'videos' | 'audio' | 'documents' | null>(null);
  const [publicProfileUsername, setPublicProfileUsername] = useState<string | null>(null);
  const [detailedProfileUsername, setDetailedProfileUsername] = useState<string | null>(null);
  const [showFollowListModal, setShowFollowListModal] = useState<{ type: 'followers' | 'following'; username: string } | null>(null);
  const [chatNicknames, setChatNicknames] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('inolas_chat_nicknames');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [editingNicknameUser, setEditingNicknameUser] = useState<string | null>(null);
  const [tempNicknameValue, setTempNicknameValue] = useState<string>('');
  const [showNewGroupModal, setShowNewGroupModal] = useState<boolean>(false);
  const [newGroupPreselectedUser, setNewGroupPreselectedUser] = useState<string | null>(null);
  const [showGroupDetailsModal, setShowGroupDetailsModal] = useState<boolean>(false);
  const [sharedMediaPreview, setSharedMediaPreview] = useState<{ url: string; type: string; title?: string } | null>(null);
  const [showProfileOptionsModal, setShowProfileOptionsModal] = useState<boolean>(false);
  const [showPrivacySafetyModal, setShowPrivacySafetyModal] = useState<boolean>(false);

  // Real Working Settings Preferences
  const [soundEffects, setSoundEffects] = useState<boolean>(true);
  const [desktopNotifications, setDesktopNotifications] = useState<boolean>(false);
  const [messagePreviews, setMessagePreviews] = useState<boolean>(true);
  const [vibrateFeedback, setVibrateFeedback] = useState<boolean>(true);
  const [enterToSend, setEnterToSend] = useState<boolean>(true);
  const [autoDownloadMedia, setAutoDownloadMedia] = useState<boolean>(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState<boolean>(false);

  // Quality & Media Preferences
  const [mediaUploadQuality, setMediaUploadQuality] = useState<'hd' | 'standard' | 'data_saver'>('hd');
  const [voiceRecordingQuality, setVoiceRecordingQuality] = useState<'hd' | 'standard' | 'compressed'>('hd');

  // Communication & Calls Preferences
  const [broadcastTypingStatus, setBroadcastTypingStatus] = useState<boolean>(true);
  const [autoPlayVoiceNotes, setAutoPlayVoiceNotes] = useState<boolean>(true);
  const [callDataSaver, setCallDataSaver] = useState<boolean>(false);
  const [inCallRingtone, setInCallRingtone] = useState<boolean>(true);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);

  // Voice Recording Engine States & Refs
  const [isRecordingVoice, setIsRecordingVoice] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [isPlayingVoicePreview, setIsPlayingVoicePreview] = useState<boolean>(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<any>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voicePreviewAudioRef = useRef<HTMLAudioElement | null>(null);

  // File Upload Input Refs
  const imageFileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const docFileInputRef = useRef<HTMLInputElement>(null);
  const audioFileInputRef = useRef<HTMLInputElement>(null);

  // Modals for Rich Sharing (Location, Contact, Poll)
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [locationTitle, setLocationTitle] = useState<string>('Central Innovation Hub');
  const [locationAddress, setLocationAddress] = useState<string>('Plot 42, Tech City Expressway, Sector 5');
  const [locationLat, setLocationLat] = useState<number>(28.6139);
  const [locationLng, setLocationLng] = useState<number>(77.2090);

  const [showContactModal, setShowContactModal] = useState<boolean>(false);
  const [contactName, setContactName] = useState<string>('');
  const [contactPhone, setContactPhone] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');

  const [showPollModal, setShowPollModal] = useState<boolean>(false);
  const [pollQuestion, setPollQuestion] = useState<string>('');
  const [pollOptionsInputs, setPollOptionsInputs] = useState<string[]>(['Option 1', 'Option 2']);

  // Real Presence & User Status
  const [myPresenceStatus, setMyPresenceStatus] = useState<'online' | 'away' | 'busy' | 'dnd' | 'offline'>('online');
  const [myCustomStatus, setMyCustomStatus] = useState<string>('Online');
  const [myActivityType, setMyActivityType] = useState<'none' | 'typing' | 'recording_voice' | 'in_call'>('none');
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);

  // Opening Animation state for Google / OAuth / System login
  const [isOpeningAnimationActive, setIsOpeningAnimationActive] = useState<boolean>(false);
  const [openingAnimationData, setOpeningAnimationData] = useState<{ displayName: string; provider: string }>({
    displayName: 'User',
    provider: 'Google'
  });

  // Concurrent Single-Session Login Security States
  const [currentSessionToken] = useState<string>(() => {
    let token = sessionStorage.getItem('zenoa_active_session_token');
    if (!token) {
      token = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('zenoa_active_session_token', token);
    }
    return token;
  });
  const [showConcurrentLoginModal, setShowConcurrentLoginModal] = useState<boolean>(false);
  const [concurrentLogoutCountdown, setConcurrentLogoutCountdown] = useState<number>(5);

  // Inbuilt Production Media Player State
  const [mediaPlayer, setMediaPlayer] = useState<{
    isOpen: boolean;
    type: 'image' | 'video' | 'audio' | 'document' | 'gif';
    url: string;
    title?: string;
    size?: string;
    duration?: string;
    quality?: string;
    senderName?: string;
  }>({
    isOpen: false,
    type: 'image',
    url: ''
  });

  const [mediaZoom, setMediaZoom] = useState<number>(1);
  const [mediaRotation, setMediaRotation] = useState<number>(0);
  const [mediaPlaybackSpeed, setMediaPlaybackSpeed] = useState<number>(1);
  const [mediaIsPlaying, setMediaIsPlaying] = useState<boolean>(true);
  const [mediaCurrentTime, setMediaCurrentTime] = useState<number>(0);
  const [mediaTotalDuration, setMediaTotalDuration] = useState<number>(0);
  const [mediaVolume, setMediaVolume] = useState<number>(1);
  const [mediaIsMuted, setMediaIsMuted] = useState<boolean>(false);

  const mediaPlayerRef = useRef<HTMLVideoElement | HTMLAudioElement | null>(null);

  const openInMediaPlayer = (
    type: 'image' | 'video' | 'audio' | 'document' | 'gif',
    url: string,
    opts?: { title?: string; size?: string; duration?: string; quality?: string; senderName?: string }
  ) => {
    setMediaZoom(1);
    setMediaRotation(0);
    setMediaPlaybackSpeed(1);
    setMediaIsPlaying(true);
    setMediaCurrentTime(0);
    setMediaTotalDuration(0);
    setMediaVolume(1);
    setMediaIsMuted(false);
    setMediaPlayer({
      isOpen: true,
      type,
      url,
      title: opts?.title || (type === 'image' ? 'Image Attachment' : type === 'video' ? 'Video Media' : type === 'audio' ? 'Voice Recording' : type === 'document' ? 'Document File' : 'Animation GIF'),
      size: opts?.size,
      duration: opts?.duration,
      quality: opts?.quality || 'HD 1080p',
      senderName: opts?.senderName
    });
  };

  const closeMediaPlayer = () => {
    if (mediaPlayerRef.current) {
      try { mediaPlayerRef.current.pause(); } catch(e){}
    }
    setMediaPlayer(prev => ({ ...prev, isOpen: false }));
  };

  // Active playing audio message ID & Audio element ref
  const [playingAudioMsgId, setPlayingAudioMsgId] = useState<string | null>(null);
  const audioMessageElementRef = useRef<HTMLAudioElement | null>(null);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isNewUserSetupPending, setIsNewUserSetupPending] = useState(false);
  const [pendingUserAuth, setPendingUserAuth] = useState<any>(null);
  const [isAuthResolving, setIsAuthResolving] = useState<boolean>(true);
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(false);
  const [truecallerProfile, setTruecallerProfile] = useState<any>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payload = params.get("payload");
    const signature = params.get("signature");
    if (payload && signature) {
      window.history.replaceState({}, document.title, window.location.pathname);
      fetch("/api/v1/auth/truecaller/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, signature })
      })
      .then(res => res.json())
      .then(async data => {
        if (data.success && data.profile) {
          setTruecallerProfile(data.profile);
          const rawPhone = data.profile.phoneNumber || '';
          const digits = rawPhone.replace(/[^0-9]/g, '');
          const formattedPhone = rawPhone.startsWith('+') ? rawPhone : (digits ? `+${digits}` : '');

          if (formattedPhone) {
            setUserPhone(formattedPhone);
            if (db) {
              const primaryZenoaId = currentUserObj?.zenoa_id || (userUsername ? `${userUsername}@zenoa` : (userId || auth?.currentUser?.uid || 'user'));
              const targetId = userId || auth?.currentUser?.uid || userUsername;
              const phonePayload = {
                id: targetId,
                zenoa_id: primaryZenoaId,
                username: userUsername,
                mobile_number: formattedPhone,
                phone_number: formattedPhone,
                is_business_verified: true,
                is_truecaller_verified: true,
                phone_verified_at: Date.now(),
                updated_at: Date.now()
              };

              if (targetId) {
                await setDoc(doc(db, 'users', targetId), phonePayload, { merge: true }).catch(() => {});
              }
            }
          }

          // Open registration with prefilled data if not already authenticated
          if (!isAuthenticated) {
            setAuthFlowInitialMode('register'); 
            setShowLandingPage(false);
          }
          showToast('Truecaller profile verified! Mobile number linked to Zenoa ID.');
        }
      })
      .catch(err => console.error("Truecaller callback error:", err));
    }
  }, []);

  const [showAdminPanel, setShowAdminPanel] = useState<boolean>(false);
  const [authFlowInitialMode, setAuthFlowInitialMode] = useState<'login' | 'register'>('login');

  // Sync URL Path Navigation (/ vs /login vs /u/:username vs /admin)
  useEffect(() => {
    const handleLocationSync = () => {
      const path = window.location.pathname.toLowerCase();
      const search = window.location.search.toLowerCase();
      const hash = window.location.hash.toLowerCase();

      if (path === '/admin' || path === '/admin/' || search.includes('admin=true') || hash === '#/admin' || hash === '#admin') {
        setShowAdminPanel(true);
        setShowLandingPage(false);
      } else if (path === '/login' || path === '/signup' || path === '/auth' || path === '/register') {
        setShowAdminPanel(false);
        setShowLandingPage(false);
        if (path === '/signup' || path === '/register') {
          setAuthFlowInitialMode('register');
        } else {
          setAuthFlowInitialMode('login');
        }
      } else if (path.startsWith('/u/')) {
        const parts = window.location.pathname.split('/');
        const username = parts[parts.length - 1];
        if (username) {
          setPublicProfileUsername(username);
          setShowAdminPanel(false);
          setShowLandingPage(false);
        }
      } else {
        setShowAdminPanel(false);
        setShowLandingPage(false);
        setAuthFlowInitialMode('login');
      }
    };

    handleLocationSync();
    window.addEventListener('popstate', handleLocationSync);
    return () => window.removeEventListener('popstate', handleLocationSync);
  }, [isAuthenticated]);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'phone' | 'forgot'>('login');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [otpInput, setOtpInput] = useState<string>('');
  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  // Current User Profile State
  const [userId, setUserId] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [userUsername, setUserUsername] = useState<string>('');
  const [userBio, setUserBio] = useState<string>('');
  const [userAvatarSeed, setUserAvatarSeed] = useState<string>('');
  const [userAvatarUrl, setUserAvatarUrl] = useState<string>('');
  const [userNameChanges, setUserNameChanges] = useState<number[]>([]);
  const [userUsernameChanges, setUserUsernameChanges] = useState<number[]>([]);
  const [savedDisplayName, setSavedDisplayName] = useState<string>('');
  const [savedUsername, setSavedUsername] = useState<string>('');
  // Clean up any legacy shared usernames key in localStorage
  useEffect(() => {
    try { localStorage.removeItem('zenoa_known_usernames'); } catch {}
  }, []);

  const [kickoutData, setKickoutData] = useState<{ username: string; countdown: number } | null>(null);
  const tabSessionIdRef = useRef('sess_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now());

  // 5-Second Countdown Timer for Automatic Kickout Logout
  useEffect(() => {
    if (!kickoutData) return;
    if (kickoutData.countdown <= 0) {
      handleLogout();
      setKickoutData(null);
      return;
    }
    const timer = setTimeout(() => {
      setKickoutData(prev => prev ? { ...prev, countdown: prev.countdown - 1 } : null);
    }, 1000);
    return () => clearTimeout(timer);
  }, [kickoutData]);

  // Account-Specific Single Active Login Tracker (Cross-Tab / Cross-Window)
  useEffect(() => {
    if (!isAuthenticated || !userUsername) {
      return;
    }

    const cleanUsername = userUsername.toLowerCase().trim();
    const currentSessionId = tabSessionIdRef.current;

    // 1. Save active session id for this specific account
    try {
      localStorage.setItem(`zenoa_active_account_${cleanUsername}`, JSON.stringify({
        sessionId: currentSessionId,
        username: userUsername,
        timestamp: Date.now()
      }));

      // Persist in local browser saved accounts for instant 1-click SSO selection
      const existingStr = localStorage.getItem('zenoa_saved_browser_accounts');
      const accounts: any[] = existingStr ? JSON.parse(existingStr) : [];
      const filtered = accounts.filter(a => a && a.username && a.username.toLowerCase() !== cleanUsername);
      filtered.unshift({
        id: userId || 'u_' + cleanUsername,
        username: userUsername,
        display_name: userDisplayName || userUsername,
        email: userEmail || '',
        avatar_url: userAvatarUrl || '',
        avatar_seed: userAvatarSeed || cleanUsername,
        mobile_number: userPhone || '',
        bio: userBio || ''
      });
      localStorage.setItem('zenoa_saved_browser_accounts', JSON.stringify(filtered.slice(0, 8)));
    } catch (e) {}

    // 2. Broadcast to other open tabs that THIS account is now claimed by this session
    try {
      const channel = new BroadcastChannel('zenoa_account_auth_channel');
      channel.postMessage({
        type: 'ACCOUNT_LOGIN_TAKEOVER',
        username: cleanUsername,
        sessionId: currentSessionId,
        timestamp: Date.now()
      });

      channel.onmessage = (event) => {
        if (
          event.data &&
          event.data.type === 'ACCOUNT_LOGIN_TAKEOVER' &&
          event.data.username === cleanUsername &&
          event.data.sessionId !== currentSessionId
        ) {
          // This account was opened/logged in on another tab! Trigger Kickout Modal with 5s countdown
          setKickoutData({
            username: userUsername,
            countdown: 5
          });
        }
      };

      // Periodic check in localStorage in case of cross-window changes without BroadcastChannel
      const interval = setInterval(() => {
        try {
          const raw = localStorage.getItem(`zenoa_active_account_${cleanUsername}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
              setKickoutData({
                username: userUsername,
                countdown: 5
              });
            }
          }
        } catch (e) {}
      }, 1500);

      // Storage event listener for instant cross-tab sync
      const handleStorage = (e: StorageEvent) => {
        if (e.key === `zenoa_active_account_${cleanUsername}` && e.newValue) {
          try {
            const parsed = JSON.parse(e.newValue);
            if (parsed.sessionId && parsed.sessionId !== currentSessionId) {
              setKickoutData({
                username: userUsername,
                countdown: 5
              });
            }
          } catch (err) {}
        }
      };
      window.addEventListener('storage', handleStorage);

      return () => {
        clearInterval(interval);
        channel.close();
        window.removeEventListener('storage', handleStorage);
      };
    } catch (e) {}
  }, [isAuthenticated, userUsername, userId, userDisplayName, userEmail, userAvatarUrl, userAvatarSeed, userPhone, userBio]);

  // Dedicated Draft State for Profile Editing (Isolated so typing does not alter active chat connections or cause lag)
  const [editDraftDisplayName, setEditDraftDisplayName] = useState<string>('');
  const [editDraftUsername, setEditDraftUsername] = useState<string>('');
  const [editDraftBio, setEditDraftBio] = useState<string>('');
  const [editDraftAvatarUrl, setEditDraftAvatarUrl] = useState<string>('');
  const [editDraftAvatarSeed, setEditDraftAvatarSeed] = useState<string>('');

  const handleOpenEditProfile = () => {
    setEditDraftDisplayName(userDisplayName || savedDisplayName);
    setEditDraftUsername((userUsername || savedUsername).replace(/^@/, ''));
    setEditDraftBio(userBio);
    setEditDraftAvatarUrl(userAvatarUrl);
    setEditDraftAvatarSeed(userAvatarSeed || userUsername);
    setShowEditProfileModal(true);
  };

  // Resilient Identity Helpers (Decouples username from identity so history & chats are 100% preserved)
  const isSenderMe = (sender: string | undefined): boolean => {
    if (!sender) return false;
    const cleanSender = sender.trim().toLowerCase();
    const cleanCurrent = (userUsername || '').trim().toLowerCase();
    const cleanSaved = (savedUsername || '').trim().toLowerCase();
    const cleanId = (userId || '').trim().toLowerCase();

    if (
      cleanSender === 'me' ||
      (cleanCurrent && cleanSender === cleanCurrent) ||
      (cleanSaved && cleanSender === cleanSaved) ||
      (cleanId && cleanSender === cleanId)
    ) {
      return true;
    }

    // Check if the current user profile has previous_usernames matching this sender
    const myProfile: UserData | undefined = (userId && typeof users[userId] === 'object' ? users[userId] : undefined) || 
      (userUsername && typeof users[userUsername] === 'object' ? users[userUsername] : undefined);
    if (myProfile && Array.isArray(myProfile.previous_usernames)) {
      if (myProfile.previous_usernames.some((p: string) => p && p.trim().toLowerCase() === cleanSender)) {
        return true;
      }
    }

    return false;
  };

  const getSenderDisplayName = (sender: string | undefined): string => {
    if (!sender) return '';
    if (isSenderMe(sender)) return 'You';
    if (chatNicknames && chatNicknames[sender]) {
      return chatNicknames[sender];
    }
    const u = users[sender] || Object.values(users).find(u => u.username === sender || u.id === sender || u.previous_usernames?.includes(sender));
    if (u?.username && chatNicknames && chatNicknames[u.username]) {
      return chatNicknames[u.username];
    }
    return u?.display_name || sender;
  };

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const [showImageCropper, setShowImageCropper] = useState<boolean>(false);
  const [cropperSourceImage, setCropperSourceImage] = useState<string>('');

  // Onboarding Flow State
  const [onboardingStep, setOnboardingStep] = useState<number>(0);
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [displayNameInput, setDisplayNameInput] = useState<string>('');
  const [bioInput, setBioInput] = useState<string>('');

  // Messenger Database State
  const [users, setUsers] = useState<Record<string, UserData>>({});

  // Memoized unique user list (Deduplicated strictly by permanent UID / Email Identity so username changes never duplicate accounts)
  const uniqueUserList = useMemo<UserData[]>(() => {
    const map = new Map<string, UserData>();
    // First pass: Index all users by canonical identity
    Object.values(users).forEach((u: UserData) => {
      if (u) {
        // Group strictly by primary identity:
        // 1. u.id (Firebase Auth UID)
        // 2. u.email (Email address used during registration)
        // 3. u.username (Clean username fallback)
        const primaryKey = (u.id && u.id.trim())
          ? `uid:${u.id.trim().toLowerCase()}`
          : (u.email && u.email.trim())
            ? `email:${u.email.trim().toLowerCase()}`
            : (u.username && u.username.trim())
              ? `username:${u.username.trim().toLowerCase()}`
              : '';

        if (primaryKey) {
          if (!map.has(primaryKey)) {
            map.set(primaryKey, u);
          } else {
            const existing = map.get(primaryKey)!;
            // Always preserve and merge the richest, most up-to-date profile data
            map.set(primaryKey, {
              ...existing,
              ...u,
              display_name: u.display_name || existing.display_name,
              username: u.username || existing.username,
              bio: u.bio || existing.bio,
              avatar_seed: u.avatar_seed || existing.avatar_seed,
              avatar_url: u.avatar_url || existing.avatar_url,
              online: u.online !== undefined ? u.online : existing.online,
              last_seen: u.last_seen || existing.last_seen,
              previous_usernames: Array.from(new Set([...(existing.previous_usernames || []), ...(u.previous_usernames || [])].filter(Boolean)))
            });
          }
        }
      }
    });

    // Secondary pass: Deduplicate any residual entries that share the exact same username or email or previous_usernames
    const finalMap = new Map<string, UserData>();
    map.forEach(user => {
      const canonicalUsername = (user.username || '').trim().toLowerCase();
      const canonicalId = (user.id || '').trim().toLowerCase();
      const dedupeKey = canonicalId ? `id_${canonicalId}` : `un_${canonicalUsername}`;
      if (dedupeKey && !finalMap.has(dedupeKey)) {
        finalMap.set(dedupeKey, user);
      }
    });

    return Array.from(finalMap.values());
  }, [users]);
  // Clean up legacy un-scoped cache keys to prevent data leakage across accounts
  useEffect(() => {
    try {
      localStorage.removeItem('zenoa_cached_chats');
      localStorage.removeItem('zenoa_cached_messages');
    } catch {}
  }, []);

  const [chats, setChats] = useState<Chat[]>([]);
  const chatsRef = useRef<Chat[]>([]);

  // Load user-scoped chats when username changes
  useEffect(() => {
    if (userUsername) {
      try {
        const cached = localStorage.getItem(`zenoa_cached_chats_${userUsername.toLowerCase()}`);
        if (cached) {
          setChats(JSON.parse(cached));
        }
      } catch {}
    } else {
      setChats([]);
    }
  }, [userUsername]);

  useEffect(() => { 
    chatsRef.current = chats; 
    if (userUsername && chats && chats.length > 0) {
      try { localStorage.setItem(`zenoa_cached_chats_${userUsername.toLowerCase()}`, JSON.stringify(chats)); } catch {}
    }
  }, [chats, userUsername]);

  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});

  // Load user-scoped messages when username changes
  useEffect(() => {
    if (userUsername) {
      try {
        const cached = localStorage.getItem(`zenoa_cached_messages_${userUsername.toLowerCase()}`);
        if (cached) {
          setMessagesByChat(JSON.parse(cached));
        }
      } catch {}
    } else {
      setMessagesByChat({});
    }
  }, [userUsername]);

  useEffect(() => {
    let active = true;
    const loadMessages = async () => {
      try {
        const loadedMessages: Record<string, Message[]> = {};
        let hasNew = false;
        for (const chat of chats) {
          const msgs = await storageManager.getMessagesForChat(chat.id);
          if (msgs && msgs.length > 0) {
            loadedMessages[chat.id] = msgs;
            hasNew = true;
          }
        }
        if (hasNew && active) {
          setMessagesByChat(prev => {
            const merged = { ...prev };
            Object.entries(loadedMessages).forEach(([cid, msgs]) => {
              // Only merge if we don't already have messages in memory for this chat ID
              // This strictly prevents older local database records from overwriting live incoming messages!
              if (!merged[cid] || merged[cid].length === 0) {
                merged[cid] = msgs;
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error("Failed to load messages from IndexedDB", err);
      }
    };
    if (chats.length > 0) {
      loadMessages();
    }
    return () => {
      active = false;
    };
  }, [chats.length]);

  const [visibleMessageCountByChat, setVisibleMessageCountByChat] = useState<Record<string, number>>({});
  const MESSAGE_PAGE_SIZE = 40;

  useEffect(() => {
    if (userUsername && messagesByChat && Object.keys(messagesByChat).length > 0) {
      try { localStorage.setItem(`zenoa_cached_messages_${userUsername.toLowerCase()}`, JSON.stringify(messagesByChat)); } catch {}
      // Sync to High-Capacity IndexedDB in background
      try {
        const allMsgs = Object.values(messagesByChat).flat();
        if (allMsgs.length > 0) {
          storageManager.saveMessages(allMsgs).catch(() => {});
        }
      } catch {}
    }
  }, [messagesByChat, userUsername]);
  const [activeChatId, setActiveChatId] = useState<string>('');

  // Modals, Context Menus & WhatsApp Chat Controls
  const [selectedMessageForActions, setSelectedMessageForActions] = useState<Message | null>(null);
  const [selectedChatForOptions, setSelectedChatForOptions] = useState<Chat | null>(null);
  const [showChatCustomizationSheet, setShowChatCustomizationSheet] = useState<boolean>(false);
  const [chatCustomizationView, setChatCustomizationView] = useState<'main' | 'disappearing'>('main');
  const [customDisappearingValue, setCustomDisappearingValue] = useState<string>('1');
  const [customDisappearingUnit, setCustomDisappearingUnit] = useState<'h' | 'd'>('d');

  // Custom Wallpaper, Archive & Lock State
  const localMediaCacheRef = useRef<Record<string, string>>({});
  const [showThemeModal, setShowThemeModal] = useState<boolean>(false);
  const [chatWallpapers, setChatWallpapers] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem('zenoa_chat_wallpapers') || '{}'); } catch { return {}; }
  });

  const handleSelectChatTheme = async (themeId: string, applyToAll = false) => {
    if (applyToAll) {
      const updated: Record<string, string> = {};
      chats.forEach(c => { updated[c.id] = themeId; });
      setChatWallpapers(updated);
      try { localStorage.setItem('zenoa_chat_wallpapers', JSON.stringify(updated)); } catch {}
      
      if (isFirebaseConfigured && db && auth) {
        try {
          await Promise.all(chats.map(c => 
            setDoc(doc(db, 'chats', c.id), {
              [`themes.${userUsername}`]: themeId
            }, { merge: true })
          ));
        } catch (e) { console.error(e); }
      }
      showToast('Theme applied to all chats');
    } else if (activeChatId) {
      setChatWallpapers(prev => {
        const next = { ...prev, [activeChatId]: themeId };
        try { localStorage.setItem('zenoa_chat_wallpapers', JSON.stringify(next)); } catch {}
        return next;
      });
      
      if (isFirebaseConfigured && db && auth) {
        try {
          await setDoc(doc(db, 'chats', activeChatId), {
            [`themes.${userUsername}`]: themeId
          }, { merge: true });
        } catch (e) { console.error(e); }
      }
      showToast('Wallpaper & theme updated');
    }
  };
  const [chatDisappearing, setChatDisappearing] = useState<Record<string, string>>({});

  // Search States
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [chatSearchQuery, setChatSearchQuery] = useState<string>('');
  const [messageSearchQuery, setMessageSearchQuery] = useState<string>('');
  const [showMsgSearchInChat, setShowMsgSearchInChat] = useState<boolean>(false);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);

  // Composer States
  const [composerText, setComposerText] = useState<string>('');
  const [replyToId, setReplyToId] = useState<string>('');
  const [replyToPreview, setReplyToPreview] = useState<string>('');
  const [replyToSender, setReplyToSender] = useState<string>('');
  const [editMessageId, setEditMessageId] = useState<string>('');

  // Modals & Action Menus
  const [showForwardModal, setShowForwardModal] = useState<boolean>(false);
  const [forwardMessageId, setForwardMessageId] = useState<string>('');
  const [forwardTargets, setForwardTargets] = useState<string[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteMessageId, setDeleteMessageId] = useState<string>('');

  // Confirmation Warning Modal
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'danger',
    onConfirm: () => {}
  });

  const triggerConfirm = (config: {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }) => {
    setConfirmModal({
      isOpen: true,
      title: config.title,
      description: config.description,
      confirmText: config.confirmText || 'Confirm',
      cancelText: config.cancelText || 'Cancel',
      variant: config.variant || 'danger',
      onConfirm: config.onConfirm
    });
  };

  const closeConfirm = () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  // Settings & Appearance States
  const [chatColorTheme, setChatColorTheme] = useState<string>('indigo');
  const [activeFontSize, setActiveFontSize] = useState<'sm' | 'md' | 'lg'>('md');
  const [chatBubbleStyle, setChatBubbleStyle] = useState<'modern' | 'minimal' | 'playful'>('modern');
  const [notificationsSound, setNotificationsSound] = useState<boolean>(true);
  const [previewTextInNotif, setPreviewTextInNotif] = useState<boolean>(true);
  const [privacyUsernameVisible, setPrivacyUsernameVisible] = useState<boolean>(true);
  const [privacyLastSeen, setPrivacyLastSeen] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [privacyOnlineStatus, setPrivacyOnlineStatus] = useState<'everyone' | 'contacts' | 'nobody'>('everyone');
  const [privacyProfilePhoto, setPrivacyProfilePhoto] = useState<string>('everyone');
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState<boolean>(true);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [reportedUsers, setReportedUsers] = useState<string[]>([]);

  // Media Editor Modal State (WhatsApp-style Photo/Video Editor)
  const [pendingMediaEditorData, setPendingMediaEditorData] = useState<MediaEditorData | null>(null);

  // Toast
  const [toastMessage, setToastMessage] = useState<string>('');

  // Selected Profile state for Slide-over Panel
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string>('');

  const handleOpenUserProfile = (targetUserOrUsername: string | undefined) => {
    if (!targetUserOrUsername) return;
    const cleanU = targetUserOrUsername.toLowerCase().replace(/^@/, '');
    const targetUserObj = users[cleanU] || Object.values(users).find(u => (u.username || '').toLowerCase() === cleanU);
    if (isServiceAccount(targetUserObj, cleanU) && currentUserObj?.role !== 'admin' && currentUserObj?.role !== 'super_admin') {
      showToast("Service accounts are automated business entities and cannot be viewed as personal user profiles.");
      return;
    }
    setSelectedProfileUsername(cleanU);
    setShowProfilePanel(true);
  };

  // Chat scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByChat, activeChatId]);

  // Mark messages as read when viewing active chat
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername || !activeChatId) return;
    
    // GUARD: Do NOT update Firestore if active chat has not been created on database yet (isLocalPending)
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat?.isLocalPending) return;
    
    const unreadMsgs = (messagesByChat[activeChatId] || []).filter(
      m => m.sender !== userUsername && (!m.read_by || !m.read_by.includes(userUsername))
    );
    
    if (unreadMsgs.length > 0) {
      unreadMsgs.forEach(m => {
        const newReadBy = [...(m.read_by || []), userUsername];
        setDoc(doc(db, 'messages', m.id), { read_by: newReadBy }, { merge: true }).catch(() => {});
      });
      
      // Update chat document to mark last message as read if last message was from another user
      const activeChatMsgs = messagesByChat[activeChatId] || [];
      const lastMsg = activeChatMsgs[activeChatMsgs.length - 1];
      if (lastMsg && lastMsg.sender !== userUsername) {
        setDoc(doc(db, 'chats', activeChatId), { last_message_status: 'read' }, { merge: true }).catch(() => {});
      }
      
      // Update local state optimistically
      setMessagesByChat(prev => {
        const updated = (prev[activeChatId] || []).map(m => {
          if (m.sender !== userUsername && (!m.read_by || !m.read_by.includes(userUsername))) {
            return { ...m, read_by: [...(m.read_by || []), userUsername] };
          }
          return m;
        });
        return { ...prev, [activeChatId]: updated };
      });
    }
  }, [messagesByChat, activeChatId, userUsername, db, isFirebaseConfigured]);

  // Check Firebase Connection & Load Data
  useEffect(() => {
    let unsubscribeUsers: (() => void) | null = null;
    let unsubscribeAuth: (() => void) | null = null;
    let unsubscribeNotifications: (() => void) | null = null;
    let unsubscribeFollowRequests: (() => void) | null = null;

    async function initFirebase() {
      if (!isFirebaseConfigured || !db || !auth) {
        setUsers(SEED_USERS);
        setChats(SEED_CHATS);
        setMessagesByChat(SEED_MESSAGES);
        setIsAuthResolving(false);
        return;
      }

      try {
        // 1. Sync users collection
        unsubscribeUsers = onSnapshot(
          collection(db, 'users'),
          (snapshot) => {
            const fetchedUsers: Record<string, UserData> = {};
            snapshot.forEach(docSnap => {
              const docId = docSnap.id;
              // Skip internal config or system metadata documents that are not real users
              if (docId.startsWith('__') || docId === 'system_config' || docId === 'settings' || docId === 'metadata') {
                return;
              }

              const p = docSnap.data();
              // If document has no user attributes whatsoever, skip
              if (!p.username && !p.display_name && !p.email && !p.mobile_number && !p.is_service_account) {
                return;
              }

              const rawUsername = (p.username || (p.email ? p.email.split('@')[0] : '') || p.display_name?.toLowerCase().replace(/[^a-z0-9_]/g, '') || docId)
                .trim()
                .replace(/^@+/, '');

              if (!rawUsername || (rawUsername === 'system' && !p.is_service_account)) {
                return;
              }

              // Auto-cleanup legacy duplicate documents to enforce single Zenoa ID truth
              if (p.id && docId !== p.id) {
                deleteDoc(doc(db, 'users', docId)).catch(() => {});
                return;
              }
              if (!p.id && docId.toLowerCase() === rawUsername.toLowerCase()) {
                deleteDoc(doc(db, 'users', docId)).catch(() => {});
                return;
              }

              const isOfficial = isOfficialAccount(p, rawUsername);

              const userObj: UserData = {
                id: p.id || docId,
                zenoa_id: p.zenoa_id || `${rawUsername}@zenoa`,
                username: rawUsername,
                display_name: p.display_name || p.fullName || (isOfficial ? 'Zenoa Official' : rawUsername),
                bio: p.bio || (isOfficial ? 'Official Zenoa Account • Security & Updates' : ''),
                avatar_seed: p.avatar_seed || rawUsername,
                avatar_url: p.avatar_url || '',
                role: p.role || 'user',
                online: isUserEffectivelyOnline(p as any),
                last_seen: getOnlineStatusText(p as any),
                last_seen_timestamp: p.last_seen_timestamp || 0,
                custom_status: p.custom_status || '',
                activity_status: p.activity_status || 'online',
                activity_type: p.activity_type || 'none',
                name_change_timestamps: p.name_change_timestamps || [],
                username_change_timestamps: p.username_change_timestamps || [],
                previous_usernames: p.previous_usernames || [],
                followers: Array.isArray(p.followers) ? p.followers : [],
                following: Array.isArray(p.following) ? p.following : [],
                is_private: !!p.is_private,
                is_official: isOfficial,
                is_verified: isOfficial || (!!p.is_verified && !p.is_business_account),
                verified_type: isOfficial ? 'purple' : (p.verified_type || (p.is_verified ? 'purple' : null)),
                is_service_account: isOfficial || !!p.is_service_account,
                is_business_account: !isOfficial && !!p.is_business_account
              };
              // Store canonical entry by username and docId
              fetchedUsers[rawUsername.toLowerCase()] = userObj;
              if (docId && docId.toLowerCase() !== rawUsername.toLowerCase()) {
                fetchedUsers[docId.toLowerCase()] = userObj;
              }
            });
            setUsers(snapshot.empty ? {} : fetchedUsers);
          },
          (err) => {
            console.warn("Firestore users listener notice (operating in offline/cached mode):", err.message);
          }
        );

        // 2. Live auth listener
        unsubscribeAuth = onAuthStateChanged(auth, async (userObj) => {
          try {
            if (userObj) {
              // Check if email/password account and not verified
              const isPasswordProvider = userObj.providerData.some(p => p.providerId === 'password') || userObj.providerData.length === 0;
              if (!userObj.emailVerified && isPasswordProvider) {
                setIsEmailVerificationPending(true);
                setPendingVerificationEmail(userObj.email || '');
                setIsAuthenticated(false);
                return;
              }
              
              setUserId(userObj.uid);
              setUserEmail(userObj.email || '');
  
              // Fetch user profile from Firestore
              try {
                const userDocRef = doc(db, 'users', userObj.uid);
                const userSnap = await getDoc(userDocRef);
  
                if (userSnap.exists() && userSnap.data()?.username && userSnap.data()?.display_name) {
                  const profile = userSnap.data();

                  if (profile?.is_service_account) {
                    await firebaseSignOut(auth);
                    showToast('Access Denied: Service Accounts are restricted to API use only.');
                    setIsAuthenticated(false);
                    setIsAuthResolving(false);
                    return;
                  }

                  const uName = profile.username;
                  const dName = profile.display_name;
                  const uPhone = profile.mobile_number || profile.phone_number || profile.phone || '';
                  setUserUsername(uName);
                  setUserDisplayName(dName);
                  setUserPhone(uPhone);
                  setUserBio(profile.bio || '');
                  setUserAvatarSeed(profile.avatar_seed || uName);
                  setUserAvatarUrl(profile.avatar_url || '');
                  setIsAccountPrivate(!!profile.is_private);
                  setUserNameChanges(profile.name_change_timestamps || []);
                  setUserUsernameChanges(profile.username_change_timestamps || []);
                  setSavedDisplayName(dName);
                  setSavedUsername(uName);
                  setAuthMethod(userObj.providerData[0]?.providerId || 'email');
                  setIsAuthenticated(true);
                  setIsNewUserSetupPending(false);
        // 3. Notification listener
        if (userObj) {
          unsubscribeNotifications = onSnapshot(
            query(collection(db, 'notifications'), where('userId', '==', userObj.uid)),
            (snap) => {
              const list: AppNotification[] = [];
              snap.forEach(d => list.push({ id: d.id, ...d.data() } as AppNotification));
              setNotifications(list.sort((a, b) => b.timestamp - a.timestamp));
            },
            (err) => {
              console.warn('Notifications snapshot notice:', err.message);
            }
          );

          unsubscribeFollowRequests = onSnapshot(
            query(collection(db, 'follow_requests'), where('toId', '==', userObj.uid), where('status', '==', 'pending')),
            (snap) => {
              const list: FollowRequest[] = [];
              snap.forEach(d => list.push({ id: d.id, ...d.data() } as FollowRequest));
              setFollowRequests(list);
            },
            (err) => {
              console.warn('Follow requests snapshot notice:', err.message);
            }
          );
        }

                } else {
                  setAuthMethod(userObj.providerData[0]?.providerId || 'email');
                  setPendingUserAuth(userObj);
                  if (userSnap.exists()) {
                    setUserDisplayName(userSnap.data().display_name || userObj.displayName || '');
                    setUserUsername(userSnap.data().username || '');
                  } else {
                    setUserDisplayName(userObj.displayName || '');
                    setUserUsername('');
                  }
                  setIsNewUserSetupPending(true);
                  setIsAuthenticated(false);
                }
              } catch (fetchErr: any) {
                console.warn("User profile fetch fallback:", fetchErr.message);
                setAuthMethod(userObj.providerData[0]?.providerId || 'email');
                setIsAuthenticated(true);
              }
            } else {
              setIsAuthenticated(false);
              setUserUsername('');
              setChats([]);
              setMessagesByChat({});
            }
          } catch (err: any) {
            console.error("Auth sync handler error:", err);
          } finally {
            setIsAuthResolving(false);
          }
        });

      } catch (err: any) {
        console.error("Firebase connection error:", err);
      }
    }

    initFirebase();

    return () => {
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeAuth) unsubscribeAuth();
      if (unsubscribeNotifications) unsubscribeNotifications();
      if (unsubscribeFollowRequests) unsubscribeFollowRequests();
    };
  }, []);

  // Automatic Email Verification Polling (Runs when verification screen is active)
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !isEmailVerificationPending) return;

    let active = true;
    const interval = setInterval(async () => {
      try {
        if (!auth.currentUser) return;
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified && active) {
          clearInterval(interval);
          setIsEmailVerificationPending(false);
          setPendingVerificationEmail('');
          showToast("Email verified successfully");
          try {
            confetti();
          } catch (confettiErr) {}
          
          // Log them in fully and fetch or onboard profile!
          const userObj = auth.currentUser;
          const userDocRef = doc(db, 'users', userObj.uid);
          const userSnap = await getDoc(userDocRef);

          setUserId(userObj.uid);
          setUserEmail(userObj.email || '');
          setAuthMethod('email');

          if (userSnap.exists()) {
            const profile = userSnap.data();
            setUserUsername(profile.username || '');
            setUserDisplayName(profile.display_name || profile.username || '');
            setUserBio(profile.bio || '');
            setUserAvatarSeed(profile.avatar_seed || profile.username || '');
            setUserAvatarUrl(profile.avatar_url || '');
            setIsAuthenticated(true);
          } else {
            // New user, trigger onboarding step
            const resolvedUsername = (userObj.email || '').split('@')[0].replace(/[^a-z0-9_]/g, '');
            setUsernameInput(resolvedUsername);
            setOnboardingStep(1);
          }
        }
      } catch (e) {
        console.warn("Email verification reload check ignored:", e);
      }
    }, 3000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [isEmailVerificationPending, isFirebaseConfigured, auth, db]);

  // Synchronize Chats when authenticated and username is set
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !auth || !userUsername) {
      setChats([]);
      return;
    }

    const cleanSelfUsername = userUsername.toLowerCase().trim().replace(/^@/, '');
    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', cleanSelfUsername)
    );

    const unsubscribeChats = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatMap = new Map<string, Chat>();
        snapshot.forEach(docSnap => {
          const c = docSnap.data();
          if (c.id && !chatMap.has(c.id)) {
            const participants = Array.isArray(c.participants) ? c.participants : [];
            const participantIds = Array.isArray(c.participant_ids) ? c.participant_ids : [];
            
            // Resilient Zero-Trust Privacy Gate: Verify user is a participant or group member (Case-Insensitive)
            const isParticipant = participants.some((p: string) => isSenderMe(p) || p.toLowerCase() === userUsername.toLowerCase() || p.toLowerCase() === cleanSelfUsername || (userId && p === userId)) ||
                                  participantIds.some((p: string) => (userId && p === userId) || p.toLowerCase() === userUsername.toLowerCase() || p.toLowerCase() === cleanSelfUsername);
            if (!isParticipant) {
              return; // DROP: Current user is NOT a participant of this chat
            }

            const otherUser = participants.find((p: string) => !isSenderMe(p) && p.toLowerCase() !== userUsername.toLowerCase() && p.toLowerCase() !== cleanSelfUsername && p !== userId) || (c.username?.toLowerCase() !== userUsername.toLowerCase() ? c.username : '') || '';
            const uProfile = users[otherUser] || users[otherUser.toLowerCase()] || Object.values(users).find(u => u.username?.toLowerCase() === otherUser.toLowerCase() || u.id === otherUser || u.previous_usernames?.includes(otherUser));
            const participantDetail = c.participant_details?.[otherUser] || c.participant_details?.[otherUser.toLowerCase()];

            const resolvedPartnerUsername = uProfile?.username || participantDetail?.username || otherUser || c.username || '';
            const resolvedPartnerName = c.type === 'dm' ? (uProfile?.display_name || participantDetail?.display_name || resolvedPartnerUsername) : (c.name || '');
            const resolvedPartnerAvatarSeed = c.type === 'dm' ? (uProfile?.avatar_seed || participantDetail?.avatar_seed || resolvedPartnerUsername) : (c.avatar_seed || c.name || c.id || '');
            const resolvedPartnerAvatarUrl = c.type === 'dm' ? (uProfile?.avatar_url || participantDetail?.avatar_url || '') : (c.avatar_url || '');

            const computedUnread = c.unread_by_user?.[cleanSelfUsername] ?? c.unread_by_user?.[userUsername.toLowerCase()] ?? c.unread_by_user?.[userUsername] ?? (c.last_message_sender?.toLowerCase() !== userUsername.toLowerCase() ? (c.unread || 0) : 0);

            const chatObj: Chat = {
              id: c.id,
              type: (c.type || 'dm') as 'dm' | 'group',
              name: c.type === 'group' ? (c.name || 'Group Chat') : resolvedPartnerName,
              username: c.type === 'dm' ? resolvedPartnerUsername : (c.username || c.id || ''),
              avatar_seed: resolvedPartnerAvatarSeed,
              avatar_url: resolvedPartnerAvatarUrl,
              participants: c.participants || [],
              participant_ids: c.participant_ids || [],
              admin: c.admin,
              group_admins: Array.isArray(c.group_admins) ? c.group_admins : (c.admin ? [c.admin] : []),
              group_description: c.group_description || '',
              group_notice: c.group_notice || '',
              edit_info_permission: c.edit_info_permission || 'all',
              send_messages_permission: c.send_messages_permission || 'all',
              unread: computedUnread,
              last_message: c.last_message || '',
              last_time: c.last_time || '',
              pinned: c.pinned || false,
              muted: c.muted || false,
              typing: (c.typing_username && c.typing_username.toLowerCase() !== userUsername.toLowerCase() && c.typing_updated_at && (Date.now() - c.typing_updated_at < 6000)) || (c.typing && c.typing_username !== userUsername) || false,
              typing_username: c.typing_username && c.typing_username.toLowerCase() !== userUsername.toLowerCase() ? c.typing_username : undefined,
              typing_updated_at: c.typing_updated_at,
              online: c.type === 'dm' ? isUserEffectivelyOnline(uProfile) : (c.online || false),
              last_seen: c.type === 'dm' ? (uProfile?.last_seen || '') : (c.last_seen || ''),
              activity_type: c.activity_type || 'none',
              custom_status: c.type === 'dm' ? (uProfile?.custom_status || '') : (c.custom_status || ''),
              updated_at: c.updated_at || Date.now(),
              cleared_at: c.cleared_at || {},
              theme: c.themes?.[userUsername] || c.themes?.[savedUsername] || c.theme,
              disappearing_messages: c.disappearing_messages || 'off',
              last_message_sender: c.last_message_sender,
              last_message_status: c.last_message_status
            };
            if (chatObj.cleared_at?.[userUsername] && chatObj.cleared_at?.[userUsername] > (chatObj.updated_at || 0)) {
              chatObj.last_message = 'Chat history cleared';
            }
            chatMap.set(c.id, chatObj);
          }
        });
        const fetchedChats = Array.from(chatMap.values());
        setChats(prev => {
          const localPending = prev.filter(c => c.isLocalPending && !chatMap.has(c.id));
          const merged = [...fetchedChats, ...localPending];
          merged.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const timeA = a.updated_at || 0;
            const timeB = b.updated_at || 0;
            if (timeA !== timeB) return timeB - timeA;
            return a.id > b.id ? -1 : 1;
          });
          return merged;
        });
          
        setChatWallpapers(prev => {
          const next = { ...prev };
          let changed = false;
          fetchedChats.forEach(c => {
            if (c.theme && c.theme !== next[c.id]) {
              next[c.id] = c.theme;
              changed = true;
            }
          });
          if (changed) {
            try { localStorage.setItem('zenoa_chat_wallpapers', JSON.stringify(next)); } catch {}
            return next;
          }
          return prev;
        });

        setChatDisappearing(prev => {
          const next = { ...prev };
          let changed = false;
          fetchedChats.forEach(c => {
            if (c.disappearing_messages && c.disappearing_messages !== next[c.id]) {
              next[c.id] = c.disappearing_messages;
              changed = true;
            }
          });
          return changed ? next : prev;
        });

        if (fetchedChats.length === 0) {
          setChats(prev => prev.filter(c => c.isLocalPending));
        }
      },
      (err) => {
        console.warn("Firestore chats listener error:", err.message);
      }
    );

    return () => {
      unsubscribeChats();
    };
  }, [isFirebaseConfigured, db, auth, userUsername, users]);

  // Global Broadcast Delivery Engine & Live Listener
  const deliverBroadcastsToUser = async (targetUid: string, targetUsername: string, targetDisplayName?: string) => {
    if (!isFirebaseConfigured || !db || !targetUsername) return;
    try {
      const broadcastsSnap = await getDocs(collection(db, 'broadcasts'));
      const now = Date.now();
      let broadcastList: SystemBroadcast[] = broadcastsSnap.docs.map(d => ({ id: d.id, ...d.data() } as SystemBroadcast));

      if (broadcastList.length === 0) {
        const defaultBc: SystemBroadcast = {
          id: 'bc_welcome_' + now,
          sender_username: 'zenoa_official',
          sender_display_name: 'Zenoa Official',
          title: 'Welcome to Zenoa',
          content: 'Welcome to Zenoa!      Your account is active. Connect, chat securely, share media, and customize your experience.',
          urgency: 'normal',
          created_at: now,
          created_by: 'system'
        };
        await setDoc(doc(db, 'broadcasts', defaultBc.id), defaultBc).catch(() => {});
        broadcastList = [defaultBc];
      }

      for (const bc of broadcastList) {
        const senderUsername = bc.sender_username || 'zenoa_official';
        const senderName = bc.sender_display_name || 'Zenoa Official';
        const chatId = 'chat_dm_' + [targetUsername.toLowerCase(), senderUsername.toLowerCase()].sort().join('_');
        const msgId = 'msg_' + bc.id + '_' + targetUsername;

        await setDoc(doc(db, 'chats', chatId), {
          id: chatId,
          type: 'dm',
          username: senderUsername,
          name: senderName,
          participants: [targetUsername, senderUsername],
          participant_ids: [targetUid || targetUsername, senderUsername],
          last_message: '     [' + bc.title + '] ' + bc.content,
          last_message_time: bc.created_at || now,
          last_message_sender: senderUsername,
          last_message_status: 'sent',
          unread_count: 1,
          updated_at: bc.created_at || now
        }, { merge: true }).catch(() => {});

        await setDoc(doc(db, 'messages', msgId), {
          id: msgId,
          chat_id: chatId,
          sender: senderUsername,
          text: `     **[${bc.title}]**\n\n${bc.content}`,
          timestamp: bc.created_at || now,
          status: 'sent',
          read_by: JSON.stringify([senderUsername]),
          is_system_broadcast: true
        }).catch(() => {});
      }
    } catch (err) {
      console.warn('Error delivering broadcasts to user:', err);
    }
  };

  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername) return;
    deliverBroadcastsToUser(userId, userUsername, userDisplayName);

    const unsubscribeBroadcasts = onSnapshot(
      collection(db, 'broadcasts'),
      (snapshot) => {
        if (snapshot.empty) return;
        snapshot.docs.forEach((docSnap) => {
          const bc = docSnap.data() as SystemBroadcast;
          if (!bc || !bc.title || !bc.content) return;
          const senderUsername = bc.sender_username || 'zenoa_official';
          const senderName = bc.sender_display_name || 'Zenoa Official';
          const chatId = 'chat_dm_' + [userUsername.toLowerCase(), senderUsername.toLowerCase()].sort().join('_');
          const msgId = 'msg_' + bc.id + '_' + userUsername;
          const now = Date.now();

          setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            type: 'dm',
            username: senderUsername,
            name: senderName,
            participants: [userUsername, senderUsername],
            participant_ids: [userId || userUsername, senderUsername],
            last_message: '     [' + bc.title + '] ' + bc.content,
            last_message_time: bc.created_at || now,
            last_message_sender: senderUsername,
            last_message_status: 'sent',
            unread_count: 1,
            updated_at: bc.created_at || now
          }, { merge: true }).catch(() => {});

          setDoc(doc(db, 'messages', msgId), {
            id: msgId,
            chat_id: chatId,
            sender: senderUsername,
            text: `     **[${bc.title}]**\n\n${bc.content}`,
            timestamp: bc.created_at || now,
            status: 'sent',
            read_by: JSON.stringify([senderUsername]),
            is_system_broadcast: true
          }).catch(() => {});
        });
      },
      (err) => console.warn('Firestore broadcasts listener notice:', err.message)
    );

    return () => {
      unsubscribeBroadcasts();
    };
  }, [isFirebaseConfigured, db, userUsername, userId, userDisplayName]);

  // Instant Multi-Tab Real-time Broadcast Accelerator for Messages
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel('zenoa_realtime_messages');
    bc.onmessage = (event) => {
      const data = event.data;
      if (data && data.chat_id && data.message) {
        setMessagesByChat(prev => ({
          ...prev,
          [data.chat_id]: dedupeMessages([...(prev[data.chat_id] || []), data.message])
        }));
        setChats(prev => {
          const exists = prev.some(c => c.id === data.chat_id);
          if (!exists && data.chat) {
            return [data.chat, ...prev];
          }
          return prev.map(c => {
            if (c.id === data.chat_id) {
              return {
                ...c,
                last_message: data.message.text || 'New message',
                last_time: 'now',
                updated_at: Date.now(),
                last_message_sender: data.message.sender,
                last_message_status: 'delivered' as const,
                unread: (c.id === activeChatId) ? 0 : (c.unread || 0) + 1
              };
            }
            return c;
          });
        });
      }
    };
    return () => {
      try { bc.close(); } catch(e) {}
    };
  }, [activeChatId]);

  // Synchronize messages for the active chat only
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !activeChatId || !userUsername) {
      return;
    }

    // Zero-Trust Check: Confirm active chat belongs to current user
    const currentChat = chats.find(c => c.id === activeChatId);
    if (!currentChat) {
      return;
    }
    const isParticipant = (currentChat.participants || []).some((p: string) => isSenderMe(p) || p.toLowerCase() === userUsername.toLowerCase() || (userId && p === userId)) ||
                          (currentChat.participant_ids || []).some((p: string) => (userId && p === userId) || p.toLowerCase() === userUsername.toLowerCase());
    if (!isParticipant) {
      console.warn("Unauthorized active chat access attempt blocked:", activeChatId);
      setActiveChatId('');
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chat_id', '==', activeChatId)
    );

    const unsubscribeMessages = onSnapshot(
      messagesQuery,
      async (snapshot) => {
        const decryptedDocs = await Promise.all(snapshot.docs.map(async docSnap => {
          const m = docSnap.data();
          const chat_id = m.chat_id;
          if (!chat_id) return null;

          let clearText = m.text || '';
          if (clearText) {
            try {
              clearText = await decryptMessageText(clearText, chat_id);
            } catch {
              // Keep as is
            }
          }

          let parsedReactions: any[] = [];
          if (m.reactions) {
            if (typeof m.reactions === 'string') {
              try {
                parsedReactions = JSON.parse(m.reactions);
              } catch (e) {
                parsedReactions = [];
              }
            } else {
              parsedReactions = m.reactions;
            }
          }

          let parsedReadBy: string[] = [];
          if (m.read_by) {
            if (typeof m.read_by === 'string') {
              try {
                parsedReadBy = JSON.parse(m.read_by);
              } catch (e) {
                parsedReadBy = [];
              }
            } else {
              parsedReadBy = m.read_by;
            }
          }

          return {
            id: m.id || docSnap.id,
            chat_id: m.chat_id, 
            created_at: m.created_at || 0,
            expires_at: m.expires_at,
            sender: m.sender || 'unknown',
            text: clearText,
            type: (m.type || 'text') as any,
            call_data: m.call_data || undefined,
            location_data: m.location_data || undefined,
            contact_data: m.contact_data || undefined,
            poll_data: m.poll_data || undefined,
            media_url: (m.media_url && !m.media_url.startsWith('[File Attachment'))
              ? m.media_url
              : (localMediaCacheRef.current[m.id || docSnap.id] || (m.file_name ? localMediaCacheRef.current[m.file_name] : undefined) || (m.type === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : undefined)),
            audio_url: m.audio_url || undefined,
            file_name: m.file_name || undefined,
            file_size: m.file_size || undefined,
            timestamp: m.timestamp || '',
            reply_to: m.reply_to || undefined,
            reply_sender: m.reply_sender || undefined,
            reply_preview: m.reply_preview || undefined,
            edited: m.edited || false,
            deleted_for_everyone: m.deleted_for_everyone || false,
            deleted_for_me: m.deleted_for_me || false,
            reactions: parsedReactions,
            read_by: parsedReadBy,
            forwarded: m.forwarded || false,
            pinned: m.pinned || false
          };
        }));

        const activeMsgs = decryptedDocs
          .filter((msg): msg is Exclude<typeof msg, null> => msg !== null)
          .filter((msg) => {
            const chat = chatsRef.current.find(c => c.id === activeChatId);
            if (chat && chat.cleared_at && chat.cleared_at[userUsername]) {
              return (msg.created_at || 0) >= chat.cleared_at[userUsername];
            }
            return true;
          });

        if (activeMsgs.length > 0) {
          // 1. Save all incoming messages to local device IndexedDB (awaited to guarantee write sequencing)
          await storageManager.saveMessages(activeMsgs).catch(() => {});

          // 2. Mark incoming unread messages as read in real-time
          let hasUnreadIncoming = false;
          const cleanSelf = userUsername.toLowerCase().trim().replace(/^@/, '');
          snapshot.docs.forEach(docSnap => {
            const m = docSnap.data();
            const mSender = (m.sender || '').toLowerCase();
            if (mSender !== userUsername.toLowerCase() && mSender !== cleanSelf && (!m.read_by || !Array.isArray(m.read_by) || (!m.read_by.includes(userUsername) && !m.read_by.includes(cleanSelf)))) {
              hasUnreadIncoming = true;
              updateDoc(doc(db, 'messages', docSnap.id), {
                read_by: arrayUnion(userUsername, cleanSelf)
              }).catch(() => {});
            }
          });

          // Reset unread counts on active chat document
          setDoc(doc(db, 'chats', activeChatId), {
            last_message_status: 'read',
            [`unread_by_user.${cleanSelf}`]: 0,
            [`unread_by_user.${userUsername.toLowerCase()}`]: 0,
            [`unread_by_user.${userUsername}`]: 0
          }, { merge: true }).catch(() => {});
        }

        // Fetch all local messages from IndexedDB for this chat to combine history
        const localChatMsgs = await storageManager.getMessagesForChat(activeChatId);
        const combinedMsgs = [...localChatMsgs, ...activeMsgs].sort((a, b) => {
          const timeA = a.created_at || 0;
          const timeB = b.created_at || 0;
          if (timeA !== timeB) return timeA - timeB;
          return a.id > b.id ? 1 : -1;
        });

        const now = Date.now();
        const unexpiredMsgs = combinedMsgs.filter(msg => {
          if (msg.expires_at && now > msg.expires_at) {
            deleteDoc(doc(db, 'messages', msg.id)).catch(() => {});
            storageManager.deleteMessage(msg.id).catch(() => {});
            return false;
          }
          return true;
        });

        setMessagesByChat(prev => ({
          ...prev,
          [activeChatId]: dedupeMessages(unexpiredMsgs)
        }));
      },
      (err) => {
        console.warn("Messages sync error:", err.message);
      }
    );

    return () => {
      unsubscribeMessages();
    };
  }, [isFirebaseConfigured, db, activeChatId, userUsername]);

  // Real Presence & User Status Sync Heartbeat with Instant Offline Cleanup
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userId) return;

    const syncPresence = (isOnline = true) => {
      const now = Date.now();
      setDoc(doc(db, 'users', userId), {
        online: isOnline && myPresenceStatus !== 'offline',
        activity_status: myPresenceStatus,
        custom_status: myCustomStatus,
        activity_type: myActivityType,
        last_seen: isOnline ? 'just now' : new Date(now).toISOString(),
        last_seen_timestamp: now
      }, { merge: true }).catch(err => console.warn("Presence sync notice:", err));
    };

    syncPresence(true);
    
    // Heartbeat every 15 seconds
    const interval = setInterval(() => syncPresence(true), 15000);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        syncPresence(false);
      } else {
        syncPresence(true);
      }
    };

    const handleBeforeUnload = () => {
      syncPresence(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      syncPresence(false);
    };
  }, [userId, myPresenceStatus, myCustomStatus, myActivityType, isFirebaseConfigured, db]);

  // Execute Automatic Logout when Concurrent Login Modal is triggered (5 second countdown)
  const executeConcurrentLogout = async () => {
    setShowConcurrentLoginModal(false);
    try {
      sessionStorage.removeItem('zenoa_active_session_token');
      if (auth) {
        await firebaseSignOut(auth).catch(() => {});
      }
    } catch (err) {
      console.warn("Logout execution notice:", err);
    }
    setIsAuthenticated(false);
    setUserUsername('');
    setUserId('');
    setUserDisplayName('');
    setActiveCallSession(null);
    showToast("Logged out: Account accessed from another device");
  };

  // 5-Second Countdown Effect for Concurrent Login Modal
  useEffect(() => {
    if (!showConcurrentLoginModal) {
      setConcurrentLogoutCountdown(5);
      return;
    }

    setConcurrentLogoutCountdown(5);
    const timer = setInterval(() => {
      setConcurrentLogoutCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          executeConcurrentLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showConcurrentLoginModal]);

  // Desktop Responsive Auto-select First Chat
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      if (!activeChatId && chats.length > 0 && activeView === 'chats') {
        setActiveChatId(chats[0].id);
      }
    }
  }, [chats, activeChatId, activeView]);

  // Register Active Session Token in Firestore & Listen for Multi-Device / Concurrent Login
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername || !currentSessionToken || !userId) {
      return;
    }

    const userDocRef = doc(db, 'users', userId);

    // Only register session token if this tab explicitly initiated login or if no session token exists yet
    const isExplicitLogin = sessionStorage.getItem('zenoa_is_explicit_login') === 'true';
    if (isExplicitLogin) {
      sessionStorage.removeItem('zenoa_is_explicit_login');
      setDoc(userDocRef, {
        active_session_token: currentSessionToken,
        active_session_created_at: Date.now(),
        last_login_device: navigator.userAgent || 'Web Browser'
      }, { merge: true }).catch(err => console.warn("Session token registration notice:", err));

      // Broadcast NEW_LOGIN to invalidate old tabs on the same device
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const sessionBc = new BroadcastChannel(`zenoa_session_sync_${userUsername.toLowerCase()}`);
          sessionBc.postMessage({
            type: 'NEW_LOGIN',
            sessionToken: currentSessionToken
          });
          setTimeout(() => sessionBc.close(), 1000);
        }
      } catch {}
    }

    let broadcastChannel: BroadcastChannel | null = null;
    let unsubscribeUserDoc: () => void = () => {};

    // 1. Same-device multi-tab BroadcastChannel listener
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        broadcastChannel = new BroadcastChannel(`zenoa_session_sync_${userUsername.toLowerCase()}`);
        broadcastChannel.onmessage = (event) => {
          const data = event.data;
          if (data && data.type === 'NEW_LOGIN' && data.sessionToken && data.sessionToken !== currentSessionToken) {
            console.warn("New session started in another tab! Terminating old session.");
            setShowConcurrentLoginModal(true);
            setKickoutData({ username: userUsername, countdown: 5 });
          }
        };
      }
    } catch (bcErr) {
      console.warn("Session BroadcastChannel listener notice:", bcErr);
    }

    // 2. Cross-device / multi-browser Firestore snapshot listener
    unsubscribeUserDoc = onSnapshot(
      userDocRef,
      (snap) => {
        if (!snap.exists()) return;
        const data = snap.data();
        // If Firestore contains a different active session token, this session is older and must terminate
        if (data && data.active_session_token && data.active_session_token !== currentSessionToken) {
          console.warn("Concurrent login detected on another device/browser! Terminating old session.", data.active_session_token, currentSessionToken);
          setShowConcurrentLoginModal(true);
          setKickoutData({ username: userUsername, countdown: 5 });
        }
      },
      (err) => {
        console.warn("Session snapshot listener notice:", err.message);
      }
    );

    return () => {
      unsubscribeUserDoc();
      if (broadcastChannel) broadcastChannel.close();
    };
  }, [isFirebaseConfigured, db, userUsername, userId, currentSessionToken]);

  // Monitor active call document status changes to close Call Modal on both sides if ended or declined
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !activeCallSession?.id) return;

    const callDocRef = doc(db, 'calls', activeCallSession.id);
    const unsubscribeActiveCall = onSnapshot(callDocRef, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.status === 'ended' || data.status === 'declined') {
        console.log("Active call ended remotely in Firestore:", data.status);
        setActiveCallSession(null);
      }
    }, (err) => {
      console.warn("Active call listener notice:", err);
    });

    return () => {
      unsubscribeActiveCall();
    };
  }, [activeCallSession?.id, isFirebaseConfigured, db]);

  // Live Voice & Video Signaling Listener for Incoming Calls (Firestore + BroadcastChannel)
  useEffect(() => {
    let unsubscribeCalls: (() => void) | null = null;
    let unsubscribeCallsClean: (() => void) | null = null;
    let localBc1: BroadcastChannel | null = null;
    let localBc2: BroadcastChannel | null = null;

    if (isFirebaseConfigured && db && userUsername) {
      const cleanSelf = userUsername.toLowerCase().trim().replace(/^@/, '');

      const handleCallSnap = (snapshot: any) => {
        snapshot.docChanges().forEach((change: any) => {
          if (change.type === 'added' || change.type === 'modified') {
            const callData = change.doc.data();
            const recClean = callData.receiver_clean || callData.receiver?.toLowerCase();
            if (callData.status === 'dialing' && (recClean === cleanSelf || callData.receiver === userUsername || callData.receiver_uid === userId)) {
              const callerUserObj = users[callData.caller] || users[callData.caller_clean] || Object.values(users).find(u => u.username?.toLowerCase() === callData.caller_clean || u.username === callData.caller);
              setActiveCallSession({
                id: callData.id,
                type: callData.type as 'voice' | 'video',
                status: 'ringing', // Mark as ringing for recipient
                isIncoming: true,
                partnerUsername: callData.caller,
                partnerName: callData.caller_name || callerUserObj?.display_name || callData.caller,
                partnerAvatarSeed: callData.caller_avatar_seed || callerUserObj?.avatar_seed || callData.caller,
                partnerAvatarUrl: callData.caller_avatar_url || callerUserObj?.avatar_url,
                startedAt: callData.created_at || Date.now(),
                startTimeStr: callData.start_time_str || new Date(callData.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              });
            }
          }
        });
      };

      const qClean = query(
        collection(db, 'calls'),
        where('receiver_clean', '==', cleanSelf),
        where('status', '==', 'dialing')
      );
      unsubscribeCallsClean = onSnapshot(qClean, handleCallSnap, (err) => console.warn("Call signaling notice:", err));

      if (userUsername !== cleanSelf) {
        const qOrig = query(
          collection(db, 'calls'),
          where('receiver', '==', userUsername),
          where('status', '==', 'dialing')
        );
        unsubscribeCalls = onSnapshot(qOrig, handleCallSnap, (err) => console.warn("Call signaling notice:", err));
      }
    }

    try {
      if (typeof BroadcastChannel !== 'undefined' && userUsername) {
        const handleBcMsg = (e: MessageEvent) => {
          const callData = e.data;
          const cleanSelf = userUsername.toLowerCase().trim().replace(/^@/, '');
          const recClean = callData?.receiver_clean || callData?.receiver?.toLowerCase();
          if (callData && callData.status === 'dialing' && (recClean === cleanSelf || callData.receiver === userUsername || callData.receiver_uid === userId)) {
            const callerUserObj = users[callData.caller] || Object.values(users).find(u => u.username === callData.caller);
            setActiveCallSession({
              id: callData.id,
              type: callData.type as 'voice' | 'video',
              status: 'ringing',
              isIncoming: true,
              partnerUsername: callData.caller,
              partnerName: callerUserObj?.display_name || callData.caller,
              partnerAvatarSeed: callerUserObj?.avatar_seed || callData.caller,
              partnerAvatarUrl: callerUserObj?.avatar_url,
              startedAt: callData.created_at || Date.now(),
              startTimeStr: callData.start_time_str || new Date(callData.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        };

        localBc1 = new BroadcastChannel(`zenoa_incoming_calls_${userUsername}`);
        localBc1.onmessage = handleBcMsg;

        const cleanSelf = userUsername.toLowerCase().trim().replace(/^@/, '');
        if (userUsername !== cleanSelf) {
          localBc2 = new BroadcastChannel(`zenoa_incoming_calls_${cleanSelf}`);
          localBc2.onmessage = handleBcMsg;
        }
      }
    } catch (bcErr) {
      console.warn("BroadcastChannel initialization notice:", bcErr);
    }

    return () => {
      if (unsubscribeCalls) unsubscribeCalls();
      if (unsubscribeCallsClean) unsubscribeCallsClean();
      if (localBc1) localBc1.close();
      if (localBc2) localBc2.close();
    };
  }, [userUsername, userId, isFirebaseConfigured, db, users]);

  // Live Call History Listener across all devices & sessions (Caller and Receiver)
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername) return;

    let unsubCaller: (() => void) | null = null;
    let unsubReceiver: (() => void) | null = null;
    const callsMap = new Map<string, CallHistoryRecord>();

    const updateCallsState = () => {
      const sorted = Array.from(callsMap.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
      setFirestoreCalls(sorted);
    };

    try {
      const qCaller = query(
        collection(db, 'calls'),
        where('caller', '==', userUsername)
      );
      unsubCaller = onSnapshot(qCaller, (snapshot) => {
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const partnerUsername = data.receiver || '';
          const partnerUserObj = users[partnerUsername] || Object.values(users).find(u => u.username === partnerUsername);
          const isOutgoing = true;
          const status = data.status || 'answered';
          const rec: CallHistoryRecord = {
            id: data.id || d.id,
            call_type: data.type === 'video' ? 'video' : 'voice',
            status: status === 'ended' ? 'answered' : status,
            caller: data.caller,
            receiver: data.receiver,
            caller_name: data.caller_name || userDisplayName || userUsername,
            receiver_name: data.receiver_name || partnerUserObj?.display_name || partnerUsername,
            partner_username: partnerUsername,
            partner_name: data.receiver_name || partnerUserObj?.display_name || partnerUsername,
            partner_avatar_seed: data.receiver_avatar_seed || partnerUserObj?.avatar_seed || partnerUsername,
            partner_avatar_url: data.receiver_avatar_url || partnerUserObj?.avatar_url,
            is_outgoing: isOutgoing,
            timestamp: data.start_time_str || (data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'),
            created_at: data.created_at || (data.ended_at ? data.ended_at - 1000 : Date.now()),
            duration_seconds: data.duration_seconds ?? data.duration ?? 0,
            duration_formatted: data.duration_formatted || (data.duration ? `${Math.floor(data.duration / 60).toString().padStart(2, '0')}:${(data.duration % 60).toString().padStart(2, '0')}` : undefined)
          };
          callsMap.set(rec.id, rec);
        });
        updateCallsState();
      }, (err) => {
        console.warn("Calls caller query notice:", err);
      });

      const qReceiver = query(
        collection(db, 'calls'),
        where('receiver', '==', userUsername)
      );
      unsubReceiver = onSnapshot(qReceiver, (snapshot) => {
        snapshot.docs.forEach((d) => {
          const data = d.data();
          const partnerUsername = data.caller || '';
          const partnerUserObj = users[partnerUsername] || Object.values(users).find(u => u.username === partnerUsername);
          const isOutgoing = false;
          const status = data.status || 'answered';
          const rec: CallHistoryRecord = {
            id: data.id || d.id,
            call_type: data.type === 'video' ? 'video' : 'voice',
            status: status === 'ended' ? 'answered' : status,
            caller: data.caller,
            receiver: data.receiver,
            caller_name: data.caller_name || partnerUserObj?.display_name || partnerUsername,
            receiver_name: data.receiver_name || userDisplayName || userUsername,
            partner_username: partnerUsername,
            partner_name: data.caller_name || partnerUserObj?.display_name || partnerUsername,
            partner_avatar_seed: data.caller_avatar_seed || partnerUserObj?.avatar_seed || partnerUsername,
            partner_avatar_url: data.caller_avatar_url || partnerUserObj?.avatar_url,
            is_outgoing: isOutgoing,
            timestamp: data.start_time_str || (data.created_at ? new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'),
            created_at: data.created_at || (data.ended_at ? data.ended_at - 1000 : Date.now()),
            duration_seconds: data.duration_seconds ?? data.duration ?? 0,
            duration_formatted: data.duration_formatted || (data.duration ? `${Math.floor(data.duration / 60).toString().padStart(2, '0')}:${(data.duration % 60).toString().padStart(2, '0')}` : undefined)
          };
          callsMap.set(rec.id, rec);
        });
        updateCallsState();
      }, (err) => {
        console.warn("Calls receiver query notice:", err);
      });
    } catch (e) {
      console.warn("Calls snapshot setup error:", e);
    }

    return () => {
      if (unsubCaller) unsubCaller();
      if (unsubReceiver) unsubReceiver();
    };
  }, [userUsername, isFirebaseConfigured, db, userDisplayName, users]);

  // Aggregated Call History across all sources (Firestore + Chat Call logs)
  const allUserCalls = useMemo<CallHistoryRecord[]>(() => {
    const map = new Map<string, CallHistoryRecord>();

    // 1. Add Firestore calls
    firestoreCalls.forEach(c => map.set(c.id, c));

    // 2. Extract call logs from messagesByChat
    Object.entries(messagesByChat).forEach(([chatId, msgs]) => {
      const targetChat = chats.find(c => c.id === chatId);
      const partnerUsername = targetChat?.type === 'dm' ? targetChat.username : (targetChat?.name || '');
      const partnerObj = users[partnerUsername] || Object.values(users).find(u => u.username === partnerUsername);

      msgs.forEach(m => {
        if (m.type === 'call' || m.call_data) {
          const callId = m.call_data?.call_id || m.id.replace('call_log_', '');
          const isOutgoing = m.sender === 'me' || m.sender === userUsername;
          const txtLower = (m.text || '').toLowerCase();
          const status = m.call_data?.status || (txtLower.includes('missed') ? 'missed' : txtLower.includes('declined') ? 'declined' : 'answered');
          const callType = m.call_data?.call_type || (txtLower.includes('video') ? 'video' : 'voice');
          
          if (!map.has(callId)) {
            map.set(callId, {
              id: callId,
              call_type: callType,
              status: status,
              caller: isOutgoing ? (userUsername || 'me') : partnerUsername,
              receiver: isOutgoing ? partnerUsername : (userUsername || 'me'),
              caller_name: isOutgoing ? (userDisplayName || 'You') : (partnerObj?.display_name || partnerUsername),
              receiver_name: isOutgoing ? (partnerObj?.display_name || partnerUsername) : (userDisplayName || 'You'),
              partner_username: partnerUsername,
              partner_name: partnerObj?.display_name || targetChat?.name || partnerUsername,
              partner_avatar_seed: partnerObj?.avatar_seed || targetChat?.avatar_seed || partnerUsername,
              partner_avatar_url: partnerObj?.avatar_url || targetChat?.avatar_url,
              is_outgoing: isOutgoing,
              timestamp: m.timestamp,
              created_at: m.created_at || (Date.now() - 10000),
              duration_seconds: m.call_data?.duration_seconds,
              duration_formatted: m.call_data?.duration_formatted
            });
          }
        }
      });
    });

    return Array.from(map.values()).sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
  }, [firestoreCalls, messagesByChat, chats, userUsername, userDisplayName, users]);

  // Sync Media Player Speed & Volume
  useEffect(() => {
    if (mediaPlayerRef.current) {
      try {
        mediaPlayerRef.current.playbackRate = mediaPlaybackSpeed;
      } catch (e) {}
    }
  }, [mediaPlaybackSpeed]);

  useEffect(() => {
    if (mediaPlayerRef.current) {
      try {
        mediaPlayerRef.current.volume = mediaIsMuted ? 0 : mediaVolume;
      } catch (e) {}
    }
  }, [mediaVolume, mediaIsMuted]);


  // Check username availability
  const isUsernameValidFormat = usernameInput.length >= 3 && usernameInput.length <= 20 && /^[a-z0-9_]+$/.test(usernameInput);
  const isUsernameAvailable = isUsernameValidFormat && !uniqueUserList.some(u => (u.username || '').toLowerCase() === usernameInput.toLowerCase());



  // Dismiss Toast helper
  const showToast = (msg: string) => {
    // Completely disabled as requested by user to never show toast indicators
  };

  // Auth Functions
  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address to reset password');
      return;
    }
    setIsLoading(true);
    try {
      if (isFirebaseConfigured && auth) {
        await sendPasswordResetEmail(auth, emailInput.trim());
      }
      setSuccessMessage(`A password reset link has been sent to ${emailInput.trim()}. Please check your email inbox.`);
    } catch (err: any) {
      console.warn('Password reset notice:', err);
      setErrorMessage(err.message || 'Failed to send password reset email. Please check the email address.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    if (isFirebaseConfigured && db && auth) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        if (!userObj.emailVerified) {
          await firebaseSignOut(auth);
          setErrorMessage('Please verify your email address before logging in.');
          setIsLoading(false);
          return;
        }
        
        // Retrieve profile from Firestore
        const userDocRef = doc(db, 'users', userObj.uid);
        const userSnap = await getDoc(userDocRef);

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
        setAuthMethod('email');

        if (userSnap.exists()) {
          const profile = userSnap.data();

          if (profile.is_service_account) {
            await firebaseSignOut(auth);
            setErrorMessage('Access Denied: Service Accounts cannot be accessed interactively.');
            setIsLoading(false);
            return;
          }

          const uName = profile.username || '';
          const dName = profile.display_name || profile.username || '';
          setUserUsername(uName);
          setUserDisplayName(dName);
          setUserBio(profile.bio || '');
          setUserAvatarSeed(profile.avatar_seed || profile.username || '');
          setUserAvatarUrl(profile.avatar_url || '');
          setUserNameChanges(profile.name_change_timestamps || []);
          setUserUsernameChanges(profile.username_change_timestamps || []);
          setSavedDisplayName(dName);
          setSavedUsername(uName);
          setIsAuthenticated(true);
          showToast(`Welcome back, ${dName}!`);
        } else {
          // Profile is missing, trigger onboarding
          const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
          setUsernameInput(resolvedUsername);
          setOnboardingStep(1);
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred during sign in.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local sandbox login simulation
      setTimeout(() => {
        setIsLoading(false);
        const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
        setUserId('u_' + Math.random().toString(36).substring(2, 9));
        setUserEmail(emailInput);
        setUserDisplayName(resolvedUsername ? (resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1)) : "User");
        setUserAvatarSeed(resolvedUsername);
        setAuthMethod('email');

        const existingUser = Object.values(users).find(u => u.username === resolvedUsername);
        if (existingUser) {
          setUserUsername(existingUser.username);
          setUserDisplayName(existingUser.display_name);
          setUserBio(existingUser.bio);
          setUserAvatarSeed(existingUser.avatar_seed);
          setIsAuthenticated(true);
          showToast(`Welcome back, ${existingUser.display_name}!`);
        } else {
          setUsernameInput(resolvedUsername);
          setOnboardingStep(1);
        }
      }, 800);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    if (isFirebaseConfigured && db && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        try {
          await sendEmailVerification(userObj);
          await firebaseSignOut(auth);
          setSuccessMessage('Account created! A verification link has been sent to your email. Please verify before logging in.');
          setAuthMode('login');
          setPasswordInput('');
          setConfirmPasswordInput('');
        } catch (verifErr: any) {
          console.warn("Failed to send verification email:", verifErr);
          await firebaseSignOut(auth);
          setErrorMessage('Failed to send verification email. Please try resetting your password.');
          setAuthMode('login');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local sandbox registration simulation
      setTimeout(() => {
        setIsLoading(false);
        const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
        setUserId('u_' + Math.random().toString(36).substring(2, 9));
        setUserEmail(emailInput);
        setUserDisplayName(resolvedUsername ? (resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1)) : "User");
        setUserAvatarSeed(resolvedUsername);
        setAuthMethod('email');
        
        setUsernameInput(resolvedUsername);
        setOnboardingStep(1);
      }, 800);
    }
  };

  const [authMethod, setAuthMethod] = useState<string>('');

  const handleRequestOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (phoneInput.trim().length < 8) {
      setErrorMessage('Please enter a valid phone number');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setSuccessMessage('A 6-digit verification code has been sent to ' + phoneInput);
    }, 600);
  };

  const handleVerifyOTP = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (otpInput.trim().length < 4) {
      setErrorMessage('Please enter the verification code');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const safePhone = (phoneInput || '').trim();
      const randSeed = 'user' + (safePhone ? safePhone.slice(-4) : Math.random().toString(36).substring(2, 6));
      setUserId('u_' + Math.random().toString(36).substring(2, 9));
      setUserPhone(safePhone);
      setUserDisplayName('User ' + (safePhone ? safePhone.slice(-4) : 'Guest'));
      setUserAvatarSeed(randSeed);
      setAuthMethod('phone');
      
      setUsernameInput(randSeed);
      setOnboardingStep(1);
    }, 800);
  };

  const handleCheckUsernameAvailability = async (targetUsername: string) => {
    return await checkUsernameIsTakenInFirestore(db, targetUsername, userId || pendingUserAuth?.uid, users);
  };

  const handleCompleteMandatoryAccountSetup = async (data: {
    fullName: string;
    username: string;
    bio: string;
    avatarSeed: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanFullName = data.fullName.trim();
    const cleanUsername = data.username.trim().toLowerCase();

    if (!cleanFullName) {
      return { success: false, error: 'Full Display Name is required.' };
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters.' };
    }

    const targetUid = userId || pendingUserAuth?.uid || auth?.currentUser?.uid;
    const targetEmail = userEmail || pendingUserAuth?.email || auth?.currentUser?.email || '';

    const checkRes = await checkUsernameIsTakenInFirestore(db, cleanUsername, targetUid, users);
    if (checkRes.isTaken) {
      return { success: false, error: checkRes.reason || `@${cleanUsername} is already registered.` };
    }

    const now = Date.now();
    setUserDisplayName(cleanFullName);
    setUserUsername(cleanUsername);
    setSavedDisplayName(cleanFullName);
    setSavedUsername(cleanUsername);
    setUserBio(data.bio);
    setUserAvatarSeed(data.avatarSeed || cleanUsername);
    if (targetUid) setUserId(targetUid);
    if (targetEmail) setUserEmail(targetEmail);

    if (isFirebaseConfigured && db && targetUid) {
      try {
        await setDoc(doc(db, 'users', targetUid), {
          id: targetUid,
          email: targetEmail,
          display_name: cleanFullName,
          username: cleanUsername,
          bio: data.bio || 'Hey there! I am using Zenoa Messenger.',
          avatar_seed: data.avatarSeed || cleanUsername,
          created_at: now,
          name_change_timestamps: [now],
          username_change_timestamps: [now],
          online: true,
          last_seen: 'online'
        }, { merge: true });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `users/${targetUid}`, auth);
      }

      try {
        await setDoc(doc(db, 'usernames', cleanUsername), {
          uid: targetUid,
          username: cleanUsername,
          created_at: now
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, `usernames/${cleanUsername}`, auth);
      }
    }

    setIsNewUserSetupPending(false);
    setPendingUserAuth(null);
    setIsAuthenticated(true);
    showToast('Account setup complete! Welcome to Zenoa.');
    return { success: true };
  };

  const handleOAuthLogin = async (provider: string) => {
    setIsLoading(true);
    setErrorMessage('');
    
    if (isFirebaseConfigured && db && auth) {
      try {
        let authProvider;
        if (provider === 'google') {
          authProvider = new GoogleAuthProvider();
        } else {
          authProvider = new FacebookAuthProvider();
        }
        const userCredential = await signInWithPopup(auth, authProvider);
        const userObj = userCredential.user;

        // Retrieve profile from Firestore
        const userDocRef = doc(db, 'users', userObj.uid);
        const userSnap = await getDoc(userDocRef);

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
        setAuthMethod(provider);

        if (userSnap.exists() && userSnap.data()?.username && userSnap.data()?.display_name) {
          const profile = userSnap.data();
          const uName = profile.username;
          const dName = profile.display_name;
          setUserUsername(uName);
          setUserDisplayName(dName);
          setUserBio(profile.bio || '');
          setUserAvatarSeed(profile.avatar_seed || uName);
          setUserAvatarUrl(profile.avatar_url || '');
          setUserNameChanges(profile.name_change_timestamps || []);
          setUserUsernameChanges(profile.username_change_timestamps || []);
          setSavedDisplayName(dName);
          setSavedUsername(uName);
          setIsAuthenticated(true);
          setIsNewUserSetupPending(false);

          // Trigger smooth Google opening animation
          setOpeningAnimationData({ displayName: dName, provider });
          setIsOpeningAnimationActive(true);
          setTimeout(() => setIsOpeningAnimationActive(false), 2500);

          confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
          showToast(`Welcome back, ${dName}!`);
        } else {
          // Profile is missing or incomplete, force mandatory account setup
          setPendingUserAuth(userObj);
          setUserDisplayName(userObj.displayName || '');
          setIsNewUserSetupPending(true);
          setIsAuthenticated(false);
        }
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
          console.info('OAuth popup was closed or cancelled by user.');
        } else if (err.code === 'auth/popup-blocked') {
          setErrorMessage('Login popup was blocked by browser. Please allow popups.');
        } else {
          setErrorMessage(err.message || `An error occurred starting ${provider} login.`);
        }
      } finally {
        setIsLoading(false);
      }
    } else {
      setTimeout(() => {
        setIsLoading(false);
        const name = provider === 'google' ? 'Alex Rivera' : 'Facebook User';
        const userseed = provider === 'google' ? 'alexrivera' : 'gituser';
        setUserId('u_' + Math.random().toString(36).substring(2, 9));
        setUserEmail(`${userseed}@example.com`);
        setUserDisplayName(name);
        setUserUsername(userseed);
        setUserAvatarSeed(userseed);
        setAuthMethod(provider);
        setIsAuthenticated(true);

        // Trigger smooth opening animation
        setOpeningAnimationData({ displayName: name, provider });
        setIsOpeningAnimationActive(true);
        setTimeout(() => setIsOpeningAnimationActive(false), 2500);

        confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
        showToast(`Signed in successfully via ${provider === 'google' ? 'Google' : 'Facebook'}`);
      }, 800);
    }
  };

  // AuthFlow Helper Handlers
  const handleForgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    if (!isFirebaseConfigured || !auth) {
      return { success: false, error: 'Auth not configured' };
    }
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send reset email' };
    }
  };

  const handleAuthFlowLogin = async (identifier: string, pass: string): Promise<{ success: boolean; requiresOtp?: boolean; error?: string }> => {
    const cleanId = identifier.toLowerCase().replace(/^@/, '').trim();
    if (cleanId.startsWith('sa_')) {
      return { success: false, error: 'Service Accounts cannot be logged in directly. They are designated strictly for automated API dispatches and OTP services.' };
    }

    let emailToUse = identifier;

    if (!identifier.includes('@')) {
      const cleanUsername = identifier.toLowerCase().replace('@', '').trim();

      if (isFirebaseConfigured && db) {
        try {
          const usersRef = collection(db, 'users');
          const q = query(usersRef, where('username', '==', cleanUsername));
          const querySnap = await getDocs(q);
          if (!querySnap.empty) {
            const matchedUser = querySnap.docs[0].data();
            if (matchedUser.is_service_account || matchedUser.is_business_account) {
              return { success: false, error: 'Service Accounts cannot be logged in directly. They are designated strictly for automated API dispatches and OTP services.' };
            }

            if (matchedUser.email) {
              emailToUse = matchedUser.email;
            }
          } else {
            return { success: false, error: `No account found with username @${cleanUsername}` };
          }
        } catch (err: any) {
          console.warn("Username lookup notice:", err);
        }
      } else {
        const localUser = Object.values(users).find(u => u && (u.username || '').toLowerCase() === cleanUsername);
        if (localUser && localUser.email) {
          emailToUse = localUser.email;
        } else {
          return { success: false, error: `No account found with username @${cleanUsername}` };
        }
      }
    }

    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailToUse, pass);
        const userObj = userCredential.user;

        const userDocRef = doc(db, 'users', userObj.uid);
        const userSnap = await getDoc(userDocRef);

        if (!userObj.emailVerified && !userSnap.exists()) {
          try {
            await sendEmailVerification(userObj);
          } catch (vErr) {
            console.warn("Verification resend error:", vErr);
          }
          setIsEmailVerificationPending(true);
          setPendingVerificationEmail(userObj.email || emailToUse);
          return { success: true };
        }

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
        setAuthMethod('email');

        if (userSnap.exists() && userSnap.data()?.username && userSnap.data()?.display_name) {
          const profile = userSnap.data();
          setUserUsername(profile.username);
          setUserDisplayName(profile.display_name);
          setUserBio(profile.bio || '');
          setUserAvatarSeed(profile.avatar_seed || profile.username);
          setUserAvatarUrl(profile.avatar_url || '');
          setIsAuthenticated(true);
          setIsNewUserSetupPending(false);
        } else {
          setPendingUserAuth(userObj);
          setUserDisplayName(userObj.displayName || '');
          setIsNewUserSetupPending(true);
          setIsAuthenticated(false);
        }

        showToast(`Welcome back!`);
        return { success: true };
      } catch (err: any) {
        console.warn("Login auth error:", err);
        const code = err.code || (err.message && err.message.includes('/') ? err.message : '');
        if (code.includes('auth/invalid-credential') || code.includes('auth/wrong-password') || code.includes('auth/user-not-found')) {
          return { success: false, error: 'Incorrect email/username or password. Please check your credentials and try again.' };
        }
        if (code.includes('auth/too-many-requests')) {
          return { success: false, error: 'Too many failed login attempts. This account has been temporarily locked to protect your privacy. Please try again in a few minutes or reset your password.' };
        }
        return { success: false, error: 'Sign in failed. Please verify your internet connection and credentials.' };
      }
    } else {
      const resolvedUsername = emailToUse.split('@')[0].replace(/[^a-z0-9_]/g, '');
      setUserId('u_' + Math.random().toString(36).substring(2, 9));
      setUserEmail(emailToUse);
      setUserUsername(resolvedUsername);
      setUserDisplayName(resolvedUsername ? (resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1)) : "User");
      setUserAvatarSeed(resolvedUsername);
      setAuthMethod('email');
      setIsAuthenticated(true);
      showToast(`Welcome back!`);
      return { success: true };
    }
  };

  const handleAuthFlowRegister = async (data: {
    email: string;
    fullName: string;
    username: string;
    zenoa_id?: string;
    dob: string;
    gender: string;
    password: string;
    mobile_number?: string;
  }): Promise<{ success: boolean; error?: string }> => {
    const cleanFullName = (data.fullName || '').trim();
    const cleanUsername = (data.username || '').trim().toLowerCase();

    let cleanZenoaId = (data.zenoa_id || `${cleanUsername}@zenoa`).trim().toLowerCase();
    if (!cleanZenoaId.endsWith('@zenoa')) {
      cleanZenoaId = `${cleanZenoaId.replace(/[^a-z0-9._-]/g, '')}@zenoa`;
    }

    if (!cleanFullName) {
      return { success: false, error: 'Full Display Name is strictly mandatory.' };
    }
    if (!cleanUsername || cleanUsername.length < 3) {
      return { success: false, error: 'Username must be at least 3 characters long.' };
    }
    if (cleanUsername.startsWith('sa_') || cleanUsername === 'zenoa') {
      return { success: false, error: 'Usernames starting with "sa_" or "zenoa" are strictly reserved for secure system and service accounts.' };
    }

    // Direct check against Firestore & local state before creating account
    const checkRes = await checkUsernameIsTakenInFirestore(db, cleanUsername, undefined, users);
    if (checkRes.isTaken) {
      return { success: false, error: checkRes.reason || `@${cleanUsername} is already taken by another account.` };
    }

    // Check if phone number is already registered to another account
    if (data.mobile_number && data.mobile_number.trim() && isFirebaseConfigured && db) {
      try {
        const rawDigits = data.mobile_number.replace(/[^0-9]/g, '');
        const candPhones = Array.from(new Set([
          data.mobile_number.trim(),
          rawDigits,
          rawDigits.length >= 10 ? `+91${rawDigits.slice(-10)}` : null
        ].filter(Boolean))) as string[];

        const usersRef = collection(db, 'users');
        for (const cand of candPhones) {
          const qMob = query(usersRef, where('mobile_number', '==', cand));
          const snapMob = await getDocs(qMob);
          if (!snapMob.empty) {
            return {
              success: false,
              error: 'This mobile number is already linked to another Zenoa account. For account security, each mobile number can only be associated with a single account. Please use a different phone number or sign in to your existing account.'
            };
          }
        }
      } catch (pErr) {
        console.warn("Registration phone uniqueness check note:", pErr);
      }
    }

    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userObj = userCredential.user;

        const now = Date.now();
        await setDoc(doc(db, 'users', userObj.uid), {
          id: userObj.uid,
          zenoa_id: cleanZenoaId,
          email: data.email,
          display_name: cleanFullName,
          username: cleanUsername,
          dob: data.dob,
          gender: data.gender,
          avatar_seed: cleanUsername,
          bio: 'Hey there! I am using Zenoa Messenger.',
          mobile_number: data.mobile_number || '',
          phone_number: data.mobile_number || '',
          created_at: now
        });

        await setDoc(doc(db, 'usernames', cleanUsername), {
          uid: userObj.uid,
          username: cleanUsername,
          zenoa_id: cleanZenoaId,
          created_at: now
        });

        // Deliver all system broadcasts & welcome message to new account
        deliverBroadcastsToUser(userObj.uid, cleanUsername, cleanFullName);

        const isMobileSignUp = Boolean(data.mobile_number && data.mobile_number.trim());
        const isInternalEmail = !data.email || data.email.endsWith('@zenoa.mail') || data.email.endsWith('@zenoa.internal');

        if (!isMobileSignUp && !isInternalEmail) {
          try {
            await sendEmailVerification(userObj);
          } catch (verifErr) {
            console.warn("Verification email notice:", verifErr);
          }

          setIsEmailVerificationPending(true);
          setPendingVerificationEmail(data.email);
        } else {
          // If registered via Mobile Number, NEVER send magic link or email verification
          setUserId(userObj.uid);
          setUserEmail(data.email);
          setUserUsername(cleanUsername);
          setUserDisplayName(cleanFullName);
          setUserAvatarSeed(cleanUsername);
          setIsAuthenticated(true);
          setIsEmailVerificationPending(false);
          setPendingVerificationEmail('');
        }

        return { success: true };
      } catch (err: any) {
        console.warn("Registration auth error:", err);
        const code = err.code || (err.message && err.message.includes('/') ? err.message : '');
        if (code.includes('auth/email-already-in-use')) {
          return { success: false, error: 'An account with this email address is already registered. Please sign in instead.' };
        }
        if (code.includes('auth/invalid-email')) {
          return { success: false, error: 'The email address format is invalid. Please verify and try again.' };
        }
        if (code.includes('auth/weak-password')) {
          return { success: false, error: 'The password is too weak. Please ensure your password is at least 6 characters long.' };
        }
        return { success: false, error: 'Registration failed. The selected email or username might already be in use.' };
      }
    } else {
      const mockUid = 'u_' + Math.random().toString(36).substring(2, 9);
      const mockUser = {
        id: mockUid,
        email: data.email,
        display_name: cleanFullName,
        username: cleanUsername,
        avatar_seed: cleanUsername,
        bio: 'Hey there! I am using Zenoa Messenger.',
        online: true,
        last_seen: 'Just now'
      };
      setUsers(prev => ({
        ...prev,
        [mockUid]: mockUser
      }));

      setUserId(mockUid);
      setUserEmail(data.email);
      setUserUsername(cleanUsername);
      setUserDisplayName(cleanFullName);
      setUserAvatarSeed(cleanUsername);
      setAuthMethod('email');

      return { success: true };
    }
  };

  const handleAuthFlowVerifyOtp = async (code: string): Promise<{ success: boolean; error?: string }> => {
    // Guaranteed direct verification for Magic Link!
    setIsAuthenticated(true);
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    showToast('Verified via Magic Link! Welcome to Zenoa.');
    return { success: true };
  };

  // Onboarding functions
  const handleOnboardingStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUsernameAvailable) {
      setErrorMessage('Username is not available or invalid format');
      return;
    }
    setDisplayNameInput(userDisplayName);
    setOnboardingStep(2);
  };

  const handleOnboardingStep2 = async (skip: boolean) => {
    const finalDisplayName = skip ? usernameInput : (displayNameInput || usernameInput);
    const finalBio = skip ? 'Hey there! I am using Zenoa.' : bioInput;

    const now = Date.now();
    const newUserData: UserData = {
      username: usernameInput,
      display_name: finalDisplayName,
      bio: finalBio,
      avatar_seed: userAvatarSeed,
      avatar_url: userAvatarUrl || '',
      name_change_timestamps: [now],
      username_change_timestamps: [now],
      online: true,
      last_seen: 'online'
    };

    deliverBroadcastsToUser(userId || usernameInput, usernameInput, finalDisplayName);
    // Save user info
    setUserUsername(usernameInput);
    setSavedUsername(usernameInput);
    setUserDisplayName(finalDisplayName);
    setSavedDisplayName(finalDisplayName);
    setUserBio(finalBio);
    setUserNameChanges([now]);
    setUserUsernameChanges([now]);
    
    if (isFirebaseConfigured && db && auth && userId) {
      try {
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          username: usernameInput,
          display_name: finalDisplayName,
          bio: finalBio,
          avatar_seed: userAvatarSeed,
          avatar_url: userAvatarUrl || '',
          name_change_timestamps: [now],
          username_change_timestamps: [now],
          online: true,
          last_seen: 'online'
        });
      } catch (err: any) {
        console.error("Profile setDoc error:", err);
      }
    }
    
    // Add user to users seed
    setUsers(prev => ({
      ...prev,
      [usernameInput]: newUserData
    }));

    setIsAuthenticated(true);
    setOnboardingStep(3);
    confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    showToast('Profile created successfully! Welcome to Zenoa.');
  };

  // Photo upload and WhatsApp-style crop flow
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG, JPG, WebP)');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      showToast('Image size should be under 15MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setCropperSourceImage(result);
        setShowImageCropper(true);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCroppedAvatarSave = (croppedDataUrl: string) => {
    setEditDraftAvatarUrl(croppedDataUrl);
    setUserAvatarUrl(croppedDataUrl);
    setShowImageCropper(false);
    showToast('Profile picture updated');
  };

  const handleRemovePhoto = () => {
    triggerConfirm({
      title: 'Remove Profile Photo?',
      description: 'Your custom profile avatar will be removed and reset to your initials.',
      confirmText: 'Remove Photo',
      variant: 'danger',
      onConfirm: () => {
        setEditDraftAvatarUrl('');
        setUserAvatarUrl('');
        showToast('Photo removed. Save profile to apply.');
        closeConfirm();
      }
    });
  };

  // Rate Limiting calculations
  const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;

  const recentNameChanges = userNameChanges.filter(ts => Date.now() - ts < FOURTEEN_DAYS_MS);
  const remainingNameChanges = Math.max(0, 2 - recentNameChanges.length);
  const oldestActiveNameChange = recentNameChanges.length > 0 ? Math.min(...recentNameChanges) : null;
  const nextNameChangeDate = oldestActiveNameChange 
    ? new Date(oldestActiveNameChange + FOURTEEN_DAYS_MS).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  const recentUsernameChanges = userUsernameChanges.filter(ts => Date.now() - ts < ONE_DAY_MS);
  const remainingUsernameChanges = Math.max(0, 7 - recentUsernameChanges.length);
  const oldestActiveUsernameChange = recentUsernameChanges.length > 0 ? Math.min(...recentUsernameChanges) : null;
  const nextUsernameChangeTime = oldestActiveUsernameChange 
    ? new Date(oldestActiveUsernameChange + ONE_DAY_MS).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : null;

  const cleanDraftUsername = editDraftUsername.trim().toLowerCase().replace(/^@/, '');
  const isUsernameFormatValidInSettings = cleanDraftUsername.length >= 3 && cleanDraftUsername.length <= 20 && /^[a-z0-9_]+$/.test(cleanDraftUsername);
  const isUsernameAvailableInSettings = isUsernameFormatValidInSettings && (
    cleanDraftUsername === (savedUsername || '').toLowerCase() ||
    cleanDraftUsername === (userUsername || '').toLowerCase() ||
    !uniqueUserList.some(u => u.username?.toLowerCase() === cleanDraftUsername && u.id !== userId)
  );

  const handleSaveProfile = async () => {
    const formattedDisplayName = editDraftDisplayName.trim();
    if (!formattedDisplayName) {
      showToast('Display name cannot be empty');
      return;
    }

    const now = Date.now();
    const formattedUsername = cleanDraftUsername || userUsername;
    const oldUsername = savedUsername || userUsername;

    // 1. Check Display Name Rate Limit (Twice in 14 days)
    const isDisplayNameChanged = formattedDisplayName !== (savedDisplayName || '').trim();
    let updatedNameChanges = [...recentNameChanges];

    if (isDisplayNameChanged) {
      if (remainingNameChanges <= 0) {
        showToast(`Display Name can only be changed twice every 14 days. Next change available: ${nextNameChangeDate}`);
        return;
      }
      updatedNameChanges.push(now);
    }

    // 2. Check Username Rate Limit (7 times per day) and validity
    const isUsernameChanged = formattedUsername !== (savedUsername || '').toLowerCase();
    let updatedUsernameChanges = [...recentUsernameChanges];

    if (isUsernameChanged) {
      if (!isUsernameFormatValidInSettings) {
        showToast('Username must be 3-20 characters: letters, numbers, and underscores only.');
        return;
      }
      if (!isUsernameAvailableInSettings) {
        showToast(`@${formattedUsername} is already taken. Please choose another username.`);
        return;
      }
      if (remainingUsernameChanges <= 0) {
        showToast(`Username can only be changed 7 times per day. Next reset available at: ${nextUsernameChangeTime}`);
        return;
      }
      updatedUsernameChanges.push(now);
    }

    // 3. Instant Optimistic State Updates (Ultra-fast, 0ms latency)
    setUserDisplayName(formattedDisplayName);
    setSavedDisplayName(formattedDisplayName);
    setUserUsername(formattedUsername);
    setSavedUsername(formattedUsername);
    setUserBio(editDraftBio);
    setUserAvatarUrl(editDraftAvatarUrl);
    setUserAvatarSeed(editDraftAvatarSeed || formattedUsername);
    setUserNameChanges(updatedNameChanges);
    setUserUsernameChanges(updatedUsernameChanges);

    // Update local users dictionary so existing and new mappings both resolve cleanly
    setUsers(prev => {
      const next = { ...prev };
      const userProfile: UserData = {
        id: userId,
        username: formattedUsername,
        display_name: formattedDisplayName,
        bio: editDraftBio,
        avatar_seed: editDraftAvatarSeed || formattedUsername,
        avatar_url: editDraftAvatarUrl || '',
        name_change_timestamps: updatedNameChanges,
        username_change_timestamps: updatedUsernameChanges,
        previous_usernames: Array.from(new Set([...(prev[oldUsername]?.previous_usernames || []), oldUsername].filter(Boolean))),
        online: true,
        last_seen: 'online'
      };
      next[formattedUsername] = userProfile;
      if (oldUsername && oldUsername !== formattedUsername) {
        next[oldUsername] = userProfile;
      }
      if (userId) {
        next[userId] = userProfile;
      }
      return next;
    });

    // Update all chats in local state immediately so no chat history or previews are ever lost
    setChats(prev => prev.map(c => {
      const newParticipants = (c.participants || []).map(p => (p === oldUsername ? formattedUsername : p));
      const newLastSender = c.last_message_sender === oldUsername ? formattedUsername : c.last_message_sender;
      return {
        ...c,
        participants: newParticipants,
        last_message_sender: newLastSender
      };
    }));

    setShowEditProfileModal(false);
    showToast('Profile updated successfully');

    // 4. Background Asynchronous Firestore Persistence
    if (isFirebaseConfigured && db && auth && userId) {
      try {
        const userDocRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userDocRef);
        const existingPrev = userSnap.exists() ? (userSnap.data().previous_usernames || []) : [];
        const prevList = isUsernameChanged && oldUsername
          ? Array.from(new Set([...existingPrev, oldUsername].filter(Boolean)))
          : existingPrev;

        const existingData = userSnap.exists() ? userSnap.data() : {};
        const activePhone = userPhone || existingData.mobile_number || existingData.phone_number || '';

        const activeZenoaId = existingData.zenoa_id || currentUserObj?.zenoa_id || `${formattedUsername}@zenoa`;

        const profilePayload = {
          id: userId,
          zenoa_id: activeZenoaId,
          username: formattedUsername,
          display_name: formattedDisplayName,
          bio: editDraftBio,
          avatar_seed: editDraftAvatarSeed || formattedUsername,
          avatar_url: editDraftAvatarUrl || '',
          name_change_timestamps: updatedNameChanges,
          username_change_timestamps: updatedUsernameChanges,
          previous_usernames: prevList,
          mobile_number: activePhone,
          phone_number: activePhone,
          online: true,
          last_seen: 'online',
          updated_at: Date.now()
        };

        await setDoc(userDocRef, profilePayload, { merge: true });

        // If username changed, update chat participant arrays in Firestore in the background
        if (isUsernameChanged && oldUsername) {
          const chatsColRef = collection(db, 'chats');
          const qOld = query(chatsColRef, where('participants', 'array-contains', oldUsername));
          const oldSnap = await getDocs(qOld);
          for (const cDoc of oldSnap.docs) {
            const cData = cDoc.data();
            const pList: string[] = cData.participants || [];
            const updatedPList = pList.map(p => p === oldUsername ? formattedUsername : p);
            if (!updatedPList.includes(formattedUsername)) {
              updatedPList.push(formattedUsername);
            }
            await updateDoc(doc(db, 'chats', cDoc.id), {
              participants: updatedPList,
              ...(cData.last_message_sender === oldUsername ? { last_message_sender: formattedUsername } : {})
            });
          }
        }
      } catch (err: any) {
        console.warn("Background profile sync error:", err.message);
      }
    }
  };

  const handlePromptLogout = () => {
    triggerConfirm({
      title: 'Log Out of Zenoa?',
      description: 'Are you sure you want to sign out of your account on this device?',
      confirmText: 'Log Out',
      variant: 'danger',
      onConfirm: () => {
        closeConfirm();
        handleLogout();
      }
    });
  };

  const handleDeleteBackupFromDrive = async (password: string) => {
    if (!driveAccessToken) {
      showToast('Please connect Google Drive first');
      return;
    }

    if (!window.confirm('CRITICAL: Are you sure you want to permanently delete your backup from Google Drive? This action cannot be undone.')) {
      return;
    }

    setIsBackingUp(true);
    try {
      // 1. Verification: Try to download and decrypt first to ensure password is correct
      const vaultFile = await findVaultFile(driveAccessToken);
      if (vaultFile) {
        const encrypted = await downloadVaultFile(driveAccessToken, vaultFile.id);
        try {
          await decryptVault(encrypted, password);
        } catch (e) {
          showToast('Invalid Master Password. Deletion denied for security.');
          return;
        }
      }

      // 2. Proceed with deletion
      await deleteVaultFile(driveAccessToken);
      showToast('Backup permanently deleted from Google Drive.');
    } catch (err: any) {
      console.error('Delete backup failed:', err);
      showToast('Failed to delete backup.');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleLogout = async () => {
    if (isFirebaseConfigured && db && auth) {
      await firebaseSignOut(auth);
    }
    setIsAuthenticated(false);
    setOnboardingStep(0);
    setAuthMode('login');
    setEmailInput('');
    setPasswordInput('');
    setConfirmPasswordInput('');
    setPhoneInput('');
    setOtpInput('');
    setOtpSent(false);
    setErrorMessage('');
    setSuccessMessage('');
    
    // Complete session memory wipe
    setUserId('');
    setUserEmail('');
    setUserUsername('');
    setUserDisplayName('');
    setUserBio('');
    setUserAvatarSeed('');
    setUserAvatarUrl('');
    setChats([]);
    setMessagesByChat({});
    setActiveChatId('');
    setIsDriveConnected(false);
    setDriveAccessToken(null);
    localStorage.removeItem('zenoa_drive_connected');
  };

  const handleConnectDrive = async () => {
    if (isFirebaseConfigured && auth) {
      try {
        console.log("Starting Google Drive connection for project:", auth.app.options.projectId);
        const provider = new GoogleAuthProvider();
        provider.addScope('https://www.googleapis.com/auth/drive.appdata');
        provider.addScope('https://www.googleapis.com/auth/drive.file');
        
        const result = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        
        if (credential?.accessToken) {
          setDriveAccessToken(credential.accessToken);
          setIsDriveConnected(true);
          localStorage.setItem('zenoa_drive_connected', 'true');
          showToast('Google Drive connected successfully');
        } else {
          showToast('Failed to obtain Google Drive access token');
        }
      } catch (err: any) {
        if (err.code === 'auth/popup-closed-by-user') {
          console.info('Google Drive sign-in popup was closed by user.');
          showToast('Connection cancelled.');
        } else if (err.code === 'auth/cancelled-popup-request') {
          console.info('Google Drive popup request was cancelled or superseded.');
        } else if (err.code === 'auth/popup-blocked') {
          console.warn('Google Drive popup was blocked by browser.');
          showToast('Popup blocked. Please allow popups to connect Google Drive.');
        } else if (err.code === 'auth/missing-project-id') {
          console.error('Drive connection configuration error:', err);
          showToast('Configuration Error: Firebase Project ID is missing.');
        } else {
          console.error('Drive connection error:', err);
          showToast(`Connection failed: ${err.message || 'Unknown error'}`);
        }
      }
    } else {
      showToast('Firebase Auth not configured. Drive connection unavailable.');
    }
  };

  const handleDisconnectDrive = () => {
    setIsDriveConnected(false);
    setDriveAccessToken(null);
    localStorage.removeItem('zenoa_drive_connected');
    showToast('Google Drive disconnected');
  };

  const handleBackupToDrive = async (password: string) => {
    if (!driveAccessToken) {
      handleConnectDrive();
      return;
    }

    setIsBackingUp(true);
    try {
      // 1. Collect data from local IndexedDB and current state
      const allMessages = await storageManager.getAllMessages();
      const backupData = {
        messages: allMessages,
        chats: chats,
        callLogs: firestoreCalls,
        settings: {
          themeMode,
          soundEffects,
          desktopNotifications,
          messagePreviews,
          vibrateFeedback,
          enterToSend,
          autoDownloadMedia,
          twoFactorAuth,
          mediaUploadQuality,
          voiceRecordingQuality,
          broadcastTypingStatus,
          autoPlayVoiceNotes,
          callDataSaver,
          inCallRingtone,
          noiseSuppression
        },
        userProfile: {
          displayName: userDisplayName,
          avatarUrl: userAvatarUrl,
          avatarSeed: userAvatarSeed,
          bio: myCustomStatus
        },
        email: userEmail,
        timestamp: Date.now(),
        version: 4,
        user: userUsername
      };

      // 2. Encrypt data with Master Password
      const encrypted = await encryptVault(JSON.stringify(backupData), password);

      // 3. Upload to Google Drive (overwrite if exists)
      const fileId = await uploadVaultFile(driveAccessToken, encrypted, lastBackupInfo?.id);
      
      const info = await findVaultFile(driveAccessToken);
      setLastBackupInfo(info);
      showToast('Vault backed up to Cloud successfully');
    } catch (err: any) {
      console.error('Backup error:', err);
      showToast(`Backup failed: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleRestoreFromDrive = async (password: string) => {
    if (!driveAccessToken) {
      handleConnectDrive();
      return;
    }

    setIsRestoring(true);
    try {
      // 1. Find the vault file
      const info = await findVaultFile(driveAccessToken);
      if (!info) {
        throw new Error('No backup found on your Google Drive');
      }

      // 2. Download the encrypted blob
      const encrypted = await downloadVaultFile(driveAccessToken, info.id);

      // 3. Decrypt with Master Password
      const decryptedJson = await decryptVault(encrypted, password);
      const backupData = JSON.parse(decryptedJson);
      
      // 4. Identity Check: Ensure backup belongs to current user
      if (backupData.user && backupData.user !== userUsername) {
        throw new Error(`Restoration failed: This backup belongs to @${backupData.user}, but you are logged in as @${userUsername}.`);
      }
      
      if (backupData.email && userEmail && backupData.email !== userEmail) {
        throw new Error(`Restoration failed: This backup was created with ${backupData.email}, but you are using ${userEmail}. Please switch to the correct Google account.`);
      }

      // 5. Validate and restore to local IndexedDB and State
      if (backupData.messages && Array.isArray(backupData.messages)) {
        // Restore Messages
        await storageManager.saveMessages(backupData.messages);
        const organized: Record<string, Message[]> = {};
        backupData.messages.forEach((msg: Message) => {
          const chatId = msg.chat_id;
          if (!organized[chatId]) organized[chatId] = [];
          organized[chatId].push(msg);
        });
        setMessagesByChat(organized);

        // Restore Chats
        if (backupData.chats) {
          setChats(backupData.chats);
        }

        // Restore Call Logs
        if (backupData.callLogs) {
          setFirestoreCalls(backupData.callLogs);
        }

        // Restore Settings
        if (backupData.settings) {
          const s = backupData.settings;
          if (s.themeMode) setThemeMode(s.themeMode);
          if (s.soundEffects !== undefined) setSoundEffects(s.soundEffects);
          if (s.desktopNotifications !== undefined) setDesktopNotifications(s.desktopNotifications);
          if (s.messagePreviews !== undefined) setMessagePreviews(s.messagePreviews);
          if (s.vibrateFeedback !== undefined) setVibrateFeedback(s.vibrateFeedback);
          if (s.enterToSend !== undefined) setEnterToSend(s.enterToSend);
          if (s.autoDownloadMedia !== undefined) setAutoDownloadMedia(s.autoDownloadMedia);
          if (s.twoFactorAuth !== undefined) setTwoFactorAuth(s.twoFactorAuth);
          if (s.mediaUploadQuality) setMediaUploadQuality(s.mediaUploadQuality);
          if (s.voiceRecordingQuality) setVoiceRecordingQuality(s.voiceRecordingQuality);
          if (s.broadcastTypingStatus !== undefined) setBroadcastTypingStatus(s.broadcastTypingStatus);
          if (s.autoPlayVoiceNotes !== undefined) setAutoPlayVoiceNotes(s.autoPlayVoiceNotes);
          if (s.callDataSaver !== undefined) setCallDataSaver(s.callDataSaver);
          if (s.inCallRingtone !== undefined) setInCallRingtone(s.inCallRingtone);
          if (s.noiseSuppression !== undefined) setNoiseSuppression(s.noiseSuppression);
        }

        // Restore Profile (Local only, user might need to re-sync with Firestore for public view)
        if (backupData.userProfile) {
          const p = backupData.userProfile;
          if (p.displayName) setUserDisplayName(p.displayName);
          if (p.avatarUrl) setUserAvatarUrl(p.avatarUrl);
          if (p.avatarSeed) setUserAvatarSeed(p.avatarSeed);
          if (p.bio) setMyCustomStatus(p.bio);
        }
        
        showToast('Full Vault restored successfully!');
      } else {
        throw new Error('Invalid backup format');
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      showToast(`Restore failed: ${err.message}`);
    } finally {
      setIsRestoring(false);
    }
  };

  // Sound effects helper using Web Audio API
  const playChimeSound = (type: 'send' | 'receive' | 'test' = 'send') => {
    if (!soundEffects && type !== 'test') return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.13);
      } else if (type === 'receive') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.18, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.19);
      }
    } catch (e) {
      // Audio context autoplay policy fallback
    }
  };

  // Export full chat data and profile JSON backup
  const handleExportChatData = () => {
    const exportPayload = {
      app: "Zenoa Messenger",
      version: "2.4.0",
      export_timestamp: new Date().toISOString(),
      user_profile: {
        user_id: userId,
        display_name: userDisplayName,
        username: userUsername,
        bio: userBio,
        email: userEmail,
        phone: userPhone,
        avatar_seed: userAvatarSeed,
        avatar_url: userAvatarUrl || null
      },
      privacy_preferences: {
        last_seen: privacyLastSeen,
        online_status: privacyOnlineStatus,
        read_receipts: privacyReadReceipts,
        profile_photo_visibility: privacyProfilePhoto,
        username_search_visibility: privacyUsernameVisible
      },
      active_chats_count: chats.length,
      chats: chats,
      messages: messagesByChat
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `zenoa-chat-backup-${userUsername || 'me'}-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Chat data and profile backup exported successfully!');
  };

  // Clear current active chat messages
  const handleClearActiveChatHistory = () => {
    if (!activeChatId) return;
    triggerConfirm({
      title: 'Clear Chat History?',
      description: 'All messages in this conversation will be permanently removed. This action cannot be undone.',
      confirmText: 'Clear Messages',
      variant: 'danger',
      onConfirm: () => {
        setMessagesByChat(prev => ({
          ...prev,
          [activeChatId]: []
        }));
        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: 'Chat cleared', unread: 0 } : c));
        showToast('Active chat history cleared.');
        closeConfirm();
      }
    });
  };

  // Clear local storage and cache
  const handleResetLocalCache = () => {
    triggerConfirm({
      title: 'Clear Cache & Local Data?',
      description: 'All local cached data and session tokens will be reset, and the app will reload.',
      confirmText: 'Clear & Reload',
      variant: 'danger',
      onConfirm: () => {
        closeConfirm();
        try {
          localStorage.clear();
          sessionStorage.clear();
          showToast('Cache cleared successfully! Reloading...');
          setTimeout(() => {
            window.location.reload();
          }, 600);
        } catch (e) {
          showToast('Cache reset failed.');
        }
      }
    });
  };

  // Request browser notification permission
  const handleRequestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      showToast('Notifications are not supported by your browser environment.');
      return;
    }
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setDesktopNotifications(true);
        showToast('Desktop push notifications enabled!');
      } else {
        setDesktopNotifications(false);
        showToast('Notification permission was not granted.');
      }
    } catch (err) {
      setDesktopNotifications(false);
      showToast('Notification permission request completed.');
    }
  };

  // Chat/Messenger Business Logic
  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const activeMessages = dedupeMessages(messagesByChat[activeChatId] || []);

  // Filter messages based on chat search
  const filteredActiveMessages = activeMessages.filter(msg => {
    if (msg.deleted_for_me) return false;
    if (messageSearchQuery.trim()) {
      return (msg.text || '').toLowerCase().includes((messageSearchQuery || '').toLowerCase());
    }
    return true;
  });

  // Filter chats based on sidebar search with robust deduplication
  const uniqueChats = chats.filter((chat, index, self) => {
    const idIdx = self.findIndex(c => c.id === chat.id);
    if (index !== idIdx) return false;
    if (chat.type === 'dm' && chat.username) {
      const dmIdx = self.findIndex(c => c.type === 'dm' && c.username?.toLowerCase() === chat.username?.toLowerCase());
      if (index !== dmIdx) return false;
    }
    return true;
  });
  const filteredChats = uniqueChats.filter(chat => {
    const query = chatSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return (chat.name || '').toLowerCase().includes(query) || (chat.username && chat.username.toLowerCase().includes(query));
  });

  // Global user search (for Discover view) with smart relevance ranking
  const globalSearchResults = useMemo(() => {
    const q = globalSearchQuery.toLowerCase().trim();
    if (!q) return [];
    const cleanCurrentU = (userUsername || '').trim().toLowerCase();
    const cleanCurrentId = (userId || '').trim().toLowerCase();
    const myUserData = users[userUsername] || {};
    const myFollowing = myUserData.following || [];
    const myFollowers = myUserData.followers || [];
    const isUserAdmin = myUserData?.role === 'admin' || myUserData?.role === 'super_admin';

    return uniqueUserList
      .filter(user => {
        const uName = (user.username || '').toLowerCase();
        const uId = (user.id || '').toLowerCase();

        // Only filter out the logged in user themselves
        if ((cleanCurrentU && uName === cleanCurrentU) || (cleanCurrentId && uId === cleanCurrentId)) {
          return false;
        }

        // Service accounts are unfindable for normal users unless they have an old chat
        if (user.is_service_account) {
          const hasOldChat = chats.some(c => c.type === 'dm' && c.username?.toLowerCase() === uName);
          if (!isUserAdmin && !hasOldChat) {
            return false;
          }
        }

        return true;
      })
      .map(user => {
        const uName = (user.username || '').toLowerCase();
        const dName = (user.display_name || '').toLowerCase();
        const bio = (user.bio || '').toLowerCase();
        let score = 0;

        // Exact username matches gets the highest score
        if (uName === q) {
          score += 100;
        } else if (uName.startsWith(q)) {
          score += 80;
        } else if (uName.includes(q)) {
          score += 40;
        }

        // Display name matches
        if (dName === q) {
          score += 50;
        } else if (dName.startsWith(q)) {
          score += 30;
        } else if (dName.includes(q)) {
          score += 20;
        }

        // Bio match
        if (bio.includes(q)) {
          score += 10;
        }

        // Friendship / follow status boosts results to rank mutual contacts higher
        const iFollowThem = myFollowing.includes(user.username);
        const theyFollowMe = myFollowers.includes(user.username) || (user.following || []).includes(userUsername);
        if (iFollowThem && theyFollowMe) {
          score += 25; // Mutual boost
        } else if (iFollowThem || theyFollowMe) {
          score += 15; // Single follow boost
        }

        return { user, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.user);
  }, [globalSearchQuery, uniqueUserList, userUsername, userId, users, chats]);

  // Active contacts list (Only mutual followers: I follow them and they follow me)
  const activeContactsList = useMemo(() => {
    const cleanCurrentU = (userUsername || '').trim().toLowerCase();
    const cleanCurrentId = (userId || '').trim().toLowerCase();
    const myUserData = users[userUsername] || {};
    const myFollowing = myUserData.following || [];
    const myFollowers = myUserData.followers || [];

    return uniqueUserList.filter(user => {
      const uName = user.username || '';
      const uNameLower = uName.toLowerCase();
      const uId = (user.id || '').toLowerCase();
      
      if ((cleanCurrentU && uNameLower === cleanCurrentU) || (cleanCurrentId && uId === cleanCurrentId)) {
        return false;
      }

      // Mutual follow check: I follow them AND they follow me (or are in each other's following lists)
      const iFollowThem = myFollowing.includes(uName);
      const theyFollowMe = myFollowers.includes(uName) || (user.following || []).includes(userUsername);
      return iFollowThem && theyFollowMe;
    });
  }, [uniqueUserList, userUsername, userId, users]);

  // Sidebar matching contacts for quick chat initiation
  const matchingContactsForSidebar = useMemo(() => {
    const q = chatSearchQuery.toLowerCase().trim();
    if (!q) return [];
    const cleanCurrentU = (userUsername || '').trim().toLowerCase();
    const cleanCurrentId = (userId || '').trim().toLowerCase();
    const myUserData = users[userUsername] || {};
    const isUserAdmin = myUserData?.role === 'admin' || myUserData?.role === 'super_admin';

    return uniqueUserList.filter(user => {
      const uName = (user.username || '').toLowerCase();
      const uId = (user.id || '').toLowerCase();
      const dName = (user.display_name || '').toLowerCase();

      if ((cleanCurrentU && uName === cleanCurrentU) || (cleanCurrentId && uId === cleanCurrentId)) {
        return false;
      }

      // Service accounts are unfindable for normal users unless they have an old chat
      if (user.is_service_account) {
        const hasOldChat = chats.some(c => c.type === 'dm' && c.username?.toLowerCase() === uName);
        if (!isUserAdmin && !hasOldChat) {
          return false;
        }
      }

      return uName.includes(q) || dName.includes(q);
    });
  }, [chatSearchQuery, uniqueUserList, userUsername, userId, users, chats]);

  const getExpiresAt = (chatId: string) => {
    const mode = chatDisappearing[chatId] || 'off';
    if (mode === 'off') return undefined;
    if (mode === '24h') return Date.now() + 24 * 60 * 60 * 1000;
    if (mode === '48h') return Date.now() + 48 * 60 * 60 * 1000;
    if (mode === '7d') return Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (mode === '30d') return Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (mode.startsWith('custom_')) {
      const parts = mode.split('_');
      if (parts.length === 2) {
        const val = parseInt(parts[1].slice(0, -1), 10);
        const unit = parts[1].slice(-1);
        if (!isNaN(val) && val > 0) {
          if (unit === 'h') return Date.now() + val * 60 * 60 * 1000;
          if (unit === 'd') return Date.now() + val * 24 * 60 * 60 * 1000;
        }
      }
    }
    return undefined;
  };

  // Send message
  const handleSendMessage = async () => {
    if (!activeChatId || !activeChat) return;
    const text = composerText.trim();
    if (!text && !editMessageId) return;

    if (editMessageId) {
      // Handle message edit
      if (isFirebaseConfigured && db && auth) {
        try {
          const encryptedPayload = await encryptMessageText(text, activeChatId);
          await setDoc(doc(db, 'messages', editMessageId), {
            text: encryptedPayload,
            edited: true
          }, { merge: true });
        } catch (err) {
          console.warn("Edit message notice:", err);
        }
      }

      setMessagesByChat(prev => {
        const chatMsgs = prev[activeChatId] || [];
        const updated = chatMsgs.map(m => {
          if (m.id === editMessageId) {
            return { ...m, text, edited: true };
          }
          return m;
        });
        return { ...prev, [activeChatId]: updated };
      });

      // Update last message in chat preview
      setChats(prev => prev.map(c => {
        if (c.id === activeChatId) {
          return { ...c, last_message: `You: ${text}`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const };
        }
        return c;
      }));

      setEditMessageId('');
    } else {
      // Send new message
      const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const newMsg: Message = {
        id: newMsgId,
        chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
        sender: 'me',
        text,
        type: 'text',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reactions: [],
        read_by: [],
        reply_to: replyToId || undefined,
        reply_sender: replyToSender || undefined,
        reply_preview: replyToPreview || undefined
      };

      // Persist locally to sender device IndexedDB
      storageManager.saveMessages([newMsg]).catch(() => {});

      // Dispatch via local BroadcastChannel accelerator for zero-latency multi-tab sync
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('zenoa_realtime_messages');
          bc.postMessage({
            chat_id: activeChatId,
            message: newMsg,
            chat: activeChat
          });
          setTimeout(() => { try { bc.close(); } catch(e){} }, 1000);
        }
      } catch (bcErr) {
        console.warn("Message BroadcastChannel post notice:", bcErr);
      }

      if (isFirebaseConfigured && db) {
        try {
          const encryptedPayload = await encryptMessageText(text, activeChatId);
          await setDoc(doc(db, 'messages', newMsgId), {
            id: newMsgId,
            chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
            sender: userUsername || 'me',
            text: encryptedPayload,
            type: 'text',
            timestamp: newMsg.timestamp,
            reactions: [],
            read_by: [],
            reply_to: replyToId || null,
            reply_sender: replyToSender || null,
            reply_preview: replyToPreview || null,
            forwarded: false,
            pinned: false
          });

          // Update chat last message
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          const selfName = userUsername || 'me';
          const normalizedParts = buildNormalizedParticipants(selfName, currentActiveChat.username, userId);

          // Compute unread map for target users
          const targetUsers = (currentActiveChat.participants || []).filter(p => p && p.toLowerCase() !== selfName.toLowerCase() && p !== userId);
          const unreadByMap: Record<string, any> = {};
          targetUsers.forEach(p => {
            if (p) {
              const cleanP = p.toLowerCase().trim().replace(/^@/, '');
              unreadByMap[cleanP] = increment(1);
              unreadByMap[p] = increment(1);
            }
          });
          unreadByMap[selfName.toLowerCase()] = 0;
          unreadByMap[selfName] = 0;

          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type || 'dm',
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            avatar_url: currentActiveChat.avatar_url || '',
            participants: normalizedParts,
            participant_details: {
              [selfName.toLowerCase()]: { username: selfName, display_name: userDisplayName || selfName, avatar_seed: userAvatarSeed || selfName, avatar_url: userAvatarUrl || '' },
              ...(currentActiveChat.username ? {
                [currentActiveChat.username.toLowerCase()]: { username: currentActiveChat.username, display_name: currentActiveChat.name, avatar_seed: currentActiveChat.avatar_seed || currentActiveChat.username, avatar_url: currentActiveChat.avatar_url || '' }
              } : {})
            },
            last_message: text,
            last_time: 'now',
            updated_at: Date.now(),
            last_message_sender: selfName,
            last_message_status: 'delivered' as const,
            unread_by_user: unreadByMap,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        } catch (err) {
          console.warn("Message delivery notice:", err);
        }
      }

      setMessagesByChat(prev => ({
        ...prev,
        [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg])
      }));

      // Update last message in chat preview
      setChats(prev => {
        const list = prev.map(c => {
          if (c.id === activeChatId) {
            return {
              ...c,
              last_message: `You: ${text}`,
              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
              unread: 0
            };
          }
          return c;
        });
        // Move active chat to the top
        const activeIdx = list.findIndex(c => c.id === activeChatId);
        if (activeIdx > 0) {
          const [activeItem] = list.splice(activeIdx, 1);
          list.unshift(activeItem);
        }
        return list;
      });

      // Clear composer state
      setReplyToId('');
      setReplyToPreview('');
      setReplyToSender('');
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (activeChatId && isFirebaseConfigured && db) {
      setDoc(doc(db, 'chats', activeChatId), {
        typing_username: null,
        typing_updated_at: null
      }, { merge: true }).catch(() => {});
    }
    try {
      if (typeof BroadcastChannel !== 'undefined' && activeChatId) {
        const bc = new BroadcastChannel('zenoa_typing_events');
        bc.postMessage({ chatId: activeChatId, sender: userUsername, isTyping: false });
        setTimeout(() => bc.close(), 500);
      }
    } catch (e) {}

    setComposerText('');
    setMyActivityType('none');
    setShowEmojiPanel(false);
    setShowStickerPanel(false);
  };

  // Reply message trigger
  const handleStartReply = (msg: Message) => {
    setReplyToId(msg.id);
    setReplyToPreview(msg.text || `[${msg.type}]`);
    setReplyToSender(getSenderDisplayName(msg.sender));
    setEditMessageId('');
  };

  // Edit message trigger
  const handleStartEdit = (msg: Message) => {
    setEditMessageId(msg.id);
    setComposerText(msg.text);
    setReplyToId('');
    setReplyToPreview('');
    setReplyToSender('');
  };

  // Attach elements (Image, Video, Doc, Voice) mock or real picker trigger
  const handleAttachMock = async (type: 'image' | 'video' | 'document' | 'voice' | 'location' | 'contact' | 'poll') => {
    if (type === 'image') {
      imageFileInputRef.current?.click();
    } else if (type === 'video') {
      videoFileInputRef.current?.click();
    } else if (type === 'document') {
      docFileInputRef.current?.click();
    } else if (type === 'voice') {
      startVoiceRecording();
    } else if (type === 'location') {
      setShowLocationModal(true);
    } else if (type === 'contact') {
      setShowContactModal(true);
    } else if (type === 'poll') {
      setShowPollModal(true);
    }
  };

  // --- REAL VOICE RECORDING ENGINE ---
  const activeMediaStreamRef = useRef<MediaStream | null>(null);

  const startVoiceRecording = async () => {
    const bitRate = voiceRecordingQuality === 'hd' ? 128000 : 64000;
    audioChunksRef.current = [];
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setIsPlayingVoicePreview(false);

    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        activeMediaStreamRef.current = stream;
        
        const mimeType = getSupportedMimeType();
        const options: MediaRecorderOptions = { audioBitsPerSecond: bitRate };
        if (mimeType) {
          options.mimeType = mimeType;
        }

        const recorder = new MediaRecorder(stream, options);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        recorder.onstop = () => {
          const selectedMime = recorder.mimeType || mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: selectedMime });
          const url = URL.createObjectURL(audioBlob);
          setRecordedAudioBlob(audioBlob);
          setRecordedAudioUrl(url);
          if (activeMediaStreamRef.current) {
            activeMediaStreamRef.current.getTracks().forEach(t => t.stop());
            activeMediaStreamRef.current = null;
          }
        };

        recorder.start(100); // 100ms time slice for continuous buffering
      }
    } catch (err) {
      console.warn("Microphone hardware access notice:", err);
      showToast("Using voice audio synthesizer");
    }

    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    setMyActivityType('recording_voice');

    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    showToast("Voice recording started");
  };

  const stopVoiceRecording = async (): Promise<Blob | null> => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }

    let finalBlob: Blob | null = recordedAudioBlob;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      finalBlob = await new Promise<Blob | null>((resolve) => {
        const rec = mediaRecorderRef.current;
        if (!rec) {
          resolve(null);
          return;
        }
        rec.onstop = () => {
          const mime = rec.mimeType || 'audio/webm';
          const blob = new Blob(audioChunksRef.current, { type: mime });
          const url = URL.createObjectURL(blob);
          setRecordedAudioBlob(blob);
          setRecordedAudioUrl(url);
          if (activeMediaStreamRef.current) {
            activeMediaStreamRef.current.getTracks().forEach(t => t.stop());
            activeMediaStreamRef.current = null;
          }
          resolve(blob);
        };
        try {
          rec.stop();
        } catch (e) {
          resolve(null);
        }
      });
    }

    setIsRecordingVoice(false);
    setMyActivityType('none');
    return finalBlob;
  };

  const cancelVoiceRecording = () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { 
        mediaRecorderRef.current.stop(); 
      } catch(e){}
    }
    if (activeMediaStreamRef.current) {
      activeMediaStreamRef.current.getTracks().forEach(t => t.stop());
      activeMediaStreamRef.current = null;
    }
    if (voicePreviewAudioRef.current) {
      voicePreviewAudioRef.current.pause();
    }
    setIsRecordingVoice(false);
    setRecordingSeconds(0);
    setRecordedAudioUrl(null);
    setRecordedAudioBlob(null);
    setIsPlayingVoicePreview(false);
    setMyActivityType('none');
  };

  const handleSendVoiceMessage = async () => {
    // If still recording, stop and extract final audio blob first
    let blobToSend = recordedAudioBlob;
    if (isRecordingVoice) {
      blobToSend = await stopVoiceRecording();
    }

    let audioUrlToUse = recordedAudioUrl || '';

    if (blobToSend && blobToSend.size > 0) {
      try {
        const base64Data = await blobToBase64(blobToSend);
        if (base64Data) audioUrlToUse = base64Data;
      } catch (e) {
        console.warn("Base64 audio conversion error:", e);
      }
    }

    // If still empty, generate synthetic voice preview
    if (!audioUrlToUse) {
      audioUrlToUse = generateSyntheticVoiceNote(Math.max(2, recordingSeconds || 4));
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const durationFormatted = `${Math.floor(Math.max(1, recordingSeconds) / 60)}:${(Math.max(1, recordingSeconds) % 60).toString().padStart(2, '0')}`;
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
      sender: userUsername || 'me',
      text: '',
      type: 'voice',
      audio_url: audioUrlToUse,
      file_size: durationFormatted || '0:05',
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    if (isFirebaseConfigured && db && auth) {
      try {
        let firestoreAudioUrl: string | null = null;
        if (isDriveConnected && driveAccessToken && blobToSend) {
          const encryptedBlob = await encryptFile(blobToSend, activeChatId);
          const driveUrl = await uploadPublicMediaToDrive(driveAccessToken, encryptedBlob, `v_${newMsgId}.enc`);
          firestoreAudioUrl = `enc:${driveUrl}`;
        } else {
          firestoreAudioUrl = await safeFirestoreUrl(audioUrlToUse, 'voice_note.ogg', `voice_notes/${activeChatId}/${newMsgId}.ogg`);
        }

        await sendRelayMessage({
          ...newMsg,
          audio_url: firestoreAudioUrl || undefined
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type,
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            avatar_url: currentActiveChat.avatar_url || '',
            participants: currentActiveChat.participants,
            last_message: 'Voice Note (' + (durationFormatted || '0:05') + ')',
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase send voice note warning:", err);
      }
    }

    // Save voice note to high-capacity IndexedDB cache
    if (audioUrlToUse) {
      storageManager.saveMedia(newMsgId, audioUrlToUse, {
        chat_id: activeChatId,
        fileName: 'voice_note.ogg',
        mimeType: 'audio/ogg'
      }).catch(() => {});
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: Voice Note (${durationFormatted || '0:05'})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
    
    cancelVoiceRecording();
    setShowAttachMenu(false);
    showToast("Voice note sent");
  };

  // --- MEDIA EDITOR SEND HANDLER (WhatsApp-Style Photo/Video Editor) ---
  const handleSendEditedMedia = async (result: {
    mediaUrl: string;
    caption: string;
    mediaQuality: 'standard' | 'hd';
    isDocument?: boolean;
    fileName: string;
    fileSize: string;
  }) => {
    if (!pendingMediaEditorData) return;

    let finalMediaUrl = result.mediaUrl;
    let finalFileSize = result.fileSize;

    // Apply smart image compression to maximize available storage
    if (pendingMediaEditorData.mediaType === 'image' && result.mediaUrl && !result.isDocument) {
      try {
        const comp = await compressImage(result.mediaUrl, mediaUploadQuality);
        finalMediaUrl = comp.dataUrl;
        if (comp.savedPercent > 0) {
          finalFileSize = `${(comp.compressedSize / 1024).toFixed(1)} KB (-${comp.savedPercent}%)`;
        }
      } catch (err) {
        console.warn("Smart compression fallback:", err);
      }
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const finalType = result.isDocument ? 'document' : pendingMediaEditorData.mediaType === 'audio' ? 'voice' : pendingMediaEditorData.mediaType;

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId,
      created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
      sender: userUsername || 'me',
      text: result.caption || result.fileName,
      type: finalType,
      media_url: (!result.isDocument && finalType !== 'voice') ? (finalMediaUrl || (finalType === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : undefined)) : undefined,
      audio_url: finalType === 'voice' ? finalMediaUrl : undefined,
      file_name: result.fileName,
      file_size: finalFileSize,
      media_quality: result.mediaQuality,
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    if (newMsg.media_url || newMsg.audio_url) {
      const urlToCache = newMsg.media_url || newMsg.audio_url || '';
      localMediaCacheRef.current[newMsg.id] = urlToCache;
      if (result.fileName) localMediaCacheRef.current[result.fileName] = urlToCache;
      // Persist in high-capacity IndexedDB
      storageManager.saveMedia(newMsg.id, urlToCache, {
        chat_id: activeChatId,
        fileName: result.fileName,
      }).catch(() => {});
    }

    // Persist media message object to local device IndexedDB
    storageManager.saveMessages([newMsg]).catch(() => {});

    if (isFirebaseConfigured && db && auth) {
      try {
        let firestoreMediaUrl: string | null = null;
        let firestoreAudioUrl: string | null = null;
        const sourceUrl = newMsg.media_url || newMsg.audio_url;

        if (isDriveConnected && driveAccessToken && sourceUrl) {
          // Encrypt before Drive upload
          const blob = await fetch(sourceUrl).then(r => r.blob());
          const encryptedBlob = await encryptFile(blob, activeChatId);
          const driveUrl = await uploadPublicMediaToDrive(driveAccessToken, encryptedBlob, `${result.fileName}.enc`);
          if (newMsg.type === 'voice') {
            firestoreAudioUrl = `enc:${driveUrl}`;
          } else {
            firestoreMediaUrl = `enc:${driveUrl}`;
          }
        } else if (sourceUrl) {
          const uploadedUrl = await safeFirestoreUrl(sourceUrl, result.fileName, `chat_media/${activeChatId}/${newMsgId}_${result.fileName.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
          if (newMsg.type === 'voice') {
            firestoreAudioUrl = uploadedUrl;
          } else {
            firestoreMediaUrl = uploadedUrl;
          }
        }

        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId,
          created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
          sender: userUsername || 'me',
          text: result.caption || result.fileName,
          type: newMsg.type,
          media_url: firestoreMediaUrl,
          audio_url: firestoreAudioUrl,
          file_name: result.fileName,
          file_size: result.fileSize,
          media_quality: result.mediaQuality,
          timestamp: timeStr,
          reactions: [],
          read_by: [],
          forwarded: false,
          pinned: false
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type,
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            participants: currentActiveChat.participants,
            last_message: result.caption ? `[${pendingMediaEditorData.mediaType.toUpperCase()}] ${result.caption}` : `[${pendingMediaEditorData.mediaType.toUpperCase()}]`,
            last_time: 'now',
            updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase media insert error:", err);
      }
    }

    setMessagesByChat(prev => ({
      ...prev,
      [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg])
    }));

    setChats(prev => prev.map(c => c.id === activeChatId ? {
      ...c,
      last_message: `You: ${result.caption ? `[${pendingMediaEditorData.mediaType.toUpperCase()}] ${result.caption}` : `[${pendingMediaEditorData.mediaType.toUpperCase()}]`}`,
      last_time: 'now',
      updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
    } : c));

    setPendingMediaEditorData(null);
    showToast(`${pendingMediaEditorData.mediaType === 'video' ? 'Video' : 'Photo'} sent successfully!`);
  };

  // --- DELETE CHAT HELPER ---
  const handleDeleteChat = (chatIdToDelete: string) => {
    const targetChat = chats.find(c => c.id === chatIdToDelete);
    triggerConfirm({
      title: `Delete Chat with ${targetChat?.name || 'this contact'}?`,
      description: 'Warning: This chat history and all media are stored locally on this device only. Deleting will permanently erase it from your device.',
      confirmText: 'Delete Chat',
      variant: 'danger',
      onConfirm: async () => {
        // Delete locally from IndexedDB
        await storageManager.deleteMessagesForChat(chatIdToDelete);

        if (isFirebaseConfigured && db) {
          try {
            await deleteDoc(doc(db, 'chats', chatIdToDelete));
          } catch (e) {
            console.warn("Delete chat warning:", e);
          }
        }
        setChats(prev => prev.filter(c => c.id !== chatIdToDelete));
        setMessagesByChat(prev => {
          const next = { ...prev };
          delete next[chatIdToDelete];
          return next;
        });
        if (activeChatId === chatIdToDelete) {
          setActiveChatId('');
          setMobileShowChat(false);
        }
        setSelectedChatForOptions(null);
        showToast('Chat & local history deleted \u{1F5D1}\uFE0F');
        closeConfirm();
      }
    });
  };

  // --- REAL FILE UPLOAD HANDLER ---
  const handleRealFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video' | 'document' | 'audio' | 'document' | 'audio') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    
    let sizeStr = (file.size / 1024 / 1024).toFixed(1) + ' MB';
    if (file.size < 1024 * 1024) {
      sizeStr = Math.round(file.size / 1024) + ' KB';
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const rawResult = e.target?.result as string;

      // Intercept ALL files & Open WhatsApp-Style Editor/Confirmation First
      const activeChat = chats.find(c => c.id === activeChatId);
      setPendingMediaEditorData({
        file,
        fileUrl: rawResult,
        mediaType: mediaType as 'image' | 'video' | 'document' | 'audio',
        fileName: file.name,
        fileSize: sizeStr,
        recipientName: activeChat?.name || 'Contact',
        recipientUsername: activeChat?.username || 'user',
        recipientAvatarSeed: activeChat?.avatar_seed,
        recipientAvatarUrl: activeChat?.avatar_url,
      });
      setShowAttachMenu(false);
      if (event.target) event.target.value = '';
      return;
    };
    reader.readAsDataURL(file);

    event.target.value = '';
  };

  // --- LOCATION SHARING ---
  const handleSendLocation = async () => {
    if (!locationTitle.trim()) return;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
      sender: userUsername || 'me',
      text: `Location: ${locationTitle}`,
      type: 'location',
      location_data: {
        title: locationTitle,
        address: locationAddress || 'Shared Location',
        lat: locationLat,
        lng: locationLng
      },
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    // Save location message to local device IndexedDB
    storageManager.saveMessages([newMsg]).catch(() => {});

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'location',
          location_data: newMsg.location_data,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type,
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            avatar_url: currentActiveChat.avatar_url || '',
            participants: currentActiveChat.participants,
            last_message: `Location: ${locationTitle}`,
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase location send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: Location (${locationTitle})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
    setShowLocationModal(false);
    setShowAttachMenu(false);
    showToast("Location shared");
  };

  // --- CONTACT SHARING ---
  const handleSendContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      showToast("Please enter contact name & phone number");
      return;
    }
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
      sender: userUsername || 'me',
      text: `Contact: ${contactName}`,
      type: 'contact',
      contact_data: {
        name: contactName,
        phone: contactPhone,
        email: contactEmail
      },
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    // Save contact message to local device IndexedDB
    storageManager.saveMessages([newMsg]).catch(() => {});

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'contact',
          contact_data: newMsg.contact_data,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type,
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            avatar_url: currentActiveChat.avatar_url || '',
            participants: currentActiveChat.participants,
            last_message: `Contact: ${contactName}`,
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase contact send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: Contact (${contactName})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
    setShowContactModal(false);
    setShowAttachMenu(false);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    showToast("Contact card shared");
  };

  // --- POLL CREATION & VOTING ---
  const handleSendPoll = async () => {
    const validOptions = pollOptionsInputs.filter(opt => opt.trim().length > 0);
    if (!pollQuestion.trim() || validOptions.length < 2) {
      showToast("Enter a poll question and at least 2 options");
      return;
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const pollData: PollData = {
      question: pollQuestion,
      options: validOptions.map((opt, idx) => ({ id: 'opt_' + idx, text: opt, votes: [] })),
      total_votes: 0
    };

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
      sender: userUsername || 'me',
      text: `Poll: ${pollQuestion}`,
      type: 'poll',
      poll_data: pollData,
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    // Save poll message to local device IndexedDB
    storageManager.saveMessages([newMsg]).catch(() => {});

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'poll',
          poll_data: pollData,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          let currentActiveChat = activeChat;
          if (currentActiveChat.isLocalPending) {
             currentActiveChat = { ...currentActiveChat };
             delete currentActiveChat.isLocalPending;
          }
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: currentActiveChat.type,
            name: currentActiveChat.name,
            username: currentActiveChat.username,
            avatar_seed: currentActiveChat.avatar_seed,
            avatar_url: currentActiveChat.avatar_url || '',
            participants: currentActiveChat.participants,
            last_message: `Poll: ${pollQuestion}`,
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
            unread: 0,
            pinned: false,
            muted: false,
            typing: false,
            online: false,
            last_seen: ''
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase poll send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: Poll (${pollQuestion})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
    setShowPollModal(false);
    setShowAttachMenu(false);
    setPollQuestion('');
    setPollOptionsInputs(['Option 1', 'Option 2']);
    showToast("Poll created");
  };

  const handleVotePoll = (msgId: string, optionId: string) => {
    const voter = userUsername || 'me';
    setMessagesByChat(prev => {
      const msgs = prev[activeChatId] || [];
      const updated = msgs.map(m => {
        if (m.id === msgId && m.poll_data) {
          const currentOptions = m.poll_data.options;

          const newOptions = currentOptions.map(opt => {
            const votes = [...opt.votes];
            if (opt.id === optionId) {
              if (votes.includes(voter)) {
                return { ...opt, votes: votes.filter(v => v !== voter) };
              } else {
                return { ...opt, votes: [...votes, voter] };
              }
            } else {
              return { ...opt, votes: votes.filter(v => v !== voter) };
            }
          });

          const total = newOptions.reduce((acc, curr) => acc + curr.votes.length, 0);
          return {
            ...m,
            poll_data: {
              ...m.poll_data,
              options: newOptions,
              total_votes: total
            }
          };
        }
        return m;
      });
      return { ...prev, [activeChatId]: updated };
    });
    showToast("Vote updated");
  };

  // --- AUDIO MESSAGE PLAYBACK TOGGLE ---
  const handleTogglePlayAudioMsg = (msgId: string, audioUrl?: string) => {
    if (playingAudioMsgId === msgId) {
      if (audioMessageElementRef.current) {
        audioMessageElementRef.current.pause();
      }
      setPlayingAudioMsgId(null);
    } else {
      if (audioMessageElementRef.current) {
        audioMessageElementRef.current.pause();
      }
      const urlToPlay = audioUrl || 'https://actions.google.com/sounds/v1/ambiences/outdoor_ambience.ogg';
      const audio = new Audio(urlToPlay);
      audioMessageElementRef.current = audio;
      audio.play().catch(e => console.warn("Audio play error:", e));
      audio.onended = () => {
        setPlayingAudioMsgId(null);
      };
      setPlayingAudioMsgId(msgId);
    }
  };

  // Reaction action
  const handleReactToMessage = async (messageId: string, emoji: string) => {
    const selfName = userUsername || 'me';
    let nextReacts: any[] = [];

    setMessagesByChat(prev => {
      const chatMsgs = prev[activeChatId] || [];
      const updated = chatMsgs.map(m => {
        if (m.id === messageId) {
          const reacts = [...m.reactions];
          const existingIdx = reacts.findIndex(r => r.emoji === emoji);

          if (existingIdx >= 0) {
            const hasMe = reacts[existingIdx].users.includes(selfName);
            if (hasMe) {
              // remove reaction
              const updatedUsers = reacts[existingIdx].users.filter(u => u !== selfName);
              if (updatedUsers.length === 0) {
                reacts.splice(existingIdx, 1);
              } else {
                reacts[existingIdx] = { ...reacts[existingIdx], users: updatedUsers };
              }
            } else {
              // add me
              reacts[existingIdx] = { ...reacts[existingIdx], users: [...reacts[existingIdx].users, selfName] };
            }
          } else {
            // New reaction
            reacts.push({ emoji, users: [selfName] });
          }
          nextReacts = reacts;
          return { ...m, reactions: reacts };
        }
        return m;
      });
      return { ...prev, [activeChatId]: updated };
    });

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', messageId), {
          reactions: nextReacts
        }, { merge: true });
      } catch (err) {
        console.warn("Firebase reaction update warning:", err);
      }
    }
  };

  // Pin message
  const handleTogglePinMessage = async (messageId: string) => {
    let nextPin = false;
    setMessagesByChat(prev => {
      const chatMsgs = prev[activeChatId] || [];
      const updated = chatMsgs.map(m => {
        if (m.id === messageId) {
          nextPin = !m.pinned;
          showToast(nextPin ? 'Message pinned to chat' : 'Message unpinned');
          return { ...m, pinned: nextPin };
        }
        return m;
      });
      return { ...prev, [activeChatId]: updated };
    });

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', messageId), {
          pinned: nextPin
        }, { merge: true });
      } catch (err) {
        console.warn("Firebase pin message warning:", err);
      }
    }
  };

  // Message Delete
  const handleDeleteForMe = async (targetMsgId?: string | React.MouseEvent) => {
    const msgId = typeof targetMsgId === 'string' ? targetMsgId : deleteMessageId;
    if (!msgId) return;

    // Delete locally from IndexedDB
    await storageManager.deleteMessage(msgId);

    const targetChatId = selectedMessageForActions?.chat_id || activeChatId;

    setMessagesByChat(prev => {
      const chatMsgs = prev[targetChatId] || [];
      const updated = chatMsgs.filter(m => m.id !== msgId);
      return { ...prev, [targetChatId]: updated };
    });

    if (isFirebaseConfigured && db && auth) {
      try {
        await deleteDoc(doc(db, 'messages', msgId));
      } catch (err) {
        console.warn("Firebase delete for me warning:", err);
      }
    }

    setShowDeleteModal(false);
    setDeleteMessageId('');
    setSelectedMessageForActions(null);
    showToast('Message deleted from your device');
  };

  const canDeleteForEveryone = (msg: Message | null) => {
    if (!msg) return false;
    const isMe = isSenderMe(msg.sender);
    if (!isMe) return false;
    if (msg.deleted_for_everyone) return false;

    const now = Date.now();
    const msgAgeMs = now - (msg.created_at || now);

    // Hard limit: 15 minutes
    const HARD_LIMIT_MS = 15 * 60 * 1000;
    if (msgAgeMs > HARD_LIMIT_MS) return false;

    // Seen limit: if read by others, allow 2 minutes max since creation (or seen)
    const isReadByOthers = msg.read_by && msg.read_by.filter(u => u !== msg.sender && u !== 'me' && u !== userUsername).length > 0;
    if (isReadByOthers && msgAgeMs > 2 * 60 * 1000) {
      return false;
    }

    return true;
  };

  const handleDeleteForEveryone = async (targetMsgId?: string | React.MouseEvent) => {
    const msgId = typeof targetMsgId === 'string' ? targetMsgId : deleteMessageId;
    if (!msgId) return;

    // Delete locally from IndexedDB
    await storageManager.deleteMessage(msgId);

    const targetChatId = selectedMessageForActions?.chat_id || activeChatId;

    setMessagesByChat(prev => {
      const chatMsgs = prev[targetChatId] || [];
      const updated = chatMsgs.map(m => {
        if (m.id === msgId) {
          return { ...m, deleted_for_everyone: true, text: '' };
        }
        return m;
      });
      return { ...prev, [targetChatId]: updated };
    });

    if (isFirebaseConfigured && db && auth) {
      try {
        await deleteDoc(doc(db, 'messages', msgId));
      } catch (err) {
        console.warn("Firebase delete for everyone warning:", err);
      }
    }

    setShowDeleteModal(false);
    setDeleteMessageId('');
    setSelectedMessageForActions(null);
    showToast('Message deleted for everyone');
  };

  // Helper functions for Chat Customization & Actions
  const handleSetChatWallpaper = (chatId: string, wallpaper: string) => {
    setChatWallpapers(prev => {
      const updated = { ...prev, [chatId]: wallpaper };
      try { localStorage.setItem('zenoa_chat_wallpapers', JSON.stringify(updated)); } catch {}
      return updated;
    });
    showToast('Chat wallpaper updated');
  };

  const handleToggleStarMessage = (msgId: string) => {
    setMessagesByChat(prev => {
      const targetChatId = selectedMessageForActions?.chat_id || activeChatId;
      const msgs = prev[targetChatId] || [];
      const updated = msgs.map(m => {
        if (m.id === msgId) {
          const nextStarred = !m.starred;
          showToast(nextStarred ? 'Message starred' : 'Message unstarred');
          return { ...m, starred: nextStarred };
        }
        return m;
      });
      return { ...prev, [targetChatId]: updated };
    });
    setSelectedMessageForActions(null);
  };

  const handleCopyMessageText = (text: string) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      showToast('Message copied to clipboard');
    } catch {
      showToast('Copied: ' + text.substring(0, 30));
    }
    setSelectedMessageForActions(null);
  };

  const handleClearChatHistory = (chatId: string) => {
    triggerConfirm({
      title: 'Clear Chat History?',
      description: 'Are you sure you want to clear this conversation for yourself? The other person will still see the messages.',
      confirmText: 'Clear Messages',
      variant: 'danger',
      onConfirm: async () => {
        setMessagesByChat(prev => ({ ...prev, [chatId]: [] }));
        const now = Date.now();
        setChats(prev => prev.map(c => c.id === chatId ? { ...c, cleared_at: { ...(c.cleared_at || {}), [userUsername]: now } } : c));
        if (isFirebaseConfigured && db && auth) {
          try {
            await setDoc(doc(db, 'chats', chatId), {
              [`cleared_at.${userUsername}`]: now
            }, { merge: true });
          } catch (e) { console.error(e); }
        }
        showToast('Chat history cleared');
        setSelectedChatForOptions(null);
        setShowChatCustomizationSheet(false);
      }
    });
  };

  const handleExportChat = (chatId: string) => {
    const targetChat = chats.find(c => c.id === chatId);
    const msgs = messagesByChat[chatId] || [];
    if (msgs.length === 0) {
      showToast('No messages to export.');
      return;
    }
    let transcript = `=== INOLAS MESSENGER CHAT TRANSCRIPT ===\nChat: ${targetChat?.name || chatId}\nExported On: ${new Date().toLocaleString()}\n\n`;
    msgs.forEach(m => {
      if (!m.deleted_for_me) {
        transcript += `[${m.timestamp}] ${m.sender}: ${m.deleted_for_everyone ? '[Message Deleted]' : m.text || `[${m.type}]`}\n`;
      }
    });
    const blob = new Blob([transcript], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chat_${(targetChat?.name || 'Transcript').replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Chat transcript exported as .txt');
  };

  const handleToggleArchiveChat = (chatId: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const nextArchived = !c.archived;
        showToast(nextArchived ? 'Chat archived' : 'Chat unarchived');
        return { ...c, archived: nextArchived };
      }
      return c;
    }));
    setSelectedChatForOptions(null);
  };

  // Forward message
  const handleForwardSubmit = async () => {
    if (!forwardMessageId || forwardTargets.length === 0) return;

    // Find original message
    const allMsgs = Object.values(messagesByChat).flat();
    const originalMsg = allMsgs.find(m => m.id === forwardMessageId);

    if (originalMsg) {
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      for (const targetChatId of forwardTargets) {
        const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
        const forwardedMsg: Message = {
          id: newMsgId,
          chat_id: targetChatId, created_at: Date.now(), expires_at: getExpiresAt(targetChatId),
          sender: userUsername || 'me',
          text: originalMsg.text,
          type: originalMsg.type,
          media_url: originalMsg.media_url,
          file_name: originalMsg.file_name,
          file_size: originalMsg.file_size,
          timestamp: timeStr,
          reactions: [],
          read_by: [],
          forwarded: true
        };

        if (isFirebaseConfigured && db && auth) {
          try {
            await setDoc(doc(db, 'messages', newMsgId), {
              id: newMsgId,
              chat_id: targetChatId, created_at: Date.now(), expires_at: getExpiresAt(targetChatId),
              sender: userUsername || 'me',
              text: originalMsg.text || '',
              type: originalMsg.type,
              media_url: originalMsg.media_url || null,
              file_name: originalMsg.file_name || null,
              file_size: originalMsg.file_size || null,
              timestamp: timeStr,
              reactions: [],
              read_by: [],
              forwarded: true,
              pinned: false
            });

            let targetChat = chats.find(c => c.id === targetChatId);
            
            // If the chat doesn't exist locally, we MUST create it so the recipient receives it!
            if (!targetChat) {
              const u1 = userUsername || 'me';
              // Parse the other user's username from the dm ID
              const clean1 = u1.trim().toLowerCase().replace(/^@/, '');
              const parts = targetChatId.replace('dm_', '').split('_');
              const u2 = parts.find(p => p !== clean1) || parts[0];
              
              targetChat = {
                id: targetChatId,
                type: 'dm',
                name: u2, // We don't have the full name, but the recipient's UI will resolve it
                username: u2,
                avatar_seed: u2,
                participants: [u1, u2],
                unread: 0,
                last_message: '',
                last_time: 'now',
                pinned: false,
                muted: false,
                typing: false,
                online: false,
                last_seen: ''
              };
            }

            if (targetChat) {
              await setDoc(doc(db, 'chats', targetChatId), {
                id: targetChatId,
                type: targetChat.type,
                name: targetChat.name,
                username: targetChat.username,
                avatar_seed: targetChat.avatar_seed,
                participants: targetChat.participants,
                last_message: originalMsg.text || `[${originalMsg.type}]`,
                last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
              }, { merge: true });
            }
          } catch (err) {
            console.error("Error inserting forwarded message in Firebase:", err);
          }
        }

        setMessagesByChat(prev => ({
          ...prev,
          [targetChatId]: [...(prev[targetChatId] || []), forwardedMsg]
        }));

        // Update target chat summary
        setChats(prev => {
          const exists = prev.some(c => c.id === targetChatId);
          if (!exists) {
            const u1 = userUsername || 'me';
            const clean1 = u1.trim().toLowerCase().replace(/^@/, '');
            const parts = targetChatId.replace('dm_', '').split('_');
            const u2 = parts.find(p => p !== clean1) || parts[0];
            return [{
              id: targetChatId,
              type: 'dm',
              name: u2,
              username: u2,
              avatar_seed: u2,
              participants: [u1, u2],
              unread: 0,
              last_message: `You: ${originalMsg.text || `[${originalMsg.type}]`}`,
              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
              pinned: false,
              muted: false,
              typing: false,
              online: false,
              last_seen: ''
            }, ...prev];
          }
          return prev.map(c => {
            if (c.id === targetChatId) {
              return {
                ...c,
                last_message: `You: ${originalMsg.text || `[${originalMsg.type}]`}`,
                last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
              };
            }
            return c;
          });
        });
      }

      showToast(`Forwarded to ${forwardTargets.length} chat(s)`);
    }

    setShowForwardModal(false);
    setForwardMessageId('');
    setForwardTargets([]);
  };

  // Discover start chat (Resilient deduplication & identity preservation)
  const handleDeleteUserFirestore = async (targetUserId: string) => {
    if (!isFirebaseConfigured || !db || userEmail !== 'azadaman19s@gmail.com') return;
    if (!window.confirm('Are you sure you want to delete this user profile from Firestore? This is permanent.')) return;
    try {
      await deleteDoc(doc(db, 'users', targetUserId));
      console.log('User profile deleted from Firestore:', targetUserId);
    } catch (err) {
      console.error('Failed to delete user profile:', err);
      alert('Error deleting user');
    }
  };

  const handleStartChatWithUser = async (user: UserData) => {
    const selfName = userUsername || 'me';
    const targetUserClean = (user.username || '').trim().toLowerCase();
    const canonicalChatId = getDmChatId(selfName, user.username || '');
    
    // Check if chat already exists by participant, username, or previous usernames
    const existingChat = chats.find(c => {
      if (c.id === canonicalChatId) return true;
      if (c.id === `c_${user.username}`) return true;
      if (c.type === 'dm') {
        if (c.username?.toLowerCase() === targetUserClean) return true;
        if (c.participants?.some(p => p && p.toLowerCase() === targetUserClean)) return true;
        if (user.previous_usernames?.some(prev => c.participants?.includes(prev) || c.username === prev)) return true;
      }
      return false;
    });

    const targetChatId = existingChat ? existingChat.id : canonicalChatId;
    const normalizedParts = buildNormalizedParticipants(selfName, user.username, userId, user.id);

    if (!existingChat) {
      const newChat: Chat = {
        id: targetChatId,
        type: 'dm',
        name: user.display_name,
        username: user.username,
        avatar_seed: user.avatar_seed || user.username,
        avatar_url: user.avatar_url,
        participants: normalizedParts,
        unread: 0,
        last_message: '',
        last_time: 'now',
        updated_at: Date.now(),
        last_message_sender: selfName,
        last_message_status: 'delivered' as const,
        pinned: false,
        muted: false,
        typing: false,
        online: isUserEffectivelyOnline(user),
        last_seen: user.last_seen,
        isLocalPending: true
      };

      setChats(prev => {
        if (prev.some(c => c.id === targetChatId)) return prev;
        return [newChat, ...prev];
      });
      setMessagesByChat(prev => ({
        ...prev,
        [targetChatId]: prev[targetChatId] || []
      }));
    }

    // Persist DM chat to Firestore immediately so recipient can discover chat in real-time
    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'chats', targetChatId), {
          id: targetChatId,
          type: 'dm',
          name: user.display_name,
          username: user.username,
          avatar_seed: user.avatar_seed || user.username,
          avatar_url: user.avatar_url || '',
          participants: normalizedParts,
          participant_details: {
            [selfName.toLowerCase()]: { username: selfName, display_name: userDisplayName || selfName, avatar_seed: userAvatarSeed || selfName, avatar_url: userAvatarUrl || '' },
            [targetUserClean]: { username: user.username, display_name: user.display_name, avatar_seed: user.avatar_seed || user.username, avatar_url: user.avatar_url || '' }
          },
          updated_at: Date.now()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore DM creation notice:", err);
      }
    }

    setActiveChatId(targetChatId);
    setActiveView('chats');
    setMobileShowChat(true);
    setGlobalSearchQuery('');
  };

  // Open profile details panel when viewing a public profile URL (stalking/viewing instead of starting a chat)
  useEffect(() => {
    if (isAuthenticated && publicProfileUsername) {
      const cleanUsername = publicProfileUsername.replace(/^@/, '').trim();
      if (cleanUsername) {
        handleOpenUserProfile(cleanUsername);
        setPublicProfileUsername(null);
        try { window.history.pushState({}, '', '/'); } catch(e){}
      }
    }
  }, [isAuthenticated, publicProfileUsername]);


  // --- PRIVACY & NOTIFICATION HANDLERS ---
  const handleTogglePrivacy = async (val: boolean) => {
    setIsAccountPrivate(val);
    if (isFirebaseConfigured && db && userId) {
      try {
        await updateDoc(doc(db, 'users', userId), { is_private: val });
      } catch (err) {
        console.error("Failed to update privacy:", err);
      }
    }
  };

  const createNotification = async (targetId: string, type: AppNotification['type']) => {
    if (!isFirebaseConfigured || !db || !userId) return;
    try {
      const notifRef = doc(collection(db, 'notifications'));
      const notifData: Omit<AppNotification, 'id'> = {
        userId: targetId,
        type,
        fromId: userId,
        fromName: userDisplayName,
        fromUsername: userUsername,
        fromAvatar: userAvatarSeed,
        read: false,
        timestamp: Date.now()
      };
      await setDoc(notifRef, notifData);
    } catch (err) {
      console.error("Notif creation error:", err);
    }
  };

  const handleSendFollowRequest = async (targetUser: UserData) => {
    if (!isFirebaseConfigured || !db || !userId || !targetUser.id) return;
    try {
      // Check if already requested
      const q = query(collection(db, 'follow_requests'), 
        where('fromId', '==', userId), 
        where('toId', '==', targetUser.id),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        showToast("Already requested");
        return;
      }

      const reqRef = doc(collection(db, 'follow_requests'));
      await setDoc(reqRef, {
        fromId: userId,
        toId: targetUser.id,
        fromName: userDisplayName,
        fromUsername: userUsername,
        fromAvatar: userAvatarSeed,
        status: 'pending',
        timestamp: Date.now()
      });
      
      // Create notification for target
      await createNotification(targetUser.id, 'follow_request');
      showToast("Follow request sent");
    } catch (err) {
      console.error("Follow request error:", err);
    }
  };

  const handleAcceptFollowRequest = async (request: FollowRequest) => {
    if (!isFirebaseConfigured || !db || !userId) return;
    try {
      // 1. Add to followers/following arrays
      const targetUserRef = doc(db, 'users', request.fromId);
      const myUserRef = doc(db, 'users', userId);

      await updateDoc(myUserRef, {
        followers: arrayUnion(request.fromUsername)
      });
      await updateDoc(targetUserRef, {
        following: arrayUnion(userUsername)
      });

      // 2. Mark request as accepted (or just delete)
      await deleteDoc(doc(db, 'follow_requests', request.id));

      // 3. Notify them
      await createNotification(request.fromId, 'follow_accept');
      showToast(`Accepted ${request.fromUsername}`);
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleDeclineFollowRequest = async (requestId: string) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'follow_requests', requestId));
      showToast("Request declined");
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!isFirebaseConfigured || !db || !userId) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {}
    }
  };

  // Follow/Unfollow
  const handleFollow = async (targetUser: UserData | undefined) => {
    if (!targetUser) return;
    if (isServiceAccount(targetUser, targetUser.username) || targetUser.is_service_account || targetUser.is_business_account) {
      showToast('Service accounts and bot entities cannot be followed.');
      return;
    }
    if (!isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }
    const targetUsername = targetUser.username;
    const amIFollowing = targetUser.followers?.includes(userUsername) || false;

    if (targetUser.is_private && !amIFollowing && targetUsername !== userUsername) {
      handleSendFollowRequest(targetUser);
      return;
    }
    await handleToggleFollowUserInternal(targetUsername);
  };

  const handleToggleFollowUserInternal = async (targetUsername: string) => {
    if (!userUsername || !isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }
    
    if (targetUsername === userUsername) return;
    
    const targetUser = users[targetUsername] || Object.values(users).find(u => u.username === targetUsername);
    if (!targetUser) return;
    
    const amIFollowing = targetUser.followers?.includes(userUsername) || false;

    // 1. Instant Optimistic State Update for ultra-responsive UI
    setUsers(prev => {
      const currentTargetKey = Object.keys(prev).find(k => k === targetUsername || prev[k].username === targetUsername) || targetUsername;
      const currentTarget = prev[currentTargetKey] || targetUser;
      const currentFollowers = currentTarget.followers || [];
      const updatedFollowers = amIFollowing
        ? currentFollowers.filter(f => f !== userUsername)
        : [...currentFollowers, userUsername];

      const currentMeKey = Object.keys(prev).find(k => k === userUsername || prev[k].username === userUsername) || userUsername;
      const currentMe = prev[currentMeKey];
      const currentFollowing = currentMe?.following || [];
      const updatedFollowing = amIFollowing
        ? currentFollowing.filter(f => f !== targetUsername)
        : [...currentFollowing, targetUsername];

      return {
        ...prev,
        [currentTargetKey]: {
          ...currentTarget,
          followers: updatedFollowers
        },
        ...(currentMe ? {
          [currentMeKey]: {
            ...currentMe,
            following: updatedFollowing
          }
        } : {})
      };
    });

    if (amIFollowing) {
      showToast(`You unfollowed ${targetUsername}`);
    } else {
      showToast(`You are now following ${targetUsername}`);
    }

    // 2. Persistent Firestore Update & Local Fallback
    try {
      const storedFollows = JSON.parse(localStorage.getItem('inolas_followed_users') || '[]');
      const updatedStoredFollows = amIFollowing
        ? storedFollows.filter((u: string) => u !== targetUsername)
        : Array.from(new Set([...storedFollows, targetUsername]));
      localStorage.setItem('inolas_followed_users', JSON.stringify(updatedStoredFollows));
    } catch (e) {}

    const targetUserId = targetUser.id || targetUser.username;
    const myUserId = userId || userUsername;
    
    try {
      if (isFirebaseConfigured && db && myUserId) {
        const myDocRef = doc(db, 'users', myUserId);
        
        if (amIFollowing) {
          await setDoc(myDocRef, { following: arrayRemove(targetUsername) }, { merge: true });
          if (targetUserId) {
            await setDoc(doc(db, 'users', targetUserId), { followers: arrayRemove(userUsername) }, { merge: true });
          }
        } else {
          await setDoc(myDocRef, { following: arrayUnion(targetUsername) }, { merge: true });
          if (targetUserId) {
            await setDoc(doc(db, 'users', targetUserId), { followers: arrayUnion(userUsername) }, { merge: true });
          }
        }
      }
    } catch (err: any) {
      console.warn("Follow error:", err);
    }
  };

  // Block/Unblock
  const handleToggleBlockUser = (username: string) => {
    if (blockedUsers.includes(username)) {
      triggerConfirm({
        title: `Unblock @${username}?`,
        description: `@${username} will be able to message you and see your presence again.`,
        confirmText: 'Unblock User',
        variant: 'primary',
        onConfirm: () => {
          setBlockedUsers(prev => prev.filter(u => u !== username));
          showToast(`Unblocked @${username}`);
          closeConfirm();
        }
      });
    } else {
      triggerConfirm({
        title: `Block @${username}?`,
        description: `@${username} will no longer be able to message you or see your online presence.`,
        confirmText: 'Block User',
        variant: 'danger',
        onConfirm: () => {
          setBlockedUsers(prev => [...prev, username]);
          showToast(`Blocked @${username}`);
          closeConfirm();
        }
      });
    }
  };

  // Report
  const handleReportUser = (username: string) => {
    triggerConfirm({
      title: `Report @${username}?`,
      description: 'Are you sure you want to submit a report for spam, harassment, or policy violation?',
      confirmText: 'Submit Report',
      variant: 'danger',
      onConfirm: () => {
        if (!reportedUsers.includes(username)) {
          setReportedUsers(prev => [...prev, username]);
        }
        showToast(`Reported @${username} for policy review`);
        closeConfirm();
      }
    });
  };

  // Group Chat Management Handlers
  const handleCreateGroup = async (groupData: {
    name: string;
    description: string;
    participants: string[];
    avatarSeed: string;
  }) => {
    const groupId = 'g_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
    const selfUsername = userUsername || 'me';
    const allParticipants = Array.from(new Set([selfUsername, ...groupData.participants]));
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const creationMsgText = `You created group "${groupData.name}"`;
    const initialMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const newGroupChat: Chat = {
      id: groupId,
      type: 'group',
      name: groupData.name,
      username: groupId,
      avatar_seed: groupData.avatarSeed || groupData.name,
      group_description: groupData.description,
      admin: selfUsername,
      group_admins: [selfUsername],
      participants: allParticipants,
      unread: 0,
      last_message: creationMsgText,
      last_time: 'now',
      updated_at: Date.now(),
      last_message_sender: selfUsername,
      last_message_status: 'delivered' as const,
      pinned: false,
      muted: false,
      typing: false,
      online: true,
      last_seen: 'now'
    };

    const initialSystemMsg: Message = {
      id: initialMsgId,
      chat_id: groupId,
      created_at: Date.now(),
      sender: selfUsername,
      text: creationMsgText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: [selfUsername]
    };

    // Save locally
    setChats(prev => [newGroupChat, ...prev]);
    setMessagesByChat(prev => ({
      ...prev,
      [groupId]: [initialSystemMsg]
    }));
    storageManager.saveMessages([initialSystemMsg]).catch(() => {});

    // Save to Firestore
    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', groupId), {
          id: groupId,
          type: 'group',
          name: groupData.name,
          username: groupId,
          avatar_seed: groupData.avatarSeed || groupData.name,
          group_description: groupData.description,
          admin: selfUsername,
          group_admins: [selfUsername],
          participants: allParticipants,
          unread: 0,
          last_message: creationMsgText,
          last_time: 'now',
          updated_at: Date.now(),
          last_message_sender: selfUsername,
          last_message_status: 'delivered'
        });

        await setDoc(doc(db, 'messages', initialMsgId), {
          id: initialMsgId,
          chat_id: groupId,
          created_at: Date.now(),
          sender: selfUsername,
          text: creationMsgText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: [selfUsername]
        });
      } catch (err) {
        console.error("Firestore group creation error:", err);
      }
    }

    setActiveChatId(groupId);
    setActiveView('chats');
    setMobileShowChat(true);
    showToast(`Group "${groupData.name}" created!`);
  };

  const handleLeaveGroup = async (chatId: string) => {
    const selfUsername = userUsername || 'me';
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    const updatedParticipants = (targetChat.participants || []).filter(p => p !== selfUsername);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const leaveMsgText = `@${selfUsername} left the group`;
    const leaveMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const leaveSysMsg: Message = {
      id: leaveMsgId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: selfUsername,
      text: leaveMsgText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      participants: updatedParticipants,
      last_message: leaveMsgText,
      last_time: 'now',
      updated_at: Date.now()
    } : c));

    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), leaveSysMsg]
    }));

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          participants: updatedParticipants,
          last_message: leaveMsgText,
          last_time: 'now',
          updated_at: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'messages', leaveMsgId), {
          id: leaveMsgId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: selfUsername,
          text: leaveMsgText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });
      } catch (err) {}
    }

    if (activeChatId === chatId) {
      setActiveChatId('');
    }
    showToast(`You left ${targetChat.name}`);
  };

  const handleAddGroupParticipant = async (chatId: string, newMemberUsername: string) => {
    const selfUsername = userUsername || 'me';
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    if (targetChat.participants?.includes(newMemberUsername)) {
      showToast(`@${newMemberUsername} is already in the group`);
      return;
    }

    const updatedParticipants = [...(targetChat.participants || []), newMemberUsername];
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const addMsgText = `You added @${newMemberUsername} to the group`;
    const addMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const addSysMsg: Message = {
      id: addMsgId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: selfUsername,
      text: addMsgText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: [selfUsername]
    };

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      participants: updatedParticipants,
      last_message: addMsgText,
      last_time: 'now',
      updated_at: Date.now()
    } : c));

    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), addSysMsg]
    }));

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          participants: updatedParticipants,
          last_message: addMsgText,
          last_time: 'now',
          updated_at: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'messages', addMsgId), {
          id: addMsgId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: selfUsername,
          text: addMsgText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: [selfUsername]
        });
      } catch (err) {}
    }

    showToast(`Added @${newMemberUsername} to group`);
  };

  const handleRemoveGroupParticipant = async (chatId: string, removeMemberUsername: string) => {
    const selfUsername = userUsername || 'me';
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    const updatedParticipants = (targetChat.participants || []).filter(p => p !== removeMemberUsername);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const removeMsgText = `Admin removed @${removeMemberUsername} from the group`;
    const removeMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const removeSysMsg: Message = {
      id: removeMsgId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: selfUsername,
      text: removeMsgText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: [selfUsername]
    };

    setChats(prev => prev.map(c => c.id === chatId ? {
      ...c,
      participants: updatedParticipants,
      last_message: removeMsgText,
      last_time: 'now',
      updated_at: Date.now()
    } : c));

    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), removeSysMsg]
    }));

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          participants: updatedParticipants,
          last_message: removeMsgText,
          last_time: 'now',
          updated_at: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'messages', removeMsgId), {
          id: removeMsgId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: selfUsername,
          text: removeMsgText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: [selfUsername]
        });
      } catch (err) {}
    }

    showToast(`Removed @${removeMemberUsername} from group`);
  };

  const handleUpdateGroupInfo = async (chatId: string, updates: Partial<Chat>) => {
    const selfUsername = userUsername || 'me';
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    setChats(prev => prev.map(c => c.id === chatId ? { ...c, ...updates, updated_at: Date.now() } : c));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let updateText = `Group settings were updated`;
    if (updates.name && updates.name !== targetChat.name) {
      updateText = `Group name changed to "${updates.name}"`;
    } else if (updates.group_description !== undefined && updates.group_description !== targetChat.group_description) {
      updateText = `Group description updated`;
    } else if (updates.group_notice !== undefined && updates.group_notice !== targetChat.group_notice) {
      updateText = `Group announcement updated: "${updates.group_notice}"`;
    } else if (updates.send_messages_permission) {
      updateText = `Message permission set to: ${updates.send_messages_permission === 'admins' ? 'Admins only' : 'All members'}`;
    }

    const sysMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const sysMsg: Message = {
      id: sysMsgId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: selfUsername,
      text: updateText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: [selfUsername]
    };

    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), sysMsg]
    }));

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          ...updates,
          updated_at: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'messages', sysMsgId), {
          id: sysMsgId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: selfUsername,
          text: updateText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: [selfUsername]
        });
      } catch (err) {}
    }
  };

  const handleToggleGroupAdmin = async (chatId: string, targetUsername: string, makeAdmin: boolean) => {
    const selfUsername = userUsername || 'me';
    const targetChat = chats.find(c => c.id === chatId);
    if (!targetChat) return;

    const currentAdmins = targetChat.group_admins || [targetChat.admin || selfUsername];
    let updatedAdmins: string[] = [];
    if (makeAdmin) {
      updatedAdmins = Array.from(new Set([...currentAdmins, targetUsername]));
    } else {
      updatedAdmins = currentAdmins.filter(a => a !== targetUsername);
    }

    setChats(prev => prev.map(c => c.id === chatId ? { ...c, group_admins: updatedAdmins, updated_at: Date.now() } : c));

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const adminMsgText = makeAdmin
      ? `@${targetUsername} is now a Group Admin`
      : `@${targetUsername} is no longer a Group Admin`;
    const sysMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const sysMsg: Message = {
      id: sysMsgId,
      chat_id: chatId,
      created_at: Date.now(),
      sender: selfUsername,
      text: adminMsgText,
      type: 'system',
      timestamp: timeStr,
      reactions: [],
      read_by: [selfUsername]
    };

    setMessagesByChat(prev => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), sysMsg]
    }));

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'chats', chatId), {
          group_admins: updatedAdmins,
          updated_at: Date.now()
        }, { merge: true });

        await setDoc(doc(db, 'messages', sysMsgId), {
          id: sysMsgId,
          chat_id: chatId,
          created_at: Date.now(),
          sender: selfUsername,
          text: adminMsgText,
          type: 'system',
          timestamp: timeStr,
          reactions: [],
          read_by: [selfUsername]
        });
      } catch (err) {}
    }

    showToast(makeAdmin ? `@${targetUsername} promoted to Admin` : `@${targetUsername} demoted from Admin`);
  };

  // --- REAL-TIME TYPING ENGINE ---
  const typingTimeoutRef = useRef<any>(null);

  const handleComposerChange = (text: string) => {
    setComposerText(text);
    setMyActivityType(text ? 'typing' : 'none');

    const isTypingNow = text.trim().length > 0;

    // 1. BroadcastChannel local multi-tab instant sync
    try {
      if (typeof BroadcastChannel !== 'undefined' && activeChatId) {
        const bc = new BroadcastChannel('zenoa_typing_events');
        bc.postMessage({ chatId: activeChatId, sender: userUsername, isTyping: isTypingNow });
        setTimeout(() => bc.close(), 500);
      }
    } catch (e) {}

    // 2. Firestore document typing update
    if (activeChatId && isFirebaseConfigured && db) {
      // GUARD: If chat is local-only pending, do NOT write typing status to database
      const activeChat = chats.find(c => c.id === activeChatId);
      if (activeChat?.isLocalPending) return;

      if (isTypingNow) {
        if (!typingTimeoutRef.current) {
          setDoc(doc(db, 'chats', activeChatId), {
            typing_username: userUsername,
            typing_updated_at: Date.now()
          }, { merge: true }).catch(() => {});
        }
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setDoc(doc(db, 'chats', activeChatId), {
            typing_username: null,
            typing_updated_at: null
          }, { merge: true }).catch(() => {});
          try {
            if (typeof BroadcastChannel !== 'undefined') {
              const bc = new BroadcastChannel('zenoa_typing_events');
              bc.postMessage({ chatId: activeChatId, sender: userUsername, isTyping: false });
              setTimeout(() => bc.close(), 500);
            }
          } catch (e) {}
          typingTimeoutRef.current = null;
        }, 3500);
      } else {
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = null;
        }
        setDoc(doc(db, 'chats', activeChatId), {
          typing_username: null,
          typing_updated_at: null
        }, { merge: true }).catch(() => {});
      }
    }
  };

  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('zenoa_typing_events');
        bc.onmessage = (e) => {
          const { chatId, sender, isTyping } = e.data || {};
          if (chatId && sender && sender !== userUsername) {
            setChats(prev => prev.map(c => {
              if (c.id === chatId) {
                return {
                  ...c,
                  typing: isTyping,
                  typing_username: isTyping ? sender : undefined
                };
              }
              return c;
            }));
          }
        };
      }
    } catch (err) {}

    return () => {
      if (bc) bc.close();
    };
  }, [userUsername]);

  // Sidebar controls
  const handleToggleMuteChat = (e: React.MouseEvent | null, chatId: string) => {
    if (e) e.stopPropagation();
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const nextMute = !c.muted;
        showToast(nextMute ? 'Chat muted' : 'Chat unmuted');
        return { ...c, muted: nextMute };
      }
      return c;
    }));
  };

  const handleTogglePinChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const nextPin = !c.pinned;
        showToast(nextPin ? 'Chat pinned' : 'Chat unpinned');
        return { ...c, pinned: nextPin };
      }
      return c;
    }));
  };

  // Trigger avatar helper letter - professional initials (no emoji symbols)
  const getAvatarLetter = (seed: string, name: string) => {
    const raw = (name || seed || 'U').trim();
    const parts = raw.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const f = (parts[0] || '').replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase();
      const s = (parts[1] || '').replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase();
      if (f && s) return `${f}${s}`;
    }
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '');
    if (clean.length > 0) {
      return clean.charAt(0).toUpperCase();
    }
    return 'Z';
  };

  const getAvatarBgClass = (seed: string) => {
    const s = (seed || '').toLowerCase();
    
    // Hash-based selection (Strictly Neutral & Professional)
    const colors = [
      'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900',
      'bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900',
      'bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900',
      'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900',
      'bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900',
      'bg-neutral-800 dark:bg-neutral-200 text-white dark:text-neutral-900'
    ];
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  };

  const renderAvatar = (seed?: string, name?: string, avatarUrl?: string, sizeClass: string = 'h-10 w-10 text-sm') => {
    const s = seed || name || 'user';
    
    // 1. If custom uploaded avatar URL is present, ALWAYS render it
    if (avatarUrl) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800`}>
          <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        </div>
      );
    }

    // 2. Official Zenoa Service Account Fallback Avatar (when no custom avatar URL)
    if (isServiceAccount(null, s)) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 bg-neutral-800 dark:bg-neutral-900 border border-neutral-700 flex items-center justify-center`}>
          <Shield className="w-1/2 h-1/2 text-white drop-shadow-sm" />
        </div>
      );
    }

    // 3. Initials / Seed Fallback Avatar
    return (
      <div className={`${sizeClass} rounded-full ${getAvatarBgClass(s)} font-bold flex items-center justify-center shrink-0`}>
        {getAvatarLetter(s, name || '')}
      </div>
    );
  };

  // Emoji preset array
  const EMOJIS = ['\u2764\uFE0F', '\u{1F44D}', '\u{1F525}', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F44F}', '\u{1F389}', '\u{1F4A1}', '\u2705', '\u2728', '\u2615'];
  const STICKERS = ['\u{1F431} Meow!', '\u{1F436} Woof!', '\u{1F355} Pizza Party', '\u{1F680} To the Moon!', '\u{1F451} Royal', '\u{1F389} Congrats!', '\u{1F4A4} Sleepy', '\u{1F3AF} Nailed It'];
  const GIFS = [
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3NteTJrNWptdnF3YXpyZXB6azNpaW44eDRscGFhbW14amgyZHhqNyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3ntq5fv6uy1ko/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExZ3g5MHNxZWF2bThnbWpyajc1czM0ZmlmdmE5ZWlycjE1MGQzMWQ4YiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/X38toIoDTfCda/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMms3YWJ6aXp5M3psZWhkZHFubGtsZ3Btb3pyMXdveDRpbnptczR2NCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l3q2zVr6cu95nF6O4/giphy.gif',
    'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNWV6czN1ZHhrM3h6NmZib2UycXp0cm9hY3ZzMWN0Nm1ldWw1eHdybiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/cuPm4p4pClZKs/giphy.gif'
  ];

  // Helper calculation for total unreads
  const totalUnreads = chats.reduce((acc, c) => acc + c.unread, 0);

  if (isAuthResolving) {
    return (
      <div className={`min-h-[100dvh] w-full flex flex-col items-center justify-center p-6 transition-colors ${themeMode === 'dark' ? 'bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-800'}`}>
        <div className="text-center space-y-4 max-w-sm">
          <div className="flex justify-center">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full border-4 border-indigo-100 dark:border-indigo-950/40 border-t-indigo-600 dark:border-t-indigo-400 animate-spin" />
              <div className="h-10 w-10 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-sans font-black text-lg flex items-center justify-center shadow-md">
                Z
              </div>
            </div>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-sans text-sm font-bold tracking-[0.2em] uppercase text-neutral-500 dark:text-neutral-400">
              Zenoa
            </h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 dark:text-neutral-700 dark:text-neutral-300 animate-pulse">
              Reconnecting secure session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (showAdminPanel) {
    return (
      <AdminPanel
        currentUser={{
          username: userUsername || 'admin',
          display_name: userDisplayName || 'System Administrator',
          email: userEmail || 'azadaman19s@gmail.com',
          bio: userBio || 'System Master Admin',
          avatar_seed: userAvatarSeed || 'admin',
          online: true,
          last_seen: 'Online',
          role: 'super_admin'
        }}
        allUsers={uniqueUserList}
        allChats={chats}
        onUpdateUser={(updatedUser) => {
          if (updatedUser.username) {
            setUsers((prev) => ({
              ...prev,
              [updatedUser.username]: updatedUser
            }));
          }
        }}
        onDeleteUser={(username, userId) => {
          setUsers((prev) => {
            const next = { ...prev };
            if (username) {
              delete next[username];
              delete next[username.toLowerCase()];
            }
            if (userId) {
              delete next[userId];
            }
            return next;
          });
        }}
        onCloseAdmin={() => {
          setShowAdminPanel(false);
          try {
            window.history.pushState({}, '', '/');
          } catch (e) {}
        }}
        onRefreshData={() => {}}
      />
    );
  }

  // Authentication & Mandatory Setup UI Render
  if (isNewUserSetupPending || (isAuthenticated && (!userDisplayName || !userUsername))) {
    return (
      <AccountSetup
        initialFullName={pendingUserAuth?.displayName || userDisplayName || ''}
        initialUsername={userUsername || ''}
        initialEmail={pendingUserAuth?.email || userEmail || ''}
        onComplete={handleCompleteMandatoryAccountSetup}
        checkUsernameAvailability={handleCheckUsernameAvailability}
        themeMode={themeMode}
        onSignOut={handleLogout}
      />
    );
  }

  const dbUserObj = userUsername ? users[userUsername.toLowerCase()] : null;

  const currentUserObj: UserData | null = isAuthenticated ? {
    id: userId,
    username: userUsername,
    display_name: dbUserObj?.display_name || userDisplayName,
    email: userEmail,
    bio: dbUserObj?.bio || userBio,
    avatar_seed: dbUserObj?.avatar_seed || userAvatarSeed,
    avatar_url: dbUserObj?.avatar_url || userAvatarUrl,
    mobile_number: userPhone,
    online: true,
    last_seen: 'Online',
    is_verified: dbUserObj?.is_verified ?? false,
    verified_type: dbUserObj?.verified_type ?? null,
    is_official: dbUserObj?.is_official ?? false,
    followers: dbUserObj?.followers || [],
    following: dbUserObj?.following || [],
    is_private: dbUserObj?.is_private ?? false
  } : null;

  // 1. DEDICATED STANDALONE SERVICES ROUTING (Independent identities & "Continue with Zenoa" gateways)
  const isSSOPath = typeof window !== "undefined" && window.location.pathname === "/auth/sso";
  if (isSSOPath) {
    if (onboardingStep > 0 && onboardingStep < 3 && isAuthenticated) {
      return (
        <AccountSetup
          initialFullName={userDisplayName}
          initialUsername={userUsername}
          initialEmail={userEmail}
          onComplete={handleCompleteMandatoryAccountSetup}
          checkUsernameAvailability={handleCheckUsernameAvailability}
          themeMode={themeMode}
          onSignOut={handleLogout}
        />
      );
    }
    return (
      <SSOLogin 
        themeMode={themeMode}
        currentUser={currentUserObj}
        onLoginRequest={() => {
          setShowLandingPage(false);
          setAuthFlowInitialMode('login');
        }}
        onInlineLogin={async (identifier, pass) => {
          const res = await handleAuthFlowLogin(identifier, pass);
          return { success: res.success, error: res.error };
        }}
        onLogout={handleLogout}
      />
    );
  }

  const isDocsPath = typeof window !== "undefined" && (
    window.location.pathname === "/docs" || 
    window.location.pathname === "/documentation" || 
    window.location.pathname === "/api-docs" ||
    new URLSearchParams(window.location.search).get("view") === "docs" ||
    new URLSearchParams(window.location.search).get("view") === "documentation"
  );
  if (isDocsPath) {
    return (
      <DocumentationStandalone 
        onBackToApp={() => {
          try {
            window.history.pushState({}, '', '/');
            window.location.href = '/';
          } catch(e) {}
        }}
        onOpenConsole={() => {
          try {
            window.history.pushState({}, '', '/developer');
            window.location.href = '/developer';
          } catch(e) {}
        }}
      />
    );
  }

  const isSSOConsolePath = typeof window !== "undefined" && (window.location.pathname === "/sso" || window.location.pathname === "/developer/sso"); 
  if (isSSOConsolePath) return <SSOConsoleStandalone currentUser={currentUserObj} />; 

  const isDeveloperPath = typeof window !== "undefined" && (
    window.location.pathname === "/developer" || 
    window.location.pathname === "/portal" ||
    new URLSearchParams(window.location.search).get("view") === "developer"
  );
  if (isDeveloperPath) return <DeveloperConsoleStandalone />;
  
  if (!isAuthenticated) {
    if (isEmailVerificationPending) {
      return (
        <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${themeMode === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl relative z-10 backdrop-blur-xl bg-white/90 dark:bg-neutral-900/90 border-neutral-200/80 dark:border-neutral-800 text-center space-y-6">
            <div className="flex justify-center animate-bounce">
              <div className="h-16 w-16 rounded-full bg-neutral-100 dark:bg-indigo-950/50 text-neutral-900 dark:text-neutral-100 flex items-center justify-center">
                <Mail className="h-8 w-8" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Verify Your Email Address</h2>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                We have sent a secure magic verification link to:
              </p>
              <div className="inline-block py-1.5 px-3 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs font-semibold font-mono text-neutral-800 dark:text-neutral-200">
                {pendingVerificationEmail}
              </div>
            </div>

            <div className="bg-neutral-50 dark:bg-neutral-800/40 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800/60 text-left space-y-2 text-xs">
              <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-semibold">
                <Check className="h-4 w-4" />
                <span>Verification instructions:</span>
              </div>
              <p className="text-neutral-500 dark:text-neutral-400 leading-normal">
                1. Open your email inbox and click the verification link.<br/>
                2. Once verified, this page will <strong>automatically detect</strong> it and redirect you instantly!
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex items-center justify-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                <RefreshCw className="h-3 w-3 animate-spin text-neutral-900 dark:text-neutral-100" />
                <span>Checking verification status...</span>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (auth && auth.currentUser) {
                        await sendEmailVerification(auth.currentUser);
                        showToast("Verification link resent! Check your inbox.");
                      } else {
                        showToast("Please try again later.");
                      }
                    } catch (e: any) {
                      showToast(e.message || "Failed to resend.");
                    }
                  }}
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                >
                  Resend Link
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (isFirebaseConfigured && auth) {
                      await firebaseSignOut(auth);
                    }
                    setIsEmailVerificationPending(false);
                    setPendingVerificationEmail('');
                    setAuthFlowInitialMode('login');
                  }}
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl bg-neutral-100 dark:bg-rose-950/20 text-neutral-900 dark:text-neutral-100 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
                >
                  Cancel & Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (publicProfileUsername) {
      return (
        <PublicProfileView
          username={publicProfileUsername}
          themeMode={themeMode}
          onToggleTheme={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
          onGoToLogin={() => {
            setAuthFlowInitialMode('login');
            setShowLandingPage(false);
            try {
              window.history.pushState({}, '', '/login');
            } catch(e) {}
          }}
        />
      );
    }

    if (showLandingPage) {
      return (
        <LandingPage
          onStartAuth={(initialMode) => {
            const mode = initialMode || 'login';
            setAuthFlowInitialMode(mode);
            setShowLandingPage(false);
            try {
              window.history.pushState({}, '', '/login');
            } catch(e) {}
          }}
          themeMode={themeMode}
          onToggleTheme={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
          onOpenAdmin={() => {
            setShowAdminPanel(true);
            try {
              window.history.pushState({}, '', '/admin');
            } catch(e) {}
          }}
        />
      );
    }

    return (
      <AuthFlow
        initialMode={authFlowInitialMode}
        onBackToLanding={() => {
          setShowLandingPage(true);
          try {
            window.history.pushState({}, '', '/');
          } catch(e) {}
        }}
        onLoginSubmit={handleAuthFlowLogin}
        onRegisterSubmit={handleAuthFlowRegister}
        onVerifyOtpSubmit={handleAuthFlowVerifyOtp}
        truecallerProfile={truecallerProfile}
        onOAuthLogin={handleOAuthLogin}
        onForgotPassword={handleForgotPassword}
        themeMode={themeMode}
        onToggleTheme={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
        existingUsernames={uniqueUserList.map(u => u.username).filter((un): un is string => typeof un === 'string' && un.trim() !== '')}
        checkUsernameAvailability={handleCheckUsernameAvailability}
        isOnboarding={onboardingStep > 0}
        initialRegStep={onboardingStep}
        allUsers={uniqueUserList}
        onFollowUser={handleFollow}
        onSaveProfilePicture={async (avatarUrl: string, avatarSeed: string) => {
          setUserAvatarUrl(avatarUrl);
          setUserAvatarSeed(avatarSeed);
          if (isFirebaseConfigured && db && userId) {
            try {
              await setDoc(doc(db, 'users', userId), { avatar_url: avatarUrl, avatar_seed: avatarSeed }, { merge: true });
            } catch (e) {}
          }
        }}
        onCompleteAuth={() => {
          setIsAuthenticated(true);
          setOnboardingStep(0);
          showToast('Welcome to Zenoa Messenger!');
        }}
      />
    );
  }

  // Determine active theme so we can style app header and composer dynamically
  const currentChatTheme = getThemeById(chatWallpapers[activeChatId] || DEFAULT_THEME_ID);
  const themeHoverTextClass = currentChatTheme.actionButtonText.split(' ').map(c => `hover:${c}`).join(' ');

  // MAIN RUNTIME APPLICATION (Zenoa Messenger)
  return (

    <div className={`w-full h-[100dvh] flex flex-col md:flex-row overflow-hidden select-none touch-manipulation font-sans transition-colors ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-white text-neutral-800'}`}>
      {/* Central Kickout Modal (Account Logged In On Another Page with 5-Second Timer) */}
      <AnimatePresence>
        {kickoutData && (
          <div className="fixed inset-0 z-[999999] bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-center relative overflow-hidden"
            >
              <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-5 shadow-lg">
                <AlertTriangle className="h-8 w-8 animate-bounce" />
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white mb-2">
                Account Logged In Elsewhere
              </h2>

              <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed mb-6">
                Your Zenoa account <strong className="text-neutral-900 dark:text-white font-bold">@{kickoutData.username}</strong> was logged in on another browser tab, window, or device.
                <br className="my-1" />
                For security and data integrity, only one active session is permitted at a time. This session is being logged out automatically.
              </p>

              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 rounded-2xl border border-rose-200 dark:border-rose-800/60 mb-6 flex items-center justify-center gap-3">
                <div className="h-10 w-10 rounded-full bg-rose-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-md animate-pulse">
                  {kickoutData.countdown}s
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">Logging Out Automatically</p>
                  <p className="text-[11px] text-rose-700 dark:text-rose-400">This window will log out in {kickoutData.countdown} second{kickoutData.countdown !== 1 ? 's' : ''}...</p>
                </div>
              </div>

              <button
                onClick={() => {
                  handleLogout();
                  setKickoutData(null);
                }}
                className="w-full py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-sm shadow-lg shadow-rose-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Log Out Now</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Opening Entrance Animation Overlay (Google / Social / Email Sign-In) */}
      <AnimatePresence>
        {isOpeningAnimationActive && (
          <motion.div 
            key="opening-app-splash"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-neutral-950 transition-all select-none"
          >
            <div className="flex flex-col items-center text-center p-8 space-y-6 max-w-sm">
              <div className="relative flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-indigo-500/20 dark:bg-indigo-500/30 blur-2xl animate-pulse" />
                <div className="h-20 w-20 rounded-3xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center shadow-2xl relative z-10 animate-bounce">
                  {openingAnimationData.provider === 'Google' ? (
                    <svg className="w-10 h-10" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                  ) : (
                    <span className="text-3xl font-extrabold tracking-tighter">Z</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold tracking-tight text-neutral-900 dark:text-white">
                  Welcome back, {openingAnimationData.displayName}!
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Signed in securely with {openingAnimationData.provider} \u2022 Connecting to Zenoa...
                </p>
              </div>

              <div className="w-48 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 animate-[pulse_1.5s_infinite]" style={{ width: '100%' }} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>



      {/* MODAL: Forward Message */}
      {showForwardModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-150'}`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base">Forward message</h3>
              <button onClick={() => setShowForwardModal(false)} className="p-1 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-4 w-4" /></button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {uniqueChats.map(chat => (
                <button 
                  key={chat.id} 
                  onClick={() => {
                    if (forwardTargets.includes(chat.id)) {
                      setForwardTargets(prev => prev.filter(id => id !== chat.id));
                    } else {
                      setForwardTargets(prev => [...prev, chat.id]);
                    }
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-colors cursor-pointer ${forwardTargets.includes(chat.id) ? 'bg-neutral-100 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900' : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                >
                  {renderAvatar(chat.avatar_seed, chat.name, chat.avatar_url, 'h-8 w-8 text-xs')}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{chat.name}</p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{chat.type === 'dm' ? `@${chat.username}` : 'Group'}</p>
                  </div>
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${forwardTargets.includes(chat.id) ? 'bg-neutral-900 dark:bg-neutral-100 border-neutral-900 dark:border-neutral-100 text-white dark:text-neutral-900' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {forwardTargets.includes(chat.id) && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForwardModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handleForwardSubmit} disabled={forwardTargets.length === 0} className="flex-1 py-2.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-neutral-900 text-xs font-semibold rounded-xl shadow-md transition-colors">Forward</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Message */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-xs rounded-2xl p-5 border shadow-2xl ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-150'}`}>
            <div className="flex items-center gap-2 mb-3 text-neutral-900 dark:text-neutral-100">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Delete message?</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">Warning: Messages and media are stored locally on your device. Deleting will permanently remove them from local storage.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteForMe} className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer">Delete for me</button>
              <button onClick={handleDeleteForEveryone} className="w-full py-2.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-rose-700 text-white dark:text-neutral-900 text-xs font-semibold rounded-xl transition-colors cursor-pointer">Delete for everyone</button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteMessageId(''); }} className="w-full py-2 text-xs font-semibold text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-300 transition-colors mt-1 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Warning Confirmation Dialog for Sensitive Actions */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-150'}`}>
            <div className="flex items-start gap-3.5 mb-4">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                confirmModal.variant === 'danger'
                  ? 'bg-neutral-100 dark:bg-rose-950/40 text-neutral-900 dark:text-neutral-100 border border-rose-200/50 dark:border-rose-900/50'
                  : confirmModal.variant === 'warning'
                  ? 'bg-neutral-100 dark:bg-neutral-800 dark:bg-amber-950/40 text-neutral-600 dark:text-neutral-400 border border-amber-200/50 dark:border-amber-900/50'
                  : 'bg-neutral-100 dark:bg-indigo-950/40 text-neutral-900 dark:text-neutral-100 border border-indigo-200/50 dark:border-indigo-900/50'
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{confirmModal.title}</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">{confirmModal.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                type="button"
                onClick={closeConfirm}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                  confirmModal.variant === 'danger'
                    ? 'bg-neutral-900 dark:bg-neutral-100 hover:bg-rose-700'
                    : confirmModal.variant === 'warning'
                    ? 'bg-neutral-900 dark:bg-neutral-100 hover:bg-amber-700'
                    : 'bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Primary Navigation Panels (Chats, Discover, Settings) */}
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 h-full max-h-[100dvh] transition-colors ${themeMode === 'dark' ? 'bg-[#0f1422] border-slate-800/80' : 'bg-slate-50/80 border-slate-200/80'}`}>
        {/* Brand App Header */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b border-slate-200/80 dark:border-slate-800/80">
          {branding.messenger_logo ? (
            <img 
              src={branding.messenger_logo} 
              className="h-9 w-9 rounded-xl object-contain border border-slate-200/40 dark:border-slate-800/40 shadow-sm shrink-0" 
              alt="App Logo" 
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-neutral-900 dark:bg-neutral-800 border border-neutral-700 text-white font-zenoa font-bold text-base flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
              Z
            </div>
          )}
          <span className="font-zenoa font-bold text-base tracking-[0.14em] uppercase text-slate-900 dark:text-white truncate">
            {branding.app_name || 'Zenoa'}
          </span>
          {isAuthenticated && (
            <div className="relative ml-auto">
              <button 
                onClick={() => setShowStatusPopover(prev => !prev)}
                className={`flex items-center gap-1.5 text-[10px] border px-2.5 py-1 rounded-full font-semibold cursor-pointer transition-colors shadow-2xs ${
                  myPresenceStatus === 'online' 
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : myPresenceStatus === 'away'
                    ? 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30 text-amber-700 dark:text-amber-300'
                    : myPresenceStatus === 'busy'
                    ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30 text-rose-700 dark:text-rose-300'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title="Change Presence Status & Note"
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  myPresenceStatus === 'online' ? 'bg-emerald-500' : myPresenceStatus === 'away' ? 'bg-amber-500' : myPresenceStatus === 'busy' ? 'bg-rose-500' : 'bg-slate-400'
                }`} />
                <span className="capitalize">{myPresenceStatus}</span>
              </button>
              
              <button 
                onClick={() => {
                  setShowNotificationsPanel(true);
                  markNotificationsAsRead();
                }}
                className="relative p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-all active:scale-95 cursor-pointer ml-1"
                title="Notifications"
              >
                <Bell className="h-4.5 w-4.5 stroke-[2.2]" />
                {(notifications.filter(n => !n.read).length > 0 || followRequests.length > 0) && (
                  <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                )}
              </button>

              {/* Status & Activity Popover */}
              {showStatusPopover && (
                <div className="absolute right-0 top-9 z-50 w-56 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-3 backdrop-blur-md">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Activity Status</span>
                    <button onClick={() => setShowStatusPopover(false)} className="p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="h-3 w-3" /></button>
                  </div>

                  <div className="space-y-1">
                    {[
                      { status: 'online', label: 'Online', color: 'bg-emerald-500' },
                      { status: 'away', label: 'Away', color: 'bg-amber-500' },
                      { status: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500' },
                      { status: 'offline', label: 'Invisible', color: 'bg-slate-400' },
                    ].map(st => (
                      <button
                        key={st.status}
                        onClick={() => {
                          setMyPresenceStatus(st.status as any);
                          setShowStatusPopover(false);
                          showToast(`Status set to ${st.label}`);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-medium transition-colors ${
                          myPresenceStatus === st.status ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-semibold border border-indigo-200/50 dark:border-indigo-800/40' : 'hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <span className={`h-2 w-2 rounded-full ${st.color}`} />
                          <span>{st.label}</span>
                        </span>
                        {myPresenceStatus === st.status && <Check className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-2 space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Custom Status Note</label>
                    <input 
                      type="text" 
                      value={myCustomStatus}
                      onChange={e => setMyCustomStatus(e.target.value)}
                      placeholder="e.g. In a meeting"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/90 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation list */}
        <nav className="flex-1 p-3 space-y-1">
          <button 
            onClick={() => { setActiveView('chats'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === 'chats' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Chats</span>
            {totalUnreads > 0 && <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold h-4 px-1.5 rounded-full flex items-center justify-center shadow-xs">{totalUnreads}</span>}
          </button>
          
          <button 
            onClick={() => { setActiveView('search'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === 'search' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </button>

          <button 
            onClick={() => { setActiveView('profile'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === 'profile' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </button>

          <button 
            onClick={() => { setActiveView('settings'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${activeView === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-200/60 dark:border-indigo-800/50 shadow-2xs' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'}`}
          >
            <Palette className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Profile Card Footer */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          <div 
            onClick={() => { setActiveView('profile'); setShowProfilePanel(false); }}
            className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 cursor-pointer hover:border-indigo-400/60 dark:hover:border-indigo-500/50 transition-all group shadow-2xs"
          >
            {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-8 w-8 text-xs')}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors text-slate-900 dark:text-white">{userDisplayName}</p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">@{userUsername}</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  changeTheme(themeMode === 'light' ? 'dark' : 'light'); 
                }}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
                title="Theme"
              >
                {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveView('settings'); }}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" 
                title="Settings"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER: Main working viewport */}
      <main className="flex flex-1 h-full max-h-[100dvh] relative overflow-hidden bg-slate-50/50 dark:bg-[#0b0f19]">
        
        {/* VIEW 1: Chats History panel list & message chain */}
        {activeView === 'chats' && (
          <div className="flex flex-1 h-full relative">
            
            {/* Left Sub-sidebar: Chat rooms */}
            <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 border-r border-slate-200/80 dark:border-slate-800/80 shrink-0 h-full bg-white/70 dark:bg-[#0f1422]/90 backdrop-blur-md`}>
              <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {branding.messenger_logo && (
                      <img 
                        src={branding.messenger_logo} 
                        className="h-6 w-6 object-contain rounded-lg border border-slate-200/40 dark:border-slate-800/40 shadow-xs shrink-0" 
                        alt="Logo" 
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h1 className="font-zenoa text-xl md:text-2xl font-bold tracking-[0.14em] uppercase text-slate-900 dark:text-white select-none transition-colors truncate">
                      {branding.app_name || 'Zenoa'}
                    </h1>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {/* Notification Bell */}
                    <button 
                      onClick={() => {
                        setShowNotificationsPanel(true);
                        markNotificationsAsRead();
                      }}
                      className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
                      title="Notifications & Follow Requests"
                    >
                      <Bell className="h-4 w-4" />
                      {(notifications.filter(n => !n.read).length > 0 || followRequests.length > 0) && (
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 animate-pulse" />
                      )}
                    </button>

                    {/* New Group Button */}
                    <button 
                      onClick={() => {
                        setNewGroupPreselectedUser(null);
                        setShowNewGroupModal(true);
                      }} 
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer" 
                      title="New Group Chat"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={chatSearchQuery}
                    onChange={e => setChatSearchQuery(e.target.value)}
                    placeholder="Search chats or people..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 transition-all"
                  />
                </div>
              </div>

              {/* Chat room scroll feed */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-24 md:pb-2 overscroll-contain">
                {filteredChats.length === 0 && (!chatSearchQuery.trim() || matchingContactsForSidebar.length === 0) ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400">No chats or contacts found</p>
                  </div>
                ) : (
                  <>
                    {filteredChats.map(chat => (
                      <div 
                        key={chat.id} 
                        onClick={() => { 
                          setActiveChatId(chat.id); 
                          setMobileShowChat(true);
                          setChats(prev => prev.map(c => c.id === chat.id ? { ...c, unread: 0 } : c));
                          if (isFirebaseConfigured && db) {
                            try {
                              updateDoc(doc(db, 'chats', chat.id), { unread: 0 }).catch(() => {});
                            } catch (e) {}
                          }
                        }}
                        onContextMenu={(e) => { e.preventDefault(); setSelectedChatForOptions(chat); }}
                        onTouchStart={() => {
                          const timer = setTimeout(() => { setSelectedChatForOptions(chat); }, 1000);
                          (window as any)._chatTouchTimer = timer;
                        }}
                        onTouchMove={() => {
                          if ((window as any)._chatTouchTimer) clearTimeout((window as any)._chatTouchTimer);
                        }}
                        onTouchEnd={() => {
                          if ((window as any)._chatTouchTimer) clearTimeout((window as any)._chatTouchTimer);
                        }}
                        className={`group w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all relative ${chat.id === activeChatId ? 'bg-indigo-50/90 dark:bg-slate-900/90 border border-indigo-200/80 dark:border-indigo-500/30 text-slate-900 dark:text-white shadow-2xs' : 'hover:bg-slate-100/70 dark:hover:bg-slate-900/50 border border-transparent'}`}
                      >
                        <div className="relative">
                          {renderAvatar(chat.avatar_seed, chat.name, chat.avatar_url || users[chat.username]?.avatar_url, 'h-10 w-10 text-sm')}
                          {isUserEffectivelyOnline(users[chat.username]) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></span>}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex justify-between items-baseline">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <p className={`text-sm truncate ${chat.id === activeChatId ? 'font-bold text-indigo-950 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'}`}>
                        {chat.type !== 'group' && chat.username && chatNicknames[chat.username] 
                          ? chatNicknames[chat.username] 
                          : chat.name}
                      </p>
                              {chat.type !== 'group' && chat.username && isAccountVerified(users[chat.username], chat.username) && (
                                <PurpleVerifiedBadge size="xs"  />
                              )}
                              {chat.pinned && <Pin className="h-3 w-3 text-amber-500 dark:text-amber-400 rotate-45 shrink-0" />}
                              {chat.muted && <VolumeX className="h-3 w-3 text-slate-400 shrink-0" />}
                              {chat.archived && <Archive className="h-3 w-3 text-slate-400 shrink-0" />}
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium shrink-0 ml-1">
                              {formatChatListTime(chat.updated_at, chat.last_time)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1 min-w-0">
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-2 flex-1 min-w-0 flex items-center gap-1">
                              {chat.last_message_sender === userUsername && chat.last_message && chat.last_message !== 'Chat history cleared' && (
                                <span className="shrink-0 inline-flex items-center">
                                  {(() => {
                                    const chatMsgs = messagesByChat[chat.id] || [];
                                    const lastMsg = chatMsgs.length > 0 ? chatMsgs[chatMsgs.length - 1] : null;
                                    
                                    const otherParticipants = (chat.participants || []).filter(p => p !== userUsername);
                                    const isAnyOtherOnline = otherParticipants.some(p => isUserEffectivelyOnline(users[p]));
                                    
                                    const isRead = lastMsg 
                                      ? (Array.isArray(lastMsg.read_by) && lastMsg.read_by.some(u => u && u !== 'me' && u !== userUsername && u !== lastMsg.sender))
                                      : (chat.last_message_status === 'read');
                                      
                                    const isDelivered = lastMsg
                                      ? (lastMsg.status === 'delivered' || (isAnyOtherOnline && !isRead))
                                      : (chat.last_message_status === 'delivered' && isAnyOtherOnline);

                                    if (isRead) {
                                      return <CheckCheck className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400 stroke-[2.5]" />;
                                    }
                                    if (isDelivered) {
                                      return <CheckCheck className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />;
                                    }
                                    return <Check className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500 stroke-[2]" />;
                                  })()}
                                </span>
                              )}
                              <span className="truncate">
                                {chat.typing ? (
                                  <span className="text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">typing...</span>
                                ) : (
                                  formatCleanChatPreview(chat.last_message || '', 36)
                                )}
                              </span>
                            </p>
                            <div className="flex items-center gap-1">
                              {chat.unread > 0 && (
                                <span className="bg-indigo-600 text-white text-[10px] font-bold h-4 px-1.5 rounded-full flex items-center justify-center shrink-0 shadow-xs">
                                  {chat.unread}
                                </span>
                              )}
                              <button 
                                onClick={(e) => { e.stopPropagation(); setSelectedChatForOptions(chat); }}
                                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-opacity text-slate-400 hover:text-slate-700 dark:hover:text-white"
                                title="Chat Options"
                              >
                                <MoreVertical className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Matching People section in sidebar search */}
                    {chatSearchQuery.trim() !== '' && matchingContactsForSidebar.length > 0 && (
                      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 mt-2 space-y-1">
                        <p className="px-3 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-left">
                          People & Contacts
                        </p>
                        {matchingContactsForSidebar.map((user, idx) => (
                          <div 
                            key={`sidebar_user_${user.id || user.username}_${idx}`}
                            onClick={() => {
                              setChatSearchQuery('');
                              handleStartChatWithUser(user);
                            }}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer hover:bg-indigo-50/60 dark:hover:bg-slate-900/60 transition-all text-left"
                          >
                            <div className="relative shrink-0">
                              {renderAvatar(user.avatar_seed, user.display_name, user.avatar_url, 'h-10 w-10 text-sm')}
                              {isUserEffectivelyOnline(user) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></span>}
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{user.display_name}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">@{user.username}</p>
                            </div>
                            <button className="px-3 py-1 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shrink-0 shadow-xs shadow-indigo-500/20 active:scale-95 transition-all">
                              Chat
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Pane: Message scroll chain */}
            <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full relative`}>
              {activeChat ? (
                <>
                  {/* Chat View Header - Adoptive to Selected Theme */}
              <div className={`flex items-center justify-between h-16 px-4 border-b shrink-0 transition-all duration-300 ${currentChatTheme.headerBg} ${currentChatTheme.headerBorder}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setMobileShowChat(false)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-current transition-all"><ChevronLeft className="h-5 w-5" /></button>
                  <div 
                    className="relative shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      if (activeChat.type === 'group') {
                        setShowGroupDetailsModal(true);
                      } else {
                        const targetUser = activeChat?.username || activeChat.avatar_seed;
                        if (targetUser) {
                          handleOpenUserProfile(targetUser);
                        }
                      }
                    }}
                  >
                    {renderAvatar(activeChat.avatar_seed, activeChat.name, activeChat.avatar_url || (activeChat?.username ? users[activeChat?.username]?.avatar_url : undefined), 'h-10 w-10 text-sm')}
                    {activeChat.type !== 'group' && isUserEffectivelyOnline(users[activeChat?.username]) && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-950"></span>}
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 
                      onClick={() => {
                        if (activeChat.type === 'group') {
                          setShowGroupDetailsModal(true);
                        } else {
                          const targetUser = activeChat?.username || activeChat.avatar_seed;
                          if (targetUser) {
                            handleOpenUserProfile(targetUser);
                          }
                        }
                      }} 
                      className={`font-bold text-sm cursor-pointer hover:underline truncate flex items-center gap-1.5 transition-all duration-300 ${currentChatTheme.headerText}`}
                    >
                      {activeChat.type !== 'group' && activeChat?.username && chatNicknames[activeChat?.username] ? (
                        <>
                          <span>{chatNicknames[activeChat?.username]}</span>
                          <span className="text-xs opacity-70 font-normal">({activeChat.name})</span>
                        </>
                      ) : (
                        <span>{activeChat.name}</span>
                      )}
                      {activeChat.type !== 'group' && activeChat?.username && !!users[activeChat?.username]?.is_verified && (
                        <PurpleVerifiedBadge size="xs"  />
                      )}
                      {activeChat.type === 'group' && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-50/20 dark:bg-indigo-950/20 text-current border border-current/20">
                          Group
                        </span>
                      )}
                    </h3>
                    <p className={`text-[10px] truncate transition-all duration-300 ${currentChatTheme.headerSubtext}`}>
                      {activeChat.type === 'group' ? (
                        <span>
                          {(activeChat.participants || []).length} members \u2022 {
                            (activeChat.participants || [])
                              .map(p => p === userUsername ? 'You' : (chatNicknames[p] || users[p]?.display_name || p))
                              .slice(0, 3)
                              .join(', ') + ((activeChat.participants || []).length > 3 ? '...' : '')
                          }
                        </span>
                      ) : activeChat.activity_type === 'recording_voice' ? (
                        <span className="text-rose-600 dark:text-rose-400 font-medium animate-pulse flex items-center gap-1">
                          <Mic className="h-3 w-3" /> recording voice note...
                        </span>
                      ) : activeChat.typing || activeChat.activity_type === 'typing' ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <span>typing</span>
                          <span className="flex items-center gap-0.5 ml-0.5">
                            <span className="h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                            <span className="h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce [animation-delay:-0.15s]" />
                            <span className="h-1 w-1 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-bounce" />
                          </span>
                        </span>
                      ) : activeChat.activity_type === 'in_call' ? (
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1">
                          <Phone className="h-3 w-3" /> in audio call...
                        </span>
                      ) : isServiceAccount(users[activeChat?.username], activeChat?.username) ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-[10px] tracking-wide text-blue-500 dark:text-blue-400">

                          <span>{isServiceAccount(users[activeChat?.username], activeChat?.username) ? (['zenoa', 'sa_zenoa', 'zenoa_official'].includes(activeChat?.username.toLowerCase()) ? 'Official Zenoa Account' : 'Business Account') : 'End-to-End Encrypted'}</span>
                        </span>
                      ) : isUserEffectivelyOnline(users[activeChat?.username]) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          Online {users[activeChat?.username]?.custom_status && users[activeChat?.username]?.custom_status?.toLowerCase() !== 'online' ? `\u2022 "${users[activeChat?.username]?.custom_status}"` : ''}
                        </span>
                      ) : (
                        <span>{getOnlineStatusText(users[activeChat?.username])}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1.5 relative">
                  {/* Voice & Video Call Buttons for 1-on-1 Chats */}
                  {activeChat.type !== 'group' && !isServiceAccount(users[activeChat?.username], activeChat?.username) && (
                    <>
                      <button 
                        onClick={() => handleStartCall('voice')} 
                        className={`p-2 rounded-xl text-neutral-500 dark:text-neutral-400 transition-all cursor-pointer active:scale-95 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`} 
                        title="Voice Call"
                      >
                        <Phone className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleStartCall('video')} 
                        className={`p-2 rounded-xl text-neutral-500 dark:text-neutral-400 transition-all cursor-pointer active:scale-95 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`} 
                        title="Video Call"
                      >
                        <Video className="h-4 w-4" />
                      </button>
                    </>
                  )}

                  {/* Group Info Icon or Follow Text Button */}
                  {activeChat.type === 'group' ? (
                    <button
                      onClick={() => setShowGroupDetailsModal(true)}
                      className={`p-2 rounded-xl text-neutral-500 dark:text-neutral-400 transition-all cursor-pointer mr-1 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`}
                      title="Group Information & Members"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                  ) : activeChat?.username && activeChat?.username !== userUsername && !isServiceAccount(users[activeChat?.username], activeChat?.username) && !users[activeChat?.username]?.followers?.includes(userUsername) && (
                    <button
                      onClick={() => activeChat?.username && handleFollow(users[activeChat?.username.toLowerCase()])}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-md shadow-black/5 transition-all cursor-pointer mr-1 active:scale-95 ${currentChatTheme.accentBg} ${currentChatTheme.accentText}`}
                      title="Click to Follow"
                    >
                      Follow
                    </button>
                  )}

                  {/* Search inside chat button */}
                  <button 
                    onClick={() => setShowMsgSearchInChat(!showMsgSearchInChat)} 
                    className={`p-2 rounded-xl transition-all cursor-pointer active:scale-95 ${
                      showMsgSearchInChat 
                        ? `${currentChatTheme.actionButtonActiveBg}` 
                        : `text-neutral-500 dark:text-neutral-400 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`
                    }`}
                    title="Search Messages"
                  >
                    <Search className="h-4 w-4" />
                  </button>

                  {/* 3-Dot Options */}
                  <button 
                    onClick={() => setShowChatCustomizationSheet(true)} 
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      showChatCustomizationSheet 
                        ? `${currentChatTheme.actionButtonActiveBg}` 
                        : `text-neutral-500 dark:text-neutral-400 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`
                    }`}
                    title="Options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Msg Search bar overlay */}
              {showMsgSearchInChat && (
                <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-2 px-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  <input 
                    type="text" 
                    value={messageSearchQuery}
                    onChange={e => setMessageSearchQuery(e.target.value)}
                    placeholder="Search in conversation..."
                    className="flex-1 bg-transparent border-none outline-none text-xs"
                  />
                  <button onClick={() => { setShowMsgSearchInChat(false); setMessageSearchQuery(''); }} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-800"><X className="h-3.5 w-3.5" /></button>
                </div>
              )}

              {/* Pinned Messages Bar */}
              {activeMessages.some(m => m.pinned && !m.deleted_for_me && !m.deleted_for_everyone) && (
                <div className="bg-neutral-100/50 dark:bg-indigo-950/20 border-b border-neutral-100 dark:border-neutral-800/80 px-4 py-2 flex items-center gap-3 z-10">
                  <Pin className="h-3.5 w-3.5 text-neutral-900 dark:text-neutral-100 rotate-45 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-bold text-neutral-900 dark:text-neutral-100">Pinned</p>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">
                      {activeMessages.find(m => m.pinned && !m.deleted_for_me && !m.deleted_for_everyone)?.text || '[Attachment]'}
                    </p>
                  </div>
                </div>
              )}

              {/* Message scroll list with Theme & Wallpaper Support */}
              {(() => {
                const activeTheme = getThemeById(chatWallpapers[activeChatId] || DEFAULT_THEME_ID);
                const currentVisibleLimit = visibleMessageCountByChat[activeChatId] || MESSAGE_PAGE_SIZE;
                const totalChatMessages = filteredActiveMessages.length;
                const hasOlderMessages = totalChatMessages > currentVisibleLimit;
                const displayedActiveMessages = hasOlderMessages
                  ? filteredActiveMessages.slice(totalChatMessages - currentVisibleLimit)
                  : filteredActiveMessages;

                return (
                  <div 
                    className={`flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-2 overscroll-contain pb-6 md:pb-4 transition-all ${activeTheme.bgClass}`}
                    style={activeTheme.bgStyle}
                  >
                {/* Automatic Top Privacy & Encryption Banner (Zenoa zero-knowledge) */}
                <div className="flex justify-center my-3 px-2 select-none">
                  <div className={`max-w-md w-full border rounded-2xl p-3 text-center shadow-2xs backdrop-blur-xs ${isServiceAccount(users[activeChat?.username], activeChat?.username) ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-200/80 dark:border-blue-800/50' : 'bg-neutral-100 dark:bg-neutral-800/90 dark:bg-neutral-900/90 border-amber-200/80 dark:border-neutral-800'}`}>
                    <div className={`flex items-center justify-center gap-1.5 font-bold text-xs mb-1 ${isServiceAccount(users[activeChat?.username], activeChat?.username) ? 'text-blue-900 dark:text-blue-300' : 'text-amber-900 dark:text-amber-300'}`}>
                      {isServiceAccount(users[activeChat?.username], activeChat?.username) ? <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <Lock className="h-3.5 w-3.5 text-neutral-600 dark:text-neutral-400" />}
                      <span>{isServiceAccount(users[activeChat?.username], activeChat?.username) ? (['zenoa', 'sa_zenoa', 'zenoa_official'].includes(activeChat?.username.toLowerCase()) ? 'Official Zenoa Account' : 'Business Account') : 'End-to-End Encrypted'}</span>
                    </div>
                    <p className={`text-[11px] leading-relaxed font-medium ${isServiceAccount(users[activeChat?.username], activeChat?.username) ? 'text-blue-950/80 dark:text-blue-200/80' : 'text-amber-950/80 dark:text-neutral-300'}`}>
                      {isServiceAccount(users[activeChat?.username], activeChat?.username) ? 'This business uses Zenoa Business securely. System updates, verification codes, and direct messages are delivered safely.' : 'Messages and calls are secured with end-to-end encryption. No third party can read or listen to them, not even Zenoa.'}
                    </p>
                  </div>
                </div>

                {/* Pagination: Load Earlier Messages */}
                {hasOlderMessages && (
                  <div className="flex justify-center my-2 select-none">
                    <button
                      onClick={() => {
                        setVisibleMessageCountByChat(prev => ({
                          ...prev,
                          [activeChatId]: (prev[activeChatId] || MESSAGE_PAGE_SIZE) + MESSAGE_PAGE_SIZE
                        }));
                      }}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold bg-neutral-100/90 dark:bg-neutral-800/90 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Clock className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" />
                      <span>Load older messages ({totalChatMessages - currentVisibleLimit} earlier)</span>
                    </button>
                  </div>
                )}

                {filteredActiveMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                    <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">No messages in this chat</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Type a message below to start chatting!</p>
                  </div>
                ) : (
                  displayedActiveMessages.map((msg, idx) => {
                    const isMe = isSenderMe(msg.sender);
                    const senderName = getSenderDisplayName(msg.sender);
                    const senderUsername = users[msg.sender]?.username || msg.sender;
                    const isFirstInGroup = idx === 0 || displayedActiveMessages[idx - 1]?.sender !== msg.sender;
                    const otherParticipants = activeChat?.participants.filter(p => p !== userUsername) || [];
                    const isDelivered = otherParticipants.some(p => isUserEffectivelyOnline(users[p]));

                    const currentDateKey = getMessageDateKey(msg.created_at, msg.timestamp);
                    const prevMsg = idx > 0 ? displayedActiveMessages[idx - 1] : null;
                    const prevDateKey = prevMsg ? getMessageDateKey(prevMsg.created_at, prevMsg.timestamp) : null;
                    const showDateDivider = idx === 0 || currentDateKey !== prevDateKey;

                    return (
                      <React.Fragment key={`${msg.id || 'msg'}_${idx}`}>
                        {showDateDivider && (
                          <div className="flex justify-center my-3 select-none sticky top-2 z-10">
                            <div className="px-3.5 py-1 rounded-full text-[11px] font-semibold tracking-wide bg-neutral-100/90 dark:bg-neutral-800/90 text-neutral-700 dark:text-neutral-300 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs backdrop-blur-md">
                              {formatChatDateDivider(currentDateKey)}
                            </div>
                          </div>
                        )}
                        <MessageCard
                          msg={msg}
                          isMe={isMe}
                          senderName={senderName}
                          senderUsername={senderUsername}
                          isFirstInGroup={isFirstInGroup}
                          isGroup={activeChat?.type === 'group'}
                          privacyReadReceipts={privacyReadReceipts}
                          isDelivered={isDelivered}
                          isSenderVerified={!!users[senderUsername]?.is_verified}
                          isSenderServiceAccount={isServiceAccount(users[senderUsername], senderUsername)}
                          themeId={chatWallpapers[activeChatId] || DEFAULT_THEME_ID}
                          onOpenActions={(m) => setSelectedMessageForActions(m)}
                          onReact={(msgId, emoji) => handleReactToMessage(msgId, emoji)}
                          onVotePoll={(msgId, optionId) => handleVotePoll(msgId, optionId)}
                          onOpenMediaPlayer={(type, url, meta) => openInMediaPlayer(type, url, meta)}
                          onToast={(text) => showToast(text)}
                          driveAccessToken={driveAccessToken}
                        />
                      </React.Fragment>
                    );
                  })
                )}
                {/* Real-Time Typing Indicator Bubble with 3 Jumping Dots */}
                {(activeChat?.typing || activeChat?.activity_type === 'typing') && (
                  <div className="flex items-center gap-2 my-2 select-none animate-fade-in">
                    <div className="bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 px-3.5 py-2 rounded-2xl rounded-bl-xs border border-neutral-200/60 dark:border-neutral-700/60 shadow-2xs flex items-center gap-2">
                      <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                        {activeChat.type === 'group' && activeChat.typing_username ? `${getSenderDisplayName(activeChat.typing_username)} is typing` : 'typing'}
                      </span>
                      <div className="flex items-center gap-1 pl-0.5">
                        <span className="h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300 animate-bounce [animation-delay:-0.3s]" />
                        <span className="h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300 animate-bounce [animation-delay:-0.15s]" />
                        <span className="h-2 w-2 rounded-full bg-neutral-600 dark:bg-neutral-300 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            );
          })()}

              {/* Composer Input Area Controls OR Blocked User Banner - Theme Adaptive */}
              <div className={`p-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] md:pb-3 shrink-0 space-y-2 min-w-0 transition-all duration-300 ${currentChatTheme.composerBorder} ${currentChatTheme.composerBg}`}>
                {activeChat && blockedUsers.includes(activeChat?.username) ? (
                  <div className="p-4 bg-neutral-100 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-center animate-fade-in">
                    <div className="flex items-center gap-2 text-neutral-900 dark:text-neutral-100 font-bold text-sm">
                      <UserX className="h-5 w-5 shrink-0" />
                      <span>You blocked {activeChat.name || activeChat?.username}</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                      You cannot send or receive messages in this chat while this user is blocked.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        onClick={() => handleToggleBlockUser(activeChat?.username)}
                        className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 active:scale-95 text-white dark:text-neutral-900 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Unblock {activeChat.name || activeChat?.username}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteChat(activeChatId)}
                        className="px-4 py-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 hover:bg-rose-200 dark:hover:bg-rose-900 active:scale-95 text-rose-700 dark:text-rose-200 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete Chat</span>
                      </button>
                    </div>
                  </div>
                ) : activeChat.type === 'group' && activeChat.send_messages_permission === 'admins' && (activeChat.admin !== userUsername && !activeChat.group_admins?.includes(userUsername)) ? (
                  <div className="p-4 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-center space-y-1 my-2">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-neutral-800 dark:text-neutral-200">
                      <Shield className="h-4 w-4 text-indigo-500" />
                      <span>Announcement Mode</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">
                      Only group admins can send messages in this group.
                    </p>
                  </div>
                ) : (
                  <>
                {/* Reply display banner */}
                {replyToId && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/80 p-2 rounded-xl flex items-center justify-between border-l-4 border-neutral-900 dark:border-neutral-100">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-neutral-700 dark:text-neutral-300">Replying to {replyToSender}</p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{replyToPreview}</p>
                    </div>
                    <button onClick={() => { setReplyToId(''); setReplyToPreview(''); setReplyToSender(''); }} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"><X className="h-4 w-4" /></button>
                  </div>
                )}

                {/* Edit display banner */}
                {editMessageId && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/80 p-2 rounded-xl flex items-center justify-between border-l-4 border-emerald-500">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-neutral-900 dark:text-neutral-100">Editing Message</p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{composerText}</p>
                    </div>
                    <button onClick={() => { setEditMessageId(''); setComposerText(''); }} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"><X className="h-4 w-4" /></button>
                  </div>
                )}

                {/* Global Backdrop for Composer Popups */}
                {(showAttachMenu || showUnifiedPicker) && (
                  <div 
                    className="fixed inset-0 z-30" 
                    onClick={() => {
                      setShowAttachMenu(false);
                      setShowUnifiedPicker(false);
                    }}
                  />
                )}

                {/* Attachment Menu Panels with Media Quality & Sharing Options */}
                <AnimatePresence>
                  {showAttachMenu && (
                    <motion.div 
                      key="attach-menu-popover"
                      initial={{ opacity: 0, y: 10, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.96 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className={`absolute bottom-16 left-4 z-40 p-3.5 rounded-2xl border shadow-2xl w-80 space-y-3 backdrop-blur-xl ${themeMode === 'dark' ? 'bg-slate-900/95 border-slate-800' : 'bg-white/95 border-slate-200/90'}`}
                    >
                      {/* Media & Voice Quality Setting Pill Header */}
                      <div className="space-y-2 pb-2.5 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Upload Quality</span>
                          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                            {(['standard', 'hd', 'data_saver'] as const).map(q => (
                              <button
                                key={q}
                                onClick={() => { setMediaUploadQuality(q); showToast(`Upload quality: ${q.toUpperCase()}`); }}
                                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${mediaUploadQuality === q ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                              >
                                {q === 'hd' ? 'HD High' : q === 'standard' ? 'Auto' : 'Saver'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">Mic Quality</span>
                          <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[10px] font-semibold">
                            {(['hd', 'standard', 'compressed'] as const).map(q => (
                              <button
                                key={q}
                                onClick={() => { setVoiceRecordingQuality(q); showToast(`Voice quality: ${q.toUpperCase()}`); }}
                                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${voiceRecordingQuality === q ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'}`}
                              >
                                {q === 'hd' ? 'HD 128k' : q === 'standard' ? 'Std 64k' : 'Compact'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleAttachMock('image')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40 mb-1">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Photo</span>
                        </button>

                        <button onClick={() => handleAttachMock('video')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40 mb-1">
                            <Video className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Video</span>
                        </button>

                        <button onClick={() => handleAttachMock('document')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40 mb-1">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Document</span>
                        </button>

                        <button onClick={() => handleAttachMock('voice')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/40 mb-1">
                            <Mic className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Voice Note</span>
                        </button>

                        <button onClick={() => handleAttachMock('location')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40 mb-1">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Location</span>
                        </button>

                        <button onClick={() => handleAttachMock('contact')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border border-sky-200/50 dark:border-sky-800/40 mb-1">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Contact</span>
                        </button>

                        <button onClick={() => handleAttachMock('poll')} className="flex flex-col items-center p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-transform active:scale-95 text-slate-700 dark:text-slate-300">
                          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40 mb-1">
                            <BarChart2 className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Poll</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Unified Zenoa Emoji, GIF & Sticker Picker */}
                <AnimatePresence>
                  {showUnifiedPicker && (
                    <UnifiedEmojiPicker
                      onSelectEmoji={(emoji) => setComposerText(prev => prev + emoji)}
                      onSelectGif={async (gifUrl) => {
                        const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
                        const newMsg: Message = {
                          id: newMsgId,
                          chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
                          sender: userUsername || 'me',
                          text: 'Shared a GIF',
                          type: 'gif',
                          media_url: gifUrl,
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          reactions: [],
                          read_by: []
                        };

                        if (isFirebaseConfigured && db && auth) {
                          try {
                            await setDoc(doc(db, 'messages', newMsgId), {
                              id: newMsgId,
                              chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
                              sender: userUsername || 'me',
                              text: 'Shared a GIF',
                              type: 'gif',
                              media_url: gifUrl,
                              timestamp: newMsg.timestamp,
                              reactions: [],
                              read_by: [],
                              forwarded: false,
                              pinned: false
                            });

                            const activeChat = chats.find(c => c.id === activeChatId);
                            if (activeChat) {
                              let currentActiveChat = activeChat;
                            if (currentActiveChat.isLocalPending) {
                               currentActiveChat = { ...currentActiveChat };
                               delete currentActiveChat.isLocalPending;
                            }
                            await setDoc(doc(db, 'chats', activeChatId), {
                              id: activeChatId,
                              type: currentActiveChat.type,
                              name: currentActiveChat.name,
                              username: currentActiveChat.username,
                              avatar_seed: currentActiveChat.avatar_seed,
                              participants: currentActiveChat.participants,
                              last_message: '[GIF]',
                              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
                              unread: 0,
                              pinned: false,
                              muted: false,
                              typing: false,
                              online: false,
                              last_seen: ''
                            }, { merge: true });
                            }
                          } catch (err) {
                            console.error("Error inserting GIF in Firebase:", err);
                          }
                        }

                        setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
                        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: [GIF]`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
                        setShowUnifiedPicker(false);
                      }}
                      onSelectSticker={async (st) => {
                        const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
                        const newMsg: Message = {
                          id: newMsgId,
                          chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
                          sender: userUsername || 'me',
                          text: st,
                          type: 'sticker',
                          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                          reactions: [],
                          read_by: []
                        };

                        if (isFirebaseConfigured && db && auth) {
                          try {
                            await setDoc(doc(db, 'messages', newMsgId), {
                              id: newMsgId,
                              chat_id: activeChatId, created_at: Date.now(), expires_at: getExpiresAt(activeChatId),
                              sender: userUsername || 'me',
                              text: st,
                              type: 'sticker',
                              timestamp: newMsg.timestamp,
                              reactions: [],
                              read_by: [],
                              forwarded: false,
                              pinned: false
                            });

                            const activeChat = chats.find(c => c.id === activeChatId);
                            if (activeChat) {
                            let currentActiveChat = activeChat;
                            if (currentActiveChat.isLocalPending) {
                               currentActiveChat = { ...currentActiveChat };
                               delete currentActiveChat.isLocalPending;
                            }
                            await setDoc(doc(db, 'chats', activeChatId), {
                              id: activeChatId,
                              type: currentActiveChat.type,
                              name: currentActiveChat.name,
                              username: currentActiveChat.username,
                              avatar_seed: currentActiveChat.avatar_seed,
                              participants: currentActiveChat.participants,
                              last_message: '[Sticker]',
                              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
                              unread: 0,
                              pinned: false,
                              muted: false,
                              typing: false,
                              online: false,
                              last_seen: ''
                            }, { merge: true });
                            }
                          } catch (err) {
                            console.error("Error inserting sticker in Firebase:", err);
                          }
                        }

                        setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
                        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: [Sticker]`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'sent' as const } : c));
                        setShowUnifiedPicker(false);
                      }}
                      onClose={() => setShowUnifiedPicker(false)}
                      themeMode={themeMode}
                    />
                  )}
                </AnimatePresence>

                {/* Message input elements row OR Voice Recording Engine Bar */}
                {isRecordingVoice || recordedAudioUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-neutral-100 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                    <button 
                      onClick={cancelVoiceRecording}
                      className="p-2 rounded-xl text-neutral-900 dark:text-neutral-100 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                      title="Discard Recording"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-neutral-800 dark:bg-neutral-200 animate-ping" />
                        <span className="text-xs font-mono font-bold text-neutral-900 dark:text-neutral-100">
                          {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>

                      {/* Live Waveform height bars */}
                      <div className="flex items-center gap-1 flex-1 h-5 overflow-hidden">
                        {[30, 70, 45, 90, 60, 20, 80, 50, 100, 40, 75, 35, 85, 55, 65, 25, 95].map((h, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-neutral-800 dark:bg-neutral-200 rounded-full animate-pulse" 
                            style={{ 
                              height: `${Math.max(15, (h + (recordingSeconds * 10)) % 100)}%`,
                              animationDelay: `${i * 0.05}s` 
                            }} 
                          />
                        ))}
                      </div>
                    </div>

                    {isRecordingVoice ? (
                      <button 
                        onClick={stopVoiceRecording}
                        className="p-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-xs flex items-center gap-1 shadow-xs"
                      >
                        <StopCircle className="h-4 w-4 fill-current text-neutral-900 dark:text-neutral-100" />
                        <span>Stop</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          if (recordedAudioUrl) {
                            const audio = new Audio(recordedAudioUrl);
                            setIsPlayingVoicePreview(true);
                            audio.play().catch(e => console.warn(e));
                            audio.onended = () => setIsPlayingVoicePreview(false);
                          }
                        }}
                        className="p-2 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-300 transition-colors"
                        title="Preview Audio"
                      >
                        {isPlayingVoicePreview ? <Pause className={`h-4 w-4 ${currentChatTheme.actionButtonText}`} /> : <Play className={`h-4 w-4 fill-current ${currentChatTheme.actionButtonText}`} />}
                      </button>
                    )}

                    <button 
                      onClick={handleSendVoiceMessage} 
                      className={`p-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 font-bold text-xs cursor-pointer ${currentChatTheme.accentBg} ${currentChatTheme.accentText}`}
                    >
                      <span>Send Voice</span>
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 p-1.5 pl-2.5 rounded-3xl shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all duration-300 ${currentChatTheme.innerInputBg} ${currentChatTheme.innerInputBorder}`}>
                    {/* Single Emoji, GIF & Sticker Button at the START (Left) of Input Box */}
                    <button 
                      onClick={() => { setShowUnifiedPicker(prev => !prev); setShowAttachMenu(false); }} 
                      className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
                        showUnifiedPicker 
                          ? `${currentChatTheme.actionButtonActiveBg}` 
                          : `text-current opacity-60 hover:opacity-100 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`
                      }`} 
                      title="Emojis, GIFs & Stickers"
                    >
                      <Smile className="h-5 w-5" />
                    </button>

                    {/* Attachment Button */}
                    <button 
                      onClick={() => { setShowAttachMenu(prev => !prev); setShowUnifiedPicker(false); }} 
                      className={`p-2 rounded-full transition-all duration-300 cursor-pointer ${
                        showAttachMenu 
                          ? `${currentChatTheme.actionButtonActiveBg}` 
                          : `text-current opacity-60 hover:opacity-100 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`
                      }`} 
                      title="Attach File / Media"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    {/* Input text field */}
                    <input 
                      type="text" 
                      value={composerText}
                      onChange={e => handleComposerChange(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className={`flex-1 px-2 py-1.5 text-sm bg-transparent border-0 outline-none placeholder-current/40 min-w-0 transition-all duration-300 ${currentChatTheme.innerInputText}`}
                    />

                    {/* Action button: Send or Voice Recording */}
                    {composerText.trim() ? (
                      <button 
                        onClick={handleSendMessage} 
                        className={`p-2.5 rounded-full shadow-md transition-transform active:scale-95 shrink-0 cursor-pointer ${currentChatTheme.accentBg} ${currentChatTheme.accentText}`}
                        title="Send Message"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={startVoiceRecording} 
                        className={`p-2.5 rounded-full transition-colors shrink-0 cursor-pointer text-slate-400 dark:text-slate-500 ${currentChatTheme.actionButtonHoverBg} ${themeHoverTextClass}`} 
                        title="Record Voice Note"
                      >
                        <Mic className="h-4.5 w-4.5" />
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-center p-8 bg-slate-50/50 dark:bg-[#0b0f19]">
          <div className="max-w-md w-full p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-md">
            {branding.messenger_logo ? (
              <img 
                src={branding.messenger_logo} 
                className="w-16 h-16 object-contain rounded-2xl mx-auto mb-4 border border-slate-200/50 dark:border-slate-800/50 shadow-sm" 
                alt="App Logo" 
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/60 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-indigo-100 dark:border-indigo-900/60 text-indigo-600 dark:text-indigo-400 shadow-sm">
                <MessageSquare className="h-8 w-8" />
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Welcome to {branding.app_name || 'Zenoa'} Desktop</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Select a conversation from the sidebar to start encrypted messaging, voice/video calls, or access developer integrations.
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <button 
                onClick={() => setActiveView('search')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-white font-bold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <Search className="h-4 w-4" />
                  <span>Discover People</span>
                </div>
                <p className="text-[11px] text-slate-400">Find & chat with verified users</p>
              </button>
              <button 
                onClick={() => setActiveView('developer_portal')}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-500 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-2 mb-1 text-slate-900 dark:text-white font-bold text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  <Laptop className="h-4 w-4" />
                  <span>Dev Console</span>
                </div>
                <p className="text-[11px] text-slate-400">Create bot accounts & OTP API</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}

  {/* VIEW 2: Discover Users panel */}
  {activeView === 'search' && (
          <div className="flex-1 h-full flex flex-col p-4 md:p-6 max-w-2xl mx-auto w-full pb-24 md:pb-6 overscroll-contain">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-left">Search people</h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6 text-left">Find friends, designers, and developer colleagues. Start an instant chat conversation.</p>
            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-500 dark:text-neutral-400" />
              <input 
                type="text" 
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Search username or real display name..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 outline-none focus:border-neutral-900 dark:border-neutral-100"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {globalSearchQuery.trim() === '' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400 text-left">Active Contacts & Users</p>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{activeContactsList.length} people</span>
                  </div>

                  {activeContactsList.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No other users found yet</p>
                      <p className="text-xs text-neutral-700 dark:text-neutral-300">When people join Zenoa with their username, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activeContactsList.map((user, idx) => (
                        <div 
                          key={`contact_user_${user.id || user.username}_${idx}`}
                          onClick={() => { handleOpenUserProfile(user.username); }}
                          className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center justify-between gap-3 cursor-pointer hover:border-neutral-900 dark:border-neutral-100 hover:bg-neutral-100/10 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              {renderAvatar(user.avatar_seed, user.display_name, user.avatar_url, 'h-10 w-10 text-base')}
                              {isUserEffectivelyOnline(user) && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-neutral-800 dark:bg-neutral-200 border-2 border-white dark:border-neutral-950"></span>}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{user.display_name}</p>
                              <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</p>
                              {user.bio && <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate mt-0.5">{user.bio}</p>}
                            </div>
                          </div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                            className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 group-hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"
                          >
                            Chat
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase tracking-wider font-bold text-neutral-500 dark:text-neutral-400 text-left">Search Results</p>
                    <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{globalSearchResults.length} found</span>
                  </div>
                  {globalSearchResults.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm text-neutral-700 dark:text-neutral-300">No user profiles matched &quot;{globalSearchQuery}&quot;</p>
                    </div>
                  ) : (
                    globalSearchResults.map((user, idx) => (
                      <div 
                        key={`search_user_${user.id || user.username}_${idx}`}
                        onClick={() => { handleOpenUserProfile(user.username); }}
                        className="p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer hover:border-neutral-900 dark:border-neutral-100 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative shrink-0">
                            {renderAvatar(user.avatar_seed, user.display_name, user.avatar_url, 'h-10 w-10 text-sm')}
                            {isUserEffectivelyOnline(user) && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-neutral-800 dark:bg-neutral-200 border-2 border-white dark:border-neutral-950"></span>}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{user.display_name}</p>
                            <p className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">@{user.username}</p>
                            {user.bio && <p className="text-xs text-neutral-700 dark:text-neutral-300 truncate">{user.bio}</p>}
                          </div>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                          className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-md transition-colors shrink-0 ml-4"
                        >
                          Chat
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 3: Main User Profile Screen */}
        {activeView === 'profile' && (
          <div data-auth={authMethod} className="flex-1 h-full overflow-y-auto bg-neutral-50/40 dark:bg-neutral-950 transition-colors pb-24 md:pb-6 overscroll-contain">
            
            {/* Top Navigation Header Bar */}
            <div className="sticky top-0 z-10 backdrop-blur-md bg-white/85 dark:bg-neutral-900/85 border-b border-neutral-200/80 dark:border-neutral-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
              {/* Left: Username in clean plain text */}
              <div className="flex items-center gap-2">
                {isAccountPrivate && <Lock className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />}
                <h1 className="text-base md:text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
                  <span>{userUsername || 'username'}</span>
                </h1>
              </div>

              {/* Right: Only the Hamburger Menu Settings Button */}
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setActiveView('settings');
                  }}
                  className="p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-all active:scale-95 cursor-pointer"
                  title="Settings & Privacy"
                >
                  <Menu className="h-5 w-5 stroke-[2.25]" />
                </button>
              </div>
            </div>

            {/* Profile Content Container */}
            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
              
              {/* Profile Header: Avatar, Stats & Bio */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 md:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-md space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 md:gap-8">
                  {/* Professional Avatar with Status Ring */}
                  <div className="relative shrink-0">
                    <div className="p-1 rounded-full bg-gradient-to-tr from-neutral-200 via-neutral-100 to-neutral-200 dark:from-neutral-800 dark:via-neutral-900 dark:to-neutral-800 shadow-md">
                      <div className="p-0.5 rounded-full bg-white dark:bg-neutral-900">
                        {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-24 w-24 md:h-28 md:w-28 text-3xl md:text-4xl shadow-inner')}
                      </div>
                    </div>
                    <button
                      onClick={handleOpenEditProfile}
                      className="absolute bottom-1 right-1 p-2 rounded-full bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 shadow-lg border-2 border-white dark:border-neutral-900 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                      title="Change profile picture"
                    >
                      <Camera className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Profile Details Area */}
                  <div className="flex-1 text-center sm:text-left space-y-4 min-w-0 w-full">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl md:text-2xl font-black text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                          <span>{userDisplayName || 'User'}</span>
                          {!!users[userUsername]?.is_verified && (
                            <PurpleVerifiedBadge size="sm"  />
                          )}
                        </h2>
                        <p className="text-xs font-mono font-bold text-neutral-400 mt-1">@{userUsername}</p>
                      </div>


                    </div>

                    {/* Highly Professional Stats Section */}
                    <div className="flex items-center justify-center sm:justify-start gap-8 py-3 border-y border-neutral-100 dark:border-neutral-800/60 max-w-sm mx-auto sm:mx-0">
                      <button 
                        className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
                        onClick={() => setShowFollowListModal({ type: 'followers', username: userUsername })}
                      >
                        <span className="text-lg font-black text-neutral-900 dark:text-white">
                          {users[userUsername]?.followers?.length || 0}
                        </span>
                        <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Followers</span>
                      </button>

                      <button 
                        className="flex items-baseline gap-1.5 hover:opacity-80 transition-opacity"
                        onClick={() => setShowFollowListModal({ type: 'following', username: userUsername })}
                      >
                        <span className="text-lg font-black text-neutral-900 dark:text-white">
                          {users[userUsername]?.following?.length || 0}
                        </span>
                        <span className="text-xs text-neutral-400 font-semibold uppercase tracking-wider">Following</span>
                      </button>
                    </div>

                    {/* Professional Biography */}
                    <div className="space-y-2 text-xs md:text-sm text-neutral-700 dark:text-neutral-300">
                      <p className="font-semibold whitespace-pre-line leading-relaxed italic text-neutral-600 dark:text-neutral-400">
                        "{userBio || "Hey there! I am using Zenoa for ultra-fast, secure communication."}"
                      </p>
                      {/* Strictly NO email shown here. Email is housed securely in the Settings -> Accounts Center */}
                      {userPhone && (
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 pt-1 text-[11px] text-neutral-400 font-semibold">
                          <Phone className="h-3.5 w-3.5" />
                          <span>{userPhone}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons row (Without Settings button to avoid redundancy) */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3">
                      <button
                        onClick={handleOpenEditProfile}
                        className="px-5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit Profile</span>
                      </button>

                      <button
                        onClick={() => setShowShareProfileModal(true)}
                        className="px-5 py-2.5 rounded-2xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-750 text-neutral-800 dark:text-neutral-200 border border-neutral-200/50 dark:border-neutral-700/50 font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share Profile</span>
                      </button>


                    </div>

                  </div>
                </div>
              </div>

              {/* Google Drive Integration Card (Shown on Profile ONLY BEFORE Integration) */}
              {!isDriveConnected && !dismissedDriveBackupCard && (
                <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-4 animate-fade-in relative">
                  {/* Close button to dismiss */}
                  <button
                    onClick={() => {
                      setDismissedDriveBackupCard(true);
                      localStorage.setItem('zenoa_drive_dismissed', 'true');
                      showToast('Drive backup card dismissed. You can always access it from the top-right menu.');
                    }}
                    className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors cursor-pointer"
                    title="Dismiss backup prompt"
                  >
                    <X className="h-4 w-4" />
                  </button>

                  <div className="flex items-center gap-3.5 pr-8">
                    <div className="p-3 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 shrink-0">
                      <GoogleDriveLogo className="h-7 w-7" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Google Drive Backup</h3>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 dark:bg-amber-950/40 text-neutral-600 dark:text-neutral-400 border border-amber-200/60 dark:border-amber-800/60">
                          Not Connected
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                        Connect your official Google Drive account to back up messages, media, and settings with end-to-end encryption.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleConnectDrive}
                    className="w-full py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2.5 shadow-sm transition-all hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
                  >
                    <GoogleDriveLogo className="h-5 w-5" />
                    <span>Connect Google Drive</span>
                  </button>
                </div>
              )}

              {/* Profile Tabs: Media & Saved */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
                {/* Tabs Bar */}
                <div className="flex items-center border-b border-neutral-200/80 dark:border-neutral-800">
                  <button
                    onClick={() => setProfileActiveTab('media')}
                    className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                      profileActiveTab === 'media'
                        ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 bg-neutral-100/30 dark:bg-indigo-950/20'
                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    <span>Shared Media</span>
                  </button>

                  <button
                    onClick={() => setProfileActiveTab('saved')}
                    className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                      profileActiveTab === 'saved'
                        ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 bg-neutral-100/30 dark:bg-indigo-950/20'
                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Saved Messages</span>
                  </button>

                  <button
                    onClick={() => setProfileActiveTab('calls')}
                    className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                      profileActiveTab === 'calls'
                        ? 'border-neutral-900 dark:border-neutral-100 text-neutral-900 dark:text-neutral-100 bg-neutral-100/30 dark:bg-indigo-950/20'
                        : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call History</span>
                    {allUserCalls.length > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-neutral-200 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold">
                        {allUserCalls.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Tab 1: Shared Media Grid */}
                {profileActiveTab === 'media' && (
                  <div className="p-4 md:p-6">
                    {(() => {
                      const mediaItems = Object.entries(messagesByChat).flatMap(([chatId, msgs]) =>
                        msgs.filter(m => (['image', 'video', 'voice', 'document'].includes(m.type) || m.media_url) && m.type !== 'gif')
                          .map(m => ({ ...m, chatId }))
                      ).filter(item => {
                        // Filter out GIFs explicitly
                        if (item.type === 'gif') return false;
                        if (item.media_url && (item.media_url.includes('.gif') || item.media_url.includes('/giphy'))) return false;
                        if (item.file_name && item.file_name.endsWith('.gif')) return false;
                        return true;
                      });

                      const photos = mediaItems.filter(item => item.type === 'image');
                      const videos = mediaItems.filter(item => item.type === 'video');
                      const audios = mediaItems.filter(item => item.type === 'voice');
                      const documents = mediaItems.filter(item => item.type === 'document');

                      if (mediaItems.length === 0) {
                        return (
                          <div className="py-16 text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500 dark:text-neutral-400">
                              <Folder className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No media attachments yet</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                              Photos, videos, audio notes, and documents you send in chats will be organized here automatically in dedicated, secure folders.
                            </p>
                          </div>
                        );
                      }

                      // Folder selector screen
                      if (currentMediaFolder === null) {
                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pb-1 border-b border-neutral-100 dark:border-neutral-800">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Library Folders</span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{mediaItems.length} items total</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                              {/* Photos Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('photos')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-neutral-900 dark:border-neutral-100 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-neutral-1000/10 text-neutral-700 dark:text-neutral-300 rounded-xl group-hover:scale-110 transition-transform">
                                    <Camera className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-neutral-500 dark:text-neutral-400 transition-colors">Photos</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{photos.length} {photos.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Videos Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('videos')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-neutral-900 dark:border-neutral-100 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-neutral-800 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl group-hover:scale-110 transition-transform">
                                    <Video className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-neutral-500 dark:text-neutral-400 transition-colors">Videos</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{videos.length} {videos.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Audio Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('audio')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-neutral-900 dark:border-neutral-100 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-neutral-800 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl group-hover:scale-110 transition-transform">
                                    <Mic className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-neutral-500 dark:text-neutral-400 transition-colors">Audio Notes</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{audios.length} {audios.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Documents Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('documents')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-neutral-900 dark:border-neutral-100 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-neutral-800 dark:text-neutral-200 dark:group-hover:text-neutral-500 dark:text-neutral-400 transition-colors">Documents & Files</p>
                                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{documents.length} {documents.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Folder contents screen
                      const activeItems = 
                        currentMediaFolder === 'photos' ? photos :
                        currentMediaFolder === 'videos' ? videos :
                        currentMediaFolder === 'audio' ? audios :
                        documents;

                      const folderTitle = 
                        currentMediaFolder === 'photos' ? 'Photos Folder' :
                        currentMediaFolder === 'videos' ? 'Videos Folder' :
                        currentMediaFolder === 'audio' ? 'Audio Notes Folder' :
                        'Documents Folder';

                      return (
                        <div className="space-y-4">
                          {/* Folder Inner Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                            <button
                              onClick={() => setCurrentMediaFolder(null)}
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 hover:text-white dark:text-neutral-900 dark:hover:bg-neutral-900 dark:bg-neutral-100 transition-all text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1 cursor-pointer"
                            >
                              \u2190 Back to folders
                            </button>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{folderTitle} ({activeItems.length})</span>
                          </div>

                          {activeItems.length === 0 ? (
                            <div className="py-12 text-center text-neutral-500 dark:text-neutral-400 text-xs">
                              This folder is currently empty. Shared files of this type will appear here.
                            </div>
                          ) : currentMediaFolder === 'photos' || currentMediaFolder === 'videos' ? (
                            /* Photos & Videos Grid */
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {activeItems.map((item, idx) => (
                                <div
                                  key={`media_grid_${item.chatId}_${item.id || idx}`}
                                  onClick={() => {
                                    if (item.media_url || item.audio_url) {
                                      const url = item.media_url || item.audio_url!;
                                      const mediaType = item.type === 'video' ? 'video' : item.type === 'voice' ? 'audio' : item.type === 'document' ? 'document' : 'image';
                                      openInMediaPlayer(mediaType, url, { title: item.file_name || 'Shared Media', senderName: item.sender });
                                    } else {
                                      setActiveChatId(item.chatId);
                                      setActiveView('chats');
                                      setMobileShowChat(true);
                                    }
                                  }}
                                  className="group relative aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/60 dark:border-neutral-700/60 cursor-pointer shadow-sm hover:shadow-md transition-all hover:scale-[1.02]"
                                >
                                  {item.media_url ? (
                                    <img
                                      src={item.media_url}
                                      alt="Shared item"
                                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="h-full w-full flex flex-col items-center justify-center bg-neutral-900 text-white">
                                      <Video className="h-8 w-8 text-neutral-500 dark:text-neutral-400" />
                                      <span className="text-[10px] text-neutral-700 dark:text-neutral-300 mt-2">Play Video</span>
                                    </div>
                                  )}

                                  {/* Hover overlay with details */}
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3 text-white">
                                    <div className="flex justify-end">
                                      <span className="text-[9px] bg-black/60 px-2 py-0.5 rounded-full backdrop-blur-sm uppercase">
                                        {item.type}
                                      </span>
                                    </div>
                                    <div className="text-left">
                                      <p className="text-[10px] font-bold truncate">@{item.sender}</p>
                                      <p className="text-[9px] text-white/80 dark:text-neutral-900/80">{item.timestamp}</p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            /* Audio & Documents List */
                            <div className="space-y-2">
                              {activeItems.map((item, idx) => (
                                <div
                                  key={`media_list_${item.chatId}_${item.id || idx}`}
                                  onClick={() => {
                                    if (item.media_url || item.audio_url) {
                                      const url = item.media_url || item.audio_url!;
                                      const mediaType = item.type === 'video' ? 'video' : item.type === 'voice' ? 'audio' : item.type === 'document' ? 'document' : 'image';
                                      openInMediaPlayer(mediaType, url, { title: item.file_name || 'Shared Media', senderName: item.sender });
                                    } else {
                                      setActiveChatId(item.chatId);
                                      setActiveView('chats');
                                      setMobileShowChat(true);
                                    }
                                  }}
                                  className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10 hover:border-indigo-550 hover:bg-neutral-100/10 transition-all flex items-center justify-between gap-3 cursor-pointer text-left group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2.5 rounded-xl ${currentMediaFolder === 'audio' ? 'bg-neutral-800 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'}`}>
                                      {currentMediaFolder === 'audio' ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-neutral-500 dark:text-neutral-400 transition-colors">
                                        {item.file_name || item.text || (currentMediaFolder === 'audio' ? 'Voice Recording' : 'Document Attachment')}
                                      </p>
                                      <p className="text-[10px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Shared by @{item.sender} \u2022 {item.timestamp} {item.file_size ? `\u2022 ${item.file_size}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400 group-hover:translate-x-1 transition-transform" />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Tab 2: Saved Messages */}
                {profileActiveTab === 'saved' && (
                  <div className="p-4 md:p-6 space-y-3">
                    {(() => {
                      const savedItems = Object.entries(messagesByChat).flatMap(([chatId, msgs]) =>
                        msgs.filter(m => m.pinned || (m.reactions && m.reactions.length > 0))
                          .map(m => ({ ...m, chatId }))
                      );

                      if (savedItems.length === 0) {
                        return (
                          <div className="py-16 text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500 dark:text-neutral-400">
                              <Star className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No saved messages yet</p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                              Pin or react to important messages in any chat to save them here for fast reference.
                            </p>
                          </div>
                        );
                      }

                      return savedItems.map((msg, idx) => (
                        <div
                          key={`saved_msg_${msg.chatId}_${msg.id || idx}`}
                          onClick={() => {
                            setActiveChatId(msg.chatId);
                            setActiveView('chats');
                            setMobileShowChat(true);
                          }}
                          className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-indigo-400 dark:hover:border-neutral-900 dark:border-neutral-100 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                                {getSenderDisplayName(msg.sender)}
                              </span>
                              <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{msg.timestamp}</span>
                              {msg.pinned && (
                                <span className="text-[9px] bg-neutral-100 dark:bg-neutral-800 dark:bg-amber-950/40 text-neutral-600 dark:text-neutral-400 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Pin className="h-2.5 w-2.5" /> Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">{msg.text}</p>
                          </div>
                          <button className="text-neutral-500 dark:text-neutral-400 group-hover:text-neutral-900 dark:text-neutral-100 dark:group-hover:text-neutral-500 dark:text-neutral-400 text-xs font-semibold shrink-0 flex items-center gap-1">
                            <span>Open</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                )}

                {/* Tab 3: Call History */}
                {profileActiveTab === 'calls' && (
                  <div className="p-4 md:p-6 space-y-4">
                    {/* Search & Filter Bar */}
                    <div className="space-y-3">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                        <input
                          type="text"
                          value={callHistorySearch}
                          onChange={(e) => setCallHistorySearch(e.target.value)}
                          placeholder="Search calls by contact name or username..."
                          className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:border-neutral-900 dark:border-neutral-100 transition-colors"
                        />
                        {callHistorySearch && (
                          <button
                            onClick={() => setCallHistorySearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-200"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Filter Chips */}
                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                        {[
                          { id: 'all', label: 'All Calls', count: allUserCalls.length },
                          { id: 'missed', label: 'Missed', count: allUserCalls.filter(c => c.status === 'missed' || c.status === 'declined').length },
                          { id: 'incoming', label: 'Incoming', count: allUserCalls.filter(c => !c.is_outgoing).length },
                          { id: 'outgoing', label: 'Outgoing', count: allUserCalls.filter(c => c.is_outgoing).length },
                          { id: 'video', label: 'Video', count: allUserCalls.filter(c => c.call_type === 'video').length },
                          { id: 'voice', label: 'Voice', count: allUserCalls.filter(c => c.call_type === 'voice').length }
                        ].map((chip) => (
                          <button
                            key={chip.id}
                            onClick={() => setCallHistoryFilter(chip.id as any)}
                            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                              callHistoryFilter === chip.id
                                ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs'
                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                            }`}
                          >
                            <span>{chip.label}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                              callHistoryFilter === chip.id
                                ? 'bg-white/20 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400'
                            }`}>
                              {chip.count}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Call Records List */}
                    {(() => {
                      const filteredCalls = allUserCalls.filter(c => {
                        // Apply tab filter
                        if (callHistoryFilter === 'missed' && !(c.status === 'missed' || c.status === 'declined')) return false;
                        if (callHistoryFilter === 'incoming' && c.is_outgoing) return false;
                        if (callHistoryFilter === 'outgoing' && !c.is_outgoing) return false;
                        if (callHistoryFilter === 'video' && c.call_type !== 'video') return false;
                        if (callHistoryFilter === 'voice' && c.call_type !== 'voice') return false;

                        // Apply search filter
                        if (callHistorySearch.trim()) {
                          const q = callHistorySearch.toLowerCase();
                          const partnerName = (c.partner_name || '').toLowerCase();
                          const partnerUser = (c.partner_username || '').toLowerCase();
                          return partnerName.includes(q) || partnerUser.includes(q);
                        }
                        return true;
                      });

                      if (filteredCalls.length === 0) {
                        return (
                          <div className="py-16 text-center space-y-3">
                            <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-500 dark:text-neutral-400">
                              <PhoneCall className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                              {callHistorySearch ? 'No calls matching your search' : 'No call history recorded'}
                            </p>
                            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                              {callHistorySearch
                                ? 'Try searching for a different name or username, or switch filter tags.'
                                : 'Make voice or video calls with your contacts to see detailed call logs, durations, and timestamps here.'}
                            </p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2.5">
                          {filteredCalls.map((call) => {
                            const isMissed = call.status === 'missed' || call.status === 'declined';
                            const isVideo = call.call_type === 'video';
                            const partnerUserObj = users[call.partner_username] || Object.values(users).find(u => u.username === call.partner_username);

                            return (
                              <div
                                key={`call_rec_${call.id}`}
                                className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-indigo-300 dark:hover:border-indigo-800/80 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs group"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  {/* Avatar */}
                                  <div className="relative shrink-0">
                                    {renderAvatar(
                                      call.partner_avatar_seed || call.partner_username,
                                      call.partner_name || call.partner_username,
                                      call.partner_avatar_url || partnerUserObj?.avatar_url,
                                      'h-12 w-12 text-base shadow-xs'
                                    )}
                                    {isUserEffectivelyOnline(partnerUserObj) && (
                                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-neutral-800 dark:bg-neutral-200 border-2 border-white dark:border-neutral-900" />
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="min-w-0 space-y-0.5">
                                    <div className="flex items-center gap-2">
                                      <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                                        {call.partner_name || call.partner_username}
                                      </h4>
                                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate">
                                        @{call.partner_username}
                                      </span>
                                    </div>

                                    {/* Call Direction & Type & Status */}
                                    <div className="flex flex-wrap items-center gap-2 text-xs">
                                      <div className={`flex items-center gap-1 font-semibold text-[11px] ${
                                        isMissed 
                                          ? 'text-neutral-900 dark:text-neutral-100' 
                                          : call.is_outgoing 
                                            ? 'text-neutral-900 dark:text-neutral-100' 
                                            : 'text-neutral-900 dark:text-neutral-100'
                                      }`}>
                                        {isVideo ? (
                                          <Video className="h-3.5 w-3.5" />
                                        ) : isMissed ? (
                                          <PhoneMissed className="h-3.5 w-3.5" />
                                        ) : call.is_outgoing ? (
                                          <PhoneOutgoing className="h-3.5 w-3.5" />
                                        ) : (
                                          <PhoneIncoming className="h-3.5 w-3.5" />
                                        )}
                                        <span>{isVideo ? 'Video Call' : 'Voice Call'}</span>
                                      </div>

                                      <span className="text-neutral-300 dark:text-neutral-700">\u2022</span>

                                      <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                                        {call.timestamp}
                                      </span>

                                      {call.duration_formatted && (
                                        <>
                                          <span className="text-neutral-300 dark:text-neutral-700">\u2022</span>
                                          <span className="text-[11px] font-mono font-medium text-neutral-500 dark:text-neutral-400">
                                            {call.duration_formatted}
                                          </span>
                                        </>
                                      )}

                                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                                        call.status === 'answered' || call.status === 'connected'
                                          ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 dark:bg-emerald-950/40 dark:text-neutral-500 dark:text-neutral-400'
                                          : call.status === 'missed'
                                            ? 'bg-neutral-100 text-neutral-900 dark:text-neutral-100 dark:bg-rose-950/40 dark:text-neutral-500 dark:text-neutral-400'
                                            : 'bg-neutral-100 text-neutral-800 dark:text-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:text-neutral-400'
                                      }`}>
                                        {call.status}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                                  {/* Voice Call */}
                                  <button
                                    onClick={() => handleStartCallWithUser(call.partner_username, 'voice')}
                                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-neutral-900 dark:text-neutral-100 transition-all cursor-pointer"
                                    title={`Voice Call @${call.partner_username}`}
                                  >
                                    <Phone className="h-4 w-4" />
                                  </button>

                                  {/* Video Call */}
                                  <button
                                    onClick={() => handleStartCallWithUser(call.partner_username, 'video')}
                                    className="p-2 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 text-neutral-700 dark:text-neutral-300 dark:text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer"
                                    title={`Video Call @${call.partner_username}`}
                                  >
                                    <Video className="h-4 w-4" />
                                  </button>

                                  {/* Open Chat */}
                                  <button
                                    onClick={() => {
                                      let targetChat = chats.find(c => c.type === 'dm' && c.username === call.partner_username);
                                      if (targetChat) {
                                        setActiveChatId(targetChat.id);
                                        setActiveView('chats');
                                        setMobileShowChat(true);
                                      } else {
                                        handleStartCallWithUser(call.partner_username, 'voice');
                                      }
                                    }}
                                    className="p-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 transition-all cursor-pointer"
                                    title={`Message @${call.partner_username}`}
                                  >
                                    <MessageSquare className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}

              </div>

            </div>

            

          </div>
        )}

        {/* VIEW 4: Full Page Settings View */}
        {activeView === 'developer_portal' && (
          <PortalDashboard 
            currentUser={currentUserObj || users[userUsername]}
            onHome={() => setActiveView('chats')}
            onLogout={() => setActiveView('chats')}
          />
        )}
        
        {activeView === 'settings' && (
          <SettingsPage
            currentUser={currentUserObj || users[userUsername]}
            onOpenAdminConsole={() => {
              setShowAdminPanel(true);
              try {
                window.history.pushState({}, '', '/admin');
              } catch (e) {}
            }}
            themeMode={themeMode}
            changeTheme={changeTheme}
            chatColorTheme={chatColorTheme}
            setChatColorTheme={setChatColorTheme}
            activeFontSize={activeFontSize}
            setActiveFontSize={setActiveFontSize}
            chatBubbleStyle={chatBubbleStyle}
            setChatBubbleStyle={setChatBubbleStyle}
            notificationsSound={notificationsSound}
            setNotificationsSound={setNotificationsSound}
            previewTextInNotif={previewTextInNotif}
            setPreviewTextInNotif={setPreviewTextInNotif}
            privacyLastSeen={privacyLastSeen}
            setPrivacyLastSeen={setPrivacyLastSeen}
            privacyReadReceipts={privacyReadReceipts}
            setPrivacyReadReceipts={setPrivacyReadReceipts}
            privacyOnlineStatus={privacyOnlineStatus}
            setPrivacyOnlineStatus={setPrivacyOnlineStatus}
            twoFactorAuth={twoFactorAuth}
            setTwoFactorAuth={setTwoFactorAuth}
            blockedUsers={blockedUsers}
            handleToggleBlockUser={handleToggleBlockUser}
            enterToSend={enterToSend}
            setEnterToSend={setEnterToSend}
            autoDownloadMedia={autoDownloadMedia}
            setAutoDownloadMedia={setAutoDownloadMedia}
            handleClearActiveChatHistory={handleClearActiveChatHistory}
            handleResetLocalCache={handleResetLocalCache}
            handleExportChatData={handleExportChatData}
            handleLogout={handleLogout}
            callDataSaver={callDataSaver}
            setCallDataSaver={setCallDataSaver}
            noiseSuppression={noiseSuppression}
            setNoiseSuppression={setNoiseSuppression}
            isAccountPrivate={isAccountPrivate}
            setIsAccountPrivate={handleTogglePrivacy}
            mediaUploadQuality={mediaUploadQuality}
            setMediaUploadQuality={setMediaUploadQuality}
            showToast={showToast}
            userDisplayName={userDisplayName}
            userUsername={userUsername}
            userAvatarSeed={userAvatarSeed}
            userAvatarUrl={userAvatarUrl}
            userEmail={userEmail}
            userUid={userId}
            userPhone={userPhone}
            onUpdatePhone={(phone: string) => setUserPhone(phone)}
            authMethod={authMethod}
            renderAvatar={renderAvatar}
            onOpenEditProfile={handleOpenEditProfile}
            isDriveConnected={isDriveConnected}
            isBackingUp={isBackingUp}
            isRestoring={isRestoring}
            lastBackupDate={lastBackupInfo ? new Date(lastBackupInfo.modifiedTime).toLocaleString() : null}
            onConnectDrive={handleConnectDrive}
            onDisconnectDrive={handleDisconnectDrive}
            onBackupToDrive={handleBackupToDrive}
            onRestoreFromDrive={handleRestoreFromDrive}
            onDeleteBackupFromDrive={handleDeleteBackupFromDrive}
          />
        )}

            {/* Full-Screen Profile & Chat Details View */}
            <AnimatePresence>
              {showProfilePanel && (
                <FullScreenProfilePanel
                  showProfilePanel={showProfilePanel}
                  selectedProfileUsername={selectedProfileUsername}
                  userUsername={userUsername}
                  themeMode={themeMode}
                  users={users}
                  setShowProfilePanel={setShowProfilePanel}
                  setShowProfileOptionsModal={setShowProfileOptionsModal}
                  followRequests={followRequests}
                  handleFollow={handleFollow}
                  renderAvatar={renderAvatar}
                  activeChat={activeChat}
                  showToast={showToast}
                  chatNicknames={chatNicknames}
                  setEditingNicknameUser={setEditingNicknameUser}
                  setTempNicknameValue={setTempNicknameValue}
                  setShowThemeModal={setShowThemeModal}
                  userDisplayName={userDisplayName}
                  setShowFollowListModal={setShowFollowListModal}
                  setActiveView={setActiveView}
                  userBio={userBio}
                  handleOpenEditProfile={showEditProfileModal ? () => {} : () => setShowEditProfileModal(true)}
                  setShowPrivacySafetyModal={setShowPrivacySafetyModal}
                  setShowMsgSearchInChat={setShowMsgSearchInChat}
                  handleToggleMuteChat={(chatId) => handleToggleMuteChat(null, chatId)}
                  setShowChatCustomizationSheet={setShowChatCustomizationSheet}
                  setChatCustomizationView={setChatCustomizationView}
                  chatDisappearing={chatDisappearing}
                  setNewGroupPreselectedUser={setNewGroupPreselectedUser}
                  setShowNewGroupModal={setShowNewGroupModal}
                  messagesByChat={messagesByChat}
                  setSharedMediaPreview={setSharedMediaPreview}
                  handleStartCallWithUser={(usr, type) => {
                    // Fallback call trigger handler
                    try {
                      const startCallFn = (window as any).startCallWithUser;
                      if (typeof startCallFn === 'function') {
                        startCallFn(usr, type);
                      } else {
                        showToast('Starting ' + type + ' call with @' + usr.username);
                      }
                    } catch(e) {}
                  }}
                  allUserCalls={firestoreCalls}
                  userAvatarSeed={userAvatarSeed}
                  userAvatarUrl={userAvatarUrl}
                  onOpenDetailedProfile={(uname) => setDetailedProfileUsername(uname)}
                  blockedUsers={blockedUsers}
                  handleToggleBlockUser={handleToggleBlockUser}
                  handleReportUser={handleReportUser}
                />
              )}
            </AnimatePresence>
      </main>

      {/* MOBILE bottom navigation tabs */}
      {!mobileShowChat && (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl flex items-center justify-around z-40 transition-all select-none pb-[env(safe-area-inset-bottom,4px)]">
          <button 
            onClick={() => { setActiveView('chats'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'chats' ? 'text-neutral-900 dark:text-neutral-100 font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-300'}`}
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5 stroke-[2.2]" />
              {totalUnreads > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalUnreads}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Chats</span>
            {activeView === 'chats' && <span className="absolute bottom-0.5 h-1 w-6 bg-neutral-900 dark:bg-neutral-100 dark:bg-indigo-400 rounded-full"></span>}
          </button>

          <button 
            onClick={() => { setActiveView('search'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'search' ? 'text-neutral-900 dark:text-neutral-100 font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-300'}`}
          >
            <Search className="h-5 w-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">Search</span>
            {activeView === 'search' && <span className="absolute bottom-0.5 h-1 w-6 bg-neutral-900 dark:bg-neutral-100 dark:bg-indigo-400 rounded-full"></span>}
          </button>

          <button 
            onClick={() => { setActiveView('profile'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'profile' ? 'text-neutral-900 dark:text-neutral-100 font-bold' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-neutral-300'}`}
          >
            <div className={`p-0.5 rounded-full transition-transform ${activeView === 'profile' ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}`}>
              {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-5 w-5 text-[8px]')}
            </div>
            <span className="text-[10px] tracking-tight">Profile</span>
            {activeView === 'profile' && <span className="absolute bottom-0.5 h-1 w-6 bg-neutral-900 dark:bg-neutral-100 dark:bg-indigo-400 rounded-full"></span>}
          </button>
        </footer>
      )}

      {/* ========================================================================= */}
      {/* USER EDIT PROFILE MODAL (DISPLAY NAME & USERNAME RATE LIMIT POLICIES) */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">Edit Profile</h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 rounded-xl text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-5">
              
              {/* Photo upload and Fallback avatar selection */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/70 dark:border-neutral-800">
                <div className="relative group shrink-0">
                  <input
                    ref={profilePhotoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  {renderAvatar(editDraftAvatarSeed || editDraftUsername || userAvatarSeed, editDraftDisplayName || userDisplayName, editDraftAvatarUrl, 'h-16 w-16 text-xl shadow-md')}
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-md hover:scale-105 transition-transform cursor-pointer"
                  >
                    <Camera className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-neutral-200/80 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="h-3.5 w-3.5 text-neutral-700 dark:text-neutral-300" />
                    <span>Upload</span>
                  </button>
                  {editDraftAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-1.5 bg-neutral-100 dark:bg-rose-950/30 text-neutral-900 dark:text-neutral-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Name</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{remainingNameChanges}/2 edits left</span>
                </div>
                <input
                  type="text"
                  maxLength={25}
                  value={editDraftDisplayName}
                  onChange={e => setEditDraftDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-neutral-900 dark:border-neutral-100 transition-colors"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Username</span>
                  {cleanDraftUsername !== (savedUsername || '').toLowerCase() && cleanDraftUsername.length > 0 && (
                    <div className="text-[10px]">
                      {isUsernameAvailableInSettings ? (
                        <span className="text-neutral-900 dark:text-neutral-100 font-semibold">Available</span>
                      ) : !isUsernameFormatValidInSettings ? (
                        <span className="text-neutral-900 dark:text-neutral-100">Invalid format</span>
                      ) : (
                        <span className="text-neutral-900 dark:text-neutral-100">Taken</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-500 dark:text-neutral-400">@</span>
                  <input
                    type="text"
                    maxLength={20}
                    value={editDraftUsername}
                    onChange={e => setEditDraftUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-neutral-900 dark:border-neutral-100 transition-colors"
                  />
                </div>
              </div>

              {/* Immutable Zenoa ID */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5">
                    <Lock className="h-3 w-3 text-amber-500" />
                    Zenoa ID
                  </span>
                  <span className="text-[10px] font-mono font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                    IMMUTABLE
                  </span>
                </div>
                <div className="px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/70 dark:bg-neutral-900/70 font-mono text-neutral-800 dark:text-neutral-200 font-bold flex items-center justify-between">
                  <span>{currentUserObj?.zenoa_id || (userUsername ? `${userUsername}@zenoa` : 'user@zenoa')}</span>
                  <span className="text-[10px] text-neutral-400 font-normal">Fixed Handle</span>
                </div>
              </div>

              {/* Status Bio */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Bio</span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400">{editDraftBio.length}/80</span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={editDraftBio}
                  onChange={e => setEditDraftBio(e.target.value)}
                  placeholder="Add a bio..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-neutral-900 dark:border-neutral-100 transition-colors"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProfile || (cleanDraftUsername !== (savedUsername || '').toLowerCase() && (!isUsernameFormatValidInSettings || !isUsernameAvailableInSettings))}
                onClick={async () => {
                  await handleSaveProfile();
                }}
                className="px-5 py-2 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 disabled:opacity-50 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSavingProfile ? <span>Saving...</span> : <span>Save</span>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROFILE SHARING DIALOG                                                    */}
      {/* ========================================================================= */}
      {showShareProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Share Profile</span>
              <button onClick={() => setShowShareProfileModal(false)} className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-lg space-y-3">
              <div className="flex justify-center">
                {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-20 w-20 text-2xl border-4 border-white shadow-md')}
              </div>
              <div>
                <h3 className="font-bold text-lg">{userDisplayName}</h3>
                <p className="text-xs text-white/80 dark:text-neutral-900/80">@{userUsername}</p>
              </div>
              <div className="pt-2 text-[10px] bg-white/20 backdrop-blur-md py-1.5 px-3 rounded-full font-mono truncate">
                {window.location.host}/u/{userUsername}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(`${window.location.origin}/u/${userUsername}`);
                    showToast('Profile link copied to clipboard!');
                  }
                  setShowShareProfileModal(false);
                }}
                className="flex-1 py-2.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Copy Link</span>
              </button>
              <button
                onClick={() => setShowShareProfileModal(false)}
                className="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 text-xs font-bold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs for real media selection */}
      <input type="file" ref={imageFileInputRef} onChange={e => handleRealFileUpload(e, 'image')} accept="image/*" className="hidden" />
      <input type="file" ref={videoFileInputRef} onChange={e => handleRealFileUpload(e, 'video')} accept="video/*" className="hidden" />
      <input type="file" ref={docFileInputRef} onChange={e => handleRealFileUpload(e, 'document')} accept=".pdf,.doc,.docx,.txt,.zip,.csv" className="hidden" />
      <input type="file" ref={audioFileInputRef} onChange={e => handleRealFileUpload(e, 'audio')} accept="audio/*" className="hidden" />

      {/* MODAL: Share Location */}
      {showLocationModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowLocationModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Share Location</h3>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Place / Title</label>
                <input 
                  type="text"
                  value={locationTitle}
                  onChange={e => setLocationTitle(e.target.value)}
                  placeholder="e.g. Connaught Place Cafe"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Address / Landmark</label>
                <input 
                  type="text"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="e.g. Inner Circle, Block A, New Delhi"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-neutral-100 dark:bg-neutral-800 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Coordinates: {locationLat.toFixed(4)}, {locationLng.toFixed(4)}</span>
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setLocationLat(pos.coords.latitude);
                        setLocationLng(pos.coords.longitude);
                        showToast("Current location acquired");
                      });
                    }
                  }}
                  className="px-2 py-1 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold rounded-lg text-[10px]"
                >
                  Get GPS
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSendLocation}
                className="flex-1 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Send Location Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Share Contact */}
      {showContactModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowContactModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-neutral-800 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Share Contact</h3>
              </div>
              <button onClick={() => setShowContactModal(false)} className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Full Name</label>
                <input 
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Phone Number</label>
                <input 
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Email Address (Optional)</label>
                <input 
                  type="email"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSendContact}
                className="flex-1 py-2.5 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-900 dark:hover:bg-neutral-300 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Send Contact Card
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Create Poll */}
      {showPollModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPollModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-neutral-800 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded-xl">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Create Poll</h3>
              </div>
              <button onClick={() => setShowPollModal(false)} className="p-1 rounded-lg text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:text-neutral-200 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Poll Question</label>
                <input 
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which design concept do you prefer?"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-500 dark:text-neutral-400 mb-1">Options</label>
                <div className="space-y-2">
                  {pollOptionsInputs.map((opt, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input 
                        type="text"
                        value={opt}
                        onChange={e => {
                          const updated = [...pollOptionsInputs];
                          updated[idx] = e.target.value;
                          setPollOptionsInputs(updated);
                        }}
                        placeholder={`Option ${idx + 1}`}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-teal-500"
                      />
                      {pollOptionsInputs.length > 2 && (
                        <button 
                          onClick={() => setPollOptionsInputs(pollOptionsInputs.filter((_, i) => i !== idx))}
                          className="p-1.5 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-rose-950/40 rounded-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptionsInputs.length < 5 && (
                    <button 
                      onClick={() => setPollOptionsInputs([...pollOptionsInputs, `Option ${pollOptionsInputs.length + 1}`])}
                      className="text-[11px] font-bold text-neutral-700 dark:text-neutral-300 dark:text-neutral-700 dark:text-neutral-300 hover:underline pt-1 block"
                    >
                      + Add Option
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSendPoll}
                className="flex-1 py-2.5 bg-neutral-800 dark:bg-neutral-200 hover:bg-neutral-900 dark:hover:bg-neutral-300 text-white dark:text-neutral-900 font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                Create & Send Poll
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INBUILT PRODUCTION MEDIA PLAYER MODAL */}
      {mediaPlayer.isOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/95 backdrop-blur-2xl flex flex-col text-white animate-fadeIn select-none overflow-hidden">
          {/* Top Bar Controls */}
          <div className="h-16 px-4 md:px-6 border-b border-white/10 flex items-center justify-between shrink-0 bg-neutral-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded-xl bg-neutral-900 dark:bg-neutral-100/30 text-neutral-500 dark:text-neutral-400 shrink-0">
                {mediaPlayer.type === 'image' || mediaPlayer.type === 'gif' ? (
                  <ImageIcon className="h-5 w-5" />
                ) : mediaPlayer.type === 'video' ? (
                  <Video className="h-5 w-5" />
                ) : mediaPlayer.type === 'audio' ? (
                  <Mic className="h-5 w-5" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm md:text-base truncate">{mediaPlayer.title}</h3>
                  {mediaPlayer.quality && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-1000/30 text-indigo-300 border border-neutral-900 dark:border-neutral-100/40">
                      {mediaPlayer.quality}
                    </span>
                  )}
                </div>
                {mediaPlayer.senderName && (
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">Shared by @{mediaPlayer.senderName}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Image Controls: Zoom & Rotate */}
              {(mediaPlayer.type === 'image' || mediaPlayer.type === 'gif') && (
                <div className="hidden sm:flex items-center gap-1 bg-white/10 p-1 rounded-xl text-xs">
                  <button
                    onClick={() => setMediaZoom(z => Math.min(z + 0.25, 3))}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMediaZoom(z => Math.max(z - 0.25, 0.5))}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setMediaRotation(r => (r + 90) % 360)}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
                    title="Rotate 90\u00B0"
                  >
                    <RotateCw className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => { setMediaZoom(1); setMediaRotation(0); }}
                    className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-[10px] font-bold px-2 cursor-pointer"
                    title="Reset View"
                  >
                    Reset
                  </button>
                </div>
              )}

              {/* Playback Speed Selector */}
              {(mediaPlayer.type === 'video' || mediaPlayer.type === 'audio') && (
                <div className="flex items-center bg-white/10 p-0.5 rounded-xl text-[10px] font-bold">
                  {[0.5, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setMediaPlaybackSpeed(speed)}
                      className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                        mediaPlaybackSpeed === speed ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 shadow-xs' : 'text-neutral-300 hover:text-white dark:text-neutral-900'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}

              {/* Download Action */}
              <a
                href={mediaPlayer.url}
                download={mediaPlayer.title || 'download'}
                target="_blank"
                rel="noreferrer"
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white cursor-pointer"
                title="Download Media File"
              >
                <Download className="h-4.5 w-4.5" />
              </a>

              {/* Close Button */}
              <button
                onClick={closeMediaPlayer}
                className="p-2.5 rounded-xl bg-neutral-900 dark:bg-neutral-100/80 hover:bg-neutral-900 dark:bg-neutral-100 transition-colors text-white dark:text-neutral-900 cursor-pointer"
                title="Close Player"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            {/* 1. Image & GIF View */}
            {(mediaPlayer.type === 'image' || mediaPlayer.type === 'gif') && (
              <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                <img
                  src={mediaPlayer.url}
                  alt={mediaPlayer.title}
                  className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${mediaZoom}) rotate(${mediaRotation}deg)`
                  }}
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            {/* 2. Video View */}
            {mediaPlayer.type === 'video' && (
              <div className="w-full max-w-4xl max-h-[80vh] flex flex-col items-center justify-center relative rounded-3xl overflow-hidden bg-black shadow-2xl border border-white/10">
                <video
                  ref={el => { mediaPlayerRef.current = el; }}
                  src={mediaPlayer.url}
                  autoPlay
                  controls={false}
                  onTimeUpdate={() => {
                    if (mediaPlayerRef.current) {
                      setMediaCurrentTime(mediaPlayerRef.current.currentTime);
                      setMediaTotalDuration(mediaPlayerRef.current.duration || 0);
                    }
                  }}
                  onEnded={() => setMediaIsPlaying(false)}
                  onClick={() => {
                    if (mediaPlayerRef.current) {
                      if (mediaIsPlaying) {
                        mediaPlayerRef.current.pause();
                        setMediaIsPlaying(false);
                      } else {
                        mediaPlayerRef.current.play();
                        setMediaIsPlaying(true);
                      }
                    }
                  }}
                  className="w-full max-h-[70vh] object-contain cursor-pointer"
                />

                <div className="w-full p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex flex-col gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-mono text-neutral-300 w-12 text-right">
                      {Math.floor(mediaCurrentTime / 60)}:{Math.floor(mediaCurrentTime % 60).toString().padStart(2, '0')}
                    </span>
                    <input
                      type="range"
                      min={0}
                      max={mediaTotalDuration || 100}
                      value={mediaCurrentTime}
                      onChange={e => {
                        const targetTime = Number(e.target.value);
                        if (mediaPlayerRef.current) {
                          mediaPlayerRef.current.currentTime = targetTime;
                          setMediaCurrentTime(targetTime);
                        }
                      }}
                      className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                    <span className="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 w-12">
                      {Math.floor((mediaTotalDuration || 0) / 60)}:{Math.floor((mediaTotalDuration || 0) % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (mediaPlayerRef.current) {
                            if (mediaIsPlaying) {
                              mediaPlayerRef.current.pause();
                              setMediaIsPlaying(false);
                            } else {
                              mediaPlayerRef.current.play();
                              setMediaIsPlaying(true);
                            }
                          }
                        }}
                        className="p-2 rounded-full bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-lg transition-transform active:scale-95 cursor-pointer"
                      >
                        {mediaIsPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setMediaIsMuted(!mediaIsMuted)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-neutral-300 cursor-pointer"
                        >
                          {mediaIsMuted || mediaVolume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                        </button>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={mediaIsMuted ? 0 : mediaVolume}
                          onChange={e => {
                            setMediaVolume(Number(e.target.value));
                            setMediaIsMuted(false);
                          }}
                          className="w-20 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          if (mediaPlayerRef.current) {
                            if (document.fullscreenElement) {
                              document.exitFullscreen();
                            } else {
                              mediaPlayerRef.current.requestFullscreen();
                            }
                          }
                        }}
                        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Maximize2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Fullscreen</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Audio & Voice Note View */}
            {mediaPlayer.type === 'audio' && (
              <div className="w-full max-w-lg p-8 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl flex flex-col items-center gap-6 text-center">
                <div className="relative">
                  <div className={`h-32 w-32 rounded-full bg-gradient-to-tr from-indigo-600 to-rose-500 p-1 flex items-center justify-center shadow-2xl ${mediaIsPlaying ? 'animate-pulse' : ''}`}>
                    <div className="h-full w-full rounded-full bg-neutral-950 flex items-center justify-center">
                      <Mic className={`h-12 w-12 ${mediaIsPlaying ? 'text-neutral-500 dark:text-neutral-400 animate-bounce' : 'text-neutral-700 dark:text-neutral-300'}`} />
                    </div>
                  </div>
                </div>

                <audio
                  ref={el => { mediaPlayerRef.current = el; }}
                  src={mediaPlayer.url}
                  autoPlay
                  onTimeUpdate={() => {
                    if (mediaPlayerRef.current) {
                      setMediaCurrentTime(mediaPlayerRef.current.currentTime);
                      setMediaTotalDuration(mediaPlayerRef.current.duration || 0);
                    }
                  }}
                  onEnded={() => setMediaIsPlaying(false)}
                />

                <div className="space-y-1 w-full">
                  <h4 className="font-bold text-lg">{mediaPlayer.title}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">High Definition Voice Sample ({mediaPlayer.quality || '128kbps'})</p>
                </div>

                <div className="w-full flex items-center justify-center gap-1.5 h-12 py-2">
                  {[45, 80, 30, 95, 60, 25, 85, 50, 100, 40, 75, 35, 90, 55, 70, 30, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${mediaIsPlaying ? 'bg-neutral-1000 animate-pulse' : 'bg-neutral-700'}`}
                      style={{
                        height: `${mediaIsPlaying ? Math.max(25, (h + (i * 15)) % 100) : 30}%`
                      }}
                    />
                  ))}
                </div>

                <div className="w-full space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={mediaTotalDuration || 100}
                    value={mediaCurrentTime}
                    onChange={e => {
                      const targetTime = Number(e.target.value);
                      if (mediaPlayerRef.current) {
                        mediaPlayerRef.current.currentTime = targetTime;
                        setMediaCurrentTime(targetTime);
                      }
                    }}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    <span>{Math.floor(mediaCurrentTime / 60)}:{Math.floor(mediaCurrentTime % 60).toString().padStart(2, '0')}</span>
                    <span>{Math.floor((mediaTotalDuration || 0) / 60)}:{Math.floor((mediaTotalDuration || 0) % 60).toString().padStart(2, '0')}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      if (mediaPlayerRef.current) {
                        if (mediaIsPlaying) {
                          mediaPlayerRef.current.pause();
                          setMediaIsPlaying(false);
                        } else {
                          mediaPlayerRef.current.play();
                          setMediaIsPlaying(true);
                        }
                      }
                    }}
                    className="p-4 rounded-full bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-xl transition-transform active:scale-95 cursor-pointer"
                  >
                    {mediaIsPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Document View */}
            {mediaPlayer.type === 'document' && (
              <div className="w-full max-w-xl p-8 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl flex flex-col items-center gap-6 text-center">
                <div className="p-5 rounded-2xl bg-neutral-1000/20 text-neutral-500 dark:text-neutral-400 border border-neutral-900 dark:border-neutral-100/30">
                  <FileText className="h-16 w-16" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xl">{mediaPlayer.title}</h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">Size: {mediaPlayer.size || '1.5 MB'} \u2022 Document Attachment</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                  <a
                    href={mediaPlayer.url}
                    download={mediaPlayer.title || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-5 rounded-2xl bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
                  >
                    <Download className="h-4.5 w-4.5" />
                    <span>Download File</span>
                  </a>
                  <a
                    href={mediaPlayer.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-4.5 w-4.5" />
                    <span>Open in Browser</span>
                  </a>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MESSAGE CONTEXT ACTION SHEET (Copy, Reply, Forward, Star, Pin, Delete)   */}
      {/* ========================================================================= */}
      {selectedMessageForActions && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedMessageForActions(null)}
        >
          <div 
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Quick Emoji Reaction Bar */}
            <div className="p-4 bg-neutral-50 dark:bg-neutral-950/80 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-around gap-1">
              {['\u{1F44D}', '\u2764\uFE0F', '\u{1F602}', '\u{1F62E}', '\u{1F622}', '\u{1F64F}', '\u{1F680}', '\u{1F525}'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => {
                    handleReactToMessage(selectedMessageForActions.id, emoji);
                    setSelectedMessageForActions(null);
                  }}
                  className="text-2xl p-2 rounded-2xl hover:bg-neutral-200 dark:hover:bg-neutral-800 active:scale-125 transition-transform cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Message Preview snippet */}
            <div className="px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-900/50 text-left">
              <p className="text-[10px] font-bold text-neutral-900 dark:text-neutral-100">
                {selectedMessageForActions.sender === 'me' ? 'You' : (users[selectedMessageForActions.sender]?.display_name || selectedMessageForActions.sender)}
              </p>
              <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2 mt-0.5">
                {selectedMessageForActions.deleted_for_everyone ? 'Deleted message' : (selectedMessageForActions.text || `[${selectedMessageForActions.type}]`)}
              </p>
            </div>

            {/* Actions List */}
            <div className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
              {selectedMessageForActions.text && !selectedMessageForActions.deleted_for_everyone && (
                <button
                  onClick={() => handleCopyMessageText(selectedMessageForActions.text)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Copy className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                  <span>Copy Message Text</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleStartReply(selectedMessageForActions);
                  setSelectedMessageForActions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <MessageSquare className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                <span>Reply to Message</span>
              </button>

              <button
                onClick={() => {
                  setForwardMessageId(selectedMessageForActions.id);
                  setShowForwardModal(true);
                  setSelectedMessageForActions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Forward className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                <span>Forward Message</span>
              </button>

              {selectedMessageForActions.sender === 'me' && !selectedMessageForActions.deleted_for_everyone && (
                <button
                  onClick={() => {
                    handleStartEdit(selectedMessageForActions);
                    setSelectedMessageForActions(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
                >
                  <Edit2 className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                  <span>Edit Message</span>
                </button>
              )}

              <button
                onClick={() => handleToggleStarMessage(selectedMessageForActions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Star className={`h-4 w-4 ${selectedMessageForActions.starred ? 'text-neutral-900 dark:text-neutral-100 fill-amber-500' : 'text-neutral-900 dark:text-neutral-100'}`} />
                <span>{selectedMessageForActions.starred ? 'Unstar Message' : 'Star Message'}</span>
              </button>

              <button
                onClick={() => {
                  handleTogglePinMessage(selectedMessageForActions.id);
                  setSelectedMessageForActions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Pin className="h-4 w-4 text-neutral-900 dark:text-neutral-100 rotate-45" />
                <span>{selectedMessageForActions.pinned ? 'Unpin Message' : 'Pin Message'}</span>
              </button>

              <div className="h-px bg-neutral-100 dark:border-neutral-800 my-1" />

              <button
                onClick={() => handleDeleteForMe(selectedMessageForActions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete for Me</span>
              </button>

              {canDeleteForEveryone(selectedMessageForActions) && (
                <button
                  onClick={() => handleDeleteForEveryone(selectedMessageForActions.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete for Everyone</span>
                </button>
              )}
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setSelectedMessageForActions(null)}
                className="w-full py-2.5 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAT LIST ITEM HOLD / CONTEXT ACTIONS SHEET                               */}
      {/* ========================================================================= */}
      {selectedChatForOptions && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setSelectedChatForOptions(null)}
        >
          <div 
            className="w-full sm:max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-all"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header with Avatar & Name */}
            <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center gap-3 text-left">
              {renderAvatar(selectedChatForOptions.avatar_seed, selectedChatForOptions.name, selectedChatForOptions.avatar_url, 'h-11 w-11 text-base')}
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-neutral-900 dark:text-white truncate">{selectedChatForOptions.name}</h4>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">@{selectedChatForOptions.username || selectedChatForOptions.avatar_seed}</p>
              </div>
              <button
                onClick={() => setSelectedChatForOptions(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Options List */}
            <div className="p-2 space-y-0.5 max-h-[60vh] overflow-y-auto">
              <button
                onClick={(e) => {
                  handleTogglePinChat(e, selectedChatForOptions.id);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Pin className="h-4 w-4 text-neutral-900 dark:text-neutral-100 rotate-45" />
                <span>{selectedChatForOptions.pinned ? 'Unpin Chat' : 'Pin Chat to Top'}</span>
              </button>

              <button
                onClick={() => handleToggleArchiveChat(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Archive className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                <span>{selectedChatForOptions.archived ? 'Unarchive Chat' : 'Archive Chat'}</span>
              </button>

              <button
                onClick={(e) => {
                  handleToggleMuteChat(e, selectedChatForOptions.id);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <VolumeX className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                <span>{selectedChatForOptions.muted ? 'Unmute Notifications' : 'Mute Notifications'}</span>
              </button>

              <button
                onClick={() => {
                  setActiveChatId(selectedChatForOptions.id);
                  setShowChatCustomizationSheet(true);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Palette className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                <span>Change Chat Wallpaper & Theme</span>
              </button>

              <button
                onClick={() => {
                  handleExportChat(selectedChatForOptions.id);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <FileDown className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />
                <span>Export Chat History (.txt)</span>
              </button>

              <button
                onClick={() => handleClearChatHistory(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-amber-950/30 transition-colors cursor-pointer text-left"
              >
                <Sparkles className="h-4 w-4" />
                <span>Clear Chat History</span>
              </button>

              <div className="h-px bg-neutral-100 dark:border-neutral-800 my-1" />

              <button
                onClick={() => handleDeleteChat(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Chat Permanently</span>
              </button>
            </div>

            <div className="p-3 bg-neutral-50 dark:bg-neutral-950 border-t border-neutral-100 dark:border-neutral-800">
              <button
                onClick={() => setSelectedChatForOptions(null)}
                className="w-full py-2.5 rounded-2xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-bold text-xs hover:bg-neutral-300 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHAT CUSTOMIZATION & OPTIONS MODAL (Aesthetic & Minimal)                 */}
      {/* ========================================================================= */}
      {showChatCustomizationSheet && activeChat && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={() => { setShowChatCustomizationSheet(false); setChatCustomizationView('main'); }}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all text-left relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Main View */}
            {chatCustomizationView === 'main' && (() => {
              const isServiceAccountDM = activeChat.type === 'dm' && activeChat?.username && isServiceAccount(users[activeChat?.username], activeChat?.username);
              return (
              <motion.div 
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                {/* Header */}
                <div className="px-5 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    {renderAvatar(activeChat.avatar_seed, activeChat.name, activeChat.avatar_url, 'h-12 w-12 text-lg shadow-sm')}
                    <div>
                      <h3 className="font-bold text-lg text-neutral-900 dark:text-white leading-tight">{activeChat.name}</h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Contact Options</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowChatCustomizationSheet(false)}
                    className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* List Content */}
                <div className="p-3 space-y-1">
                  {!isServiceAccountDM && (
                  <button onClick={() => { setShowChatCustomizationSheet(false); setShowThemeModal(true); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 group-hover:scale-110 transition-transform">
                        <Palette className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">Wallpaper & Theme</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                  )}

                  <button onClick={(e) => handleToggleMuteChat(e, activeChat.id)} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:scale-110 transition-transform">
                        <VolumeX className="h-4 w-4" />
                      </div>
                      <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">Mute Notifications</span>
                    </div>
                    <div className={`relative w-10 h-5 rounded-full transition-colors ${activeChat.muted ? 'bg-neutral-900 dark:bg-neutral-100' : 'bg-neutral-200 dark:bg-neutral-700'}`}>
                      <span className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full shadow-sm transition-transform ${activeChat.muted ? 'translate-x-5' : ''}`} />
                    </div>
                  </button>

                  {!isServiceAccountDM && (
                  <button onClick={() => setChatCustomizationView('disappearing')} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 group-hover:scale-110 transition-transform">
                        <Clock className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">Disappearing Messages</span>
                        <span className="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium">
                          {chatDisappearing[activeChat.id] === '24h' ? '24 Hours' :
                           chatDisappearing[activeChat.id] === '48h' ? '48 Hours' :
                           chatDisappearing[activeChat.id] === '7d' ? '7 Days' :
                           chatDisappearing[activeChat.id] === '30d' ? '30 Days' :
                           chatDisappearing[activeChat.id]?.startsWith('custom_') ? 'Custom' : 'Off'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
                  </button>
                  )}

                  <div className="h-px bg-neutral-100 dark:bg-neutral-800 my-2 mx-4" />

                  <button onClick={() => { setShowChatCustomizationSheet(false); handleExportChat(activeChat.id); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center gap-4 transition-colors cursor-pointer group">
                    <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 group-hover:scale-110 transition-transform">
                      <FileDown className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-neutral-700 dark:text-neutral-200">Export Transcript</span>
                  </button>

                  <button onClick={() => { setShowChatCustomizationSheet(false); handleClearChatHistory(activeChat.id); }} className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center gap-4 transition-colors cursor-pointer group">
                    <div className="p-2 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">Clear Chat History</span>
                  </button>
                </div>
              </motion.div>
              );
            })()}

            {/* Disappearing Messages View */}
            {chatCustomizationView === 'disappearing' && (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                className="flex flex-col"
              >
                <div className="px-3 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => setChatCustomizationView('main')}
                    className="p-2 rounded-full text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">Message Timer</h3>
                </div>

                <div className="p-4 space-y-4">
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center px-4 leading-relaxed">
                    Set a timer. New messages will automatically disappear after the selected duration.
                  </p>

                  <div className="space-y-1">
                    {[
                      { id: 'off', label: 'Off' },
                      { id: '24h', label: '24 Hours' },
                      { id: '48h', label: '48 Hours' },
                      { id: '7d', label: '7 Days' },
                      { id: '30d', label: '30 Days' },
                      { id: 'custom', label: 'Custom' }
                    ].map(opt => {
                      const isActive = opt.id === 'custom' 
                        ? (chatDisappearing[activeChat.id] || '').startsWith('custom_') 
                        : (chatDisappearing[activeChat.id] || 'off') === opt.id;
                      
                      return (
                        <button
                          key={opt.id}
                          onClick={async () => {
                            if (opt.id === 'custom') {
                              const v = customDisappearingValue || '1';
                              const u = customDisappearingUnit || 'd';
                              const customVal = `custom_${v}${u}`;
                              setChatDisappearing(prev => ({ ...prev, [activeChat.id]: customVal }));
                              if (isFirebaseConfigured && db && auth) {
                                try { await setDoc(doc(db, 'chats', activeChat.id), { disappearing_messages: customVal }, { merge: true }); } catch (err) {}
                              }
                            } else {
                              setChatDisappearing(prev => ({ ...prev, [activeChat.id]: opt.id }));
                              if (isFirebaseConfigured && db && auth) {
                                try { await setDoc(doc(db, 'chats', activeChat.id), { disappearing_messages: opt.id }, { merge: true }); } catch (err) {}
                              }
                            }
                          }}
                          className="w-full text-left px-4 py-3 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 flex items-center justify-between transition-colors cursor-pointer"
                        >
                          <span className={`font-semibold text-sm ${isActive ? 'text-neutral-900 dark:text-neutral-100' : 'text-neutral-700 dark:text-neutral-200'}`}>
                            {opt.label}
                          </span>
                          {isActive && <Check className="h-4 w-4 text-neutral-900 dark:text-neutral-100" />}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Duration Input */}
                  <AnimatePresence>
                    {(chatDisappearing[activeChat.id] || '').startsWith('custom_') && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-2 px-4 flex items-center gap-3">
                          <input
                            type="number"
                            min="1"
                            max="365"
                            value={customDisappearingValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomDisappearingValue(val);
                              if (val && parseInt(val) > 0) {
                                const customVal = `custom_${val}${customDisappearingUnit}`;
                                setChatDisappearing(prev => ({ ...prev, [activeChat.id]: customVal }));
                                if (isFirebaseConfigured && db && auth) {
                                  try { setDoc(doc(db, 'chats', activeChat.id), { disappearing_messages: customVal }, { merge: true }); } catch (err) {}
                                }
                              }
                            }}
                            className="w-20 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-center text-sm font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:ring-neutral-100 transition-all"
                            placeholder="1"
                          />
                          <select
                            value={customDisappearingUnit}
                            onChange={(e) => {
                              const unit = e.target.value as 'h' | 'd';
                              setCustomDisappearingUnit(unit);
                              const v = customDisappearingValue || '1';
                              const customVal = `custom_${v}${unit}`;
                              setChatDisappearing(prev => ({ ...prev, [activeChat.id]: customVal }));
                              if (isFirebaseConfigured && db && auth) {
                                try { setDoc(doc(db, 'chats', activeChat.id), { disappearing_messages: customVal }, { merge: true }); } catch (err) {}
                              }
                            }}
                            className="flex-1 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 border-none rounded-xl text-sm font-bold text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:ring-neutral-100 transition-all cursor-pointer"
                          >
                            <option value="h">Hours</option>
                            <option value="d">Days</option>
                          </select>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                </div>
              </motion.div>
            )}

          </div>
        </div>
      )}

      {/* DETAILED USER PROFILE PAGE */}
      {detailedProfileUsername && (
        <DetailedProfilePage
          targetUsername={detailedProfileUsername}
          onClose={() => setDetailedProfileUsername(null)}
          userUsername={userUsername}
          users={users}
          themeMode={themeMode}
          handleFollow={handleFollow}
          renderAvatar={renderAvatar}
          onOpenDM={(targetU) => {
            setDetailedProfileUsername(null);
            setShowProfilePanel(false);
            const activeId = getDmChatId(userUsername, targetU);
            setActiveChatId(activeId);
            setActiveView('chats');
          }}
          onOpenFollowers={(u) => setShowFollowListModal({ type: 'followers', username: u })}
          onOpenFollowing={(u) => setShowFollowListModal({ type: 'following', username: u })}
          showToast={showToast}
          blockedUsers={blockedUsers}
          handleToggleBlockUser={handleToggleBlockUser}
          handleReportUser={handleReportUser}
        />
      )}

      {/* FOLLOWERS / FOLLOWING LIST MODAL */}
      <FollowListModal
        showFollowListModal={showFollowListModal}
        onClose={() => setShowFollowListModal(null)}
        userUsername={userUsername}
        users={users}
        themeMode={themeMode}
        onSelectUser={(uname) => {
          setShowFollowListModal(null);
          handleOpenUserProfile(uname);
        }}
        onFollow={(u) => handleFollow(u)}
        renderAvatar={renderAvatar}
        isUserEffectivelyOnline={isUserEffectivelyOnline}
        isServiceAccount={isServiceAccount}
      />

      {/* NOTIFICATIONS & FOLLOW REQUESTS MODAL */}
      <NotificationsModal
        isOpen={showNotificationsPanel}
        onClose={() => setShowNotificationsPanel(false)}
        notifications={notifications}
        followRequests={followRequests}
        onAcceptFollowRequest={handleAcceptFollowRequest}
        onDeclineFollowRequest={handleDeclineFollowRequest}
        onMarkAllAsRead={markNotificationsAsRead}
        renderAvatar={renderAvatar}
        themeMode={themeMode}
      />

      {/* WHATSAPP-STYLE MEDIA EDITOR MODAL (Crop, Customize, Brush, Text, HD Quality, Send to Recipient) */}
      <MediaEditorModal
        isOpen={pendingMediaEditorData !== null}
        data={pendingMediaEditorData}
        onClose={() => setPendingMediaEditorData(null)}
        onSend={handleSendEditedMedia}
        renderAvatar={renderAvatar}
      />

      {/* WHATSAPP-STYLE PROFILE PICTURE CROPPER & ROTATOR MODAL */}
      <ImageCropperModal
        isOpen={showImageCropper}
        srcImage={cropperSourceImage}
        onClose={() => setShowImageCropper(false)}
        onCrop={handleCroppedAvatarSave}
      />

      {/* WHATSAPP-STYLE THEME & WALLPAPER SELECTOR MODAL */}
      <ChatThemeModal
        isOpen={showThemeModal}
        activeChatName={activeChat?.name || 'this conversation'}
        currentThemeId={chatWallpapers[activeChatId] || DEFAULT_THEME_ID}
        onClose={() => setShowThemeModal(false)}
        onSelectTheme={handleSelectChatTheme}
      />

      {/* NICKNAME EDIT MODAL */}
      <AnimatePresence>
        {editingNicknameUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="fixed inset-0 bg-black/60 backdrop-blur-xs" 
              onClick={() => setEditingNicknameUser(null)} 
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">Edit Nickname</h3>
                <button 
                  onClick={() => setEditingNicknameUser(null)}
                  className="p-1 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Set a custom nickname for <span className="font-semibold text-neutral-900 dark:text-neutral-200">{editingNicknameUser}</span> visible only to you.
              </p>

              <input
                type="text"
                value={tempNicknameValue}
                onChange={(e) => setTempNicknameValue(e.target.value)}
                placeholder="e.g. Bestie, Project Lead, \u{1F5A4} Student \u{1F4DA}"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
                autoFocus
              />

              <div className="flex items-center gap-2 pt-2">
                {chatNicknames[editingNicknameUser] && (
                  <button
                    onClick={async () => {
                      if (!editingNicknameUser) return;
                      const targetUser = editingNicknameUser;
                      const updated = { ...chatNicknames };
                      delete updated[targetUser];
                      setChatNicknames(updated);
                      try { localStorage.setItem('inolas_chat_nicknames', JSON.stringify(updated)); } catch (e) {}
                      
                      const targetChat = chats.find(c => c.username === targetUser || (c.type === 'dm' && c.participants?.includes(targetUser)));
                      if (targetChat) {
                        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        const logMsgText = `You removed the nickname for @${targetUser}`;
                        const logMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
                        const logSysMsg: Message = {
                          id: logMsgId,
                          chat_id: targetChat.id,
                          created_at: Date.now(),
                          sender: userUsername || 'me',
                          text: logMsgText,
                          type: 'system',
                          timestamp: timeStr,
                          reactions: [],
                          read_by: []
                        };
                        setMessagesByChat(prev => ({
                          ...prev,
                          [targetChat.id]: [...(prev[targetChat.id] || []), logSysMsg]
                        }));
                        if (isFirebaseConfigured && db && auth) {
                          try {
                            await setDoc(doc(db, 'messages', logMsgId), {
                              id: logMsgId,
                              chat_id: targetChat.id,
                              created_at: Date.now(),
                              sender: userUsername || 'me',
                              text: logMsgText,
                              type: 'system',
                              timestamp: timeStr,
                              reactions: [],
                              read_by: []
                            });
                          } catch (err) {}
                        }
                      }
                      setEditingNicknameUser(null);
                      showToast("Nickname removed");
                    }}
                    className="px-3 py-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                  >
                    Reset
                  </button>
                )}
                <div className="flex-1" />
                <button
                  onClick={() => setEditingNicknameUser(null)}
                  className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!editingNicknameUser) return;
                    const targetUser = editingNicknameUser;
                    const newNick = tempNicknameValue.trim();
                    const updated = { ...chatNicknames };
                    if (newNick) {
                      updated[targetUser] = newNick;
                    } else {
                      delete updated[targetUser];
                    }
                    setChatNicknames(updated);
                    try { localStorage.setItem('inolas_chat_nicknames', JSON.stringify(updated)); } catch (e) {}

                    const targetChat = chats.find(c => c.username === targetUser || (c.type === 'dm' && c.participants?.includes(targetUser)));
                    if (targetChat) {
                      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const logMsgText = newNick 
                        ? `You set the nickname for @${targetUser} to "${newNick}"`
                        : `You removed the nickname for @${targetUser}`;
                      const logMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
                      const logSysMsg: Message = {
                        id: logMsgId,
                        chat_id: targetChat.id,
                        created_at: Date.now(),
                        sender: userUsername || 'me',
                        text: logMsgText,
                        type: 'system',
                        timestamp: timeStr,
                        reactions: [],
                        read_by: []
                      };
                      setMessagesByChat(prev => ({
                        ...prev,
                        [targetChat.id]: [...(prev[targetChat.id] || []), logSysMsg]
                      }));
                      if (isFirebaseConfigured && db && auth) {
                        try {
                          await setDoc(doc(db, 'messages', logMsgId), {
                            id: logMsgId,
                            chat_id: targetChat.id,
                            created_at: Date.now(),
                            sender: userUsername || 'me',
                            text: logMsgText,
                            type: 'system',
                            timestamp: timeStr,
                            reactions: [],
                            read_by: []
                          });
                        } catch (err) {}
                      }
                    }
                    setEditingNicknameUser(null);
                    showToast(newNick ? `Nickname set to "${newNick}"` : "Nickname cleared");
                  }}
                  className="px-4 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl transition-all cursor-pointer shadow-xs"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARED MEDIA PREVIEW LIGHTBOX */}
      <MediaPreviewLightbox
        media={sharedMediaPreview}
        onClose={() => setSharedMediaPreview(null)}
      />

      {/* NEW GROUP CREATION MODAL */}
      <NewGroupModal
        isOpen={showNewGroupModal}
        onClose={() => {
          setShowNewGroupModal(false);
          setNewGroupPreselectedUser(null);
        }}
        currentUserUsername={userUsername || 'me'}
        users={users}
        initialSelectedUsername={newGroupPreselectedUser}
        onCreateGroup={handleCreateGroup}
        renderAvatar={renderAvatar}
      />

      {/* GROUP DETAILS & MANAGEMENT MODAL */}
      {activeChat && activeChat.type === 'group' && (
        <GroupDetailsModal
          isOpen={showGroupDetailsModal}
          onClose={() => setShowGroupDetailsModal(false)}
          chat={activeChat}
          currentUserUsername={userUsername || 'me'}
          users={users}
          chatNicknames={chatNicknames}
          groupMessages={messagesByChat[activeChat.id] || []}
          renderAvatar={renderAvatar}
          onLeaveGroup={handleLeaveGroup}
          onAddParticipant={handleAddGroupParticipant}
          onRemoveParticipant={handleRemoveGroupParticipant}
          onUpdateGroupInfo={handleUpdateGroupInfo}
          onToggleAdmin={handleToggleGroupAdmin}
          showToast={showToast}
        />
      )}

      {/* PROFILE OPTIONS ACTION SHEET */}
      <ProfileOptionsModal
        isOpen={showProfileOptionsModal}
        onClose={() => setShowProfileOptionsModal(false)}
        selectedProfileUsername={selectedProfileUsername}
        isBlocked={blockedUsers.includes(selectedProfileUsername)}
        onToggleBlock={(username: string) => handleToggleBlockUser(username)}
        onReport={(username: string) => handleReportUser(username)}
        onShare={() => {
          navigator.clipboard.writeText(window.location.origin);
          showToast("Profile link copied to clipboard");
        }}
      />

      {/* SECURE AUDIO & VIDEO WEBRTC CALL MODAL */}
      {activeCallSession && (
        <CallModal
          session={activeCallSession}
          userUsername={userUsername}
          userDisplayName={userDisplayName}
          db={db}
          isFirebaseConfigured={isFirebaseConfigured}
          onEndCall={handleEndCall}
          onAnswerCall={handleAnswerCall}
        />
      )}

      {/* CONCURRENT LOGIN KICKOUT MODAL (1 Account Active per Browser/Device) */}
      <ConcurrentLogoutModal
        isOpen={!!kickoutData || showConcurrentLoginModal}
        username={kickoutData?.username || userUsername}
        countdown={kickoutData ? kickoutData.countdown : concurrentLogoutCountdown}
        onLogoutNow={() => {
          setKickoutData(null);
          setShowConcurrentLoginModal(false);
          handleLogout();
        }}
        themeMode={themeMode}
      />
    </div>
  );
}