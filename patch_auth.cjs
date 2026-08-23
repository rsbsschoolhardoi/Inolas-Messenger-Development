const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = '<div className="flex flex-col gap-4 text-center mb-6">';
const endStr = 'Continue with GitHub\n            </button>';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr) + endStr.length;

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = `
            <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-xl mb-6">
              <button onClick={() => { setAuthMode('login'); setErrorMessage(''); setSuccessMessage(''); }} className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors \${authMode === 'login' ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}\`}>
                Sign In
              </button>
              <button onClick={() => { setAuthMode('register'); setErrorMessage(''); setSuccessMessage(''); }} className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors \${authMode === 'register' ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}\`}>
                Sign Up
              </button>
              <button onClick={() => { setAuthMode('phone'); setErrorMessage(''); setSuccessMessage(''); }} className={\`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors \${authMode === 'phone' ? 'bg-white dark:bg-neutral-700 text-indigo-600 dark:text-white shadow-sm' : 'text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}\`}>
                Phone
              </button>
            </div>

            {errorMessage && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            
            {successMessage && (
              <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {authMode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Email Address</label>
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Password</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Sign In'}
                </button>
              </form>
            )}

            {authMode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Email Address</label>
                  <input 
                    type="email" 
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Password</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="At least 6 characters"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Confirm Password</label>
                  <input 
                    type="password" 
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                    placeholder="Repeat password"
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Account'}
                </button>
              </form>
            )}

            {authMode === 'phone' && (
              <div className="space-y-4">
                {!otpSent ? (
                  <form onSubmit={handleRequestOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Phone Number</label>
                      <input 
                        type="tel" 
                        value={phoneInput}
                        onChange={e => setPhoneInput(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none focus:border-indigo-500"
                        placeholder="e.g. +1 (555) 019-2834"
                      />
                    </div>
                    <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Send Code'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOTP} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wider mb-1 text-neutral-500">Verification Code</label>
                      <input 
                        type="text" 
                        value={otpInput}
                        onChange={e => setOtpInput(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-transparent outline-none text-center tracking-widest font-bold text-lg focus:border-indigo-500"
                        placeholder="000000"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        type="button" 
                        onClick={() => setOtpSent(false)}
                        className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors font-semibold"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={isLoading}
                        className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                      >
                        {isLoading ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Verify Code'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
            
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-neutral-200 dark:border-neutral-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="px-2 bg-white dark:bg-neutral-900 text-neutral-400">Or continue with</span></div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => handleOAuthLogin('google')} className="flex items-center justify-center gap-2 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 font-semibold transition-colors">
                <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#EA4335" d="M12.2 10.2v3.7h6.8c-.3 1.6-1.9 4.7-6.8 4.7-4.2 0-7.7-3.5-7.7-7.8S8 3 12.2 3c2.4 0 4 1 4.9 1.9l2.9-2.9C18.1 1 15.4 0 12.2 0 5.5 0 0 5.4 0 12s5.5 12 12.2 12c7 0 11.7-4.9 11.7-11.9 0-.8-.1-1.4-.2-1.9H12.2z"/></svg>
                Google
              </button>
              <button onClick={() => handleOAuthLogin('github')} className="flex items-center justify-center gap-2 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 font-semibold transition-colors">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                GitHub
              </button>
            </div>`;
  fs.writeFileSync('src/App.tsx', code.substring(0, startIndex) + newContent + code.substring(endIndex));
  console.log('Replaced');
} else {
  console.log('Not found');
}
