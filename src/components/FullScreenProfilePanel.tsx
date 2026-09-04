import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BellOff, Users, Bell, Lock, Share2, Shield, ImageIcon, User, Clock, 
  Palette, RefreshCw, Edit3, Camera, Play, ChevronRight, Search, 
  ChevronLeft, MoreHorizontal, Edit2, Video, ShieldCheck, Phone, Settings
} from 'lucide-react';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { UserData, Message, FollowRequest } from '../types';
import { isUserEffectivelyOnline, isServiceAccount } from '../presenceUtils';

interface FullScreenProfilePanelProps {
  showProfilePanel: boolean;
  selectedProfileUsername: string | null;
  userUsername: string;
  themeMode: 'light' | 'dark';
  users: Record<string, UserData>;
  setShowProfilePanel: (show: boolean) => void;
  setShowProfileOptionsModal: (show: boolean) => void;
  followRequests: FollowRequest[];
  handleFollow: (user: UserData) => Promise<void>;
  renderAvatar: (seed?: string, name?: string, avatarUrl?: string, sizeClass?: string) => React.ReactNode;
  activeChat: any;
  showToast: (msg: string) => void;
  chatNicknames: Record<string, string>;
  setEditingNicknameUser: (username: string | null) => void;
  setTempNicknameValue: (val: string) => void;
  setShowThemeModal: (show: boolean) => void;
  userDisplayName: string;
  setShowFollowListModal: (mode: any) => void;
  setActiveView: (view: any) => void;
  userBio: string;
  handleOpenEditProfile: () => void;
  setShowPrivacySafetyModal: (show: boolean) => void;
  setShowMsgSearchInChat: (show: boolean) => void;
  handleToggleMuteChat: (chatId: string) => void;
  setShowChatCustomizationSheet: (show: boolean) => void;
  setChatCustomizationView: (view: any) => void;
  chatDisappearing: Record<string, string>;
  setNewGroupPreselectedUser: (username: string | null) => void;
  setShowNewGroupModal: (show: boolean) => void;
  messagesByChat: Record<string, Message[]>;
  setSharedMediaPreview: (data: any) => void;
  handleStartCallWithUser: (user: any, callType: 'voice' | 'video') => void;
  allUserCalls: any[];
  userAvatarSeed: string;
  userAvatarUrl: string;
  onOpenDetailedProfile?: (username: string) => void;
  blockedUsers?: string[];
  handleToggleBlockUser?: (username: string) => void;
  handleReportUser?: (username: string) => void;
}

