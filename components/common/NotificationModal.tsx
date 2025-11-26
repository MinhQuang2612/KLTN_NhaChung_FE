"use client";

import { useEffect } from "react";
import { FaCheckCircle, FaTimesCircle, FaInfoCircle } from "react-icons/fa";
import { FiAlertTriangle } from "react-icons/fi";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
  duration?: number; // Auto close after duration (ms)
}

const iconMap = {
  success: FaCheckCircle,
  error: FaTimesCircle,
  warning: FiAlertTriangle,
  info: FaInfoCircle,
};

export default function NotificationModal({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 3000
}: NotificationModalProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
          titleColor: "text-green-800",
          messageColor: "text-green-700"
        };
      case "error":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700"
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700"
        };
      case "info":
      default:
        return {
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
          titleColor: "text-blue-800",
          messageColor: "text-blue-700"
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = iconMap[type];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl border-2 max-w-md w-full mx-4
        ${styles.bgColor} ${styles.borderColor}
        animate-in fade-in-0 zoom-in-95 duration-300
      `}>
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Icon */}
          <div className={`
            w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4
            ${styles.iconBg}
          `}>
            <IconComponent className={`text-2xl ${styles.iconColor}`} />
          </div>

          {/* Title */}
          <h3 className={`
            text-xl font-bold text-center mb-3
            ${styles.titleColor}
          `}>
            {title}
          </h3>

          {/* Message */}
          <p className={`
            text-center leading-relaxed
            ${styles.messageColor}
          `}>
            {message}
          </p>

          {/* Action button */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={onClose}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${type === "success" ? "bg-green-600 hover:bg-green-700 text-white" :
                  type === "error" ? "bg-red-600 hover:bg-red-700 text-white" :
                  type === "warning" ? "bg-yellow-600 hover:bg-yellow-700 text-white" :
                  "bg-blue-600 hover:bg-blue-700 text-white"}
              `}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

