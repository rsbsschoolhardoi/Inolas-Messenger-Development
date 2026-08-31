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
 * Returns accurate human-readable status text (e.g. "Business Account", "online", "last seen 2m ago", "last seen 3 days ago").
 * Guaranteed to never return 'offline'.
 */
export const getOnlineStatusText = (user: PresenceUser | undefined | null): string => {
  if (!user) return 'last seen recently';

  if (user.is_service_account || (user as any).is_business_account || isServiceAccount(user, user.username)) {
    const uname = (user.username || '').toLowerCase();
    if (['zenoa', 'sa_zenoa', 'zenoa_official'].includes(uname)) {
      return 'Official Zenoa Account';
    }
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


export const isServiceAccount = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  if (!user && !explicitUsername) return false;
  if (user?.is_service_account || user?.is_business_account) return true;
  
  const uname = explicitUsername || user?.username;
  if (!uname) return false;
  
  const normalized = uname.toLowerCase();
  return normalized.startsWith('sa_') || normalized === 'zenoa' || normalized === 'sa_zenoa' || normalized === 'zenoa_official' || normalized.startsWith('zenoa_');
};

export const isOfficialAccount = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  const uname = (explicitUsername || user?.username || '').toLowerCase();
  if (['zenoa', 'sa_zenoa', 'zenoa_official', 'zenoa_security', 'zenoa_auth', 'zenoa_support', 'zenoa_updates'].includes(uname) || uname.startsWith('zenoa_')) {
    return true;
  }
  return !!(user?.is_official || (user?.is_service_account && user?.verified_type === 'purple' && !user?.is_business_account));
};

export const isAccountVerified = (user: PresenceUser | any | undefined | null, explicitUsername?: string): boolean => {
  if (isOfficialAccount(user, explicitUsername)) {
    return true;
  }
  if (!user) return false;
  if (user.is_business_account && !user.is_official && !user.is_verified) {
    return false;
  }
  return !!user.is_verified || user.verified_type === 'purple' || user.verified_type === 'official';
};