export const FullScreenProfilePanel: React.FC<FullScreenProfilePanelProps> = ({
  showProfilePanel,
  selectedProfileUsername,
  userUsername,
  themeMode,
  users,
  setShowProfilePanel,
  setShowProfileOptionsModal,
  followRequests,
  handleFollow,
  renderAvatar,
  activeChat,
  showToast,
  chatNicknames,
  setEditingNicknameUser,
  setTempNicknameValue,
  setShowThemeModal,
  userDisplayName,
  setShowFollowListModal,
  setActiveView,
  userBio,
  handleOpenEditProfile,
  setShowPrivacySafetyModal,
  setShowMsgSearchInChat,
  handleToggleMuteChat,
  setShowChatCustomizationSheet,
  setChatCustomizationView,
  chatDisappearing,
  setNewGroupPreselectedUser,
  setShowNewGroupModal,
  messagesByChat,
  setSharedMediaPreview,
  handleStartCallWithUser,
  allUserCalls,
  userAvatarSeed,
  userAvatarUrl,
  onOpenDetailedProfile,
  blockedUsers = [],
  handleToggleBlockUser,
  handleReportUser,
}) => {
  const [profileActiveTab, setProfileActiveTab] = useState<'info' | 'media' | 'calls'>('info');
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');

  const targetUsername = selectedProfileUsername || '';
  const targetUsernameLower = targetUsername.toLowerCase();
  const selectedUser = (users[targetUsernameLower] || {}) as any;
  const isMe = targetUsernameLower === userUsername.toLowerCase();
  const amIFollowing = selectedUser?.followers?.includes(userUsername) || false;
  const isPrivateAndLocked = selectedUser?.is_private && !amIFollowing && !isMe;

  return (









                <motion.div 
                  key="full-profile-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                  className={`fixed inset-0 z-50 flex flex-col overflow-y-auto ${themeMode === 'dark' ? 'bg-[#0a0a0c] text-white' : 'bg-neutral-50 text-neutral-900'}`}
                >
                  {/* Top Bar with Back Arrow */}
                  <div className={`sticky top-0 z-20 flex items-center justify-between px-4 h-14 backdrop-blur-md border-b ${themeMode === 'dark' ? 'bg-[#0a0a0c]/80 border-neutral-850' : 'bg-white/80 border-neutral-200'}`}>
                    <button 
                      onClick={() => setShowProfilePanel(false)}
                      className="p-2 -ml-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 transition-colors cursor-pointer"
                      title="Back to chat"
                    >
                      <ChevronLeft className="h-6 w-6 stroke-[2.2]" />
                    </button>
                    
                    <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0 px-2">
                      {selectedProfileUsername !== userUsername && users[targetUsername.toLowerCase()]?.is_private && (
                        <Lock className="h-3.5 w-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                      )}
                      <span className="text-sm font-extrabold tracking-wide text-neutral-800 dark:text-neutral-200 truncate">
                        {selectedProfileUsername ? `@${selectedProfileUsername.replace(/^@/, '')}` : 'Details'}
                      </span>
                      {selectedProfileUsername && !!users[selectedProfileUsername.toLowerCase()]?.is_verified && (
                        <PurpleVerifiedBadge size="sm" />
                      )}
                    </div>

                    <div className="w-10 h-10 shrink-0" />
                  </div>

                  {/* Main Scrollable Content Container */}
                  <div className="flex-1 w-full max-w-xl mx-auto px-4 py-6 pb-20 space-y-6">
                    
                    {/* OWN PROFILE REDESIGN (When viewing self profile) */}
                    
                    {/* PRIVATE ACCOUNT LOCKED VIEW */}
                    {isPrivateAndLocked ? (
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-1 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 shadow-lg">
                              {renderAvatar(selectedUser?.avatar_seed, selectedUser?.display_name, selectedUser?.avatar_url, 'h-24 w-24 text-3xl')}
                            </div>
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black text-neutral-900 dark:text-white flex items-center justify-center gap-1.5">
                                <Lock className="h-5 w-5 text-neutral-400 shrink-0" />
                                <span>{selectedUser?.display_name || selectedUser?.username}</span>
                              </h2>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3 border-y border-neutral-100 dark:border-neutral-800 py-6">
                            <div className="text-center">
                              <span className="text-lg font-black text-neutral-900 dark:text-white block">{selectedUser?.followers?.length || 0}</span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Followers</span>
                            </div>
                            <div className="text-center">
                              <span className="text-lg font-black text-neutral-900 dark:text-white block">{selectedUser?.following?.length || 0}</span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Following</span>
                            </div>
                            <div className="text-center">
                              <span className="text-lg font-black text-neutral-900 dark:text-white block">0</span>
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Posts</span>
                            </div>
                          </div>

                          <div className="py-8 space-y-4 flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                              <Lock className="h-8 w-8" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-base font-black text-neutral-900 dark:text-white">This Account is Private</h3>
                              <p className="text-xs text-neutral-500 max-w-[280px] mx-auto leading-relaxed">
                                This account is private. Follow this user to view their profile and activity.
                              </p>
                            </div>
                          </div>

                          <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800">
                            {followRequests.some(r => r.toId === selectedUser?.id) ? (
                              <button className="w-full py-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 cursor-default">
                                <RefreshCw className="h-4 w-4 animate-spin-slow" />
                                Requested
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleFollow(selectedUser!)}
                                className="w-full py-3.5 rounded-2xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl cursor-pointer"
                              >
                                Follow to Connect
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ) : selectedProfileUsername === userUsername ? (
                      <div className="space-y-6">
                        {/* Cover Banner & Identity Header */}
                        <div className="relative rounded-3xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xl">
                          {/* Mesh Gradient Cover */}
                          <div className="h-32 w-full bg-neutral-900 dark:bg-neutral-950 border-b border-neutral-800 relative p-4 flex justify-between items-start">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />

                            <button
                              onClick={handleOpenEditProfile}
                              className="relative z-10 p-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition-all active:scale-95 cursor-pointer"
                              title="Edit Cover & Profile"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Profile Details Container */}
                          <div className="px-6 pb-6 pt-0 text-center relative">
                            {/* Avatar Container with glowing gradient border */}
                            <div className="relative inline-block -mt-14 mb-3">
                              <div className="p-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 shadow-2xl">
                                {renderAvatar(
                                  userAvatarSeed || userUsername, 
                                  userDisplayName || userUsername, 
                                  userAvatarUrl, 
                                  'h-24 w-24 text-3xl shadow-inner border-4 border-white dark:border-neutral-900'
                                )}
                              </div>
                              <button
                                onClick={handleOpenEditProfile}
                                className="absolute bottom-1 right-1 p-2 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-lg hover:scale-110 transition-transform cursor-pointer border-2 border-white dark:border-neutral-900"
                                title="Change Avatar"
                              >
                                <Camera className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {/* Full Display Name (Username is strictly in the header) */}
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-2">
                                <span>{userDisplayName || userUsername}</span>
                                {!!users[userUsername]?.is_verified && (
                                  <PurpleVerifiedBadge size="sm"  />
                                )}
                              </h2>
                            </div>

                            {/* Interactive Metric Showcase Cards */}
                            <div className="grid grid-cols-3 gap-3 my-5">
                              <div 
                                onClick={() => setShowFollowListModal({ type: 'followers', username: userUsername })}
                                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
                              >
                                <span className="text-lg font-black text-neutral-900 dark:text-white block">
                                  {users[userUsername]?.followers?.length || 0}
                                </span>
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                  Followers
                                </span>
                              </div>

                              <div 
                                onClick={() => setShowFollowListModal({ type: 'following', username: userUsername })}
                                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
                              >
                                <span className="text-lg font-black text-neutral-900 dark:text-white block">
                                  {users[userUsername]?.following?.length || 0}
                                </span>
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                  Following
                                </span>
                              </div>

                              <div 
                                onClick={() => setActiveView('settings')}
                                className="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200/60 dark:border-neutral-750 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-center"
                              >
                                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block pt-1">
                                  Vault Protected
                                </span>
                                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                  Security
                                </span>
                              </div>
                            </div>

                            {/* Bio Block */}
                            <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 text-left space-y-1">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500">
                                Bio / Status
                              </span>
                              <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium">
                                {userBio || "No status bio set. Tap Edit Profile to customize!"}
                              </p>
                            </div>

                            {/* Primary Action Button Suite */}
                            <div className="grid grid-cols-2 gap-3 pt-4">
                              <button
                                onClick={handleOpenEditProfile}
                                className="py-3 px-4 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md active:scale-98 cursor-pointer"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span>Edit Profile</span>
                              </button>

                              <button
                                onClick={() => {
                                  try {
                                    navigator.clipboard.writeText(`https://zenoa.app/u/${userUsername}`);
                                    showToast("Profile link copied!");
                                  } catch (e) {
                                    showToast("Profile link: zenoa.app/u/" + userUsername);
                                  }
                                }}
                                className="py-3 px-4 rounded-2xl bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold text-xs flex items-center justify-center gap-2 transition-all border border-neutral-200 dark:border-neutral-700 active:scale-98 cursor-pointer"
                              >
                                <Share2 className="h-4 w-4" />
                                <span>Share Link</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Quick Luxury Settings Directory */}
                        <div className="space-y-1 rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 overflow-hidden p-2 shadow-sm">
                          <button 
                            onClick={() => {
                              setShowProfilePanel(false);
                              setActiveView('settings');
                            }}
                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                          >
                            <div className="h-9 w-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 shrink-0 font-bold">
                              <Settings className="h-5 w-5 stroke-[1.8]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">Account Settings</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Security, email, and Google Drive backup</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>

                          <button 
                            onClick={() => setShowThemeModal(true)}
                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                          >
                            <div className="h-9 w-9 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-white shrink-0 shadow-xs">
                              <Palette className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">Theme & Wallpapers</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Customize chat backgrounds and appearance</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>

                          <button 
                            onClick={() => setShowPrivacySafetyModal(true)}
                            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                          >
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                              <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-neutral-900 dark:text-white">Privacy & Safety</p>
                              <p className="text-xs text-neutral-500 dark:text-neutral-400">Read receipts, online status, blocked contacts</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* CONTACT PROFILE VIEW (When viewing another user's profile) */
                      <>
                    
                    {/* User Identity & Avatar Hero (PFP REMOVED as requested) */}
                    <div className="flex flex-col items-center text-center space-y-2 py-4">
                      <div className="space-y-1">
                        <h2 className="text-2xl font-black tracking-tight text-neutral-900 dark:text-white flex items-center justify-center gap-1.5">
                          {chatNicknames[targetUsername] ? (
                            <>
                              <span>{chatNicknames[targetUsername]}</span>
                              <span className="text-xs text-neutral-400 font-normal">({users[targetUsernameLower]?.display_name || targetUsername})</span>
                            </>
                          ) : (
                            users[targetUsernameLower]?.display_name || targetUsername
                          )}
                          {!!users[targetUsernameLower]?.is_verified && (
                            <PurpleVerifiedBadge size="sm"  />
                          )}
                        </h2>
                        
                        {isServiceAccount(users[targetUsernameLower], targetUsername) && (
                          <div className="mt-1.5 flex justify-center">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide bg-blue-500/10 text-blue-600 dark:text-blue-400 dark:bg-blue-400/10 border border-blue-200/50 dark:border-blue-500/20 shadow-xs">
                              <span>{['zenoa', 'sa_zenoa', 'zenoa_official'].includes(targetUsername.toLowerCase()) ? 'Official Zenoa Account' : 'Business Account'}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                      </>
                    )}

                    {/* 3 Quick Action Circular Buttons (Profile, Search, Mute) */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                      {/* 1. Open Full Profile Modal */}
                      {!isServiceAccount(users[targetUsernameLower], targetUsername) ? (
                        <div 
                          onClick={() => {
                            if (onOpenDetailedProfile) {
                              onOpenDetailedProfile(targetUsername);
                            }
                          }}
                          className="flex flex-col items-center gap-1.5 cursor-pointer group"
                          title="View Full Profile"
                        >
                          <div className="h-12 w-12 rounded-full bg-neutral-200/70 hover:bg-neutral-300 dark:bg-neutral-850 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-transform group-hover:scale-105 active:scale-95 shadow-xs">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">Profile</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 opacity-40 select-none">
                          <div className="h-12 w-12 rounded-full bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center text-neutral-400">
                            <User className="h-5 w-5" />
                          </div>
                          <span className="text-[11px] font-medium text-neutral-400">Profile</span>
                        </div>
                      )}

                      {/* 2. Search */}
                      <div 
                        onClick={() => {
                          setShowProfilePanel(false);
                          setShowMsgSearchInChat(true);
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer group"
                      >
                        <div className="h-12 w-12 rounded-full bg-neutral-200/70 hover:bg-neutral-300 dark:bg-neutral-850 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-transform group-hover:scale-105 active:scale-95 shadow-xs">
                          <Search className="h-5 w-5" />
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">Search</span>
                      </div>

                      {/* 3. Mute */}
                      <div 
                        onClick={(e) => {
                          if (activeChat?.id) {
                            handleToggleMuteChat(activeChat.id);
                          } else {
                            showToast("Chat muted");
                          }
                        }}
                        className="flex flex-col items-center gap-1.5 cursor-pointer group"
                      >
                        <div className="h-12 w-12 rounded-full bg-neutral-200/70 hover:bg-neutral-300 dark:bg-neutral-850 dark:hover:bg-neutral-800 flex items-center justify-center text-neutral-800 dark:text-neutral-200 transition-transform group-hover:scale-105 active:scale-95 shadow-xs">
                          {activeChat?.muted ? <BellOff className="h-5 w-5 text-rose-500" /> : <Bell className="h-5 w-5" />}
                        </div>
                        <span className="text-[11px] font-medium text-neutral-700 dark:text-neutral-300">
                          {activeChat?.muted ? 'Unmute' : 'Mute'}
                        </span>
                      </div>
                    </div>

                    {/* Menu List Items (Matching the Screenshot: Customize, Disappearing Messages, Privacy & Safety, Nicknames, Create Group Chat) */}
                    <div className="space-y-1 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 overflow-hidden p-1.5 shadow-sm">
                      
                      {/* Customize (Theme and font) */}
                      {!isServiceAccount(users[targetUsernameLower], targetUsername) && (
                      <button 
                        onClick={() => {
                          setShowThemeModal(true);
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 shrink-0 shadow-xs flex items-center justify-center">
                          <Palette className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Customize</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Theme and font</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      )}

                      {/* Disappearing Messages */}
                      {!isServiceAccount(users[targetUsernameLower], targetUsername) && (
                      <button 
                        onClick={() => {
                          setShowChatCustomizationSheet(true);
                          setChatCustomizationView('disappearing');
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                          <Clock className="h-4 w-4 stroke-[1.8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Disappearing messages</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {activeChat && chatDisappearing[activeChat.id] ? (
                              chatDisappearing[activeChat.id] === '24h' ? '24 Hours' :
                              chatDisappearing[activeChat.id] === '48h' ? '48 Hours' :
                              chatDisappearing[activeChat.id] === '7d' ? '7 Days' :
                              chatDisappearing[activeChat.id] === '30d' ? '30 Days' :
                              chatDisappearing[activeChat.id]?.startsWith('custom_') ? 'Custom' : 'Off'
                            ) : 'Off'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      )}

                      {/* Privacy & Safety */}
                      <button 
                        onClick={() => setShowPrivacySafetyModal(true)}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                          <Lock className="h-4 w-4 stroke-[1.8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Privacy & safety</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">{isServiceAccount(users[targetUsernameLower], targetUsername) ? 'Business Account • Verified Developer' : 'End-to-end encrypted • Safety controls'}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* Nicknames */}
                      {!isServiceAccount(users[targetUsernameLower], targetUsername) && (
                      <button 
                        onClick={() => {
                          setEditingNicknameUser(targetUsername);
                          setTempNicknameValue(chatNicknames[targetUsername] || '');
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                          <Edit3 className="h-4 w-4 stroke-[1.8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Nicknames</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">
                            {chatNicknames[targetUsername] ? chatNicknames[targetUsername] : 'Set custom nickname'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      )}

                      {/* Create a group chat */}
                      {!isServiceAccount(users[targetUsernameLower], targetUsername) && (
                      <button 
                        onClick={() => {
                          setShowProfilePanel(false);
                          setNewGroupPreselectedUser(targetUsername);
                          setShowNewGroupModal(true);
                        }}
                        className="w-full flex items-center gap-3.5 p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800/60 transition-colors text-left cursor-pointer group"
                      >
                        <div className="h-7 w-7 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-700 dark:text-neutral-300">
                          <Users className="h-4 w-4 stroke-[1.8]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-neutral-900 dark:text-white">Create a group chat</p>
                          <p className="text-xs text-neutral-500 dark:text-neutral-400">Add participants with this contact</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                      )}

                    </div>

                    {/* Shared Media Section (Matching Screenshot) */}
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between px-1">
                        <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Shared media</h3>
                        {(() => {
                          const chatMsgs = activeChat?.id ? (messagesByChat[activeChat.id] || []) : [];
                          const mediaItems = chatMsgs.filter(m => !m.deleted_for_me && !m.deleted_for_everyone && (m.media_url || m.type === 'image' || m.type === 'video'));
                          return mediaItems.length > 0 ? (
                            <span className="text-xs text-neutral-400">{mediaItems.length} files</span>
                          ) : null;
                        })()}
                      </div>

                      {(() => {
                        const chatMsgs = activeChat?.id ? (messagesByChat[activeChat.id] || []) : [];
                        const mediaItems = chatMsgs.filter(m => !m.deleted_for_me && !m.deleted_for_everyone && (m.media_url || m.type === 'image' || m.type === 'video'));

                        if (mediaItems.length === 0) {
                          return (
                            <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-850 text-center space-y-2">
                              <ImageIcon className="h-8 w-8 text-neutral-400 mx-auto opacity-50 stroke-1" />
                              <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                                No shared photos or videos yet in this chat
                              </p>
                            </div>
                          );
                        }

                        return (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {mediaItems.map((m, idx) => {
                              const isVid = m.type === 'video' || m.media_url?.includes('.mp4') || m.media_url?.includes('video');
                              const url = m.media_url || '';
                              return (
                                <div 
                                  key={`shared_media_${m.id || idx}`}
                                  onClick={() => setSharedMediaPreview({ url, type: isVid ? 'video' : 'image', title: m.text })}
                                  className="relative aspect-square rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-800 cursor-pointer group shadow-xs border border-black/5 dark:border-white/5 hover:opacity-90 transition-opacity"
                                >
                                  {isVid ? (
                                    <video src={url} className="w-full h-full object-cover" muted />
                                  ) : (
                                    <img src={url} alt="Shared" className="w-full h-full object-cover" loading="lazy" />
                                  )}

                                  {/* Video Indicator Badge (matching screenshot's small play icon) */}
                                  {isVid && (
                                    <div className="absolute top-1.5 right-1.5 p-1 rounded-md bg-black/60 backdrop-blur-xs text-white">
                                      <Play className="h-3 w-3 fill-white" />
                                    </div>
                                  )}

                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
              
  );
};