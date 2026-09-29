# Zenoa Business Platform — Architectural Blueprint & Ecosystem Specification
> **Version 1.0.0 | Release: Enterprise B2B/B2C Communication Infrastructure**

---

## 1. Executive Summary & Vision

**Zenoa Business** is a dedicated enterprise and merchant communication platform decoupled from the consumer **Zenoa Messenger** app while sharing the same unified cryptographic identity, real-time message relay, and presence infrastructure.

### The Problem It Solves:
1. **App Clutter & Fatigue**: Normal users use Zenoa Messenger for family and personal peers. Mixing bot webhook telemetry, customer disputes, OTP alerts, and transactional messages into personal chats creates confusion.
2. **Expensive SaaS Monopoly**: Incumbents like Intercom ($39-$99/seat/month) and Zendesk are unaffordable for small D2C brands and Shopify merchants.
3. **AI Chatbot Frustration**: 90% of automated bots alienate angry post-purchase customers with tone-deaf automated templates.

### The Solution:
A standalone **Zenoa Business** command center powered by a 2-line embeddable Live Chat SDK with **Intent-Based Smart Triage** (Pre-purchase AI automation vs. Post-purchase Instant Human VIP Escalation).

---

## 2. Platform Decoupling & Ecosystem Topology

```
                          ┌──────────────────────────┐
                          │   Zenoa Identity Cloud   │
                          │ (Accounts, OAuth & OIDC) │
                          └────────────┬─────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                │                                             │
      ┌─────────▼────────┐                          ┌─────────▼────────┐
      │  Zenoa Messenger │                          │  Zenoa Business  │
      │  (Consumer App)  │                          │ (Enterprise App) │
      ├──────────────────┤                          ├──────────────────┤
      │ • Personal DMs   │                          │ • Live Chat SDK  │
      │ • Peer Calls     │                          │ • Customer Ribbon│
      │ • Private Vault  │                          │ • 2-Track Triage │
      │ • Social Stories │                          │ • Multi-Agent    │
      │ • Group Chats    │                          │ • Business Hours │
      └──────────────────┘                          └──────────────────┘
                ▲                                             ▲
                │                                             │
                └───────────────┬─────────────────────────────┘
                                │
                 ┌──────────────┴──────────────┐
                 │   Zenoa Developer Console   │
                 │  (Provisioning & Webhooks)  │
                 └─────────────────────────────┘
```

---

## 3. The 3 Service Account Archetypes (Developer Console)

When a developer or merchant creates an application in the Developer Console (`/developer`), they choose between three distinct operating archetypes:

### Archetype 1: `personal_dev` (Personal & System Alerts)
- **Target**: Solo developers, DevOps engineers, homelabs.
- **Delivery Destination**: Standard Zenoa Messenger (`@username`).
- **Use Cases**: 2FA OTP codes, GitHub deployment status, server anomaly alerts, personal bot scripts.

### Archetype 2: `business_enterprise` (Zenoa Business & Live Chat)
- **Target**: E-commerce stores, Shopify/WooCommerce sellers, D2C brands, SaaS platforms.
- **Delivery Destination**: Dedicated Zenoa Business Console (`/business` or `business.zenoa.in`).
- **Features**:
  - Embedded Live Chat Web/Mobile SDK (`live-chat.js`).
  - Pre-purchase vs. Post-purchase smart routing.
  - Customer Telemetry Context Ribbon (Order ID, Cart Value, Live Page).
  - Multi-agent assignment (`@agent1`, `@agent2`).
  - AI Co-Pilot toggle & human takeover.

### Archetype 3: `hybrid_gateway` (Unified Freelancer Mode)
- **Target**: Solo founders, independent consultants, boutique agency owners.
- **Delivery Destination**: Both personal Messenger and Business Inbox with clean 1-click workspace switching under a single verified handle.

---

## 4. Intent-Based Smart Triage (2-Track Routing Engine)

```
                       [ Customer Enters Chat Widget ]
                                      │
                         ┌────────────┴────────────┐
                         │ Intent Classifier / Triage
                         └────────────┬────────────┘
                                      │
          ┌───────────────────────────┴───────────────────────────┐
          ▼                                                       ▼
[ Track 1: Pre-Purchase / Discovery ]           [ Track 2: Post-Purchase / Grievance ]
• Inquiring on size, fabric, specs              • Delivery delayed / lost shipment
• Pricing, shipping times, FAQ                  • Wrong or damaged item received
• Return policy, coupon codes                   • Refund / payment disputes
          │                                                       │
          ▼                                                       ▼
[ 100% Autonomous AI Co-Pilot ]                 [ AI BYPASS ➔ Immediate VIP Human Alert ]
• Sub-second response                           • Live audio alert to Zenoa Business
• Trained on business knowledge base            • Customer context ribbon displayed
• Preserves merchant time                       • Human voice note / text resolution
```

