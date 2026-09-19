import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * 1. Google Workspace / Gmail Official Vector Mark
 */
export const GoogleWorkspaceLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <path
      d="M45 16.2V36C45 37.6569 43.6569 39 42 39H36V22.5L24 13.5L12 22.5V39H6C4.34315 39 3 37.6569 3 36V16.2C3 14.5431 3.7383 12.9818 5.01472 11.9248L21.0147 0.9248C22.7562 -0.308267 25.2438 -0.308267 26.9853 0.9248L42.9853 11.9248C44.2617 12.9818 45 14.5431 45 16.2Z"
      fill="#EA4335"
      opacity="0.1"
    />
    {/* Left blue pillar */}
    <path
      d="M6 39H12V22.5L3 15.75V36C3 37.6569 4.34315 39 6 39Z"
      fill="#4285F4"
    />
    {/* Right green pillar */}
    <path
      d="M42 39H36V22.5L45 15.75V36C45 37.6569 43.6569 39 42 39Z"
      fill="#34A853"
    />
    {/* Left yellow fold */}
    <path
      d="M12 22.5V13.5L24 22.5L12 31.5V22.5Z"
      fill="#FBBC04"
      opacity="0.9"
    />
    {/* Top left red chevron */}
    <path
      d="M12 13.5L24 22.5L36 13.5L24 4.5L12 13.5Z"
      fill="#EA4335"
    />
    {/* Top right dark red fold */}
    <path
      d="M36 13.5V22.5L24 22.5L36 13.5Z"
      fill="#C5221F"
    />
    {/* Top corner entry folds */}
    <path
      d="M3 15.75L12 22.5V13.5L5.01472 8.26107C3.84074 7.38058 3 8.32431 3 9.78923V15.75Z"
      fill="#4285F4"
    />
    <path
      d="M45 15.75L36 22.5V13.5L42.9853 8.26107C44.1593 7.38058 45 8.32431 45 9.78923V15.75Z"
      fill="#34A853"
    />
  </svg>
);

/**
 * 2. Microsoft 365 / Outlook Official Vector Mark
 */
export const Microsoft365Logo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 48 48"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect x="4" y="4" width="18" height="18" rx="2" fill="#F25022" />
    <rect x="26" y="4" width="18" height="18" rx="2" fill="#7FBA00" />
    <rect x="4" y="26" width="18" height="18" rx="2" fill="#00A4EF" />
    <rect x="26" y="26" width="18" height="18" rx="2" fill="#FFB900" />
  </svg>
);

/**
 * 3. Zoho Mail Official Brand Vector Mark
 */
export const ZohoMailLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#0B132B" />
    <g transform="translate(10, 10) scale(0.8)">
      {/* Red 'Z' block */}
      <rect x="6" y="6" width="40" height="40" rx="8" fill="#E42528" />
      {/* Green 'O' block */}
      <rect x="54" y="6" width="40" height="40" rx="8" fill="#009944" />
      {/* Blue 'H' block */}
      <rect x="6" y="54" width="40" height="40" rx="8" fill="#0072BC" />
      {/* Yellow 'O' block */}
      <rect x="54" y="54" width="40" height="40" rx="8" fill="#F7941E" />
      
      {/* Letter glyphs */}
      <path d="M16 18H36L20 34H36" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="74" cy="26" r="8" stroke="white" strokeWidth="4" />
      <path d="M18 64V84M34 64V84M18 74H34" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="74" cy="74" r="8" stroke="white" strokeWidth="4" />
    </g>
  </svg>
);

/**
 * 4. Resend Official Vector Mark
 */
export const ResendLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#000000" />
    <path
      d="M26 30C26 27.7909 27.7909 26 30 26H56C65.9411 26 74 34.0589 74 44C74 53.9411 65.9411 62 56 62H40V74H26V30Z"
      fill="white"
    />
    <path
      d="M40 38H54C57.3137 38 60 40.6863 60 44C60 47.3137 57.3137 50 54 50H40V38Z"
      fill="#000000"
    />
    <path
      d="M50 54L68 74H52L38 58H50Z"
      fill="white"
    />
  </svg>
);

/**
 * 5. Amazon Web Services / Amazon SES Official Vector Mark
 */
