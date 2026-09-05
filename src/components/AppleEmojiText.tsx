import React, { useState } from 'react';
import { getAppleEmojiUrl, getAppleEmojiFallbackUrl } from '../utils/appleEmoji';

/**
 * Converts unicode emojis into authentic Apple iOS emojis using official Apple emoji assets.
 */

interface AppleEmojiTextProps {
  text?: string | null;
  className?: string;
  emojiClassName?: string;
}

const EMOJI_REGEX_SOURCE = '(\\p{Extended_Pictographic}|\\p{Emoji_Presentation}|\\u200d)+';

interface InlineAppleEmojiProps {
  emoji: string;
  className?: string;
}

const InlineAppleEmoji: React.FC<InlineAppleEmojiProps> = ({ emoji, className }) => {
  const [failed, setFailed] = useState(false);
  const [fallbackCdn, setFallbackCdn] = useState(false);

  if (failed) {
    return <span>{emoji}</span>;
  }

  const src = fallbackCdn ? getAppleEmojiFallbackUrl(emoji) : getAppleEmojiUrl(emoji);
  if (!src) {
    return <span>{emoji}</span>;
  }

  return (
    <img
      src={src}
      alt={emoji}
      className={className}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!fallbackCdn) {
          setFallbackCdn(true);
        } else {
          setFailed(true);
        }
      }}
    />
  );
};

export const AppleEmojiText: React.FC<AppleEmojiTextProps> = ({
  text,
  className = '',
  emojiClassName = 'inline-block w-[1.2em] h-[1.2em] mx-0.5 align-[-0.18em] object-contain select-none pointer-events-none'
}) => {
  if (text === undefined || text === null || text === '') return null;
  const str = typeof text === 'string' ? text : String(text);
  if (!str) return null;

  try {
    const regex = new RegExp(EMOJI_REGEX_SOURCE, 'gu');
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(str)) !== null) {
      if (match.index > lastIndex) {
        parts.push(str.substring(lastIndex, match.index));
      }

      const emojiStr = match[0];
      parts.push(
        <InlineAppleEmoji
          key={`${match.index}-${emojiStr}`}
          emoji={emojiStr}
          className={emojiClassName}
        />
      );

      lastIndex = regex.lastIndex;
      if (match.index === regex.lastIndex) {
        regex.lastIndex++;
      }
    }

    if (lastIndex < str.length) {
      parts.push(str.substring(lastIndex));
    }

    if (parts.length === 0) return null;

    return className ? <span className={className}>{parts}</span> : <>{parts}</>;
  } catch (_err) {
    return className ? <span className={className}>{str}</span> : <>{str}</>;
  }
};
