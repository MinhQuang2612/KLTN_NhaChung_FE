"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { createRentalRequest } from "@/services/rentalRequests";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";

interface RentalRequestFormProps {
  postId: number;
  postTitle: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function RentalRequestForm({ 
  postId, 
  postTitle, 
  onSuccess, 
  onCancel 
}: RentalRequestFormProps) {
  const [formData, setFormData] = useState({
    requestedMoveInDate: '',
    requestedDuration: 12,
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError, showWarning } = useToast();
  const router = useRouter();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kiểm tra xác thực tài khoản
    if (!user?.isVerified) {
      showWarning('Cần xác thực tài khoản', 'Vui lòng xác thực tài khoản trước khi đăng ký thuê phòng.');
      router.push('/profile');
      return;
    }

    setIsSubmitting(true);

    try {
      await createRentalRequest({
        postId,
        requestedMoveInDate: formData.requestedMoveInDate,
        requestedDuration: formData.requestedDuration,
        message: formData.message || undefined
      });

      const message = ToastMessages.success.send('Đơn đăng ký');
      showSuccess(message.title, message.message + '. Chủ nhà sẽ xem xét và phản hồi trong thời gian sớm nhất.');
      onSuccess?.();
    } catch (error: any) {
      const message = ToastMessages.error.send('Đơn đăng ký');
      showError(message.title, error.message || message.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Đăng ký thuê phòng</h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Phòng:</strong> {postTitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Ngày chuyển vào */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ngày chuyển vào *
              </label>
              <input
                type="date"
                value={formData.requestedMoveInDate}
                onChange={(e) => handleInputChange('requestedMoveInDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                required
              />
            </div>

            {/* Thời hạn thuê */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thời hạn thuê *
              </label>
              <select
                value={formData.requestedDuration}
                onChange={(e) => handleInputChange('requestedDuration', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value={6}>6 tháng</option>
                <option value={12}>12 tháng</option>
                <option value={24}>24 tháng</option>
              </select>
            </div>

            {/* Lời nhắn */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lời nhắn cho chủ nhà
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Ví dụ: Tôi muốn xem phòng trước khi quyết định..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.requestedMoveInDate}
                className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Đang gửi...' : 'Đăng ký thuê'}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Lưu ý:</strong> Đơn đăng ký của bạn sẽ được chủ nhà xem xét. 
              Bạn sẽ nhận được thông báo khi có kết quả.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
