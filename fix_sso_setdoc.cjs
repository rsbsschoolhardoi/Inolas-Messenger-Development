const fs = require('fs');
let ssoCode = fs.readFileSync('src/components/SSOConsoleStandalone.tsx', 'utf8');

ssoCode = ssoCode.replace(/import \{.*\} from 'firebase\/firestore';/, (match) => {
  if (!match.includes('setDoc,')) return match.replace('{', '{ setDoc,');
  return match;
});

fs.writeFileSync('src/components/SSOConsoleStandalone.tsx', ssoCode);
