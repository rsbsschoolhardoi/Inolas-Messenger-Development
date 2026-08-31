/**
 * Date and time formatting utilities for clean, minimal, and aesthetic chat UI.
 */

/**
 * Safely parses any date/time input (number, string, Firestore Timestamp, or Date)
 */
function parseSafeDate(input: any): Date | null {
  if (!input) return null;
  if (input instanceof Date && !isNaN(input.getTime())) return input;
  if (typeof input === 'number' && input > 0) {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  // Firestore Timestamp with seconds
  if (typeof input === 'object' && typeof input.seconds === 'number') {
    const d = new Date(input.seconds * 1000);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === 'object' && typeof input.toDate === 'function') {
    try {
      const d = input.toDate();
      if (d instanceof Date && !isNaN(d.getTime())) return d;
    } catch {}
  }
  if (typeof input === 'string') {
    const str = input.trim();
    if (!str) return null;
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
      return parsed;
    }
  }
  return null;
}

/**
 * Returns a normalized date key 'YYYY-MM-DD' for grouping messages by day.
 */
export function getMessageDateKey(created_at?: number | any, timestampStr?: string | any): string {
  const parsedDate = parseSafeDate(created_at) || parseSafeDate(timestampStr);
  if (parsedDate) {
    const year = parsedDate.getFullYear();
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Fallback to today
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Formats a dateKey (YYYY-MM-DD) into an aesthetic, professional divider label:
 * - "Today"
 * - "Yesterday"
 * - Weekday ("Monday", "Tuesday", etc.) if within last 7 days
 * - "23 August" or "23 August 2025" if older
 */
export function formatChatDateDivider(dateKey: string): string {
  if (!dateKey) return 'Today';

  const parts = dateKey.split('-');
  if (parts.length !== 3) return 'Today';

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);

  const msgDate = new Date(year, month, day);
  if (isNaN(msgDate.getTime())) return 'Today';

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgMidnight = new Date(msgDate.getFullYear(), msgDate.getMonth(), msgDate.getDate());

  const diffMs = todayMidnight.getTime() - msgMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return msgDate.toLocaleDateString('en-US', { weekday: 'long' });
  }

  // Current year -> "August 23" or "23 August"
  if (msgDate.getFullYear() === now.getFullYear()) {
    return msgDate.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short'
    });
  }

  // Different year -> "August 23, 2025"
  return msgDate.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats a message timestamp accurately in the user's local timezone (e.g., "10:45 AM").
 */
export function formatMessageTime(createdAt?: number | any, timestampStr?: string | any): string {
  // First try createdAt if provided
  const createdDate = parseSafeDate(createdAt);
  if (createdDate) {
    return createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  if (timestampStr !== undefined && timestampStr !== null) {
    // If it's a string
    if (typeof timestampStr === 'string') {
      const trimmed = timestampStr.trim();
      // If it's already a clean time format like "10:45 AM" or "10:45"
      if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(trimmed)) {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    } else {
      const parsed = parseSafeDate(timestampStr);
      if (parsed) {
        return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
    }
  }

  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/**
 * Formats a chat list timestamp (e.g., "10:45 AM", "Yesterday", "Sun", "Aug 23").
 */
export function formatChatListTime(updatedAt?: number | any, fallbackStr?: string | any): string {
  let targetDate: Date | null = parseSafeDate(updatedAt);

  if (!targetDate && fallbackStr !== undefined && fallbackStr !== null) {
    if (typeof fallbackStr === 'string') {
      const trimmed = fallbackStr.trim();
      if (trimmed === 'now') return 'now';
      if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(trimmed) || trimmed === 'Yesterday') {
        return trimmed;
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1990) {
        targetDate = parsed;
      }
    } else {
      targetDate = parseSafeDate(fallbackStr);
    }
  }

  if (!targetDate) {
    return 'now';
  }

  const now = new Date();
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const targetMidnight = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());

  const diffMs = todayMidnight.getTime() - targetMidnight.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return targetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }
  if (diffDays > 1 && diffDays < 7) {
    return targetDate.toLocaleDateString('en-US', { weekday: 'short' });
  }

  return targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Strips raw markdown asterisks, hashes, backticks, and tags for a pristine chat list preview.
 */
export function formatCleanChatPreview(rawText?: string, maxLen = 42): string {
  if (!rawText) return '';
  
  // Clean markdown tokens
  let clean = rawText
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#+\s+/gm, '')
    .replace(/\n+/g, ' ')
    .trim();

  if (clean.length > maxLen) {
    return clean.slice(0, maxLen).trim() + '...';
  }
  return clean;
}
