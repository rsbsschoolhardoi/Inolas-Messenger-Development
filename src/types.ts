export interface UserData {
  id?: string;
  uid?: string;
  created_at?: number;
  zenoa_id?: string;
  email?: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_seed: string;
  avatar_url?: string;
  online: boolean;
  last_seen: string;
  last_seen_timestamp?: number;
  custom_status?: string;
  activity_status?: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
  activity_type?: 'typing' | 'recording_voice' | 'in_call' | 'none';
  name_change_timestamps?: number[];
  username_change_timestamps?: number[];
  previous_usernames?: string[];
  followers?: string[];
  following?: string[];
  is_private?: boolean;
  is_verified?: boolean;
  verified_type?: 'purple' | 'official' | 'system' | null;
  is_service_account?: boolean;
  is_business_account?: boolean;
  is_official?: boolean;
  service_category?: string;
  owner?: string;
  owner_id?: string;
  owner_username?: string;
  linked_user_id?: string;
  login_disabled?: boolean;
  is_banned?: boolean;
  ban_reason?: string;
  ban_timestamp?: number;
  role?: 'user' | 'admin' | 'super_admin' | 'service_account';
  registered_at?: number;
  mobile_number?: string;
  phone_number?: string;
  is_business_verified?: boolean;
  is_truecaller_verified?: boolean;
  dob?: string;
  gender?: string;
  real_name?: string;
  legal_name?: string;
  created_via?: string;
  is_oauth_jit?: boolean;
  profile_completed?: boolean;
  email_verified?: boolean;
}

export interface SavedDeviceAccount {
  userId: string;
  username: string;
  displayName: string;
  avatarSeed: string;
  avatarUrl?: string;
  zenoaId?: string;
  email?: string;
  mobile_number?: string;
  bio?: string;
  sessionToken?: string;
  savedAt: number;
}

export interface ReportItem {
  id: string;
  reportedUserId: string;
  reportedUsername: string;
  reportedDisplayName: string;
  reportedAvatar?: string;
  reporterUserId: string;
  reporterUsername: string;
  reporterDisplayName?: string;
  reason: 'spam' | 'harassment' | 'impersonation' | 'fake_account' | 'inappropriate_content' | 'other';
  details?: string;
  timestamp: number;
  status: 'pending' | 'resolved' | 'dismissed';
  actionTaken?: 'dismissed' | 'warned' | 'verified' | 'banned';
  resolvedBy?: string;
  resolvedAt?: number;
}

export interface AuditLogItem {
  id: string;
  adminEmail?: string;
  adminUsername?: string;
  action: string;
  targetId?: string;
  targetUsername?: string;
  details?: string;
  timestamp: number;
  ip_address?: string;
  actor?: string;
  actor_username?: string;
  actor_uid?: string;
  bot_name?: string;
  bot_username?: string;
  target?: string;
  details_message?: string;
}

export interface ServiceAccountData {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_seed: string;
  avatar_url?: string;
  created_at: number;
  created_by: string;
  service_category: 'System' | 'Security' | 'Support' | 'Announcements' | 'Updates';
  badge_type: 'purple' | 'official' | 'system';
  broadcast_count: number;
  status: 'active' | 'paused';
}

export interface SystemBroadcast {
  id: string;
  sender_username: string;
  sender_display_name: string;
  sender_avatar?: string;
  title: string;
  content: string;
  urgency: 'normal' | 'important' | 'security_alert' | 'maintenance';
  created_at: number;
  created_by: string;
  read_by?: string[];
  target_chat_id?: string;
  photo_url?: string;
}

export interface FollowRequest {
  id: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromUsername: string;
  fromAvatar: string;
  toUsername?: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  type: 'follow_request' | 'follow_accept' | 'new_follower' | 'mention';
  fromId: string;
  fromName: string;
  fromUsername: string;
  fromAvatar: string;
  read: boolean;
  timestamp: number;
}

export interface Reaction {
  emoji: string;
  users: string[]; // e.g. ["me", "emma"]
}

export interface PollOption {
  id: string;
  text: string;
  votes: string[]; // list of usernames who voted
}

export interface PollData {
  question: string;
  options: PollOption[];
  total_votes: number;
}

export interface LocationData {
  title: string;
  address: string;
  lat: number;
  lng: number;
}

export interface ContactData {
  name: string;
  phone: string;
  email?: string;
  username?: string;
}

