import React from 'react';
import { ShieldCheck, Building2, Lock, X, ExternalLink, Bot, CheckCircle2 } from 'lucide-react';
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
  const username = (user?.username || '').toLowerCase().replace(/^@/, '');
  const userObj = users[username] || user;
  
  const isOfficial = isOfficialAccount(userObj, username);
  const isBusiness = isBusinessAccount(userObj, username);
  const isVerified = isAccountVerified(userObj, username);

  // Determine avatar visibility: for business accounts, avatar is only visible if live
  const isLive = userObj?.is_live === true || userObj?.environment === 'live';
  const showCustomAvatar = isOfficial || (isBusiness && isLive && userObj?.avatar_url);
  const avatarUrl = showCustomAvatar ? (userObj?.avatar_url || null) : null;
  const displayName = userObj?.display_name || userObj?.name || username;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div 
        className={`w-full max-w-md rounded-2xl shadow-2xl border overflow-hidden transition-all ${
          themeMode === 'dark'
            ? 'bg-slate-900 border-slate-800 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          themeMode === 'dark' ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/80'
        }`}>
          <div className="flex items-center gap-2">
            {isOfficial ? (
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
            ) : (
              <Building2 className="h-5 w-5 text-indigo-600" />
            )}
            <h3 className="font-extrabold text-sm tracking-tight">
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

        {/* Content */}
        <div className="p-6 flex flex-col items-center text-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <div className="h-24 w-24 rounded-full overflow-hidden border-4 border-indigo-500/20 shadow-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover rounded-full" />
              ) : isOfficial ? (
                <ShieldCheck className="h-12 w-12 text-indigo-600" />
              ) : (
                <Bot className="h-12 w-12 text-indigo-500" />
              )}
            </div>
            {isVerified && (
              <div className="absolute bottom-0 right-0 bg-white dark:bg-slate-900 rounded-full p-1 shadow-md">
                <PurpleVerifiedBadge size="sm" />
              </div>
            )}
          </div>

          {/* Name & Handle */}
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-1.5 flex-wrap">
              <h2 className="text-xl font-black tracking-tight">{displayName}</h2>
              {isVerified && <PurpleVerifiedBadge size="sm" />}
            </div>
            <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
              @{username}
            </p>
          </div>

          {/* Account Subtitle Badge */}
          <div>
            {isOfficial ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/40">
                <ShieldCheck className="h-3.5 w-3.5" /> Official Zenoa Service Account
              </span>
            ) : isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" /> Verified Business Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                <Building2 className="h-3.5 w-3.5 text-slate-500" /> Business Service Account
              </span>
            )}
          </div>

          {/* Bio / Description */}
          {userObj?.bio && (
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed font-medium">
              {userObj.bio}
            </p>
          )}

          {/* Gateway Security Box */}
          <div className={`w-full text-left p-3.5 rounded-xl border text-xs space-y-1.5 ${
            themeMode === 'dark' 
              ? 'bg-slate-800/50 border-slate-700/80 text-slate-300' 
              : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
              <Lock className="h-3.5 w-3.5 text-emerald-500" />
              <span>Protected by Zenoa Cryptographic Gateway</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Automated service accounts operate on programmatic APIs with 0 access to your private 1-on-1 chats. Voice and video calls and personal profile follow features are disabled for service entities.
            </p>
          </div>

          {/* Buttons */}
          <div className="w-full space-y-2 pt-2">
            {isBusiness && (
              <button
                onClick={onOpenDocs}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Tap to Learn More About Business Accounts</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs border transition-all cursor-pointer ${
                themeMode === 'dark'
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
