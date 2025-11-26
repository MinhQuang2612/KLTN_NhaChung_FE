"use client";

import { useEffect, useState } from 'react';
import { FaCheckCircle, FaExclamationTriangle, FaInfoCircle, FaTimes } from 'react-icons/fa';

interface NotificationToastProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}

export default function NotificationToast({
  isOpen,
  onClose,
  type,
  title,
  message,
  duration = 0 // 0 = không tự đóng
}: NotificationToastProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  // Chỉ render ở client side để tránh hydration error
  if (!mounted || !isOpen) return null;

  const icons = {
    success: <FaCheckCircle className="w-6 h-6 text-green-600" />,
    error: <FaTimes className="w-6 h-6 text-red-600" />,
    warning: <FaExclamationTriangle className="w-6 h-6 text-amber-600" />,
    info: <FaInfoCircle className="w-6 h-6 text-blue-600" />
  };

  const colors = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      button: 'hover:bg-green-100'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      button: 'hover:bg-red-100'
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-800',
      button: 'hover:bg-amber-100'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      button: 'hover:bg-blue-100'
    }
  };

  const style = colors[type];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
        {/* Content */}
        <div className={`p-6 border-2 rounded-2xl ${style.bg} ${style.border}`}>
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 mt-0.5">
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className={`text-lg font-bold mb-2 ${style.text}`}>
                {title}
              </h3>
              <p className={`text-sm whitespace-pre-line ${style.text}`}>
                {message}
              </p>
            </div>
            <button
              onClick={onClose}
              className={`flex-shrink-0 p-1 rounded-full transition-colors ${style.button}`}
            >
              <FaTimes className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700 text-white' :
                type === 'error' ? 'bg-red-600 hover:bg-red-700 text-white' :
                type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

