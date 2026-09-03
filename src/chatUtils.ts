/**
 * Helper utility to generate a deterministic, symmetric chat ID for 1-on-1 direct messages.
 * Ensures that both Participant A and Participant B reference the exact same chat ID in Firestore.
 */
export const getDmChatId = (u1: string, u2: string): string => {
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
  if (u1Id) set.add(u1Id);
  if (u2Id) set.add(u2Id);
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
