import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Target the chat rooms header buttons specifically
# We want to find the div that contains the buttons and replace its contents

pattern = re.compile(r'(<div className="flex items-center gap-1\.5">)\s+<button\s+onClick=\{\(\) => changeTheme.*?<Users className="h-4 w-4" />\s+</button>\s+(</div>)', re.DOTALL)

# Let's try a simpler approach if the regex is too complex.
# We'll just find the specific buttons and delete them.

# 1. Remove Theme Toggle
theme_toggle = re.compile(r'<button\s+onClick=\{\(\) => changeTheme\(themeMode === \'light\' \? \'dark\' : \'light\'\)\}.*?</button>', re.DOTALL)
content = theme_toggle.sub('', content, count=1)

# 2. Remove Settings Menu Toggle
settings_toggle = re.compile(r'<button\s+onClick=\{\(\) => setActiveView\(\'settings\'\)\}.*?<Menu className="h-4 w-4" />\s+</button>', re.DOTALL)
content = settings_toggle.sub('', content, count=1)

# 3. Remove Plus Button
plus_button = re.compile(r'\{/\* Plus trigger to initiate conversation with custom user \*/\}\s+<button onClick=\{\(\) => setActiveView\(\'search\'\)\}.*?<Plus className="h-4 w-4" />\s+</button>', re.DOTALL)
content = plus_button.sub('', content, count=1)

# Clean up empty lines if any
content = content.replace('<div className="flex items-center gap-1.5">\n                    \n                    \n                    ', '<div className="flex items-center gap-1.5">')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
