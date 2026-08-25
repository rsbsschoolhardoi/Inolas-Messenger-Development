export interface UserData {
  id?: string;
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
  type: 'text' | 'image' | 'video' | 'document' | 'voice' | 'sticker' | 'gif' | 'location' | 'contact' | 'poll' | 'call';
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
  expires_at?: number;
}

export interface Chat {
  id: string;
  type: 'dm' | 'group';
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
  last_message_sender?: string;
  last_message_status?: 'sent' | 'delivered' | 'read';
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
