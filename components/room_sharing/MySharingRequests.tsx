"use client";

import React, { useState, useEffect } from 'react';
import { getMySharingRequests, RoomSharingRequest } from '@/services/roomSharing';
import { useToast } from '@/contexts/ToastContext';
import { ToastMessages } from '@/utils/toastMessages';
import Link from 'next/link';

const MySharingRequests: React.FC = () => {
  const [requests, setRequests] = useState<RoomSharingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showError } = useToast();

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMySharingRequests();
      setRequests(data || []);
    } catch (err: any) {
      setError('Không thể tải danh sách yêu cầu ở ghép. Vui lòng thử lại sau.');
      const message = ToastMessages.error.load('Danh sách yêu cầu ở ghép');
      showError(message.title, err.message || message.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending_user_approval': return 'Chờ duyệt';
      case 'pending_landlord_approval': return 'Chờ duyệt';
      case 'approved': return 'Đã được duyệt';
      case 'rejected': return 'Đã bị từ chối';
      default: return status;
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending_user_approval': return 'bg-yellow-100 text-yellow-800';
      case 'pending_landlord_approval': return 'bg-blue-100 text-blue-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải yêu cầu ở ghép...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
          <p className="text-red-700 font-medium mb-3">{error}</p>
          <button
            onClick={loadRequests}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu ở ghép nào</h3>
          <p className="text-gray-600 mb-4">Bạn chưa đăng ký ở ghép phòng nào.</p>
          <Link
            href="/find_share"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm phòng ở ghép
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.requestId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <h4 className="font-medium text-gray-900">Yêu cầu #{request.requestId}</h4>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                    {getStatusText(request.status)}
                  </span>
                </div>
                {request.status === 'approved' && request.contractId && (
                  <Link
                    href={`/contracts/${request.contractId}`}
                    className="px-3 py-1 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Xem hợp đồng
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Phòng:</span>
                  <span className="ml-1 font-medium">#{request.roomId}</span>
                </div>
                <div>
                  <span className="text-gray-600">Ngày dọn vào:</span>
                  <span className="ml-1 font-medium">{formatDate(request.requestedMoveInDate)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Thời hạn:</span>
                  <span className="ml-1 font-medium">{request.requestedDuration} tháng</span>
                </div>
              </div>

              {request.message && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600 text-sm">Lời nhắn của bạn:</span>
                  <p className="text-gray-900 text-sm mt-1">{request.message}</p>
                </div>
              )}

              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between items-center text-xs text-gray-500">
                <span>Gửi lúc: {formatDate(request.createdAt)}</span>
                {request.status === 'approved' && (
                  <span className="text-green-600 font-medium">✅ Hợp đồng đã được tạo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MySharingRequests;