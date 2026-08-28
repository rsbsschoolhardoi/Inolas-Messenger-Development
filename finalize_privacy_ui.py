import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Notification Bell to Sidebar Header
old_header_status = """                <span className="capitalize">{myPresenceStatus}</span>
              </button>"""

new_header_notif = """                <span className="capitalize">{myPresenceStatus}</span>
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
              </button>"""

content = content.replace(old_header_status, new_header_notif)

# 2. Add NotificationsPanel Component
# I'll insert it before the main App return or inside the main div
notif_panel_code = """
      {/* NOTIFICATIONS & FOLLOW REQUESTS PANEL */}
      <AnimatePresence>
        {showNotificationsPanel && (
          <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowNotificationsPanel(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-sm h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col"
            >
              <div className="p-6 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                    <Bell className="h-5 w-5 text-indigo-500" />
                    <span>Notifications</span>
                  </h2>
                  <p className="text-xs text-neutral-400 mt-1">Real-time alerts & social requests</p>
                </div>
                <button 
                  onClick={() => setShowNotificationsPanel(false)}
                  className="p-2 rounded-2xl hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Follow Requests Section */}
                {followRequests.length > 0 && (
                  <div className="p-4 space-y-3">
                    <h3 className="text-[10px] uppercase tracking-widest font-black text-neutral-400 px-2">Follow Requests</h3>
                    {followRequests.map(req => (
                      <div key={req.id} className="p-4 rounded-3xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50 space-y-3">
                        <div className="flex items-center gap-3">
                          {renderAvatar(req.fromAvatar, req.fromName, undefined, 'h-10 w-10')}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{req.fromName}</p>
                            <p className="text-[10px] text-neutral-500 truncate">@{req.fromUsername} wants to follow you</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAcceptFollowRequest(req)}
                            className="flex-1 py-2 rounded-xl bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                          >
                            Accept
                          </button>
                          <button 
                            onClick={() => handleDeclineFollowRequest(req.id)}
                            className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 text-[10px] font-bold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Notifications List */}
                <div className="p-4 space-y-1">
                  {notifications.length === 0 && followRequests.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-4">
                      <div className="p-6 rounded-full bg-neutral-50 dark:bg-neutral-800/50">
                        <Bell className="h-10 w-10 text-neutral-300 dark:text-neutral-700" />
                      </div>
                      <p className="text-xs text-neutral-400">Sab kuch shant hai! Koi nayi notifications nahi hain.</p>
                    </div>
                  )}
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-4 rounded-2xl flex items-start gap-3 transition-colors ${!notif.read ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/30'}`}>
                      <div className="relative shrink-0">
                        {renderAvatar(notif.fromAvatar, notif.fromName, undefined, 'h-10 w-10')}
                        <div className={`absolute -bottom-1 -right-1 p-1 rounded-full text-white text-[8px] ${
                          notif.type === 'follow_accept' ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}>
                          {notif.type === 'follow_accept' ? <Check className="h-2 w-2" /> : <User className="h-2 w-2" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-neutral-800 dark:text-neutral-200 leading-relaxed">
                          <span className="font-bold">@{notif.fromUsername}</span>{' '}
                          {notif.type === 'follow_accept' ? 'ne aapki follow request accept kar li hai!' : 'ne aapko follow karna shuru kiya hai.'}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-1">{new Date(notif.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                      {!notif.read && <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
"""

# Find place to insert NotificationsPanel - before the main container closing
content = content.replace('    </div>  );}', notif_panel_code + '\n    </div>  );}')

# 3. Modify Profile Panel to handle Locked State
# I need to find the profile buttons (Message, Call) and content
# Let's search for the followers/following stats in ProfileView (inside showProfilePanel)
profile_logic = """
    const selectedUser = users[selectedProfileUsername?.toLowerCase() || ''] || null;
    const isMe = selectedProfileUsername?.toLowerCase() === userUsername?.toLowerCase();
    const amIFollowing = selectedUser?.followers?.includes(userUsername) || false;
    const isPrivateAndLocked = selectedUser?.is_private && !amIFollowing && !isMe;
"""

# Insert this at start of showProfilePanel block
content = content.replace('              {showProfilePanel && (', '              {showProfilePanel && (() => {\n' + profile_logic + '\n return (')
content = content.replace('                </motion.div>\n              )}', '                </motion.div>\n              );})()}', 1)

# Note: The above replace is a bit tricky, I'll use a more targeted approach for the profile locking

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
