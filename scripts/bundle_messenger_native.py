import os
import shutil
import zipfile
import json

WORKSPACE = os.getcwd()
TARGET_DIR = os.path.join(WORKSPACE, "tmp_zenoa_messenger_standalone")
ZIP_OUTPUT_ROOT = os.path.join(WORKSPACE, "zenoa-messenger-native-source.zip")
ZIP_OUTPUT_PUBLIC = os.path.join(WORKSPACE, "public", "zenoa-messenger-native-source.zip")

if os.path.exists(TARGET_DIR):
    shutil.rmtree(TARGET_DIR)

os.makedirs(f"{TARGET_DIR}/src/components/common", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/components/originkit/ui", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/lib", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/utils", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/services", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/types", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/src/themes", exist_ok=True)
os.makedirs(f"{TARGET_DIR}/public", exist_ok=True)

# 1. Copy Core Utility Files
core_src_files = [
    "types.ts", "data.ts", "chatUtils.ts", "cryptoUtils.ts", "dateUtils.ts",
    "presenceUtils.ts", "audioUtils.ts", "mediaCompressor.ts", "cloudStorage.ts",
    "storageManager.ts", "chatThemes.ts", "firebaseClient.ts", "brandingUtils.ts",
    "seoUtils.ts", "version.ts", "vite-env.d.ts", "index.css", "main.tsx"
]

for f in core_src_files:
    src_p = os.path.join(WORKSPACE, "src", f)
    if os.path.exists(src_p):
        shutil.copy2(src_p, os.path.join(TARGET_DIR, "src", f))

# 2. Copy Messenger UI Components
messenger_components = [
    "MessageCard.tsx", "AppleComposerInput.tsx", "AppleEmoji.tsx", "AppleEmojiText.tsx",
    "AsyncButton.tsx", "CallModal.tsx", "ChangePasswordModal.tsx", "ChatThemeModal.tsx",
    "ConcurrentLogoutModal.tsx", "DeleteCloudBackupModal.tsx", "DetailedProfilePage.tsx",
    "FollowListModal.tsx", "FullScreenProfilePanel.tsx", "GoogleDriveConnectConsentModal.tsx",
    "GoogleDriveLogo.tsx", "GroupDetailsModal.tsx", "ImageCropperModal.tsx",
    "InbuiltMediaPicker.tsx", "InlineVideoPlayer.tsx", "LandingPage.tsx", "LinkDeviceModal.tsx",
    "MediaEditorModal.tsx", "MediaPreviewLightbox.tsx", "NewGroupModal.tsx",
    "NotificationsModal.tsx", "OpeningAnimation.tsx", "ProfileOptionsModal.tsx",
    "PublicProfileView.tsx", "PurpleVerifiedBadge.tsx", "RunningMarqueeText.tsx",
    "SavedAccountsView.tsx", "ServiceAccountModal.tsx", "SettingsPage.tsx",
    "SmartTextMessage.tsx", "UnifiedEmojiPicker.tsx", "VaultPasswordModal.tsx",
    "VoiceNotePlayer.tsx", "WebLinkingPage.tsx", "AccountSaveAndLogoutModals.tsx",
    "AuthFlow.tsx", "AccountSetup.tsx", "AdminPanel.tsx", "LegalModal.tsx"
]

for f in messenger_components:
    src_p = os.path.join(WORKSPACE, "src", "components", f)
    if os.path.exists(src_p):
        shutil.copy2(src_p, os.path.join(TARGET_DIR, "src", "components", f))

# Copy common components
common_src = os.path.join(WORKSPACE, "src", "components", "common")
if os.path.exists(common_src):
    for f in os.listdir(common_src):
        shutil.copy2(os.path.join(common_src, f), os.path.join(TARGET_DIR, "src", "components", "common", f))

# Copy originkit components
originkit_src = os.path.join(WORKSPACE, "src", "components", "originkit")
if os.path.exists(originkit_src):
    for root, dirs, files in os.walk(originkit_src):
        for file in files:
            rel = os.path.relpath(os.path.join(root, file), originkit_src)
            dest = os.path.join(TARGET_DIR, "src", "components", "originkit", rel)
            os.makedirs(os.path.dirname(dest), exist_ok=True)
            shutil.copy2(os.path.join(root, file), dest)