export const AmazonSesLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#232F3E" />
    <g transform="translate(14, 18) scale(0.72)">
      {/* AWS letters */}
      <path
        d="M20.2 46.5C18.1 46.5 16.5 45.9 15.3 44.8C14.1 43.6 13.5 42 13.5 39.8C13.5 37.6 14.1 35.9 15.4 34.8C16.6 33.6 18.2 33 20.3 33C21.7 33 22.9 33.3 23.8 33.8V30.3C23.8 28.9 23.5 27.9 22.8 27.2C22.1 26.5 21 26.1 19.5 26.1C18.4 26.1 17.3 26.4 16.3 26.9C15.3 27.4 14.6 28 14.1 28.7L11.5 26C12.4 24.9 13.5 24 15 23.3C16.4 22.6 18.1 22.3 20 22.3C22.6 22.3 24.7 23 26.1 24.3C27.5 25.6 28.2 27.5 28.2 30.1V46H24.3V43.2C23.3 44.3 22.1 45.1 21.1 45.7C20.8 46.2 20.5 46.5 20.2 46.5ZM20.6 42.9C21.7 42.9 22.6 42.5 23.3 41.8C24.1 41 24.4 40 24.4 38.8V36.9C23.6 36.4 22.6 36.1 21.4 36.1C20.2 36.1 19.3 36.4 18.6 37C17.9 37.6 17.6 38.4 17.6 39.5C17.6 40.5 17.9 41.3 18.5 42C19.1 42.6 19.8 42.9 20.6 42.9Z"
        fill="white"
      />
      <path
        d="M33 22.8H37.3L42.2 40.6L47.1 22.8H51.4L56.3 40.6L61.2 22.8H65.5L58.5 46H54.1L49.3 28.5L44.5 46H40.1L33 22.8Z"
        fill="white"
      />
      <path
        d="M74.8 46.5C72.8 46.5 71.1 46 69.8 45.1C68.5 44.1 67.6 42.8 67.1 41.2L70.9 39.5C71.3 40.5 71.8 41.3 72.6 41.9C73.4 42.5 74.2 42.8 75.2 42.8C76.1 42.8 76.9 42.6 77.4 42.1C78 41.7 78.3 41.1 78.3 40.3C78.3 39.6 78 39 77.4 38.6C76.8 38.1 75.7 37.7 74.1 37.3C71.8 36.7 70.1 35.9 69.1 35C68.1 34 67.6 32.8 67.6 31.2C67.6 29.8 68 28.6 68.9 27.5C69.7 26.5 70.8 25.6 72.2 25C73.5 24.4 75 24.1 76.6 24.1C78.4 24.1 79.9 24.5 81.2 25.3C82.4 26.1 83.3 27.1 83.7 28.5L79.9 30.1C79.6 29.3 79.1 28.7 78.5 28.3C77.9 27.9 77.2 27.7 76.4 27.7C75.6 27.7 74.9 27.9 74.4 28.3C73.9 28.7 73.6 29.2 73.6 29.8C73.6 30.5 73.9 31 74.4 31.4C74.9 31.8 75.8 32.2 77.1 32.5C79.6 33.1 81.4 34 82.5 35C83.5 36.1 84.1 37.4 84.1 39.2C84.1 40.6 83.6 41.9 82.8 43C81.9 44.1 80.8 44.9 79.4 45.5C78 46.2 76.5 46.5 74.8 46.5Z"
        fill="white"
      />
      {/* Orange Smile Arrow */}
      <path
        d="M87.6 57.5C77.9 64.6 65.5 68.5 52.8 68.5C35 68.5 19 61.2 9.5 50.8C8.8 50 9.4 48.9 10.3 49.5C20.6 56.4 33.4 60.5 47.1 60.5C59.6 60.5 72.8 56.6 84.6 48.6C85.7 47.9 86.8 49.3 85.9 50.1L87.6 57.5Z"
        fill="#FF9900"
      />
      <path
        d="M91.5 52.6C90.9 51.8 87.2 53.6 82.5 55.7C81.9 56 82.2 56.7 82.8 56.6C86.7 55.9 90.9 54.3 91.5 53.6C92.1 52.9 92.1 53.3 91.5 52.6Z"
        fill="#FF9900"
      />
    </g>
  </svg>
);

/**
 * 6. Postmark Official Brand Vector Mark
 */
export const PostmarkLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#FFDE00" />
    <g transform="translate(18, 18) scale(0.64)">
      {/* Postal stamp envelope & signature lines */}
      <rect x="5" y="10" width="90" height="75" rx="8" fill="#1A1A1A" />
      <path
        d="M10 20L50 52L90 20"
        stroke="#FFDE00"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="52" r="6" fill="#FFDE00" />
      <path
        d="M20 70H45M20 60H65"
        stroke="#FFDE00"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </g>
  </svg>
);

/**
 * 7. Twilio SendGrid Official Vector Mark
 */
export const SendGridLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#001E46" />
    <g transform="translate(18, 18) scale(0.64)">
      {/* Top Left Square */}
      <rect x="10" y="10" width="36" height="36" rx="6" fill="#009DD9" />
      {/* Top Right Square */}
      <rect x="54" y="10" width="36" height="36" rx="6" fill="#1A82E2" />
      {/* Bottom Left Square */}
      <rect x="10" y="54" width="36" height="36" rx="6" fill="#00B3EC" />
      {/* Bottom Right Dot */}
      <rect x="54" y="54" width="36" height="36" rx="6" fill="#3BBEFF" />
    </g>
  </svg>
);

/**
 * 8. Brevo (formerly Sendinblue) Official Vector Mark
 */
