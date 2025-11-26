"use client";

import { useState } from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface TerminateContractModalProps {
  isOpen: boolean;
  roomNumber: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export default function TerminateContractModal({
  isOpen,
  roomNumber,
  onClose,
  onConfirm,
  isLoading = false
}: TerminateContractModalProps) {
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <FaExclamationTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Xác nhận hủy hợp đồng</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Message */}
          <p className="text-gray-700">
            Bạn có chắc chắn muốn hủy hợp đồng thuê <span className="font-semibold text-gray-900">Phòng {roomNumber}</span>?
          </p>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="inline-flex items-center gap-2 font-semibold text-yellow-900">
                <FaExclamationTriangle className="h-4 w-4" />
                Lưu ý:
              </span>{" "}
              Hành động này không thể hoàn tác. Phòng sẽ được giải phóng và bài đăng sẽ được kích hoạt lại.
            </p>
          </div>

          {/* Reason input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Lý do hủy hợp đồng (tùy chọn)
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Vd: Chuyển công tác, tìm được chỗ khác..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
              rows={3}
              disabled={isLoading}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {reason.length}/500 ký tự
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-2">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang xử lý...' : 'Xác nhận hủy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

