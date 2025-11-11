"use client";

import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { initSocket, getSocket } from "@/utils/socket";
import { getMessages, markAsRead } from "@/services/chat";
import { Conversation, Message } from "@/types/Chat";
import ConversationList from "./ConversationList";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import { getUserIdFromToken } from "@/utils/jwt";
import { FaTimes, FaComments, FaArrowLeft, FaExpand, FaCompress } from "react-icons/fa";

interface ChatModalProps {
  conversations: Conversation[];
  initialConversation?: Conversation | null;
  onClose: () => void;
  onConversationSelect: (conversation: Conversation) => void;
  onConversationsUpdate?: () => void;
}

export default function ChatModal({
  conversations,
  initialConversation = null,
  onClose,
  onConversationSelect,
  onConversationsUpdate,
}: ChatModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(initialConversation);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [socket, setSocket] = useState<any>(null);
  const [localConversations, setLocalConversations] = useState<Conversation[]>(conversations);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const currentUserId = user ? Number((user as any).userId ?? (user as any).id) : 0;
  
  // Update local conversations when prop changes
  useEffect(() => {
    setLocalConversations(conversations);
  }, [conversations]);
  
  // Merge conversations with initialConversation if it's not in the list
  const allConversations = useMemo(() => {
    if (!initialConversation) return localConversations;
    const exists = localConversations.some(c => c.conversationId === initialConversation.conversationId);
    if (exists) return localConversations;
    // Add initialConversation to the beginning of the list
    return [initialConversation, ...localConversations];
  }, [localConversations, initialConversation]);
  
  // Cập nhật unreadCount của conversation được chọn về 0 ngay lập tức (optimistic update)
  const handleConversationSelect = (conversation: Conversation) => {
    setCurrentConversation(conversation);
    // Optimistic update: set unreadCount về 0 ngay lập tức
    setLocalConversations(prev => prev.map(conv => {
      if (conv.conversationId === conversation.conversationId) {
        // Xác định user là tenant hay landlord
        const isTenant = Number(conv.tenantId) === currentUserId;
        const isLandlord = Number(conv.landlordId) === currentUserId;
        
        return {
          ...conv,
          unreadCount: 0, // Set tổng unreadCount về 0
          unreadCountTenant: isTenant ? 0 : conv.unreadCountTenant,
          unreadCountLandlord: isLandlord ? 0 : conv.unreadCountLandlord,
        };
      }
      return conv;
    }));
  };

  useEffect(() => {
    if (!user) return;

    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      const socketInstance = initSocket(token);
      setSocket(socketInstance);
    }
  }, [user]);

  // Set initial conversation when it changes
  useEffect(() => {
    if (initialConversation) {
      setCurrentConversation(initialConversation);
    }
  }, [initialConversation]);

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
        // Mark as read ngay khi load messages
        await markAsRead(currentConversation.conversationId, currentUserId);
        // Optimistic update: set unreadCount về 0 ngay lập tức
        setLocalConversations(prev => prev.map(conv => {
          if (conv.conversationId === currentConversation.conversationId) {
            // Xác định user là tenant hay landlord
            const isTenant = Number(conv.tenantId) === currentUserId;
            const isLandlord = Number(conv.landlordId) === currentUserId;
            
            return {
              ...conv,
              unreadCount: 0, // Set tổng unreadCount về 0
              unreadCountTenant: isTenant ? 0 : conv.unreadCountTenant,
              unreadCountLandlord: isLandlord ? 0 : conv.unreadCountLandlord,
            };
          }
          return conv;
        }));
        // Cập nhật conversation list từ backend sau khi mark as read (để sync với server)
        if (onConversationsUpdate) {
          // Delay nhỏ để đảm bảo backend đã cập nhật unreadCount
          setTimeout(() => {
            onConversationsUpdate();
          }, 200);
        }
      } catch (error) {
        // Silently handle error
      } finally {
        setIsLoadingMessages(false);
      }
    };

    loadMessages();
  }, [currentConversation, currentUserId, onConversationsUpdate]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !currentConversation) {
      return;
    }

    const handleNewMessage = (message: Message) => {
      if (message.conversationId === currentConversation.conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.messageId === message.messageId);
          if (exists) {
            return prev;
          }
          // Add new message and sort by createdAt to maintain order (oldest -> newest)
          const updated = [...prev, message];
          return updated.sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        });
        markAsRead(currentConversation.conversationId, currentUserId).then(() => {
          // Optimistic update khi có tin nhắn mới
          setLocalConversations(prev => prev.map(conv => {
            if (conv.conversationId === currentConversation.conversationId) {
              // Xác định user là tenant hay landlord
              const isTenant = Number(conv.tenantId) === currentUserId;
              const isLandlord = Number(conv.landlordId) === currentUserId;
              
              return {
                ...conv,
                unreadCount: 0, // Set tổng unreadCount về 0
                unreadCountTenant: isTenant ? 0 : conv.unreadCountTenant,
                unreadCountLandlord: isLandlord ? 0 : conv.unreadCountLandlord,
              };
            }
            return conv;
          }));
          // Sync với server
          if (onConversationsUpdate) {
            setTimeout(() => {
              onConversationsUpdate();
            }, 200);
          }
        }).catch(() => {});
      }
    };

    const handleMessageSent = (message: Message) => {
      if (message.conversationId === currentConversation.conversationId) {
        setMessages((prev) => {
          const exists = prev.some((m) => m.messageId === message.messageId);
          if (exists) {
            return prev;
          }
          // Add new message and sort by createdAt to maintain order (oldest -> newest)
          const updated = [...prev, message];
          return updated.sort((a, b) => {
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          });
        });
      }
    };

    const handleConversationUpdate = () => {
      // Reload conversations when conversation is updated
      if (onConversationsUpdate) {
        // Delay a bit to ensure backend has updated lastMessage
        setTimeout(() => {
          onConversationsUpdate();
        }, 500);
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("message_sent", handleMessageSent);
    socket.on("conversation_updated", handleConversationUpdate);

    return () => {
      socket.off("new_message", handleNewMessage);
      socket.off("message_sent", handleMessageSent);
      socket.off("conversation_updated", handleConversationUpdate);
    };
  }, [socket, currentConversation, currentUserId, onConversationsUpdate]);

  const handleSendMessage = (content: string, type: 'text' | 'image' | 'video' | 'file' = 'text') => {
    if (!socket || !currentConversation) {
      return;
    }

    if (!socket.connected) {
      alert("Không thể gửi tin nhắn. Vui lòng kiểm tra kết nối.");
      return;
    }

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const userIdFromToken = token ? getUserIdFromToken(token) : null;
    const senderId = userIdFromToken || currentUserId;

    const tenantIdNum = Number(currentConversation.tenantId);
    const landlordIdNum = Number(currentConversation.landlordId);
    const isAuthorized = tenantIdNum === senderId || landlordIdNum === senderId;
    
    if (!isAuthorized) {
      alert("Bạn không có quyền gửi tin nhắn trong cuộc trò chuyện này");
      return;
    }

    const messagePayload = {
      conversationId: currentConversation.conversationId,
      senderId: senderId,
      type: type,
      content,
    };

    socket.emit("send_message", messagePayload, (response: any) => {
      if (response && response.error) {
        alert("Lỗi khi gửi tin nhắn: " + response.error);
      } else {
        // Sau khi gửi tin nhắn thành công, reload conversations để cập nhật lastMessage
        if (onConversationsUpdate) {
          setTimeout(() => {
            onConversationsUpdate();
          }, 300);
        }
      }
    });
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

  const handleSelectConversation = (conversation: Conversation) => {
    handleConversationSelect(conversation);
  };

  const handleOpenFullChat = () => {
    // Toggle fullscreen mode
    setIsFullscreen(!isFullscreen);
  };

  const handleConversationClick = (conversation: Conversation) => {
    // On mobile, navigate to chat page
    // On desktop, show in modal
    if (window.innerWidth < 768) {
      onConversationSelect(conversation);
    } else {
      handleConversationSelect(conversation);
    }
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/50 z-50 flex items-center justify-center transition-all duration-300 ${
        isFullscreen ? '' : 'p-2 md:p-4'
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isFullscreen) {
          onClose();
        }
      }}
    >
      <div className={`bg-white flex flex-col shadow-2xl transition-all duration-300 ${
        isFullscreen 
          ? 'w-full h-full rounded-none' 
          : 'rounded-xl md:rounded-2xl w-full max-w-4xl h-[90vh] md:h-[80vh]'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-3 md:p-4 border-b border-gray-200 bg-teal-50 ${
          isFullscreen ? 'rounded-none' : 'rounded-t-xl md:rounded-t-2xl'
        }`}>
          <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
            {currentConversation ? (
              <>
                <button
                  onClick={() => setCurrentConversation(null)}
                  className="md:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors mr-1"
                  aria-label="Quay lại"
                >
                  <FaArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                {getOtherUser(currentConversation).avatar ? (
                  <img
                    src={getOtherUser(currentConversation).avatar}
                    alt={getOtherUser(currentConversation).name}
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                    <FaComments className="w-4 h-4 md:w-5 md:h-5 text-teal-600" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-base md:text-lg font-bold text-gray-900 truncate">
                    {getOtherUser(currentConversation).name}
                  </h2>
                  {socket && (
                    <div className="flex items-center gap-2">
                      {socket.connected ? (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-green-500 rounded-full"></span>
                          <span className="hidden md:inline">Đã kết nối</span>
                        </span>
                      ) : (
                        <span className="text-xs text-orange-600 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 md:w-2 md:h-2 bg-orange-500 rounded-full"></span>
                          <span className="hidden md:inline">Đang kết nối...</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <FaComments className="w-5 h-5 text-teal-600" />
                <h2 className="text-base md:text-lg font-bold text-gray-900">Tin nhắn</h2>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {currentConversation && (
              <button
                onClick={handleOpenFullChat}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                aria-label={isFullscreen ? "Thu nhỏ" : "Mở rộng"}
              >
                {isFullscreen ? (
                  <>
                    <FaCompress className="w-4 h-4" />
                    <span>Thu nhỏ</span>
                  </>
                ) : (
                  <>
                    <FaExpand className="w-4 h-4" />
                    <span>Mở rộng</span>
                  </>
                )}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Đóng"
            >
              <FaTimes className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Conversation List */}
          <div className={`${
            currentConversation 
              ? 'hidden md:flex w-80 border-r border-gray-200' 
              : 'flex w-full md:w-80 border-r-0 md:border-r border-gray-200'
          } flex-col transition-all duration-300`}>
            <div className="flex-1 overflow-hidden">
              <ConversationList
                conversations={allConversations}
                currentConversationId={currentConversation?.conversationId || null}
                currentUserId={currentUserId}
                onSelectConversation={handleConversationClick}
                loading={false}
              />
            </div>
          </div>

          {/* Chat Area */}
          {currentConversation ? (
            <div className="flex-1 flex flex-col">
                     {/* Messages */}
                     <div className="flex-1 overflow-hidden bg-gray-50 flex flex-col min-h-0">
                       <MessageList
                         messages={messages}
                         currentUserId={currentUserId}
                         conversation={currentConversation}
                         isLoading={isLoadingMessages}
                         isTyping={false}
                       />
                     </div>

              {/* Input */}
              <ChatInput
                onSendMessage={handleSendMessage}
                disabled={!socket?.connected}
                placeholder="Nhập tin nhắn..."
              />
            </div>
          ) : (
            <div className="hidden md:flex flex-1 items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <FaComments className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium mb-2">Chọn cuộc trò chuyện</p>
                <p className="text-sm">Chọn một cuộc trò chuyện từ danh sách để bắt đầu</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

