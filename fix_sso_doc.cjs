const fs = require('fs');
let code = fs.readFileSync('src/components/SSOConsoleStandalone.tsx', 'utf8');

code = code.replace(/await doc; \/\/ To avoid unused imports if any/g, '');
code = code.replace(/const \{ setDoc, doc \} = require\('firebase\/firestore'\);/g, '');

fs.writeFileSync('src/components/SSOConsoleStandalone.tsx', code);
