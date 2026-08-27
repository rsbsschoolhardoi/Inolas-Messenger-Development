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
