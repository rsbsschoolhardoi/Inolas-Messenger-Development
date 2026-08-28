import re

with open('src/App.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add variables
content = content.replace(
    "    let unsubscribeUsers: (() => void) | null = null;\n    let unsubscribeAuth: (() => void) | null = null;",
    "    let unsubscribeUsers: (() => void) | null = null;\n    let unsubscribeAuth: (() => void) | null = null;\n    let unsubscribeNotifications: (() => void) | null = null;\n    let unsubscribeFollowRequests: (() => void) | null = null;"
)

# 2. Assign listeners
content = content.replace(
    "        if (userObj) {\n          onSnapshot(",
    "        if (userObj) {\n          unsubscribeNotifications = onSnapshot("
)
content = content.replace(
    "          onSnapshot(\n            query(collection(db, 'follow_requests')",
    "          unsubscribeFollowRequests = onSnapshot(\n            query(collection(db, 'follow_requests')"
)

# 3. Add to cleanup
content = content.replace(
    "      if (unsubscribeUsers) unsubscribeUsers();\n      if (unsubscribeAuth) unsubscribeAuth();",
    "      if (unsubscribeUsers) unsubscribeUsers();\n      if (unsubscribeAuth) unsubscribeAuth();\n      if (unsubscribeNotifications) unsubscribeNotifications();\n      if (unsubscribeFollowRequests) unsubscribeFollowRequests();"
)

with open('src/App.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
