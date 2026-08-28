with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("action={appVaultAction}", "actionType={appVaultAction}")
content = content.replace("onConfirm={(pwd: string) => {", "onSubmit={(pwd: string) => {")

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
