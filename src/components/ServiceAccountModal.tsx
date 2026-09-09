import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Building2, 
  Lock, 
  X, 
  ExternalLink, 
  Bot, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Maximize2 
} from 'lucide-react';
import { PurpleVerifiedBadge } from './PurpleVerifiedBadge';
import { isOfficialAccount, isBusinessAccount, isAccountVerified } from '../presenceUtils';

interface ServiceAccountModalProps {
  user: any;
  users?: Record<string, any>;
  themeMode?: 'light' | 'dark';
  onClose: () => void;
  onOpenDocs: () => void;
}

export const ServiceAccountModal: React.FC<ServiceAccountModalProps> = ({
  user,
  users = {},
  themeMode = 'light',
  onClose,
  onOpenDocs,
}) => {
  const [showFullImage, setShowFullImage] = useState(false);

  const username = (user?.username || '').toLowerCase().replace(/^@/, '');
  const userObj = users[username] || user;
  
  const isOfficial = isOfficialAccount(userObj, username);
  const isBusiness = isBusinessAccount(userObj, username);
  const isVerified = isAccountVerified(userObj, username);

  // Profile picture / logo: always show custom logo whenever set
  const avatarUrl = userObj?.avatar_url || userObj?.logo_url || userObj?.bot_avatar || user?.avatar_url || user?.logo_url || null;
  const displayName = userObj?.display_name || userObj?.name || userObj?.app_name || username;

  // Additional profile metadata
  const description = userObj?.bio || userObj?.app_description || userObj?.about || userObj?.description || '';
  const primaryWebsite = userObj?.website_url || userObj?.website || '';
  const additionalWebsitesRaw = userObj?.additional_websites || '';
  const supportEmail = userObj?.support_email || '';
  const supportPhone = userObj?.support_phone || userObj?.mobile_number || '';
  const officeAddress = userObj?.office_address || userObj?.address || '';

  // Parse websites list
  const websitesList: string[] = [];
  if (primaryWebsite.trim()) {
    websitesList.push(primaryWebsite.trim());
  }
  if (additionalWebsitesRaw.trim()) {
    const splitExtras = additionalWebsitesRaw.split(/[\n,]+/).map((s: string) => s.trim()).filter(Boolean);
    splitExtras.forEach((url: string) => {
      if (!websitesList.includes(url)) {
        websitesList.push(url);
      }
    });
  }

  const formatUrlDisplay = (url: string) => {
    return url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  };

  const ensureHttp = (url: string) => {
    if (!/^https?:\/\//i.test(url)) {
      return `https://${url}`;
    }
    return url;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
        <div 
          className={`w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden transition-all ${
            themeMode === 'dark'
              ? 'bg-slate-900 border-slate-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className={`px-5 py-3.5 border-b shrink-0 flex items-center justify-between ${
            themeMode === 'dark' ? 'border-slate-800 bg-slate-900/90' : 'border-slate-100 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-2">
              {isOfficial ? (
                <ShieldCheck className="h-5 w-5 text-indigo-500" />
              ) : (
                <Building2 className="h-5 w-5 text-indigo-600" />
              )}
              <h3 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                {isOfficial ? 'Official System Service' : 'Business Service Account'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* Avatar & Logo */}
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="relative group">
                <button
                  type="button"
                  onClick={() => avatarUrl && setShowFullImage(true)}
                  className={`h-24 w-24 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700/80 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all ${
                    avatarUrl ? 'cursor-pointer hover:ring-4 hover:ring-indigo-500/20 active:scale-95' : ''
                  }`}
                  title={avatarUrl ? 'Click to view high resolution logo' : displayName}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-2xl" />
                  ) : isOfficial ? (
                    <ShieldCheck className="h-12 w-12 text-indigo-600" />
                  ) : (
                    <Bot className="h-12 w-12 text-indigo-500" />
                  )}
                  {avatarUrl && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white rounded-2xl">
                      <Maximize2 className="h-5 w-5" />
                    </div>
                  )}
                </button>
                {isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md">
                    <PurpleVerifiedBadge size="sm" />
                  </div>
                )}
              </div>

              {/* Name & Clean Handle */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">{displayName}</h2>
                  {isVerified && <PurpleVerifiedBadge size="sm" />}
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  @{username}
                </p>
              </div>

              {/* Category Pill */}
              <div>
                {isOfficial ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                    <ShieldCheck className="h-3.5 w-3.5" /> Official Zenoa Service Account
                  </span>
                ) : isVerified ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                    <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Verified Business Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Business Service Account
                  </span>
                )}
              </div>
            </div>

            {/* DYNAMIC CARDS: Render ONLY if populated */}

            {/* Card 1: About / Description */}
            {description && (
              <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-left">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>About Service</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            )}

            {/* Card 2: Websites / Links */}
            {websitesList.length > 0 && (
              <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 space-y-2 text-left">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 text-indigo-500" />
                  <span>Websites &amp; Resources</span>
                </h4>
                <div className="space-y-1.5">
                  {websitesList.map((url, idx) => (
                    <a
                      key={`site_${idx}`}
                      href={ensureHttp(url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-xs font-medium group"
                    >
                      <span className="truncate pr-2">{formatUrlDisplay(url)}</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-70 group-hover:opacity-100" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Card 3: Customer Support (Email & Mobile) */}
            {(supportEmail || supportPhone) && (
              <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 space-y-2 text-left">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span>Customer Support</span>
                </h4>
                <div className="grid grid-cols-1 gap-2">
                  {supportEmail && (
                    <a
                      href={`mailto:${supportEmail}`}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-medium"
                    >
                      <Mail className="h-4 w-4 text-indigo-500 shrink-0" />
                      <span className="truncate">{supportEmail}</span>
                    </a>
                  )}

                  {supportPhone && (
                    <a
                      href={`tel:${supportPhone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-2.5 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all text-xs font-medium"
                    >
                      <Phone className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{supportPhone}</span>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Card 4: Office Address */}
            {officeAddress && (
              <div className="p-4 rounded-xl border bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 space-y-1.5 text-left">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-rose-500" />
                  <span>Office Address</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap">
                  {officeAddress}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-2 pt-1">
              {isBusiness && (
                <button
                  onClick={onOpenDocs}
                  className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ExternalLink className="h-4 w-4" />
                  <span>Learn More About Business Accounts</span>
                </button>
              )}

              <button
                onClick={onClose}
                className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                Close
              </button>
            </div>

            {/* Gateway Security Notice AT THE VERY BOTTOM */}
            <div className={`w-full text-left p-3 rounded-xl border text-[11px] space-y-1 ${
              themeMode === 'dark' 
                ? 'bg-slate-950/50 border-slate-800 text-slate-400' 
                : 'bg-slate-50/90 border-slate-200/80 text-slate-500'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <Lock className="h-3 w-3 text-emerald-500 shrink-0" />
                <span>Protected by Zenoa Cryptographic Gateway</span>
              </div>
              <p className="leading-snug text-[10.5px]">
                Automated service accounts operate on programmatic APIs with zero access to your private conversations. Personal social features are restricted for service entities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image Lightbox Preview Modal */}
      {showFullImage && avatarUrl && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in cursor-pointer"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-sm w-full p-4 flex flex-col items-center">
            <button
              onClick={() => setShowFullImage(false)}
              className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white"
            >
              <X className="h-6 w-6" />
            </button>
            <img 
              src={avatarUrl} 
              alt={displayName} 
              className="w-full h-auto rounded-2xl shadow-2xl border-2 border-white/10 object-contain max-h-[70vh]"
            />
            <p className="mt-3 text-xs text-slate-300 font-medium">{displayName} Logo</p>
          </div>
        </div>
      )}
    </>
  );
};
