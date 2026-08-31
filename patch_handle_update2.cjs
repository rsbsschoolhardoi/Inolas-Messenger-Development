const fs = require('fs');
let code = fs.readFileSync('src/components/DeveloperPortal.tsx', 'utf8');

code = code.replace(/const \{ doc, getDoc, setDoc, deleteDoc, updateDoc \} = require\('firebase\/firestore'\);/g, '');
code = code.replace(/const \{ doc, updateDoc, setDoc, deleteDoc \} = require\('firebase\/firestore'\);/g, '');

fs.writeFileSync('src/components/DeveloperPortal.tsx', code);
