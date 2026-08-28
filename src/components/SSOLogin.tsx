import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Smartphone, ArrowRight, CheckCircle2, AlertCircle, Bot, LogOut } from 'lucide-react';
import { UserData } from '../types';

interface SSOLoginProps {
  themeMode: 'light' | 'dark';
  currentUser: UserData | null;
  onLoginRequest: () => void;
  onLogout: () => void;
}

export const SSOLogin: React.FC<SSOLoginProps> = ({ 
  themeMode, 
  currentUser, 
  onLoginRequest,
  onLogout
}) => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [redirectUri, setRedirectUri] = useState<string | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [appConfig, setAppConfig] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cid = params.get('client_id');
    const ruri = params.get('redirect_uri');
    const st = params.get('state');

    if (!cid || !ruri) {
      setError('Invalid SSO request: Missing client_id or redirect_uri');
      setIsLoading(false);
      return;
    }

    setClientId(cid);
    setRedirectUri(ruri);
    setState(st);

    // Fetch App Config from Server
    fetch(`/api/v1/sso/config?client_id=${cid}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setAppConfig(data);
        }
      })
      .catch(() => setError('Failed to connect to Zenoa SSO Service'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleAuthorize = async () => {
    if (!currentUser || !clientId || !redirectUri) return;

    setIsAuthorizing(true);
    try {
      const response = await fetch('/api/v1/sso/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          user_data: {
            uid: currentUser.id,
            username: currentUser.username,
            display_name: currentUser.display_name,
            email: currentUser.email,
            mobile_number: currentUser.mobile_number,
            avatar_url: currentUser.avatar_url || currentUser.avatar_seed
          },
          redirect_uri: redirectUri
        })
      });

      const data = await response.json();
      if (data.success) {
        // Redirect back to app with payload and signature
        const finalUrl = new URL(redirectUri);
        finalUrl.searchParams.append('payload', data.payload);
        finalUrl.searchParams.append('signature', data.signature);
        if (state) finalUrl.searchParams.append('state', state);
        
        window.location.href = finalUrl.toString();
      } else {
        setError(data.error || 'Authorization failed');
      }
    } catch (err) {
      setError('Authorization service error');
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-6">
        <div className="h-8 w-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-6">
        <div className="max-w-md w-full bg-white dark:bg-neutral-900 rounded-[2.5rem] p-8 shadow-2xl border border-slate-200 dark:border-neutral-800 text-center">
          <div className="bg-rose-100 dark:bg-rose-950/30 p-4 rounded-3xl inline-block mb-4">
            <AlertCircle className="h-8 w-8 text-rose-500" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">SSO Error</h2>
          <p className="text-slate-500 dark:text-neutral-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 rounded-2xl text-xs font-bold"
          >
            Go Back to Zenoa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white dark:bg-neutral-900 rounded-[3rem] p-8 shadow-2xl border border-slate-200 dark:border-neutral-800 overflow-hidden relative">
          
          {/* Logo Section */}
          <div className="flex justify-center mb-8 relative">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-2xl rounded-full" />
              <div className="relative bg-gradient-to-br from-indigo-600 to-violet-700 p-5 rounded-[2rem] shadow-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Continue to {appConfig?.app_name}</h1>
            <p className="text-slate-500 dark:text-neutral-400 text-sm mt-2">
              Securely sign in with your <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-tight">ZENOA Account</span>
            </p>
          </div>

          {!currentUser ? (
            <div className="space-y-4">
              <div className="p-6 bg-slate-50 dark:bg-neutral-800/50 rounded-3xl border border-slate-100 dark:border-neutral-800/50 text-center">
                <p className="text-xs text-slate-500 dark:text-neutral-400 mb-6 leading-relaxed">
                  You need to sign in to your Zenoa account to continue. Once verified, we will share your basic profile info with <span className="font-bold">{appConfig?.app_name}</span>.
                </p>
                <button 
                  onClick={onLoginRequest}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                >
                  Sign In to Zenoa
                </button>
              </div>
              <p className="text-[10px] text-center text-slate-400 dark:text-neutral-500">
                Don't have an account? You'll be able to create one after clicking Sign In.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="p-4 bg-slate-50 dark:bg-neutral-800/50 rounded-3xl border border-slate-100 dark:border-neutral-800/50 flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center overflow-hidden">
                   {currentUser.avatar_url ? (
                     <img src={currentUser.avatar_url} alt="Profile" className="h-full w-full object-cover" />
                   ) : (
                     <Bot className="h-7 w-7 text-indigo-500" />
                   )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-slate-900 dark:text-white truncate">{currentUser.display_name}</h4>
                  <p className="text-xs text-slate-500 dark:text-neutral-500 truncate">@{currentUser.username}</p>
                </div>
                <button 
                  onClick={onLogout}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                  title="Not you? Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                   <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                   <span className="text-[11px] text-slate-500 dark:text-neutral-400">Share your Name, Email and Mobile Number</span>
                </div>
                <div className="flex items-center gap-2 px-1">
                   <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                   <span className="text-[11px] text-slate-500 dark:text-neutral-400">Verified via Truecaller on Zenoa</span>
                </div>
              </div>

              <button 
                onClick={handleAuthorize}
                disabled={isAuthorizing}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {isAuthorizing ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Continue as {currentUser.display_name.split(' ')[0]}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              <button 
                onClick={() => window.location.href = redirectUri!}
                className="w-full py-3 bg-transparent text-slate-400 dark:text-neutral-500 rounded-2xl text-xs font-bold hover:text-slate-600 dark:hover:text-neutral-300 transition-colors"
              >
                Cancel and Return
              </button>
            </div>
          )}

          {/* Footer Branding */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800/50 flex items-center justify-center gap-2 grayscale opacity-50">
             <div className="bg-indigo-600 p-1 rounded-lg">
                <Shield className="h-3 w-3 text-white" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-neutral-400">Powered by Zenoa One-Tap</span>
          </div>
        </div>
        
        <p className="text-center mt-6 text-[10px] text-slate-400 dark:text-neutral-600 font-medium px-4">
          By continuing, Zenoa will share your profile information with {appConfig?.app_name}. 
          See Zenoa's <span className="underline">Privacy Policy</span> for more info.
        </p>
      </motion.div>
    </div>
  );
};
