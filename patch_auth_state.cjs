const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldCode = `            if (userObj.providerData.some(p => p.providerId === 'password') && !userObj.emailVerified) {
              return; // Wait for sign out
            }`;
            
const newCode = `            if (!userObj.emailVerified && userObj.providerData.some(p => p.providerId === 'password')) {
              return; // Wait for sign out
            }
            if (!userObj.emailVerified && userObj.providerData.length === 0) {
              return; // Sometimes providerData is empty for new email/pass accounts
            }`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/App.tsx', code);
  console.log('patched auth state');
} else {
  console.log('not found');
}
