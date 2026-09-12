export const ONLINE_HEARTBEAT_INTERVAL_MS = 15000; // Ping every 15s when active
export const ONLINE_THRESHOLD_MS = 45000; // If no ping within 45s, user is inactive

export interface PresenceUser {
  online?: boolean;
  activity_status?: string;
  last_seen?: string;
  last_seen_timestamp?: number;
  is_service_account?: boolean;
  username?: string;
}

/**
 * Calculates whether a user is genuinely online based on a verified fresh heartbeat timestamp.
 * Strictly avoids "fake online" by requiring a recent timestamp within the threshold (45s).
 */
export const isUserEffectivelyOnline = (user: PresenceUser | undefined | null): boolean => {
  if (!user) return false;

  // Service & Business Accounts do NOT display online presence status
  if (user.is_service_account || (user as any).is_business_account || isServiceAccount(user, user.username)) {
    return false;
  }
  
  // If user selected Invisible / Offline, always false
  if (user.activity_status === 'offline') {
    return false;
  }
  
  // If explicitly flagged offline boolean, return false
  if (user.online === false) {
    return false;
  }

  // Genuinely online ONLY if last_seen_timestamp exists and is within threshold (45s)
  if (typeof user.last_seen_timestamp === 'number' && user.last_seen_timestamp > 0) {
    const diff = Date.now() - user.last_seen_timestamp;
    return diff >= 0 && diff <= ONLINE_THRESHOLD_MS;
  }
  
  // Never fall back to boolean true without a verified fresh timestamp
  return false;
};

/**
 * Formats a precise relative time string (e.g., "last seen 2h ago", "last seen 3 days ago", "last seen 2 months ago").
 * Never returns the bare word 'offline'.
 */
