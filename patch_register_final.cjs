const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRegister = `  const handleRegister = async (e: React.FormEvent) => {
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
          await sendEmailVerification(userObj);
          await firebaseSignOut(auth);
          setSuccessMessage('Account created! A verification link has been sent to your email. Please verify before logging in.');
          setAuthMode('login');
          setPasswordInput('');
          setConfirmPasswordInput('');
          setIsLoading(false);
          return;
        } catch (verifErr) {
          console.warn("Failed to send verification email:", verifErr);
        }

        // Fallback if verification email fails, though usually it shouldn't
        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
        setAuthMethod('email');
        const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
        setUsernameInput(resolvedUsername);
        setOnboardingStep(1);
        showToast('Account registered! Let\\'s complete your profile onboarding.');
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    } else {`;

const newRegister = `  const handleRegister = async (e: React.FormEvent) => {
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
            handleCodeInApp: false
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
          setErrorMessage('Failed to send verification email. Please try resetting your password.');
          setAuthMode('login');
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'An error occurred during registration.');
      } finally {
        setIsLoading(false);
      }
    } else {`;

if (code.includes(oldRegister)) {
    code = code.replace(oldRegister, newRegister);
    fs.writeFileSync('src/App.tsx', code);
    console.log("Patched Register!");
} else {
    console.log("Did not find Register!");
}
