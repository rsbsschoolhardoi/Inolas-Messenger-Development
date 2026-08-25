export const ONLINE_HEARTBEAT_INTERVAL_MS = 15000; // Ping every 15s when active
export const ONLINE_THRESHOLD_MS = 45000; // If no ping within 45s, user is strictly OFFLINE

export interface PresenceUser {
  online?: boolean;
  activity_status?: string;
  last_seen?: string;
  last_seen_timestamp?: number;
}

/**
 * Calculates whether a user is genuinely online based on a verified fresh heartbeat timestamp.
 * Strictly avoids "fake online" by requiring a recent timestamp within the threshold (45s).
 */
export const isUserEffectivelyOnline = (user: PresenceUser | undefined | null): boolean => {
  if (!user) return false;
  
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
 * Returns accurate human-readable status text (e.g. "online", "last seen 2m ago", "last seen yesterday", "offline")
 */
export const getOnlineStatusText = (user: PresenceUser | undefined | null): string => {
  if (!user) return 'offline';

  if (user.activity_status === 'offline') {
    return 'offline';
  }

  if (isUserEffectivelyOnline(user)) {
    if (user.activity_status === 'away') return 'away';
    if (user.activity_status === 'busy') return 'do not disturb';
    return 'online';
  }

  if (typeof user.last_seen_timestamp === 'number' && user.last_seen_timestamp > 0) {
    const diff = Date.now() - user.last_seen_timestamp;
    if (diff < 0) return 'last seen just now';
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'last seen just now';
    if (mins < 60) return `last seen ${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `last seen ${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days === 1) return 'last seen yesterday';
    if (days < 7) return `last seen ${days}d ago`;
    return `last seen ${new Date(user.last_seen_timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
  }

  if (user.last_seen && user.last_seen !== 'online' && user.last_seen !== 'just now') {
    return user.last_seen;
  }

  return 'offline';
};