---

## 5. Live Customer Context Ribbon (Telemetry Architecture)

Every live chat session created by the widget automatically packages client metadata without demanding manual input:

| Telemetry Property | Description | Example Value |
|---|---|---|
| `customer_name` | Verified account name or guest name | `"Aman Sharma"` |
| `customer_email` | Customer email address | `"aman@example.com"` |
| `customer_phone` | Contact phone number | `"+91-9876543210"` |
| `current_page_url` | Live URL where customer opened widget | `"https://store.in/products/sneaker-v2"` |
| `page_title` | Active browser document title | `"Air Jordan 9 - Midnight Navy"` |
| `cart_value` | Current active shopping cart total | `"₹4,999.00"` |
| `cart_items` | Array of items currently in cart | `[{"name":"Shoe","qty":1,"price":4999}]` |
| `order_id` | Existing order number (if post-purchase) | `"#ORD-88291"` |
| `order_status` | Current shipment/delivery stage | `"Out for delivery (Delayed)"` |
| `device_type` | Browser, OS & Screen form-factor | `"Chrome 128 / iOS Mobile"` |
| `location` | City & Country via IP Geo | `"Delhi, India"` |

---

## 6. Lightweight Embeddable Script Integration

Merchants embed a single tiny (<15KB) script tag into any website (Shopify, WordPress, Webflow, Custom HTML, Next.js):

```html
<!-- Zenoa Live Chat SDK -->
<script 
  src="https://zenoa.in/widget/live-chat.js" 
  data-app-id="app_biz_live_89f3a1b4" 
  data-primary-color="#533afd" 
  data-position="bottom-right"
  async>
</script>
```

---

## 7. Database Collections & Schema Architecture

### Collection: `business_apps`
```typescript
interface BusinessApp {
  id: string; // "biz_app_99f3a1"
  client_id: string;
  app_name: string;
  category: 'ecommerce' | 'saas' | 'hospitality' | 'services' | 'general';
  archetype: 'personal_dev' | 'business_enterprise' | 'hybrid_gateway';
  owner_username: string;
  assigned_agents: string[]; // ["@support_lead", "@store_owner"]
  ai_enabled: boolean;
  ai_model: string; // "gemini-1.5-flash"
  ai_system_prompt: string;
  pre_purchase_auto_respond: boolean;
  post_purchase_instant_escalate: boolean;
  business_hours: {
    enabled: boolean;
    timezone: string;
    start_time: string;
    end_time: string;
    away_message: string;
  };
  widget_theme: {
    primary_color: string;
    greeting_title: string;
    greeting_subtitle: string;
    position: 'bottom-right' | 'bottom-left';
  };
  quick_replies: Array<{ shortcut: string; title: string; content: string }>;
  created_at: number;
  updated_at: number;
}
```

### Collection: `business_conversations`
```typescript
interface BusinessConversation {
  id: string; // "conv_sess_89f1"
  app_id: string;
  customer_session_id: string;
  customer: CustomerContext;
  intent: 'pre_purchase' | 'post_purchase_issue' | 'technical' | 'general';
  status: 'open' | 'pending_human' | 'resolved' | 'closed';
  assigned_agent?: string;
  ai_active: boolean;
  messages_count: number;
  last_message: string;
  last_message_time: number;
  unread_for_agent: boolean;
  unread_for_customer: boolean;
}
```

---

## 8. Commercial Tiering & Revenue Matrix

| Plan | Pricing | Conversations | AI Integration | Multi-Agent Seats | Branding |
|---|---|---|---|---|---|
| **Free Forever** | ₹0 / mo ($0) | 200 / month | Manual Live Chat | 1 Agent | "Powered by Zenoa" |
| **Starter / Pro** | ₹499 / mo ($6) | Unlimited | Gemini BYOK + 1,000 Included | 3 Team Seats | Custom Whitelabel |
| **Enterprise** | ₹1,499 / mo ($18)| Unlimited | Full Knowledge Base + PDF | Unlimited Seats | Whitelabel + API/Webhooks |
