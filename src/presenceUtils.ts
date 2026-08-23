export const isUserEffectivelyOnline = (user: { online?: boolean; last_seen_timestamp?: number } | undefined) => {
  if (!user) return false;
  
  // Always check timestamp first (60 seconds threshold)
  if (user.last_seen_timestamp) {
    return Date.now() - user.last_seen_timestamp <= 60000;
  }
  
  // Fallback to boolean flag
  return user.online ?? false;
};
