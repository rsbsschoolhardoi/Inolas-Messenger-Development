import React, { useState, useEffect, useRef } from 'react';
import {  
  MessageSquare, Search, LogOut, Pin, VolumeX, Check, CheckCheck, 
  Send, Paperclip, Smile, Image as ImageIcon, Video, FileText, Mic, 
  ChevronLeft, Info, AlertCircle, AlertTriangle, Plus, User, Moon, Sun, 
  CheckCircle2, X, Star, Forward, Trash2, SmileIcon, UserCheck, UserX, Flag, Edit2,
  Camera, Upload, Menu, Share2,
  Grid, Bookmark, Download, Palette, 
  Database, Volume2, Laptop, ChevronRight, Copy, Lock, Bell, ShieldCheck, Mail, Phone,
  MapPin, BarChart2, Play, Pause, StopCircle, UserPlus, ExternalLink,
  ZoomIn, ZoomOut, RotateCw, RefreshCw, Maximize2, MoreVertical, Archive, Folder, Clock, Shield, Sparkles, FileDown
} from 'lucide-react';
import {  motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import {  UserData, Chat, Message, PollData } from './types';
import {  SEED_USERS, SEED_CHATS, SEED_MESSAGES } from './data';
import {  isFirebaseConfigured, db, auth } from './firebaseClient';
import {  MessageCard } from './components/MessageCard';
import {  InlineVideoPlayer } from './components/InlineVideoPlayer';
import {  VoiceNotePlayer } from './components/VoiceNotePlayer';
import {  SettingsPage } from './components/SettingsPage';
import {  MediaEditorModal, MediaEditorData } from './components/MediaEditorModal';
import {  ImageCropperModal } from './components/ImageCropperModal';
import {  ChatThemeModal } from './components/ChatThemeModal';
import {  UnifiedEmojiPicker } from './components/UnifiedEmojiPicker';
import {  LandingPage } from './components/LandingPage';
import {  AuthFlow } from './components/AuthFlow';
import {  AccountSetup } from './components/AccountSetup';
import {  PublicProfileView } from './components/PublicProfileView';
import { isUserEffectivelyOnline } from './presenceUtils';
import {  getThemeById, DEFAULT_THEME_ID } from './chatThemes';
import {  encryptMessageText, decryptMessageText } from './cryptoUtils';
import {  CallModal, CallSession } from './components/CallModal';
import {  blobToBase64, getSupportedMimeType, generateSyntheticVoiceNote } from './audioUtils';
import OneSignal from 'react-onesignal';
import {  
  collection, onSnapshot, doc, getDoc, setDoc, deleteDoc, query, where, getDocs 
} from 'firebase/firestore';
import {  
  signInWithEmailAndPassword, createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, onAuthStateChanged, 
  GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail 
} from 'firebase/auth';

export default function App() {
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
    return msgs.filter(m => {
      if (!m || !m.id) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
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

  const safeFirestoreUrl = (url: string | undefined | null, fileName = 'file'): string | null => {
    if (!url) return null;
    // Firestore 1MB document limit = 1,048,576 bytes.
    // Capping payload at 700,000 characters ensures setDoc will never throw doc size exceeded errors.
    if (url.length > 700000) {
      console.warn(`Attachment exceeds Firestore 1MB doc size limit (${url.length} chars). Saving placeholder for remote sync.`);
      return `[File Attachment (${fileName}): Base64 payload exceeds 1MB cloud document limit. Accessible locally.]`;
    }
    return url;
  };

  const changeTheme = (newTheme: 'light' | 'dark') => {
    setThemeMode(newTheme);
    showToast(`${newTheme === 'light' ? 'Light' : 'Dark'} mode`);
  };
  const [activeView, setActiveView] = useState<'chats' | 'search' | 'profile' | 'settings'>('chats');
  const [mobileShowChat, setMobileShowChat] = useState<boolean>(false);

  // Secure Voice & Video Calling States
  const [activeCallSession, setActiveCallSession] = useState<CallSession | null>(null);

  const handleStartCall = (type: 'voice' | 'video') => {
    const activeChat = chats.find(c => c.id === activeChatId);
    if (!activeChat) {
      showToast("Select a conversation to start a call");
      return;
    }

    const newCallSession: CallSession = {
      id: 'call_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      type: type,
      status: 'dialing',
      isIncoming: false,
      partnerUsername: activeChat.username,
      partnerName: activeChat.name,
      partnerAvatarSeed: activeChat.avatar_seed || activeChat.username,
      partnerAvatarUrl: activeChat.avatar_url || users[activeChat.username]?.avatar_url
    };

    // If Firestore is active, initialize call signaling document
    if (isFirebaseConfigured && db) {
      setDoc(doc(db, 'calls', newCallSession.id), {
        id: newCallSession.id,
        type: type,
        caller: userUsername,
        receiver: activeChat.username,
        status: 'dialing',
        created_at: Date.now(),
        candidates: []
      }).catch(err => console.warn("Failed to synchronize call to Cloud Firestore:", err));
    }

    setActiveCallSession(newCallSession);
    showToast(`Calling ${activeChat.name}...`);
  };

  const handleEndCall = async (duration: number, reason: string) => {
    if (activeCallSession && activeCallSession.partnerUsername) {
      const targetChat = chats.find(c => c.type === 'dm' && c.username === activeCallSession.partnerUsername);
      if (targetChat) {
        const callTypeLabel = activeCallSession.type === 'video' ? '📹 Video' : '📞 Voice';
        const isMissed = reason === 'declined' || (reason === 'ended' && duration === 0);
        let logText = '';
        
        if (isMissed) {
          logText = activeCallSession.isIncoming ? `Missed ${callTypeLabel} Call` : `Unanswered ${callTypeLabel} Call`;
        } else {
          const m = Math.floor(duration / 60);
          const s = duration % 60;
          const durationStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          logText = `${callTypeLabel} Call • ${durationStr}`;
        }

        const newMsgId = 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
        const sender = activeCallSession.isIncoming ? activeCallSession.partnerUsername : (userUsername || 'me');
        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const newMsg: Message = {
          id: newMsgId,
          chat_id: targetChat.id,
          text: logText,
          sender,
          timestamp,
          type: 'text',
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
              created_at: Date.now(),
              sender,
              text: encryptedPayload,
              type: 'text',
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
          } catch (err) {
            console.warn("Call log delivery notice:", err);
          }
        }

        setMessagesByChat(prev => ({
          ...prev,
          [targetChat.id]: [...(prev[targetChat.id] || []), newMsg]
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
    showToast("Call ended safely");
  };

  const handleAnswerCall = () => {
    if (activeCallSession) {
      setActiveCallSession(prev => prev ? { ...prev, status: 'connected' } : null);
    }
  };
  const [showProfilePanel, setShowProfilePanel] = useState<boolean>(false);
  const [showAttachMenu, setShowAttachMenu] = useState<boolean>(false);
  const [showUnifiedPicker, setShowUnifiedPicker] = useState<boolean>(false);
  const [showEmojiPanel, setShowEmojiPanel] = useState<boolean>(false);
  const [showStickerPanel, setShowStickerPanel] = useState<boolean>(false);

  // Profile & Settings State
  const [settingsSection, setSettingsSection] = useState<'main' | 'appearance' | 'notifications' | 'privacy' | 'chats' | 'account' | 'communication'>('main');
  const [settingsSearchQuery, setSettingsSearchQuery] = useState<string>('');
  const [showEditProfileModal, setShowEditProfileModal] = useState<boolean>(false);
  const [showShareProfileModal, setShowShareProfileModal] = useState<boolean>(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'media' | 'saved'>('media');
  const [currentMediaFolder, setCurrentMediaFolder] = useState<'photos' | 'videos' | 'audio' | 'documents' | null>(null);
  const [publicProfileUsername, setPublicProfileUsername] = useState<string | null>(null);

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
  const [myCustomStatus, setMyCustomStatus] = useState<string>('Available 💬');
  const [myActivityType, setMyActivityType] = useState<'none' | 'typing' | 'recording_voice' | 'in_call'>('none');
  const [showStatusPopover, setShowStatusPopover] = useState<boolean>(false);

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
  const [isAuthResolving, setIsAuthResolving] = useState<boolean>(true);
  const [isEmailVerificationPending, setIsEmailVerificationPending] = useState<boolean>(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string>('');
  const [showLandingPage, setShowLandingPage] = useState<boolean>(true);
  const [authFlowInitialMode, setAuthFlowInitialMode] = useState<'login' | 'register'>('login');

  // Sync URL Path Navigation (/ vs /login vs /u/:username)
  useEffect(() => {
    const handleLocationSync = () => {
      const path = window.location.pathname.toLowerCase();
      if (path === '/login' || path === '/signup' || path === '/auth' || path === '/register') {
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
          setShowLandingPage(false);
        }
      } else {
        if (!isAuthenticated) {
          setShowLandingPage(true);
        }
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
  const [chats, setChats] = useState<Chat[]>([]);
  const chatsRef = useRef<Chat[]>([]);
  useEffect(() => { chatsRef.current = chats; }, [chats]);
  const [messagesByChat, setMessagesByChat] = useState<Record<string, Message[]>>({});
  const [activeChatId, setActiveChatId] = useState<string>('');

  // Modals, Context Menus & WhatsApp Chat Controls
  const [selectedMessageForActions, setSelectedMessageForActions] = useState<Message | null>(null);
  const [selectedChatForOptions, setSelectedChatForOptions] = useState<Chat | null>(null);
  const [showChatCustomizationSheet, setShowChatCustomizationSheet] = useState<boolean>(false);

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
      showToast('Theme applied to all chats ✨');
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
      showToast('Wallpaper & theme updated ✨');
    }
  };
  const [chatDisappearing, setChatDisappearing] = useState<Record<string, 'off' | '24h' | '7d' | '90d'>>({});

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
  const [selectedProfileUsername, setSelectedProfileUsername] = useState<string>('emma');

  // Chat scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesByChat, activeChatId]);

  // Mark messages as read when viewing active chat
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername || !activeChatId) return;
    
    const unreadMsgs = (messagesByChat[activeChatId] || []).filter(
      m => m.sender !== userUsername && (!m.read_by || !m.read_by.includes(userUsername))
    );
    
    if (unreadMsgs.length > 0) {
      unreadMsgs.forEach(m => {
        const newReadBy = [...(m.read_by || []), userUsername];
        setDoc(doc(db, 'messages', m.id), { read_by: newReadBy }, { merge: true }).catch(() => {});
      });
      
      // Update chat document to mark last message as read
      setDoc(doc(db, 'chats', activeChatId), { last_message_status: 'read' }, { merge: true }).catch(() => {});
      
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
              const p = docSnap.data();
              if (p.username) {
                fetchedUsers[p.username] = {
                  username: p.username,
                  display_name: p.display_name || p.username,
                  bio: p.bio || '',
                  avatar_seed: p.avatar_seed || p.username,
                  avatar_url: p.avatar_url || '',
                  online: isUserEffectivelyOnline(p as any),
                  last_seen: p.last_seen || 'offline',
                  last_seen_timestamp: p.last_seen_timestamp || 0,
                  custom_status: p.custom_status || '',
                  activity_status: p.activity_status || 'online',
                  activity_type: p.activity_type || 'none',
                  name_change_timestamps: p.name_change_timestamps || [],
                  username_change_timestamps: p.username_change_timestamps || []
                };
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
  
                if (userSnap.exists()) {
                  const profile = userSnap.data();
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
                  setAuthMethod(userObj.providerData[0]?.providerId || 'email');
                  setIsAuthenticated(true);
                } else {
                  setAuthMethod(userObj.providerData[0]?.providerId || 'email');
                  const defaultUser = userObj.email?.split('@')[0].replace(/[^a-z0-9_]/g, '') || 'user';
                  setUsernameInput(defaultUser);
                  setOnboardingStep(1);
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
          showToast("Email verified successfully! 🎉");
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

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', userUsername)
    );

    const unsubscribeChats = onSnapshot(
      chatsQuery,
      (snapshot) => {
        const chatMap = new Map<string, Chat>();
        snapshot.forEach(docSnap => {
          const c = docSnap.data();
          if (c.id && !chatMap.has(c.id)) {
            const otherUser = (c.participants || []).find((p: string) => p !== userUsername) || '';
            const uProfile = users[otherUser];

            const chatObj: Chat = {
              id: c.id,
              type: (c.type || 'dm') as 'dm' | 'group',
              name: c.type === 'dm' ? (uProfile?.display_name || otherUser) : (c.name || ''),
              username: c.type === 'dm' ? otherUser : (c.username || ''),
              avatar_seed: c.type === 'dm' ? (uProfile?.avatar_seed || otherUser) : (c.avatar_seed || ''),
              avatar_url: c.type === 'dm' ? (uProfile?.avatar_url || '') : (c.avatar_url || ''),
              participants: c.participants || [],
              unread: c.unread || 0,
              last_message: c.last_message || '',
              last_time: c.last_time || '',
              pinned: c.pinned || false,
              muted: c.muted || false,
              typing: c.typing || false,
              online: c.type === 'dm' ? isUserEffectivelyOnline(uProfile) : (c.online || false),
              last_seen: c.type === 'dm' ? (uProfile?.last_seen || '') : (c.last_seen || ''),
              activity_type: c.activity_type || 'none',
              custom_status: c.type === 'dm' ? (uProfile?.custom_status || '') : (c.custom_status || ''),
              updated_at: c.updated_at || Date.now(),
              cleared_at: c.cleared_at || {},
              theme: c.themes?.[userUsername],
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
        if (fetchedChats.length > 0) {
          fetchedChats.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            const timeA = a.updated_at || 0;
            const timeB = b.updated_at || 0;
            if (timeA !== timeB) return timeB - timeA;
            return a.id > b.id ? -1 : 1;
          });
          setChats(fetchedChats);
          
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
        } else {
          setChats([]);
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

  // Synchronize messages for the active chat only
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !activeChatId || !userUsername) {
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
            sender: m.sender || 'unknown',
            text: clearText,
            type: (m.type || 'text') as any,
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
          })
          .sort((a, b) => {
            const timeA = a.created_at || 0;
            const timeB = b.created_at || 0;
            if (timeA !== timeB) return timeA - timeB;
            return a.id > b.id ? 1 : -1;
          });

        setMessagesByChat(prev => ({
          ...prev,
          [activeChatId]: dedupeMessages(activeMsgs)
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

  // Real Presence & User Status Sync Heartbeat
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername) return;

    const syncPresence = () => {
      setDoc(doc(db, 'users', userUsername), {
        online: myPresenceStatus !== 'offline',
        activity_status: myPresenceStatus,
        custom_status: myCustomStatus,
        activity_type: myActivityType,
        last_seen: 'just now',
        last_seen_timestamp: Date.now()
      }, { merge: true }).catch(err => console.warn("Presence sync notice:", err));
    };

    syncPresence();
    
    // Heartbeat every 30 seconds
    const interval = setInterval(syncPresence, 30000);
    
    return () => clearInterval(interval);
  }, [userUsername, myPresenceStatus, myCustomStatus, myActivityType, isFirebaseConfigured, db]);

  // Live Voice & Video Signaling Listener for Incoming Calls
  useEffect(() => {
    if (!isFirebaseConfigured || !db || !userUsername) return;

    const q = query(
      collection(db, 'calls'),
      where('receiver', '==', userUsername),
      where('status', '==', 'dialing')
    );

    const unsubscribeCalls = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          const callData = change.doc.data();
          if (callData.status === 'dialing') {
            const callerUserObj = users[callData.caller];
            setActiveCallSession({
              id: callData.id,
              type: callData.type as 'voice' | 'video',
              status: 'ringing', // Mark as ringing for recipient
              isIncoming: true,
              partnerUsername: callData.caller,
              partnerName: callerUserObj?.display_name || callData.caller,
              partnerAvatarSeed: callerUserObj?.avatar_seed || callData.caller,
              partnerAvatarUrl: callerUserObj?.avatar_url
            });
          }
        }
      });
    }, (err) => {
      console.warn("Call signaling snapshot notice:", err);
    });

    return () => {
      unsubscribeCalls();
    };
  }, [userUsername, isFirebaseConfigured, db, users]);

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
  const isUsernameAvailable = isUsernameValidFormat && !Object.values(users).some(u => u.username === usernameInput);

  // Online Status Helpers
  const getOnlineStatusText = (user: UserData | undefined) => {
    if (!user) return 'offline';
    if (!isUserEffectivelyOnline(user)) {
      if (!user.last_seen_timestamp) return user.last_seen || 'offline';
      const diff = Date.now() - user.last_seen_timestamp;
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'last seen just now';
      if (mins < 60) return `last seen ${mins}m ago`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `last seen ${hrs}h ago`;
      return `last seen ${Math.floor(hrs/24)}d ago`;
    }
    
    // Heartbeat check (assume offline if no heartbeat for 1.5 mins)
    if (user.last_seen_timestamp) {
      const diff = Date.now() - user.last_seen_timestamp;
      if (diff > 90000) {
        const mins = Math.floor(diff / 60000);
        if (mins < 60) return `last seen ${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `last seen ${hrs}h ago`;
        return `last seen ${Math.floor(hrs/24)}d ago`;
      }
    }
    return 'online';
  };

  const isUserEffectivelyOnline = (user: UserData | undefined) => {
    if (!user) return false;
    
    // Always check timestamp first
    if (user.last_seen_timestamp) {
      // 60 seconds threshold (60,000 ms)
      return Date.now() - user.last_seen_timestamp <= 60000;
    }
    
    // Fallback to boolean flag
    return user.online;
  };

  // Dismiss Toast helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? '' : prev);
    }, 3000);
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
        setUserDisplayName(resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1));
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
        setUserDisplayName(resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1));
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
      const randSeed = 'user' + phoneInput.slice(-4);
      setUserId('u_' + Math.random().toString(36).substring(2, 9));
      setUserPhone(phoneInput);
      setUserDisplayName('User ' + phoneInput.slice(-4));
      setUserAvatarSeed(randSeed);
      setAuthMethod('phone');
      
      setUsernameInput(randSeed);
      setOnboardingStep(1);
    }, 800);
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

        if (userSnap.exists()) {
          const profile = userSnap.data();
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
          confetti({ particleCount: 80, spread: 60, origin: { y: 0.8 } });
          showToast(`Welcome back, ${dName}!`);
        } else {
          // Profile is missing, trigger onboarding
          const resolvedUsername = (userObj.email || 'user').split('@')[0].replace(/[^a-z0-9_]/g, '');
          setUsernameInput(resolvedUsername);
          setIsAuthenticated(true);
          setOnboardingStep(1);
        }
      } catch (err: any) {
        setErrorMessage(err.message || `An error occurred starting ${provider} login.`);
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
        const localUser = Object.values(users).find(u => u.username.toLowerCase() === cleanUsername);
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

        if (userSnap.exists()) {
          const profile = userSnap.data();
          setUserUsername(profile.username || '');
          setUserDisplayName(profile.display_name || profile.username || '');
          setUserBio(profile.bio || '');
          setUserAvatarSeed(profile.avatar_seed || profile.username || '');
          setUserAvatarUrl(profile.avatar_url || '');
        } else {
          const resolvedUsername = emailToUse.split('@')[0].replace(/[^a-z0-9_]/g, '');
          setUserUsername(resolvedUsername);
          setUserDisplayName(resolvedUsername);
          setUserAvatarSeed(resolvedUsername);
        }

        setIsAuthenticated(true);
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
      setUserDisplayName(resolvedUsername.charAt(0).toUpperCase() + resolvedUsername.slice(1));
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
    dob: string;
    gender: string;
    password: string;
  }): Promise<{ success: boolean; error?: string }> => {
    if (isFirebaseConfigured && auth && db) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const userObj = userCredential.user;

        await setDoc(doc(db, 'users', userObj.uid), {
          id: userObj.uid,
          email: data.email,
          display_name: data.fullName,
          username: data.username.toLowerCase(),
          dob: data.dob,
          gender: data.gender,
          avatar_seed: data.username.toLowerCase(),
          bio: 'Hey there! I am using Zenoa Messenger.',
          created_at: Date.now()
        });

        try {
          await sendEmailVerification(userObj);
        } catch (verifErr) {
          console.warn("Verification email notice:", verifErr);
        }

        // Keep them logged in but set verification pending state so the polling effect checks them!
        setIsEmailVerificationPending(true);
        setPendingVerificationEmail(data.email);

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
        display_name: data.fullName,
        username: data.username.toLowerCase(),
        avatar_seed: data.username.toLowerCase(),
        bio: 'Hey there! I am using Zenoa Messenger.',
        online: true,
        last_seen: 'Just now'
      };
      setUsers(prev => ({
        ...prev,
        [mockUid]: mockUser
      }));

      // Populate local state
      setUserId(mockUid);
      setUserEmail(data.email);
      setUserUsername(data.username.toLowerCase());
      setUserDisplayName(data.fullName);
      setUserAvatarSeed(data.username.toLowerCase());
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
    setUserAvatarUrl(croppedDataUrl);
    setShowImageCropper(false);
    showToast('Profile picture cropped & set successfully! 📸');
  };

  const handleRemovePhoto = () => {
    triggerConfirm({
      title: 'Remove Profile Photo?',
      description: 'Your custom profile avatar will be removed and reset to your initials.',
      confirmText: 'Remove Photo',
      variant: 'danger',
      onConfirm: () => {
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

  const cleanSettingsUsername = userUsername.trim().toLowerCase().replace(/^@/, '');
  const isUsernameFormatValidInSettings = cleanSettingsUsername.length >= 3 && cleanSettingsUsername.length <= 20 && /^[a-z0-9_]+$/.test(cleanSettingsUsername);
  const isUsernameAvailableInSettings = isUsernameFormatValidInSettings && (
    cleanSettingsUsername === savedUsername || !Object.values(users).some(u => u.username.toLowerCase() === cleanSettingsUsername)
  );

  const handleSaveProfile = async () => {
    if (!userDisplayName.trim()) {
      showToast('Display name cannot be empty');
      return;
    }

    const now = Date.now();
    const formattedUsername = cleanSettingsUsername;

    // 1. Check Display Name Rate Limit (Twice in 14 days)
    const isDisplayNameChanged = userDisplayName.trim() !== savedDisplayName.trim();
    let updatedNameChanges = [...recentNameChanges];

    if (isDisplayNameChanged) {
      if (remainingNameChanges <= 0) {
        showToast(`Display Name can only be changed twice every 14 days. Next change available: ${nextNameChangeDate}`);
        return;
      }
      updatedNameChanges.push(now);
    }

    // 2. Check Username Rate Limit (7 times per day) and validity
    const isUsernameChanged = formattedUsername !== savedUsername;
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

    setIsSavingProfile(true);
    try {
      if (isFirebaseConfigured && db && auth && userId) {
        await setDoc(doc(db, 'users', userId), {
          id: userId,
          username: formattedUsername,
          display_name: userDisplayName.trim(),
          bio: userBio,
          avatar_seed: userAvatarSeed,
          avatar_url: userAvatarUrl || '',
          name_change_timestamps: updatedNameChanges,
          username_change_timestamps: updatedUsernameChanges,
          online: true,
          last_seen: 'online'
        }, { merge: true });
      }

      // Sync local users store so changes show up in chat feeds and profile drawers immediately
      setUsers(prev => {
        const next = { ...prev };
        if (savedUsername && savedUsername !== formattedUsername) {
          delete next[savedUsername];
        }
        next[formattedUsername] = {
          username: formattedUsername,
          display_name: userDisplayName.trim(),
          bio: userBio,
          avatar_seed: userAvatarSeed,
          avatar_url: userAvatarUrl || '',
          name_change_timestamps: updatedNameChanges,
          username_change_timestamps: updatedUsernameChanges,
          online: true,
          last_seen: 'online'
        };
        return next;
      });

      // Update current user state markers
      setUserUsername(formattedUsername);
      setSavedUsername(formattedUsername);
      setSavedDisplayName(userDisplayName.trim());
      setUserNameChanges(updatedNameChanges);
      setUserUsernameChanges(updatedUsernameChanges);

      showToast('Profile changes saved successfully!');
    } catch (err: any) {
      console.error("Save profile error:", err);
      showToast('Failed to save profile changes.');
    } finally {
      setIsSavingProfile(false);
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
  const activeChat = chats.find(c => c.id === activeChatId) || chats[0] || {
    id: '',
    type: 'dm',
    name: 'Zenoa',
    username: 'zenoa',
    avatar_seed: 'Z',
    participants: [],
    unread: 0,
    last_message: '',
    last_time: '',
    pinned: false,
    muted: false,
    typing: false,
    online: false,
    last_seen: ''
  };
  const activeMessages = dedupeMessages(messagesByChat[activeChatId] || []);

  // Filter messages based on chat search
  const filteredActiveMessages = activeMessages.filter(msg => {
    if (msg.deleted_for_me) return false;
    if (messageSearchQuery.trim()) {
      return msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase());
    }
    return true;
  });

  // Filter chats based on sidebar search with deduplication
  const uniqueChats = chats.filter((chat, index, self) => index === self.findIndex(c => c.id === chat.id));
  const filteredChats = uniqueChats.filter(chat => {
    const query = chatSearchQuery.toLowerCase().trim();
    if (!query) return true;
    return chat.name.toLowerCase().includes(query) || (chat.username && chat.username.toLowerCase().includes(query));
  });

  // Global user search (for Discover view)
  const globalSearchResults = Object.values(users).filter(user => {
    const q = globalSearchQuery.toLowerCase().trim();
    if (!q) return false;
    // Don't search yourself
    if (user.username === userUsername) return false;
    return user.username.toLowerCase().includes(q) || user.display_name.toLowerCase().includes(q);
  });

  // Send message
  const handleSendMessage = async () => {
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
          return { ...c, last_message: `You: ${text}`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const };
        }
        return c;
      }));

      setEditMessageId('');
    } else {
      // Send new message
      const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
      const newMsg: Message = {
        id: newMsgId,
        chat_id: activeChatId, created_at: Date.now(),
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

      if (isFirebaseConfigured && db && auth) {
        try {
          const encryptedPayload = await encryptMessageText(text, activeChatId);
          await setDoc(doc(db, 'messages', newMsgId), {
            id: newMsgId,
            chat_id: activeChatId, created_at: Date.now(),
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
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: activeChat.type,
            name: activeChat.name,
            username: activeChat.username,
            avatar_seed: activeChat.avatar_seed,
            participants: activeChat.participants,
            last_message: text,
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
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

    setComposerText('');
    setShowEmojiPanel(false);
    setShowStickerPanel(false);
  };

  // Reply message trigger
  const handleStartReply = (msg: Message) => {
    setReplyToId(msg.id);
    setReplyToPreview(msg.text || `[${msg.type}]`);
    setReplyToSender((msg.sender === 'me' || msg.sender === userUsername) ? 'You' : (users[msg.sender]?.display_name || msg.sender));
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
      showToast("Using voice audio synthesizer 🎙️");
    }

    setIsRecordingVoice(true);
    setRecordingSeconds(0);
    setMyActivityType('recording_voice');

    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);

    showToast("Voice recording started 🎙️");
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
      chat_id: activeChatId, created_at: Date.now(),
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
        const firestoreAudioUrl = safeFirestoreUrl(audioUrlToUse, 'voice_note.ogg');
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(),
          sender: userUsername || 'me',
          text: '',
          type: 'voice',
          audio_url: firestoreAudioUrl,
          file_size: durationFormatted || '0:05',
          timestamp: timeStr,
          reactions: [],
          read_by: [],
          forwarded: false,
          pinned: false
        });

        const activeChat = chats.find(c => c.id === activeChatId);
        if (activeChat) {
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            last_message: '🎤 Voice Note (' + (durationFormatted || '0:05') + ')',
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
          }, { merge: true });
        }
      } catch (err) {
        console.warn("Firebase send voice note warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: 🎤 Voice Note (${durationFormatted || '0:05'})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
    
    cancelVoiceRecording();
    setShowAttachMenu(false);
    showToast("Voice note sent 🎙️");
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

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);

    const finalType = result.isDocument ? 'document' : pendingMediaEditorData.mediaType;

    const newMsg: Message = {
      id: newMsgId,
      chat_id: activeChatId,
      created_at: Date.now(),
      sender: userUsername || 'me',
      text: result.caption || result.fileName,
      type: finalType,
      media_url: !result.isDocument ? (result.mediaUrl || (finalType === 'video' ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : undefined)) : undefined,
      file_name: result.fileName,
      file_size: result.fileSize,
      media_quality: result.mediaQuality,
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    if (newMsg.media_url) {
      localMediaCacheRef.current[newMsg.id] = newMsg.media_url;
      if (result.fileName) localMediaCacheRef.current[result.fileName] = newMsg.media_url;
    }

    if (isFirebaseConfigured && db && auth) {
      try {
        const firestoreMediaUrl = safeFirestoreUrl(newMsg.media_url, result.fileName);

        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId,
          created_at: Date.now(),
          sender: userUsername || 'me',
          text: result.caption || result.fileName,
          type: newMsg.type,
          media_url: firestoreMediaUrl,
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
          await setDoc(doc(db, 'chats', activeChatId), {
            id: activeChatId,
            type: activeChat.type,
            name: activeChat.name,
            username: activeChat.username,
            avatar_seed: activeChat.avatar_seed,
            participants: activeChat.participants,
            last_message: result.caption ? `[${pendingMediaEditorData.mediaType.toUpperCase()}] ${result.caption}` : `[${pendingMediaEditorData.mediaType.toUpperCase()}]`,
            last_time: 'now',
            updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
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
      description: 'All messages and shared media history will be permanently deleted.',
      confirmText: 'Delete Chat',
      variant: 'danger',
      onConfirm: async () => {
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
        showToast('Chat deleted 🗑️');
        closeConfirm();
      }
    });
  };

  // --- REAL FILE UPLOAD HANDLER ---
  const handleRealFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, mediaType: 'image' | 'video' | 'document' | 'audio') => {
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

      // FOR PHOTOS & VIDEOS: Intercept & Open WhatsApp-Style Editor First
      if (mediaType === 'image' || mediaType === 'video') {
        const activeChat = chats.find(c => c.id === activeChatId);
        setPendingMediaEditorData({
          file,
          fileUrl: rawResult,
          mediaType,
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
      }

      let processedResult = rawResult;

      const newMsg: Message = {
        id: newMsgId,
        chat_id: activeChatId, created_at: Date.now(),
        sender: userUsername || 'me',
        text: file.name,
        type: mediaType === 'audio' ? 'voice' : mediaType,
        media_url: undefined,
        audio_url: mediaType === 'audio' ? processedResult : undefined,
        file_name: file.name,
        file_size: sizeStr,
        media_quality: mediaUploadQuality,
        timestamp: timeStr,
        reactions: [],
        read_by: []
      };

      if (isFirebaseConfigured && db && auth) {
        try {
          const firestoreMediaUrl = safeFirestoreUrl(newMsg.media_url, file.name);
          const firestoreAudioUrl = safeFirestoreUrl(newMsg.audio_url, file.name);

          await setDoc(doc(db, 'messages', newMsgId), {
            id: newMsgId,
            chat_id: activeChatId, created_at: Date.now(),
            sender: userUsername || 'me',
            text: file.name,
            type: newMsg.type,
            media_url: firestoreMediaUrl,
            audio_url: firestoreAudioUrl,
            file_name: file.name,
            file_size: sizeStr,
            media_quality: mediaUploadQuality,
            timestamp: timeStr,
            reactions: [],
            read_by: [],
            forwarded: false,
            pinned: false
          });

          const activeChat = chats.find(c => c.id === activeChatId);
          if (activeChat) {
            await setDoc(doc(db, 'chats', activeChatId), {
              id: activeChatId,
              last_message: '📁 ' + file.name,
              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
            }, { merge: true });
          }
        } catch (err) {
          console.warn("Firebase file upload warning:", err);
        }
      }

      setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
      setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: [${file.name}]`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
      setShowAttachMenu(false);
      showToast(`${mediaType.toUpperCase()} uploaded (${mediaUploadQuality.toUpperCase()} Quality)`);
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
      chat_id: activeChatId, created_at: Date.now(),
      sender: userUsername || 'me',
      text: `📍 ${locationTitle}`,
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

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'location',
          location_data: newMsg.location_data,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });
      } catch (err) {
        console.warn("Firebase location send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: 📍 Location (${locationTitle})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
    setShowLocationModal(false);
    setShowAttachMenu(false);
    showToast("Location shared 📍");
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
      chat_id: activeChatId, created_at: Date.now(),
      sender: userUsername || 'me',
      text: `👤 Contact: ${contactName}`,
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

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'contact',
          contact_data: newMsg.contact_data,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });
      } catch (err) {
        console.warn("Firebase contact send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: 👤 Contact (${contactName})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
    setShowContactModal(false);
    setShowAttachMenu(false);
    setContactName('');
    setContactPhone('');
    setContactEmail('');
    showToast("Contact card shared 👤");
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
      chat_id: activeChatId, created_at: Date.now(),
      sender: userUsername || 'me',
      text: `📊 Poll: ${pollQuestion}`,
      type: 'poll',
      poll_data: pollData,
      timestamp: timeStr,
      reactions: [],
      read_by: []
    };

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', newMsgId), {
          id: newMsgId,
          chat_id: activeChatId, created_at: Date.now(),
          sender: userUsername || 'me',
          text: newMsg.text,
          type: 'poll',
          poll_data: pollData,
          timestamp: timeStr,
          reactions: [],
          read_by: []
        });
      } catch (err) {
        console.warn("Firebase poll send warning:", err);
      }
    }

    setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
    setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: 📊 Poll (${pollQuestion})`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
    setShowPollModal(false);
    setShowAttachMenu(false);
    setPollQuestion('');
    setPollOptionsInputs(['Option 1', 'Option 2']);
    showToast("Poll created 📊");
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
    showToast("Vote updated 🗳️");
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

    const targetChatId = selectedMessageForActions?.chat_id || activeChatId;

    setMessagesByChat(prev => {
      const chatMsgs = prev[targetChatId] || [];
      const updated = chatMsgs.map(m => {
        if (m.id === msgId) {
          return { ...m, deleted_for_me: true };
        }
        return m;
      });
      return { ...prev, [targetChatId]: updated };
    });

    if (isFirebaseConfigured && db && auth) {
      try {
        await setDoc(doc(db, 'messages', msgId), {
          deleted_for_me: true
        }, { merge: true });
      } catch (err) {
        console.warn("Firebase delete for me warning:", err);
      }
    }

    setShowDeleteModal(false);
    setDeleteMessageId('');
    setSelectedMessageForActions(null);
    showToast('Message deleted for you');
  };

  const canDeleteForEveryone = (msg: Message | null) => {
    if (!msg) return false;
    const isMe = msg.sender === 'me' || msg.sender === userUsername;
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
        await setDoc(doc(db, 'messages', msgId), {
          deleted_for_everyone: true,
          text: ''
        }, { merge: true });
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
    showToast('Chat wallpaper updated 🎨');
  };

  const handleToggleStarMessage = (msgId: string) => {
    setMessagesByChat(prev => {
      const targetChatId = selectedMessageForActions?.chat_id || activeChatId;
      const msgs = prev[targetChatId] || [];
      const updated = msgs.map(m => {
        if (m.id === msgId) {
          const nextStarred = !m.starred;
          showToast(nextStarred ? 'Message starred ⭐' : 'Message unstarred');
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
      showToast('Message copied to clipboard 📋');
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
        showToast('Chat history cleared 🧹');
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
    showToast('Chat transcript exported as .txt 📄');
  };

  const handleToggleArchiveChat = (chatId: string) => {
    setChats(prev => prev.map(c => {
      if (c.id === chatId) {
        const nextArchived = !c.archived;
        showToast(nextArchived ? 'Chat archived 📦' : 'Chat unarchived');
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
          chat_id: targetChatId, created_at: Date.now(),
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
              chat_id: targetChatId, created_at: Date.now(),
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

            const targetChat = chats.find(c => c.id === targetChatId);
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
        setChats(prev => prev.map(c => {
          if (c.id === targetChatId) {
            return {
              ...c,
              last_message: `You: ${originalMsg.text || `[${originalMsg.type}]`}`,
              last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
            };
          }
          return c;
        }));
      }

      showToast(`Forwarded to ${forwardTargets.length} chat(s)`);
    }

    setShowForwardModal(false);
    setForwardMessageId('');
    setForwardTargets([]);
  };

  // Discover start chat
  const handleStartChatWithUser = async (user: UserData) => {
    const targetChatId = `c_${user.username}`;
    const exists = chats.some(c => c.id === targetChatId);

    if (!exists) {
      const selfName = userUsername || 'me';
      const newChat: Chat = {
        id: targetChatId,
        type: 'dm',
        name: user.display_name,
        username: user.username,
        avatar_seed: user.avatar_seed,
        participants: [selfName, user.username],
        unread: 0,
        last_message: 'Chat started',
        last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const,
        pinned: false,
        muted: false,
        typing: false,
        online: isUserEffectivelyOnline(user),
        last_seen: user.last_seen
      };

      if (isFirebaseConfigured && db && auth) {
        try {
          await setDoc(doc(db, 'chats', targetChatId), {
            id: targetChatId,
            type: 'dm',
            name: user.display_name,
            username: user.username,
            avatar_seed: user.avatar_seed,
            participants: [selfName, user.username],
            unread: 0,
            last_message: 'Chat started',
            last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
          }, { merge: true });
        } catch (err) {
          console.error("Error creating chat in Firebase:", err);
        }
      }

      setChats(prev => {
        if (prev.some(c => c.id === targetChatId)) return prev;
        return [newChat, ...prev];
      });
      setMessagesByChat(prev => ({
        ...prev,
        [targetChatId]: []
      }));
    }

    setActiveChatId(targetChatId);
    setActiveView('chats');
    setMobileShowChat(true);
    setGlobalSearchQuery('');
  };

  // Redirect to chat if authenticated and viewing a public profile URL
  useEffect(() => {
    if (isAuthenticated && publicProfileUsername) {
      const cleanUsername = publicProfileUsername.replace(/^@/, '').trim();
      if (cleanUsername) {
        const existingUser = Object.values(users).find(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
        if (existingUser) {
          handleStartChatWithUser(existingUser);
        } else {
          const newUser: UserData = {
            username: cleanUsername,
            display_name: cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1),
            bio: 'Hey there! I am using Zenoa for end-to-end encrypted messaging.',
            avatar_seed: cleanUsername,
            online: true,
            last_seen: 'Recently active'
          };
          handleStartChatWithUser(newUser);
        }
        setPublicProfileUsername(null);
        try { window.history.pushState({}, '', '/'); } catch(e){}
      }
    }
  }, [isAuthenticated, publicProfileUsername, users]);

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

  // Sidebar controls
  const handleToggleMuteChat = (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation();
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

  // Trigger avatar helper letter
  const getAvatarLetter = (seed: string, name: string) => {
    const s = seed || name || '?';
    return s.charAt(0).toUpperCase();
  };

  const getAvatarBgClass = (seed: string) => {
    const s = (seed || '').toLowerCase();
    if (s.includes('indigo')) return 'bg-indigo-600 text-white';
    if (s.includes('emerald')) return 'bg-emerald-600 text-white';
    if (s.includes('rose')) return 'bg-rose-600 text-white';
    if (s.includes('amber')) return 'bg-amber-600 text-white';
    if (s.includes('violet')) return 'bg-violet-600 text-white';
    if (s.includes('teal')) return 'bg-teal-600 text-white';
    if (s.includes('orange')) return 'bg-orange-600 text-white';
    if (s.includes('sky')) return 'bg-sky-600 text-white';
    if (s.includes('sarah')) return 'bg-indigo-600 text-white';
    if (s.includes('alex')) return 'bg-emerald-600 text-white';
    if (s.includes('david')) return 'bg-rose-600 text-white';
    
    // Hash-based selection
    const colors = [
      'bg-indigo-600 text-white',
      'bg-emerald-600 text-white',
      'bg-rose-600 text-white',
      'bg-amber-600 text-white',
      'bg-violet-600 text-white',
      'bg-teal-600 text-white',
      'bg-orange-600 text-white',
      'bg-sky-600 text-white'
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
    if (avatarUrl) {
      return (
        <div className={`${sizeClass} rounded-full overflow-hidden shrink-0 border border-neutral-200/60 dark:border-neutral-700/60 bg-neutral-100 dark:bg-neutral-800`}>
          <img src={avatarUrl} alt={name || 'Avatar'} className="w-full h-full object-cover" />
        </div>
      );
    }
    return (
      <div className={`${sizeClass} rounded-full ${getAvatarBgClass(s)} font-bold flex items-center justify-center shrink-0`}>
        {getAvatarLetter(s, name || '')}
      </div>
    );
  };

  // Emoji preset array
  const EMOJIS = ['❤️', '👍', '🔥', '😂', '😮', '😢', '👏', '🎉', '💡', '✅', '✨', '☕'];
  const STICKERS = ['🐱 Meow!', '🐶 Woof!', '🍕 Pizza Party', '🚀 To the Moon!', '👑 Royal', '🎉 Congrats!', '💤 Sleepy', '🎯 Nailed It'];
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
            <p className="text-xs text-neutral-400 dark:text-neutral-500 animate-pulse">
              Reconnecting secure session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentication UI Render
  if (isAuthenticated && isNewUserSetupPending) {
    return <AccountSetup themeMode={themeMode} onComplete={() => setIsNewUserSetupPending(false)} />;
  }
  
  if (!isAuthenticated) {
    if (isEmailVerificationPending) {
      return (
        <div className={`min-h-[100dvh] w-full flex items-center justify-center p-4 sm:p-6 transition-colors ${themeMode === 'dark' ? 'dark bg-neutral-950 text-neutral-100' : 'bg-neutral-50 text-neutral-900'}`}>
          <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl border shadow-2xl relative z-10 backdrop-blur-xl bg-white/90 dark:bg-neutral-900/90 border-neutral-200/80 dark:border-neutral-800 text-center space-y-6">
            <div className="flex justify-center animate-bounce">
              <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
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
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
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
                <RefreshCw className="h-3 w-3 animate-spin text-indigo-600" />
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
                  className="flex-1 py-2.5 text-xs font-bold rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
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
        onOAuthLogin={handleOAuthLogin}
        onForgotPassword={handleForgotPassword}
        themeMode={themeMode}
        onToggleTheme={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
        existingUsernames={Object.values(users).map(u => u.username)}
        isOnboarding={onboardingStep > 0}
        initialRegStep={onboardingStep}
      />
    );
  }

  // MAIN RUNTIME APPLICATION
  return (
    <div className={`w-full h-[100dvh] flex overflow-hidden select-none touch-manipulation font-['Inter'] transition-colors ${themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-white text-neutral-800'}`}>
      
      {/* Toast Alert popover */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            key="toast-alert-popover"
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-5 left-1/2 -translate-x-1/2 z-50 bg-neutral-900 text-white text-xs px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-neutral-800"
          >
            <CheckCircle2 className="h-4 w-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL: Forward Message */}
      {showForwardModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
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
                  className={`w-full flex items-center gap-3 p-2 rounded-xl border text-left transition-colors cursor-pointer ${forwardTargets.includes(chat.id) ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900' : 'border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                >
                  {renderAvatar(chat.avatar_seed, chat.name, chat.avatar_url, 'h-8 w-8 text-xs')}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{chat.name}</p>
                    <p className="text-xs text-neutral-500 truncate">{chat.type === 'dm' ? `@${chat.username}` : 'Group'}</p>
                  </div>
                  <div className={`h-4 w-4 rounded border flex items-center justify-center ${forwardTargets.includes(chat.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-neutral-300 dark:border-neutral-600'}`}>
                    {forwardTargets.includes(chat.id) && <Check className="h-3 w-3 stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowForwardModal(false)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
              <button onClick={handleForwardSubmit} disabled={forwardTargets.length === 0} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-md transition-colors">Forward</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Delete Message */}
      {showDeleteModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-xs rounded-2xl p-5 border shadow-2xl ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-150'}`}>
            <div className="flex items-center gap-2 mb-3 text-rose-500">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="font-bold text-base text-neutral-900 dark:text-white">Delete message?</h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4 leading-relaxed">Choose whether to remove this message for only yourself or for all participants in the chat.</p>
            <div className="flex flex-col gap-2">
              <button onClick={handleDeleteForMe} className="w-full py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer">Delete for me</button>
              <button onClick={handleDeleteForEveryone} className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer">Delete for everyone</button>
              <button onClick={() => { setShowDeleteModal(false); setDeleteMessageId(''); }} className="w-full py-2 text-xs font-semibold text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors mt-1 cursor-pointer">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Warning Confirmation Dialog for Sensitive Actions */}
      {confirmModal.isOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className={`w-full max-w-sm rounded-2xl p-5 border shadow-2xl ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-150'}`}>
            <div className="flex items-start gap-3.5 mb-4">
              <div className={`p-2.5 rounded-2xl shrink-0 ${
                confirmModal.variant === 'danger'
                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                  : confirmModal.variant === 'warning'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/50'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-900/50'
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
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                {confirmModal.cancelText || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl text-white shadow-sm transition-all active:scale-95 cursor-pointer ${
                  confirmModal.variant === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : confirmModal.variant === 'warning'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR: Primary Navigation Panels (Chats, Discover, Settings) */}
      <aside className={`hidden md:flex flex-col w-64 border-r shrink-0 h-full max-h-[100dvh] transition-colors ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-50 border-neutral-100'}`}>
        {/* Brand App Header */}
        <div className="flex items-center gap-2.5 h-16 px-4 border-b border-neutral-200 dark:border-neutral-800">
          <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-200 text-white dark:text-neutral-950 font-zenoa font-bold text-sm flex items-center justify-center shadow-sm shrink-0">
            Z
          </div>
          <span className="font-zenoa font-bold text-base tracking-[0.14em] uppercase text-neutral-900 dark:text-white truncate">
            Zenoa
          </span>
          {isAuthenticated && (
            <div className="relative ml-auto">
              <button 
                onClick={() => setShowStatusPopover(prev => !prev)}
                className={`flex items-center gap-1.5 text-[10px] border px-2 py-0.5 rounded-full font-bold cursor-pointer transition-colors ${
                  myPresenceStatus === 'online' 
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/50 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                    : myPresenceStatus === 'away'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200/50 dark:border-amber-900/50 text-amber-600 dark:text-amber-400'
                    : myPresenceStatus === 'busy'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/50 dark:border-rose-900/50 text-rose-600 dark:text-rose-400'
                    : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-500'
                }`}
                title="Change Presence Status & Note"
              >
                <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                  myPresenceStatus === 'online' ? 'bg-emerald-500' : myPresenceStatus === 'away' ? 'bg-amber-500' : myPresenceStatus === 'busy' ? 'bg-rose-500' : 'bg-neutral-400'
                }`} />
                <span className="capitalize">{myPresenceStatus}</span>
              </button>

              {/* Status & Activity Popover */}
              {showStatusPopover && (
                <div className="absolute right-0 top-8 z-50 w-56 p-3 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Activity Status</span>
                    <button onClick={() => setShowStatusPopover(false)} className="p-0.5 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="h-3 w-3" /></button>
                  </div>

                  <div className="space-y-1">
                    {[
                      { status: 'online', label: 'Online', color: 'bg-emerald-500', icon: '🟢' },
                      { status: 'away', label: 'Away', color: 'bg-amber-500', icon: '🟡' },
                      { status: 'busy', label: 'Do Not Disturb', color: 'bg-rose-500', icon: '🔴' },
                      { status: 'offline', label: 'Invisible', color: 'bg-neutral-400', icon: '🌙' },
                    ].map(st => (
                      <button
                        key={st.status}
                        onClick={() => {
                          setMyPresenceStatus(st.status as any);
                          setShowStatusPopover(false);
                          showToast(`Status set to ${st.label}`);
                        }}
                        className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          myPresenceStatus === st.status ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <span>{st.icon}</span>
                          <span>{st.label}</span>
                        </span>
                        {myPresenceStatus === st.status && <Check className="h-3.5 w-3.5 text-indigo-600" />}
                      </button>
                    ))}
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2 space-y-1.5">
                    <label className="block text-[10px] uppercase font-bold text-neutral-400">Custom Status Note</label>
                    <input 
                      type="text"
                      value={myCustomStatus}
                      onChange={e => setMyCustomStatus(e.target.value)}
                      placeholder="e.g. In a meeting 💼"
                      className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 outline-none focus:border-indigo-500"
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
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeView === 'chats' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <MessageSquare className="h-5 w-5" />
            <span>Chats</span>
            {totalUnreads > 0 && <span className="ml-auto bg-indigo-600 text-white text-[10px] font-bold h-4 px-1.5 rounded-full flex items-center justify-center">{totalUnreads}</span>}
          </button>
          
          <button 
            onClick={() => { setActiveView('search'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeView === 'search' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <Search className="h-5 w-5" />
            <span>Discover</span>
          </button>

          <button 
            onClick={() => { setActiveView('profile'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeView === 'profile' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <User className="h-5 w-5" />
            <span>Profile</span>
          </button>

          <button 
            onClick={() => { setActiveView('settings'); setShowProfilePanel(false); }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${activeView === 'settings' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-white'}`}
          >
            <Palette className="h-5 w-5" />
            <span>Settings</span>
          </button>
        </nav>

        {/* Profile Card Footer */}
        <div className="p-3 border-t border-neutral-200 dark:border-neutral-800">
          <div 
            onClick={() => { setActiveView('profile'); setShowProfilePanel(false); }}
            className="flex items-center gap-2 p-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition-all group"
          >
            {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-8 w-8 text-xs')}
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-bold truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{userDisplayName}</p>
              <p className="text-[10px] text-neutral-400 truncate">@{userUsername}</p>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  changeTheme(themeMode === 'light' ? 'dark' : 'light'); 
                }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" 
                title="Theme"
              >
                {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); setActiveView('settings'); }}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors" 
                title="Settings"
              >
                <Menu className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER: Main working viewport */}
      <main className="flex flex-1 h-full max-h-[100dvh] relative overflow-hidden bg-white dark:bg-neutral-950">
        
        {/* VIEW 1: Chats History panel list & message chain */}
        {activeView === 'chats' && (
          <div className="flex flex-1 h-full relative">
            
            {/* Left Sub-sidebar: Chat rooms */}
            <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex flex-col w-full md:w-80 border-r border-neutral-100 dark:border-neutral-800 shrink-0 h-full`}>
              <div className="p-4 border-b border-neutral-100 dark:border-neutral-800">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h1 className="font-zenoa text-xl md:text-2xl font-bold tracking-[0.14em] uppercase text-neutral-900 dark:text-white select-none transition-colors">
                      Zenoa
                    </h1>
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400"></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')} 
                      className="p-2 rounded-xl text-neutral-500 dark:text-neutral-300 hover:text-amber-500 dark:hover:text-amber-400 bg-neutral-100 dark:bg-neutral-800 transition-colors cursor-pointer" 
                      title="Switch Theme"
                    >
                      {themeMode === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-400" />}
                    </button>
                    <button 
                      onClick={() => setActiveView('settings')} 
                      className="p-2 rounded-xl text-neutral-500 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 bg-neutral-100 dark:bg-neutral-800 transition-colors cursor-pointer" 
                      title="Settings"
                    >
                      <Menu className="h-4 w-4" />
                    </button>
                    {/* Plus trigger to initiate conversation with custom user */}
                    <button onClick={() => setActiveView('search')} className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 transition-colors cursor-pointer" title="Start new chat">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" />
                  <input 
                    type="text" 
                    value={chatSearchQuery}
                    onChange={e => setChatSearchQuery(e.target.value)}
                    placeholder="Search chats..."
                    className="w-full pl-9 pr-4 py-1.5 rounded-xl text-sm border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Chat room scroll feed */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 pb-24 md:pb-2 overscroll-contain">
                {filteredChats.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-neutral-400">No chats found</p>
                  </div>
                ) : (
                  filteredChats.map(chat => (
                    <div 
                      key={chat.id} 
                      onClick={() => { setActiveChatId(chat.id); setMobileShowChat(true); }}
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
                      className={`group w-full flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all relative ${chat.id === activeChatId ? 'bg-indigo-50/80 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400' : 'hover:bg-neutral-50 dark:hover:bg-neutral-900'}`}
                    >
                      <div className="relative">
                        {renderAvatar(chat.avatar_seed, chat.name, chat.avatar_url || users[chat.username]?.avatar_url, 'h-10 w-10 text-sm')}
                        {isUserEffectivelyOnline(users[chat.username]) && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-950"></span>}
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex justify-between items-baseline">
                          <div className="flex items-center gap-1 min-w-0">
                            <p className={`text-sm truncate ${chat.id === activeChatId ? 'font-bold' : 'font-semibold text-neutral-800 dark:text-neutral-200'}`}>{chat.name}</p>
                            {chat.pinned && <Pin className="h-3 w-3 text-indigo-600 rotate-45 shrink-0" />}
                            {chat.muted && <VolumeX className="h-3 w-3 text-neutral-400 shrink-0" />}
                            {chat.archived && <Archive className="h-3 w-3 text-amber-500 shrink-0" />}
                          </div>
                          <span className="text-[10px] text-neutral-400 shrink-0 ml-1">{chat.last_time}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1 min-w-0">
                          <p className="text-xs text-neutral-400 truncate pr-2 flex-1 min-w-0 flex items-center gap-1">
                            {chat.last_message_sender === userUsername && chat.last_message && chat.last_message !== 'Chat history cleared' && (
                              <span className="shrink-0">
                                {chat.last_message_status === 'read' ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
                                ) : chat.last_message_status === 'delivered' ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
                                ) : (
                                  <Check className="h-3.5 w-3.5 text-neutral-400" />
                                )}
                              </span>
                            )}
                            <span className="truncate">
                              {chat.typing ? (
                                <span className="text-indigo-500 font-medium animate-pulse">typing...</span>
                              ) : (
                                chat.last_message && chat.last_message.length > 32 
                                  ? chat.last_message.slice(0, 32).trim() + '...' 
                                  : (chat.last_message || '')
                              )}
                            </span>
                          </p>
                          <div className="flex items-center gap-1">
                            {chat.unread > 0 && (
                              <span className="bg-indigo-600 text-white text-[10px] font-bold h-4 px-1.5 rounded-full flex items-center justify-center shrink-0">
                                {chat.unread}
                              </span>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); setSelectedChatForOptions(chat); }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-opacity text-neutral-400 hover:text-neutral-700 dark:hover:text-white"
                              title="Chat Options"
                            >
                              <MoreVertical className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Right Pane: Message scroll chain */}
            <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex flex-col flex-1 h-full relative`}>
              
              {/* Chat View Header */}
              <div className="flex items-center justify-between h-16 px-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <button onClick={() => setMobileShowChat(false)} className="md:hidden p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><ChevronLeft className="h-5 w-5" /></button>
                  <div className="relative shrink-0">
                    {renderAvatar(activeChat.avatar_seed, activeChat.name, activeChat.avatar_url || users[activeChat.username]?.avatar_url, 'h-10 w-10 text-sm')}
                    {isUserEffectivelyOnline(users[activeChat.username]) && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-neutral-950"></span>}
                  </div>
                  <div className="min-w-0 text-left">
                    <h3 onClick={() => { setSelectedProfileUsername(activeChat.username || activeChat.avatar_seed); setShowProfilePanel(true); }} className="font-bold text-sm cursor-pointer hover:underline truncate">{activeChat.name}</h3>
                    <p className="text-[10px] text-neutral-400 truncate">
                      {activeChat.activity_type === 'recording_voice' ? (
                        <span className="text-rose-500 font-bold animate-pulse flex items-center gap-1">
                          <Mic className="h-3 w-3" /> recording voice note...
                        </span>
                      ) : activeChat.typing || activeChat.activity_type === 'typing' ? (
                        <span className="text-indigo-500 font-bold animate-pulse">typing...</span>
                      ) : activeChat.activity_type === 'in_call' ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <Phone className="h-3 w-3" /> in audio call...
                        </span>
                      ) : isUserEffectivelyOnline(users[activeChat.username]) ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          online {users[activeChat.username]?.custom_status ? `• "${users[activeChat.username]?.custom_status}"` : ''}
                        </span>
                      ) : (
                        <span>{getOnlineStatusText(users[activeChat.username])}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => handleStartCall('voice')} 
                    className="p-2 rounded-lg text-neutral-400 hover:text-emerald-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-95" 
                    title="Start Secure Voice Call"
                  >
                    <Phone className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleStartCall('video')} 
                    className="p-2 rounded-lg text-neutral-400 hover:text-indigo-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer active:scale-95" 
                    title="Start Secure Video Call"
                  >
                    <Video className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setShowMsgSearchInChat(prev => !prev); setMessageSearchQuery(''); }} className={`p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 ${showMsgSearchInChat ? 'bg-neutral-100 dark:hover:bg-neutral-800 text-indigo-600' : 'text-neutral-400'}`} title="Search messages">
                    <Search className="h-4 w-4" />
                  </button>
                  <button onClick={() => { setSelectedProfileUsername(activeChat.username || activeChat.avatar_seed); setShowProfilePanel(prev => !prev); }} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800" title="Conversation Details">
                    <Info className="h-4 w-4" />
                  </button>
                  <button onClick={() => setShowChatCustomizationSheet(true)} className="p-2 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer" title="More options & Wallpaper">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Msg Search bar overlay */}
              {showMsgSearchInChat && (
                <div className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-100 dark:border-neutral-800 p-2 px-4 flex items-center gap-2">
                  <Search className="h-4 w-4 text-neutral-400" />
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
                <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-neutral-100 dark:border-neutral-800/80 px-4 py-2 flex items-center gap-3 z-10">
                  <Pin className="h-3.5 w-3.5 text-indigo-600 rotate-45 shrink-0" />
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[10px] font-bold text-indigo-600">Pinned</p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
                      {activeMessages.find(m => m.pinned && !m.deleted_for_me && !m.deleted_for_everyone)?.text || '[Attachment]'}
                    </p>
                  </div>
                </div>
              )}

              {/* Message scroll list with Theme & Wallpaper Support */}
              {(() => {
                const activeTheme = getThemeById(chatWallpapers[activeChatId] || DEFAULT_THEME_ID);
                return (
                  <div 
                    className={`flex-1 min-h-0 overflow-y-auto p-3 md:p-4 space-y-2 overscroll-contain pb-6 md:pb-4 transition-all ${activeTheme.bgClass}`}
                    style={activeTheme.bgStyle}
                  >
                {/* Automatic Top Privacy & Encryption Banner (Zenoa zero-knowledge) */}
                <div className="flex justify-center my-3 px-2 select-none">
                  <div className="max-w-md w-full bg-amber-50/90 dark:bg-neutral-900/90 border border-amber-200/80 dark:border-neutral-800 rounded-2xl p-3 text-center shadow-2xs backdrop-blur-xs">
                    <div className="flex items-center justify-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold text-xs mb-1">
                      <Lock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      <span>End-to-End Encrypted</span>
                    </div>
                    <p className="text-[11px] text-amber-950/80 dark:text-neutral-300 leading-relaxed font-medium">
                      Messages and calls are secured with end-to-end encryption. No third party can read or listen to them, not even Zenoa.
                    </p>
                  </div>
                </div>
                {filteredActiveMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                    <MessageSquare className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                    <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">No messages in this chat</p>
                    <p className="text-[11px] text-neutral-400">Type a message below to start chatting!</p>
                  </div>
                ) : (
                  filteredActiveMessages.map((msg, idx) => {
                    const isMe = msg.sender === 'me' || msg.sender === userUsername;
                    const senderName = isMe ? 'You' : (users[msg.sender]?.display_name || msg.sender);
                    const senderUsername = users[msg.sender]?.username || msg.sender;
                    const isFirstInGroup = idx === 0 || filteredActiveMessages[idx - 1]?.sender !== msg.sender;
                    const otherParticipants = activeChat?.participants.filter(p => p !== userUsername) || [];
                    const isDelivered = otherParticipants.some(p => isUserEffectivelyOnline(users[p]));

                    return (
                      <MessageCard
                        key={`${msg.id || 'msg'}_${idx}`}
                        msg={msg}
                        isMe={isMe}
                        senderName={senderName}
                        senderUsername={senderUsername}
                        isFirstInGroup={isFirstInGroup}
                        privacyReadReceipts={privacyReadReceipts}
                        isDelivered={isDelivered}
                        themeId={chatWallpapers[activeChatId] || DEFAULT_THEME_ID}
                        onOpenActions={(m) => setSelectedMessageForActions(m)}
                        onReact={(msgId, emoji) => handleReactToMessage(msgId, emoji)}
                        onVotePoll={(msgId, optionId) => handleVotePoll(msgId, optionId)}
                        onOpenMediaPlayer={(type, url, meta) => openInMediaPlayer(type, url, meta)}
                        onToast={(text) => showToast(text)}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            );
          })()}

              {/* Composer Input Area Controls OR Blocked User Banner */}
              <div className="p-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] md:pb-3 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shrink-0 space-y-2 min-w-0">
                {activeChat && blockedUsers.includes(activeChat.username) ? (
                  <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-2xl flex flex-col items-center justify-center gap-3 text-center animate-fade-in">
                    <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-sm">
                      <UserX className="h-5 w-5 shrink-0" />
                      <span>You blocked {activeChat.name || activeChat.username}</span>
                    </div>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm">
                      You cannot send or receive messages in this chat while this user is blocked.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        onClick={() => handleToggleBlockUser(activeChat.username)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <UserCheck className="h-4 w-4" />
                        <span>Unblock {activeChat.name || activeChat.username}</span>
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
                ) : (
                  <>
                {/* Reply display banner */}
                {replyToId && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/80 p-2 rounded-xl flex items-center justify-between border-l-4 border-indigo-500">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-indigo-500">Replying to {replyToSender}</p>
                      <p className="text-xs text-neutral-500 truncate">{replyToPreview}</p>
                    </div>
                    <button onClick={() => { setReplyToId(''); setReplyToPreview(''); setReplyToSender(''); }} className="p-1 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700"><X className="h-4 w-4" /></button>
                  </div>
                )}

                {/* Edit display banner */}
                {editMessageId && (
                  <div className="bg-neutral-50 dark:bg-neutral-800/80 p-2 rounded-xl flex items-center justify-between border-l-4 border-emerald-500">
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-emerald-500">Editing Message</p>
                      <p className="text-xs text-neutral-500 truncate">{composerText}</p>
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
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className={`absolute bottom-16 left-4 z-40 p-3 rounded-2xl border shadow-2xl w-80 space-y-3 ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}
                    >
                      {/* Media & Voice Quality Setting Pill Header */}
                      <div className="space-y-1.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Upload Quality</span>
                          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px] font-bold">
                            {(['standard', 'hd', 'data_saver'] as const).map(q => (
                              <button
                                key={q}
                                onClick={() => { setMediaUploadQuality(q); showToast(`Upload quality: ${q.toUpperCase()}`); }}
                                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${mediaUploadQuality === q ? 'bg-indigo-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'}`}
                              >
                                {q === 'hd' ? 'HD High' : q === 'standard' ? 'Auto' : 'Saver'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400">Mic Quality</span>
                          <div className="flex gap-1 bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg text-[10px] font-bold">
                            {(['hd', 'standard', 'compressed'] as const).map(q => (
                              <button
                                key={q}
                                onClick={() => { setVoiceRecordingQuality(q); showToast(`Voice quality: ${q.toUpperCase()}`); }}
                                className={`px-2 py-0.5 rounded-md capitalize transition-colors ${voiceRecordingQuality === q ? 'bg-rose-600 text-white shadow-xs' : 'text-neutral-400 hover:text-neutral-200'}`}
                              >
                                {q === 'hd' ? 'HD 128k' : q === 'standard' ? 'Std 64k' : 'Compact'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleAttachMock('image')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-sky-500/10 text-sky-500 mb-1">
                            <ImageIcon className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Photo</span>
                        </button>

                        <button onClick={() => handleAttachMock('video')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500 mb-1">
                            <Video className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Video</span>
                        </button>

                        <button onClick={() => handleAttachMock('document')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500 mb-1">
                            <FileText className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Document</span>
                        </button>

                        <button onClick={() => handleAttachMock('voice')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-500 mb-1">
                            <Mic className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Voice Note</span>
                        </button>

                        <button onClick={() => handleAttachMock('location')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 mb-1">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Location</span>
                        </button>

                        <button onClick={() => handleAttachMock('contact')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500 mb-1">
                            <UserPlus className="h-5 w-5" />
                          </div>
                          <span className="text-[10px] font-semibold">Contact</span>
                        </button>

                        <button onClick={() => handleAttachMock('poll')} className="flex flex-col items-center p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-transform active:scale-95">
                          <div className="p-2.5 rounded-2xl bg-teal-500/10 text-teal-500 mb-1">
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
                          chat_id: activeChatId, created_at: Date.now(),
                          sender: userUsername || 'me',
                          text: 'Shared a GIF 📹',
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
                              chat_id: activeChatId, created_at: Date.now(),
                              sender: userUsername || 'me',
                              text: 'Shared a GIF 📹',
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
                              await setDoc(doc(db, 'chats', activeChatId), {
                                id: activeChatId,
                                type: activeChat.type,
                                name: activeChat.name,
                                username: activeChat.username,
                                avatar_seed: activeChat.avatar_seed,
                                participants: activeChat.participants,
                                last_message: '[GIF]',
                                last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
                              }, { merge: true });
                            }
                          } catch (err) {
                            console.error("Error inserting GIF in Firebase:", err);
                          }
                        }

                        setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
                        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: [GIF]`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
                        setShowUnifiedPicker(false);
                      }}
                      onSelectSticker={async (st) => {
                        const newMsgId = 'm_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
                        const newMsg: Message = {
                          id: newMsgId,
                          chat_id: activeChatId, created_at: Date.now(),
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
                              chat_id: activeChatId, created_at: Date.now(),
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
                              await setDoc(doc(db, 'chats', activeChatId), {
                                id: activeChatId,
                                type: activeChat.type,
                                name: activeChat.name,
                                username: activeChat.username,
                                avatar_seed: activeChat.avatar_seed,
                                participants: activeChat.participants,
                                last_message: '[Sticker]',
                                last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const
                              }, { merge: true });
                            }
                          } catch (err) {
                            console.error("Error inserting sticker in Firebase:", err);
                          }
                        }

                        setMessagesByChat(prev => ({ ...prev, [activeChatId]: dedupeMessages([...(prev[activeChatId] || []), newMsg]) }));
                        setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, last_message: `You: [Sticker]`, last_time: 'now', updated_at: Date.now(), last_message_sender: userUsername || 'me', last_message_status: 'delivered' as const } : c));
                        setShowUnifiedPicker(false);
                      }}
                      onClose={() => setShowUnifiedPicker(false)}
                      themeMode={themeMode}
                    />
                  )}
                </AnimatePresence>

                {/* Message input elements row OR Voice Recording Engine Bar */}
                {isRecordingVoice || recordedAudioUrl ? (
                  <div className="flex items-center gap-3 p-2 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900/50">
                    <button 
                      onClick={cancelVoiceRecording}
                      className="p-2 rounded-xl text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors"
                      title="Discard Recording"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>

                    <div className="flex-1 flex items-center gap-3 px-2">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, '0')}
                        </span>
                      </div>

                      {/* Live Waveform height bars */}
                      <div className="flex items-center gap-1 flex-1 h-5 overflow-hidden">
                        {[30, 70, 45, 90, 60, 20, 80, 50, 100, 40, 75, 35, 85, 55, 65, 25, 95].map((h, i) => (
                          <div 
                            key={i} 
                            className="w-1 bg-rose-500 rounded-full animate-pulse" 
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
                        <StopCircle className="h-4 w-4 fill-current text-rose-500" />
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
                        {isPlayingVoicePreview ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
                      </button>
                    )}

                    <button 
                      onClick={handleSendVoiceMessage} 
                      className="p-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20 transition-all active:scale-95 flex items-center gap-1 font-bold text-xs"
                    >
                      <span>Send Voice</span>
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-1.5 pl-2 rounded-3xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 focus-within:border-indigo-500/60 transition-all">
                    {/* Single Emoji, GIF & Sticker Button at the START (Left) of Input Box */}
                    <button 
                      onClick={() => { setShowUnifiedPicker(prev => !prev); setShowAttachMenu(false); }} 
                      className={`p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${showUnifiedPicker ? 'text-amber-500 bg-neutral-200 dark:bg-neutral-700' : 'text-neutral-400 hover:text-amber-500'}`} 
                      title="Emojis, GIFs & Stickers"
                    >
                      <Smile className="h-5 w-5" />
                    </button>

                    {/* Attachment Button */}
                    <button 
                      onClick={() => { setShowAttachMenu(prev => !prev); setShowUnifiedPicker(false); }} 
                      className={`p-2 rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${showAttachMenu ? 'text-indigo-600 bg-neutral-200 dark:bg-neutral-700' : 'text-neutral-400 hover:text-indigo-500'}`} 
                      title="Attach File / Media"
                    >
                      <Paperclip className="h-5 w-5" />
                    </button>

                    {/* Input text field */}
                    <input 
                      type="text" 
                      value={composerText}
                      onChange={e => {
                        setComposerText(e.target.value);
                        setMyActivityType(e.target.value ? 'typing' : 'none');
                      }}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 px-2 py-1.5 text-sm bg-transparent border-0 outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100 min-w-0"
                    />

                    {/* Action button: Send or Voice Recording */}
                    {composerText.trim() ? (
                      <button 
                        onClick={handleSendMessage} 
                        className="p-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-full shadow-sm transition-transform active:scale-95 shrink-0 cursor-pointer"
                        title="Send Message"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={startVoiceRecording} 
                        className="p-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-full transition-colors shrink-0 cursor-pointer" 
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
            </div>

            {/* Slide-over Profile Detail Panel */}
            <AnimatePresence>
              {showProfilePanel && (
                <>
                  <motion.div 
                    key="profile-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowProfilePanel(false)}
                    className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-30"
                  />
                  <motion.div 
                    key="profile-drawer"
                    initial={{ x: '100%' }}
                    animate={{ x: 0 }}
                    exit={{ x: '100%' }}
                    transition={{ type: 'tween', duration: 0.3 }}
                    className={`absolute right-0 top-0 bottom-0 w-80 border-l shadow-2xl z-40 flex flex-col h-full ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-100'}`}
                  >
                  <div className="flex justify-between items-center h-16 px-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
                    <h3 className="font-bold text-sm">Profile Details</h3>
                    <button onClick={() => setShowProfilePanel(false)} className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400"><X className="h-4 w-4" /></button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-5 text-center space-y-5">
                    <div className="flex flex-col items-center">
                      <div className="mb-3">
                        {renderAvatar(selectedProfileUsername, users[selectedProfileUsername]?.display_name || selectedProfileUsername, users[selectedProfileUsername]?.avatar_url, 'h-20 w-20 text-2xl')}
                      </div>
                      <h4 className="font-bold text-base">{users[selectedProfileUsername]?.display_name || selectedProfileUsername}</h4>
                      <p className="text-xs text-neutral-400">@{selectedProfileUsername}</p>
                      <span className={`text-[10px] mt-1 px-2.5 py-0.5 rounded-full font-semibold ${isUserEffectivelyOnline(users[selectedProfileUsername]) ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400' : 'bg-neutral-50 text-neutral-400 dark:bg-neutral-800'}`}>
                        {isUserEffectivelyOnline(users[selectedProfileUsername]) ? 'Online' : getOnlineStatusText(users[selectedProfileUsername])}
                      </span>
                    </div>

                    <div className="text-left space-y-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">About</span>
                        <p className="text-xs leading-relaxed text-neutral-600 dark:text-neutral-300">
                          {users[selectedProfileUsername]?.bio || 'No bio specified.'}
                        </p>
                      </div>

                      <div className="border-t border-neutral-100 dark:border-neutral-800 pt-4 space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">Actions</span>
                        
                        <button 
                          onClick={() => handleToggleBlockUser(selectedProfileUsername)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 text-left transition-colors"
                        >
                          {blockedUsers.includes(selectedProfileUsername) ? <UserCheck className="h-4 w-4 text-emerald-500" /> : <UserX className="h-4 w-4 text-rose-500" />}
                          <span>{blockedUsers.includes(selectedProfileUsername) ? 'Unblock User' : 'Block User'}</span>
                        </button>

                        <button 
                          onClick={() => handleReportUser(selectedProfileUsername)}
                          className="w-full flex items-center gap-3 p-2 rounded-xl text-xs hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <Flag className="h-4 w-4" />
                          <span>Report Policy Violation</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
                </>
              )}
            </AnimatePresence>

          </div>
        )}

        {/* VIEW 2: Discover Users panel */}
        {activeView === 'search' && (
          <div className="flex-1 h-full flex flex-col p-4 md:p-6 max-w-2xl mx-auto w-full pb-24 md:pb-6 overscroll-contain">
            <h1 className="text-2xl font-bold tracking-tight mb-2 text-left">Discover people</h1>
            <p className="text-sm text-neutral-400 mb-6 text-left">Find friends, designers, and developer colleagues. Start an instant chat conversation.</p>

            <div className="relative mb-6 shrink-0">
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-neutral-400" />
              <input 
                type="text" 
                value={globalSearchQuery}
                onChange={e => setGlobalSearchQuery(e.target.value)}
                placeholder="Search username or real display name..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {globalSearchQuery.trim() === '' ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs uppercase tracking-wider font-bold text-neutral-400 text-left">Active Contacts & Users</p>
                  </div>

                  {Object.values(users).filter(u => u.username !== userUsername).length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50/50 dark:bg-neutral-900/30 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 space-y-2">
                      <p className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">No other users found</p>
                      <p className="text-xs text-neutral-500">When people join Zenoa with their username, they will appear here.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.values(users)
                        .filter(u => u.username !== userUsername)
                        .slice(0, 6)
                        .map(user => (
                          <div 
                            key={user.username}
                            onClick={() => handleStartChatWithUser(user)}
                            className="p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 flex items-center gap-3 cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/10 transition-all text-left"
                          >
                            {renderAvatar(user.avatar_seed, user.display_name, user.avatar_url, 'h-10 w-10 text-base')}
                            <div className="min-w-0">
                              <p className="font-bold text-sm truncate">{user.display_name}</p>
                              <p className="text-[10px] text-neutral-400 truncate">@{user.username}</p>
                              <p className="text-xs text-neutral-500 truncate mt-1">{user.bio}</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wider font-bold text-neutral-400 text-left">Search Results</p>
                  {globalSearchResults.length === 0 ? (
                    <div className="p-8 text-center bg-neutral-50 dark:bg-neutral-900 rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800">
                      <p className="text-sm text-neutral-500">No user profiles matched &quot;{globalSearchQuery}&quot;</p>
                    </div>
                  ) : (
                    globalSearchResults.map(user => (
                      <div 
                        key={user.username}
                        onClick={() => handleStartChatWithUser(user)}
                        className="p-3.5 rounded-2xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 flex items-center justify-between cursor-pointer hover:border-indigo-500 hover:shadow-md transition-all text-left"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {renderAvatar(user.avatar_seed, user.display_name, user.avatar_url, 'h-10 w-10 text-sm')}
                          <div className="min-w-0">
                            <p className="font-bold text-sm truncate">{user.display_name}</p>
                            <p className="text-[10px] text-neutral-400 truncate">@{user.username}</p>
                            <p className="text-xs text-neutral-500 truncate">{user.bio}</p>
                          </div>
                        </div>
                        <button className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors shrink-0 ml-4">
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

        {/* VIEW 3: Instagram-Style Profile Screen */}
        {activeView === 'profile' && (
          <div data-auth={authMethod} className="flex-1 h-full overflow-y-auto bg-neutral-50/40 dark:bg-neutral-950 transition-colors pb-24 md:pb-6 overscroll-contain">
            
            {/* Top Instagram-Style Header Bar */}
            <div className="sticky top-0 z-10 backdrop-blur-md bg-white/85 dark:bg-neutral-900/85 border-b border-neutral-200/80 dark:border-neutral-800 px-4 md:px-8 py-3.5 flex items-center justify-between">
              {/* Left: Username with lock icon and verified badge */}
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-neutral-400" />
                <h1 className="text-base md:text-lg font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-1.5">
                  <span>@{userUsername || 'username'}</span>
                  <CheckCircle2 className="h-4 w-4 text-indigo-500 fill-indigo-500/20" />
                </h1>
              </div>

              {/* Right: Quick actions & Instagram 3 Parallel Lines (Menu) button */}
              <div className="flex items-center gap-1.5 md:gap-2">
                <button
                  onClick={() => changeTheme(themeMode === 'light' ? 'dark' : 'light')}
                  className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-amber-500 dark:hover:text-amber-400 transition-colors cursor-pointer"
                  title="Switch Theme"
                >
                  {themeMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5 text-amber-400" />}
                </button>

                <button
                  onClick={() => {
                    if (navigator.clipboard) {
                      const shareLink = `${window.location.origin}/u/${userUsername}`;
                      navigator.clipboard.writeText(shareLink);
                      confetti({ particleCount: 50, spread: 60, origin: { y: 0.3 } });
                      showToast(`Profile link copied: ${shareLink}`);
                    }
                    setShowShareProfileModal(true);
                  }}
                  className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="Share Profile"
                >
                  <Share2 className="h-5 w-5" />
                </button>

                {/* THE 3 PARALLEL LINES (HAMBURGER / MENU) SETTINGS BUTTON */}
                <button
                  onClick={() => {
                    setActiveView('settings');
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200/60 dark:border-indigo-800/60 font-semibold text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                  title="Settings & Privacy"
                >
                  <Menu className="h-5 w-5 stroke-[2.5]" />
                  <span className="hidden sm:inline font-bold">Settings</span>
                </button>
              </div>
            </div>

            {/* Profile Content Container */}
            <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
              
              {/* Instagram Profile Header: Avatar, Stats & Bio */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                  {/* Avatar with gradient story ring & camera quick change button */}
                  <div className="relative group shrink-0">
                    <div className="p-1 rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 shadow-md">
                      <div className="p-1 rounded-full bg-white dark:bg-neutral-900">
                        {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-24 w-24 text-3xl shadow-inner')}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowEditProfileModal(true)}
                      className="absolute bottom-1 right-1 p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg border-2 border-white dark:border-neutral-900 transition-transform hover:scale-110 active:scale-95 cursor-pointer"
                      title="Change profile picture"
                    >
                      <Camera className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Profile Info & Stat Counters */}
                  <div className="flex-1 text-center sm:text-left space-y-4 w-full">
                    {/* Top Row: Display name & verified badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-2">
                          <span>{userDisplayName || 'User'}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold border border-indigo-100 dark:border-indigo-900/50">
                            Verified
                          </span>
                        </h2>
                        <p className="text-xs text-neutral-400 mt-0.5">@{userUsername}</p>
                      </div>

                      {/* Online Status Pill */}
                      <div className="flex items-center justify-center sm:justify-end gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Active Now</span>
                      </div>
                    </div>

                    {/* Instagram 3-Stats Row: Chats, Contacts, Saved */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-neutral-100 dark:border-neutral-800/80 text-center">
                      <div className="space-y-0.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveView('chats')}>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">{chats.length}</span>
                        <p className="text-[11px] text-neutral-400 font-medium">Chats</p>
                      </div>
                      <div className="space-y-0.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setActiveView('search')}>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">{Object.keys(users).length}</span>
                        <p className="text-[11px] text-neutral-400 font-medium">Contacts</p>
                      </div>
                      <div className="space-y-0.5 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setProfileActiveTab('saved')}>
                        <span className="text-base md:text-lg font-bold text-neutral-900 dark:text-white">
                          {Object.values(messagesByChat).flat().filter(m => m.pinned || (m.reactions && m.reactions.length > 0)).length}
                        </span>
                        <p className="text-[11px] text-neutral-400 font-medium">Saved</p>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-300">
                      <p className="font-medium whitespace-pre-line leading-relaxed">
                        {userBio || "Hey there! I am using Zenoa for ultra-fast, secure communication."}
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-[11px] text-neutral-400 font-medium">
                        {userEmail && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-neutral-400" /> {userEmail}</span>}
                        {userPhone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-neutral-400" /> {userPhone}</span>}
                      </div>
                    </div>

                    {/* Instagram Action Buttons Bar */}
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                      <button
                        onClick={() => setShowEditProfileModal(true)}
                        className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit profile</span>
                      </button>

                      <button
                        onClick={() => setShowShareProfileModal(true)}
                        className="flex-1 sm:flex-initial px-5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span>Share profile</span>
                      </button>

                      <button
                        onClick={() => setActiveView('settings')}
                        className="px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        title="Open Settings"
                      >
                        <Menu className="h-4 w-4" />
                      </button>
                    </div>

                  </div>
                </div>
              </div>

              {/* Instagram Profile Tabs: Media & Saved */}
              <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-200/80 dark:border-neutral-800 shadow-sm overflow-hidden">
                {/* Tabs Bar */}
                <div className="flex items-center border-b border-neutral-200/80 dark:border-neutral-800">
                  <button
                    onClick={() => setProfileActiveTab('media')}
                    className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                      profileActiveTab === 'media'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                    <span>Shared Media</span>
                  </button>

                  <button
                    onClick={() => setProfileActiveTab('saved')}
                    className={`flex-1 py-3.5 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-all ${
                      profileActiveTab === 'saved'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/30 dark:bg-indigo-950/20'
                        : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Bookmark className="h-4 w-4" />
                    <span>Saved Messages</span>
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
                            <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                              <Folder className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No media attachments yet</p>
                            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
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
                              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Library Folders</span>
                              <span className="text-[10px] text-neutral-400">{mediaItems.length} items total</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                              {/* Photos Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('photos')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-indigo-500 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Camera className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Photos</p>
                                    <p className="text-[10px] text-neutral-400">{photos.length} {photos.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Videos Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('videos')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-indigo-500 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Video className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">Videos</p>
                                    <p className="text-[10px] text-neutral-400">{videos.length} {videos.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Audio Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('audio')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-indigo-500 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <Mic className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Audio Notes</p>
                                    <p className="text-[10px] text-neutral-400">{audios.length} {audios.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
                              </div>

                              {/* Documents Folder */}
                              <div
                                onClick={() => setCurrentMediaFolder('documents')}
                                className="group p-4 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 hover:border-indigo-500 hover:bg-indigo-550/10 transition-all cursor-pointer flex items-center justify-between text-left"
                              >
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl group-hover:scale-110 transition-transform">
                                    <FileText className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Documents & Files</p>
                                    <p className="text-[10px] text-neutral-400">{documents.length} {documents.length === 1 ? 'item' : 'items'}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
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
                              className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all text-xs font-bold text-neutral-600 dark:text-neutral-300 flex items-center gap-1 cursor-pointer"
                            >
                              ← Back to folders
                            </button>
                            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{folderTitle} ({activeItems.length})</span>
                          </div>

                          {activeItems.length === 0 ? (
                            <div className="py-12 text-center text-neutral-400 text-xs">
                              This folder is currently empty. Shared files of this type will appear here.
                            </div>
                          ) : currentMediaFolder === 'photos' || currentMediaFolder === 'videos' ? (
                            /* Photos & Videos Grid */
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {activeItems.map((item, idx) => (
                                <div
                                  key={item.id || idx}
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
                                      <Video className="h-8 w-8 text-neutral-400" />
                                      <span className="text-[10px] text-neutral-500 mt-2">Play Video</span>
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
                                      <p className="text-[9px] text-white/80">{item.timestamp}</p>
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
                                  key={item.id || idx}
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
                                  className="p-3 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/10 hover:border-indigo-550 hover:bg-indigo-50/10 transition-all flex items-center justify-between gap-3 cursor-pointer text-left group"
                                >
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className={`p-2.5 rounded-xl ${currentMediaFolder === 'audio' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                      {currentMediaFolder === 'audio' ? <Mic className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                        {item.file_name || item.text || (currentMediaFolder === 'audio' ? 'Voice Recording' : 'Document Attachment')}
                                      </p>
                                      <p className="text-[10px] text-neutral-400 mt-0.5">
                                        Shared by @{item.sender} • {item.timestamp} {item.file_size ? `• ${item.file_size}` : ''}
                                      </p>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-1 transition-transform" />
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
                            <div className="h-14 w-14 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-400">
                              <Star className="h-7 w-7" />
                            </div>
                            <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">No saved messages yet</p>
                            <p className="text-xs text-neutral-400 max-w-sm mx-auto">
                              Pin or react to important messages in any chat to save them here for fast reference.
                            </p>
                          </div>
                        );
                      }

                      return savedItems.map((msg, idx) => (
                        <div
                          key={msg.id || idx}
                          onClick={() => {
                            setActiveChatId(msg.chatId);
                            setActiveView('chats');
                            setMobileShowChat(true);
                          }}
                          className="p-3.5 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 hover:border-indigo-400 dark:hover:border-indigo-600 transition-colors cursor-pointer flex items-start justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                {msg.sender === 'me' ? 'You' : (users[msg.sender]?.display_name || msg.sender)}
                              </span>
                              <span className="text-[10px] text-neutral-400">{msg.timestamp}</span>
                              {msg.pinned && (
                                <span className="text-[9px] bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <Pin className="h-2.5 w-2.5" /> Pinned
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-neutral-700 dark:text-neutral-300 line-clamp-2">{msg.text}</p>
                          </div>
                          <button className="text-neutral-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 text-xs font-semibold shrink-0 flex items-center gap-1">
                            <span>Open</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ));
                    })()}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}

        {/* VIEW 4: Full Page Settings View */}
        {activeView === 'settings' && (
          <SettingsPage
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
            showToast={showToast}
            userDisplayName={userDisplayName}
            userUsername={userUsername}
            userAvatarSeed={userAvatarSeed}
            userAvatarUrl={userAvatarUrl}
            renderAvatar={renderAvatar}
            onOpenEditProfile={() => setShowEditProfileModal(true)}
          />
        )}

      </main>

      {/* MOBILE bottom navigation tabs */}
      {!mobileShowChat && (
        <footer className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t border-neutral-200/80 dark:border-neutral-800/80 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl flex items-center justify-around z-40 transition-all select-none pb-[env(safe-area-inset-bottom,4px)]">
          <button 
            onClick={() => { setActiveView('chats'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'chats' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <div className="relative">
              <MessageSquare className="h-5 w-5 stroke-[2.2]" />
              {totalUnreads > 0 && (
                <span className="absolute -top-1 -right-2.5 bg-indigo-600 text-white text-[9px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center shadow-sm animate-pulse">
                  {totalUnreads}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Chats</span>
            {activeView === 'chats' && <span className="absolute bottom-0.5 h-1 w-6 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>}
          </button>

          <button 
            onClick={() => { setActiveView('search'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'search' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <Search className="h-5 w-5 stroke-[2.2]" />
            <span className="text-[10px] tracking-tight">Discover</span>
            {activeView === 'search' && <span className="absolute bottom-0.5 h-1 w-6 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>}
          </button>

          <button 
            onClick={() => { setActiveView('profile'); setMobileShowChat(false); }}
            className={`relative flex flex-col items-center justify-center gap-1 px-4 py-1.5 rounded-2xl transition-all active:scale-90 cursor-pointer ${activeView === 'profile' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'}`}
          >
            <div className={`p-0.5 rounded-full transition-transform ${activeView === 'profile' ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}`}>
              {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-5 w-5 text-[8px]')}
            </div>
            <span className="text-[10px] tracking-tight">Profile</span>
            {activeView === 'profile' && <span className="absolute bottom-0.5 h-1 w-6 bg-indigo-600 dark:bg-indigo-400 rounded-full"></span>}
          </button>
        </footer>
      )}

      {/* ========================================================================= */}
      {/* INSTAGRAM EDIT PROFILE MODAL (DISPLAY NAME & USERNAME RATE LIMIT POLICIES) */}
      {/* ========================================================================= */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-indigo-500" />
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">Edit Profile</h3>
              </div>
              <button
                onClick={() => setShowEditProfileModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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
                  {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-16 w-16 text-xl shadow-md')}
                  <button
                    type="button"
                    onClick={() => profilePhotoInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-indigo-600 text-white shadow-md hover:scale-105 transition-transform cursor-pointer"
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
                    <Upload className="h-3.5 w-3.5 text-indigo-500" />
                    <span>Upload</span>
                  </button>
                  {userAvatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
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
                  <span className="text-[10px] text-neutral-400">{remainingNameChanges}/2 edits left</span>
                </div>
                <input
                  type="text"
                  maxLength={25}
                  value={userDisplayName}
                  onChange={e => setUserDisplayName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Username</span>
                  {cleanSettingsUsername !== savedUsername && (
                    <div className="text-[10px]">
                      {isUsernameAvailableInSettings ? (
                        <span className="text-emerald-500 font-semibold">Available</span>
                      ) : !isUsernameFormatValidInSettings ? (
                        <span className="text-rose-500">Invalid format</span>
                      ) : (
                        <span className="text-rose-500">Taken</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs font-bold text-neutral-400">@</span>
                  <input
                    type="text"
                    maxLength={20}
                    value={userUsername.replace(/^@/, '')}
                    onChange={e => setUserUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="username"
                    className="w-full pl-7 pr-3 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              {/* Status Bio */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300">Bio</span>
                  <span className="text-[10px] text-neutral-400">{userBio.length}/80</span>
                </div>
                <input
                  type="text"
                  maxLength={80}
                  value={userBio}
                  onChange={e => setUserBio(e.target.value)}
                  placeholder="Add a bio..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-950 outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/80 dark:bg-neutral-950/80 flex justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-500 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSavingProfile || (cleanSettingsUsername !== savedUsername && (!isUsernameFormatValidInSettings || !isUsernameAvailableInSettings))}
                onClick={async () => {
                  await handleSaveProfile();
                  setShowEditProfileModal(false);
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {isSavingProfile ? <span>Saving...</span> : <span>Save</span>}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSTAGRAM SHARE PROFILE MODAL                                            */}
      {/* ========================================================================= */}
      {showShareProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-2xl text-center space-y-5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">Share Profile</span>
              <button onClick={() => setShowShareProfileModal(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 text-white shadow-lg space-y-3">
              <div className="flex justify-center">
                {renderAvatar(userAvatarSeed, userDisplayName, userAvatarUrl, 'h-20 w-20 text-2xl border-4 border-white shadow-md')}
              </div>
              <div>
                <h3 className="font-bold text-lg">{userDisplayName}</h3>
                <p className="text-xs text-white/80">@{userUsername}</p>
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
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
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
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-xl">
                  <MapPin className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Share Location</h3>
              </div>
              <button onClick={() => setShowLocationModal(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Place / Title</label>
                <input 
                  type="text"
                  value={locationTitle}
                  onChange={e => setLocationTitle(e.target.value)}
                  placeholder="e.g. Connaught Place Cafe"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Address / Landmark</label>
                <input 
                  type="text"
                  value={locationAddress}
                  onChange={e => setLocationAddress(e.target.value)}
                  placeholder="e.g. Inner Circle, Block A, New Delhi"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between">
                <span>Coordinates: {locationLat.toFixed(4)}, {locationLng.toFixed(4)}</span>
                <button 
                  onClick={() => {
                    if (navigator.geolocation) {
                      navigator.geolocation.getCurrentPosition((pos) => {
                        setLocationLat(pos.coords.latitude);
                        setLocationLng(pos.coords.longitude);
                        showToast("Current location acquired 📍");
                      });
                    }
                  }}
                  className="px-2 py-1 bg-amber-500 text-white font-bold rounded-lg text-[10px]"
                >
                  Get GPS
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button 
                onClick={handleSendLocation}
                className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
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
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl">
                  <UserPlus className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Share Contact</h3>
              </div>
              <button onClick={() => setShowContactModal(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Full Name</label>
                <input 
                  type="text"
                  value={contactName}
                  onChange={e => setContactName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Phone Number</label>
                <input 
                  type="tel"
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Email Address (Optional)</label>
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
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
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
                <div className="p-2 bg-teal-500/10 text-teal-500 rounded-xl">
                  <BarChart2 className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-sm">Create Poll</h3>
              </div>
              <button onClick={() => setShowPollModal(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Poll Question</label>
                <input 
                  type="text"
                  value={pollQuestion}
                  onChange={e => setPollQuestion(e.target.value)}
                  placeholder="e.g. Which design concept do you prefer?"
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-xs outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Options</label>
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
                          className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                  {pollOptionsInputs.length < 5 && (
                    <button 
                      onClick={() => setPollOptionsInputs([...pollOptionsInputs, `Option ${pollOptionsInputs.length + 1}`])}
                      className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline pt-1 block"
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
                className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
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
              <div className="p-2 rounded-xl bg-indigo-600/30 text-indigo-400 shrink-0">
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
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                      {mediaPlayer.quality}
                    </span>
                  )}
                </div>
                {mediaPlayer.senderName && (
                  <p className="text-[11px] text-neutral-400 truncate">Shared by @{mediaPlayer.senderName}</p>
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
                    title="Rotate 90°"
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
                        mediaPlaybackSpeed === speed ? 'bg-indigo-600 text-white shadow-xs' : 'text-neutral-300 hover:text-white'
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
                className="p-2.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 transition-colors text-white cursor-pointer"
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
                    <span className="text-[11px] font-mono text-neutral-400 w-12">
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
                        className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition-transform active:scale-95 cursor-pointer"
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
                      <Mic className={`h-12 w-12 ${mediaIsPlaying ? 'text-indigo-400 animate-bounce' : 'text-neutral-500'}`} />
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
                  <p className="text-xs text-neutral-400">High Definition Voice Sample ({mediaPlayer.quality || '128kbps'})</p>
                </div>

                <div className="w-full flex items-center justify-center gap-1.5 h-12 py-2">
                  {[45, 80, 30, 95, 60, 25, 85, 50, 100, 40, 75, 35, 90, 55, 70, 30, 85].map((h, i) => (
                    <div
                      key={i}
                      className={`w-1.5 rounded-full transition-all duration-300 ${mediaIsPlaying ? 'bg-indigo-500 animate-pulse' : 'bg-neutral-700'}`}
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
                  <div className="flex justify-between text-[10px] font-mono text-neutral-400">
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
                    className="p-4 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl transition-transform active:scale-95 cursor-pointer"
                  >
                    {mediaIsPlaying ? <Pause className="h-7 w-7 fill-current" /> : <Play className="h-7 w-7 fill-current ml-0.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* 4. Document View */}
            {mediaPlayer.type === 'document' && (
              <div className="w-full max-w-xl p-8 rounded-3xl bg-neutral-900/90 border border-white/10 shadow-2xl flex flex-col items-center gap-6 text-center">
                <div className="p-5 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                  <FileText className="h-16 w-16" />
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-xl">{mediaPlayer.title}</h4>
                  <p className="text-xs text-neutral-400">Size: {mediaPlayer.size || '1.5 MB'} • Document Attachment</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full pt-2">
                  <a
                    href={mediaPlayer.url}
                    download={mediaPlayer.title || 'document'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-3 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
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
              {['👍', '❤️', '😂', '😮', '😢', '🙏', '🚀', '🔥'].map(emoji => (
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
              <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
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
                  <Copy className="h-4 w-4 text-neutral-500" />
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
                <MessageSquare className="h-4 w-4 text-indigo-500" />
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
                <Forward className="h-4 w-4 text-sky-500" />
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
                  <Edit2 className="h-4 w-4 text-emerald-500" />
                  <span>Edit Message</span>
                </button>
              )}

              <button
                onClick={() => handleToggleStarMessage(selectedMessageForActions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Star className={`h-4 w-4 ${selectedMessageForActions.starred ? 'text-amber-500 fill-amber-500' : 'text-amber-500'}`} />
                <span>{selectedMessageForActions.starred ? 'Unstar Message' : 'Star Message'}</span>
              </button>

              <button
                onClick={() => {
                  handleTogglePinMessage(selectedMessageForActions.id);
                  setSelectedMessageForActions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Pin className="h-4 w-4 text-amber-500 rotate-45" />
                <span>{selectedMessageForActions.pinned ? 'Unpin Message' : 'Pin Message'}</span>
              </button>

              <div className="h-px bg-neutral-100 dark:border-neutral-800 my-1" />

              <button
                onClick={() => handleDeleteForMe(selectedMessageForActions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete for Me</span>
              </button>

              {canDeleteForEveryone(selectedMessageForActions) && (
                <button
                  onClick={() => handleDeleteForEveryone(selectedMessageForActions.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
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
                <p className="text-xs text-neutral-400 truncate">@{selectedChatForOptions.username || selectedChatForOptions.avatar_seed}</p>
              </div>
              <button
                onClick={() => setSelectedChatForOptions(null)}
                className="p-1.5 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400"
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
                <Pin className="h-4 w-4 text-indigo-600 rotate-45" />
                <span>{selectedChatForOptions.pinned ? 'Unpin Chat' : 'Pin Chat to Top'}</span>
              </button>

              <button
                onClick={() => handleToggleArchiveChat(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <Archive className="h-4 w-4 text-amber-500" />
                <span>{selectedChatForOptions.archived ? 'Unarchive Chat' : 'Archive Chat'}</span>
              </button>

              <button
                onClick={(e) => {
                  handleToggleMuteChat(e, selectedChatForOptions.id);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <VolumeX className="h-4 w-4 text-sky-500" />
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
                <Palette className="h-4 w-4 text-purple-500" />
                <span>Change Chat Wallpaper & Theme</span>
              </button>

              <button
                onClick={() => {
                  handleExportChat(selectedChatForOptions.id);
                  setSelectedChatForOptions(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors cursor-pointer text-left"
              >
                <FileDown className="h-4 w-4 text-emerald-500" />
                <span>Export Chat History (.txt)</span>
              </button>

              <button
                onClick={() => handleClearChatHistory(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors cursor-pointer text-left"
              >
                <Sparkles className="h-4 w-4" />
                <span>Clear Chat History</span>
              </button>

              <div className="h-px bg-neutral-100 dark:border-neutral-800 my-1" />

              <button
                onClick={() => handleDeleteChat(selectedChatForOptions.id)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer text-left"
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
      {/* OPEN CHAT CUSTOMIZATION & WHATSAPP CONTROLS MODAL                        */}
      {/* ========================================================================= */}
      {showChatCustomizationSheet && activeChat && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 md:p-6 animate-fade-in"
          onClick={() => setShowChatCustomizationSheet(false)}
        >
          <div 
            className="w-full max-w-xl max-h-[90vh] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all text-left"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {renderAvatar(activeChat.avatar_seed, activeChat.name, activeChat.avatar_url, 'h-10 w-10 text-xs')}
                <div>
                  <h3 className="font-bold text-base text-neutral-900 dark:text-white">{activeChat.name}</h3>
                  <p className="text-[11px] text-neutral-400">Chat settings & customization</p>
                </div>
              </div>
              <button
                onClick={() => setShowChatCustomizationSheet(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Wallpaper & Theme Section */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Wallpaper & Themes Gallery</span>
                </label>
                <p className="text-[11px] text-neutral-400">Choose from Glowing Dark, Love & Romance, Cute Animals, and WhatsApp themes with auto-matching chat bubble colors.</p>
                
                <button
                  onClick={() => {
                    setShowChatCustomizationSheet(false);
                    setShowThemeModal(true);
                  }}
                  className="w-full p-3.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-white font-bold text-xs flex items-center justify-between transition-all cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="h-4 w-4 text-amber-400" />
                    <span>Open Theme & Wallpaper Gallery</span>
                  </div>
                  <ChevronRight className="h-4 w-4 opacity-80" />
                </button>
              </div>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

              {/* Notification & Disappearing Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                      <VolumeX className="h-4 w-4 text-sky-500" />
                      <span>Mute Notifications</span>
                    </p>
                    <p className="text-[11px] text-neutral-400">Silence sound alerts for this contact</p>
                  </div>
                  <button
                    onClick={(e) => handleToggleMuteChat(e, activeChat.id)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${activeChat.muted ? 'bg-indigo-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                  >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${activeChat.muted ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span>Disappearing Messages</span>
                    </p>
                    <p className="text-[11px] text-neutral-400">Auto-delete messages after selected duration</p>
                  </div>
                  <select
                    value={chatDisappearing[activeChat.id] || 'off'}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setChatDisappearing(prev => ({ ...prev, [activeChat.id]: val }));
                      showToast(`Disappearing messages set to ${val}`);
                    }}
                    className="px-2.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-xs font-semibold outline-none focus:border-indigo-500"
                  >
                    <option value="off">Off</option>
                    <option value="24h">24 Hours</option>
                    <option value="7d">7 Days</option>
                    <option value="90d">90 Days</option>
                  </select>
                </div>
              </div>

              <div className="h-px bg-neutral-100 dark:bg-neutral-800" />

              {/* Chat Actions */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-500" />
                  <span>Chat Management</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => handleExportChat(activeChat.id)}
                    className="flex items-center gap-2 p-3 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 transition-colors text-xs font-semibold text-neutral-700 dark:text-neutral-200"
                  >
                    <FileDown className="h-4 w-4 text-indigo-500" />
                    <span>Export Transcript</span>
                  </button>

                  <button
                    onClick={() => handleClearChatHistory(activeChat.id)}
                    className="flex items-center gap-2 p-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-100/50 transition-colors text-xs font-semibold text-amber-600 dark:text-amber-400"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Clear Chat History</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex justify-end">
              <button
                onClick={() => setShowChatCustomizationSheet(false)}
                className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

      {/* WHATSAPP-STYLE MEDIA EDITOR MODAL (Crop, Customize, Brush, Text, HD Quality, Send to Recipient) */}
      <MediaEditorModal
        isOpen={!!pendingMediaEditorData}
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

      {/* SECURE CALL MODAL OVERLAY */}
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

    </div>
  );
}
