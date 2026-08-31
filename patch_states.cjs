const fs = require('fs');
let code = fs.readFileSync('src/components/DeveloperPortal.tsx', 'utf8');

code = code.replace(
  "  const [allowedIps, setAllowedIps] = useState('');",
  "  const [allowedIps, setAllowedIps] = useState('');\n  const [editBotUsername, setEditBotUsername] = useState('');\n  const [editAppName, setEditAppName] = useState('');"
);

code = code.replace(
  "      setAllowedIps(selectedApp.allowed_ips || '');",
  "      setAllowedIps(selectedApp.allowed_ips || '');\n      setEditBotUsername(selectedApp.bot_username || '');\n      setEditAppName(selectedApp.app_name || '');"
);

fs.writeFileSync('src/components/DeveloperPortal.tsx', code);
