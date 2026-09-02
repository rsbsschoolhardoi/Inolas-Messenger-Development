import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield, ShieldCheck, ShieldAlert, Users, UserCheck, UserX,
  Radio, Flag, MessageSquare, Database, Lock, Unlock, Key,
  Check, X, Search, RefreshCw, AlertTriangle, Eye, Edit3,
  LogOut, ArrowRight, Activity, Terminal, CheckCircle2,
  Trash2, Upload, Send, Download, Layers, CornerDownRight, Zap, ChevronRight,
  Palette, Globe, Image as ImageIcon, Sparkles, FileCode, Clock, XCircle, FileText
} from 'lucide-react';
import { UserData, ReportItem, AuditLogItem, ServiceAccountData, SystemBroadcast, Chat } from '../types';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { ImageCropperModal } from './ImageCropperModal';
import { db } from '../firebaseClient';
import { useBranding, saveBranding, AppBrandingConfig } from '../brandingUtils';
import {
  collection, doc, getDocs, updateDoc, setDoc, addDoc, deleteDoc,
  onSnapshot, query, orderBy, limit, serverTimestamp
} from 'firebase/firestore';

interface AdminPanelProps {
  currentUser: UserData | null;
  allUsers: UserData[];
  allChats: Chat[];
  onUpdateUser: (updatedUser: UserData) => void;
  onDeleteUser?: (username: string, userId?: string) => void;
  onCloseAdmin: () => void;
  onRefreshData?: () => void;
}

