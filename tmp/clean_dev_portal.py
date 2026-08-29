import os

with open('src/components/DeveloperPortal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's clean the tabs list in DeveloperPortal
old_tabs_block = """          {[
            { id: 'apps', icon: Server, label: 'Service Account & Keys' },
            { id: 'otp', icon: Lock, label: 'OTP Service Specs' },
            { id: 'webhooks', icon: Webhook, label: 'Webhooks' },
            { id: 'broadcast', icon: Radio, label: 'Broadcasting' },
            { id: 'sso', icon: ShieldCheck, label: 'OAuth 2.0 / SSO' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'docs', icon: FileText, label: 'API Specs' },
            { id: 'settings', icon: Sliders, label: 'Settings' },
          ].map(tab => ("""

new_tabs_block = """          {[
            { id: 'apps', icon: Server, label: 'Service Account & Keys' },
            { id: 'otp', icon: Lock, label: 'OTP Service Specs' },
            { id: 'logs', icon: History, label: 'Activity Logs' },
            { id: 'docs', icon: FileText, label: 'API Specs' },
            { id: 'settings', icon: Sliders, label: 'Settings' },
          ].map(tab => ("""

if old_tabs_block in text:
    text = text.replace(old_tabs_block, new_tabs_block)
    print("Tabs list simplified in DeveloperPortal!")
else:
    # Try line scanners or direct search
    print("Exact old_tabs_block match not found, seeking alternative matches")
    text_lines = text.split('\n')
    idx_start = -1
    for i, line in enumerate(text_lines):
        if "label: 'Service Account & Keys'" in line and "id: 'apps'" in line:
            idx_start = i
            break
    if idx_start != -1:
        # Find the opening {[ and ending ].map
        start_line = -1
        for j in range(idx_start, max(0, idx_start-5), -1):
            if '{[' in text_lines[j]:
                start_line = j
                break
        end_line = -1
        for j in range(idx_start, min(len(text_lines), idx_start+15)):
            if '].map' in text_lines[j]:
                end_line = j
                break
        if start_line != -1 and end_line != -1:
            replacement_lines = [
                "          {[",
                "            { id: 'apps', icon: Server, label: 'Service Account & Keys' },",
                "            { id: 'otp', icon: Lock, label: 'OTP Service Specs' },",
                "            { id: 'logs', icon: History, label: 'Activity Logs' },",
                "            { id: 'docs', icon: FileText, label: 'API Specs' },",
                "            { id: 'settings', icon: Sliders, label: 'Settings' },",
                "          ].map(tab => ("
            ]
            text_lines[start_line:end_line+1] = replacement_lines
            text = '\n'.join(text_lines)
            print("Tabs list simplified via line scanning!")

# Let's remove Webhooks render block
# {activeTab === 'webhooks' && selectedApp && (
text_lines = text.split('\n')
start_idx = -1
for i, line in enumerate(text_lines):
    if "activeTab === 'webhooks'" in line:
        start_idx = i
        break
if start_idx != -1:
    # Find the closing block of this tab. Since it is standard layout:
    # {activeTab === 'webhooks' && selectedApp && ( ... )}
    # Let's find where activeTab === 'broadcast' starts, which is next
    end_idx = -1
    for i, line in enumerate(text_lines[start_idx:], start_idx):
        if "activeTab === 'broadcast'" in line:
            # Go back to find the closing parentheses
            for j in range(i-1, start_idx, -1):
                if ')}' in text_lines[j] or ')' in text_lines[j]:
                    end_idx = j + 1
                    break
            break
    if start_idx != -1 and end_idx != -1:
        del text_lines[start_idx:end_idx]
        text = '\n'.join(text_lines)
        print("Webhooks render block removed!")

# Let's remove Broadcast render block
text_lines = text.split('\n')
start_idx = -1
for i, line in enumerate(text_lines):
    if "activeTab === 'broadcast'" in line:
        start_idx = i
        break
if start_idx != -1:
    end_idx = -1
    for i, line in enumerate(text_lines[start_idx:], start_idx):
        if "activeTab === 'sso'" in line:
            for j in range(i-1, start_idx, -1):
                if ')}' in text_lines[j] or ')' in text_lines[j]:
                    end_idx = j + 1
                    break
            break
    if start_idx != -1 and end_idx != -1:
        del text_lines[start_idx:end_idx]
        text = '\n'.join(text_lines)
        print("Broadcast render block removed!")

# Let's remove SSO render block
text_lines = text.split('\n')
start_idx = -1
for i, line in enumerate(text_lines):
    if "activeTab === 'sso'" in line:
        start_idx = i
        break
if start_idx != -1:
    end_idx = -1
    for i, line in enumerate(text_lines[start_idx:], start_idx):
        if "activeTab === 'analytics'" in line:
            for j in range(i-1, start_idx, -1):
                if ')}' in text_lines[j] or ')' in text_lines[j]:
                    end_idx = j + 1
                    break
            break
    if start_idx != -1 and end_idx != -1:
        del text_lines[start_idx:end_idx]
        text = '\n'.join(text_lines)
        print("SSO render block removed!")

# Let's remove Analytics render block
text_lines = text.split('\n')
start_idx = -1
for i, line in enumerate(text_lines):
    if "activeTab === 'analytics'" in line:
        start_idx = i
        break
if start_idx != -1:
    end_idx = -1
    for i, line in enumerate(text_lines[start_idx:], start_idx):
        if "activeTab === 'logs'" in line:
            for j in range(i-1, start_idx, -1):
                if ')}' in text_lines[j] or ')' in text_lines[j]:
                    end_idx = j + 1
                    break
            break
    if start_idx != -1 and end_idx != -1:
        del text_lines[start_idx:end_idx]
        text = '\n'.join(text_lines)
        print("Analytics render block removed!")

with open('src/components/DeveloperPortal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print("DeveloperPortal.tsx successfully cleaned of testing and unneeded tabs!")
