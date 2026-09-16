/**
 * Helper utility to generate a deterministic, symmetric chat ID for 1-on-1 direct messages.
 * When immutable User IDs (UIDs) are provided, generates a UID-based deterministic chat ID: `c_dm_${sorted[uid1, uid2]}`.
 * This guarantees 100% Zero-Leak data isolation: even if usernames are recycled, UIDs never collide!
 * If UIDs are omitted, safely falls back to normalized username pairing for backward compatibility.
 */
export const getDmChatId = (u1: string, u2: string, uid1?: string, uid2?: string): string => {
  const cleanUid1 = (uid1 || '').trim();
  const cleanUid2 = (uid2 || '').trim();
  
  if (cleanUid1 && cleanUid2 && cleanUid1 !== cleanUid2) {
    const sortedUids = [cleanUid1, cleanUid2].sort();
    return `c_dm_${sortedUids[0]}_${sortedUids[1]}`;
  }

  const clean1 = (u1 || '').trim().toLowerCase().replace(/^@/, '');
  const clean2 = (u2 || '').trim().toLowerCase().replace(/^@/, '');
  
  if (!clean1 && !clean2) return 'c_general';
  if (!clean1) return `c_${clean2}`;
  if (!clean2) return `c_${clean1}`;
  
  const sorted = [clean1, clean2].sort();
  return `c_${sorted[0]}_${sorted[1]}`;
};

/**
 * Normalizes participant usernames and IDs so Firestore array-contains queries match
 * regardless of casing, @ prefixes, or user IDs.
 */
export const buildNormalizedParticipants = (u1: string, u2?: string, u1Id?: string, u2Id?: string): string[] => {
  const set = new Set<string>();
  const addVariant = (str?: string) => {
    if (!str) return;
    const s = str.trim();
    if (!s) return;
    set.add(s);
    set.add(s.toLowerCase());
    const stripped = s.replace(/^@/, '');
    if (stripped) {
      set.add(stripped);
      set.add(stripped.toLowerCase());
    }
  };
  addVariant(u1);
  addVariant(u2);
  if (u1Id && u1Id.trim()) set.add(u1Id.trim());
  if (u2Id && u2Id.trim()) set.add(u2Id.trim());
  return Array.from(set);
};

/**
 * Smartly decodes messages to handle potential encoding issues like '?'
 */
export const decodeMessage = (text: string): string => {
  if (!text) return '';
  // Replace potential replacement characters or broken encodings with empty or sensible alternatives
  return text.replace(/\ufffd/g, '').trim();
};

/**
 * Checks if an email string is an internal/dummy ghost email address.
 * Used to ensure mobile-only accounts have zero email requirement and never store or display ghost emails.
 */
export const isInternalGhostEmail = (email?: string | null): boolean => {
  if (!email || !email.trim()) return true;
  const clean = email.trim().toLowerCase();
  return (
    clean.endsWith('@zenoa.internal') ||
    clean.endsWith('@zenoa.mail') ||
    clean.endsWith('@zenoa.auth') ||
    clean.endsWith('@zenoa.local') ||
    clean.endsWith('@zenoa.im') ||
    clean.endsWith('@example.com') ||
    clean.startsWith('phone_')
  );
};

/**
 * Validates if a given string is a genuine, non-ghost username.
 * Usernames must be 3-30 chars, alphanumeric with underscore and dot, and cannot be '@' or start/end with dot/underscore.
 */
export const isValidUsername = (username?: string | null): boolean => {
  if (!username) return false;
  const clean = username.trim().toLowerCase().replace(/^@+/, '');
  if (!clean || clean.length < 3 || clean.length > 30) return false;
  if (clean === '@' || clean === 'undefined' || clean === 'null' || clean === 'user') return false;
  return /^[a-z0-9][a-z0-9._]*[a-z0-9]$/.test(clean) || /^[a-z0-9]{3,}$/.test(clean);
};

/**
 * Identifies ghost accounts in Firestore users collection.
 * Ghost accounts include:
 * - Documents with ID '@', '@zenoa', empty, or malformed
 * - Documents with username missing, empty, '@', or less than 3 chars
 * - Documents with display_name missing, '@', or empty
 * - Orphan stub documents with only followers/following without profile attributes
 */
export const isGhostAccount = (docId: string, data?: any): boolean => {
  if (!docId) return true;
  const cleanId = docId.trim().toLowerCase();
  
  if (
    cleanId === '@' ||
    cleanId === '@zenoa' ||
    cleanId === 'undefined@zenoa' ||
    cleanId === 'null@zenoa' ||
    cleanId === 'user@zenoa' ||
    cleanId === 'undefined' ||
    cleanId === 'null' ||
    cleanId === 'user' ||
    cleanId.startsWith('@')
  ) {
    return true;
  }

  if (!data || typeof data !== 'object') return true;

  const rawUsername = (data.username || '').trim().replace(/^@+/, '');
  const rawDisplayName = (data.display_name || data.fullName || '').trim().replace(/^@+/, '');

  // Official / Service accounts have explicit flags and valid usernames
  if (data.is_service_account || data.is_bot || data.is_official) {
    if (!rawUsername || rawUsername === '@' || rawUsername.length < 2) return true;
    return false;
  }

  // If username is empty, '@', or less than 3 characters
  if (!rawUsername || rawUsername === '@' || rawUsername.length < 3) return true;
  if (rawUsername.includes(' ') || !/^[a-z0-9._]+$/i.test(rawUsername)) return true;

  // If display_name is empty or just '@'
  if (!rawDisplayName || rawDisplayName === '@') return true;

  // If document is an orphaned stub (e.g., only has following/followers and no user info)
  if (!data.display_name && !data.email && !data.mobile_number && !data.phone_number && !data.created_at) {
    return true;
  }

  return false;
};

