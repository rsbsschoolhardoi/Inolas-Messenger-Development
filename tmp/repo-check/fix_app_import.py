with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "import { isUserEffectivelyOnline, getOnlineStatusText } from './presenceUtils';",
    "import { isUserEffectivelyOnline, getOnlineStatusText, isServiceAccount } from './presenceUtils';"
)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
