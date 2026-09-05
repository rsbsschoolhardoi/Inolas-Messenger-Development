import React, { useState } from 'react';
import { getAppleEmojiUrl, getAppleEmojiFallbackUrl } from '../utils/appleEmoji';

interface AppleEmojiProps {
  emoji: string;
  size?: number | string;
  className?: string;
  alt?: string;
}

/**
 * Renders an authentic Apple iOS emoji PNG from the official Apple emoji dataset.
 * Supports fallback to secondary CDN and graceful fallback to system font.
 */
export const AppleEmoji: React.FC<AppleEmojiProps> = ({
  emoji,
  size,
  className = '',
  alt
}) => {
  const [useFallbackCdn, setUseFallbackCdn] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (!emoji || typeof emoji !== 'string') return null;

  if (hasError) {
    return <span className={className}>{emoji}</span>;
  }

  const src = useFallbackCdn ? getAppleEmojiFallbackUrl(emoji) : getAppleEmojiUrl(emoji);

  if (!src) {
    return <span className={className}>{emoji}</span>;
  }

  const dimensionStyle = size ? { width: size, height: size } : undefined;

  return (
    <img
      src={src}
      alt={alt || emoji}
      style={dimensionStyle}
      className={`inline-block object-contain align-middle select-none pointer-events-none ${className}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (!useFallbackCdn) {
          setUseFallbackCdn(true);
        } else {
          setHasError(true);
        }
      }}
    />
  );
};
