import React from 'react';

/**
 * Converts unicode emojis into crisp, high-resolution Apple/WhatsApp-style vector emojis
 * using Twemoji CDN so they look identical and premium on Android, Windows, and iOS.
 */

function emojiToHex(emoji: string): string {
  const codePoints: string[] = [];
  for (const char of emoji) {
    const code = char.codePointAt(0);
    if (code !== undefined && code !== 0xfe0f) {
      codePoints.push(code.toString(16));
    }
  }
  return codePoints.join('-');
}

interface AppleEmojiTextProps {
  text: string;
  className?: string;
  emojiClassName?: string;
}

export const AppleEmojiText: React.FC<AppleEmojiTextProps> = ({
  text,
  className = '',
  emojiClassName = 'inline-block w-[1.15em] h-[1.15em] mx-0.5 align-[-0.15em] object-contain select-none pointer-events-none'
}) => {
  if (!text) return null;

  // Regex to match emojis
  const regex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|\u200d)+/gu;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Push preceding text
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    const emojiStr = match[0];
    const hex = emojiToHex(emojiStr);

    if (hex) {
      const imgUrl = `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${hex}.png`;
      parts.push(
        <img
          key={`${match.index}-${hex}`}
          src={imgUrl}
          alt={emojiStr}
          className={emojiClassName}
          loading="lazy"
          onError={(e) => {
            // Fallback to native text emoji if image fails
            (e.target as HTMLElement).replaceWith(document.createTextNode(emojiStr));
          }}
        />
      );
    } else {
      parts.push(emojiStr);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <span className={className}>{parts}</span>;
};
