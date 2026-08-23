const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRegister = `
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
`;

const newRegister = `
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput, passwordInput);
        const userObj = userCredential.user;
        
        try {
          await sendEmailVerification(userObj);
          setSuccessMessage('Account created! A verification link has been sent to your email.');
        } catch (verifErr) {
          console.warn("Failed to send verification email:", verifErr);
        }

        setUserId(userObj.uid);
        setUserEmail(userObj.email || '');
`;

if (code.includes(oldRegister)) {
  code = code.replace(oldRegister, newRegister);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched handleRegister');
} else {
  console.log('could not find oldRegister');
}