export interface CallData {
  call_id: string;
  call_type: 'voice' | 'video';
  status: 'answered' | 'missed' | 'unanswered' | 'declined';
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  duration_formatted?: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender: string;
  sender_id?: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker' | 'gif' | 'location' | 'contact' | 'poll' | 'call' | 'system';
  media_url?: string;
  media_quality?: 'hd' | 'standard' | 'data_saver';
  file_name?: string;
  file_size?: string;
  audio_url?: string;
  location_data?: LocationData;
  contact_data?: ContactData;
  poll_data?: PollData;
  call_data?: CallData;
  timestamp: string;
  created_at?: number;
  reply_to?: string;
  reply_preview?: string;
  reply_sender?: string;
  edited?: boolean;
  deleted_for_everyone?: boolean;
  deleted_for_me?: boolean;
  reactions: Reaction[];
  read_by: string[];
  forwarded?: boolean;
  pinned?: boolean;
  starred?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  expires_at?: number;
  action_buttons?: {
    id: string;
    label: string;
    action: 'secure_account' | 'it_was_me' | 'dismiss' | 'custom';
    style?: 'danger' | 'secondary' | 'primary';
    acknowledged?: boolean;
    acknowledged_at?: number;
  }[];
  security_event?: {
    type: 'new_device_login' | 'password_changed' | 'oauth_accessed' | 'unauthorized_attempt';
    device_info?: string;
    ip_address?: string;
    timestamp?: number;
    status?: 'pending' | 'verified_by_user' | 'secured';
    client_name?: string;
    client_url?: string;
  };
}

export interface Chat {
  id: string;
  type: 'dm' | 'group';
  is_group?: boolean;
  isGroup?: boolean;
  name: string;
  display_name?: string;
  username: string;
  avatar_seed: string;
  avatar_url?: string;
  is_service_account?: boolean;
  is_business_account?: boolean;
  is_official?: boolean;
  participants: string[];
  participant_ids?: string[];
  unread: number;
  last_message: string;
  last_time: string;
  updated_at?: number;
  pinned: boolean;
  muted: boolean;
  typing: boolean;
  typing_username?: string;
  typing_updated_at?: number;
  online: boolean;
  last_seen: string;
  custom_status?: string;
  activity_status?: 'online' | 'away' | 'busy' | 'dnd' | 'offline';
  activity_type?: 'typing' | 'recording_voice' | 'in_call' | 'none';
  archived?: boolean;
  wallpaper?: string;
  disappearing_messages?: 'off' | '24h' | '7d' | '90d';
  locked?: boolean;
  cleared_at?: Record<string, number>;
  theme?: string;
  admin?: string;
  group_admins?: string[];
  group_description?: string;
  group_notice?: string;
  edit_info_permission?: 'all' | 'admins';
  send_messages_permission?: 'all' | 'admins';
  last_message_sender?: string;
  last_message_status?: 'sent' | 'delivered' | 'read';
  isLocalPending?: boolean;
}

export interface AuthState {
  is_authenticated: boolean;
  user_id: string;
  user_email: string;
  user_phone: string;
  user_display_name: string;
  user_username: string;
  user_bio: string;
  user_avatar_seed: string;
  auth_method: string;
  auth_mode: 'login' | 'register' | 'phone';
  is_loading: boolean;
  error_message: string;
  success_message: string;
  theme_mode: 'light' | 'dark';
  email_input: string;
  password_input: string;
  confirm_password_input: string;
  phone_input: string;
  otp_input: string;
  otp_sent: boolean;
  onboarding_step: number; // 0: not started, 1: username, 2: profile details, 3: completed
  username_input: string;
  display_name_input: string;
  bio_input: string;
  session_verifying: boolean;
}

export interface CallHistoryRecord {
  id: string;
  call_type: 'voice' | 'video';
  status: 'answered' | 'missed' | 'unanswered' | 'declined' | 'ended' | 'connected' | 'dialing';
  caller: string;
  receiver: string;
  caller_name?: string;
  receiver_name?: string;
  caller_avatar_seed?: string;
  caller_avatar_url?: string;
  receiver_avatar_seed?: string;
  receiver_avatar_url?: string;
  partner_username: string;
  partner_name: string;
  partner_avatar_seed?: string;
  partner_avatar_url?: string;
  is_outgoing: boolean;
  timestamp: string;
  created_at: number;
  duration_seconds?: number;
  duration_formatted?: string;
}

export interface DeviceLinkSession {
  sessionId: string;
  publicKey: string;
  authCode: string; // 7-digit alphanumeric code, e.g. "ZN7-9XK"
  status: 'pending_scan' | 'scanned' | 'code_entered' | 'syncing' | 'authenticated' | 'expired' | 'rejected';
  createdAt: number;
  expiresAt: number;
  deviceInfo?: {
    browser?: string;
    os?: string;
    ip?: string;
    location?: string;
  };
  linkedUser?: {
    uid: string;
    username: string;
    displayName: string;
    zenoaId: string;
    avatarSeed?: string;
    avatarUrl?: string;
    sessionToken: string;
    syncedDataPayload?: string; // Encrypted local storage & chats payload
  };
}

