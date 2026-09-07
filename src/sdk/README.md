# @zenoa/sdk

> Official TypeScript & JavaScript SDK and Developer CLI for Zenoa Platform.
> Production API: `https://zenoa-inolas.vercel.app`

[![npm version](https://img.shields.io/npm/v/@zenoa/sdk.svg)](https://www.npmjs.com/package/@zenoa/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)

## 📦 Installation

```bash
npm install @zenoa/sdk
```

---

## ⚡ Quickstart

```typescript
import { ZenoaClient } from '@zenoa/sdk';

const zenoa = new ZenoaClient({
  clientId: process.env.ZENOA_CLIENT_ID,
  clientSecret: process.env.ZENOA_CLIENT_SECRET,
  baseUrl: 'https://zenoa-inolas.vercel.app'
});
```

---

## 🔐 1. OAuth 2.0 & SSO Identity

### Generate "Continue with Zenoa" Authorization URL
```typescript
const authUrl = zenoa.auth.getAuthorizationUrl({
  redirectUri: 'https://yourapp.com/auth/callback',
  scopes: ['openid', 'profile', 'email']
});
```

### Server-to-Server Code Exchange
```typescript
// Inside your /auth/callback route
const { access_token } = await zenoa.auth.exchangeCode(code, 'https://yourapp.com/auth/callback');
const user = await zenoa.auth.getUserInfo(access_token);

console.log('Signed in as:', user.username, user.email);
```

---

## 🤖 2. Service Account Bot Messaging

```typescript
// Send verified interactive message
await zenoa.bot.sendMessage({
  to: '@username',
  text: 'Your order #4829 has been dispatched!',
  buttons: [
    { label: 'Track Order', url: 'https://yourapp.com/track' }
  ]
});
```

---

## 📱 3. OTP Passcode Dispatch & Instant Verification

```typescript
// 1. Dispatch 6-Digit OTP
await zenoa.otp.send({
  to: '+919876543210',
  template: 'login_verification'
});

// 2. Verify User Passcode
const result = await zenoa.otp.verify({
  to: '+919876543210',
  code: '849201'
});

if (result.valid) {
  console.log('OTP Verified successfully!');
}
```

---

## 🖥️ 4. Developer CLI Commands (`npx zenoa`)

```bash
# 1. 1-Click Browser Authentication
npx zenoa login

# 2. Check active profile & service account
npx zenoa whoami

# 3. Check Bot SLA and dispatch message
npx zenoa bot status
npx zenoa bot send --to @demo_user --message "Hello from Terminal"

# 4. Dispatch live test OTP
npx zenoa otp test --to +919876543210

# 5. List OAuth 2.0 Client Apps
npx zenoa oauth list
```

---

## 🌐 Endpoints & Hosted URLs

- **Developer Console**: `https://zenoa-inolas.vercel.app/developer`
- **OAuth 2.0 / SSO Portal**: `https://zenoa-inolas.vercel.app/sso`
- **Login**: `https://zenoa-inolas.vercel.app/login`
- **Auth Endpoint**: `https://zenoa-inolas.vercel.app/auth/sso`
- **Token Endpoint**: `https://zenoa-inolas.vercel.app/api/oauth/token`
- **UserInfo Endpoint**: `https://zenoa-inolas.vercel.app/api/oauth/userinfo`
- **Bot Dispatch Endpoint**: `https://zenoa-inolas.vercel.app/api/developer/dispatch`

---

## 📄 License
MIT © 2026 Zenoa Inolas.
