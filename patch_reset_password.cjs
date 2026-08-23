const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `  const handleLogin = async (e: React.FormEvent) => {`;

const newFunc = `  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter your email address first to reset password');
      return;
    }
    if (isFirebaseConfigured && auth) {
      setIsLoading(true);
      try {
        await sendPasswordResetEmail(auth, emailInput);
        setSuccessMessage('Password reset link has been sent to your email.');
      } catch (err: any) {
        console.error('Password reset error:', err);
        setErrorMessage(err.message || 'Failed to send reset email');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogin = async (e: React.FormEvent) => {`;

code = code.replace(anchor, newFunc);
fs.writeFileSync('src/App.tsx', code);
console.log('Patched reset password logic');
