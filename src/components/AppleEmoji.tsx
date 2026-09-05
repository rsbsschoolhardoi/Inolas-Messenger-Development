import React, { useState, useEffect } from 'react';
import { getAppleEmojiCandidateUrls } from '../utils/appleEmoji';
import { getCachedEmojiBlobUrl, getSyncCachedEmojiUrl } from '../utils/appleEmojiCache';

interface AppleEmojiProps {
  emoji: string;
  size?: number | string;
  className?: string;
  alt?: string;
  loading?: 'eager' | 'lazy';
}

/**
 * Renders an authentic Apple iOS emoji PNG from the official Apple emoji dataset.
 * Supports persistent client-side caching (CacheStorage + IndexedDB + Object URLs)
 * and resilient multi-tier fallback (Local API proxy -> unpkg Cloudflare -> GitHub -> cdnjs -> jsdelivr).
 */
export const AppleEmoji: React.FC<AppleEmojiProps> = ({
  emoji,
  size,
  className = '',
  alt,
  loading = 'lazy'
}) => {
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

  if (!emoji || typeof emoji !== 'string') return null;

  const candidateUrls = getAppleEmojiCandidateUrls(emoji);

  if (hasError || (candidateUrls.length === 0 && !blobSrc) || (!blobSrc && candidateIndex >= candidateUrls.length)) {
    return <span className={className}>{emoji}</span>;
  }

  const src = blobSrc || candidateUrls[candidateIndex];
  const dimensionStyle = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={src}
      alt={alt || emoji}
      style={dimensionStyle}
      className={`inline-block object-contain align-middle select-none pointer-events-none ${className}`}
      loading={loading}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (blobSrc) {
          // Cached blob failed, try candidate URLs
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