# Copy lib
lib_src = os.path.join(WORKSPACE, "src", "lib")
if os.path.exists(lib_src):
    for f in os.listdir(lib_src):
        shutil.copy2(os.path.join(lib_src, f), os.path.join(TARGET_DIR, "src", "lib", f))

# Copy utils
utils_src = os.path.join(WORKSPACE, "src", "utils")
if os.path.exists(utils_src):
    for f in os.listdir(utils_src):
        shutil.copy2(os.path.join(utils_src, f), os.path.join(TARGET_DIR, "src", "utils", f))

# Copy services
services_src = os.path.join(WORKSPACE, "src", "services")
if os.path.exists(services_src):
    for f in os.listdir(services_src):
        shutil.copy2(os.path.join(services_src, f), os.path.join(TARGET_DIR, "src", "services", f))

# Copy themes
themes_src = os.path.join(WORKSPACE, "src", "themes")
if os.path.exists(themes_src):
    for f in os.listdir(themes_src):
        shutil.copy2(os.path.join(themes_src, f), os.path.join(TARGET_DIR, "src", "themes", f))

# Copy Root Configs
root_configs = [
    "firestore.rules", "firebase-blueprint.json", "firebase-applet-config.json",
    "tsconfig.json", "vite.config.ts", "index.html"
]

for f in root_configs:
    src_p = os.path.join(WORKSPACE, f)
    if os.path.exists(src_p):
        shutil.copy2(src_p, os.path.join(TARGET_DIR, f))

# 3. Create Clean Dedicated package.json
pkg_json = {
  "name": "zenoa-messenger-native-source",
  "version": "2.4.0",
  "description": "Zenoa Sovereign Real-Time Messenger - Decoupled Standalone & Native-Ready Source Package",
  "private": True,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "tsc --noEmit",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "canvas-confetti": "^1.9.4",
    "clsx": "^2.1.1",
    "firebase": "^10.14.1",
    "lucide-react": "^1.16.0",
    "motion": "^12.4.7",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-onesignal": "^3.3.0",
    "tailwind-merge": "^3.0.2",
    "tailwindcss": "^4.1.18"
  },
  "devDependencies": {
    "@types/canvas-confetti": "^1.9.0",
    "@types/node": "^22.13.5",
    "@types/react": "^19.0.10",
    "@types/react-dom": "^19.0.4",
    "@vitejs/plugin-react": "^4.3.4",
    "typescript": "~5.7.2",
    "vite": "^6.1.0"
  }
}

with open(os.path.join(TARGET_DIR, "package.json"), "w", encoding="utf-8") as f:
    json.dump(pkg_json, f, indent=2)

# 4. Copy App.tsx
shutil.copy2(os.path.join(WORKSPACE, "src", "App.tsx"), os.path.join(TARGET_DIR, "src", "App.tsx"))

