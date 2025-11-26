"use client";

import { useEffect, useRef, useState } from "react";
import { Message, Conversation } from "@/types/Chat";
import { FaUser, FaFile, FaInfoCircle, FaDollarSign, FaMapMarkerAlt, FaBed, FaExternalLinkAlt } from "react-icons/fa";

interface MessageListProps {
  messages: Message[];
  currentUserId: number;
  conversation?: Conversation | null;
  isLoading?: boolean;
  isTyping?: boolean;
}

export default function MessageList({
  messages,
  currentUserId,
  conversation,
  isLoading = false,
  isTyping = false
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevMessagesLengthRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Check if user is near bottom of scroll container
  const checkIfNearBottom = useRef(() => {
    if (!messagesContainerRef.current) return false;
    const container = messagesContainerRef.current;
    const threshold = 100; // 100px from bottom
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distanceFromBottom < threshold;
  });

  // Handle scroll event to track if user is near bottom
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nearBottom = checkIfNearBottom.current();
      setIsNearBottom(nearBottom);
    };

    // Throttle scroll event for better performance
    let ticking = false;
    const throttledHandleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    container.addEventListener('scroll', throttledHandleScroll, { passive: true });
    return () => {
      container.removeEventListener('scroll', throttledHandleScroll);
    };
  }, []);

  // Auto scroll to bottom when messages load for the first time or conversation changes
  useEffect(() => {
    if (isLoading) return;

    const currentLength = messages.length;
    const previousLength = prevMessagesLengthRef.current;

    // Initial load: scroll to bottom when messages first load
    if (currentLength > 0 && (previousLength === 0 || isInitialLoadRef.current)) {
      isInitialLoadRef.current = false;
      setTimeout(() => {
        const container = messagesContainerRef.current;
        if (container) {
          container.scrollTop = container.scrollHeight;
          setIsNearBottom(true);
        }
        prevMessagesLengthRef.current = currentLength;
      }, 200);
      return;
    }

    // New message arrived: only auto-scroll if user is near bottom
    if (currentLength > previousLength && previousLength > 0) {
      if (isNearBottom) {
        setTimeout(() => {
          // Verify user is still near bottom before scrolling
          if (messagesContainerRef.current && checkIfNearBottom.current()) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100);
      }
      prevMessagesLengthRef.current = currentLength;
    }
  }, [messages, isLoading, isNearBottom]);

  // Handle typing indicator - scroll if near bottom
  useEffect(() => {
    if (isTyping && isNearBottom && messages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);
    }
  }, [isTyping, isNearBottom, messages.length]);

  // When conversation changes, reset state
  useEffect(() => {
    if (conversation?.conversationId) {
      setIsNearBottom(true);
      prevMessagesLengthRef.current = 0;
      isInitialLoadRef.current = true;
    }
  }, [conversation?.conversationId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải tin nhắn...</div>
      </div>
    );
  }

  return (
    <div 
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
      style={{ scrollBehavior: 'smooth' }}
    >
      {messages.map((message) => {
        // System message về bài đăng (đại diện cho hành động của người thuê quan tâm đến bài đăng)
        const isSystemPostMessage = 
          (message.type === 'system' || message.senderId === null) && 
          message.metadata?.postId;
        
        // Tin nhắn của chính mình
        const isOwnMessage = message.senderId === currentUserId;
        
        // System message về bài đăng:
        // - Nếu người thuê đang xem (currentUserId === tenantId) → hiển thị bên phải (như tin nhắn của mình)
        // - Nếu chủ nhà đang xem (currentUserId === landlordId) → hiển thị bên trái (như tin nhắn từ người thuê)
        const isCurrentUserTenant = conversation && Number(conversation.tenantId) === currentUserId;
        const shouldShowSystemMessageOnRight = isSystemPostMessage && isCurrentUserTenant;
        
        // Quyết định hiển thị bên phải hay trái
        const shouldShowOnRight = shouldShowSystemMessageOnRight || isOwnMessage;
        
        return (
          <div
            key={message.messageId}
            className={`flex ${shouldShowOnRight ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-2 max-w-[70%] ${shouldShowOnRight ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar - không hiển thị cho system message về bài đăng và tin nhắn của chính mình */}
              {!shouldShowOnRight && (
                <div className="flex-shrink-0">
                  {message.senderAvatar ? (
                    <img
                      src={message.senderAvatar}
                      alt={message.senderName || 'User'}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                      <FaUser className="w-4 h-4 text-teal-600" />
                    </div>
                  )}
                </div>
              )}

              {/* Message content */}
              <div className={`flex flex-col ${shouldShowOnRight ? 'items-end' : 'items-start'}`}>
                {!shouldShowOnRight && message.senderName && (
                  <span className="text-xs text-gray-500 mb-1 px-2">
                    {message.senderName}
                  </span>
                )}
                
                {/* System message với metadata (bài đăng) - LUÔN hiển thị bên phải */}
                {isSystemPostMessage ? (
                  <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 max-w-md">
                    <div className="flex items-start gap-3">
                      {message.metadata?.postImage && (
                        <img
                          src={message.metadata.postImage}
                          alt={message.metadata?.postTitle || 'Bài đăng'}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-teal-700 font-semibold mb-1 flex items-center gap-1">
                          <FaInfoCircle className="w-3 h-3" />
                          <span>Quan tâm đến bài đăng</span>
                        </p>
                        {message.metadata?.postTitle && (
                          <p className="text-sm font-semibold text-gray-900 mb-1 truncate">
                            {message.metadata.postTitle}
                          </p>
                        )}
                        {message.metadata?.postPrice && (
                          <p className="text-xs text-gray-700 mb-1 flex items-center gap-1">
                            <FaDollarSign className="w-3 h-3" />
                            <span>{message.metadata.postPrice.toLocaleString('vi-VN')} VNĐ/tháng</span>
                          </p>
                        )}
                        {message.metadata?.postAddress && (
                          <p className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                            <FaMapMarkerAlt className="w-3 h-3 flex-shrink-0" />
                            <span className="line-clamp-2">{message.metadata.postAddress}</span>
                          </p>
                        )}
                        {message.metadata?.roomName && (
                          <p className="text-xs text-gray-700 mb-2 flex items-center gap-1">
                            <FaBed className="w-3 h-3" />
                            <span>{message.metadata.roomName}</span>
                          </p>
                        )}
                        {message.metadata?.postUrl && (
                          <a
                            href={message.metadata.postUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-teal-700 hover:text-teal-900 underline font-medium inline-flex items-center gap-1"
                          >
                            <FaExternalLinkAlt className="w-3 h-3" />
                            <span>Xem chi tiết</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // System message text thông thường hoặc user message
                  <div
                    className={`
                      px-4 py-2 rounded-2xl break-words
                      ${shouldShowOnRight 
                        ? 'bg-teal-600 text-white' 
                        : 'bg-gray-200 text-gray-900'
                      }
                      ${message.type === 'image' || message.type === 'video' ? 'p-0 overflow-hidden' : ''}
                    `}
                  >
                    {message.type === 'image' && (
                      <img
                        src={message.content}
                        alt="Ảnh đã gửi"
                        className="max-w-xs max-h-96 object-contain rounded-2xl cursor-pointer"
                        onClick={() => window.open(message.content, '_blank')}
                      />
                    )}
                    {message.type === 'video' && (
                      <video
                        src={message.content}
                        controls
                        className="max-w-xs max-h-96 rounded-2xl"
                      />
                    )}
                    {message.type === 'file' && (
                      <div className="flex items-center gap-3 p-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          shouldShowOnRight ? 'bg-teal-500' : 'bg-gray-300'
                        }`}>
                          <FaFile className={`w-6 h-6 ${shouldShowOnRight ? 'text-white' : 'text-gray-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${shouldShowOnRight ? 'text-white' : 'text-gray-900'}`}>
                            File đính kèm
                          </p>
                          <a
                            href={message.content}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`text-xs underline ${
                              shouldShowOnRight 
                                ? 'text-teal-100 hover:text-white' 
                                : 'text-blue-600 hover:text-blue-800'
                            }`}
                          >
                            Tải xuống
                          </a>
                        </div>
                      </div>
                    )}
                    {message.type === 'text' && (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                )}
                
                <span className="text-xs text-gray-400 mt-1 px-2">
                  {formatTime(message.createdAt)}
                  {shouldShowOnRight && message.isRead && !isSystemPostMessage && (
                    <span className="ml-1">✓✓</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex justify-start">
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <FaUser className="w-4 h-4 text-gray-600" />
            </div>
            <div className="bg-gray-200 px-4 py-2 rounded-2xl">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}

