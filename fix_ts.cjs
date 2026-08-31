const fs = require('fs');

// Fix DeveloperPortal.tsx
let devCode = fs.readFileSync('src/components/DeveloperPortal.tsx', 'utf8');
devCode = devCode.replace('const updates = {};', 'const updates: any = {};');
fs.writeFileSync('src/components/DeveloperPortal.tsx', devCode);

// Fix SSOConsoleStandalone.tsx
let ssoCode = fs.readFileSync('src/components/SSOConsoleStandalone.tsx', 'utf8');
ssoCode = ssoCode.replace("const { doc } = require('firebase/firestore');", '');
ssoCode = ssoCode.replace("const { doc, setDoc } = require('firebase/firestore');", '');
ssoCode = ssoCode.replace(/import \{.*\} from 'firebase\/firestore';/, (match) => {
  if (!match.includes('doc')) return match.replace('{', '{ doc,');
  return match;
});
fs.writeFileSync('src/components/SSOConsoleStandalone.tsx', ssoCode);

// Fix SSOPortal.tsx
let ssoPortalCode = fs.readFileSync('src/components/SSOPortal.tsx', 'utf8');
ssoPortalCode = ssoPortalCode.replace(/import \{.*\} from 'firebase\/firestore';/, (match) => {
  if (!match.includes('getDoc,')) return match.replace('{', '{ getDoc,');
  return match;
});
fs.writeFileSync('src/components/SSOPortal.tsx', ssoPortalCode);