# 5. Create Architectural & Native Porting Blueprint README.md
readme_content = """# Zenoa Sovereign Messenger — Native & Standalone Source Package
> Version 2.4.0 | Decoupled Real-Time Messaging, WebRTC Calling, Vault & Presence Engine

This package contains the complete, battle-tested source code of **Zenoa Messenger**, isolated and decoupled for native application development (React Native / Expo, Flutter, Android Jetpack Compose, iOS SwiftUI) or standalone web deployment.

---

## 📁 Package Architecture & Directory Structure

```
├── src/
│   ├── components/                 # Messenger UI Primitives & Modals
│   │   ├── MessageCard.tsx         # Universal message bubble (Text, Audio, Video, Poll, File, Location)
│   │   ├── AppleComposerInput.tsx  # iOS-style native composer with live formatting
│   │   ├── AppleEmoji.tsx          # High-performance Apple emoji rendering system
│   │   ├── VoiceNotePlayer.tsx     # Interactive audio waveform voice note player
│   │   ├── InlineVideoPlayer.tsx   # Hardware-accelerated inline video viewer
│   │   ├── MediaEditorModal.tsx    # In-app media cropper, caption editor & compression
│   │   ├── CallModal.tsx           # Real-time WebRTC Audio & Video Calling interface
│   │   ├── NewGroupModal.tsx       # Group chat creation with roles and avatars
│   │   ├── GroupDetailsModal.tsx   # Participant management, group admins & pinned media
│   │   ├── SettingsPage.tsx        # Security, Vault PIN, E2EE keys, Privacy controls
│   │   ├── ChatThemeModal.tsx      # Dynamic wallpaper & bubble styling engine
│   │   ├── DetailedProfilePage.tsx # User badges, following/followers, presence
│   │   └── AuthFlow.tsx            # Login, Signup, OTP Verification & Session Recovery
│   ├── utils/                      # Core Business Logic & Cryptography
│   │   ├── chatUtils.ts            # Normalized DM ID generation, ghost filters, participant hashing
│   │   ├── cryptoUtils.ts          # AES-256-GCM Envelope Encryption & Local Vault security
│   │   ├── dateUtils.ts            # Telegram/WhatsApp-grade timestamp dividers & relative times
│   │   ├── presenceUtils.ts        # Live online indicator, typing state & follower relations
│   │   ├── audioUtils.ts           # WebAudio API base64 audio recording & synthetic waveforms
│   │   ├── storageManager.ts       # IndexedDB & LocalStorage offline cache synchronization
│   │   └── appleEmojiCache.ts      # Zero-layout-shift emoji caching engine
│   ├── types.ts                    # Strict TypeScript Interfaces for all entities
│   ├── data.ts                     # Seed mocks and fallback datasets
│   ├── firebaseClient.ts           # Firestore & Auth SDK connection hub
│   ├── index.css                   # Tailwind CSS styling with dark/light theme tokens
│   └── App.tsx                     # Top-level Messenger orchestrator
├── firestore.rules                 # Enterprise Firestore RBAC & Encryption Security Rules
├── firebase-blueprint.json         # Database Schema, Indexes & Document Specifications
├── package.json                    # Isolated dependencies
└── vite.config.ts                  # Vite build bundler configuration
```

---

## 🚀 Quickstart: Running as Standalone Web App

1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Local Development Server**:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` to interact with the standalone messenger.

---

## 📱 Porting to Native Platforms (React Native / Expo)

All business logic (`chatUtils.ts`, `cryptoUtils.ts`, `dateUtils.ts`, `presenceUtils.ts`, `audioUtils.ts`) is written in standard TypeScript and can be reused directly in React Native without modification.

### UI Component Mapping:
| Web Component | React Native / Expo Equivalent |
|---|---|
| `div`, `span`, `p` | `View`, `Text` |
| `motion/react` | `react-native-reanimated` |
| `AppleComposerInput` | `TextInput` + `KeyboardAvoidingView` |
| `lucide-react` | `lucide-react-native` or `@expo/vector-icons` |
| WebRTC `CallModal` | `react-native-webrtc` |
| `audioUtils` | `expo-av` or `react-native-audio-recorder-player` |

---

## 🔒 Security & Cryptography Model

1. **End-to-End Encryption (E2EE)**: Messages and media attachments are encrypted using AES-256-GCM before transport.
2. **Deterministic DM Generation**: Single 1-to-1 chat documents are uniquely identified by `chat_dm_${[userA, userB].sort().join('_')}` preventing duplicate channels.
3. **Database Rules**: `firestore.rules` enforces participant-level authorization, ensuring only chat members can read/write messages.

---

## 📄 License
Proprietary & Confidential - Zenoa Sovereign Communication Systems.
"""

with open(os.path.join(TARGET_DIR, "README.md"), "w", encoding="utf-8") as f:
    f.write(readme_content)

# 6. Create Zip Archive in Root and Public directory
def make_zip(source_dir, output_zip_path):
    with zipfile.ZipFile(output_zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                abs_path = os.path.join(root, file)
                rel_path = os.path.relpath(abs_path, source_dir)
                zipf.write(abs_path, rel_path)

os.makedirs(os.path.join(WORKSPACE, "public"), exist_ok=True)
make_zip(TARGET_DIR, ZIP_OUTPUT_ROOT)
make_zip(TARGET_DIR, ZIP_OUTPUT_PUBLIC)

# Clean up temp folder
shutil.rmtree(TARGET_DIR)

root_size = os.path.getsize(ZIP_OUTPUT_ROOT)
public_size = os.path.getsize(ZIP_OUTPUT_PUBLIC)
print(f"SUCCESS: Created {ZIP_OUTPUT_ROOT} ({root_size:,} bytes)")
print(f"SUCCESS: Created {ZIP_OUTPUT_PUBLIC} ({public_size:,} bytes)")
