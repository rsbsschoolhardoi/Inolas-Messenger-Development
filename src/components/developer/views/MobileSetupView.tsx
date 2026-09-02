import React, { useState } from 'react';
import { Phone, RefreshCw } from 'lucide-react';
import { UserData } from '../../../types';
import { db } from '../../../firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

interface MobileSetupViewProps {
  user: UserData;
  onSuccess: (updatedUser: UserData) => void;
  onSkip: () => void;
}

export const MobileSetupView: React.FC<MobileSetupViewProps> = ({ user, onSuccess, onSkip }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [demoOTP, setDemoOTP] = useState('');

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
    
    // Simulate sending OTP
    await new Promise(r => setTimeout(r, 1000));
    setIsVerifying(false);
    setOtpSent(true);
  };

  const handleVerifyOTP = async () => {
    setError('');
    if (otpCode !== demoOTP) {
      setError('Invalid verification code.');
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 border border-indigo-100">
          <Phone className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Developer Identity</h2>
        <p className="text-sm text-slate-500 mt-2 mb-8 leading-relaxed">
          Link a verified contact number to activate bot dispatch and webhooks for <strong>@{user.username}</strong>.
        </p>

        {error && <div className="mb-6 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium">{error}</div>}

        {!otpSent ? (
          <div className="space-y-5 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Mobile Number</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={countryCode}
                  onChange={e => setCountryCode(e.target.value)}
                  className="w-20 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 text-center font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
                <input
                  type="tel"
                  value={mobileNumber}
                  onChange={e => setMobileNumber(e.target.value)}
                  placeholder="9876543210"
                  className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 font-mono focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSendOTP}
              disabled={isVerifying}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Send Verification Code'}
            </button>
            <button onClick={onSkip} className="w-full py-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium">
              Skip for now
            </button>
          </div>
        ) : (
          <div className="space-y-5 text-left">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 text-center">
              <span className="text-xs text-slate-500 font-medium">Demo Verification Code:</span>
              <span className="text-base font-mono font-bold text-indigo-600 block mt-1 tracking-widest">{demoOTP}</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Enter 6-Digit Code</label>
              <input
                type="text"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-base text-slate-900 font-mono text-center tracking-[0.5em] focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={isVerifying}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all flex items-center justify-center gap-2"
            >
              {isVerifying ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify & Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
