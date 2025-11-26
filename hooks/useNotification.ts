"use client";

import { useState, useCallback } from "react";

interface NotificationState {
  isOpen: boolean;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

export function useNotification() {
  const [notification, setNotification] = useState<NotificationState>({
    isOpen: false,
    type: "info",
    title: "",
    message: "",
    duration: 3000
  });

  const showNotification = useCallback((
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    duration?: number
  ) => {
    setNotification({
      isOpen: true,
      type,
      title,
      message,
      duration
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showNotification("success", title, message, duration);
  }, [showNotification]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showNotification("error", title, message, duration);
  }, [showNotification]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showNotification("warning", title, message, duration);
  }, [showNotification]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showNotification("info", title, message, duration);
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo
  };
}
