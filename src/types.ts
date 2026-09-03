export interface UserData {
  id?: string;
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
  is_banned?: boolean;
  ban_reason?: string;
  ban_timestamp?: number;
  role?: 'user' | 'admin' | 'super_admin';
  registered_at?: number;
  mobile_number?: string;
  phone_number?: string;
  is_business_verified?: boolean;
  is_truecaller_verified?: boolean;
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
  adminEmail: string;
  adminUsername: string;
  action: 'verify_user' | 'revoke_verification' | 'ban_user' | 'unban_user' | 'create_service_account' | 'send_broadcast' | 'dismiss_report' | 'update_user' | 'delete_group' | 'config_change';
  targetId?: string;
  targetUsername?: string;
  details: string;
  timestamp: number;
  ip_address?: string;
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
  status?: 'sent' | 'delivered' | 'read';
  expires_at?: number;
}

export interface Chat {
  id: string;
  type: 'dm' | 'group';
  is_group?: boolean;
  isGroup?: boolean;
  name: string;
  username: string;
  avatar_seed: string;
  avatar_url?: string;
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
