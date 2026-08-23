const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldRegister = `        try {
          const actionCodeSettings = {
            url: window.location.origin,
            handleCodeInApp: false
          };
          await sendEmailVerification(userObj, actionCodeSettings);`;

const newRegister = `        try {
          await sendEmailVerification(userObj);`;

code = code.replace(oldRegister, newRegister);

const oldReset = `      try {
        const actionCodeSettings = {
          url: window.location.origin,
          handleCodeInApp: false
        };
        await sendPasswordResetEmail(auth, emailInput, actionCodeSettings);`;

const newReset = `      try {
        await sendPasswordResetEmail(auth, emailInput);`;

code = code.replace(oldReset, newReset);

fs.writeFileSync('src/App.tsx', code);
console.log('Removed actionCodeSettings');
