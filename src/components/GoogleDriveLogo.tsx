import React from 'react';

export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 87.3 78" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    aria-label="Google Drive Logo"
  >
    {/* Official Google Drive Vector Geometry */}
    <path 
      fill="#0066DA" 
      d="M6.6 66.85L10.45 73.5C11.25 74.9 12.4 76 13.75 76.8L27.5 53H0C0 54.55 0.4 56.1 1.2 57.5L6.6 66.85Z" 
    />
    <path 
      fill="#00AC47" 
      d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C0.4 49.9 0 51.45 0 53H27.5L43.65 25Z" 
    />
    <path 
      fill="#EA4335" 
      d="M73.55 76.8C74.9 76 76.05 74.9 76.85 73.5L78.45 70.75L86.1 57.5C86.9 56.1 87.3 54.55 87.3 53H59.8L65.65 64.5L73.55 76.8Z" 
    />
    <path 
      fill="#00832D" 
      d="M43.65 25L57.4 1.2C56.05 0.4 54.5 0 52.9 0H34.4C32.8 0 31.25 0.45 29.9 1.2L43.65 25Z" 
    />
    <path 
      fill="#2684FC" 
      d="M59.8 53H27.5L13.75 76.8C15.1 77.6 16.65 78 18.25 78H69.05C70.65 78 72.2 77.55 73.55 76.8L59.8 53Z" 
    />
    <path 
      fill="#FFBA00" 
      d="M73.4 26.5L60.7 4.5C59.9 3.1 58.75 2 57.4 1.2L43.65 25L59.8 53H87.25C87.25 51.45 86.85 49.9 86.05 48.5L73.4 26.5Z" 
    />
  </svg>
);
