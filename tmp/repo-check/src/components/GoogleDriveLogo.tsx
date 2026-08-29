import React from 'react';

export const GoogleDriveLogo: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    aria-label="Google Drive Logo"
  >
    {/* Official Google Drive 3-Color Vector */}
    {/* Blue segment */}
    <path 
      d="M7.74 3.6L1.26 14.82L4.74 20.85L11.22 9.63L7.74 3.6Z" 
      fill="#0066DA" 
    />
    {/* Yellow segment */}
    <path 
      d="M16.26 3.6H7.74L11.22 9.63H19.74L16.26 3.6Z" 
      fill="#FFBA00" 
    />
    {/* Green segment */}
    <path 
      d="M22.74 14.82L19.26 8.79H10.74L14.22 14.82H22.74Z" 
      fill="#00AC47" 
    />
  </svg>
);
