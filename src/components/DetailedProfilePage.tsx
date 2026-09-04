import React, { useState } from 'react';
import { 
  ChevronLeft, Shield, Lock, MessageSquare, 
  UserPlus, UserCheck, Share2, Check, ShieldCheck
} from 'lucide-react';
import { UserData } from '../types';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { isUserEffectivelyOnline, isServiceAccount } from '../presenceUtils';

interface DetailedProfilePageProps {
  targetUsername: string | null;
  onClose: () => void;
  userUsername: string;
  users: Record<string, UserData>;
  themeMode: 'light' | 'dark';
  handleFollow: (user: UserData) => Promise<void>;
  renderAvatar: (seed?: string, name?: string, avatarUrl?: string, sizeClass?: string) => React.ReactNode;
  onOpenDM: (targetUsername: string) => void;
  onOpenFollowers: (username: string) => void;
  onOpenFollowing: (username: string) => void;
  showToast: (msg: string) => void;
  blockedUsers?: string[];
  handleToggleBlockUser?: (username: string) => void;
  handleReportUser?: (username: string) => void;
}

export const DetailedProfilePage: React.FC<DetailedProfilePageProps> = ({
  targetUsername,
  onClose,
  userUsername,
  users,
  themeMode,
  handleFollow,
  renderAvatar,
  onOpenDM,
  onOpenFollowers,
  onOpenFollowing,
  showToast,
  blockedUsers = [],
  handleToggleBlockUser,
  handleReportUser,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  if (!targetUsername) return null;

  const cleanTargetUsername = targetUsername.replace(/^@/, '').trim();
  const targetUsernameLower = cleanTargetUsername.toLowerCase();
  const targetUser = (users[targetUsernameLower] || {
    username: cleanTargetUsername,
    display_name: cleanTargetUsername,
    avatar_seed: cleanTargetUsername,
  }) as UserData;

  const isMe = targetUsernameLower === userUsername.toLowerCase();
  const followersList = targetUser.followers || [];
  const followingList = targetUser.following || [];
  const amIFollowing = followersList.includes(userUsername);
  const isPrivate = !!targetUser.is_private;
  const isLocked = isPrivate && !amIFollowing && !isMe;
  const isBot = isServiceAccount(targetUser, cleanTargetUsername);

  const cleanUsernameWithoutAt = cleanTargetUsername;

  const handleCopyProfileLink = () => {
    if (navigator.clipboard) {
      const shareUrl = `${window.location.origin}/u/${cleanTargetUsername}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      showToast('Profile link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div 
      id="detailed-profile-viewport"
      className={`fixed inset-0 z-50 flex flex-col w-full h-full overflow-y-auto animate-fade-in ${
        themeMode === 'dark' ? 'bg-[#0b0f19] text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Header Bar */}
      <div className={`sticky top-0 z-20 flex items-center justify-between px-6 py-4 border-b backdrop-blur-md shrink-0 ${
        themeMode === 'dark' ? 'bg-[#0b0f19]/95 border-slate-800/80' : 'bg-slate-50/95 border-slate-200/80'
      }`}>
        <button
          id="detailed-profile-back-btn"
          onClick={onClose}
          className="p-2.5 -ml-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
          title="Back"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <div className="flex items-center gap-1.5 justify-center">
          {isPrivate && (
            <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
          )}
          <span className="text-sm font-extrabold tracking-wide text-slate-800 dark:text-slate-200">
            {cleanUsernameWithoutAt}
          </span>
          {!!targetUser.is_verified && (
            <PurpleVerifiedBadge size="sm" />
          )}
        </div>

        <button
          id="detailed-profile-share-btn"
          onClick={handleCopyProfileLink}
          className="p-2.5 -mr-2.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition-all cursor-pointer flex items-center justify-center"
          title="Share Profile Link"
        >
          {copiedLink ? <Check className="h-5 w-5 text-emerald-500" /> : <Share2 className="h-5 w-5" />}
        </button>
      </div>

      {/* Profile Page Content */}
      <div className="w-full max-w-lg mx-auto px-6 py-8 flex flex-col items-center space-y-6 flex-1">
        
        {/* 1. Profile Avatar (PFP) Container */}
        <div className="relative shrink-0 flex justify-center mt-2">
          <div className="p-1 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0f1422] shadow-xs">
            {renderAvatar(
              targetUser.avatar_seed || cleanTargetUsername,
              targetUser.display_name || cleanTargetUsername,
              targetUser.avatar_url,
              'h-24 w-24 text-3xl shadow-inner'
            )}
          </div>
          {isUserEffectivelyOnline(targetUser) && (
            <span className="absolute bottom-1 right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 border-3 border-white dark:border-[#0b0f19] shadow-xs" title="Online" />
          )}
        </div>

        {/* 2. Full Name / Display Name (Username is strictly in the header) */}
        <div className="flex flex-col items-center text-center space-y-1">
          <div className="flex items-center justify-center gap-1.5">
            <h1 className="text-xl font-bold tracking-tight font-sans text-slate-900 dark:text-white">
              {targetUser.display_name || cleanTargetUsername}
            </h1>
            {!!targetUser.is_verified && (
              <PurpleVerifiedBadge size="sm" />
            )}
          </div>
        </div>

        {/* 3. Follower / Following Stats (Flat layout) */}
        <div className="w-full flex items-center justify-center gap-12 text-center py-1">
          <button
            id="detailed-profile-followers-stat"
            onClick={() => !isLocked && onOpenFollowers(cleanTargetUsername)}
            className="flex flex-col items-center hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {followersList.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Followers
            </span>
          </button>

          <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800" />

          <button
            id="detailed-profile-following-stat"
            onClick={() => !isLocked && onOpenFollowing(cleanTargetUsername)}
            className="flex flex-col items-center hover:opacity-85 transition-opacity cursor-pointer group"
          >
            <span className="text-lg font-black text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {followingList.length}
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5">
              Following
            </span>
          </button>
        </div>

        {/* 4. Bio Section (Clean plain text, no quotes) */}
        {targetUser.bio ? (
          <div className="w-full text-center px-4 max-w-sm">
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal break-words">
              {targetUser.bio}
            </p>
          </div>
        ) : (
          isBot && (
            <div className="w-full text-center px-4 max-w-sm">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/30 px-2.5 py-1 rounded-md border border-violet-100 dark:border-violet-800/30">
                <Shield className="h-3.5 w-3.5" />
                Official Service Bot
              </span>
            </div>
          )
        )}

        {/* 5. Direct Interactions Action Buttons (Premium typography & minimal styles) */}
        {isLocked ? (
          /* Private Locked Profile Area */
          <div className="w-full flex flex-col items-center space-y-6 pt-4 text-center">
            <div className="space-y-1.5 max-w-xs">
              <h3 className="text-sm font-bold text-slate-950 dark:text-white">This Account is Private</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Follow this user to view their activity and start chatting on Zenoa.
              </p>
            </div>
            {!isMe && (
              <button
                id="detailed-profile-private-follow-btn"
                onClick={() => handleFollow(targetUser)}
                className="px-8 py-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs tracking-wider uppercase shadow-md hover:shadow-indigo-600/25 transition-all cursor-pointer"
              >
                Follow to Connect
              </button>
            )}
          </div>
        ) : (
          /* Interactive Action Controls - Centered with proper spacing */
          <div className="w-full max-w-sm pt-2">
            {!isMe && !isBot ? (
              <div className="flex items-center justify-center gap-3 w-full">
                {/* Follow / Following Button */}
                <button
                  id="detailed-profile-follow-action-btn"
                  onClick={() => handleFollow(targetUser)}
                  className={`flex-1 py-3 px-4 rounded-2xl font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 ${
                    amIFollowing
                      ? 'bg-slate-100 dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-neutral-700 border border-slate-200/80 dark:border-neutral-700'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                  }`}
                >
                  {amIFollowing ? (
                    <>
                      <UserCheck className="h-4 w-4 shrink-0" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 shrink-0" />
                      <span>Follow</span>
                    </>
                  )}
                </button>

                {/* Direct Message Button */}
                <button
                  id="detailed-profile-msg-btn"
                  onClick={() => {
                    onClose();
                    onOpenDM(cleanTargetUsername);
                  }}
                  className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" />
                  <span>Message</span>
                </button>
              </div>
            ) : isMe ? (
              <div className="text-center">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800/50 px-3 py-1.5 rounded-full select-none">
                  Viewing Your Own Profile
                </span>
              </div>
            ) : null}
          </div>
        )}

        {/* 6. Privacy & Action Controls Section (Positioned elegantly below Message/Follow under a proper divider) */}
        {!isMe && !isBot && (
          <div className="w-full max-w-sm pt-4 space-y-4">
            {/* Divider line */}
            <div className="w-full border-t border-slate-200/80 dark:border-slate-800/80" />

            {/* Privacy Section Title */}
            <div className="px-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Privacy & Account Actions
              </span>
            </div>

            <div className="space-y-1 bg-white dark:bg-neutral-900 border border-slate-200/80 dark:border-slate-800/60 rounded-2xl overflow-hidden p-1.5 shadow-xs">
              {/* Share Profile Link */}
              <button 
                onClick={handleCopyProfileLink}
                className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer group"
              >
                <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-600 dark:text-slate-400">
                  <Share2 className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Share Contact Profile</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Copy profile link to share with others</p>
                </div>
              </button>

              {/* Block / Unblock Contact */}
              {handleToggleBlockUser && (
                <button 
                  onClick={() => handleToggleBlockUser(cleanTargetUsername)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors text-left cursor-pointer group"
                >
                  <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    {blockedUsers.includes(cleanTargetUsername) ? (
                      <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <Lock className="h-4 w-4 text-rose-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {blockedUsers.includes(cleanTargetUsername) ? 'Unblock Contact' : 'Block Contact'}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {blockedUsers.includes(cleanTargetUsername) ? 'Allow this contact to message you' : 'Stop this contact from messaging you'}
                    </p>
                  </div>
                </button>
              )}

              {/* Report Account */}
              {handleReportUser && (
                <button 
                  onClick={() => handleReportUser(cleanTargetUsername)}
                  className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors text-left cursor-pointer group text-rose-600 dark:text-rose-400"
                >
                  <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center shrink-0 text-rose-600 dark:text-rose-400">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold">Report Account</p>
                    <p className="text-[11px] text-rose-500/80 dark:text-rose-400/80">Report this profile for safety or spam</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

