import os

with open('src/components/SSOPortal.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Let's remove the playground tab button
btn_target = """          <button
            onClick={() => setActiveTab('playground')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'playground'
                ? 'border-sky-500 text-sky-600 dark:text-sky-400'
                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
            }`}
          >
            <Play className="w-4 h-4" />
            <span>SSO Playground & Simulator</span>
          </button>"""

if btn_target in text:
    text = text.replace(btn_target, '')
    print('Button removed!')
else:
    # Try with different spacing
    text_lines = text.split('\n')
    found_idx = -1
    for i, line in enumerate(text_lines):
        if "setActiveTab('playground')" in line:
            found_idx = i
            break
    if found_idx != -1:
        # Find the <button and /button> tags around it
        start_btn = -1
        for j in range(found_idx, max(0, found_idx - 10), -1):
            if '<button' in text_lines[j]:
                start_btn = j
                break
        end_btn = -1
        for j in range(found_idx, min(len(text_lines), found_idx + 15)):
            if '</button>' in text_lines[j]:
                end_btn = j
                break
        if start_btn != -1 and end_btn != -1:
            del text_lines[start_btn:end_btn+1]
            text = '\n'.join(text_lines)
            print('Button removed via line scanning!')

# Let's locate the entire Tab 3 rendering
text_lines = text.split('\n')
start_tab = -1
end_tab = -1
for i, line in enumerate(text_lines):
    if "TAB 3: INTERACTIVE SSO PLAYGROUND / SIMULATOR" in line:
        # Find preceding boundary
        for j in range(i, max(0, i-5), -1):
            if '/*' in text_lines[j]:
                start_tab = j
                break
    if "TAB 4: INTEGRATION SDKS & CODE SAMPLES" in line:
        for j in range(i, max(0, i-5), -1):
            if '/*' in text_lines[j]:
                end_tab = j
                break
        break

if start_tab != -1 and end_tab != -1:
    del text_lines[start_tab:end_tab]
    text = '\n'.join(text_lines)
    print('Tab 3 block removed successfully!')

with open('src/components/SSOPortal.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('SSOPortal.tsx sanitized!')
