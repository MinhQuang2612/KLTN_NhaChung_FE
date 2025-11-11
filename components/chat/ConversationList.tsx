"use client";

import React from "react";
import { Conversation } from "@/types/Chat";
import { FaComments, FaUser, FaImage, FaVideo, FaFile, FaInfoCircle } from "react-icons/fa";

interface ConversationListProps {
  conversations: Conversation[];
  currentConversationId: number | null;
  currentUserId: number;
  onSelectConversation: (conversation: Conversation) => void;
  loading?: boolean;
}

export default function ConversationList({
  conversations,
  currentConversationId,
  currentUserId,
  onSelectConversation,
  loading = false
}: ConversationListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
        <FaComments className="w-12 h-12 mb-2 text-gray-300" />
        <p className="text-sm text-center">Chưa có cuộc trò chuyện nào</p>
      </div>
    );
  }

  const getOtherUser = (conversation: Conversation) => {
    if (conversation.tenantId === currentUserId) {
      return {
        name: conversation.landlordName || 'Chủ nhà',
        avatar: conversation.landlordAvatar
      };
    }
    return {
      name: conversation.tenantName || 'Người thuê',
      avatar: conversation.tenantAvatar
    };
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const formatMessagePreview = (message?: { content?: string; type?: string }, lastMessageAt?: string): React.ReactNode => {
    // Nếu không có lastMessage nhưng có lastMessageAt, có thể có tin nhắn nhưng backend chưa trả về lastMessage
    // Hiển thị "Có tin nhắn" thay vì "Chưa có tin nhắn"
    if (!message || !message.content) {
      if (lastMessageAt) {
        return 'Có tin nhắn'; // Có tin nhắn nhưng chưa load được nội dung
      }
      return 'Chưa có tin nhắn';
    }

    // Xử lý tin nhắn ảnh
    if (message.type === 'image') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <FaImage className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>Đã gửi ảnh</span>
        </span>
      );
    }

    // Xử lý tin nhắn video
    if (message.type === 'video') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <FaVideo className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>Đã gửi video</span>
        </span>
      );
    }

    // Xử lý tin nhắn file
    if (message.type === 'file') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <FaFile className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>Đã gửi file</span>
        </span>
      );
    }

    // Xử lý tin nhắn hệ thống
    if (message.type === 'system') {
      return (
        <span className="inline-flex items-center gap-1.5">
          <FaInfoCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>Tin nhắn hệ thống</span>
        </span>
      );
    }

    let preview = message.content;
    
    // Xử lý tin nhắn hệ thống về bài đăng
    if (preview.includes('Tôi quan tâm đến bài đăng này') || preview.includes('**')) {
      // Tìm tiêu đề bài đăng trong tin nhắn (có thể có format markdown **title**)
      const titleMatch = preview.match(/\*\*(.+?)\*\*/) || preview.match(/Tiêu đề:\s*(.+?)(?:\n|$)/);
      if (titleMatch && titleMatch[1]) {
        const title = titleMatch[1].trim();
        return title.length > 40 ? title.substring(0, 40) + '...' : title;
      }
      // Nếu không tìm thấy tiêu đề, lấy dòng đầu tiên (bỏ phần "Tôi quan tâm đến bài đăng này:")
      const lines = preview.split('\n').filter(line => line.trim() && !line.includes('Tôi quan tâm'));
      if (lines.length > 0) {
        const firstLine = lines[0].replace(/\*\*/g, '').trim();
        return firstLine.length > 40 ? firstLine.substring(0, 40) + '...' : firstLine;
      }
      return (
        <span className="inline-flex items-center gap-1.5">
          <FaInfoCircle className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
          <span>Tin nhắn về bài đăng</span>
        </span>
      );
    }
    
    // Xử lý tin nhắn thông thường - lấy dòng đầu tiên, loại bỏ markdown
    const firstLine = preview.split('\n')[0].replace(/\*\*/g, '').trim();
    
    // Rút gọn tin nhắn dài
    if (firstLine.length > 50) {
      return firstLine.substring(0, 50) + '...';
    }
    
    return firstLine || 'Có tin nhắn';
  };

  return (
    <div className="h-full overflow-y-auto">
      {conversations.map((conversation) => {
        const otherUser = getOtherUser(conversation);
        const isActive = conversation.conversationId === currentConversationId;
        const unreadCount = conversation.unreadCount || 0;

        return (
          <div
            key={conversation.conversationId}
            onClick={() => onSelectConversation(conversation)}
            className={`
              p-4 border-b border-gray-200 cursor-pointer transition-colors
              ${isActive ? 'bg-teal-50 border-teal-200' : 'hover:bg-gray-50'}
            `}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                {otherUser.avatar ? (
                  <img
                    src={otherUser.avatar}
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <FaUser className="w-6 h-6 text-teal-600" />
                  </div>
                )}
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className={`font-semibold text-sm truncate ${isActive ? 'text-teal-700' : 'text-gray-900'}`}>
                    {otherUser.name}
                  </h3>
                  {conversation.lastMessageAt && (
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                      {formatTime(conversation.lastMessageAt)}
                    </span>
                  )}
                </div>
                <div className={`text-sm ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'} min-w-0`}>
                  <div className="truncate">
                    {formatMessagePreview(conversation.lastMessage, conversation.lastMessageAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