export interface LinkedDeviceItem {
  id: string;
  deviceName: string;
  browser: string;
  os: string;
  linkedAt: number;
  lastActive: number;
  ipAddress?: string;
  isCurrent?: boolean;
}

// ==========================================
// ZENOA BUSINESS PLATFORM INTERFACES
// ==========================================

export type AppArchetype = 'personal_dev' | 'business_enterprise' | 'hybrid_gateway';
export type DeveloperCategoryTier = 'messenger' | 'business' | 'hybrid';
export type BusinessCategory = 'ecommerce' | 'saas' | 'hospitality' | 'services' | 'general';
export type BusinessPlatformTarget = 'web' | 'mobile' | 'hybrid';
export type ConversationIntent = 'pre_purchase' | 'post_purchase_issue' | 'technical' | 'general';
export type ConversationStatus = 'open' | 'pending_human' | 'resolved' | 'closed';
export type ConversationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface CustomerContext {
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  current_page_url?: string;
  page_title?: string;
  cart_value?: string;
  cart_items?: Array<{ name: string; qty: number; price: number }>;
  order_id?: string;
  order_status?: string;
  device_type?: string;
  location?: string;
  ip?: string;
}

export interface BusinessApp {
  id: string;
  client_id: string;
  app_name: string;
  bot_username?: string;
  category: BusinessCategory;
  platform_target: BusinessPlatformTarget;
  archetype: AppArchetype;
  category_tier?: DeveloperCategoryTier;
  owner_username: string;
  owner_id?: string;
  assigned_agents: string[]; // ["@support_lead", "@store_owner"]
  ai_enabled: boolean;
  ai_provider?: 'google' | 'openai' | 'anthropic' | 'groq' | 'custom';
  ai_model: string; // e.g. "gemini-2.5-flash", "gpt-4o", "claude-3-5-sonnet"
  ai_api_key?: string; // Custom developer/merchant API key
  ai_custom_endpoint?: string; // Custom OpenAI-compatible or Ollama endpoint
  ai_system_prompt: string;
  ai_temperature?: number;
  ai_confidence_threshold?: number;
  ai_tone?: 'concise' | 'friendly' | 'technical' | 'formal';
  rate_limiting?: {
    enabled: boolean;
    customer_cooldown_seconds?: number; // min seconds between customer bubble messages (default 3s)
    max_messages_per_minute: number; // max customer messages per minute (default 8)
    burst_cooldown_seconds: number; // temporary lockout on flood (default 20s)
    agent_cooldown_ms: number; // merchant rapid-reply throttle (default 700ms)
    max_agent_messages_per_minute?: number; // max agent messages per minute (default 25)
    ip_abuse_block_minutes: number; // default: 10
    max_input_length?: number; // max chars per customer bubble message (default 500)
    anti_spam_keywords?: string[]; // auto-drop spam phrases
  };
  pre_purchase_auto_respond: boolean;
  post_purchase_instant_escalate: boolean;
  welcome_message?: string;
  fallback_human_message?: string;
  escalation_webhook_url?: string;
  auto_resolve_minutes?: number;
  business_hours?: {
    enabled: boolean;
    timezone: string;
    start_time: string;
    end_time: string;
    away_message: string;
  };
  auto_triage_rules?: Array<{
    id: string;
    name: string;
    condition_type: 'keyword' | 'intent' | 'order_status' | 'cart_value';
    match_value: string;
    action: 'escalate_human' | 'trigger_ai' | 'apply_tag' | 'send_canned';
    action_payload?: string;
    is_active: boolean;
  }>;
  knowledge_faqs?: Array<{
    id: string;
    question: string;
    answer: string;
    category?: string;
  }>;
  widget_theme: {
    primary_color: string;
    greeting_title: string;
    greeting_subtitle: string;
    position: 'bottom-right' | 'bottom-left';
  };
  quick_replies?: Array<{ id: string; shortcut: string; title: string; content: string }>;
  created_at: number;
  updated_at: number;
}

export interface BusinessConversation {
  id: string;
  app_id: string;
  customer_session_id: string;
  customer: CustomerContext;
  intent: ConversationIntent;
  status: ConversationStatus;
  priority: ConversationPriority;
  assigned_agent?: string;
  ai_active: boolean;
  messages_count: number;
  last_message: string;
  last_message_time: number;
  last_sender: 'customer' | 'agent' | 'ai';
  unread_for_agent: boolean;
  unread_for_customer: boolean;
  created_at: number;
  updated_at: number;
}

export interface BusinessMessage {
  id: string;
  conversation_id: string;
  app_id: string;
  sender_type: 'customer' | 'agent' | 'ai' | 'system';
  sender_name: string;
  sender_id?: string;
  text: string;
  created_at: number;
  read: boolean;
  metadata?: any;
}

