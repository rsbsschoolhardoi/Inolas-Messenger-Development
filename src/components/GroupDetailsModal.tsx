import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Shield, UserPlus, LogOut, Edit2, 
  Crown, UserMinus, Link, Copy, QrCode, FileText, Image as ImageIcon, 
  MessageSquare, Settings, AlertCircle, Save, Check, Volume2, VolumeX, Pin, Megaphone, UserCheck
} from 'lucide-react';
import { Chat, UserData, Message } from '../types';
import { isServiceAccount } from '../presenceUtils';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  currentUserUsername: string;
  users: Record<string, UserData>;
  chatNicknames: Record<string, string>;
  groupMessages?: Message[];
  renderAvatar: (seed: string, name: string, url?: string, sizeClass?: string) => React.ReactNode;
  onLeaveGroup: (chatId: string) => void;
  onAddParticipant?: (chatId: string, username: string) => void;
  onRemoveParticipant?: (chatId: string, username: string) => void;
  onUpdateGroupInfo?: (chatId: string, updates: Partial<Chat>) => void;
  onToggleAdmin?: (chatId: string, targetUsername: string, makeAdmin: boolean) => void;
  showToast?: (msg: string) => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  chat,
  currentUserUsername,
  users,
  chatNicknames,
  groupMessages = [],
  renderAvatar,
  onLeaveGroup,
  onAddParticipant,
  onRemoveParticipant,
  onUpdateGroupInfo,
  onToggleAdmin,
  showToast = () => {},
}) => {
  const [activeTab, setActiveTab] = useState<'members' | 'media' | 'settings'>('members');
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [addSearchQuery, setAddSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);

  // Group Edit State
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editName, setEditName] = useState(chat?.name || '');
  const [editDesc, setEditDesc] = useState(chat?.group_description || '');
  const [editNotice, setEditNotice] = useState(chat?.group_notice || '');
  const [editAvatarSeed, setEditAvatarSeed] = useState(chat?.avatar_seed || '');

  const rawParticipants = chat?.participants || [];
  const participants = React.useMemo(() => Array.from(new Set(rawParticipants)), [rawParticipants]);

  const availableToAdd = React.useMemo(() => {
    const map = new Map<string, UserData>();
    Object.values(users || {}).forEach((u) => {
      if (u && u.username && !participants.includes(u.username)) {
        const canonicalKey = (u.username || u.id || '').trim().toLowerCase();
        if (canonicalKey && !map.has(canonicalKey)) {
          map.set(canonicalKey, u);
        }
      }
    });
    return Array.from(map.values());
  }, [users, participants]);

  if (!isOpen || !chat) return null;

  const isAdmin = chat.admin === currentUserUsername || chat.group_admins?.includes(currentUserUsername);
  const canEditInfo = isAdmin || chat.edit_info_permission !== 'admins';

  // Shared media filtering
  const mediaMessages = groupMessages.filter(m => m.type === 'image' || m.type === 'video');
  const docMessages = groupMessages.filter(m => m.type === 'document');
  const pollMessages = groupMessages.filter(m => m.type === 'poll');

  const filteredParticipants = participants.filter((username) => {
    if (!username) return false;
    const q = memberSearchQuery.toLowerCase().trim();
    if (!q) return true;
    const u = users[username];
    const nickname = chatNicknames[username];
    const nameStr = (nickname || u?.display_name || username || '').toLowerCase();
    return nameStr.includes(q) || (username && username.toLowerCase().includes(q));
  });

  const filteredToAdd = availableToAdd.filter((u) => {
    const q = addSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const handleCopyInviteLink = () => {
    const link = `https://zenoa.app/g/${chat.id}`;
    try {
      navigator.clipboard.writeText(link);
      setCopiedLink(true);
      showToast('Group invite link copied to clipboard!');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      showToast(`Group link: ${link}`);
    }
  };

  const handleSaveGroupInfo = () => {
    if (!editName.trim()) {
      showToast('Group name cannot be empty');
      return;
    }
    if (onUpdateGroupInfo) {
      onUpdateGroupInfo(chat.id, {
        name: editName.trim(),
        group_description: editDesc.trim(),
        group_notice: editNotice.trim(),
        avatar_seed: editAvatarSeed.trim() || editName.trim(),
      });
      showToast('Group information updated!');
    }
    setIsEditingInfo(false);
  };

  const handleToggleSendPermission = (permission: 'all' | 'admins') => {
    if (onUpdateGroupInfo) {
      onUpdateGroupInfo(chat.id, { send_messages_permission: permission });
      showToast(`Messages restricted to: ${permission === 'admins' ? 'Admins only' : 'All members'}`);
    }
  };

  const handleToggleEditPermission = (permission: 'all' | 'admins') => {
    if (onUpdateGroupInfo) {
      onUpdateGroupInfo(chat.id, { edit_info_permission: permission });
      showToast(`Group info edit restricted to: ${permission === 'admins' ? 'Admins only' : 'All members'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between p-4 px-6 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-500" />
            <h2 className="text-base font-bold text-neutral-900 dark:text-white">Group Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Main Area */}
        <div className="flex-1 overflow-y-auto">
          {/* Hero Banner Section */}
          <div className="p-6 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-850 dark:to-neutral-900 border-b border-neutral-100 dark:border-neutral-800 text-center space-y-3">
            <div className="relative inline-block">
              <div className="p-1 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-xl">
                {renderAvatar(chat.avatar_seed || chat.name, chat.name, chat.avatar_url, 'h-20 w-20 text-2xl border-4 border-white dark:border-neutral-900 shadow-inner')}
              </div>
              {canEditInfo && (
                <button
                  onClick={() => setIsEditingInfo(!isEditingInfo)}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg hover:scale-110 transition-transform cursor-pointer border border-white dark:border-neutral-900"
                  title="Edit Group Info"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
              )}
            </div>

            <div>
              <h3 className="text-xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2">
                <span>{chat.name}</span>
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium mt-0.5">
                Group • {participants.length} {participants.length === 1 ? 'member' : 'members'} • Created by @{chat.admin || 'admin'}
              </p>
            </div>

            {/* Description & Notice display */}
            {chat.group_description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-md mx-auto leading-relaxed bg-white dark:bg-neutral-800/60 p-3 rounded-2xl border border-neutral-200/60 dark:border-neutral-750 shadow-xs">
                {chat.group_description}
              </p>
            )}

            {chat.group_notice && (
              <div className="flex items-start gap-2 max-w-md mx-auto p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 text-left">
                <Megaphone className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                    Group Announcement
                  </span>
                  <p className="text-xs text-amber-900 dark:text-amber-200 font-medium leading-relaxed">
                    {chat.group_notice}
                  </p>
                </div>
              </div>
            )}

            {/* Quick Action Pills: Copy Invite Link & QR Code */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleCopyInviteLink}
                className="px-3.5 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Link className="h-3.5 w-3.5" />}
                <span>{copiedLink ? 'Copied Link!' : 'Invite Link'}</span>
              </button>

              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <QrCode className="h-3.5 w-3.5" />
                <span>QR Code</span>
              </button>
            </div>

            {/* QR Code Popup */}
            {showQrCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 max-w-xs mx-auto rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-lg space-y-2 text-center"
              >
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Group Share QR Code</p>
                <div className="p-3 bg-white rounded-xl inline-block border border-neutral-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://zenoa.app/g/${chat.id}`}
                    alt="Group QR Code"
                    className="h-32 w-32 mx-auto"
                  />
                </div>
                <p className="text-[10px] text-neutral-400">Scan to join {chat.name}</p>
              </motion.div>
            )}
          </div>

          {/* Inline Info Edit Modal / Drawer */}
          <AnimatePresence>
            {isEditingInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-5 bg-indigo-50/50 dark:bg-indigo-950/20 border-b border-indigo-100 dark:border-indigo-900/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                    <Edit2 className="h-3.5 w-3.5" /> Edit Group Identity
                  </h4>
                  <button
                    onClick={() => setIsEditingInfo(false)}
                    className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Group Name</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Group Name..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs font-semibold outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Group Description</label>
                    <textarea
                      value={editDesc}
                      onChange={(e) => setEditDesc(e.target.value)}
                      placeholder="Add a group topic or description..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none focus:border-indigo-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase">Pinned Announcement / Notice</label>
                    <input
                      type="text"
                      value={editNotice}
                      onChange={(e) => setEditNotice(e.target.value)}
                      placeholder="Announcement notice visible to all members..."
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      onClick={() => setIsEditingInfo(false)}
                      className="px-3 py-1.5 rounded-xl bg-neutral-200 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveGroupInfo}
                      className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 shadow-md active:scale-95"
                    >
                      <Save className="h-3.5 w-3.5" />
                      <span>Save Changes</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-Navigation Tabs */}
          <div className="flex border-b border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 sticky top-0 z-10 px-4">
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'members'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Members ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('media')}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                activeTab === 'media'
                  ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                  : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
              }`}
            >
              <ImageIcon className="h-4 w-4" />
              <span>Media & Files ({mediaMessages.length + docMessages.length})</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition-colors cursor-pointer ${
                  activeTab === 'settings'
                    ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                <Settings className="h-4 w-4" />
                <span>Group Permissions</span>
              </button>
            )}
          </div>

          {/* TAB 1: MEMBERS LIST & ADD MEMBERS */}
          {activeTab === 'members' && (
            <div className="p-4 space-y-4">
              {/* Member Search & Add Button */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  placeholder="Search participants..."
                  className="flex-1 px-3 py-2 rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs outline-none"
                />
                {isAdmin && !showAddMembers && onAddParticipant && (
                  <button
                    onClick={() => setShowAddMembers(true)}
                    className="px-3.5 py-2 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    <UserPlus className="h-3.5 w-3.5" />
                    <span>Add Member</span>
                  </button>
                )}
              </div>

              {/* Add Member Dropdown / Search */}
              {showAddMembers && (
                <div className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-900 dark:text-white">Add Contact to Group</span>
                    <button
                      onClick={() => setShowAddMembers(false)}
                      className="p-1 rounded-full text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={addSearchQuery}
                    onChange={(e) => setAddSearchQuery(e.target.value)}
                    placeholder="Search available contacts..."
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-1.5">
                    {filteredToAdd.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-3 text-center">No additional contacts available</p>
                    ) : (
                      filteredToAdd.map((u, idx) => (
                        <div
                          key={`add_member_${u.username}_${idx}`}
                          className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderAvatar(u.avatar_seed || u.username, u.display_name, u.avatar_url, 'h-8 w-8 text-xs')}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                                <span>{u.display_name}</span>
                                {(!!u.is_verified || isServiceAccount(u, u.username)) && (
                                  <PurpleVerifiedBadge size="xs"  />
                                )}
                              </p>
                              <p className="text-[10px] text-neutral-400">@{u.username}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (onAddParticipant) {
                                onAddParticipant(chat.id, u.username);
                                setShowAddMembers(false);
                              }
                            }}
                            className="px-3 py-1 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90 active:scale-95 cursor-pointer"
                          >
                            Add
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-1.5">
                {filteredParticipants.map((username, idx) => {
                  const u = users[username];
                  const isUserAdmin = chat.admin === username || chat.group_admins?.includes(username);
                  const isSelf = username === currentUserUsername;
                  const displayName = chatNicknames[username] || u?.display_name || username;

                  return (
                    <div
                      key={`participant_${username}_${idx}`}
                      className="flex items-center justify-between p-3 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderAvatar(
                          u?.avatar_seed || username,
                          u?.display_name || username,
                          u?.avatar_url,
                          'h-10 w-10 text-xs shadow-xs'
                        )}
                        <div className="min-w-0 text-left">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate flex items-center gap-1">
                              <span>{isSelf ? `${displayName} (You)` : displayName}</span>
                              {u && (!!u.is_verified || isServiceAccount(u, u.username)) && (
                                <PurpleVerifiedBadge size="xs"  />
                              )}
                            </p>
                            {isUserAdmin && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[9px] font-bold border border-amber-300/40">
                                <Crown className="h-2.5 w-2.5" /> Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-neutral-400 font-mono">@{username}</p>
                        </div>
                      </div>

                      {/* Admin Controls for non-self members */}
                      {isAdmin && !isSelf && (
                        <div className="flex items-center gap-1">
                          {/* Toggle Admin */}
                          {onToggleAdmin && (
                            <button
                              onClick={() => onToggleAdmin(chat.id, username, !isUserAdmin)}
                              className={`p-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                isUserAdmin
                                  ? 'hover:bg-amber-100 dark:hover:bg-amber-950/40 text-amber-600'
                                  : 'hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-500'
                              }`}
                              title={isUserAdmin ? "Dismiss as Admin" : "Make Group Admin"}
                            >
                              <Crown className="h-4 w-4" />
                            </button>
                          )}

                          {/* Remove Member */}
                          {onRemoveParticipant && (
                            <button
                              onClick={() => onRemoveParticipant(chat.id, username)}
                              className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 transition-colors cursor-pointer"
                              title="Remove from group"
                            >
                              <UserMinus className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SHARED MEDIA & FILES */}
          {activeTab === 'media' && (
            <div className="p-4 space-y-4">
              {/* Media Gallery Grid */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Photos & Videos ({mediaMessages.length})
                </h4>
                {mediaMessages.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl">
                    No photos or videos shared yet
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {mediaMessages.map((msg) => (
                      <div key={msg.id} className="aspect-square rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 relative group border border-neutral-200/50 dark:border-neutral-750">
                        {msg.type === 'image' ? (
                          <img src={msg.media_url} alt="Shared" className="w-full h-full object-cover" />
                        ) : (
                          <video src={msg.media_url} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                          <span className="text-[10px] text-white font-medium truncate">@{msg.sender}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents List */}
              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> Documents & Files ({docMessages.length})
                </h4>
                {docMessages.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-3 text-center bg-neutral-50 dark:bg-neutral-800/40 rounded-2xl">
                    No documents shared yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {docMessages.map((msg) => (
                      <div key={msg.id} className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                              {msg.file_name || 'Document'}
                            </p>
                            <p className="text-[10px] text-neutral-400">{msg.file_size || 'File'} • @{msg.sender}</p>
                          </div>
                        </div>
                        {msg.media_url && (
                          <a
                            href={msg.media_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 rounded-xl bg-neutral-200 dark:bg-neutral-700 text-xs font-bold text-neutral-800 dark:text-neutral-200 hover:opacity-80"
                          >
                            Download
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GROUP PERMISSIONS & ADMIN SETTINGS */}
          {activeTab === 'settings' && isAdmin && (
            <div className="p-5 space-y-5">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  Group Permissions Management
                </h4>

                {/* Send Messages Permission */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">Send Messages</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Choose who can send messages to this group</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleToggleSendPermission('all')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        chat.send_messages_permission !== 'admins'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      All Members
                    </button>
                    <button
                      onClick={() => handleToggleSendPermission('admins')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        chat.send_messages_permission === 'admins'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Admins Only
                    </button>
                  </div>
                </div>

                {/* Edit Group Info Permission */}
                <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-neutral-900 dark:text-white">Edit Group Info</p>
                      <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Choose who can edit group name, icon, and notice</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleToggleEditPermission('all')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        chat.edit_info_permission !== 'admins'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      All Members
                    </button>
                    <button
                      onClick={() => handleToggleEditPermission('admins')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        chat.edit_info_permission === 'admins'
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      Admins Only
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DANGER ZONE: LEAVE GROUP */}
          <div className="p-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              onClick={() => {
                onClose();
                onLeaveGroup(chat.id);
              }}
              className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Leave Group</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
