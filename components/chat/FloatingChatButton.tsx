"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useChat } from "@/contexts/ChatContext";
import { useRouter, usePathname } from "next/navigation";
import { getSocket, initSocket } from "@/utils/socket";
import { getConversations } from "@/services/chat";
import { Conversation } from "@/types/Chat";
import ChatModal from "./ChatModal";
import { FaComments } from "react-icons/fa";

export default function FloatingChatButton() {
  const { user, isLoading: authLoading } = useAuth();
  const { isModalOpen, openModal, closeModal, selectedConversation } = useChat();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  // Ẩn button trên trang login
  const isLoginPage = pathname === "/login";
  const shouldHide = isLoginPage || !user || authLoading;

  useEffect(() => {
    if (!user || authLoading) {
      return;
    }

    // Initialize socket
    const token = typeof window !== 'undefined' ? localStorage.getItem("token") : null;
    if (token) {
      initSocket(token);
    }

    // Load conversations
    loadConversations();

    // Listen for conversation updates
    const socket = getSocket();
    if (socket) {
      const handleConversationUpdate = () => {
        loadConversations();
      };

      socket.on("conversation_updated", handleConversationUpdate);
      socket.on("new_message", handleConversationUpdate);

      return () => {
        socket.off("conversation_updated", handleConversationUpdate);
        socket.off("new_message", handleConversationUpdate);
      };
    }
  }, [user, authLoading]);

  // Reload conversations when modal opens, especially with a selected conversation
  useEffect(() => {
    if (isModalOpen) {
      loadConversations();
    }
  }, [isModalOpen]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const userId = Number((user as any).userId ?? (user as any).id);
      const data = await getConversations(userId);
      
      const sorted = data.sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
      
      setConversations(sorted);
      
      // Calculate total unread count
      const totalUnread = sorted.reduce((sum, conv) => {
        return sum + (conv.unreadCount || 0);
      }, 0);
      
      setUnreadCount(totalUnread);
    } catch (error) {
      // Silently handle error
    }
  };

  const handleClick = () => {
    openModal();
  };

  if (shouldHide) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
        aria-label="Mở chat"
      >
        <FaComments className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isModalOpen && (
        <ChatModal
          conversations={conversations}
          initialConversation={selectedConversation}
          onClose={closeModal}
          onConversationSelect={(conversation) => {
            // Optionally open in full screen or keep in modal
            // For now, just keep it in modal
          }}
          onConversationsUpdate={() => {
            // Reload conversations và cập nhật unread count
            loadConversations();
          }}
        />
      )}
    </>
  );
}

