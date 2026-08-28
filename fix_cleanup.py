import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add handleDeleteUserFirestore function
if 'const handleDeleteUserFirestore' not in content:
    func_code = """  const handleDeleteUserFirestore = async (targetUserId: string) => {
    if (!isFirebaseConfigured || !db || userEmail !== 'azadaman19s@gmail.com') return;
    if (!window.confirm('Are you sure you want to delete this user profile from Firestore? This is permanent.')) return;
    try {
      await deleteDoc(doc(db, 'users', targetUserId));
      console.log('User profile deleted from Firestore:', targetUserId);
    } catch (err) {
      console.error('Failed to delete user profile:', err);
      alert('Error deleting user');
    }
  };"""
    # Insert it before handleStartChatWithUser
    content = content.replace("  const handleStartChatWithUser = async (user: UserData) => {", func_code + "\n\n  const handleStartChatWithUser = async (user: UserData) => {")

# 2. Add Delete button in search results (Active Contacts list)
# One-liner version
old_active = """                          <button                             onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}                            className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 group-hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-sm transition-colors shrink-0"                          >                            Chat                          </button>"""

new_active = """                          <div className="flex items-center gap-1.5 shrink-0 ml-4">
                            {userEmail === 'azadaman19s@gmail.com' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteUserFirestore(user.id); }}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors cursor-pointer"
                                title="Admin: Delete from Firestore"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                              className="px-3 py-1 bg-neutral-900 dark:bg-neutral-100 group-hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-sm transition-colors"
                            >
                              Chat
                            </button>
                          </div>"""

# Global search results delete button
old_global = """                        <button                           onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}                          className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-md transition-colors shrink-0 ml-4"                        >                          Chat                        </button>"""

new_global = """                        <div className="flex items-center gap-1.5 shrink-0 ml-4">
                          {userEmail === 'azadaman19s@gmail.com' && (
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteUserFirestore(user.id); }}
                              className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors cursor-pointer"
                              title="Admin: Delete from Firestore"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleStartChatWithUser(user); }}
                            className="px-3.5 py-1.5 bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl text-xs font-semibold shadow-md transition-colors"
                          >
                            Chat
                          </button>
                        </div>"""

# Need to check if multi-line exists too just in case
content = content.replace(old_active, new_active)
content = content.replace(old_global, new_global)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
