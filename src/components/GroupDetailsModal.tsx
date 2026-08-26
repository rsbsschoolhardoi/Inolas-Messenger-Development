import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Users, Shield, UserPlus, LogOut, Trash2, Edit2, 
  Check, MoreVertical, Crown, UserMinus 
} from 'lucide-react';
import { Chat, UserData } from '../types';

interface GroupDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  chat: Chat;
  currentUserUsername: string;
  users: Record<string, UserData>;
  chatNicknames: Record<string, string>;
  renderAvatar: (seed: string, name: string, url?: string, sizeClass?: string) => React.ReactNode;
  onLeaveGroup: (chatId: string) => void;
  onAddParticipant?: (chatId: string, username: string) => void;
  onRemoveParticipant?: (chatId: string, username: string) => void;
}

export const GroupDetailsModal: React.FC<GroupDetailsModalProps> = ({
  isOpen,
  onClose,
  chat,
  currentUserUsername,
  users,
  chatNicknames,
  renderAvatar,
  onLeaveGroup,
  onAddParticipant,
  onRemoveParticipant,
}) => {
  const [showAddMembers, setShowAddMembers] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const isAdmin = chat.admin === currentUserUsername || chat.group_admins?.includes(currentUserUsername);
  const rawParticipants = chat.participants || [];
  const participants = Array.from(new Set(rawParticipants));

  const availableToAdd = React.useMemo(() => {
    const map = new Map<string, UserData>();
    Object.values(users).forEach((u) => {
      if (u && u.username && !participants.includes(u.username)) {
        const canonicalKey = (u.username || u.id || '').trim().toLowerCase();
        if (canonicalKey && !map.has(canonicalKey)) {
          map.set(canonicalKey, u);
        }
      }
    });
    return Array.from(map.values());
  }, [users, participants]);

  const filteredToAdd = availableToAdd.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

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
        className="relative w-full max-w-md rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 flex flex-col max-h-[85vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-base font-bold text-neutral-900 dark:text-white">Group Information</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Group Hero Info */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5">
          <div className="flex flex-col items-center text-center space-y-2">
            <div className="p-1 rounded-full bg-neutral-100 dark:bg-neutral-800 shadow-sm">
              {renderAvatar(chat.avatar_seed || chat.name, chat.name, chat.avatar_url, 'h-20 w-20 text-2xl shadow-inner')}
            </div>
            <div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-white">{chat.name}</h3>
              <p className="text-xs text-neutral-400 font-medium">
                Group • {participants.length} {participants.length === 1 ? 'member' : 'members'}
              </p>
            </div>
            {chat.group_description && (
              <p className="text-xs text-neutral-600 dark:text-neutral-300 max-w-sm px-4 leading-relaxed font-normal bg-neutral-50 dark:bg-neutral-800/40 p-2.5 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                {chat.group_description}
              </p>
            )}
          </div>

          {/* Members List Header */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Participants ({participants.length})
              </span>
              {isAdmin && !showAddMembers && onAddParticipant && (
                <button
                  onClick={() => setShowAddMembers(true)}
                  className="flex items-center gap-1 text-xs font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Add Member</span>
                </button>
              )}
            </div>

            {/* Add Member Dropdown / Search */}
            {showAddMembers && (
              <div className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 space-y-2 animate-fade-in">
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
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available contacts..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-xs outline-none"
                />
                <div className="max-h-36 overflow-y-auto space-y-1">
                  {filteredToAdd.length === 0 ? (
                    <p className="text-xs text-neutral-400 py-2 text-center">No additional contacts found</p>
                  ) : (
                    filteredToAdd.map((u, idx) => (
                      <div
                        key={`add_member_${u.username}_${idx}`}
                        className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderAvatar(u.avatar_seed || u.username, u.display_name, u.avatar_url, 'h-7 w-7 text-[10px]')}
                          <span className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                            {u.display_name}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (onAddParticipant) {
                              onAddParticipant(chat.id, u.username);
                              setShowAddMembers(false);
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-bold hover:opacity-90"
                        >
                          Add
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Participants list */}
            <div className="space-y-1">
              {participants.map((username, idx) => {
                const u = users[username];
                const isUserAdmin = chat.admin === username || chat.group_admins?.includes(username);
                const isSelf = username === currentUserUsername;
                const displayName = chatNicknames[username] || u?.display_name || username;

                return (
                  <div
                    key={`participant_${username}_${idx}`}
                    className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-50/70 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {renderAvatar(
                        u?.avatar_seed || username,
                        u?.display_name || username,
                        u?.avatar_url,
                        'h-9 w-9 text-xs'
                      )}
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {isSelf ? `${displayName} (You)` : displayName}
                          </p>
                          {isUserAdmin && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 text-[9px] font-bold">
                              <Crown className="h-2.5 w-2.5" /> Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-neutral-400">@{username}</p>
                      </div>
                    </div>

                    {isAdmin && !isSelf && onRemoveParticipant && (
                      <button
                        onClick={() => onRemoveParticipant(chat.id, username)}
                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/30 text-neutral-400 hover:text-rose-500 transition-colors"
                        title="Remove from group"
                      >
                        <UserMinus className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Group Actions */}
          <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
            <button
              onClick={() => {
                onClose();
                onLeaveGroup(chat.id);
              }}
              className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs transition-colors cursor-pointer"
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
