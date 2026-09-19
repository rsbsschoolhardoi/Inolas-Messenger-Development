import React from 'react';

interface ZenoaLogoProps {
  size?: number | string;
  className?: string;
  withContainer?: boolean;
  containerClassName?: string;
  variant?: 'gradient' | 'monochrome' | 'white';
}

export const ZenoaLogo: React.FC<ZenoaLogoProps> = ({
  size = 36,
  className = '',
  withContainer = false,
  containerClassName = '',
  variant = 'gradient'
}) => {
  const isMonochrome = variant === 'monochrome';
  const isWhite = variant === 'white';

  const logoSvg = (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 100 100" 
      width={size} 
      height={size}
      className={`shrink-0 select-none overflow-visible ${className}`}
      aria-label="Zenoa"
    >
      <defs>
        <linearGradient id="zenoaOrigami1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="zenoaOrigami2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="zenoaOrigami3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
        <linearGradient id="zenoaOrigami4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#a5b4fc" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
        <linearGradient id="zenoaOrigamiDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3730a3" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>

      {/* Sovereign Origami Bird Vector Facets */}
      <g>
        {/* Back Wing Facet */}
        <polygon 
          points="46,48 56,12 34,36" 
          fill={isWhite ? 'rgba(255,255,255,0.6)' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami3)'} 
          opacity={isMonochrome ? 0.65 : 1}
        />
        {/* Tail Upper Facet */}
        <polygon 
          points="32,62 46,48 42,78" 
          fill={isWhite ? 'rgba(255,255,255,0.7)' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami3)'} 
          opacity={isMonochrome ? 0.75 : 1}
        />
        {/* Tail Tip Facet */}
        <polygon 
          points="42,78 14,86 32,62" 
          fill={isWhite ? 'rgba(255,255,255,0.5)' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigamiDark)'} 
          opacity={isMonochrome ? 0.5 : 1}
        />
        {/* Body Central Fold */}
        <polygon 
          points="46,48 66,54 42,78" 
          fill={isWhite ? '#ffffff' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami1)'} 
        />
        {/* Main Large Wing Facet */}
        <polygon 
          points="46,48 90,18 66,54" 
          fill={isWhite ? '#ffffff' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami2)'} 
        />
        {/* Wing Lower Highlight Facet */}
        <polygon 
          points="66,54 90,18 82,42" 
          fill={isWhite ? 'rgba(255,255,255,0.85)' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami4)'} 
          opacity={isMonochrome ? 0.85 : 1}
        />
        {/* Neck Fold */}
        <polygon 
          points="46,48 72,36 66,54" 
          fill={isWhite ? 'rgba(255,255,255,0.9)' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami1)'} 
        />
        {/* Head & Beak Facet */}
        <polygon 
          points="72,36 91,32 79,44" 
          fill={isWhite ? '#ffffff' : isMonochrome ? 'currentColor' : 'url(#zenoaOrigami4)'} 
        />
        {/* Beak Sharp Tip */}
        <polygon 
          points="91,32 97,35 87,41" 
          fill={isWhite ? '#ffffff' : isMonochrome ? 'currentColor' : '#c7d2fe'} 
        />
      </g>
    </svg>
  );

  if (withContainer) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-2 border border-indigo-500/20 shadow-lg shadow-indigo-500/10 ${containerClassName}`}>
        {logoSvg}
      </div>
    );
  }

  return logoSvg;
};
