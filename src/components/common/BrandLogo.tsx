import React, { useState } from 'react';
import { ZenoaLogo } from './ZenoaLogo';

interface BrandLogoProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'app' | 'dev' | 'oauth' | 'avatar';
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  src,
  name = 'Zenoa',
  size = 'md',
  variant = 'app',
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mapping with exact pixel dimensions
  const sizeClasses = {
    xs: 'h-6 w-6 text-xs rounded-lg',
    sm: 'h-8 w-8 text-xs rounded-xl',
    md: 'h-10 w-10 text-sm rounded-xl',
    lg: 'h-12 w-12 text-base rounded-2xl',
    xl: 'h-14 w-14 text-lg rounded-2xl'
  }[size];

  const pixelSizes = {
    xs: 24,
    sm: 32,
    md: 40,
    lg: 48,
    xl: 56
  }[size];

  if (src && src.trim() && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs ${sizeClasses} ${className}`}
      >
        <img
          src={src}
          alt={name}
          onError={() => setImageError(true)}
          className="h-full w-full object-contain p-1 rounded-[inherit]"
          loading="eager"
        />
      </div>
    );
  }

  // If brand is Zenoa or default, render the official Sovereign Zenoa Emblem
  if (!name || name.toLowerCase().includes('zenoa')) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${sizeClasses} ${className}`}>
        <ZenoaLogo size={pixelSizes} className="w-full h-full" />
      </div>
    );
  }

  const firstLetter = (name || 'Z').charAt(0).toUpperCase();

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden font-bold tracking-tight bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-2xs select-none border border-indigo-500/30 ${sizeClasses} ${className}`}
    >
      <span>{firstLetter}</span>
    </div>
  );
};
