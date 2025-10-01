"use client";

import React, { useState, useEffect } from 'react';
import { 
  getSharingRequestsToApprove, 
  getSharingRequestsHistory,
  approveSharingRequestByUser, 
  rejectSharingRequestByUser,
  RoomSharingRequest 
} from '@/services/roomSharing';
import { getUserRentalRequests } from '@/services/rentalRequests';
import { getLandlordRentalRequests } from '@/services/landlord';
import { useToast } from '@/contexts/ToastContext';
import { useAuth } from '@/contexts/AuthContext';
import { ToastMessages } from '@/utils/toastMessages';

const UserASharingRequests: React.FC = () => {
  const [requests, setRequests] = useState<RoomSharingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Gọi cả 2 API: requests đang chờ duyệt và lịch sử đã duyệt
      const [pendingRequests, historyRequests] = await Promise.all([
        getSharingRequestsToApprove(),
        getSharingRequestsHistory()
      ]);
      
      // Kết hợp cả 2 danh sách
      const allRequests = [...(pendingRequests || []), ...(historyRequests || [])];
      setRequests(allRequests);
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

  const handleApprove = async (requestId: number) => {
    try {
      await approveSharingRequestByUser(requestId);
      
      const successMessage = ToastMessages.success.update('Yêu cầu ở ghép');
      showSuccess(successMessage.title, 'Đã duyệt yêu cầu ở ghép! Chờ chủ nhà duyệt cuối cùng.');
      
      loadRequests(); // Refresh list
    } catch (error: any) {
      const errorMessage = ToastMessages.error.update('Yêu cầu ở ghép');
      showError(errorMessage.title, error.message || errorMessage.message);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await rejectSharingRequestByUser(requestId);
      
      const successMessage = ToastMessages.success.update('Yêu cầu ở ghép');
      showSuccess(successMessage.title, 'Đã từ chối yêu cầu ở ghép.');
      
      loadRequests(); // Refresh list
    } catch (error: any) {
      const errorMessage = ToastMessages.error.update('Yêu cầu ở ghép');
      showError(errorMessage.title, error.message || errorMessage.message);
    }
  };

  const getStatusText = (status: string): string => {
    switch (status) {
      case 'pending_user_approval': return 'Chờ tôi duyệt';
      case 'pending_landlord_approval': return 'Chờ chủ nhà duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
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

  if (loading) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải yêu cầu ở ghép...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <div className="text-center p-6 bg-red-50 rounded-lg border border-red-200">
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Yêu cầu chờ tôi duyệt</h2>
          <p className="text-gray-600 mt-1">Các yêu cầu ở ghép đang chờ duyệt và lịch sử đã duyệt</p>
        </div>
        <button
          onClick={loadRequests}
          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          🔄 Làm mới
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="min-h-[300px] flex items-center justify-center">
          <div className="text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu nào</h3>
            <p className="text-gray-600">Hiện tại không có yêu cầu ở ghép nào cần duyệt hoặc đã duyệt.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {requests.map((request) => (
            <div key={request.requestId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Yêu cầu #{request.requestId}</h3>
                  <p className="text-sm text-gray-600">Phòng ID: {request.roomId}</p>
                </div>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.status)}`}>
                  {getStatusText(request.status)}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tin nhắn:</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{request.message}</p>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Ngày dọn vào:</p>
                    <p className="font-medium">{new Date(request.requestedMoveInDate).toLocaleDateString('vi-VN')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Thời hạn:</p>
                    <p className="font-medium">{request.requestedDuration} tháng</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}
                </p>
                
                {request.status === 'pending_user_approval' && (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleReject(request.requestId)}
                      className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      Từ chối
                    </button>
                    <button 
                      onClick={() => handleApprove(request.requestId)}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                    >
                      Duyệt
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserASharingRequests;
