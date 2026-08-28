import React, { useId } from 'react';

interface PurpleVerifiedBadgeProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

export const PurpleVerifiedBadge: React.FC<PurpleVerifiedBadgeProps> = ({
  size = 'sm',
  className = '',
  showTooltip = true,
}) => {
  const rawId = useId();
  const gradientId = "purpleVerifiedGrad_" + rawId.replace(/:/g, "");
  const glowId = "purpleGlow_" + rawId.replace(/:/g, "");

  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  const dimension = sizeClasses[size] || sizeClasses.sm;

  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      title={showTooltip ? "Official Zenoa Purple Verified Account" : undefined}
    >
      <svg
        className={`${dimension} drop-shadow-sm transition-transform hover:scale-105`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient
            id={gradientId}
            x1="2"
            y1="2"
            x2="22"
            y2="22"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="50%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#6D28D9" />
          </linearGradient>

          <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#7E22CE" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* High Precision 12-point Scalloped Rosette Vector */}
        <path
          d="M12 2L13.9 3.8L16.4 3.2L17.5 5.5L20 6.1L20.1 8.7L22 10.5L21.1 12.9L22 15.3L20.1 17.1L20 19.7L17.5 20.3L16.4 22.6L13.9 22L12 23.8L10.1 22L7.6 22.6L6.5 20.3L4 19.7L3.9 17.1L2 15.3L2.9 12.9L2 10.5L3.9 8.7L4 6.1L6.5 5.5L7.6 3.2L10.1 3.8L12 2Z"
          fill={`url(#${gradientId})`}
          filter={`url(#${glowId})`}
        />

        {/* Inner Gloss Ring Accent */}
        <circle
          cx="12"
          cy="12"
          r="8.5"
          stroke="white"
          strokeOpacity="0.25"
          strokeWidth="0.8"
          fill="none"
        />

        {/* Crisp Bold Vector Checkmark */}
        <path
          d="M9.8 15.6L6.7 12.5C6.3 12.1 5.7 12.1 5.3 12.5C4.9 12.9 4.9 13.5 5.3 13.9L9.1 17.7C9.5 18.1 10.1 18.1 10.5 17.7L18.7 9.5C19.1 9.1 19.1 8.5 18.7 8.1C18.3 7.7 17.7 7.7 17.3 8.1L9.8 15.6Z"
          fill="white"
        />
      </svg>
    </span>
  );
};
