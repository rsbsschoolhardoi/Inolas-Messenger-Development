const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const anchor = `  const handleRegister = async (e: React.FormEvent) => {`;
const nextAnchor = `  const handleOAuthLogin = async (provider: 'google' | 'github') => {`;

const startIndex = code.indexOf(anchor);
const endIndex = code.indexOf(nextAnchor);

if (startIndex !== -1 && endIndex !== -1) {
  const oldFunc = code.substring(startIndex, endIndex);
  
  const newFunc = `  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!emailInput || !emailInput.includes('@')) {
      setErrorMessage('Please enter a valid email address');
      return;
    }
    if (passwordInput.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    if (passwordInput !== confirmPasswordInput) {
      setErrorMessage('Passwords do not match');
      return;
    }

    setIsLoading(true);

    if (isFirebaseConfigured && db && auth) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        try {
          const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: true
          };
          await sendEmailVerification(userObj, actionCodeSettings);
          await firebaseSignOut(auth);
          setSuccessMessage('Account created! A verification link has been sent to your email. Please verify before logging in.');
          setAuthMode('login');
          setPasswordInput('');
          setConfirmPasswordInput('');
        } catch (verifErr: any) {
          console.warn("Failed to send verification email:", verifErr);
          await firebaseSignOut(auth);
          setErrorMessage('Account created but failed to send verification email. Please try resetting your password.');
          setAuthMode('login');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local sandbox registration simulation
      setTimeout(() => {
        setIsLoading(false);
        const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
        setUserId('u_' + Math.random().toString(36).substring(2, 9));
        setUserEmail(emailInput);
        setAuthMethod('email');
        setUsernameInput(resolvedUsername);
        setOnboardingStep(1);
        showToast('Account registered! Let\\'s complete your profile onboarding.');
      }, 1000);
    }
  };

`;

  code = code.replace(oldFunc, newFunc);
  fs.writeFileSync('src/App.tsx', code);
  console.log('Patched handleRegister');
} else {
  console.log('Could not find bounds');
}
