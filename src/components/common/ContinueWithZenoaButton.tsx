import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useBranding } from '../../brandingUtils';
import { buildSecureOAuthUrl } from '../../utils/oauthSecurity';

interface ContinueWithZenoaButtonProps {
  portal?: 'developer' | 'sso' | 'custom';
  clientId?: string;
  redirectUri?: string;
  scope?: string;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'dark' | 'white';
  className?: string;
  showArrow?: boolean;
}

export const ContinueWithZenoaButton: React.FC<ContinueWithZenoaButtonProps> = ({
  portal = 'developer',
  clientId,
  redirectUri,
  scope,
  onClick,
  size = 'lg',
  variant = 'primary',
  className = '',
  showArrow = true,
}) => {
  const branding = useBranding();
  const activeLogo = branding.oauth_logo || branding.dev_console_logo || branding.public_logo;
  const appName = branding.app_name || 'Zenoa';

  const handleClick = (e: React.MouseEvent) => {
    if (onClick) {
      onClick();
      return;
    }

    // Determine target OAuth configuration based on portal
    let targetClientId = clientId;
    let targetRedirect = redirectUri;

    if (!targetClientId) {
      targetClientId = portal === 'developer' ? 'zenoa_developer_console' : 'zenoa_oauth_console';
    }

    if (!targetRedirect) {
      const host = typeof window !== 'undefined' ? window.location.hostname.toLowerCase() : '';
      const isZenoaProdHost = host.endsWith('zenoa.in');
      if (portal === 'developer') {
        if (isZenoaProdHost) {
          if (host.includes('developer.zenoa.in') || host.includes('accounts.zenoa.in')) {
            targetRedirect = 'https://developer.zenoa.in/developer';
          } else {
            targetRedirect = `${window.location.protocol}//${host}/developer`;
          }
        } else {
          targetRedirect = `${window.location.origin}/developer`;
        }
      } else {
        if (isZenoaProdHost) {
          if (host.includes('console.zenoa.in') || host.includes('sso.zenoa.in') || host.includes('accounts.zenoa.in')) {
            targetRedirect = 'https://console.zenoa.in/sso';
          } else {
            targetRedirect = `${window.location.protocol}//${host}/sso`;
          }
        } else {
          targetRedirect = `${window.location.origin}/sso`;
        }
      }
    }

    const secureOAuthUrl = buildSecureOAuthUrl({
      clientId: targetClientId,
      redirectUri: targetRedirect,
      scope: scope || (portal === 'sso' ? 'openid profile email phone oauth_management' : 'openid profile email phone developer_access'),
      prompt: 'select_account'
    });

    window.location.href = secureOAuthUrl;
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-[13px] gap-2 rounded-xl',
    md: 'px-5 py-2.5 text-[14px] gap-2.5 rounded-2xl',
    lg: 'px-7 py-3.5 sm:py-4 text-[15px] sm:text-[16px] gap-3 rounded-2xl'
  }[size];

  const logoSizeClasses = {
    sm: 'h-5 w-5 text-[10px]',
    md: 'h-6 w-6 text-xs',
    lg: 'h-7 w-7 text-xs sm:text-sm'
  }[size];

  const variantClasses = {
    primary: 'bg-[#533afd] hover:bg-[#432ec4] active:bg-[#3422a8] text-white shadow-[0_4px_20px_rgba(83,58,253,0.28)] hover:shadow-[0_6px_24px_rgba(83,58,253,0.36)] border border-violet-400/30',
    dark: 'bg-[#0d253d] hover:bg-[#163554] active:bg-[#091a2b] text-white shadow-[0_4px_16px_rgba(13,37,61,0.2)] border border-slate-700/40',
    white: 'bg-white hover:bg-[#f6f9fc] active:bg-[#edf2f7] text-[#0d253d] border border-[#e3e8ee] shadow-[0_4px_14px_rgba(0,55,112,0.08)]'
  }[variant];

  return (
    <button
      id={`btn-continue-with-zenoa-${portal}`}
      type="button"
      onClick={handleClick}
      className={`group relative inline-flex items-center justify-center font-medium tracking-tight transition-all duration-200 cursor-pointer select-none active:scale-[0.985] ${sizeClasses} ${variantClasses} ${className}`}
      style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Roboto, sans-serif' }}
    >
      {/* Clean, High-Contrast Brand Logo */}
      <span className={`inline-flex items-center justify-center rounded-full bg-white text-[#533afd] font-black shrink-0 overflow-hidden shadow-xs border border-white/20 ${logoSizeClasses}`}>
        {activeLogo ? (
          <img 
            src={activeLogo} 
            alt={appName} 
            className="h-full w-full object-contain p-0.5" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <span className="font-extrabold tracking-tighter">Z</span>
        )}
      </span>

      {/* Button Label */}
      <span className="font-semibold whitespace-nowrap">
        Continue with {appName}
      </span>

      {/* Trailing Icon */}
      {showArrow && (
        <ArrowRight className="h-4 w-4 opacity-75 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all duration-200 shrink-0" />
      )}
    </button>
  );
};
