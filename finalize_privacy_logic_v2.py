import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update handleToggleFollowUser to handle privacy
old_follow_func = """  const handleToggleFollowUser = async (targetUsername: string) => {
    if (!userUsername || !isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }"""

new_follow_func = """  const handleFollow = async (targetUser: UserData) => {
    if (!isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }
    const targetUsername = targetUser.username;
    const amIFollowing = targetUser.followers?.includes(userUsername) || false;

    if (targetUser.is_private && !amIFollowing && targetUsername !== userUsername) {
      handleSendFollowRequest(targetUser);
      return;
    }
    await handleToggleFollowUserInternal(targetUsername);
  };

  const handleToggleFollowUserInternal = async (targetUsername: string) => {
    if (!userUsername || !isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }"""

content = content.replace(old_follow_func, new_follow_func)

# 2. Fix Chat button in Search (Active Contacts)
# We need to hide Chat button if private and not followed
old_search_chat = """                          <button 
                              onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                              className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 group-hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                            >
                              Chat
                            </button>"""

new_search_chat = """                            {(!user.is_private || user.followers?.includes(userUsername) || user.username === userUsername) && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                                className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 group-hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                              >
                                Chat
                              </button>
                            )}"""

content = content.replace(old_search_chat, new_search_chat)

# 3. Fix Chat button in Global Search
old_global_chat = """                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                            className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-md transition-colors"
                          >
                            Chat
                          </button>"""

new_global_chat = """                          {(!user.is_private || user.followers?.includes(userUsername) || user.username === userUsername) && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                              className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-md transition-colors"
                            >
                              Chat
                            </button>
                          )}"""

content = content.replace(old_global_chat, new_global_chat)

# 4. Final check for follow list modals - prevent clicking if private and not followed
# (This is handled by our isPrivateAndLocked UI block in profile panel anyway)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
