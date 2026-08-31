const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

content = content.replace(
  /if \(cleanId\.startsWith\('sa_'\) && cleanId !== 'sa_zenoa'\) \{/g,
  "if (cleanId.startsWith('sa_')) {"
);

content = content.replace(
  /if \(matchedUser\.username !== 'sa_zenoa'\) \{\n\s*return \{ success: false, error: 'Service Accounts cannot be logged in directly\. They are designated strictly for automated API dispatches and OTP services\.' \};\n\s*\}/g,
  "return { success: false, error: 'Service Accounts cannot be logged in directly. They are designated strictly for automated API dispatches and OTP services.' };"
);

fs.writeFileSync('src/App.tsx', content);
