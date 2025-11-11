// services/chat.ts
import { apiGet, apiPost, apiDel } from "@/utils/api";
import { 
  Conversation, 
  Message, 
  CreateConversationPayload, 
  MessagesResponse 
} from "@/types/Chat";

const BASE_URL = 'chat';

/**
 * Tạo hoặc lấy conversation
 */
export async function createOrGetConversation(
  payload: CreateConversationPayload
): Promise<Conversation> {
  return apiPost<Conversation>(`${BASE_URL}/conversations`, payload);
}

/**
 * Lấy danh sách conversations
 */
export async function getConversations(userId: number): Promise<Conversation[]> {
  return apiGet<Conversation[]>(`${BASE_URL}/conversations?userId=${userId}`);
}

/**
 * Lấy thông tin conversation
 */
export async function getConversation(
  conversationId: number, 
  userId: number
): Promise<Conversation> {
  return apiGet<Conversation>(`${BASE_URL}/conversations/${conversationId}?userId=${userId}`);
}

/**
 * Lấy danh sách messages
 */
export async function getMessages(
  conversationId: number,
  userId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<MessagesResponse> {
  return apiGet<MessagesResponse>(
    `${BASE_URL}/conversations/${conversationId}/messages?userId=${userId}&page=${page}&pageSize=${pageSize}`
  );
}

/**
 * Tạo tin nhắn (REST API fallback)
 */
export async function createMessage(
  conversationId: number,
  senderId: number,
  content: string,
  type: 'text' | 'image' | 'file' = 'text'
): Promise<Message> {
  return apiPost<Message>(`${BASE_URL}/messages`, {
    conversationId,
    senderId,
    type,
    content
  });
}

/**
 * Đánh dấu tin nhắn đã đọc
 */
export async function markAsRead(
  conversationId: number,
  userId: number
): Promise<{ success: boolean }> {
  return apiPost<{ success: boolean }>(
    `${BASE_URL}/conversations/${conversationId}/read?userId=${userId}`
  );
}

/**
 * Xóa tin nhắn
 */
export async function deleteMessage(
  messageId: number,
  userId: number
): Promise<{ success: boolean }> {
  return apiDel<{ success: boolean }>(
    `${BASE_URL}/messages/${messageId}?userId=${userId}`
  );
}

