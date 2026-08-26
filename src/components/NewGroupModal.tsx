import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Users, Search, Check, AlertCircle, Sparkles, Plus } from 'lucide-react';
import { UserData } from '../types';

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserUsername: string;
  users: Record<string, UserData>;
  initialSelectedUsername?: string | null;
  onCreateGroup: (groupData: {
    name: string;
    description: string;
    participants: string[];
    avatarSeed: string;
  }) => Promise<void> | void;
  renderAvatar: (seed: string, name: string, url?: string, sizeClass?: string) => React.ReactNode;
}

export const NewGroupModal: React.FC<NewGroupModalProps> = ({
  isOpen,
  onClose,
  currentUserUsername,
  users,
  initialSelectedUsername,
  onCreateGroup,
  renderAvatar,
}) => {
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(() => {
    return initialSelectedUsername && initialSelectedUsername !== currentUserUsername
      ? [initialSelectedUsername]
      : [];
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Available users excluding current user (deduplicated by username/id)
  const candidateUsers = React.useMemo(() => {
    const map = new Map<string, UserData>();
    Object.values(users).forEach((u) => {
      if (u && u.username && u.username !== currentUserUsername) {
        const canonicalKey = (u.username || u.id || '').trim().toLowerCase();
        if (canonicalKey && !map.has(canonicalKey)) {
          map.set(canonicalKey, u);
        }
      }
    });
    return Array.from(map.values());
  }, [users, currentUserUsername]);

  const filteredUsers = candidateUsers.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.display_name && u.display_name.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q))
    );
  });

  const toggleSelectMember = (username: string) => {
    setErrorMsg('');
    setSelectedMembers((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = groupName.trim();
    if (!cleanName) {
      setErrorMsg('Please enter a group name.');
      return;
    }
    if (selectedMembers.length === 0) {
      setErrorMsg('Please select at least one contact to join the group.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onCreateGroup({
        name: cleanName,
        description: groupDescription.trim(),
        participants: [currentUserUsername, ...selectedMembers],
        avatarSeed: cleanName,
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to create group. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-2xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-xs">
              <Users className="h-5 w-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900 dark:text-white">Create Group Chat</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {selectedMembers.length} {selectedMembers.length === 1 ? 'member' : 'members'} selected
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="flex-1 flex flex-col overflow-hidden pt-4 space-y-4">
          {errorMsg && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Group Metadata Inputs */}
          <div className="space-y-3 shrink-0">
            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Group Name *
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => {
                  setGroupName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="e.g. Design Sync, Family Circle, Project Alpha"
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all font-medium"
                maxLength={50}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                Group Description (Optional)
              </label>
              <input
                type="text"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full px-3.5 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
                maxLength={120}
              />
            </div>
          </div>

          {/* Selected Chips */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1 max-h-20 overflow-y-auto shrink-0">
              {selectedMembers.map((u) => {
                const profile = users[u];
                return (
                  <div
                    key={u}
                    className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-xs font-semibold shadow-xs"
                  >
                    <span>{profile?.display_name || u}</span>
                    <button
                      type="button"
                      onClick={() => toggleSelectMember(u)}
                      className="p-0.5 rounded-full hover:bg-white/20 dark:hover:bg-black/20 transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Member Search & Selection */}
          <div className="flex-1 flex flex-col min-h-0 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Add Participants
              </label>
              <span className="text-[11px] text-neutral-400">
                {candidateUsers.length} available contacts
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search contacts..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1 divide-y divide-neutral-100 dark:divide-neutral-800/50">
              {filteredUsers.length === 0 ? (
                <div className="py-6 text-center text-neutral-400 text-xs">
                  No contacts found
                </div>
              ) : (
                filteredUsers.map((u, idx) => {
                  const isSelected = selectedMembers.includes(u.username);
                  return (
                    <div
                      key={`new_group_user_${u.username}_${idx}`}
                      onClick={() => toggleSelectMember(u.username)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-neutral-100/90 dark:bg-neutral-800/90'
                          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {renderAvatar(
                          u.avatar_seed || u.username,
                          u.display_name,
                          u.avatar_url,
                          'h-9 w-9 text-xs'
                        )}
                        <div className="min-w-0 text-left">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {u.display_name}
                          </p>
                          <p className="text-[11px] text-neutral-400 truncate">@{u.username}</p>
                        </div>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-neutral-900 dark:bg-white border-neutral-900 dark:border-white text-white dark:text-neutral-900'
                            : 'border-neutral-300 dark:border-neutral-700'
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedMembers.length === 0}
              className="px-5 py-2 text-xs font-bold bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            >
              {isSubmitting ? (
                <span>Creating...</span>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Create Group</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
