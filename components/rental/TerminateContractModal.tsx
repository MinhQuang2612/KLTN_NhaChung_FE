"use client";

import { useState } from "react";
import { FaExclamationTriangle, FaTimes } from "react-icons/fa";

interface TerminateContractModalProps {
  isOpen: boolean;
  roomNumber: string;
  onClose: () => void;
  onConfirm: (reason: string, terminationDate?: string) => void;
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
  const [terminationDate, setTerminationDate] = useState("");

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reason, terminationDate || undefined);
  };

  const handleClose = () => {
    setReason("");
    setTerminationDate("");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
              <FaExclamationTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Yêu cầu huỷ hợp đồng</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <FaTimes className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Message */}
          <p className="text-gray-700">
            Bạn muốn gửi yêu cầu huỷ hợp đồng thuê <span className="font-semibold text-gray-900">Phòng {roomNumber}</span>?
          </p>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <span className="inline-flex items-center gap-2 font-semibold text-yellow-900">
                <FaExclamationTriangle className="h-4 w-4" />
                Lưu ý quan trọng:
              </span>
            </p>
            <ul className="text-sm text-yellow-800 mt-2 space-y-1 list-disc list-inside">
              <li>Yêu cầu sẽ được gửi đến chủ nhà để xem xét</li>
              <li>Nếu huỷ <strong>trước hạn hợp đồng</strong>, bạn có thể <strong>không được hoàn lại tiền cọc</strong></li>
              <li>Bạn có thể huỷ yêu cầu trước khi chủ nhà phản hồi</li>
            </ul>
          </div>

          {/* Termination date input */}
          <div>
            <label htmlFor="terminationDate" className="block text-sm font-medium text-gray-700 mb-2">
              Ngày muốn kết thúc (tuỳ chọn)
            </label>
            <input
              type="date"
              id="terminationDate"
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">Để trống sẽ lấy ngày hiện tại</p>
          </div>

          {/* Reason input */}
          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
              Lý do huỷ hợp đồng (tuỳ chọn)
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
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Huỷ bỏ
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

