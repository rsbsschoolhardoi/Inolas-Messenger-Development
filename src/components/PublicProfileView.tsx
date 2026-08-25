import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Phone, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  Copy, 
  Sun, 
  Moon, 
  CheckCircle2, 
  Sparkles,
  Globe,
  ArrowLeft
} from 'lucide-react';
import { db, isFirebaseConfigured } from '../firebaseClient';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { isUserEffectivelyOnline } from '../presenceUtils';

interface PublicProfileViewProps {
  username: string;
  themeMode: 'light' | 'dark';
  onToggleTheme: () => void;
  onGoToLogin: () => void;
}

interface UserProfileData {
  display_name?: string;
  username: string;
  avatar_url?: string;
  avatar_seed?: string;
  bio?: string;
  online?: boolean;
  last_seen?: string;
  last_seen_timestamp?: number;
}

export const PublicProfileView: React.FC<PublicProfileViewProps> = ({
  username,
  themeMode,
  onToggleTheme,
  onGoToLogin,
}) => {
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setLoading(true);
      const cleanName = username.replace(/^@/, '').trim().toLowerCase();
      
      if (isFirebaseConfigured && db) {
        try {
          // 1. Try querying users by current username
          const usersRef = collection(db, 'users');
          const qCurrent = query(usersRef, where('username', '==', cleanName));
          const snapCurrent = await getDocs(qCurrent);

          if (!snapCurrent.empty) {
            const data = snapCurrent.docs[0].data();
            if (isMounted) {
              setProfile({
                display_name: data.display_name || data.name || data.username || cleanName,
                username: data.username || cleanName,
                avatar_url: data.avatar_url,
                avatar_seed: data.avatar_seed || data.username || cleanName,
                bio: data.bio || data.about || 'Hey there! I am using Zenoa for end-to-end encrypted messaging.',
                online: data.online ?? true,
                last_seen: data.last_seen || 'Recently active',
                last_seen_timestamp: data.last_seen_timestamp
              });
              setLoading(false);
              return;
            }
          }

          // 2. Try direct doc get (if cleanName is userId)
          const userDocRef = doc(db, 'users', cleanName);
          const snap = await getDoc(userDocRef);
          if (snap.exists()) {
            const data = snap.data();
            if (isMounted) {
              setProfile({
                display_name: data.display_name || data.name || data.username || cleanName,
                username: data.username || cleanName,
                avatar_url: data.avatar_url,
                avatar_seed: data.avatar_seed || data.username || cleanName,
                bio: data.bio || data.about || 'Hey there! I am using Zenoa for end-to-end encrypted messaging.',
                online: data.online ?? true,
                last_seen: data.last_seen || 'Recently active',
                last_seen_timestamp: data.last_seen_timestamp
              });
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.error('Error fetching public profile:', err);
        }
      }

      // Fallback if not found in db or db offline
      if (isMounted) {
        setProfile({
          display_name: cleanName.charAt(0).toUpperCase() + cleanName.slice(1),
          username: cleanName,
          avatar_seed: cleanName,
          bio: 'Hey there! I am using Zenoa for end-to-end encrypted messaging.',
          online: true,
          last_seen: 'Recently active'
        });
        setLoading(false);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [username]);

  const cleanUsername = username.replace(/^@/, '').trim();
  const profileUrl = `${window.location.origin}/u/${cleanUsername}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(profileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const getAvatarLetter = (name: string) => {
    if (!name) return 'Z';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const f = parts[0].replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase();
      const s = parts[1].replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase();
      if (f && s) return `${f}${s}`;
    }
    const clean = name.replace(/[^a-zA-Z0-9]/g, '');
    return clean ? clean.charAt(0).toUpperCase() : 'Z';
  };

  const getAvatarBg = (seed: string) => {
    const colors = [
      'bg-indigo-600 text-white',
      'bg-purple-600 text-white',
      'bg-rose-600 text-white',
      'bg-emerald-600 text-white',
      'bg-amber-600 text-white',
      'bg-sky-600 text-white'
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
    return colors[hash % colors.length];
  };

  return (
    <div className={`min-h-screen w-full flex flex-col font-['Inter'] transition-colors relative overflow-x-hidden ${
      themeMode === 'dark' ? 'dark bg-neutral-950 text-white' : 'bg-neutral-50 text-neutral-900'
    } pb-28`}>
      
      {/* Premium Background Mesh Accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />
      <div className="absolute top-0 left-1/4 right-1/4 h-96 bg-gradient-to-b from-indigo-500/10 via-rose-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md px-4 lg:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              try { window.history.pushState({}, '', '/'); } catch(e){}
              window.dispatchEvent(new Event('popstate'));
            }}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Go to Home"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-zenoa font-black text-sm flex items-center justify-center shadow-md">
              Z
            </div>
            <span className="font-zenoa font-bold text-base tracking-tight text-neutral-900 dark:text-white">
              Zenoa
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Toggle Theme"
          >
            {themeMode === 'dark' ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-neutral-600" />}
          </button>

          <button
            onClick={onGoToLogin}
            className="px-4 py-2 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 font-bold text-xs hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Profile Display Card */}
      <main className="flex-1 max-w-xl w-full mx-auto p-4 sm:p-6 flex flex-col items-center justify-center relative z-10">
        {loading ? (
          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-xl text-center space-y-4 animate-pulse">
            <div className="h-24 w-24 rounded-full bg-neutral-200 dark:bg-neutral-800 mx-auto" />
            <div className="h-6 w-40 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded-md" />
            <div className="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 mx-auto rounded-md" />
          </div>
        ) : (
          <div className="w-full bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-indigo-500/5 hover:border-indigo-500/20">
            {/* Top Cover Gradient Banner */}
            <div className="h-32 bg-gradient-to-r from-indigo-600 via-rose-500 to-amber-500 relative flex items-end justify-center pb-0 overflow-hidden">
              <div className="absolute inset-0 bg-neutral-950/10 pointer-events-none" />
              <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md text-white text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 border border-white/15">
                <Globe className="h-3 w-3 text-indigo-400" />
                <span>Encrypted Profile</span>
              </div>
            </div>

            {/* Avatar & Profile Identity */}
            <div className="px-5 sm:px-8 pb-8 text-center relative -mt-12 space-y-5">
              <div className="relative inline-block">
                <div className="p-1 rounded-full bg-white dark:bg-neutral-900 shadow-xl border border-neutral-200/50 dark:border-neutral-800">
                  {profile?.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      className="h-24 w-24 rounded-full object-cover border-2 border-white dark:border-neutral-900"
                    />
                  ) : (
                    <div className={`h-24 w-24 rounded-full ${getAvatarBg(profile?.avatar_seed || cleanUsername)} font-black text-3xl flex items-center justify-center shadow-inner border-2 border-white dark:border-neutral-900`}>
                      {getAvatarLetter(profile?.display_name || cleanUsername)}
                    </div>
                  )}
                </div>

                {isUserEffectivelyOnline({ online: profile?.online, last_seen_timestamp: profile?.last_seen_timestamp }) && (
                  <span className="absolute bottom-1 right-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-white dark:border-neutral-900 shadow-sm" title="Online now" />
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white flex items-center justify-center gap-1.5 leading-tight tracking-tight break-all">
                  <span>{profile?.display_name}</span>
                  <CheckCircle2 className="h-5 w-5 text-indigo-500 fill-indigo-500/20 shrink-0" />
                </h1>
                <p className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 font-mono break-all">@{profile?.username}</p>
              </div>

              {/* Verified Security Badges */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-[10px] sm:text-[11px]">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 flex items-center gap-1 shrink-0">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified User
                </span>
                <span className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20 flex items-center gap-1 shrink-0">
                  <Sparkles className="h-3.5 w-3.5" /> End-to-End Secure
                </span>
              </div>
 
              {/* Bio Section with absolute safe heights */}
              <div className="p-4 sm:p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-150 dark:border-neutral-800 text-left space-y-1.5 transition-colors">
                <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 dark:text-neutral-500 block">About / Status</span>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed font-medium break-words">
                  {profile?.bio}
                </p>
              </div>
 
              {/* Shareable Link Box with Responsive Padding */}
              <div className="flex items-center justify-between p-2 sm:p-2.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-xs font-mono text-neutral-600 dark:text-neutral-300 gap-2 overflow-hidden">
                <span className="truncate pr-1 pl-1.5 text-left flex-1 break-all select-all">{profileUrl}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3.5 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-white font-bold text-[11px] flex items-center gap-1 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0 shadow-sm"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
 
              {/* Non-Interactive Action Buttons Preview (with Lock indicator) */}
              <div className="space-y-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={onGoToLogin}
                    className="py-3 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 text-neutral-400 dark:text-neutral-500 font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-full gap-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-neutral-400" />
                      <span>Send Message</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                  <button
                    onClick={onGoToLogin}
                    className="py-3 px-4 rounded-2xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 text-neutral-400 dark:text-neutral-500 font-bold text-xs flex items-center justify-between cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors w-full gap-2 text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-neutral-400" />
                      <span>Audio Call</span>
                    </div>
                    <Lock className="h-3.5 w-3.5 text-neutral-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* FIXED BOTTOM FLOATING BANNER */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-white/95 dark:bg-neutral-900/95 border-t border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-2xl">
        <div className="max-w-xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
              <span>Connect with @{cleanUsername} on Zenoa</span>
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              Dekhne aur chat karne ke liye login karen ya account banayein.
            </p>
          </div>

          <button
            onClick={onGoToLogin}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shrink-0"
          >
            <span>Login to Connect</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
