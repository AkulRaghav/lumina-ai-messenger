// Shared TypeScript types between API and other TS-based services

export enum ChatType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
  CHANNEL = 'CHANNEL',
  BROADCAST = 'BROADCAST',
}

export enum MessageState {
  SENT_LOCAL = 'SENT_LOCAL', // Client-only state
  SENT = 'SENT',
  DELIVERED = 'DELIVERED',
  READ = 'READ',
  FAILED = 'FAILED',
}

export enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VOICE = 'VOICE',
  AI_SUMMARY = 'AI_SUMMARY',
  SYSTEM = 'SYSTEM',
}

export enum AuraState {
  AVAILABLE = 'available',
  DEEP_WORK = 'deep_work',
  AWAY = 'away',
  DO_NOT_DISTURB = 'do_not_disturb',
  OFFLINE = 'offline',
}

export enum MemberRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

// API Response Types
export interface UserResponse {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  auraState: AuraState;
}

export interface MessageResponse {
  id: string;
  chatId: string;
  senderId: string | null;
  body: string | null;
  type: MessageType;
  state: MessageState;
  threadId: string | null;
  createdAt: string;
  editedAt: string | null;
}

export interface ChatResponse {
  id: string;
  type: ChatType;
  name: string | null;
  avatarUrl: string | null;
  lastMessage: MessageResponse | null;
  unreadCount: number;
}

// WebSocket Event Types
export interface WSEvent<T = unknown> {
  event: string;
  payload: T;
  timestamp: string;
}

export interface NewMessageEvent {
  id: string;
  chatId: string;
  senderId: string;
  body: string;
  type: MessageType;
  timestamp: string;
}

export interface TypingEvent {
  userId: string;
  chatId: string;
}

export interface PresenceEvent {
  userId: string;
  auraState: AuraState;
}

export interface ReadReceiptEvent {
  userId: string;
  chatId: string;
  messageId: string;
}

// NATS Subject Constants
export const NATS_SUBJECTS = {
  MESSAGE_CREATED: 'lumina.message.created',
  MESSAGE_DELIVERED: 'lumina.message.delivered',
  MESSAGE_READ: 'lumina.message.read',
  AI_PROCESS_MESSAGE: 'ai.process_message',
  WEBSOCKET_BROADCAST: 'websocket.broadcast',
  PRESENCE_UPDATE: 'lumina.presence',
  TYPING_INDICATOR: 'lumina.typing',
} as const;
