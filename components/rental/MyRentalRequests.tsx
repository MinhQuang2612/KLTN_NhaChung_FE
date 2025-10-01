"use client";

import { useState, useEffect } from "react";
import { getUserRentalRequests, formatRentalStatus } from "@/services/rentalRequests";
import { RentalRequest } from "@/services/rentalRequests";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";

export default function MyRentalRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getUserRentalRequests();
      // Filter chỉ hiển thị rental requests thực sự (không phải room sharing requests)
      // Dựa vào requestType để phân biệt rental và room sharing
      const rentalRequests = data.filter(request => 
        (request as any).requestType !== 'room_sharing' && (
          request.status === 'pending' || 
          request.status === 'approved' || 
          request.status === 'rejected' || 
          request.status === 'cancelled'
        )
      );
      setRequests(rentalRequests);
    } catch (error: any) {
      const message = ToastMessages.error.load('Danh sách đăng ký thuê');
      showError(message.title, error.message || message.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'pending_user_approval': 'bg-blue-100 text-blue-800',
      'pending_landlord_approval': 'bg-purple-100 text-purple-800'
    };
    return colorMap[status as keyof typeof colorMap] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có đăng ký thuê nào</h3>
        <p className="text-gray-500">Hãy tìm phòng và đăng ký thuê để bắt đầu.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Đăng ký thuê của tôi</h2>
        <button
          onClick={loadRequests}
          className="px-3 py-1 text-sm text-teal-600 hover:text-teal-700 transition-colors"
        >
          Làm mới
        </button>
      </div>

      <div className="grid gap-4">
        {requests.map((request) => (
          <div key={request.requestId} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {request.roomNumber ? `Phòng ${request.roomNumber}` : `Phòng ${request.postId}`}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    <strong>Ngày chuyển vào:</strong> {formatDate(request.requestedMoveInDate)}
                  </span>
                  <span>
                    <strong>Thời hạn:</strong> {request.requestedDuration} tháng
                  </span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                {formatRentalStatus(request.status)}
              </span>
            </div>

            {request.message && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Lời nhắn:</strong> {request.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Đăng ký lúc: {formatDate(request.createdAt)}
              </span>
              <div className="flex gap-2">
                {request.status === 'approved' && request.contractId && (
                  <a
                    href={`/contracts/${request.contractId}`}
                    className="px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-xs"
                  >
                    Xem hợp đồng
                  </a>
                )}
                {request.status === 'pending' && (
                  <button className="px-3 py-1 text-red-600 hover:text-red-700 transition-colors text-xs">
                    Hủy đăng ký
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
