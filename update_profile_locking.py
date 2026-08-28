import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Profile Logic to handle private accounts
# We already have the isPrivateAndLocked variable injected from previous script (hopefully)
# Let's check and inject the UI block

locked_ui = """
                    {/* PRIVATE ACCOUNT LOCKED VIEW */}
                    {isPrivateAndLocked ? (
                      <div className="space-y-6">
                        <div className="bg-white dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800 shadow-xl text-center space-y-6">
                          <div className="flex flex-col items-center space-y-4">
                            <div className="p-1 rounded-full bg-gradient-to-tr from-neutral-200 to-neutral-100 dark:from-neutral-800 dark:to-neutral-900 shadow-lg">
                              {renderAvatar(selectedUser?.avatar_seed, selectedUser?.display_name, selectedUser?.avatar_url, 'h-24 w-24 text-3xl opacity-50 grayscale-[0.5]')}
                            </div>
                            <div className="space-y-1">
                              <h2 className="text-2xl font-black text-neutral-900 dark:text-white">@{selectedUser?.username}</h2>
                              <p className="text-xs font-semibold text-neutral-500 uppercase tracking-widest flex items-center justify-center gap-1.5">
                                <Shield className="h-3.5 w-3.5" />
                                Private Account
                              </p>
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
                                Inhone apne account ko private karke rakha hai. Unki profile aur activity dekhne ke liye unhe follow karein.
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
                    ) : selectedProfileUsername === userUsername ? ("""

content = content.replace('{selectedProfileUsername === userUsername ? (', locked_ui)

# 2. Update FollowListModal to block access if private
old_modal_check = """  const [showFollowListModal, setShowFollowListModal] = useState<{ type: 'followers' | 'following'; username: string } | null>(null);"""
# I'll modify the modal usage directly in the JSX instead of changing the state type.

# 3. Update handleFollow logic (it was already updated by previous script to handle requests)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
