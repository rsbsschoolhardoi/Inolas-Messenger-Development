const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  "GoogleAuthProvider, GithubAuthProvider, signInWithPopup",
  "GoogleAuthProvider, GithubAuthProvider, signInWithPopup, sendEmailVerification, sendPasswordResetEmail"
);
fs.writeFileSync('src/App.tsx', code);
