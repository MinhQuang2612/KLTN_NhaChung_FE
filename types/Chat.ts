// types/Chat.ts

export interface Conversation {
  conversationId: number;
  tenantId: number;
  tenantName?: string;
  tenantAvatar?: string;
  landlordId: number;
  landlordName?: string;
  landlordAvatar?: string;
  postId?: number;
  roomId?: number;
  lastMessageAt?: string;
  lastMessage?: {
    content: string;
    type: string;
  };
  unreadCount?: number;
  unreadCountTenant?: number;
  unreadCountLandlord?: number;
  isActive: boolean;
  isNew?: boolean; // Flag để biết conversation mới được tạo
  systemMessage?: Message | null; // Tin nhắn hệ thống đã được tạo
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  messageId: number;
  conversationId: number;
  senderId: number | null; // null cho system message
  senderName?: string;
  senderAvatar?: string;
  type: 'text' | 'image' | 'video' | 'file' | 'system';
  content: string;
  metadata?: { // Metadata cho system message (thông tin bài đăng)
    postId?: number;
    roomId?: number;
    postTitle?: string;
    postPrice?: number;
    postAddress?: string;
    postImage?: string;
    postUrl?: string;
    roomName?: string;
  };
  isRead: boolean;
  readAt?: string;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConversationPayload {
  tenantId: number;
  landlordId: number;
  postId?: number;
  roomId?: number;
}

export interface SendMessagePayload {
  conversationId: number;
  senderId: number;
  type?: 'text' | 'image' | 'video' | 'file';
  content: string;
}

export interface MessagesResponse {
  items: Message[];
  total: number;
  page: number;
  pageSize: number;
}

export interface TypingData {
  conversationId: number;
  userId: number;
  isTyping: boolean;
}