export const BrevoLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#003527" />
    <g transform="translate(20, 20) scale(0.6)">
      {/* Flowing 'b' brand letter */}
      <path
        d="M16 10C16 4.47715 20.4772 0 26 0C31.5228 0 36 4.47715 36 10V45C36 45 44 35 58 35C74.5685 35 88 48.4315 88 65C88 81.5685 74.5685 95 58 95C42 95 36 85 36 85V90C36 95.5228 31.5228 100 26 100C20.4772 100 16 95.5228 16 90V10Z"
        fill="#00D084"
      />
      <circle cx="58" cy="65" r="14" fill="#003527" />
    </g>
  </svg>
);

/**
 * 9. Mailgun Official Vector Mark
 */
export const MailgunLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#1C1E24" />
    <g transform="translate(18, 18) scale(0.64)">
      {/* Mailgun Winged Silhouette */}
      <path
        d="M92 42C74 38 62 48 48 36C34 24 20 28 8 20C12 36 24 44 38 46C54 48 66 62 92 42Z"
        fill="#FA382C"
      />
      <path
        d="M84 56C68 52 58 60 46 50C34 40 22 44 12 36C15 50 25 58 37 60C51 62 62 74 84 56Z"
        fill="#E22525"
        opacity="0.8"
      />
      <circle cx="82" cy="30" r="5" fill="#FA382C" />
    </g>
  </svg>
);

/**
 * 10. Apple iCloud Mail Official Vector Mark
 */
export const AppleICloudLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#0A84FF" />
    <g transform="translate(18, 24) scale(0.64)">
      <path
        d="M78 52C78 40.9543 69.0457 32 58 32C56.634 32 55.3059 32.1364 54.0249 32.3976C50.2877 22.8427 40.8988 16 30 16C16.1929 16 5 27.1929 5 41C5 42.4777 5.12871 43.9248 5.37521 45.3312C2.10091 48.0645 0 52.2858 0 57C0 65.2843 6.71573 72 15 72H74C82.8366 72 90 64.8366 90 56C90 48.3364 84.6133 41.9329 77.4116 40.3541C77.7989 42.1798 78 44.0664 78 46V52Z"
        fill="white"
      />
    </g>
  </svg>
);

/**
 * 11. Custom / Self-Hosted Enterprise SMTP Vector Mark
 */
export const CustomSmtpServerLogo: React.FC<LogoProps> = ({ className = '', size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="100" height="100" rx="22" fill="#1E1B4B" />
    <g transform="translate(18, 18) scale(0.64)">
      {/* Blade 1 */}
      <rect x="8" y="10" width="84" height="22" rx="5" fill="#312E81" stroke="#6366F1" strokeWidth="2.5" />
      <circle cx="20" cy="21" r="3.5" fill="#10B981" />
      <circle cx="32" cy="21" r="3.5" fill="#6366F1" />
      <line x1="48" y1="21" x2="80" y2="21" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
      
      {/* Blade 2 */}
      <rect x="8" y="38" width="84" height="22" rx="5" fill="#312E81" stroke="#6366F1" strokeWidth="2.5" />
      <circle cx="20" cy="49" r="3.5" fill="#10B981" />
      <circle cx="32" cy="49" r="3.5" fill="#6366F1" />
      <line x1="48" y1="49" x2="80" y2="49" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
      
      {/* Blade 3 */}
      <rect x="8" y="66" width="84" height="22" rx="5" fill="#312E81" stroke="#6366F1" strokeWidth="2.5" />
      <circle cx="20" cy="77" r="3.5" fill="#10B981" />
      <circle cx="32" cy="77" r="3.5" fill="#6366F1" />
      <line x1="48" y1="77" x2="80" y2="77" stroke="#818CF8" strokeWidth="3" strokeLinecap="round" strokeDasharray="4 4" />
    </g>
  </svg>
);

/**
 * Universal Provider Logo Renderer
 */
export const ProviderBrandLogo: React.FC<{
  providerId: string;
  size?: number;
  className?: string;
}> = ({ providerId, size = 32, className = '' }) => {
  switch (providerId) {
    case 'gmail':
    case 'google':
      return <GoogleWorkspaceLogo size={size} className={className} />;
    case 'office365':
    case 'microsoft':
    case 'outlook':
      return <Microsoft365Logo size={size} className={className} />;
    case 'zoho':
      return <ZohoMailLogo size={size} className={className} />;
    case 'resend':
      return <ResendLogo size={size} className={className} />;
    case 'ses':
    case 'aws':
      return <AmazonSesLogo size={size} className={className} />;
    case 'postmark':
      return <PostmarkLogo size={size} className={className} />;
    case 'sendgrid':
    case 'twilio':
      return <SendGridLogo size={size} className={className} />;
    case 'brevo':
    case 'sendinblue':
      return <BrevoLogo size={size} className={className} />;
    case 'mailgun':
      return <MailgunLogo size={size} className={className} />;
    case 'icloud':
    case 'apple':
      return <AppleICloudLogo size={size} className={className} />;
    case 'custom':
    default:
      return <CustomSmtpServerLogo size={size} className={className} />;
  }
};
