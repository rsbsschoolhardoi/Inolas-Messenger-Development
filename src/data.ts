import { UserData, Chat, Message } from './types';

// Clear seed users - application will strictly show real registered users from Firestore or user input
export const SEED_USERS: Record<string, UserData> = {};

// Clear seed chats
export const SEED_CHATS: Chat[] = [];

// Clear seed messages
export const SEED_MESSAGES: Record<string, Message[]> = {};
