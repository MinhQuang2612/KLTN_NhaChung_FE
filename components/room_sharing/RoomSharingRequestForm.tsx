"use client";

import React, { useState } from 'react';
import { createRoomSharingRequest, CreateRoomSharingRequestData } from '@/services/roomSharing';
import { useToast } from '@/contexts/ToastContext';
import { ToastMessages } from '@/utils/toastMessages';

interface RoomSharingRequestFormProps {
  roomId: number;
  postId: number;
  onSuccess?: () => void;
  onClose?: () => void;
}

const RoomSharingRequestForm: React.FC<RoomSharingRequestFormProps> = ({ 
  roomId,
  postId, 
  onSuccess,
  onClose 
}) => {
  const [formData, setFormData] = useState<CreateRoomSharingRequestData>({
    message: '',
    requestedMoveInDate: '',
    requestedDuration: 12
  });
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await createRoomSharingRequest(roomId, { ...formData, postId });
      
      const successMessage = ToastMessages.success.create('Yêu cầu ở ghép');
      showSuccess(successMessage.title, 'Đăng ký ở ghép thành công! Chờ User A duyệt.');
      
      // Reset form
      setFormData({
        message: '',
        requestedMoveInDate: '',
        requestedDuration: 12
      });
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error: any) {
      const errorMessage = ToastMessages.error.create('Yêu cầu ở ghép');
      showError(errorMessage.title, error.message || errorMessage.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Đăng ký ở ghép phòng</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              Lời nhắn cho người ở hiện tại *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
              placeholder="Giới thiệu bản thân và lý do muốn ở ghép..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label htmlFor="moveInDate" className="block text-sm font-medium text-gray-700 mb-2">
              Ngày dọn vào *
            </label>
            <input
              id="moveInDate"
              type="date"
              value={formData.requestedMoveInDate}
              onChange={(e) => setFormData({...formData, requestedMoveInDate: e.target.value})}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Thời hạn (tháng) *
            </label>
            <select
              id="duration"
              value={formData.requestedDuration}
              onChange={(e) => setFormData({...formData, requestedDuration: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option value={6}>6 tháng</option>
              <option value={12}>12 tháng</option>
              <option value={24}>24 tháng</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : 'Gửi yêu cầu'}
            </button>
          </div>
        </form>

          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-800">
              <strong>Lưu ý:</strong> Yêu cầu của bạn sẽ được gửi đến người đang ở trong phòng trước. 
              Sau khi họ duyệt, chủ nhà sẽ xem xét và quyết định cuối cùng.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomSharingRequestForm;
