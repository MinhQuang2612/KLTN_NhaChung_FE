"use client";

import { useState, useEffect, useRef } from "react";
import { Socket } from "socket.io-client";
import { Conversation, Message, TypingData } from "@/types/Chat";
import { getMessages, markAsRead } from "@/services/chat";
import { getUserIdFromToken } from "@/utils/jwt";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { FaArrowLeft, FaComments } from "react-icons/fa";

interface ChatWindowProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  currentUserId: number;
  socket: Socket | null;
  onSelectConversation: (conversation: Conversation) => void;
  onBack?: () => void;
  loading?: boolean;
}

export default function ChatWindow({
  conversations,
  currentConversation,
  currentUserId,
  socket,
  onSelectConversation,
  onBack,
  loading = false
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages when conversation changes
  useEffect(() => {
    if (!currentConversation) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true);
      try {
        const response = await getMessages(
          currentConversation.conversationId,
          currentUserId,
          1,
          100
        );
        // API returns messages sorted oldest first (ascending by createdAt)
        // Sort by createdAt to ensure correct order: oldest -> newest
        let sortedMessages = [...response.items].sort((a, b) => {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        
        // Nếu conversation có systemMessage từ backend (khi mới tạo), thêm vào messages nếu chưa có
        if (currentConversation.systemMessage) {
          const systemMsgExists = sortedMessages.some(
            (m) => m.messageId === currentConversation.systemMessage?.messageId
          );
          if (!systemMsgExists) {
            sortedMessages = [...sortedMessages, currentConversation.systemMessage].sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });
          }
        }
        
        setMessages(sortedMessages);
        
        // Mark as read
        await markAsRead(currentConversation.conversationId, currentUserId);
      } catch (error) {
        // Silently handle error
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentConversation, currentUserId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !currentConversation) {
      return;
    }

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === currentConversation.conversationId) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((m) => m.messageId === message.messageId);
          if (exists) {
            return prev;
          }
          // Add new message and sort by createdAt to maintain order
          const updated = [...prev, message];
          return updated.sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        });
        // Mark as read automatically
        markAsRead(currentConversation.conversationId, currentUserId).catch(() => {});
      }
    };

    const handleMessageSent = (message: Message) => {
      if (message.conversationId === currentConversation.conversationId) {
        setMessages((prev) => {
          // Check if message already exists (avoid duplicates)
          const exists = prev.some((m) => m.messageId === message.messageId);
          if (exists) {
            return prev;
          }
          // Add new message and sort by createdAt to maintain order
          const updated = [...prev, message];
          return updated.sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        });
      }
    };

    const handleUserTyping = (data: TypingData) => {
      if (
        data.conversationId === currentConversation.conversationId &&
        data.userId !== currentUserId
      ) {
        setIsTyping(data.isTyping);
        
        // Clear existing timeout
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        
        // Auto hide typing indicator after 3 seconds
        if (data.isTyping) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("user_typing", handleUserTyping);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("user_typing", handleUserTyping);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [socket, currentConversation, currentUserId]);

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'video' | 'file' = 'text') => {
    if (!socket || !currentConversation) {
      return;
    }

    if (!socket.connected) {
      alert("Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.");
      return;
    }

    // Lấy userId từ JWT token hoặc dùng currentUserId
    // Backend đã fix: tự động convert cả senderId và userId từ JWT sang number để so sánh
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userIdFromToken = token ? getUserIdFromToken(token) : null;
    const senderId = userIdFromToken || currentUserId;

    // Kiểm tra quyền: user phải là tenant hoặc landlord của conversation
    const tenantIdNum = Number(currentConversation.tenantId);
    const landlordIdNum = Number(currentConversation.landlordId);
    const isAuthorized = tenantIdNum === senderId || landlordIdNum === senderId;
    
    if (!isAuthorized) {
      alert("Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này");
      return;
    }

    // Backend đã fix type mismatch: tự động convert senderId và userId từ JWT sang number
    const messagePayload = {
      conversationId: currentConversation.conversationId,
      senderId: senderId,
      type: type,
      content,
    };

    socket.emit("send_message", messagePayload, (response: any) => {
      if (response && response.error) {
        alert("Lỗi khi gửi tin nhắn: " + response.error);
      }
    });

    // Stop typing indicator
    socket.emit("typing", {
      conversationId: currentConversation.conversationId,
      isTyping: false,
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!socket || !currentConversation) return;

    socket.emit("typing", {
      conversationId: currentConversation.conversationId,
      isTyping,
    });

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Auto stop typing after 3 seconds of inactivity
    if (isTyping) {
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit("typing", {
          conversationId: currentConversation.conversationId,
          isTyping: false,
        });
      }, 3000);
    }
  };

  const getOtherUser = (conversation: Conversation) => {
    if (conversation.tenantId === currentUserId) {
      return {
        name: conversation.landlordName || "Chủ nhà",
        avatar: conversation.landlordAvatar,
      };
    }
    return {
      name: conversation.tenantName || "Người thuê",
      avatar: conversation.tenantAvatar,
    };
  };

  return (
    <div className="flex h-full bg-white">
      {/* Conversation List - Desktop */}
      <div className="hidden md:block w-80 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-teal-50">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FaComments className="w-5 h-5 text-teal-600" />
            Tin nhắn
          </h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ConversationList
            conversations={conversations}
            currentConversationId={currentConversation?.conversationId || null}
            currentUserId={currentUserId}
            onSelectConversation={onSelectConversation}
            loading={loading}
          />
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentConversation ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FaArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}
              <div className="flex items-center gap-3 flex-1">
                {getOtherUser(currentConversation).avatar ? (
                  <img
                    src={getOtherUser(currentConversation).avatar}
                    alt={getOtherUser(currentConversation).name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <FaComments className="w-5 h-5 text-teal-600" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {getOtherUser(currentConversation).name}
                    </h3>
                    {/* Connection status indicator */}
                    {socket && (
                      <div className="flex items-center gap-1">
                        {socket.connected ? (
                          <span className="w-2 h-2 bg-green-500 rounded-full" title="Đã kết nối"></span>
                        ) : (
                          <span className="w-2 h-2 bg-red-500 rounded-full" title="Đã ngắt kết nối"></span>
                        )}
                      </div>
                    )}
                  </div>
                  {isTyping ? (
                    <p className="text-xs text-gray-500">Đang gõ...</p>
                  ) : !socket?.connected && (
                    <p className="text-xs text-orange-500">Đang kết nối...</p>
                  )}
                </div>
              </div>
            </div>

                   {/* Messages */}
                   <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col min-h-0">
                     <MessageList
                       messages={messages}
                       currentUserId={currentUserId}
                       conversation={currentConversation}
                       isLoading={isLoadingMessages}
                       isTyping={isTyping}
                     />
                   </div>

            {/* Input */}
            <ChatInput
              onSendMessage={handleSendMessage}
              disabled={!socket?.connected}
              placeholder="Nhập tin nhắn..."
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center text-gray-500">
              <FaComments className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Chọn cuộc trò chuyện</p>
              <p className="text-sm">Chọn một cuộc trò chuyện từ danh sách để bắt đầu</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

