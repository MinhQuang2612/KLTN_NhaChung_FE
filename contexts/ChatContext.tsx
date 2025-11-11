"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Conversation } from "@/types/Chat";

interface ChatContextType {
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  selectedConversation: Conversation | null;
  setSelectedConversation: (conversation: Conversation | null) => void;
  openModalWithConversation: (conversation: Conversation) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedConversation(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedConversation(null);
  };

  const openModalWithConversation = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  return (
    <ChatContext.Provider
      value={{
        isModalOpen,
        openModal,
        closeModal,
        selectedConversation,
        setSelectedConversation,
        openModalWithConversation,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

