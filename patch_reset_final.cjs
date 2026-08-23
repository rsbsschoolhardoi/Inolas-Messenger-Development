const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldReset = `  const handleResetPassword = async () => {
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
  };`;

const newReset = `  const handleResetPassword = async () => {
    setErrorMessage('');
    setSuccessMessage('');
    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter your email address first to reset password');
      return;
    }
    if (isFirebaseConfigured && auth) {
      setIsLoading(true);
      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: false
        };
        await sendPasswordResetEmail(auth, emailInput, actionCodeSettings);
        setSuccessMessage('Password reset link has been sent to your email.');
      } catch (err: any) {
        console.error('Password reset error:', err);
        setErrorMessage(err.message || 'Failed to send reset email');
      } finally {
        setIsLoading(false);
      }
    }
  };`;

if (code.includes(oldReset)) {
    code = code.replace(oldReset, newReset);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched Reset!");
} else {
    console.log("Did not find Reset!");
}
