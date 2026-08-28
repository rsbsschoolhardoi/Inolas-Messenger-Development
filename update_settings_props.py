import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update SettingsPage props passing
old_settings_props = """            noiseSuppression={noiseSuppression}
            setNoiseSuppression={setNoiseSuppression}"""

new_settings_props = """            noiseSuppression={noiseSuppression}
            setNoiseSuppression={setNoiseSuppression}
            isAccountPrivate={isAccountPrivate}
            setIsAccountPrivate={handleTogglePrivacy}"""

content = content.replace(old_settings_props, new_settings_props)

# 2. Replace handleToggleFollowUser in profile view
content = content.replace('onClick={() => handleToggleFollowUser(selectedProfileUsername)}', 'onClick={() => handleFollow(selectedUser!)}')

# 3. Replace in other places (active chat header)
# Finding where handleToggleFollowUser is used with activeChat.username
# onClick={() => handleToggleFollowUser(activeChat.username)}
content = content.replace('onClick={() => handleToggleFollowUser(activeChat.username)}', 'onClick={() => handleFollow(users[activeChat.username.toLowerCase()])}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
