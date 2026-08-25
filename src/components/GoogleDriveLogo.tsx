import React from 'react';

export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 873 780" xmlns="http://www.w3.org/2000/svg" aria-label="Google Drive Logo">
    {/* Green Left Bar */}
    <path fill="#00AC47" d="M291 0L0 504l136 236 291-504z" />
    {/* Yellow Right Bar */}
    <path fill="#FFBA00" d="M582 0H291l291 504 291-504z" />
    {/* Blue Bottom Bar */}
    <path fill="#2684FC" d="M272 504h601L737 740H136z" />
  </svg>
);
