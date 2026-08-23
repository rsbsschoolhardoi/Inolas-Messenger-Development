const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldAuthState = `
        const unsubscribeAuth = onAuthStateChanged(auth, async (userObj) => {
          if (userObj) {
            setUserId(userObj.uid);
            setUserEmail(userObj.email || '');

            // Fetch user profile from Firestore
`;
const newAuthState = `
        const unsubscribeAuth = onAuthStateChanged(auth, async (userObj) => {
          if (userObj) {
            // Enforce email verification for password accounts
            if (userObj.providerData.some(p => p.providerId === 'password') && !userObj.emailVerified) {
              return; // Wait for sign out
            }
            
            setUserId(userObj.uid);
            setUserEmail(userObj.email || '');

            // Fetch user profile from Firestore
`;

if (code.includes(oldAuthState)) {
    code = code.replace(oldAuthState, newAuthState);
    console.log("Patched onAuthStateChanged!");
} else {
    console.log("Did not find onAuthStateChanged part.");
}
fs.writeFileSync('src/App.tsx', code);
