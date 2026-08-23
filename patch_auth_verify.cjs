const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Patch Register
const oldRegisterPart = `
        try {
          await sendEmailVerification(userObj);
          setSuccessMessage('Account created! A verification link has been sent to your email.');
        } catch (verifErr) {
          console.warn("Failed to send verification email:", verifErr);
        }

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
        setAuthMethod('email');
        const resolvedUsername = emailInput.split('@')[0].replace(/[^a-z0-9_]/g, '');
        setUsernameInput(resolvedUsername);
        setOnboardingStep(1);
        showToast('Account registered! Let\\'s complete your profile onboarding.');
`;

const newRegisterPart = `
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
`;

if (code.includes(oldRegisterPart)) {
    code = code.replace(oldRegisterPart, newRegisterPart);
    console.log("Patched Register!");
} else {
    console.log("Did not find Register part.");
}

// Patch Login
const oldLoginPart = `
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        // Retrieve profile from Firestore
`;

const newLoginPart = `
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        if (!userObj.emailVerified) {
          await firebaseSignOut(auth);
          setErrorMessage('Please verify your email address before logging in.');
          setIsLoading(false);
          return;
        }
        
        // Retrieve profile from Firestore
`;

if (code.includes(oldLoginPart)) {
    code = code.replace(oldLoginPart, newLoginPart);
    console.log("Patched Login!");
} else {
    console.log("Did not find Login part.");
}

// Patch onAuthStateChanged
const oldAuthState = `
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email || user.phoneNumber || '');
        // Determine method based on providers
`;
const newAuthState = `
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // If password provider, enforce email verification
        if (user.providerData.some(p => p.providerId === 'password') && !user.emailVerified) {
          return; // Ignore this state change, they are being signed out
        }
        setUserId(user.uid);
        setUserEmail(user.email || user.phoneNumber || '');
        // Determine method based on providers
`;

if (code.includes(oldAuthState)) {
    code = code.replace(oldAuthState, newAuthState);
    console.log("Patched onAuthStateChanged!");
} else {
    console.log("Did not find onAuthStateChanged part.");
}


fs.writeFileSync('src/App.tsx', code);
