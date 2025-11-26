"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: "success" | "error" | "warning" | "info", title: string, message: string, duration?: number) => void;
  hideToast: (id: string) => void;
  // Convenience methods
  showSuccess: (title: string, message: string, duration?: number) => void;
  showError: (title: string, message: string, duration?: number) => void;
  showWarning: (title: string, message: string, duration?: number) => void;
  showInfo: (title: string, message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const toastIconMap = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  warning: FiAlertTriangle,
  info: FaInfoCircle,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((
    type: "success" | "error" | "warning" | "info",
    title: string,
    message: string,
    duration = 3000
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Convenience methods
  const showSuccess = useCallback((title: string, message: string, duration?: number) => {
    showToast("success", title, message, duration);
  }, [showToast]);

  const showError = useCallback((title: string, message: string, duration?: number) => {
    showToast("error", title, message, duration);
  }, [showToast]);

  const showWarning = useCallback((title: string, message: string, duration?: number) => {
    showToast("warning", title, message, duration);
  }, [showToast]);

  const showInfo = useCallback((title: string, message: string, duration?: number) => {
    showToast("info", title, message, duration);
  }, [showToast]);

  return (
    <ToastContext.Provider value={{
      toasts,
      showToast,
      hideToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

// Toast Container Component
interface ToastContainerProps {
  toasts: Toast[];
  onHide: (id: string) => void;
}

function ToastContainer({ toasts, onHide }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onHide={onHide} />
      ))}
    </div>
  );
}

// Individual Toast Item
interface ToastItemProps {
  toast: Toast;
  onHide: (id: string) => void;
}

function ToastItem({ toast, onHide }: ToastItemProps) {
  const getToastStyles = () => {
    switch (toast.type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700",
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
        };
      case "info":
      default:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700",
        };
    }
  };

  const styles = getToastStyles();
  const IconComponent = toastIconMap[toast.type];

  return (
    <div className={`
      max-w-sm w-full ${styles.bgColor} ${styles.borderColor} 
      border rounded-lg shadow-lg p-4 transform transition-all duration-300 ease-in-out
      animate-in slide-in-from-right-full
    `}>
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 ${styles.iconBg} rounded-full flex items-center justify-center`}>
          <IconComponent className={`text-lg ${styles.iconColor}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-semibold ${styles.titleColor} mb-1`}>
            {toast.title}
          </h4>
          <p className={`text-sm ${styles.messageColor}`}>
            {toast.message}
          </p>
        </div>
        
        <button
          onClick={() => onHide(toast.id)}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

