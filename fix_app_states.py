import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove unused states
content = content.replace("const [showProfileDrawer, setShowProfileDrawer] = useState<boolean>(false);", "")
content = content.replace("const [appVaultModalOpen, setAppVaultModalOpen] = useState<boolean>(false);", "")
content = content.replace("const [appVaultAction, setAppVaultAction] = useState<'backup' | 'restore'>('backup');", "")

# Fix unused VaultPasswordModal import
content = content.replace("import {  SettingsPage } from './components/SettingsPage';\nimport { VaultPasswordModal } from './components/VaultPasswordModal';", "import { SettingsPage } from './components/SettingsPage';")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
