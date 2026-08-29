import React from 'react';
import { X, Users } from 'lucide-react';
import { UserData } from '../types';

interface FollowListModalProps {
  showFollowListModal: { type: 'followers' | 'following'; username: string } | null;
  onClose: () => void;
  userUsername: string;
  users: Record<string, UserData>;
  themeMode: 'dark' | 'light';
  onSelectUser: (username: string) => void;
  onFollow: (user: UserData) => void;
  renderAvatar: (seed: string, name: string, url?: string, sizeClass?: string) => React.ReactNode;
  isUserEffectivelyOnline: (user: UserData) => boolean;
  isServiceAccount: (user?: UserData, username?: string) => boolean;
}

export const FollowListModal: React.FC<FollowListModalProps> = ({
  showFollowListModal,
  onClose,
  userUsername,
  users,
  themeMode,
  onSelectUser,
  onFollow,
  renderAvatar,
  isUserEffectivelyOnline,
  isServiceAccount
}) => {
  if (!showFollowListModal) return null;

  const rawList = showFollowListModal.type === 'followers' 
    ? (users[showFollowListModal.username]?.followers || [])
    : (users[showFollowListModal.username]?.following || []);
  const list = Array.from(new Set(rawList)).filter(Boolean) as string[];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className={`w-full max-w-md rounded-3xl p-5 border shadow-2xl flex flex-col max-h-[85vh] ${themeMode === 'dark' ? 'bg-neutral-900 border-neutral-800' : 'bg-white border-neutral-200'}`}>
        <div className="flex justify-between items-center pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h3 className="font-bold text-base capitalize text-neutral-900 dark:text-white">
              {showFollowListModal.type === 'followers' ? 'Followers' : 'Following'}
            </h3>
            <p className="text-xs text-neutral-400">
              {showFollowListModal.username === userUsername ? 'Your profile' : showFollowListModal.username}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {list.length === 0 ? (
            <div className="py-12 text-center text-neutral-400 space-y-2">
              <Users className="h-10 w-10 mx-auto stroke-1 opacity-40" />
              <p className="text-sm font-medium">No {showFollowListModal.type} yet</p>
            </div>
          ) : (
            list.map((uname: string, idx: number) => {
              const u = users[uname] || Object.values(users).find(item => item && item.username === uname);
              const isMe = uname === userUsername;
              const amIFollowing = u?.followers?.includes(userUsername) || false;

              return (
                <div 
                  key={`follow_${showFollowListModal.type}_${uname}_${idx}`} 
                  className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
                >
                  <div 
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    onClick={() => onSelectUser(uname)}
                  >
                    <div className="relative shrink-0">
                      {renderAvatar(u?.avatar_seed || uname, u?.display_name || uname, u?.avatar_url, 'h-10 w-10 text-sm')}
                      {u && isUserEffectivelyOnline(u) && (
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-neutral-800 dark:bg-neutral-200 border-2 border-white dark:border-neutral-950"></span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate text-neutral-900 dark:text-white">
                        {u?.display_name || uname}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {uname}
                      </p>
                    </div>
                  </div>

                  {!isMe && uname && !isServiceAccount(users[uname], uname) && (
                    <button
                      onClick={() => uname && onFollow(users[uname.toLowerCase()])}
                      className={`ml-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs shrink-0 cursor-pointer ${
                        amIFollowing
                          ? 'bg-neutral-100 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:bg-neutral-800 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700'
                          : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900'
                      }`}
                    >
                      {amIFollowing ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
