import { UserData, Chat, Message } from './types';

export const SEED_USERS: Record<string, UserData> = {
  emma: {
    id: 'u_seed_emma',
    username: 'emma',
    display_name: 'Emma Watson',
    bio: 'Product Designer & UI Craftsperson ✨ | Creating delightful human experiences.',
    avatar_seed: 'emma',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=80',
    online: true,
    last_seen: 'Online now',
    last_seen_timestamp: Date.now(),
    custom_status: 'Designing new interfaces 🎨',
    activity_status: 'online',
    activity_type: 'none',
    followers: ['liam', 'sophia', 'noah'],
    following: ['liam', 'sophia']
  },
  liam: {
    id: 'u_seed_liam',
    username: 'liam',
    display_name: 'Liam Chen',
    bio: 'Full-stack engineer & WebRTC explorer 🚀 | Open source contributor.',
    avatar_seed: 'liam',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    online: true,
    last_seen: 'Online now',
    last_seen_timestamp: Date.now(),
    custom_status: 'Coding at lightning speed ⚡',
    activity_status: 'online',
    activity_type: 'none',
    followers: ['emma', 'sophia'],
    following: ['emma', 'noah']
  },
  sophia: {
    id: 'u_seed_sophia',
    username: 'sophia',
    display_name: 'Sophia Rodriguez',
    bio: 'Coffee lover ☕ | Photographer & travel enthusiast 📸',
    avatar_seed: 'sophia',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    online: false,
    last_seen: 'Active 15m ago',
    last_seen_timestamp: Date.now() - 15 * 60 * 1000,
    custom_status: 'Exploring city corners 🌇',
    activity_status: 'offline',
    activity_type: 'none',
    followers: ['emma', 'liam', 'lucas'],
    following: ['emma', 'liam']
  },
  noah: {
    id: 'u_seed_noah',
    username: 'noah',
    display_name: 'Noah Patel',
    bio: 'Cybersecurity researcher & E2EE privacy advocate 🔐',
    avatar_seed: 'noah',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&auto=format&fit=crop&q=80',
    online: true,
    last_seen: 'Online now',
    last_seen_timestamp: Date.now(),
    custom_status: 'Auditing cryptography protocols 🛡️',
    activity_status: 'online',
    activity_type: 'none',
    followers: ['emma', 'liam'],
    following: ['emma', 'sophia', 'lucas']
  },
  olivia: {
    id: 'u_seed_olivia',
    username: 'olivia',
    display_name: 'Olivia Taylor',
    bio: 'Sound designer & music producer 🎧 | Studio sessions.',
    avatar_seed: 'olivia',
    avatar_url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&auto=format&fit=crop&q=80',
    online: false,
    last_seen: 'Active 2h ago',
    last_seen_timestamp: Date.now() - 2 * 60 * 60 * 1000,
    custom_status: 'Mixing new tracks 🎵',
    activity_status: 'offline',
    activity_type: 'none',
    followers: ['emma', 'sophia'],
    following: ['emma', 'noah']
  },
  lucas: {
    id: 'u_seed_lucas',
    username: 'lucas',
    display_name: 'Lucas Vance',
    bio: 'Architect & 3D visual artist 🏛️ | Minimalist design.',
    avatar_seed: 'lucas',
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=256&auto=format&fit=crop&q=80',
    online: true,
    last_seen: 'Online now',
    last_seen_timestamp: Date.now(),
    custom_status: 'Rendering 3D architecture 📐',
    activity_status: 'online',
    activity_type: 'none',
    followers: ['sophia', 'noah'],
    following: ['sophia', 'emma']
  }
};

export const SEED_CHATS: Chat[] = [
  {
    id: 'dm_emma',
    type: 'dm',
    name: 'Emma Watson',
    username: 'emma',
    avatar_seed: 'emma',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&auto=format&fit=crop&q=80',
    participants: ['emma'],
    unread: 1,
    last_message: 'The new UI design looks incredible! Let me know when we can video call.',
    last_time: '10:42 AM',
    pinned: true,
    muted: false,
    typing: false,
    online: true,
    last_seen: 'Online now',
    last_message_sender: 'emma',
    last_message_status: 'delivered',
    updated_at: Date.now() - 5 * 60 * 1000
  },
  {
    id: 'dm_liam',
    type: 'dm',
    name: 'Liam Chen',
    username: 'liam',
    avatar_seed: 'liam',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&auto=format&fit=crop&q=80',
    participants: ['liam'],
    unread: 0,
    last_message: 'WebRTC video & voice stream is ready for testing.',
    last_time: 'Yesterday',
    pinned: false,
    muted: false,
    typing: false,
    online: true,
    last_seen: 'Online now',
    last_message_sender: 'liam',
    last_message_status: 'read',
    updated_at: Date.now() - 24 * 60 * 60 * 1000
  },
  {
    id: 'dm_sophia',
    type: 'dm',
    name: 'Sophia Rodriguez',
    username: 'sophia',
    avatar_seed: 'sophia',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&auto=format&fit=crop&q=80',
    participants: ['sophia'],
    unread: 0,
    last_message: 'Shared the photo album from the weekend!',
    last_time: '2 days ago',
    pinned: false,
    muted: false,
    typing: false,
    online: false,
    last_seen: 'Active 15m ago',
    last_message_sender: 'sophia',
    last_message_status: 'read',
    updated_at: Date.now() - 48 * 60 * 60 * 1000
  }
];

export const SEED_MESSAGES: Record<string, Message[]> = {
  dm_emma: [
    {
      id: 'm_seed_1',
      chat_id: 'dm_emma',
      sender: 'emma',
      text: 'Hey! Hope you are having a productive day.',
      type: 'text',
      timestamp: '10:38 AM',
      created_at: Date.now() - 9 * 60 * 1000,
      reactions: [{ emoji: '👋', users: ['me'] }],
      read_by: ['me']
    },
    {
      id: 'm_seed_2',
      chat_id: 'dm_emma',
      sender: 'me',
      text: 'Hey Emma! Yes, just polishing up the messaging and video call experience.',
      type: 'text',
      timestamp: '10:40 AM',
      created_at: Date.now() - 7 * 60 * 1000,
      reactions: [{ emoji: '🔥', users: ['emma'] }],
      read_by: ['emma']
    },
    {
      id: 'm_seed_3',
      chat_id: 'dm_emma',
      sender: 'emma',
      text: 'The new UI design looks incredible! Let me know when we can video call.',
      type: 'text',
      timestamp: '10:42 AM',
      created_at: Date.now() - 5 * 60 * 1000,
      reactions: [],
      read_by: []
    }
  ],
  dm_liam: [
    {
      id: 'm_seed_4',
      chat_id: 'dm_liam',
      sender: 'liam',
      text: 'WebRTC video & voice stream is ready for testing.',
      type: 'text',
      timestamp: 'Yesterday',
      created_at: Date.now() - 24 * 60 * 60 * 1000,
      reactions: [{ emoji: '👍', users: ['me'] }],
      read_by: ['me']
    }
  ],
  dm_sophia: [
    {
      id: 'm_seed_5',
      chat_id: 'dm_sophia',
      sender: 'sophia',
      text: 'Shared the photo album from the weekend!',
      type: 'text',
      timestamp: '2 days ago',
      created_at: Date.now() - 48 * 60 * 60 * 1000,
      reactions: [],
      read_by: ['me']
    }
  ]
};

