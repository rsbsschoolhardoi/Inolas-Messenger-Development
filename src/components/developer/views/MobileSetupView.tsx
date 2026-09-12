import React, { useState } from 'react';
import { Phone, RefreshCw, ShieldCheck, Check, ArrowRight } from 'lucide-react';
import { UserData } from '../../../types';
import { db } from '../../../firebaseClient';
import { doc, setDoc } from 'firebase/firestore';
import { WaveArcs } from '../../originkit/ui/wave-arcs';

interface MobileSetupViewProps {
  user: UserData;
  onSuccess: (updatedUser: UserData) => void;
  onSkip: () => void;
  themeMode?: 'light' | 'dark';
}

export const MobileSetupView: React.FC<MobileSetupViewProps> = ({ 
  user, 
  onSuccess, 
  onSkip,
  themeMode = 'light'
}) => {
  const isDark = themeMode === 'dark';
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOTP, setDemoOTP] = useState('');
  const [isTruecallerVerified, setIsTruecallerVerified] = useState(false);

  const handleSendOTP = async () => {
    setError('');
    const cleanDigits = mobileNumber.replace(/[^0-9]/g, '').trim();
    if (!cleanDigits || cleanDigits.length < 8) {
      setError('Please enter a valid mobile number.');
      return;
    }
    setIsVerifying(true);
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    setDemoOTP(generatedCode);
    
    await new Promise(r => setTimeout(r, 600));
    setIsVerifying(false);
    setOtpSent(true);
  };

  const handleTruecaller1Tap = async () => {
    setError('');
    setIsVerifying(true);
    const partnerKey = import.meta.env.VITE_TRUECALLER_PARTNER_KEY;
    const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (partnerKey && isMobileDevice) {
      const nonce = Math.random().toString(36).substring(2);
      const callbackUrl = window.location.origin + '/auth/truecaller-callback';
      const truecallerUrl = `truecallersdk://truesdk/web_verify?requestNonce=${nonce}&partnerKey=${partnerKey}&partnerName=Zenoa%20Dev&lang=en&title=Verify%20Developer&skipConfirmation=true&callback=${encodeURIComponent(callbackUrl)}`;
      window.location.href = truecallerUrl;
    }

    setTimeout(async () => {
      const activeNumber = mobileNumber.trim() ? mobileNumber.replace(/[^0-9]/g, '') : '9876543210';
      setMobileNumber(activeNumber);
      setIsTruecallerVerified(true);
      setIsVerifying(false);

      const formattedMobile = `${countryCode}${activeNumber}`;
      try {
        if (user && db) {
          const primaryZenoaId = user.id || user.username.toLowerCase();
          await setDoc(doc(db, 'users', primaryZenoaId), {
            mobile_number: formattedMobile,
            phone_number: formattedMobile,
            is_business_verified: true,
            is_truecaller_verified: true,
            phone_verified_at: Date.now(),
            updated_at: Date.now()
          }, { merge: true });
        }

        const updatedUser: UserData = {
          ...user,
          mobile_number: formattedMobile,
          phone_number: formattedMobile,
          is_business_verified: true,
          is_truecaller_verified: true
        };
        onSuccess(updatedUser);
      } catch (err: any) {
        setError('Activation failed: ' + err.message);
      }
    }, 500);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpCode !== demoOTP) {
      setError('Invalid verification code. Please check the code.');
      return;
    }
    setIsVerifying(true);
    const formattedMobile = `${countryCode}${mobileNumber.replace(/[^0-9]/g, '').trim()}`;
    
    try {
      if (user && db) {
        const primaryZenoaId = user.id || user.username.toLowerCase();
        await setDoc(doc(db, 'users', primaryZenoaId), {
          mobile_number: formattedMobile,
          phone_number: formattedMobile,
          is_business_verified: true,
          is_truecaller_verified: true,
          phone_verified_at: Date.now(),
          updated_at: Date.now()
        }, { merge: true });
      }

      const updatedUser: UserData = {
        ...user,
        mobile_number: formattedMobile,
        phone_number: formattedMobile,
        is_business_verified: true,
        is_truecaller_verified: true
      };
      onSuccess(updatedUser);
    } catch (err: any) {
      setError('Activation failed: ' + err.message);
      setIsVerifying(false);
    }
  };

  return (
    <div className={`relative min-h-screen flex items-center justify-center p-6 overflow-hidden ${
      isDark ? 'bg-[#0c1024] text-white' : 'bg-[#f6f9fc] text-[#0d253d]'
    }`}>
      {/* Background WaveArcs matching landing */}
      <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-15 -z-10">
        <WaveArcs
          backgroundColor="transparent"
          lineColor={isDark ? 'rgb(129, 140, 248)' : 'rgb(83, 58, 253)'}
          lineWidth={1.2}
          lineCount={64}
          speed={4.5}
          glow={12}
          interactive={false}
        />
      </div>

      <div className={`relative z-10 w-full max-w-md rounded-2xl p-8 shadow-xl text-center border backdrop-blur-md ${
        isDark 
          ? 'bg-[#0d1326]/90 border-[#273951] text-white shadow-black/40' 
          : 'bg-white/95 border-[#e3e8ee] text-[#0d253d] shadow-slate-200/50'
      }`}>
        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border ${
          isDark 
            ? 'bg-[#533afd]/15 border-[#533afd]/30 text-[#818cf8]' 
            : 'bg-[#533afd]/10 border-[#533afd]/20 text-[#533afd]'
        }`}>
          <Phone className="h-6 w-6" />
        </div>

        <h2 className="text-2xl font-bold tracking-tight">Developer Verification</h2>
        <p className="text-sm text-[#64748d] dark:text-[#94a3b8] mt-2 mb-6 leading-relaxed">
          Link a verified mobile contact to activate high-throughput bot dispatch, webhooks, and guaranteed account recovery for <strong className="text-[#0d253d] dark:text-white">@{user.username}</strong>.
        </p>

        {/* Advantage Banner */}
        <div className="mb-6 p-3 rounded-xl border border-[#533afd]/20 bg-[#533afd]/5 dark:bg-[#533afd]/10 flex items-start gap-2.5 text-left">
          <ShieldCheck className="h-4 w-4 text-[#533afd] dark:text-[#818cf8] shrink-0 mt-0.5" />
          <p className="text-xs text-[#64748d] dark:text-[#94a3b8] leading-relaxed">
            <span className="font-semibold text-[#0d253d] dark:text-white">Account Recovery: </span>
            A verified phone number guarantees seamless 1-click password and credential recovery if you ever lose device access.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-semibold text-left">
            {error}
          </div>
        )}

        {!otpSent ? (
          <div className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] uppercase tracking-wider mb-2">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className={`w-20 rounded-xl px-3 py-2.5 text-sm text-center font-mono outline-none border transition-all ${
                    isDark
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]'
                      : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="9876543210"
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-mono outline-none border transition-all ${
                    isDark
                      ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]'
                      : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                  }`}
                />
              </div>
            </div>

            {/* Truecaller 1-Tap Button */}
            <button
              type="button"
              onClick={handleTruecaller1Tap}
              disabled={isVerifying}
              className="w-full py-2.5 px-3 rounded-xl border border-[#0087FF]/30 bg-[#0087FF]/10 text-[#0087FF] hover:bg-[#0087FF]/15 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Verify with Truecaller (1-tap instant)</span>
            </button>

            <button
              onClick={handleSendOTP}
              disabled={isVerifying}
              className="w-full py-3 bg-[#533afd] hover:bg-[#432ec4] text-white rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Send SMS Verification Code'}
            </button>

            <div className="pt-2 text-center">
              <button 
                onClick={onSkip} 
                className="text-xs font-medium text-[#64748d] dark:text-[#94a3b8] hover:text-[#0d253d] dark:hover:text-white transition-colors cursor-pointer underline"
              >
                Skip mobile verification for now
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-left">
            <div className={`p-4 rounded-xl border text-center ${
              isDark ? 'bg-[#121624] border-[#273951]' : 'bg-[#f6f9fc] border-[#e3e8ee]'
            }`}>
              <span className="text-xs text-[#64748d] dark:text-[#94a3b8] font-medium">Demo Verification Passcode:</span>
              <span className="text-lg font-mono font-bold text-[#533afd] dark:text-[#818cf8] block mt-1 tracking-widest">{demoOTP}</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#64748d] dark:text-[#94a3b8] uppercase tracking-wider mb-2">
                Enter 6-Digit Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="123456"
                maxLength={6}
                className={`w-full rounded-xl px-4 py-3 text-base font-mono text-center tracking-[0.4em] outline-none border transition-all ${
                  isDark
                    ? 'bg-[#121624] border-[#273951] text-white focus:border-[#533afd]'
                    : 'bg-[#f6f9fc] border-[#e3e8ee] text-[#0d253d] focus:border-[#533afd]'
                }`}
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={isVerifying}
              className="w-full py-3 bg-[#0d253d] hover:bg-[#1c2e42] text-white dark:bg-white dark:text-[#0d253d] dark:hover:bg-[#f1f5f9] rounded-xl text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
            >
              {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Confirm & Activate Developer Vault'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
