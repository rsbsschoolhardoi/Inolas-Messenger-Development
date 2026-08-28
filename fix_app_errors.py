import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update imports
content = content.replace('UserData, Chat, Message, PollData, CallData, CallHistoryRecord', 'UserData, Chat, Message, PollData, CallData, CallHistoryRecord, FollowRequest, AppNotification')

# 2. Rename Notification to AppNotification globally in App.tsx
content = content.replace('Notification[]', 'AppNotification[]')
content = content.replace('Notification[\'type\']', 'AppNotification[\'type\']')
content = content.replace('Omit<Notification, \'id\'>', 'Omit<AppNotification, \'id\'>')
content = content.replace('as Notification', 'as AppNotification')

# 3. Fix handleToggleFollowUser at 10315
# onClick={() => handleToggleFollowUser(uname)}
# In this context (Search/Discover results), uname is available.
content = content.replace('onClick={() => handleToggleFollowUser(uname)}', 'onClick={() => handleFollow(users[uname.toLowerCase()])}')

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
