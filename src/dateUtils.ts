/**
 * Date and time formatting utilities for clean, minimal, and aesthetic chat UI.
 */

/**
 * Returns a normalized date key 'YYYY-MM-DD' for grouping messages by day.
 */
export function getMessageDateKey(created_at?: number, timestampStr?: string): string {
  if (created_at && typeof created_at === 'number' && created_at > 0) {
    const d = new Date(created_at);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // If timestampStr has date info (e.g. ISO or date string)
  if (timestampStr) {
    const parsed = new Date(timestampStr);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
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
