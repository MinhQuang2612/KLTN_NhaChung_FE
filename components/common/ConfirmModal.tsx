"use client";

import { FaExclamationTriangle, FaInfoCircle } from "react-icons/fa";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
  loading?: boolean;
}

const iconMap = {
  danger: FaExclamationTriangle,
  warning: FaExclamationTriangle,
  info: FaInfoCircle,
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Xác nhận",
  cancelText = "Hủy",
  type = "danger",
  loading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
          titleColor: "text-red-800",
          messageColor: "text-red-700",
          confirmBg: "bg-red-600 hover:bg-red-700",
          confirmText: "text-white"
        };
      case "warning":
        return {
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          iconBg: "bg-yellow-100",
          iconColor: "text-yellow-600",
          titleColor: "text-yellow-800",
          messageColor: "text-yellow-700",
          confirmBg: "bg-yellow-600 hover:bg-yellow-700",
          confirmText: "text-white"
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
          confirmBg: "bg-blue-600 hover:bg-blue-700",
          confirmText: "text-white"
        };
    }
  };

  const styles = getTypeStyles();
  const IconComponent = iconMap[type];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30"
        onClick={!loading ? onClose : undefined}
      />
      
      {/* Modal */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl border-2 max-w-md w-full mx-4
        ${styles.bgColor} ${styles.borderColor}
        animate-in fade-in-0 zoom-in-95 duration-300
      `}>
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
            text-center leading-relaxed mb-6
            ${styles.messageColor}
          `}>
            {message}
          </p>

          {/* Action buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium transition-colors bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:opacity-50"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50
                ${styles.confirmBg} ${styles.confirmText}
              `}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Đang xử lý...
                </div>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

