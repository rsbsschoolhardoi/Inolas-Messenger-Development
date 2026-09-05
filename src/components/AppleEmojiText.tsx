import React, { useState, useEffect } from 'react';
import { getAppleEmojiCandidateUrls } from '../utils/appleEmoji';
import { getCachedEmojiBlobUrl, getSyncCachedEmojiUrl } from '../utils/appleEmojiCache';

/**
 * Converts unicode emojis into authentic Apple iOS emojis using official Apple emoji assets.
 * Uses Intl.Segmenter to isolate individual emojis accurately (even when typed without spaces).
 * Backed by persistent browser CacheStorage & IndexedDB.
 */

interface AppleEmojiTextProps {
  text?: string | null;
  className?: string;
  emojiClassName?: string;
}

const EMOJI_CHECK_REGEX = /[\p{Extended_Pictographic}\p{Emoji_Presentation}\u{1f1e6}-\u{1f1ff}]/u;
const NON_EMOJI_ONLY_REGEX = /^[a-zA-Z0-9\s.,!?:;'"_+\-=~`@#$%^&*()[\]{}|\\/<>]+$/;

interface InlineAppleEmojiProps {
  emoji: string;
  className?: string;
}

const InlineAppleEmoji: React.FC<InlineAppleEmojiProps> = ({ emoji, className }) => {
  const [candidateIndex, setCandidateIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [blobSrc, setBlobSrc] = useState<string | null>(() => getSyncCachedEmojiUrl(emoji));

  useEffect(() => {
    let isMounted = true;
    const sync = getSyncCachedEmojiUrl(emoji);
    if (sync) {
      setBlobSrc(sync);
      return;
    }

    getCachedEmojiBlobUrl(emoji).then(url => {
      if (isMounted && url) {
        setBlobSrc(url);
      }
    }).catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [emoji]);

  const candidateUrls = getAppleEmojiCandidateUrls(emoji);

  if (hasError || (candidateUrls.length === 0 && !blobSrc) || (!blobSrc && candidateIndex >= candidateUrls.length)) {
    return <span>{emoji}</span>;
  }

  const src = blobSrc || candidateUrls[candidateIndex];

  return (
    <img
      src={src}
      alt={emoji}
      className={className}
      loading="eager"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (blobSrc) {
          setBlobSrc(null);
        } else if (candidateIndex < candidateUrls.length - 1) {
          setCandidateIndex(prev => prev + 1);
        } else {
          setHasError(true);
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
    const parts: React.ReactNode[] = [];
    let currentTextBuffer = '';

    // Prefer Intl.Segmenter for exact Unicode grapheme cluster splitting
    if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
      const segmenter = new (Intl as any).Segmenter(undefined, { granularity: 'grapheme' });
      let segIdx = 0;

      for (const { segment } of segmenter.segment(str)) {
        segIdx++;
        const isEmoji = EMOJI_CHECK_REGEX.test(segment) && !NON_EMOJI_ONLY_REGEX.test(segment);

        if (isEmoji) {
          if (currentTextBuffer) {
            parts.push(currentTextBuffer);
            currentTextBuffer = '';
          }
          parts.push(
            <InlineAppleEmoji
              key={`em-${segIdx}-${segment}`}
              emoji={segment}
              className={emojiClassName}
            />
          );
        } else {
          currentTextBuffer += segment;
        }
      }

      if (currentTextBuffer) {
        parts.push(currentTextBuffer);
      }
    } else {
      // Fallback regex if Intl.Segmenter is unavailable
      const singleEmojiRegex = /(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1f1e6}-\u{1f1ff}])(\ufe0f)?([\u{1f3fb}-\u{1f3ff}])?(\u200d(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1f1e6}-\u{1f1ff}])(\ufe0f)?([\u{1f3fb}-\u{1f3ff}])?)*(\ufe0f)?/gu;
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = singleEmojiRegex.exec(str)) !== null) {
        if (match.index > lastIndex) {
          parts.push(str.substring(lastIndex, match.index));
        }
        parts.push(
          <InlineAppleEmoji
            key={`reg-${match.index}-${match[0]}`}
            emoji={match[0]}
            className={emojiClassName}
          />
        );
        lastIndex = singleEmojiRegex.lastIndex;
      }
      if (lastIndex < str.length) {
        parts.push(str.substring(lastIndex));
      }
    }

    if (parts.length === 0) return null;

    return className ? <span className={className}>{parts}</span> : <>{parts}</>;
  } catch (_err) {
    return className ? <span className={className}>{str}</span> : <>{str}</>;
  }
};

