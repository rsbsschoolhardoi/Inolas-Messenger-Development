import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add new state variables
new_states = """  const [isAccountPrivate, setIsAccountPrivate] = useState<boolean>(false);
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState<boolean>(false);
"""
# Insert before // Profile & Settings State
content = content.replace('  // Profile & Settings State', new_states + '\n  // Profile & Settings State')

# 2. Update user sync to include is_private
old_sync_logic = """                  followers: Array.isArray(p.followers) ? p.followers : [],
                  following: Array.isArray(p.following) ? p.following : []"""

new_sync_logic = """                  followers: Array.isArray(p.followers) ? p.followers : [],
                  following: Array.isArray(p.following) ? p.following : [],
                  is_private: !!p.is_private"""

content = content.replace(old_sync_logic, new_sync_logic)

# 3. Update my profile sync to include is_private
old_profile_sync = """                  setUserAvatarUrl(profile.avatar_url || '');"""
new_profile_sync = """                  setUserAvatarUrl(profile.avatar_url || '');
                  setIsAccountPrivate(!!profile.is_private);"""

content = content.replace(old_profile_sync, new_profile_sync)

# 4. Add handlers for follow requests and notifications
handlers = """
  // --- PRIVACY & NOTIFICATION HANDLERS ---
  const handleTogglePrivacy = async (val: boolean) => {
    setIsAccountPrivate(val);
    if (isFirebaseConfigured && db && userId) {
      try {
        await updateDoc(doc(db, 'users', userId), { is_private: val });
      } catch (err) {
        console.error("Failed to update privacy:", err);
      }
    }
  };

  const createNotification = async (targetId: string, type: Notification['type']) => {
    if (!isFirebaseConfigured || !db || !userId) return;
    try {
      const notifRef = doc(collection(db, 'notifications'));
      const notifData: Omit<Notification, 'id'> = {
        userId: targetId,
        type,
        fromId: userId,
        fromName: userDisplayName,
        fromUsername: userUsername,
        fromAvatar: userAvatarSeed,
        read: false,
        timestamp: Date.now()
      };
      await setDoc(notifRef, notifData);
    } catch (err) {
      console.error("Notif creation error:", err);
    }
  };

  const handleSendFollowRequest = async (targetUser: UserData) => {
    if (!isFirebaseConfigured || !db || !userId || !targetUser.id) return;
    try {
      // Check if already requested
      const q = query(collection(db, 'follow_requests'), 
        where('fromId', '==', userId), 
        where('toId', '==', targetUser.id),
        where('status', '==', 'pending')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        showToast("Already requested");
        return;
      }

      const reqRef = doc(collection(db, 'follow_requests'));
      await setDoc(reqRef, {
        fromId: userId,
        toId: targetUser.id,
        fromName: userDisplayName,
        fromUsername: userUsername,
        fromAvatar: userAvatarSeed,
        status: 'pending',
        timestamp: Date.now()
      });
      
      // Create notification for target
      await createNotification(targetUser.id, 'follow_request');
      showToast("Follow request sent");
    } catch (err) {
      console.error("Follow request error:", err);
    }
  };

  const handleAcceptFollowRequest = async (request: FollowRequest) => {
    if (!isFirebaseConfigured || !db || !userId) return;
    try {
      // 1. Add to followers/following arrays
      const targetUserRef = doc(db, 'users', request.fromId);
      const myUserRef = doc(db, 'users', userId);

      await updateDoc(myUserRef, {
        followers: arrayUnion(request.fromUsername)
      });
      await updateDoc(targetUserRef, {
        following: arrayUnion(userUsername)
      });

      // 2. Mark request as accepted (or just delete)
      await deleteDoc(doc(db, 'follow_requests', request.id));

      // 3. Notify them
      await createNotification(request.fromId, 'follow_accept');
      showToast(`Accepted ${request.fromUsername}`);
    } catch (err) {
      console.error("Accept error:", err);
    }
  };

  const handleDeclineFollowRequest = async (requestId: string) => {
    if (!isFirebaseConfigured || !db) return;
    try {
      await deleteDoc(doc(db, 'follow_requests', requestId));
      showToast("Request declined");
    } catch (err) {
      console.error("Decline error:", err);
    }
  };

  const markNotificationsAsRead = async () => {
    if (!isFirebaseConfigured || !db || !userId) return;
    const unread = notifications.filter(n => !n.read);
    for (const n of unread) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch (err) {}
    }
  };
"""

# Insert before handleFollow
content = content.replace('  // Follow/Unfollow', handlers + '\n  // Follow/Unfollow')

# 5. Modify handleFollow to respect privacy
old_handle_follow_start = """  const handleFollow = async (targetUser: UserData) => {
    if (!isAuthenticated) {"""

new_handle_follow_start = """  const handleFollow = async (targetUser: UserData) => {
    if (!isAuthenticated) {
      showToast('Please login to follow users');
      return;
    }
    
    // If target is private and I am not already following, send request instead
    const amIFollowing = targetUser.followers?.includes(userUsername) || false;
    if (targetUser.is_private && !amIFollowing) {
      handleSendFollowRequest(targetUser);
      return;
    }"""

content = content.replace(old_handle_follow_start, new_handle_follow_start)

# 6. Add notification listeners in initFirebase
notif_listeners = """
        // 3. Notification listener
        if (userObj) {
          onSnapshot(
            query(collection(db, 'notifications'), where('userId', '==', userObj.uid)),
            (snap) => {
              const list: Notification[] = [];
              snap.forEach(d => list.push({ id: d.id, ...d.data() } as Notification));
              setNotifications(list.sort((a, b) => b.timestamp - a.timestamp));
            }
          );

          onSnapshot(
            query(collection(db, 'follow_requests'), where('toId', '==', userObj.uid), where('status', '==', 'pending')),
            (snap) => {
              const list: FollowRequest[] = [];
              snap.forEach(d => list.push({ id: d.id, ...d.data() } as FollowRequest));
              setFollowRequests(list);
            }
          );
        }
"""
# Insert after isAuthenticated(true) block in initFirebase
# Finding the end of the auth listener block
content = content.replace('                  setIsAuthenticated(true);\n                  setIsNewUserSetupPending(false);', '                  setIsAuthenticated(true);\n                  setIsNewUserSetupPending(false);' + notif_listeners)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