export const formatRelativePresenceTime = (timestamp?: number | string | null): string => {
  if (!timestamp) return 'last seen recently';
  
  let timeMs: number | null = null;
  if (typeof timestamp === 'number' && timestamp > 0) {
    timeMs = timestamp;
  } else if (typeof timestamp === 'string') {
    const trimmed = timestamp.trim();
    if (trimmed.toLowerCase() === 'offline') {
      return 'last seen recently';
    }
    if (/^\d+$/.test(trimmed)) {
      timeMs = parseInt(trimmed, 10);
    } else {
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
        timeMs = parsed.getTime();
      }
    }
  }

  if (!timeMs) return 'last seen recently';

  const diffMs = Date.now() - timeMs;
  if (diffMs < 0 || diffMs < 60000) {
    return 'last seen just now';
  }

  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) {
    return `last seen ${mins}m ago`;
  }

  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `last seen ${hrs}h ago`;
  }

  const days = Math.floor(hrs / 24);
  if (days === 1) {
    return 'last seen yesterday';
  }
  if (days < 30) {
    return `last seen ${days} days ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `last seen ${months} month${months > 1 ? 's' : ''} ago`;
  }

  const years = Math.floor(days / 365);
  return `last seen ${years} year${years > 1 ? 's' : ''} ago`;
};

/**
 * Returns accurate human-readable status text (e.g. "Official Zenoa Account", "Business Account", "online", "last seen 2m ago", "last seen 3 days ago").
 * Guaranteed to never return 'offline'.
 */
export const getOnlineStatusText = (user: PresenceUser | undefined | null): string => {
  if (!user) return 'last seen recently';

  if (isOfficialAccount(user, user.username)) {
    return 'Official Zenoa Account';
  }

  if (isBusinessAccount(user, user.username)) {
    return 'Business Account';
  }

  if (user.is_service_account || (user as any).is_business_account || isServiceAccount(user, user.username)) {
    return 'Business Account';
  }

  if (isUserEffectivelyOnline(user)) {
    if (user.activity_status === 'away') return 'away';
    if (user.activity_status === 'busy' || user.activity_status === 'dnd') return 'do not disturb';
    return 'online';
  }

  // If user selected Invisible / Offline
  if (user.activity_status === 'offline') {
    return formatRelativePresenceTime(user.last_seen_timestamp || user.last_seen);
  }

  if (user.last_seen_timestamp && user.last_seen_timestamp > 0) {
    return formatRelativePresenceTime(user.last_seen_timestamp);
  }

  if (user.last_seen && user.last_seen !== 'online' && user.last_seen !== 'offline' && user.last_seen !== 'just now') {
    if (user.last_seen.toLowerCase().startsWith('last seen') || user.last_seen.toLowerCase().startsWith('active')) {
      return user.last_seen;
    }
    return formatRelativePresenceTime(user.last_seen);
  }

  return 'last seen recently';
};


const dynamicServiceAccountHandles = new Set<string>();

export const registerServiceAccountHandle = (handle: string | undefined | null) => {
  if (!handle) return;
  const clean = String(handle).toLowerCase().replace(/^@/, '').trim();
  if (clean) {
    dynamicServiceAccountHandles.add(clean);
  }
};

export const isOfficialAccount = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  const uname = (explicitUsername || user?.username || '').toLowerCase().replace(/^@/, '');
  if (['zenoa', 'sa_zenoa', 'zenoa_official', 'zenoa_security', 'zenoa_auth', 'zenoa_support', 'zenoa_updates'].includes(uname) || uname.startsWith('zenoa_') || uname.startsWith('sa_zenoa')) {
    return true;
  }
  return !!(user?.is_official || (user?.is_service_account && !user?.is_business_account));
};

export const isBusinessAccount = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  if (isOfficialAccount(user, explicitUsername)) return false;
  const uname = (explicitUsername || user?.username || '').toLowerCase().replace(/^@/, '');
  if (user?.is_business_account) return true;
  if (user?.is_service_account && !isOfficialAccount(user, explicitUsername)) return true;
  if (user?.is_bot || user?.role === 'service_account') return true;
  if (uname && dynamicServiceAccountHandles.has(uname)) return true;
  if (uname && uname.startsWith('sa_') && !uname.startsWith('sa_zenoa')) return true;
  return false;
};

export const isServiceAccount = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  if (isOfficialAccount(user, explicitUsername) || isBusinessAccount(user, explicitUsername)) return true;
  if (!user && !explicitUsername) return false;
  if (user?.is_service_account || user?.is_business_account || user?.is_bot || user?.role === 'service_account') return true;
  
  const uname = (explicitUsername || user?.username || '').toLowerCase().replace(/^@/, '');
  if (dynamicServiceAccountHandles.has(uname)) return true;
  return uname.startsWith('sa_') || uname === 'zenoa' || uname === 'sa_zenoa' || uname === 'zenoa_official' || uname.startsWith('zenoa_');
};

export const isAccountVerified = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  // Official Zenoa Service Accounts are ALWAYS verified
  if (isOfficialAccount(user, explicitUsername)) {
    return true;
  }
  if (!user) return false;
  return !!(user.is_verified || user.verified_type === 'purple' || user.verified_type === 'official');
};

/**
 * Resolves a user object from the users map by username, ID, or handle case-insensitively.
 */
export const findUserInMap = (
  identifier: string | undefined | null,
  usersMap?: Record<string, any> | null
): any | null => {
  if (!identifier || !usersMap) return null;
  const clean = identifier.replace(/^@/, '').trim().toLowerCase();
  if (!clean) return null;

  if (usersMap[clean]) return usersMap[clean];
  if (usersMap[identifier]) return usersMap[identifier];

  for (const user of Object.values(usersMap)) {
    if (!user) continue;
    if (user.username && user.username.toLowerCase() === clean) return user;
    if (user.id && user.id.toLowerCase() === clean) return user;
    if (user.zenoa_id && user.zenoa_id.toLowerCase().replace(/^@/, '') === clean) return user;
    if (user.email && user.email.toLowerCase() === clean) return user;
  }
  return null;
};

/**
 * Resolves all followers for a user with bidirectional reconciliation and deduplication.
 */
export const getResolvedFollowers = (
  usernameOrId: string | undefined | null,
  usersMap?: Record<string, any> | null,
  currentLoggedInUsername?: string | null
): string[] => {
  if (!usernameOrId) return [];
  const clean = usernameOrId.replace(/^@/, '').trim().toLowerCase();
  if (!clean) return [];

  const followerSet = new Set<string>();
  const targetUser = findUserInMap(clean, usersMap);
  const targetUserNames = [
    clean,
    targetUser?.username?.toLowerCase(),
    targetUser?.id?.toLowerCase(),
    targetUser?.zenoa_id?.toLowerCase().replace(/^@/, '')
  ].filter(Boolean) as string[];

  // 1. Check target user's explicit followers array
  if (targetUser?.followers && Array.isArray(targetUser.followers)) {
    targetUser.followers.forEach((f: string) => {
      const cleanF = (f || '').replace(/^@/, '').trim();
      if (cleanF && cleanF.toLowerCase() !== clean) {
        followerSet.add(cleanF);
      }
    });
  }

  // 2. Check all other users in usersMap whose `following` contains this user
  if (usersMap) {
    Object.values(usersMap).forEach((other: any) => {
      if (!other || !other.username) return;
      const otherUsername = other.username.replace(/^@/, '').trim();
      if (!otherUsername || otherUsername.toLowerCase() === clean) return;

      if (other.following && Array.isArray(other.following)) {
        const isFollowingTarget = other.following.some((f: string) => {
          const cleanF = (f || '').replace(/^@/, '').trim().toLowerCase();
          return targetUserNames.includes(cleanF);
        });
        if (isFollowingTarget) {
          followerSet.add(otherUsername);
        }
      }
    });
  }

  // 3. If current logged in user is following this target (stored in user-scoped local storage)
  const cleanCurrent = (currentLoggedInUsername || '').replace(/^@/, '').trim().toLowerCase();
  if (cleanCurrent) {
    try {
      const userScopedKey = `inolas_followed_users_${cleanCurrent}`;
      const stored = JSON.parse(localStorage.getItem(userScopedKey) || '[]');
      if (Array.isArray(stored)) {
        const isCurrentFollowing = stored.some((u: string) => {
          const cleanStored = (u || '').replace(/^@/, '').trim().toLowerCase();
          return targetUserNames.includes(cleanStored);
        });
        if (isCurrentFollowing && cleanCurrent !== clean) {
          followerSet.add(cleanCurrent);
        }
      }
    } catch (e) {}
  }

  // 4. Check persistent target followers map cache
  try {
    const targetFollowersMap: Record<string, string[]> = JSON.parse(localStorage.getItem('inolas_target_followers_cache') || '{}');
    for (const name of targetUserNames) {
      if (Array.isArray(targetFollowersMap[name])) {
        targetFollowersMap[name].forEach((f: string) => {
          const cleanF = (f || '').replace(/^@/, '').trim();
          if (cleanF && cleanF.toLowerCase() !== clean) {
            followerSet.add(cleanF);
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(followerSet);
};

/**
 * Resolves all users that a user is following with bidirectional reconciliation and deduplication.
 */
export const getResolvedFollowing = (
  usernameOrId: string | undefined | null,
  usersMap?: Record<string, any> | null,
  currentLoggedInUsername?: string | null
): string[] => {
  if (!usernameOrId) return [];
  const clean = usernameOrId.replace(/^@/, '').trim().toLowerCase();
  if (!clean) return [];

  const followingSet = new Set<string>();
  const user = findUserInMap(clean, usersMap);
  const userIdentifiers = [
    clean,
    user?.username?.toLowerCase(),
    user?.id?.toLowerCase(),
    user?.zenoa_id?.toLowerCase().replace(/^@/, '')
  ].filter(Boolean) as string[];

  // 1. Check user's explicit following array
  if (user?.following && Array.isArray(user.following)) {
    user.following.forEach((f: string) => {
      const cleanF = (f || '').replace(/^@/, '').trim();
      if (cleanF && cleanF.toLowerCase() !== clean) {
        followingSet.add(cleanF);
      }
    });
  }

  // 2. Check all other users in usersMap whose `followers` contains this user
  if (usersMap) {
    Object.values(usersMap).forEach((other: any) => {
      if (!other || !other.username) return;
      const otherUsername = other.username.replace(/^@/, '').trim();
      if (!otherUsername || otherUsername.toLowerCase() === clean) return;

      if (other.followers && Array.isArray(other.followers)) {
        const isTargetFollower = other.followers.some((f: string) => {
          const cleanF = (f || '').replace(/^@/, '').trim().toLowerCase();
          return userIdentifiers.includes(cleanF);
        });
        if (isTargetFollower) {
          followingSet.add(otherUsername);
        }
      }
    });
  }

  // 3. For current user, also check local storage cache
  const cleanCurrent = (currentLoggedInUsername || '').replace(/^@/, '').trim().toLowerCase();
  if (cleanCurrent && clean === cleanCurrent) {
    try {
      const userScopedKey = `inolas_followed_users_${cleanCurrent}`;
      const stored = JSON.parse(localStorage.getItem(userScopedKey) || '[]');
      if (Array.isArray(stored)) {
        stored.forEach((u: string) => {
          const cleanStored = (u || '').replace(/^@/, '').trim();
          if (cleanStored && cleanStored.toLowerCase() !== clean) {
            followingSet.add(cleanStored);
          }
        });
      }
    } catch (e) {}
  }

  // 4. Check persistent user following map cache
  try {
    const userFollowingMap: Record<string, string[]> = JSON.parse(localStorage.getItem('inolas_target_following_cache') || '{}');
    for (const name of userIdentifiers) {
      if (Array.isArray(userFollowingMap[name])) {
        userFollowingMap[name].forEach((f: string) => {
          const cleanF = (f || '').replace(/^@/, '').trim();
          if (cleanF && cleanF.toLowerCase() !== clean) {
            followingSet.add(cleanF);
          }
        });
      }
    }
  } catch (e) {}

  return Array.from(followingSet);
};

export const getFollowersCount = (
  usernameOrId: string | undefined | null,
  usersMap?: Record<string, any> | null,
  currentLoggedInUsername?: string | null
): number => {
  return getResolvedFollowers(usernameOrId, usersMap, currentLoggedInUsername).length;
};

export const getFollowingCount = (
  usernameOrId: string | undefined | null,
  usersMap?: Record<string, any> | null,
  currentLoggedInUsername?: string | null
): number => {
  return getResolvedFollowing(usernameOrId, usersMap, currentLoggedInUsername).length;
};

/**
 * Saves follow change locally in persistent cache maps.
 */
export const persistFollowActionLocally = (
  myUsername: string,
  targetUsername: string,
  isNowFollowing: boolean
) => {
  const cleanMy = (myUsername || '').replace(/^@/, '').trim().toLowerCase();
  const cleanTarget = (targetUsername || '').replace(/^@/, '').trim().toLowerCase();
  if (!cleanMy || !cleanTarget || cleanMy === cleanTarget) return;

  try {
    // 1. inolas_followed_users (user-scoped)
    const userScopedKey = `inolas_followed_users_${cleanMy}`;
    const currentFollowed: string[] = JSON.parse(localStorage.getItem(userScopedKey) || '[]');
    const updatedFollowed = isNowFollowing
      ? Array.from(new Set([...currentFollowed, cleanTarget, targetUsername]))
      : currentFollowed.filter(u => (u || '').replace(/^@/, '').trim().toLowerCase() !== cleanTarget);
    localStorage.setItem(userScopedKey, JSON.stringify(updatedFollowed));

    // 2. inolas_target_followers_cache
    const followersCache: Record<string, string[]> = JSON.parse(localStorage.getItem('inolas_target_followers_cache') || '{}');
    const targetFollowers = followersCache[cleanTarget] || [];
    followersCache[cleanTarget] = isNowFollowing
      ? Array.from(new Set([...targetFollowers, cleanMy, myUsername]))
      : targetFollowers.filter(u => (u || '').replace(/^@/, '').trim().toLowerCase() !== cleanMy);
    localStorage.setItem('inolas_target_followers_cache', JSON.stringify(followersCache));

    // 3. inolas_target_following_cache
    const followingCache: Record<string, string[]> = JSON.parse(localStorage.getItem('inolas_target_following_cache') || '{}');
    const myFollowing = followingCache[cleanMy] || [];
    followingCache[cleanMy] = isNowFollowing
      ? Array.from(new Set([...myFollowing, cleanTarget, targetUsername]))
      : myFollowing.filter(u => (u || '').replace(/^@/, '').trim().toLowerCase() !== cleanTarget);
    localStorage.setItem('inolas_target_following_cache', JSON.stringify(followingCache));
  } catch (e) {}
};

/**
 * Checks whether user A is currently following user B.
 * Checks bidirectional following/followers lists and local fallback storage.
 */
export const isFollowingUser = (
  myUsername: string | undefined | null,
  targetUsername: string | undefined | null,
  usersMap?: Record<string, any> | null
): boolean => {
  if (!myUsername || !targetUsername) return false;
  const cleanMy = myUsername.replace(/^@/, '').trim().toLowerCase();
  const cleanTarget = targetUsername.replace(/^@/, '').trim().toLowerCase();
  if (!cleanMy || !cleanTarget || cleanMy === cleanTarget) return false;

  if (usersMap) {
    const following = getResolvedFollowing(cleanMy, usersMap, cleanMy);
    if (following.some(u => u.toLowerCase() === cleanTarget)) {
      return true;
    }
    const followers = getResolvedFollowers(cleanTarget, usersMap, cleanMy);
    if (followers.some(u => u.toLowerCase() === cleanMy)) {
      return true;
    }
  }

  // Local storage cache fallback
  try {
    const userScopedKey = `inolas_followed_users_${cleanMy}`;
    const stored = JSON.parse(localStorage.getItem(userScopedKey) || '[]');
    if (Array.isArray(stored) && stored.some((u: string) => (u || '').replace(/^@/, '').trim().toLowerCase() === cleanTarget)) {
      return true;
    }
  } catch (e) {}

  return false;
};

