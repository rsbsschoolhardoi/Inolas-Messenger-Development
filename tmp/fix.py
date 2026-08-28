import os

file_path = 'src/App.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

target = """        const defaultBc: SystemBroadcast = {
          id: 'bc_welcome_' + now,
          sender_username: 'zenoa_official',
          sender_display_name: 'Zenoa Official',
          title: 'Welcome to Zenoa',
          content: ,
          urgency: 'normal',
          created_at: now,
          created_by: 'system'
        };"""

replacement = """        const defaultBc: SystemBroadcast = {
          id: 'bc_welcome_' + now,
          sender_username: 'zenoa_official',
          sender_display_name: 'Zenoa Official',
          title: 'Welcome to Zenoa',
          content: 'Welcome to Zenoa! 🚀 Your account is active. Connect, chat securely, share media, and customize your experience.',
          urgency: 'normal',
          created_at: now,
          created_by: 'system'
        };"""

if target in text:
    text = text.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Replaced defaultBc content successfully!")
else:
    print("Target not found directly, checking lines...")
