import appleEmojiData from './appleEmojiData.json';

// Type assertion for fast dictionary lookup
const emojiMap: Record<string, string> = appleEmojiData as Record<string, string>;

/**
 * Returns the exact Apple image file name (e.g. '1f600.png', '2764-fe0f.png')
 * for any given Unicode emoji string.
 */
export function getAppleEmojiFilename(emoji: string): string {
  if (!emoji) return '';

  // 1. Direct match in Apple dataset
  if (emojiMap[emoji]) return emojiMap[emoji];

  // 2. Normalized without FE0F (variation selector 16)
  const noFe0f = emoji.replace(/\ufe0f/g, '');
  if (emojiMap[noFe0f]) return emojiMap[noFe0f];

  // 3. Normalized with FE0F
  const withFe0f = emoji + '\ufe0f';
  if (emojiMap[withFe0f]) return emojiMap[withFe0f];

  // 4. Algorithmic codepoints fallback
  const points: string[] = [];
  for (let i = 0; i < emoji.length; i++) {
    const code = emoji.codePointAt(i);
    if (code !== undefined) {
      points.push(code.toString(16).toLowerCase());
      if (code > 0xffff) i++;
    }
  }

  // Check if non-fe0f points match
  const algorithmicStr = points.join('-');
  const fallbackKey = algorithmicStr + '.png';

  return fallbackKey;
}

/**
 * Returns the CDN URL for official Apple iOS high-resolution emoji
 */
export function getAppleEmojiUrl(emoji: string): string {
  const filename = getAppleEmojiFilename(emoji);
  if (!filename) return '';
  return `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/${filename}`;
}

/**
 * Fallback CDN URL using Cloudflare cdnjs
 */
export function getAppleEmojiFallbackUrl(emoji: string): string {
  const filename = getAppleEmojiFilename(emoji);
  if (!filename) return '';
  return `https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/15.0.1/img/apple/64/${filename}`;
}
