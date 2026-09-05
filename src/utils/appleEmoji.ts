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
 * Returns candidate URLs for official Apple iOS high-resolution emoji images
 * with resilient multi-tier fallback (Local API proxy -> unpkg Cloudflare -> GitHub CDN -> cdnjs -> jsdelivr).
 */
export function getAppleEmojiCandidateUrls(emoji: string): string[] {
  const filename = getAppleEmojiFilename(emoji);
  if (!filename) return [];

  return [
    `/api/apple-emoji/${filename}`,
    `https://unpkg.com/emoji-datasource-apple@15.1.2/img/apple/64/${filename}`,
    `https://raw.githubusercontent.com/iamcal/emoji-data/master/img-apple-64/${filename}`,
    `https://cdnjs.cloudflare.com/ajax/libs/emoji-datasource-apple/15.0.1/img/apple/64/${filename}`,
    `https://cdn.jsdelivr.net/npm/emoji-datasource-apple@15.1.2/img/apple/64/${filename}`
  ];
}

/**
 * Returns the primary URL for official Apple iOS emoji
 */
export function getAppleEmojiUrl(emoji: string): string {
  const candidates = getAppleEmojiCandidateUrls(emoji);
  return candidates[0] || '';
}

/**
 * Fallback CDN URL using Cloudflare unpkg / cdnjs
 */
export function getAppleEmojiFallbackUrl(emoji: string): string {
  const candidates = getAppleEmojiCandidateUrls(emoji);
  return candidates[1] || candidates[2] || candidates[0] || '';
}

export interface SkinToneOption {
  id: string;
  name: string;
  tone: string;
}

export const SKIN_TONES: SkinToneOption[] = [
  { id: 'default', name: 'Default', tone: '' },
  { id: 'light', name: 'Light', tone: '\u{1f3fb}' },
  { id: 'medium-light', name: 'Medium-Light', tone: '\u{1f3fc}' },
  { id: 'medium', name: 'Medium', tone: '\u{1f3fd}' },
  { id: 'medium-dark', name: 'Medium-Dark', tone: '\u{1f3fe}' },
  { id: 'dark', name: 'Dark', tone: '\u{1f3ff}' },
];

/**
 * Returns emoji with skin tone variant applied
 */
export function getEmojiWithTone(baseEmoji: string, toneModifier: string): string {
  if (!toneModifier) return baseEmoji;
  if (baseEmoji.includes('\u200d')) {
    const parts = baseEmoji.split('\u200d');
    const firstClean = parts[0].replace(/\ufe0f/g, '');
    return [firstClean + toneModifier, ...parts.slice(1)].join('\u200d');
  }
  const clean = baseEmoji.replace(/\ufe0f/g, '');
  return clean + toneModifier;
}

/**
 * Checks if a given base emoji supports skin tone variations
 */
export function supportsSkinTone(baseEmoji: string): boolean {
  if (!baseEmoji) return false;
  // Create sample with light skin tone (\u{1f3fb})
  const sample = getEmojiWithTone(baseEmoji, '\u{1f3fb}');
  if (sample === baseEmoji) return false;
  const cleanSample = sample.replace(/\ufe0f/g, '');
  // Must actually exist in the Apple emoji dictionary!
  return Boolean(emojiMap[sample] || emojiMap[cleanSample]);
}