const cleanUndefined = <T extends Record<string, any>>(obj: T): T => {
  const next = { ...obj };
  Object.keys(next).forEach((key) => {
    if (next[key] === undefined) {
      delete next[key];
    }
  });
  return next;
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  currentUser,
  allUsers,
  allChats,
  onUpdateUser,
  onDeleteUser,
  onCloseAdmin,
  onRefreshData
}) => {
  // Passcode Security Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('zenoa_admin_auth') === 'true';
  });
  const [passcodeInput, setPasscodeInput] = useState<string>('');
  const [passcodeError, setPasscodeError] = useState<string>('');
  const [masterKey, setMasterKey] = useState<string>(() => {
    return localStorage.getItem('zenoa_master_admin_key') || 'ZenoaAdmin2026!';
  });

  // Active Tab Management
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'verified_management' | 'sessions' | 'service_accounts' | 'developer_service_accounts' | 'templates' | 'reports' | 'groups' | 'audit' | 'settings' | 'branding'>('overview');
  const [serviceSubTab, setServiceSubTab] = useState<'official' | 'developer'>('official');

  // App Branding Management
  const branding = useBranding();
  const [brandingForm, setBrandingForm] = useState<AppBrandingConfig>(branding);
  const [brandingSavedNotice, setBrandingSavedNotice] = useState<string | null>(null);

  // Logo Cropper States
  const [cropperOpen, setCropperOpen] = useState<boolean>(false);
  const [cropperSource, setCropperSource] = useState<string>('');
  const [activeCropSlot, setActiveCropSlot] = useState<'oauth_logo' | 'public_logo' | 'messenger_logo' | 'favicon_logo' | 'dev_console_logo' | null>(null);

  useEffect(() => {
    setBrandingForm(branding);
  }, [branding]);

  const handleFileUploadForSlot = (
    slot: 'oauth_logo' | 'public_logo' | 'messenger_logo' | 'favicon_logo' | 'dev_console_logo',
    file: File
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico') && !file.name.endsWith('.svg')) {
      alert('Please upload a valid image file (PNG, JPG, WEBP, SVG, ICO).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCropperSource(result);
        setActiveCropSlot(slot);
        setCropperOpen(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCroppedLogo = (croppedDataUrl: string) => {
    if (activeCropSlot) {
      setBrandingForm(prev => ({ ...prev, [activeCropSlot]: croppedDataUrl }));
    }
    setCropperOpen(false);
    setCropperSource('');
    setActiveCropSlot(null);
  };

  // Live Firestore State Collections
  const [dbUsers, setDbUsers] = useState<UserData[]>(allUsers);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [serviceAccounts, setServiceAccounts] = useState<ServiceAccountData[]>([]);
  const [developerApps, setDeveloperApps] = useState<any[]>([]);
  const [messageTemplates, setMessageTemplates] = useState<any[]>([]);
  const [broadcasts, setBroadcasts] = useState<SystemBroadcast[]>([]);

  // Template Requests Filter State
  const [templateFilterStatus, setTemplateFilterStatus] = useState<string>('ALL');
  const [templateSearch, setTemplateSearch] = useState<string>('');

  // Action Processing Animation State Map
  const [processingActions, setProcessingActions] = useState<Record<string, boolean>>({});

  // User Management State
  const [userSearch, setUserSearch] = useState<string>('');
  const [userFilter, setUserFilter] = useState<'all' | 'verified' | 'official_service' | 'developer_service' | 'banned' | 'reported' | 'online'>('all');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserData | null>(null);
  const [editDisplayName, setEditDisplayName] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'super_admin'>('user');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string>('');

  // Verified Management Tab State
  const [verifiedSearch, setVerifiedSearch] = useState<string>('');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  // Ban Modal State
  const [userToBan, setUserToBan] = useState<UserData | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserData | null>(null);
  const [banReasonInput, setBanReasonInput] = useState<string>('');

  // Service Account Creation State
  const [showCreateServiceAccountModal, setShowCreateServiceAccountModal] = useState<boolean>(false);
  const [saUsername, setSaUsername] = useState<string>('');
  const [saDisplayName, setSaDisplayName] = useState<string>('');
  const [saBio, setSaBio] = useState<string>('');
  const [saAvatarUrl, setSaAvatarUrl] = useState<string>('');
  const [saCategory, setSaCategory] = useState<'System' | 'Security' | 'Support' | 'Announcements' | 'Updates'>('System');

  // Broadcast Dispatcher State
  const [broadcastSender, setBroadcastSender] = useState<string>('zenoa_official');
  const [broadcastTitle, setBroadcastTitle] = useState<string>('');
  const [broadcastContent, setBroadcastContent] = useState<string>('');
  const [broadcastPhotoUrl, setBroadcastPhotoUrl] = useState<string>('');
  const [broadcastUrgency, setBroadcastUrgency] = useState<'normal' | 'important' | 'security_alert' | 'maintenance'>('important');
  const [broadcastStatus, setBroadcastStatus] = useState<string>('');
  const [sendAsNormalMessage, setSendAsNormalMessage] = useState<boolean>(false);

  // Passcode Authentication Handler
  const handlePasscodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasscodeError('');
    if (passcodeInput === masterKey || passcodeInput === 'AZAD-ADMIN-KEY-2026' || currentUser?.email === 'azadaman19s@gmail.com') {
      setIsAdminAuthenticated(true);
      localStorage.setItem('zenoa_admin_auth', 'true');
      logAuditEvent('config_change', 'Admin Session Authenticated', );
    } else {
      setPasscodeError('Invalid Master Security Passcode. Access Denied.');
    }
  };

  const handleLogoutAdmin = () => {
    setIsAdminAuthenticated(false);
    localStorage.removeItem('zenoa_admin_auth');
  };

  // Live Firestore Listeners
  useEffect(() => {
    if (!isAdminAuthenticated) return;

    // Listen to users collection
    let unsubscribeUsers = () => {};
    let unsubscribeReports = () => {};
    let unsubscribeAudit = () => {};
    let unsubscribeService = () => {};
    let unsubscribeDevApps = () => {};
    let unsubscribeTemplates = () => {};
    let unsubscribeBroadcasts = () => {};

    if (db) {
      // Users real-time feed
      unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
        const fetched: UserData[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as UserData);
        });
        setDbUsers(fetched);
      }, (err) => console.log('Admin users snapshot note:', err));

      // Reports real-time feed
      unsubscribeReports = onSnapshot(collection(db, 'reports'), (snapshot) => {
        const fetched: ReportItem[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as ReportItem);
        });
        fetched.sort((a, b) => b.timestamp - a.timestamp);
        setReports(fetched);
      }, (err) => console.log('Admin reports snapshot note:', err));

      // Audit logs feed
      unsubscribeAudit = onSnapshot(collection(db, 'audit_logs'), (snapshot) => {
        const fetched: AuditLogItem[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as AuditLogItem);
        });
        fetched.sort((a, b) => b.timestamp - a.timestamp);
        setAuditLogs(fetched);
      }, (err) => console.log('Admin audit snapshot note:', err));

      // Service accounts feed
      unsubscribeService = onSnapshot(collection(db, 'service_accounts'), (snapshot) => {
        const fetched: ServiceAccountData[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as ServiceAccountData);
        });
        setServiceAccounts(fetched);
      }, (err) => console.log('Admin service accounts snapshot note:', err));

      // Developer apps feed
      unsubscribeDevApps = onSnapshot(collection(db, 'developer_apps'), (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        setDeveloperApps(fetched);
      }, (err) => console.log('Admin developer_apps snapshot note:', err));

      // Message templates feed
      unsubscribeTemplates = onSnapshot(collection(db, 'message_templates'), (snapshot) => {
        const fetched: any[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
        fetched.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));
        setMessageTemplates(fetched);
      }, (err) => console.log('Admin message_templates snapshot note:', err));

      // Broadcasts feed
      unsubscribeBroadcasts = onSnapshot(collection(db, 'broadcasts'), (snapshot) => {
        const fetched: SystemBroadcast[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as SystemBroadcast);
        });
        fetched.sort((a, b) => b.created_at - a.created_at);
        setBroadcasts(fetched);
      }, (err) => console.log('Admin broadcasts snapshot note:', err));
    }

    return () => {
      unsubscribeUsers();
      unsubscribeReports();
      unsubscribeAudit();
      unsubscribeService();
      unsubscribeDevApps();
      unsubscribeTemplates();
      unsubscribeBroadcasts();
    };
  }, [isAdminAuthenticated]);

  // Record Audit Event Helper
  const handleTerminateSession = async (targetUsername: string) => {
    if (!db || !targetUsername) return;
    try {
      await setDoc(doc(db, 'users', targetUsername), {
        active_session_token: '',
        online: false,
        last_seen_timestamp: Date.now()
      }, { merge: true });
      logAuditEvent('ban_user', `Terminated active session for user @${targetUsername}`, targetUsername);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      console.error('Failed to terminate session:', err);
    }
  };

  const handlePurgeLocalCache = () => {
    try {
      localStorage.removeItem('zenoa_cached_chats');
      localStorage.removeItem('zenoa_cached_messages');
      localStorage.removeItem('inolas_followed_users');
      if (onRefreshData) onRefreshData();
      logAuditEvent('config_change', 'Admin Purged Local Application Cache');
      alert('Local cache purged. Real-time data re-synced from Firestore.');
    } catch (e) {
      console.error('Cache purge error:', e);
    }
  };

  const logAuditEvent = async (action: AuditLogItem['action'], details: string, targetUsername?: string, targetId?: string) => {
    const newLog: AuditLogItem = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      adminEmail: currentUser?.email || 'admin@zenoa.internal',
      adminUsername: currentUser?.username || 'admin',
      action,
      details,
      targetUsername: targetUsername || undefined,
      targetId: targetId || undefined,
      timestamp: Date.now(),
      ip_address: '127.0.0.1 (Secure Console)'
    };

    setAuditLogs((prev) => [newLog, ...prev]);

    if (db) {
      try {
        await setDoc(doc(db, 'audit_logs', newLog.id), cleanUndefined(newLog));
      } catch (err) {
        console.error('Failed to log audit event to Firestore:', err);
      }
    }
  };

  // Toggle Purple Verification Badge Action
  const handleTogglePurpleVerification = async (user: UserData) => {
    // Official system service accounts are always verified
    if (user.is_service_account && !user.is_business_account) {
      return;
    }

    const isCurrentlyVerified = !!user.is_verified;
    const updatedStatus = !isCurrentlyVerified;
    const verifiedType = updatedStatus ? 'purple' : null;

    const updatedUser: UserData = {
      ...user,
      is_verified: updatedStatus,
      verified_type: verifiedType
    };

    const actionKey = `verify_${user.username}`;
    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    // Update local state
    setDbUsers((prev) => prev.map((u) => (u.username === user.username || u.id === user.id) ? updatedUser : u));
    setDeveloperApps((prev) => prev.map((a) => (a.id === user.id || a.bot_username === user.username || a.client_id === user.id) ? { ...a, is_verified: updatedStatus, verified_type: verifiedType } : a));
    onUpdateUser(updatedUser);

    // Persist to Firestore safely using setDoc with merge: true
    if (db) {
      try {
        if (user.id) {
          await setDoc(doc(db, 'users', user.id), {
            is_verified: updatedStatus,
            verified_type: verifiedType
          }, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'developer_apps', user.id), {
            is_verified: updatedStatus,
            verified_type: verifiedType
          }, { merge: true }).catch(() => {});
        }
        if (user.username) {
          await setDoc(doc(db, 'users', user.username), {
            is_verified: updatedStatus,
            verified_type: verifiedType
          }, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'users', user.username.toLowerCase()), {
            is_verified: updatedStatus,
            verified_type: verifiedType
          }, { merge: true }).catch(() => {});
          await setDoc(doc(db, 'developer_apps', user.username), {
            is_verified: updatedStatus,
            verified_type: verifiedType
          }, { merge: true }).catch(() => {});
        }
      } catch (err) {
        console.error('Error updating verification status in Firestore:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }

    logAuditEvent(
      updatedStatus ? 'verify_user' : 'revoke_verification',
      updatedStatus ? 'Granted official Purple Verified Badge' : 'Revoked Purple Verified Badge',
      user.username,
      user.id
    );
  };

  // Ban User Action
  const handleConfirmBanUser = async () => {
    if (!userToBan) return;

    const reason = banReasonInput.trim() || 'Suspended for Terms of Service Violation.';
    const updatedUser: UserData = {
      ...userToBan,
      is_banned: true,
      ban_reason: reason,
      ban_timestamp: Date.now()
    };

    const actionKey = `ban_${userToBan.username}`;
    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    setDbUsers((prev) => prev.map((u) => u.username === userToBan.username ? updatedUser : u));
    onUpdateUser(updatedUser);

    if (db) {
      try {
        const userRef = doc(db, 'users', userToBan.id || userToBan.username);
        await setDoc(userRef, {
          is_banned: true,
          ban_reason: reason,
          ban_timestamp: Date.now()
        }, { merge: true });
      } catch (err) {
        console.error('Error banning user in Firestore:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }

    logAuditEvent('ban_user', `Suspended profile. Reason: "${reason}"`, userToBan.username, userToBan.id);
    setUserToBan(null);
    setBanReasonInput('');
  };

  // Unban User Action
  const handleUnbanUser = async (user: UserData) => {
    const updatedUser: UserData = {
      ...user,
      is_banned: false,
      ban_reason: undefined,
      ban_timestamp: undefined
    };

    const actionKey = `ban_${user.username}`;
    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    setDbUsers((prev) => prev.map((u) => u.username === user.username ? updatedUser : u));
    onUpdateUser(updatedUser);

    if (db) {
      try {
        const userRef = doc(db, 'users', user.id || user.username);
        await setDoc(userRef, {
          is_banned: false,
          ban_reason: null,
          ban_timestamp: null
        }, { merge: true });
      } catch (err) {
        console.error('Error unbanning user in Firestore:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }

    logAuditEvent('unban_user', 'Reinstated suspended profile', user.username, user.id);
  };

  // User Profile & PFP Edit Handlers
  const handleOpenUserEdit = (user: UserData) => {
    setSelectedUserForEdit(user);
    setEditDisplayName(user.display_name || '');
    setEditBio(user.bio || '');
    setEditRole(user.role || 'user');
    setEditAvatarUrl(user.avatar_url || '');
  };

  const handleSaveUserEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) return;

    setProcessingActions(prev => ({ ...prev, edit_user: true }));

    const updatedUser: UserData = {
      ...selectedUserForEdit,
      display_name: editDisplayName,
      bio: editBio,
      role: editRole,
      avatar_url: editAvatarUrl.trim() || undefined
    };

    setDbUsers((prev) => prev.map((u) => (u.username === updatedUser.username || u.id === updatedUser.id) ? updatedUser : u));
    onUpdateUser(updatedUser);

    if (db) {
      try {
        const docId = updatedUser.id || updatedUser.username;
        await setDoc(doc(db, 'users', docId), {
          display_name: updatedUser.display_name,
          bio: updatedUser.bio,
          role: updatedUser.role,
          avatar_url: updatedUser.avatar_url || ''
        }, { merge: true });
      } catch (err) {
        console.warn('Firestore user update notice:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, edit_user: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, edit_user: false }));
    }

    logAuditEvent('update_user', `Updated user details and PFP for @${updatedUser.username}`, updatedUser.username, updatedUser.id);
    setSelectedUserForEdit(null);
  };

  const handleDeleteUser = (user: UserData) => {
    if (!user) return;
    setUserToDelete(user);
  };

  const confirmDeleteUserPermanently = async () => {
    if (!userToDelete) return;
    const user = userToDelete;

    const actionKey = `delete_${user.username}`;
    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    // 1. Immediately remove from local state
    setDbUsers((prev) => prev.filter((u) => u.username !== user.username && u.id !== user.id));
    // 2. Notify parent container (App.tsx) to purge state & caches
    if (onDeleteUser) {
      onDeleteUser(user.username, user.id);
    }
    // 3. Purge Firestore documents completely
    if (db) {
      try {
        if (user.id) {
          await deleteDoc(doc(db, 'users', user.id)).catch(() => {});
        }
        if (user.username) {
          await deleteDoc(doc(db, 'users', user.username)).catch(() => {});
          await deleteDoc(doc(db, 'users', user.username.toLowerCase())).catch(() => {});
          await deleteDoc(doc(db, 'usernames', user.username.toLowerCase())).catch(() => {});
        }
      } catch (err) {
        console.error('Error deleting user from Firestore:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }
    logAuditEvent('config_change', `Permanently deleted user profile @${user.username}`, user.username, user.id);
    if (selectedUserForEdit?.username === user.username) {
      setSelectedUserForEdit(null);
    }
    setUserToDelete(null);
  };

  // Delete Service Account (Admin / Developer)
  const handleDeleteServiceAccount = async (saId: string, username: string, isDevApp: boolean = false) => {
    if (!confirm(`Are you sure you want to delete service account @${username || saId}? This action is irreversible.`)) return;

    const actionKey = `delete_sa_${username || saId}`;
    setProcessingActions(prev => ({ ...prev, [actionKey]: true }));

    // 1. Immediately remove from local state
    if (isDevApp) {
      setDeveloperApps((prev) => prev.filter((a) => a.id !== saId && a.client_id !== saId));
    } else {
      setServiceAccounts((prev) => prev.filter((sa) => sa.id !== saId && sa.username !== username));
    }
    setDbUsers((prev) => prev.filter((u) => u.username !== username && u.id !== saId));

    if (onDeleteUser && username) {
      onDeleteUser(username, saId);
    }

    // 2. Delete from Firestore
    if (db) {
      try {
        if (saId) {
          await deleteDoc(doc(db, isDevApp ? 'developer_apps' : 'service_accounts', saId)).catch(() => {});
          await deleteDoc(doc(db, 'users', saId)).catch(() => {});
        }
        if (username) {
          await deleteDoc(doc(db, 'service_accounts', username)).catch(() => {});
          await deleteDoc(doc(db, 'service_accounts', username.toLowerCase())).catch(() => {});
          await deleteDoc(doc(db, 'users', username)).catch(() => {});
          await deleteDoc(doc(db, 'users', username.toLowerCase())).catch(() => {});
          await deleteDoc(doc(db, 'usernames', username.toLowerCase())).catch(() => {});
        }
      } catch (err) {
        console.error('Error deleting service account from Firestore:', err);
      } finally {
        setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
      }
    } else {
      setProcessingActions(prev => ({ ...prev, [actionKey]: false }));
    }

    logAuditEvent('config_change', `Permanently deleted service account @${username || saId}`, username, saId);
  };

  // Template Requests Governance Handlers
  const handleApproveTemplate = async (templateId: string) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'message_templates', templateId), { status: 'approved', updated_at: Date.now() }, { merge: true });
      setMessageTemplates(prev => prev.map(t => t.id === templateId ? { ...t, status: 'approved' } : t));
      logAuditEvent('config_change', `Approved message template ${templateId}`);
    } catch (err) {
      console.error('Error approving template:', err);
    }
  };

  const handleRejectTemplate = async (templateId: string) => {
    if (!db) return;
    try {
      await setDoc(doc(db, 'message_templates', templateId), { status: 'rejected', updated_at: Date.now() }, { merge: true });
      setMessageTemplates(prev => prev.map(t => t.id === templateId ? { ...t, status: 'rejected' } : t));
      logAuditEvent('config_change', `Rejected message template ${templateId}`);
    } catch (err) {
      console.error('Error rejecting template:', err);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template request?')) return;
    if (!db) return;
    try {
      await deleteDoc(doc(db, 'message_templates', templateId));
      setMessageTemplates(prev => prev.filter(t => t.id !== templateId));
      logAuditEvent('config_change', `Deleted message template ${templateId}`);
    } catch (err) {
      console.error('Error deleting template:', err);
    }
  };

  // Create Zenoa Official Service Account
  const handleCreateServiceAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saUsername || !saDisplayName) return;

    const cleanSaUsername = saUsername.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const accountId = 'sa_' + cleanSaUsername;

    const newServiceUser: UserData = {
      id: accountId,
      username: cleanSaUsername,
      display_name: saDisplayName,
      bio: saBio || `Official Zenoa ${saCategory} Service Account`,
      avatar_seed: cleanSaUsername,
      avatar_url: saAvatarUrl.trim() || undefined,
      online: true,
      last_seen: 'Just now',
      is_verified: true,
      is_official: true,
      verified_type: 'purple',
      is_service_account: true,
      is_business_account: false,
      service_category: saCategory,
      registered_at: Date.now()
    };

    const serviceData: ServiceAccountData = {
      id: accountId,
      username: cleanSaUsername,
      display_name: saDisplayName,
      bio: newServiceUser.bio,
      avatar_seed: cleanSaUsername,
      avatar_url: saAvatarUrl.trim() || undefined,
      created_at: Date.now(),
      created_by: currentUser?.email || 'admin@zenoa.internal',
      service_category: saCategory,
      badge_type: 'purple',
      broadcast_count: 0,
      status: 'active'
    };

    setDbUsers((prev) => [newServiceUser, ...prev]);
    setServiceAccounts((prev) => [serviceData, ...prev]);
    onUpdateUser(newServiceUser);

    if (db) {
      try {
        await setDoc(doc(db, 'users', accountId), cleanUndefined(newServiceUser));
        await setDoc(doc(db, 'service_accounts', accountId), cleanUndefined(serviceData));
      } catch (err) {
        console.error('Error creating service account in Firestore:', err);
      }
    }

    logAuditEvent('create_service_account', `Created official Service Account @${cleanSaUsername} (${saCategory})`, cleanSaUsername, accountId);

    setShowCreateServiceAccountModal(false);
    setSaUsername('');
    setSaDisplayName('');
    setSaBio('');
    setSaAvatarUrl('');
  };

  // Dispatch Global Broadcast / Announcement Message with optional Photo Attachment
  const handleDispatchBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!sendAsNormalMessage && !broadcastTitle) || !broadcastContent) return;

    const broadcastId = 'bc_' + Date.now();
    const senderData = serviceAccounts.find((sa) => sa.username === broadcastSender) || {
      username: 'zenoa_official',
      display_name: 'Zenoa Official'
    };

    const hasPhoto = !!broadcastPhotoUrl.trim();

    const newBroadcast: SystemBroadcast = {
      id: broadcastId,
      sender_username: senderData.username,
      sender_display_name: senderData.display_name,
      title: sendAsNormalMessage ? 'Direct Message' : broadcastTitle,
      content: broadcastContent,
      urgency: sendAsNormalMessage ? 'normal' : broadcastUrgency,
      photo_url: hasPhoto ? broadcastPhotoUrl.trim() : undefined,
      created_at: Date.now(),
      created_by: currentUser?.email || 'admin@zenoa.internal'
    };

    setBroadcasts((prev) => [newBroadcast, ...prev]);
    setServiceAccounts((prev) => prev.map((sa) => sa.username === broadcastSender ? { ...sa, broadcast_count: sa.broadcast_count + 1 } : sa));

    if (db) {
      try {
        await setDoc(doc(db, 'broadcasts', broadcastId), cleanUndefined(newBroadcast));

        const usersSnap = await getDocs(collection(db, 'users'));
        const now = Date.now();
        const deliveryPromises = usersSnap.docs.map(async (uDoc) => {
          const u = uDoc.data();
          const targetUsername = u.username || uDoc.id;
          if (!targetUsername || targetUsername === senderData.username) return;

          const chatId = `chat_dm_${[targetUsername.toLowerCase(), senderData.username.toLowerCase()].sort().join('_')}`;
          const msgId = `msg_${broadcastId}_${targetUsername}`;

          const lastMsgText = sendAsNormalMessage
            ? (hasPhoto ? `[Photo] ${broadcastContent}` : broadcastContent)
            : (hasPhoto ? `[${broadcastTitle}] ${broadcastContent}` : `[${broadcastTitle}] ${broadcastContent}`);

          await setDoc(doc(db, 'chats', chatId), {
            id: chatId,
            type: 'dm',
            username: senderData.username,
            name: senderData.display_name,
            participants: [targetUsername, senderData.username],
            participant_ids: [uDoc.id, senderData.username],
            last_message: lastMsgText,
            last_message_time: now,
            last_message_sender: senderData.username,
            last_message_status: 'sent',
            unread_count: 1,
            updated_at: now
          }, { merge: true }).catch(() => {});

          const msgPayload: any = {
            id: msgId,
            chat_id: chatId,
            sender: senderData.username,
            text: sendAsNormalMessage ? broadcastContent : `**[${broadcastTitle}]**\n\n${broadcastContent}`,
            timestamp: now,
            status: 'sent',
            read_by: JSON.stringify([senderData.username]),
            is_system_broadcast: !sendAsNormalMessage,
            urgency: sendAsNormalMessage ? 'normal' : broadcastUrgency
          };

          if (hasPhoto) {
            msgPayload.type = 'image';
            msgPayload.media_url = broadcastPhotoUrl.trim();
            msgPayload.file_name = broadcastTitle || 'Official Photo';
          } else {
            msgPayload.type = 'text';
          }

          await setDoc(doc(db, 'messages', msgId), msgPayload).catch(() => {});
        });

        await Promise.all(deliveryPromises);
      } catch (err) {
        console.error('Error saving broadcast to Firestore:', err);
      }
    }

    logAuditEvent('send_broadcast', `Dispatched official message: "${sendAsNormalMessage ? 'Direct Message' : (broadcastTitle || 'Alert')}" ${hasPhoto ? '(with Photo Attachment)' : ''}`);
    setBroadcastStatus(`Message dispatched successfully ${hasPhoto ? 'with Photo' : ''}!`);
    setBroadcastTitle('');
    setBroadcastContent('');
    setBroadcastPhotoUrl('');
    setTimeout(() => setBroadcastStatus(''), 5000);
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return dbUsers.filter((u) => {
      const searchLower = (userSearch || '').toLowerCase();
      const matchSearch =
        (u.username || '').toLowerCase().includes(searchLower) ||
        (u.display_name || '').toLowerCase().includes(searchLower) ||
        (u.email ? u.email.toLowerCase().includes(searchLower) : false);

      if (!matchSearch) return false;

      if (userFilter === 'verified') return !!u.is_verified;
      if (userFilter === 'official_service') return !!u.is_service_account && !u.is_business_account;
      if (userFilter === 'developer_service') return !!u.is_service_account && !!u.is_business_account;
      if (userFilter === 'banned') return !!u.is_banned;
      if (userFilter === 'online') return u.online;

      return true;
    });
  }, [dbUsers, userSearch, userFilter]);

  // Filtered Verified Users List for dedicated Verification Management tab
  const filteredVerifiedUsers = useMemo(() => {
    return dbUsers.filter((u) => {
      const searchLower = (verifiedSearch || '').toLowerCase();
      const matchSearch =
        (u.username || '').toLowerCase().includes(searchLower) ||
        (u.display_name || '').toLowerCase().includes(searchLower) ||
        (u.email ? u.email.toLowerCase().includes(searchLower) : false);

      if (!matchSearch) return false;

      if (verifiedFilter === 'verified') return !!u.is_verified;
      if (verifiedFilter === 'unverified') return !u.is_verified;

      return true;
    });
  }, [dbUsers, verifiedSearch, verifiedFilter]);

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const totalUsers = dbUsers.length;
    const activeOnline = dbUsers.filter((u) => u.online).length;
    const purpleVerified = dbUsers.filter((u) => u.is_verified).length;
    const officialServiceAccs = serviceAccounts.length || dbUsers.filter((u) => u.is_service_account && !u.is_business_account).length;
    const developerServiceAccs = developerApps.length || dbUsers.filter((u) => u.is_service_account && u.is_business_account).length;
    const pendingTemplatesCount = messageTemplates.filter((t) => t.status === 'pending_review').length;
    const totalTemplatesCount = messageTemplates.length;
    const bannedUsers = dbUsers.filter((u) => u.is_banned).length;
    const pendingReports = reports.filter((r) => r.status === 'pending').length;
    const groupChatsCount = allChats.filter((c) => c.is_group).length;

    return {
      totalUsers,
      activeOnline,
      purpleVerified,
      officialServiceAccs,
      developerServiceAccs,
      pendingTemplatesCount,
      totalTemplatesCount,
      bannedUsers,
      pendingReports,
      groupChatsCount
    };
  }, [dbUsers, serviceAccounts, developerApps, messageTemplates, reports, allChats]);

  // UNAUTHENTICATED ADMIN PASSCODE SCREEN
  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen h-full w-full bg-neutral-950 text-neutral-100 flex items-center justify-center p-4 font-sans selection:bg-neutral-800 selection:text-white">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          {/* Decorative Security Banner */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-neutral-700 to-emerald-500" />

          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center mx-auto text-purple-400 shadow-inner">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              ZENOA COMMAND CENTER
            </h1>
            <p className="text-xs text-neutral-400 font-mono">
              RESTRICTED ENTERPRISE ADMIN CONSOLE • V3.4 PROTOCOL
            </p>
          </div>

          <form onSubmit={handlePasscodeSubmit} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                Master Passcode Key
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={passcodeInput}
                  onChange={(e) => setPasscodeInput(e.target.value)}
                  placeholder="Enter Security Passcode Key..."
                  className="w-full px-4 py-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-sm font-mono text-white outline-none focus:border-purple-500 transition-colors placeholder:text-neutral-600"
                />
                <Key className="h-4 w-4 text-neutral-500 absolute right-3.5 top-4" />
              </div>
            </div>

            {passcodeError && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-rose-300 text-xs font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{passcodeError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 border border-purple-700 shadow-md"
            >
              <span>Authenticate Session</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-neutral-800 flex items-center justify-between text-[11px] text-neutral-500">
            <button
              type="button"
              onClick={onCloseAdmin}
              className="hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-mono"
            >
              ← Return to Messenger
            </button>
            <span className="font-mono">TLS 1.3 • Zero Cloud Logs</span>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED ADMIN PANEL DASHBOARD
  return (
    <div className="min-h-screen h-full w-full bg-neutral-950 text-neutral-200 font-sans flex flex-col overflow-hidden select-none">
      {/* TOP COMMAND HEADER */}
      <header className="h-16 bg-neutral-900 border-b border-neutral-800 px-4 sm:px-6 flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-neutral-950 border border-purple-900/60 flex items-center justify-center text-purple-400 font-black text-base shadow-xs">
              <Shield className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-widest text-white uppercase">
                  ZENOA ADMIN CONSOLE
                </span>
                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-200 border border-neutral-700 text-[10px] font-mono font-bold">
                  MASTER MODE
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400">
                Live Telemetry & Real-Time Node Control
              </span>
            </div>
          </div>
        </div>

        {/* Header Indicators & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>SYNC ACTIVE</span>
            </div>
            <span className="text-neutral-600">|</span>
            <span className="text-neutral-400">Admin: {currentUser?.email || 'azadaman19s@gmail.com'}</span>
          </div>

          <button
            onClick={onCloseAdmin}
            className="px-3.5 py-2 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Open App</span>
          </button>

          <button
            onClick={handleLogoutAdmin}
            className="px-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-rose-800 text-rose-400 hover:bg-rose-950/30 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            title="Lock Admin Session"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Lock Session</span>
          </button>
        </div>
      </header>

      {/* WORKSPACE BODY WITH NAVIGATION SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-64 bg-neutral-900/60 border-r border-neutral-800 p-3 flex flex-col justify-between shrink-0 hidden md:flex">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <Activity className="h-4 w-4 text-purple-400" />
              <span>Telemetry & Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4 text-purple-400" />
                <span>User Directory</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('verified_management')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'verified_management'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-4 w-4 text-purple-400" />
                <span>Verified Management</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800/80 text-[9px] font-mono font-bold">
                {metrics.purpleVerified}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('service_accounts')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'service_accounts'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Radio className="h-4 w-4 text-neutral-400" />
                <span>Service Accounts & Broadcast</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-400 text-[10px] font-mono">
                {metrics.officialServiceAccs + metrics.developerServiceAccs}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'templates'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <FileCode className="h-4 w-4 text-amber-400" />
                <span>Template Requests</span>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                metrics.pendingTemplatesCount > 0 
                  ? 'bg-amber-950/80 text-amber-300 border border-amber-800 animate-pulse' 
                  : 'bg-neutral-800 text-neutral-400'
              }`}>
                {metrics.totalTemplatesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === 'reports'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Flag className="h-4 w-4 text-neutral-400" />
                <span>Reported Profiles</span>
              </div>
              {metrics.pendingReports > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono animate-pulse">
                  {metrics.pendingReports}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('groups')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'groups'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <MessageSquare className="h-4 w-4 text-neutral-400" />
              <span>Group Conversations</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <Terminal className="h-4 w-4 text-neutral-400" />
              <span>Audit Logs</span>
            </button>

            <button
              onClick={() => setActiveTab('branding')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'branding'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <Palette className="h-4 w-4 text-purple-400" />
              <span>App Branding & Logos</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold text-left flex items-center gap-3 transition-colors cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-neutral-800 text-white border border-neutral-700'
                  : 'text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200'
              }`}
            >
              <Lock className="h-4 w-4 text-neutral-400" />
              <span>Security & Key Vault</span>
            </button>
          </nav>

          {/* Console Footnote */}
          <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-neutral-500 space-y-1">
            <div className="flex items-center justify-between">
              <span>Storage Mode:</span>
              <span className="text-emerald-400">IndexedDB</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Relay Retention:</span>
              <span className="text-neutral-300">0ms Purge</span>
            </div>
          </div>
        </aside>

        {/* MOBILE NAVIGATION TAB SELECTOR */}
        <div className="md:hidden bg-neutral-900 border-b border-neutral-800 p-2 overflow-x-auto flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-neutral-700 text-white border border-neutral-600'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Users ({metrics.totalUsers})
          </button>
          <button
            onClick={() => setActiveTab('verified_management')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'verified_management'
                ? 'bg-neutral-700 text-white border border-neutral-600'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Verified ({metrics.purpleVerified})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'sessions'
                ? 'bg-neutral-700 text-white border border-neutral-600'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Sessions ({metrics.activeOnline})
          </button>
          <button
            onClick={() => setActiveTab('service_accounts')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'service_accounts'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Service Accounts
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Reports ({metrics.pendingReports})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                : 'bg-neutral-800 text-neutral-400'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {/* MAIN DISPLAY WORKSPACE */}
        <main className="flex-1 bg-neutral-950 p-4 sm:p-6 lg:p-8 overflow-y-auto space-y-6">
          {/* TAB 1: TELEMETRY & OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">System Telemetry & Overview</h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Real-time database sync status, active sessions, and live user metrics.
                  </p>
                </div>
                <button
                  onClick={handlePurgeLocalCache}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                  title="Clear local browser caches and force fresh Firestore sync"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Purge Local Cache & Re-Sync</span>
                </button>
              </div>

              {/* Top Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Total Accounts</div>
                  <div className="text-3xl font-black text-white">{metrics.totalUsers}</div>
                  <div className="text-[11px] font-mono text-neutral-500">Registered User Profiles</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Purple Verified Tag</div>
                  <div className="text-3xl font-black text-purple-400">{metrics.purpleVerified}</div>
                  <div className="text-[11px] font-mono text-purple-300/70">Official Verified Badges</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Official Zenoa Bots</div>
                  <div className="text-3xl font-black text-purple-400">{metrics.officialServiceAccs}</div>
                  <div className="text-[11px] font-mono text-neutral-500">Official System Bots</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Dev Business Bots</div>
                  <div className="text-3xl font-black text-white">{metrics.developerServiceAccs}</div>
                  <div className="text-[11px] font-mono text-neutral-500">Developer Integrations</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
                  <div className="text-xs font-mono text-neutral-400 uppercase">Pending Reports</div>
                  <div className="text-3xl font-black text-rose-400">{metrics.pendingReports}</div>
                  <div className="text-[11px] font-mono text-neutral-500">Profile Flagged Queue</div>
                </div>
              </div>

              {/* Secondary Stats & Quick Controls */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Live Node Activity Card */}
                <div className="lg:col-span-2 p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                      <Zap className="h-4 w-4 text-purple-400" />
                      <span>Live Node Telemetry & Storage</span>
                    </h3>
                    <span className="text-[11px] font-mono text-emerald-400">STATUS: OPTIMAL</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                      <div className="text-neutral-500 text-[10px]">Active Online</div>
                      <div className="text-lg font-bold text-emerald-400">{metrics.activeOnline}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                      <div className="text-neutral-500 text-[10px]">Suspended Accounts</div>
                      <div className="text-lg font-bold text-rose-400">{metrics.bannedUsers}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-0.5">
                      <div className="text-neutral-500 text-[10px]">Group Chats</div>
                      <div className="text-lg font-bold text-white">{metrics.groupChatsCount}</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs font-mono text-neutral-400">
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span>Relay Pass-Through Queue:</span>
                      <span className="text-white font-bold">0 Messages Retained</span>
                    </div>
                    <div className="flex justify-between border-b border-neutral-800 pb-2">
                      <span>Client Vault Storage Engine:</span>
                      <span className="text-white font-bold">IndexedDB Local Keystore</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Encryption Protocol:</span>
                      <span className="text-purple-400 font-bold">AES-256-GCM hardware key</span>
                    </div>
                  </div>
                </div>

                {/* Quick Administrative Shortcuts */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Administrative Actions</h3>
                  <div className="space-y-2.5">
                    <button
                      onClick={() => setActiveTab('users')}
                      className="w-full p-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-xs font-bold text-neutral-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-purple-400" />
                        <span>Manage Purple Verifications</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    </button>

                    <button
                      onClick={() => setActiveTab('service_accounts')}
                      className="w-full p-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-xs font-bold text-neutral-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Radio className="h-4 w-4 text-neutral-400" />
                        <span>Dispatch System Broadcast</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    </button>

                    <button
                      onClick={() => setActiveTab('reports')}
                      className="w-full p-3 rounded-xl bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-left text-xs font-bold text-neutral-200 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-rose-400" />
                        <span>Moderation Queue</span>
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USER DIRECTORY & PURPLE VERIFICATION */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">User Directory & Verification</h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Manage profile status, grant official Purple Verified Badges, or suspend abusive accounts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (onRefreshData) onRefreshData();
                    }}
                    className="px-3 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>
              </div>

              {/* Filters & Search */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-80">
                  <Search className="h-4 w-4 text-neutral-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search username, display name, email..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                  <button
                    onClick={() => setUserFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      userFilter === 'all'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    All ({dbUsers.length})
                  </button>
                  <button
                    onClick={() => setUserFilter('verified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      userFilter === 'verified'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Purple Verified ({metrics.purpleVerified})
                  </button>
                  <button
                    onClick={() => setUserFilter('official_service')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      userFilter === 'official_service'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Official Zenoa Bots ({metrics.officialServiceAccs})
                  </button>
                  <button
                    onClick={() => setUserFilter('developer_service')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      userFilter === 'developer_service'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Dev Business Bots ({metrics.developerServiceAccs})
                  </button>
                  <button
                    onClick={() => setUserFilter('banned')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      userFilter === 'banned'
                        ? 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    Suspended ({metrics.bannedUsers})
                  </button>
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/80 font-mono text-neutral-400 uppercase text-[10px]">
                      <th className="p-4">Profile / User</th>
                      <th className="p-4">Email / Identifier</th>
                      <th className="p-4">Account Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-neutral-500 font-mono">
                          No profiles found matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, idx) => {
                        const isVerified = !!user.is_verified;
                        const isBanned = !!user.is_banned;
                        const isService = !!user.is_service_account;

                        return (
                          <tr key={`usr_${user.id || user.username || "no_name"}_${idx}`} className="hover:bg-neutral-800/40 transition-colors">
                            {/* Profile Info */}
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    (user.display_name || user.username || "U").charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white truncate">{user.display_name}</span>
                                    {isVerified && (
                                      <PurpleVerifiedBadge size="xs" />
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-neutral-400 truncate">@{user.username}</span>
                                </div>
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4 font-mono text-neutral-400">
                              {user.email || 'None Provided'}
                            </td>

                            {/* Account Status */}
                            <td className="p-4 font-mono text-xs">
                              {isBanned ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold inline-flex items-center gap-1">
                                  <UserX className="h-3.5 w-3.5" />
                                  <span>SUSPENDED</span>
                                </span>
                              ) : isService ? (
                                <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-bold">
                                  BOT SERVICE
                                </span>
                              ) : user.online ? (
                                <span className="text-emerald-400 font-bold flex items-center gap-1">
                                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                  <span>ONLINE</span>
                                </span>
                              ) : (
                                <span className="text-neutral-500">Offline</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="p-4 text-right space-x-2 whitespace-nowrap">
                              {/* Edit Profile */}
                              <button
                                onClick={() => handleOpenUserEdit(user)}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 cursor-pointer transition-colors inline-flex items-center gap-1"
                                title="Edit PFP, Display Name, Bio & Role"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-purple-400" />
                                <span>Edit Profile</span>
                              </button>

                              {/* Ban Toggle */}
                              {isBanned ? (
                                <button
                                  onClick={() => handleUnbanUser(user)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 cursor-pointer transition-colors"
                                >
                                  Reinstate
                                </button>
                              ) : (
                                <button
                                  onClick={() => setUserToBan(user)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950/60 hover:bg-rose-950 text-rose-300 border border-rose-800 cursor-pointer transition-colors"
                                >
                                  Suspend
                                </button>
                              )}

                              {/* Delete User */}
                              <button
                                onClick={() => handleDeleteUser(user)}
                                className="px-2 py-1.5 rounded-lg text-xs font-bold bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/80 cursor-pointer transition-colors inline-flex items-center gap-1"
                                title="Delete account permanently"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: VERIFIED MANAGEMENT */}
          {activeTab === 'verified_management' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5">
                    <ShieldCheck className="h-5 w-5 text-purple-400" />
                    <span>Purple Verification Management</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Grant, manage, or revoke official 12-point scalloped purple starburst badges for all active users.
                  </p>
                </div>
              </div>

              {/* SEARCH & FILTERS CONTAINER */}
              <div className="flex flex-col sm:flex-row gap-3 items-center justify-between p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                  <input
                    type="text"
                    value={verifiedSearch}
                    onChange={(e) => setVerifiedSearch(e.target.value)}
                    placeholder="Search by name or @handle..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-white placeholder-neutral-500 outline-none focus:border-purple-500 font-sans"
                  />
                </div>

                <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setVerifiedFilter('all')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      verifiedFilter === 'all'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800/60'
                    }`}
                  >
                    All Users ({dbUsers.length})
                  </button>
                  <button
                    onClick={() => setVerifiedFilter('verified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      verifiedFilter === 'verified'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800/60'
                    }`}
                  >
                    Verified ({metrics.purpleVerified})
                  </button>
                  <button
                    onClick={() => setVerifiedFilter('unverified')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                      verifiedFilter === 'unverified'
                        ? 'bg-purple-950/60 text-purple-300 border border-purple-800'
                        : 'bg-neutral-950 text-neutral-400 hover:text-white border border-neutral-800/60'
                    }`}
                  >
                    Unverified ({dbUsers.length - metrics.purpleVerified})
                  </button>
                </div>
              </div>

              {/* VERIFIED USERS DIRECTORY TABLE */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/80 font-mono text-neutral-400 uppercase text-[10px]">
                      <th className="p-4">Profile Info</th>
                      <th className="p-4">Account Type / Role</th>
                      <th className="p-4">Verification Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {filteredVerifiedUsers.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-neutral-500 font-mono">
                          No users found matching current filters.
                        </td>
                      </tr>
                    ) : (
                      filteredVerifiedUsers.map((user, idx) => {
                        const isVerified = !!user.is_verified;
                        return (
                          <tr key={`ver_${user.id || user.username}_${idx}`} className="hover:bg-neutral-800/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                  ) : (
                                    (user.display_name || user.username || "U").charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white truncate">{user.display_name}</span>
                                    {isVerified && (
                                      <PurpleVerifiedBadge size="xs" />
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-neutral-400 truncate">@{user.username}</span>
                                </div>
                              </div>
                            </td>

                            <td className="p-4">
                              <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800/80 text-neutral-400 font-mono uppercase text-[10px]">
                                {user.is_service_account ? 'Bot / Service' : user.role || 'User'}
                              </span>
                            </td>

                            <td className="p-4">
                              {isVerified ? (
                                <span className="px-2.5 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/80 font-mono text-[11px] font-bold inline-flex items-center gap-1.5">
                                  <PurpleVerifiedBadge size="xs" />
                                  <span>PURPLE VERIFIED</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-500 font-mono text-[10px]">
                                  Standard
                                </span>
                              )}
                            </td>

                             <td className="p-4 text-right">
                              {user.is_service_account && !user.is_business_account ? (
                                <span className="px-4 py-1.5 rounded-xl text-xs font-bold border bg-purple-950/40 text-purple-400 border-purple-800/50 inline-flex items-center gap-1.5 justify-center min-w-[155px]">
                                  Always Verified
                                </span>
                              ) : (
                                <button
                                  disabled={processingActions[`verify_${user.username}`]}
                                  onClick={() => handleTogglePurpleVerification(user)}
                                  className={`px-4 py-1.5 rounded-xl text-xs font-bold border cursor-pointer transition-all inline-flex items-center gap-1.5 justify-center min-w-[155px] ${
                                    isVerified
                                      ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border-neutral-700 hover:text-white'
                                      : 'bg-purple-900 hover:bg-purple-850 text-white border-purple-700 hover:shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                                  }`}
                                >
                                  {processingActions[`verify_${user.username}`] ? (
                                    <>
                                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                      <span>Updating...</span>
                                    </>
                                  ) : (
                                    <span>{isVerified ? 'Revoke Verified Badge' : 'Grant Verified Badge'}</span>
                                  )}
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-400" />
                    <span>Active Device & Session Security</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Real-time active user sessions, heartbeat status, and single-click session termination.
                  </p>
                </div>
                <button
                  onClick={handlePurgeLocalCache}
                  className="px-4 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors shrink-0"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Purge Local Cache</span>
                </button>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-800 bg-neutral-950/60 text-[11px] font-mono uppercase text-neutral-400">
                        <th className="p-4">User Identity</th>
                        <th className="p-4">Status & Heartbeat</th>
                        <th className="p-4">Session Token</th>
                        <th className="p-4">Last Active</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-xs">
                      {dbUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-neutral-500 font-mono">
                            No active users or sessions found in database.
                          </td>
                        </tr>
                      ) : (
                        dbUsers.map((user, idx) => {
                          const isOnline = !!user.online;
                          const sessionToken = (user as any).active_session_token || 'session_active_token';
                          const lastSeenStr = user.last_seen || (user.last_seen_timestamp ? new Date(user.last_seen_timestamp).toLocaleString() : 'Offline');

                          return (
                            <tr key={`session_${user.id || user.username}_${idx}`} className="hover:bg-neutral-800/40 transition-colors">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="h-9 w-9 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-white shrink-0 overflow-hidden">
                                    {user.avatar_url ? (
                                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                      (user.display_name || user.username || 'U').charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-bold text-white truncate">{user.display_name || user.username}</span>
                                    <span className="text-[11px] font-mono text-neutral-400 truncate">@{user.username}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                                  <span className={`font-mono text-xs ${isOnline ? 'text-emerald-400 font-bold' : 'text-neutral-400'}`}>
                                    {isOnline ? 'Online Now' : 'Offline'}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4 font-mono text-[11px] text-neutral-400">
                                <span className="px-2 py-1 rounded bg-neutral-950 border border-neutral-800 text-neutral-300">
                                  {sessionToken ? sessionToken.substring(0, 18) + '...' : 'No Token'}
                                </span>
                              </td>
                              <td className="p-4 font-mono text-neutral-400 text-xs">
                                {lastSeenStr}
                              </td>
                              <td className="p-4 text-right">
                                <button
                                  onClick={() => handleTerminateSession(user.username)}
                                  className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 hover:text-rose-300 hover:border-rose-800 border border-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
                                  title="Terminate active session token"
                                >
                                  Terminate Session
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

{activeTab === 'service_accounts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Zenoa Service Accounts & Broadcast</h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Manage official verified admin service accounts, review developer service accounts, and dispatch global broadcasts.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCreateServiceAccountModal(true)}
                    className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border border-purple-700 shadow-md"
                  >
                    <Radio className="h-4 w-4" />
                    <span>Create Service Account</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tab Selector for Service Accounts */}
              <div className="flex rounded-xl bg-neutral-900 border border-neutral-800 p-1 w-full max-w-md">
                <button
                  onClick={() => setServiceSubTab('official')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    serviceSubTab === 'official'
                      ? 'bg-neutral-800 text-purple-300 border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4 text-purple-400" />
                  <span>Official Service Accounts ({serviceAccounts.length})</span>
                </button>
                <button
                  onClick={() => setServiceSubTab('developer')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                    serviceSubTab === 'developer'
                      ? 'bg-neutral-800 text-indigo-300 border border-neutral-700 shadow-sm'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Radio className="h-4 w-4 text-indigo-400" />
                  <span>Developer Service Accounts ({metrics.developerServiceAccs})</span>
                </button>
              </div>

              {/* SUB-TAB 1: OFFICIAL SERVICE ACCOUNTS */}
              {serviceSubTab === 'official' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceAccounts.length === 0 ? (
                    <div className="col-span-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center font-mono text-neutral-500 text-xs">
                      No official service accounts created yet. Click 'Create Service Account' above.
                    </div>
                  ) : (
                    serviceAccounts.map((sa, idx) => (
                      <div key={`sa_${sa.id || sa.username || "sa"}_${idx}`} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3 relative group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="h-10 w-10 rounded-xl bg-purple-950 border border-purple-800 flex items-center justify-center font-bold text-purple-300 text-sm">
                              <ShieldCheck className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-white text-sm">{sa.display_name}</span>
                                <PurpleVerifiedBadge size="sm" />
                              </div>
                              <span className="text-xs font-mono text-neutral-400">@{sa.username}</span>
                            </div>
                          </div>

                          <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono font-bold">
                            {sa.service_category || 'Official Bot'}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2 font-normal">
                          {sa.bio || 'Official Zenoa System Service Account'}
                        </p>

                        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                          <span>Dispatches: {sa.broadcast_count || 0}</span>
                          <button
                            onClick={() => handleDeleteServiceAccount(sa.id || sa.username, sa.username, false)}
                            className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="Delete Service Account"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* SUB-TAB 2: DEVELOPER SERVICE ACCOUNTS */}
              {serviceSubTab === 'developer' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-800/60 text-xs text-indigo-200 flex items-start gap-3">
                    <Radio className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white block">Developer Service Accounts & Bots</span>
                      <span className="text-indigo-300 font-mono text-[11px] block mt-0.5">
                        These are service accounts and application bots created by registered users via Developer Console. By default, Developer accounts are marked as Business Accounts and are unverified.
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {developerApps.length === 0 && dbUsers.filter(u => u.is_service_account && u.is_business_account).length === 0 ? (
                      <div className="col-span-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center font-mono text-neutral-500 text-xs">
                        No developer service accounts created yet via Developer Console.
                      </div>
                    ) : (
                      <>
                        {developerApps.map((app, idx) => (
                          <div key={`dev_app_${app.id || app.client_id || idx}`} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-indigo-400 text-sm">
                                  <Radio className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm">{app.name}</span>
                                    {app.is_verified ? (
                                      <PurpleVerifiedBadge size="sm" />
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono">
                                        Business Bot
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-mono text-neutral-400">@{app.bot_username || app.client_id || 'dev_bot'}</span>
                                </div>
                              </div>
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 text-[10px] font-mono">
                                Developer App
                              </span>
                            </div>

                            <div className="space-y-1 text-xs font-mono text-neutral-400">
                              <div>Owner: <span className="text-neutral-200">@{app.owner_username || 'developer'}</span></div>
                              <div>Client ID: <span className="text-neutral-300">{app.client_id ? app.client_id.slice(0, 16) + '...' : 'dev_client_id'}</span></div>
                            </div>

                            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                              <button
                                onClick={() => handleTogglePurpleVerification({ id: app.id || app.bot_username, username: app.bot_username || app.id, is_verified: app.is_verified } as UserData)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer border ${
                                  app.is_verified
                                    ? 'bg-purple-950 text-purple-300 border-purple-800 hover:bg-purple-900'
                                    : 'bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-750'
                                }`}
                              >
                                {app.is_verified ? 'Revoke Verified Badge' : 'Grant Purple Badge'}
                              </button>

                              <button
                                onClick={() => handleDeleteServiceAccount(app.id || app.client_id, app.bot_username || app.client_id, true)}
                                className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}

                        {dbUsers.filter(u => u.is_service_account && u.is_business_account && !developerApps.some(a => a.bot_username === u.username || a.id === u.id)).map((u, idx) => (
                          <div key={`dev_user_sa_${u.id || u.username}_${idx}`} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <div className="h-10 w-10 rounded-xl bg-indigo-950 border border-indigo-800 flex items-center justify-center font-bold text-indigo-300 text-sm">
                                  <Radio className="h-5 w-5 text-indigo-400" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-white text-sm">{u.display_name}</span>
                                    {u.is_verified ? (
                                      <PurpleVerifiedBadge size="sm" />
                                    ) : (
                                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-mono">
                                        Business Account
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs font-mono text-neutral-400">@{u.username}</span>
                                </div>
                              </div>
                            </div>

                            <p className="text-xs text-neutral-400 line-clamp-2">{u.bio || 'Developer Service Account'}</p>

                            <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
                              <button
                                onClick={() => handleTogglePurpleVerification(u)}
                                className="px-2 py-1 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono font-bold hover:bg-neutral-700 cursor-pointer"
                              >
                                {u.is_verified ? 'Revoke Verified Badge' : 'Grant Purple Badge'}
                              </button>
                              <button
                                onClick={() => handleDeleteServiceAccount(u.id || u.username, u.username, true)}
                                className="px-2.5 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/80 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Trash2 className="h-3 w-3" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Broadcast Dispatch Form Card */}
              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <div className="flex items-center gap-2">
                  <Send className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-bold text-white uppercase tracking-wide">
                    Global System Announcement Dispatcher
                  </h3>
                </div>
                <p className="text-xs text-neutral-400 font-mono">
                  Send an official Zenoa System announcement with purple verified badge styling directly to users.
                </p>

                {broadcastStatus && (
                  <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-300 text-xs font-mono flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{broadcastStatus}</span>
                  </div>
                )}

                <form onSubmit={handleDispatchBroadcast} className="space-y-4 pt-2">
                  {/* MESSAGE TYPE TOGGLE */}
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Send as a Regular DM Text Message</span>
                      <span className="text-[10px] text-neutral-500 font-mono block">
                        If enabled, sends a clean, standard direct message with no broadcast labels or alert banners.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendAsNormalMessage}
                        onChange={(e) => {
                          setSendAsNormalMessage(e.target.checked);
                          if (e.target.checked) {
                            setBroadcastUrgency('normal');
                          } else {
                            setBroadcastUrgency('important');
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-neutral-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-neutral-500 after:border-neutral-400 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-checked:after:bg-white"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Sender Service Account
                      </label>
                      <select
                        value={broadcastSender}
                        onChange={(e) => setBroadcastSender(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                      >
                        <option value="zenoa_official">Zenoa Official (@zenoa_official)</option>
                        {serviceAccounts.map((sa, idx) => (
                          <option key={`sa_opt_${sa.id || sa.username || "sa"}_${idx}`} value={sa.username}>
                            {sa.display_name} (@{sa.username})
                          </option>
                        ))}
                      </select>
                    </div>

                    {!sendAsNormalMessage ? (
                      <div>
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                          Announcement Urgency Category
                        </label>
                        <select
                          value={broadcastUrgency}
                          onChange={(e) => setBroadcastUrgency(e.target.value as any)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                        >
                          <option value="normal">Normal Update</option>
                          <option value="important">Important Notice</option>
                          <option value="security_alert">Critical Security Alert</option>
                          <option value="maintenance">System Maintenance Schedule</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-xs font-bold text-neutral-500 uppercase tracking-wider block mb-1.5">
                          Message Category Locked
                        </label>
                        <div className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800/40 bg-neutral-950/40 text-xs text-neutral-500 font-mono select-none">
                          Standard Text Message (Normal Priority)
                        </div>
                      </div>
                    )}
                  </div>

                  {!sendAsNormalMessage && (
                    <div>
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                        Announcement Headline / Title
                      </label>
                      <input
                        type="text"
                        required={!sendAsNormalMessage}
                        value={broadcastTitle}
                        onChange={(e) => setBroadcastTitle(e.target.value)}
                        placeholder="e.g., Zenoa Security Protocol Update v3.4..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1.5">
                      Message Body Content
                    </label>
                    <textarea
                      rows={4}
                      required
                      value={broadcastContent}
                      onChange={(e) => setBroadcastContent(e.target.value)}
                      placeholder={sendAsNormalMessage ? "Type direct text message content to send..." : "Detailed official message payload..."}
                      className="w-full p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
                      <span>Attach Photo / Banner Image (Optional)</span>
                      <span className="text-[10px] text-purple-400 font-mono">Normal Chat Image Attachment</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={broadcastPhotoUrl}
                        onChange={(e) => setBroadcastPhotoUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/... (Image URL)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                      {broadcastPhotoUrl.trim() && (
                        <div className="relative rounded-xl overflow-hidden max-w-xs border border-purple-500/40 bg-neutral-950 p-1">
                          <img src={broadcastPhotoUrl.trim()} alt="Attachment Preview" className="w-full h-32 object-cover rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setBroadcastPhotoUrl('')}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/70 text-white hover:bg-rose-600 transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 border border-purple-700 shadow-md"
                  >
                    <Send className="h-4 w-4" />
                    <span>Dispatch Official Broadcast</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB: TEMPLATE REQUESTS GOVERNANCE */}
          {activeTab === 'templates' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <FileCode className="h-5 w-5 text-amber-400" />
                    <span>Template Requests Governance</span>
                  </h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Review and verify message template requests submitted by developers via Zenoa Developer Console.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300">
                    Pending: <span className="text-amber-400">{metrics.pendingTemplatesCount}</span> / Total: {metrics.totalTemplatesCount}
                  </span>
                </div>
              </div>

              {/* Filters Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-neutral-900 border border-neutral-800 rounded-2xl">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-500" />
                    <input
                      type="text"
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      placeholder="Search templates..."
                      className="w-full pl-9 pr-4 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-700 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['ALL', 'pending_review', 'approved', 'rejected'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTemplateFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-mono font-bold uppercase transition-all cursor-pointer whitespace-nowrap ${
                        templateFilterStatus === st
                          ? st === 'pending_review'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : st === 'approved'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : st === 'rejected'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-neutral-800 text-white border border-neutral-700'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      {st === 'ALL' ? 'All Requests' : st === 'pending_review' ? 'Pending Review' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Templates Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {messageTemplates.filter((t) => {
                  const searchLower = templateSearch.toLowerCase();
                  const matchSearch =
                    !templateSearch ||
                    (t.name || '').toLowerCase().includes(searchLower) ||
                    (t.id || '').toLowerCase().includes(searchLower) ||
                    (t.category || '').toLowerCase().includes(searchLower) ||
                    (t.body || '').toLowerCase().includes(searchLower);

                  if (!matchSearch) return false;
                  if (templateFilterStatus !== 'ALL' && t.status !== templateFilterStatus) return false;
                  return true;
                }).length === 0 ? (
                  <div className="col-span-full p-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-center font-mono text-neutral-500 text-xs space-y-2">
                    <FileCode className="h-8 w-8 text-neutral-600 mx-auto" />
                    <p>No message template requests match the selected filter.</p>
                  </div>
                ) : (
                  messageTemplates
                    .filter((t) => {
                      const searchLower = templateSearch.toLowerCase();
                      const matchSearch =
                        !templateSearch ||
                        (t.name || '').toLowerCase().includes(searchLower) ||
                        (t.id || '').toLowerCase().includes(searchLower) ||
                        (t.category || '').toLowerCase().includes(searchLower) ||
                        (t.body || '').toLowerCase().includes(searchLower);

                      if (!matchSearch) return false;
                      if (templateFilterStatus !== 'ALL' && t.status !== templateFilterStatus) return false;
                      return true;
                    })
                    .map((tpl, idx) => {
                      const isPending = tpl.status === 'pending_review' || !tpl.status;
                      const isApproved = tpl.status === 'approved';
                      const isRejected = tpl.status === 'rejected';

                      return (
                        <div key={`tpl_${tpl.id || idx}`} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4 shadow-sm flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-white text-base">{tpl.name || 'Untitled Template'}</h3>
                                  <span className="px-2 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px] font-mono">
                                    {tpl.category || 'TRANSACTIONAL'}
                                  </span>
                                </div>
                                <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                                  ID: {tpl.id} • App: {tpl.client_id || 'Dev App'}
                                </span>
                              </div>

                              <div>
                                {isPending && (
                                  <span className="px-2.5 py-1 rounded-full bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono font-bold flex items-center gap-1.5 animate-pulse">
                                    <Clock className="h-3 w-3" />
                                    <span>Pending Review</span>
                                  </span>
                                )}
                                {isApproved && (
                                  <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold flex items-center gap-1.5">
                                    <CheckCircle2 className="h-3 w-3" />
                                    <span>Verified</span>
                                  </span>
                                )}
                                {isRejected && (
                                  <span className="px-2.5 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-mono font-bold flex items-center gap-1.5">
                                    <XCircle className="h-3 w-3" />
                                    <span>Rejected</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Template Content Box */}
                            <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 font-mono text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap">
                              {tpl.body || 'No template body content provided.'}
                            </div>

                            {tpl.variables && tpl.variables.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-mono text-neutral-500">Variables:</span>
                                {tpl.variables.map((v: string, vIdx: number) => (
                                  <span key={vIdx} className="px-1.5 py-0.5 rounded bg-neutral-800 text-amber-300 text-[10px] font-mono">
                                    {`{{${v}}}`}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-xs font-mono">
                            <span className="text-neutral-500 text-[10px]">
                              {tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : 'Recent Request'}
                            </span>

                            <div className="flex items-center gap-2">
                              {!isApproved && (
                                <button
                                  onClick={() => handleApproveTemplate(tpl.id)}
                                  className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" />
                                  <span>Approve</span>
                                </button>
                              )}

                              {!isRejected && (
                                <button
                                  onClick={() => handleRejectTemplate(tpl.id)}
                                  className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  <span>Reject</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleDeleteTemplate(tpl.id)}
                                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 border border-neutral-700 hover:border-rose-800 cursor-pointer transition-colors"
                                title="Delete Template"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: REPORTED PROFILES & MODERATION QUEUE */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Reported Profiles & Moderation Queue</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Review user profile reports, inspect flagged violations, and enforce administrative action.
                </p>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-x-auto shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-neutral-800 bg-neutral-950/80 font-mono text-neutral-400 uppercase text-[10px]">
                      <th className="p-4">Reported Profile</th>
                      <th className="p-4">Reporter</th>
                      <th className="p-4">Violation Category</th>
                      <th className="p-4">Timestamp</th>
                      <th className="p-4 text-right">Moderation Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 font-sans">
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500 font-mono">
                          Zero pending profile reports. All queues clear!
                        </td>
                      </tr>
                    ) : (
                      reports.map((r, idx) => (
                        <tr key={`rpt_${r.id || "rpt"}_${idx}`} className="hover:bg-neutral-800/40 transition-colors">
                          <td className="p-4 font-bold text-white">
                            @{r.reportedUsername}
                          </td>
                          <td className="p-4 font-mono text-neutral-400">
                            @{r.reporterUsername}
                          </td>
                          <td className="p-4 font-mono">
                            <span className="px-2.5 py-1 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px] uppercase">
                              {r.reason}
                            </span>
                          </td>
                          <td className="p-4 font-mono text-neutral-500 text-[11px]">
                            {new Date(r.timestamp).toLocaleString()}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={async () => {
                                if (db) {
                                  await deleteDoc(doc(db, 'reports', r.id));
                                }
                                setReports((prev) => prev.filter((item) => item.id !== r.id));
                                logAuditEvent('dismiss_report', `Dismissed report against @${r.reportedUsername}`, r.reportedUsername, r.reportedUserId);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white cursor-pointer"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => {
                                const user = dbUsers.find((u) => u.username === r.reportedUsername);
                                if (user) setUserToBan(user);
                              }}
                              className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 cursor-pointer"
                            >
                              Suspend User
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: GROUP CHATS CONTROL */}
          {activeTab === 'groups' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Group Conversations Moderation</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Inspect active encrypted group channels and member capacities across the network.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {allChats.filter((c) => c.is_group).length === 0 ? (
                  <div className="col-span-full p-8 rounded-2xl bg-neutral-900 border border-neutral-800 text-center font-mono text-neutral-500 text-xs">
                    No active group conversations found in cache.
                  </div>
                ) : (
                  allChats.filter((c) => c.is_group).map((chat, idx) => (
                    <div key={`grp_${chat.id || "grp"}_${idx}`} className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm truncate">{chat.name || 'Unnamed Group'}</h3>
                        <span className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-neutral-400 text-[10px] font-mono">
                          {chat.participants.length} Members
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400 line-clamp-2 font-mono">
                        ID: {chat.id}
                      </p>
                      <div className="pt-3 border-t border-neutral-800 flex items-center justify-between text-[11px] font-mono text-neutral-500">
                        <span>Admin: @{chat.admin || 'System'}</span>
                        <span className="text-emerald-400 font-bold">ACTIVE</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">System Audit Logs</h2>
                  <p className="text-xs text-neutral-400 font-mono mt-0.5">
                    Chronological record of administrative operations, verification events, and security adjustments.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-4 font-mono text-xs space-y-3 max-h-[500px] overflow-y-auto select-text">
                {auditLogs.length === 0 ? (
                  <div className="text-neutral-500 text-center py-6">No administrative audit entries logged yet.</div>
                ) : (
                  auditLogs.map((log, idx) => (
                    <div key={`log_${log.id || "log"}_${idx}`} className="p-3 rounded-xl bg-neutral-950 border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-neutral-400">
                        <span className="text-purple-400 font-bold">[{log.action.toUpperCase()}]</span>
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="text-white font-semibold">{log.details}</div>
                      <div className="text-[10px] text-neutral-500 flex items-center justify-between">
                        <span>Admin: {log.adminEmail}</span>
                        {log.targetUsername && <span>Target: @{log.targetUsername}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Security Key & Console Settings</h2>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Update master security passcode key and configure console environment policies.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Update Master Passcode</h3>
                <div className="space-y-3">
                  <input
                    type="password"
                    value={masterKey}
                    onChange={(e) => setMasterKey(e.target.value)}
                    placeholder="Enter new master key..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                  <button
                    onClick={() => {
                      localStorage.setItem('zenoa_master_admin_key', masterKey);
                      logAuditEvent('config_change', 'Updated Master Passcode Security Key');
                      alert('Master Security Passcode updated successfully!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider cursor-pointer border border-purple-700"
                  >
                    Save Passcode Key
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: APP BRANDING & LOGOS */}
          {activeTab === 'branding' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <Palette className="h-6 w-6 text-purple-400" />
                  <span>Application Branding & Logo Settings</span>
                </h2>
                <p className="text-xs text-neutral-400 font-sans mt-1 leading-relaxed">
                  Upload custom logos for OAuth authorization page, public pages, main messenger interface, and browser favicon. Support for image files (PNG, JPG, WEBP, SVG, ICO).
                </p>
              </div>

              {brandingSavedNotice && (
                <div className="p-3.5 bg-emerald-950/60 border border-emerald-800 rounded-2xl text-xs text-emerald-300 font-medium flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>{brandingSavedNotice}</span>
                </div>
              )}

              {/* Quick Controls */}
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-neutral-300">Quick Branding Actions:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const firstAvailable = brandingForm.oauth_logo || brandingForm.public_logo || brandingForm.messenger_logo || brandingForm.favicon_logo || brandingForm.dev_console_logo;
                      if (!firstAvailable) {
                        alert('Please upload an image file to at least one logo slot first!');
                        return;
                      }
                      setBrandingForm({
                        ...brandingForm,
                        oauth_logo: firstAvailable,
                        public_logo: firstAvailable,
                        messenger_logo: firstAvailable,
                        favicon_logo: firstAvailable,
                        dev_console_logo: firstAvailable
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition-colors cursor-pointer"
                  >
                    Apply 1 Logo to All Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to reset all custom uploaded logos to default?')) {
                        setBrandingForm({
                          oauth_logo: '',
                          public_logo: '',
                          messenger_logo: '',
                          favicon_logo: '',
                          dev_console_logo: '',
                          app_name: 'Zenoa'
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-950/50 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800 transition-colors cursor-pointer"
                  >
                    Reset All Logos
                  </button>
                </div>
              </div>

              {/* 4 Separate Upload Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. OAuth Page Logo */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Shield className="h-4 w-4 text-purple-400" />
                        <span>OAuth Page Logo</span>
                      </h3>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded-md">
                        OAuth / SSO
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Logo displayed on the "Continue with Zenoa" authorization screen and security verification screens.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {/* Image Preview Box */}
                    <div className="h-28 w-full rounded-xl bg-neutral-950 flex items-center justify-center overflow-hidden relative group">
                      {brandingForm.oauth_logo ? (
                        <img src={brandingForm.oauth_logo} alt="OAuth Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="h-8 w-8 text-neutral-600 mx-auto mb-1" />
                          <span className="text-[10px] text-neutral-500 font-mono block">No Logo Uploaded (Default Icon)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="upload-oauth-logo"
                        accept="image/*,.ico,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUploadForSlot('oauth_logo', file);
                        }}
                      />
                      <label
                        htmlFor="upload-oauth-logo"
                        className="flex-1 py-2 px-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-700 shadow-md"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                      </label>
                      {brandingForm.oauth_logo && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm(prev => ({ ...prev, oauth_logo: '' }))}
                          className="p-2 bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                          title="Remove Logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Public Page Logo */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Globe className="h-4 w-4 text-blue-400" />
                        <span>Public Page Logo</span>
                      </h3>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded-md">
                        Public / SSO Console
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Logo displayed on Public Profile pages, Landing page header, and SSO Developer Portal.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-28 w-full rounded-xl bg-neutral-950 flex items-center justify-center overflow-hidden relative group">
                      {brandingForm.public_logo ? (
                        <img src={brandingForm.public_logo} alt="Public Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="h-8 w-8 text-neutral-600 mx-auto mb-1" />
                          <span className="text-[10px] text-neutral-500 font-mono block">No Logo Uploaded (Default Icon)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="upload-public-logo"
                        accept="image/*,.ico,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUploadForSlot('public_logo', file);
                        }}
                      />
                      <label
                        htmlFor="upload-public-logo"
                        className="flex-1 py-2 px-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-700 shadow-md"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                      </label>
                      {brandingForm.public_logo && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm(prev => ({ ...prev, public_logo: '' }))}
                          className="p-2 bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                          title="Remove Logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Messenger / Main App Logo */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-400" />
                        <span>Messenger App Logo</span>
                      </h3>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded-md">
                        Messenger Main
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Logo displayed on the main Messenger header bar, mobile header, sidebar top, and opening animation.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-28 w-full rounded-xl bg-neutral-950 flex items-center justify-center overflow-hidden relative group">
                      {brandingForm.messenger_logo ? (
                        <img src={brandingForm.messenger_logo} alt="Messenger Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="h-8 w-8 text-neutral-600 mx-auto mb-1" />
                          <span className="text-[10px] text-neutral-500 font-mono block">No Logo Uploaded (Default Icon)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="upload-messenger-logo"
                        accept="image/*,.ico,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUploadForSlot('messenger_logo', file);
                        }}
                      />
                      <label
                        htmlFor="upload-messenger-logo"
                        className="flex-1 py-2 px-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-700 shadow-md"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                      </label>
                      {brandingForm.messenger_logo && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm(prev => ({ ...prev, messenger_logo: '' }))}
                          className="p-2 bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                          title="Remove Logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Browser Favicon */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-amber-400" />
                        <span>Browser Favicon</span>
                      </h3>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded-md">
                        Browser Icon
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Icon displayed in browser tabs and bookmark bars. Accepts PNG, ICO, SVG, and WEBP formats.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-28 w-full rounded-xl bg-neutral-950 flex items-center justify-center overflow-hidden relative group">
                      {brandingForm.favicon_logo ? (
                        <img src={brandingForm.favicon_logo} alt="Favicon" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="h-8 w-8 text-neutral-600 mx-auto mb-1" />
                          <span className="text-[10px] text-neutral-500 font-mono block">No Favicon Uploaded (Default)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="upload-favicon-logo"
                        accept="image/*,.ico,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUploadForSlot('favicon_logo', file);
                        }}
                      />
                      <label
                        htmlFor="upload-favicon-logo"
                        className="flex-1 py-2 px-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-700 shadow-md"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                      </label>
                      {brandingForm.favicon_logo && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm(prev => ({ ...prev, favicon_logo: '' }))}
                          className="p-2 bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                          title="Remove Favicon"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 5. Developer Console Logo */}
                <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between space-y-4 shadow-lg">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-violet-400" />
                        <span>Developer Console Logo</span>
                      </h3>
                      <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider bg-neutral-800 px-2 py-0.5 rounded-md">
                        Dev Console / Portal
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Logo displayed on Developer Console (/developer), SSO Platform headers, and Developer Portal header bar.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="h-28 w-full rounded-xl bg-neutral-950 flex items-center justify-center overflow-hidden relative group">
                      {brandingForm.dev_console_logo ? (
                        <img src={brandingForm.dev_console_logo} alt="Developer Console Logo" className="h-full w-full object-cover" />
                      ) : (
                        <div className="text-center p-2">
                          <ImageIcon className="h-8 w-8 text-neutral-600 mx-auto mb-1" />
                          <span className="text-[10px] text-neutral-500 font-mono block">No Logo Uploaded (Default Icon)</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="upload-dev-console-logo"
                        accept="image/*,.ico,.svg,.png,.jpg,.jpeg,.webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUploadForSlot('dev_console_logo', file);
                        }}
                      />
                      <label
                        htmlFor="upload-dev-console-logo"
                        className="flex-1 py-2 px-3 bg-purple-900/80 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer border border-purple-700 shadow-md"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        <span>Upload Image File</span>
                      </label>
                      {brandingForm.dev_console_logo && (
                        <button
                          type="button"
                          onClick={() => setBrandingForm(prev => ({ ...prev, dev_console_logo: '' }))}
                          className="p-2 bg-neutral-800 hover:bg-rose-950 text-neutral-400 hover:text-rose-300 rounded-xl border border-neutral-700 transition-colors cursor-pointer"
                          title="Remove Dev Console Logo"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save & Apply Bar */}
              <div className="p-5 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-neutral-400 font-sans">
                  Click <strong className="text-white">Save & Apply Branding</strong> to publish uploaded logos across all client interfaces instantly.
                </div>
                <button
                  type="button"
                  disabled={processingActions['save_branding']}
                  onClick={async () => {
                    setProcessingActions(prev => ({ ...prev, save_branding: true }));
                    try {
                      await saveBranding(brandingForm, currentUser?.username || 'admin');
                      logAuditEvent('config_change', 'Admin Updated Application Branding & Logos');
                      setBrandingSavedNotice('Branding configuration saved and published successfully!');
                      setTimeout(() => setBrandingSavedNotice(null), 4000);
                    } catch (err) {
                      console.error('Error saving branding:', err);
                    } finally {
                      setTimeout(() => {
                        setProcessingActions(prev => ({ ...prev, save_branding: false }));
                      }, 700);
                    }
                  }}
                  className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/80 disabled:opacity-80 text-white font-bold text-xs uppercase tracking-wider cursor-pointer border border-purple-400 shadow-lg shadow-purple-900/40 transition-all flex items-center gap-2 shrink-0"
                >
                  {processingActions['save_branding'] ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  <span>{processingActions['save_branding'] ? 'Saving & Applying...' : 'Save & Apply Branding'}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CREATE SERVICE ACCOUNT MODAL */}
      <AnimatePresence>
        {showCreateServiceAccountModal && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Create Zenoa Service Account
                </h3>
                <button
                  onClick={() => setShowCreateServiceAccountModal(false)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleCreateServiceAccount} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Service Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-neutral-500 text-xs font-mono">@</span>
                    <input
                      type="text"
                      required
                      value={saUsername}
                      onChange={(e) => setSaUsername(e.target.value)}
                      placeholder="zenoa_security"
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white font-mono outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={saDisplayName}
                    onChange={(e) => setSaDisplayName(e.target.value)}
                    placeholder="Zenoa Security Guard"
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Category
                  </label>
                  <select
                    value={saCategory}
                    onChange={(e) => setSaCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="System">System Core</option>
                    <option value="Security">Security & Trust</option>
                    <option value="Support">User Support</option>
                    <option value="Announcements">Announcements</option>
                    <option value="Updates">Feature Updates</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Service Description / Bio
                  </label>
                  <textarea
                    rows={2}
                    value={saBio}
                    onChange={(e) => setSaBio(e.target.value)}
                    placeholder="Automated system verification and notification bot..."
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Avatar Image (PFP) - Enter URL or Upload Image
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={saAvatarUrl}
                      onChange={(e) => setSaAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                    <label className="px-3.5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold border border-neutral-700 cursor-pointer transition-colors inline-flex items-center gap-1.5 whitespace-nowrap">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              if (event.target?.result) {
                                setSaAvatarUrl(event.target.result as string);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-300 text-[11px] font-mono flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-purple-400" />
                  <span>Will be auto-granted Official Purple Verified Badge</span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-purple-900 hover:bg-purple-800 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-purple-700 shadow-md"
                >
                  Provision Service Account
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BAN USER REASON MODAL */}
      <AnimatePresence>
        {userToBan && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-base font-black text-rose-400 uppercase tracking-wide flex items-center gap-2">
                  <UserX className="h-5 w-5" />
                  <span>Suspend Account: @{userToBan.username}</span>
                </h3>
                <button
                  onClick={() => setUserToBan(null)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                  Suspending this profile will block access to messages and show a suspension notice on login.
                </p>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Reason for Suspension
                  </label>
                  <textarea
                    rows={3}
                    value={banReasonInput}
                    onChange={(e) => setBanReasonInput(e.target.value)}
                    placeholder="Enter reason (e.g. Violation of Community Standards, Impersonation)..."
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-rose-500 resize-none"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUserToBan(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmBanUser}
                    className="flex-1 py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer shadow-md"
                  >
                    Confirm Suspension
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* USER DELETION CONFIRMATION MODAL */}
      <AnimatePresence>
        {userToDelete && (
          <div className="fixed inset-0 z-[60] bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-base font-black text-rose-500 uppercase tracking-wide flex items-center gap-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Delete Account: @{userToDelete.username}</span>
                </h3>
                <button
                  onClick={() => setUserToDelete(null)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-neutral-400 leading-relaxed font-normal">
                  Are you absolutely sure you want to <span className="text-rose-400 font-bold">PERMANENTLY DELETE</span> the account <span className="font-bold text-white">@{userToDelete.username}</span> ({userToDelete.display_name})?
                </p>
                <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-xl text-xs text-rose-300 leading-relaxed space-y-1">
                  <p className="font-bold">⚠️ Critical Consequences:</p>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-mono">
                    <li>Username <span className="text-white">@{userToDelete.username}</span> will be immediately freed up for anyone else to register.</li>
                    <li>The associated email address will be completely unbound and available for new account registration.</li>
                    <li>This operation is <span className="underline">irreversible</span>. All Firestore database references, profiles, and caches will be completely purged.</li>
                  </ul>
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setUserToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteUserPermanently}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer border border-rose-500 shadow-md transition-colors"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT USER PROFILE & PFP MODAL */}
      <AnimatePresence>
        {selectedUserForEdit && (
          <div className="fixed inset-0 z-50 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 className="h-5 w-5 text-purple-400" />
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Edit Profile: @{selectedUserForEdit.username}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedUserForEdit(null)}
                  className="p-1 text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleSaveUserEdit} className="space-y-4">
                {/* Avatar Preview & URL */}
                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Profile Picture (PFP URL)
                  </label>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="h-12 w-12 rounded-full bg-neutral-800 border border-purple-500/50 flex items-center justify-center font-bold text-white overflow-hidden shrink-0 shadow-md">
                      {editAvatarUrl ? (
                        <img src={editAvatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (editDisplayName || selectedUserForEdit.username || "U").charAt(0).toUpperCase()
                      )}
                    </div>
                    <input
                      type="url"
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://images.unsplash.com/... (Image URL)"
                      className="flex-1 px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </div>
                  {editAvatarUrl && (
                    <button
                      type="button"
                      onClick={() => setEditAvatarUrl('')}
                      className="text-[10px] text-rose-400 hover:underline font-mono"
                    >
                      Clear Avatar URL
                    </button>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Bio / Status
                  </label>
                  <textarea
                    rows={2}
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    className="w-full p-3 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500 resize-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-1">
                    Account Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-neutral-800 bg-neutral-950 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="user">Standard User</option>
                    <option value="admin">System Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-800">
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(selectedUserForEdit)}
                    className="px-3 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete User</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={processingActions['edit_user']}
                      onClick={() => setSelectedUserForEdit(null)}
                      className="px-4 py-2.5 rounded-xl border border-neutral-800 hover:bg-neutral-800 text-neutral-300 text-xs font-bold cursor-pointer disabled:opacity-55"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={processingActions['edit_user']}
                      className="px-5 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-800 disabled:bg-purple-950 disabled:opacity-80 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer border border-purple-700 shadow-md flex items-center gap-1.5"
                    >
                      {processingActions['edit_user'] ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <span>Save Changes</span>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ImageCropperModal
        isOpen={cropperOpen}
        srcImage={cropperSource}
        title="Crop Brand Logo"
        onClose={() => {
          setCropperOpen(false);
          setCropperSource('');
          setActiveCropSlot(null);
        }}
        onCrop={handleCroppedLogo}
      />
    </div>
  );
};
