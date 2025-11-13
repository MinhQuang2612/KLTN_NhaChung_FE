"use client";

import { useState, useEffect } from "react";
import { getUserRentalRequests, formatRentalStatus, getUserContract } from "@/services/rentalRequests";
import { getRoomById } from "@/services/rooms";
import { addressService } from "@/services/address";
import { RentalRequest } from "@/services/rentalRequests";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";

export default function MyRentalRequests() {
  const [requests, setRequests] = useState<RentalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [contractStatuses, setContractStatuses] = useState<Record<number, 'draft' | 'active' | 'expired' | 'terminated'>>({});
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
      // Bổ sung thông tin phòng/tòa/địa chỉ nếu thiếu
      const needsAugment = rentalRequests.some(r => !r.roomNumber || !r.buildingName || !r.address);
      if (needsAugment) {
        const roomIdToInfo: Record<number, { roomNumber?: string; buildingName?: string; address?: string; category?: string }> = {};
        const uniqueRoomIds = Array.from(new Set(rentalRequests.map(r => r.roomId).filter(Boolean)));
        await Promise.all(uniqueRoomIds.map(async (roomId) => {
          try {
            const room = await getRoomById(Number(roomId));
            const formattedAddress = room?.address
              ? addressService.formatAddressForDisplay(room.address as any)
              : undefined;
            roomIdToInfo[Number(roomId)] = {
              roomNumber: room?.roomNumber,
              buildingName: room?.building?.name,
              address: formattedAddress,
              category: (room as any)?.category
            };
          } catch {}
        }));

        const augmented = rentalRequests.map(r => ({
          ...r,
          roomNumber: r.roomNumber || roomIdToInfo[r.roomId]?.roomNumber,
          buildingName: r.buildingName || roomIdToInfo[r.roomId]?.buildingName,
          address: r.address || roomIdToInfo[r.roomId]?.address,
          roomCategory: roomIdToInfo[r.roomId]?.category,
        }));
        setRequests(augmented);
      } else {
        setRequests(rentalRequests);
      }
      
      // Fetch contract statuses cho các requests có contractId
      const contractStatusMap: Record<number, 'draft' | 'active' | 'expired' | 'terminated'> = {};
      const requestsWithContracts = rentalRequests.filter(r => r.contractId);
      await Promise.all(requestsWithContracts.map(async (r) => {
        if (r.contractId) {
          try {
            const contract = await getUserContract(r.contractId);
            contractStatusMap[r.contractId] = contract.status;
          } catch (err) {
            // Silently fail nếu không fetch được contract
          }
        }
      }));
      setContractStatuses(contractStatusMap);
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
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRoomCategory = (category?: string) => {
    if (!category) return undefined;
    const map: Record<string, string> = {
      'phong-tro': 'Phòng trọ',
      'chung-cu': 'Chung cư',
      'nha-nguyen-can': 'Nhà nguyên căn',
    };
    return map[category] || category
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
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
    <div>
      <div>
        {requests.map((request, index) => (
          <div 
            key={request.requestId} 
            className={`py-5 px-4 ${index !== requests.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50/50 transition-colors`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {request.roomNumber ? `Phòng ${request.roomNumber}` : `Phòng ${request.postId}`}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                  {formatRentalStatus(request.status)}
                </span>
              </div>
              {request.status === 'approved' && request.contractId && (
                <a
                  href={contractStatuses[request.contractId] === 'terminated' ? '#' : `/contracts/${request.contractId}`}
                  onClick={(e) => {
                    if (request.contractId && contractStatuses[request.contractId] === 'terminated') {
                      e.preventDefault();
                    }
                  }}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    request.contractId && contractStatuses[request.contractId] === 'terminated'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  Xem hợp đồng
                </a>
              )}
            </div>
            {(request.buildingName || request.address) && (
              <p className="text-sm text-gray-600 mb-3">
                {request.buildingName && <span className="font-medium">{request.buildingName}</span>}
                {request.buildingName && request.address && <span> • </span>}
                {request.address}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-3">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Loại phòng:</span>
                <span className="font-medium text-gray-900">{formatRoomCategory((request as any).roomCategory)}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Ngày chuyển vào:</span>
                <span className="font-medium text-gray-900">{formatDate(request.requestedMoveInDate)}</span>
              </div>
              <span className="text-gray-300">|</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Thời hạn:</span>
                <span className="font-medium text-gray-900">{request.requestedDuration} tháng</span>
              </div>
            </div>

            {request.message && (
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800">
                  <strong className="font-bold text-blue-900">Lời nhắn:</strong> {request.message}
                </p>
              </div>
            )}

            <div className="flex items-center justify-between pt-3">
              <span className="text-sm text-gray-500">
                Đăng ký lúc: {formatDate(request.createdAt)}
              </span>
              {request.status === 'pending' && (
                <button className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium">
                  Hủy đăng ký
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
