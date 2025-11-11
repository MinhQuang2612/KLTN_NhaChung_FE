"use client";

import { useState, useEffect } from "react";
import { 
  getLandlordRentalRequests, 
  approveRentalRequest, 
  rejectRentalRequest,
  formatRentalRequestStatus,
  getRentalRequestStatusColor,
  LandlordRentalRequest 
} from "@/services/landlord";
import { 
  getLandlordSharingRequests,
  approveSharingRequestByLandlord,
  rejectSharingRequestByLandlord,
  RoomSharingRequest 
} from "@/services/roomSharing";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { ToastMessages } from "@/utils/toastMessages";
import { getRoomById } from "@/services/rooms";
import { addressService } from "@/services/address";
import { getUserById } from "@/services/user";

export default function LandlordRentalRequests() {
  const [activeTab, setActiveTab] = useState<'rental' | 'sharing'>('rental');
  
  // Rental requests state
  const [requests, setRequests] = useState<LandlordRentalRequest[]>([]);
  const [rentalLoading, setRentalLoading] = useState(true);
  
  // Room sharing requests state
  const [sharingRequests, setSharingRequests] = useState<RoomSharingRequest[]>([]);
  const [sharingLoading, setSharingLoading] = useState(true);
  
  // Common state
  const [processingRequests, setProcessingRequests] = useState<Set<number>>(new Set());
  const [responseMessages, setResponseMessages] = useState<Record<number, string>>({});
  const [selectedRequest, setSelectedRequest] = useState<LandlordRentalRequest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { showSuccess, showError } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadRentalRequests();
    loadSharingRequests();
  }, []);

  const loadRentalRequests = async () => {
    try {
      setRentalLoading(true);
      const data = await getLandlordRentalRequests();
      
      // Filter chỉ hiển thị rental requests thực sự (không phải room sharing requests)
      // Dựa vào requestType: 'room_sharing' = room sharing, không có hoặc khác = rental
      const rentalRequests = data.filter(request => {
        const requestType = (request as any).requestType;
        return requestType !== 'room_sharing';
      });
      
      setRequests(rentalRequests);
    } catch (error: any) {
      const message = ToastMessages.error.load('Danh sách yêu cầu thuê');
      showError(message.title, error.message || message.message);
    } finally {
      setRentalLoading(false);
    }
  };

  const loadSharingRequests = async () => {
    try {
      setSharingLoading(true);
      
      // Thử gọi API riêng trước
      try {
        const sharingData = await getLandlordSharingRequests();
        
        if (sharingData.length > 0) {
          // Nếu API riêng có data, augment thêm thông tin phòng
          const roomIdToInfo: Record<number, { roomNumber?: string; buildingName?: string; address?: string; category?: string }> = {};
          const tenantIdToInfo: Record<number, { name?: string; phone?: string }> = {};
          const uniqueRoomIds = Array.from(new Set(sharingData.map(r => r.roomId).filter(Boolean)));
          const uniqueTenantIds = Array.from(new Set(sharingData.map(r => r.tenantId).filter(Boolean)));
          await Promise.all(uniqueRoomIds.map(async (roomId) => {
            try {
              const room = await getRoomById(Number(roomId));
              const formattedAddress = room?.address ? addressService.formatAddressForDisplay(room.address as any) : undefined;
              roomIdToInfo[Number(roomId)] = {
                roomNumber: (room as any)?.roomNumber,
                buildingName: (room as any)?.building?.name,
                address: formattedAddress,
                category: (room as any)?.category
              };
            } catch {}
          }));
          await Promise.all(uniqueTenantIds.map(async (tenantId) => {
            try {
              const user = await getUserById(tenantId);
              tenantIdToInfo[Number(tenantId)] = { name: (user as any)?.name, phone: (user as any)?.phone };
            } catch {}
          }));

          const augmented = sharingData.map(r => ({
            ...r,
            roomNumber: roomIdToInfo[r.roomId]?.roomNumber,
            buildingName: roomIdToInfo[r.roomId]?.buildingName,
            address: roomIdToInfo[r.roomId]?.address,
            roomCategory: roomIdToInfo[r.roomId]?.category,
            senderName: tenantIdToInfo[r.tenantId]?.name,
            senderPhone: tenantIdToInfo[r.tenantId]?.phone,
          })) as any;

          setSharingRequests(augmented);
          return;
        }
      } catch (error) {
        // Fallback to rental API
      }
      
      // Fallback: Lấy từ getLandlordRentalRequests và filter
      const data = await getLandlordRentalRequests();
      
      // Filter chỉ hiển thị room sharing requests dựa vào requestType
      const sharingRequests = data.filter(request => {
        const requestType = (request as any).requestType;
        return requestType === 'room_sharing';
      });
      
      // Convert LandlordRentalRequest to RoomSharingRequest format
      const convertedSharingRequestsRaw = sharingRequests.map(request => ({
        ...request,
        posterId: request.tenantId,
        requestType: 'room_sharing' as const,
        status: request.status as any // Cast để tạm thời giải quyết type mismatch
      }));

      // Augment thêm thông tin phòng cho fallback
      const roomIdToInfo: Record<number, { roomNumber?: string; buildingName?: string; address?: string; category?: string }> = {};
      const tenantIdToInfo: Record<number, { name?: string; phone?: string }> = {};
      const uniqueRoomIds = Array.from(new Set(convertedSharingRequestsRaw.map((r: any) => r.roomId).filter(Boolean)));
      const uniqueTenantIds = Array.from(new Set(convertedSharingRequestsRaw.map((r: any) => r.tenantId).filter(Boolean)));
      await Promise.all(uniqueRoomIds.map(async (roomId) => {
        try {
          const room = await getRoomById(Number(roomId));
          const formattedAddress = room?.address ? addressService.formatAddressForDisplay(room.address as any) : undefined;
          roomIdToInfo[Number(roomId)] = {
            roomNumber: (room as any)?.roomNumber,
            buildingName: (room as any)?.building?.name,
            address: formattedAddress,
            category: (room as any)?.category
          };
        } catch {}
      }));
      await Promise.all(uniqueTenantIds.map(async (tenantId) => {
        try {
          const user = await getUserById(tenantId);
          tenantIdToInfo[Number(tenantId)] = { name: (user as any)?.name, phone: (user as any)?.phone };
        } catch {}
      }));

      const convertedSharingRequests = (convertedSharingRequestsRaw as any).map((r: any) => ({
        ...r,
        roomNumber: roomIdToInfo[r.roomId]?.roomNumber,
        buildingName: roomIdToInfo[r.roomId]?.buildingName,
        address: roomIdToInfo[r.roomId]?.address,
        roomCategory: roomIdToInfo[r.roomId]?.category,
        senderName: tenantIdToInfo[r.tenantId]?.name,
        senderPhone: tenantIdToInfo[r.tenantId]?.phone,
      }));

      setSharingRequests(convertedSharingRequests as any);
    } catch (error: any) {
      const message = ToastMessages.error.load('Danh sách yêu cầu ở ghép');
      showError(message.title, error.message || message.message);
    } finally {
      setSharingLoading(false);
    }
  };

  const handleApprove = async (requestId: number) => {
    const responseMessage = responseMessages[requestId] || '';
    
        try {
          setProcessingRequests(prev => new Set(prev).add(requestId));
          
          await approveRentalRequest(requestId, {
            landlordResponse: responseMessage || undefined
          });

      const message = ToastMessages.success.update('Yêu cầu thuê');
      showSuccess(message.title, 'Đã duyệt yêu cầu thuê thành công');
      
      // Reload requests
      await loadRentalRequests();
    } catch (error: any) {
      const message = ToastMessages.error.update('Yêu cầu thuê');
      showError(message.title, error.message || message.message);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleReject = async (requestId: number) => {
    const responseMessage = responseMessages[requestId] || '';
    
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      await rejectRentalRequest(requestId, {
        landlordResponse: responseMessage || undefined
      });

      const message = ToastMessages.success.update('Yêu cầu thuê');
      showSuccess(message.title, 'Đã từ chối yêu cầu thuê');
      
      // Reload requests
      await loadRentalRequests();
    } catch (error: any) {
      const message = ToastMessages.error.update('Yêu cầu thuê');
      showError(message.title, error.message || message.message);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleResponseChange = (requestId: number, message: string) => {
    setResponseMessages(prev => ({
      ...prev,
      [requestId]: message
    }));
  };

  const handleViewDetail = (request: LandlordRentalRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // Room sharing request handlers
  const handleApproveSharing = async (requestId: number) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      const result = await approveSharingRequestByLandlord(requestId);
      
      const message = ToastMessages.success.update('Yêu cầu ở ghép');
      showSuccess(message.title, 'Đã duyệt yêu cầu ở ghép thành công! Hợp đồng đã được tạo và người ở ghép đã được thêm vào phòng.');
      
      await loadSharingRequests();
    } catch (error: any) {
      const message = ToastMessages.error.update('Yêu cầu ở ghép');
      showError(message.title, error.message || message.message);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectSharing = async (requestId: number) => {
    try {
      setProcessingRequests(prev => new Set(prev).add(requestId));
      
      await rejectSharingRequestByLandlord(requestId);
      
      const message = ToastMessages.success.update('Yêu cầu ở ghép');
      showSuccess(message.title, 'Đã từ chối yêu cầu ở ghép.');
      
      await loadSharingRequests();
    } catch (error: any) {
      const message = ToastMessages.error.update('Yêu cầu ở ghép');
      showError(message.title, error.message || message.message);
    } finally {
      setProcessingRequests(prev => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
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

  const formatRoomType = (roomType?: string) => {
    if (!roomType) return '';
    
    // Mapping từ slug sang tên có dấu
    const roomTypeMap: Record<string, string> = {
      'phong-tro': 'Phòng trọ',
      'chung-cu': 'Chung cư',
      'nha-nguyen-can': 'Nhà nguyên căn',
      'phong-tro-chung-cu': 'Phòng trọ chung cư',
      'nha-rieng': 'Nhà riêng'
    };
    
    // Nếu có trong map thì dùng tên có dấu
    if (roomTypeMap[roomType]) {
      return roomTypeMap[roomType];
    }
    
    // Fallback: format như cũ
    return roomType.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getSharingStatusText = (status: string): string => {
    switch (status) {
      case 'pending_landlord_approval': return 'Chờ tôi duyệt';
      case 'approved': return 'Đã duyệt';
      case 'rejected': return 'Đã từ chối';
      default: return status;
    }
  };

  const getSharingStatusColor = (status: string): string => {
    switch (status) {
      case 'pending_landlord_approval': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isLoading = activeTab === 'rental' ? rentalLoading : sharingLoading;

  // Thống kê
  const rentalStats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved').length,
    rejected: requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length,
  };

  const sharingStats = {
    total: sharingRequests.length,
    pending: sharingRequests.filter(r => r.status === 'pending_user_approval' || r.status === 'pending_landlord_approval').length,
    approved: sharingRequests.filter(r => r.status === 'approved').length,
    rejected: sharingRequests.filter(r => r.status === 'rejected').length,
  };

  const currentStats = activeTab === 'rental' ? rentalStats : sharingStats;

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Quản lý yêu cầu</h1>
        <p className="text-gray-600">Xem và xử lý các yêu cầu thuê phòng và ở ghép từ người dùng</p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('rental')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'rental'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Yêu cầu thuê ({rentalStats.total})
            </button>
            <button
              onClick={() => setActiveTab('sharing')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sharing'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Yêu cầu ở ghép ({sharingStats.total})
            </button>
          </nav>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-blue-100 text-blue-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Tổng yêu cầu</p>
              <p className="text-xl font-bold text-gray-900">{currentStats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Chờ duyệt</p>
              <p className="text-xl font-bold text-gray-900">{currentStats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-green-100 text-green-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã duyệt</p>
              <p className="text-xl font-bold text-gray-900">{currentStats.approved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center">
            <div className="p-2 rounded-full bg-red-100 text-red-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Đã từ chối</p>
              <p className="text-xl font-bold text-gray-900">{currentStats.rejected}</p>
            </div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : activeTab === 'rental' ? (
        requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu thuê nào</h3>
          <p className="text-gray-500">Các yêu cầu thuê từ người dùng sẽ hiển thị tại đây</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div key={request.requestId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Yêu cầu thuê
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRentalRequestStatusColor(request.status)}`}>
                      {formatRentalRequestStatus(request.status)}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Phòng:</strong> {request.roomInfo?.roomNumber || request.roomId}</p>
                      {request.roomInfo?.roomType && (
                        <p><strong>Loại phòng:</strong> {formatRoomType(request.roomInfo.roomType)}</p>
                      )}
                      <p><strong>Người thuê:</strong> {request.tenantInfo?.fullName || `User ${request.tenantId}`}</p>
                    </div>
                    <div>
                      <p><strong>Ngày chuyển vào:</strong> {formatDate(request.requestedMoveInDate)}</p>
                      <p><strong>Thời hạn:</strong> {request.requestedDuration} tháng</p>
                    </div>
                    <div>
                      <p><strong>Ngày gửi:</strong> {formatDate(request.createdAt)}</p>
                      {(request.roomInfo?.buildingName || request.roomInfo?.address) && (
                        <p><strong>Địa chỉ:</strong> {(request.roomInfo?.buildingName ? `${request.roomInfo.buildingName} • ` : '') + (request.roomInfo?.address || '')}</p>
                      )}
                      {request.respondedAt && (
                        <p><strong>Ngày phản hồi:</strong> {formatDate(request.respondedAt)}</p>
                      )}
                    </div>
                  </div>

                  {request.message && (
                    <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium text-blue-900">Lời nhắn: </span>
                      <span className="text-blue-800">{request.message}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={() => handleViewDetail(request)}
                    className="px-4 py-2 text-sm text-teal-600 hover:text-teal-700 font-medium border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )
      ) : (
        // Room sharing requests
        sharingRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu ở ghép nào</h3>
            <p className="text-gray-500">Các yêu cầu ở ghép từ người dùng sẽ hiển thị tại đây</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sharingRequests.map((request) => (
              <div key={request.requestId} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Yêu cầu ở ghép
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getSharingStatusColor(request.status)}`}>
                        {getSharingStatusText(request.status)}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Phòng:</strong> {(request as any).roomNumber || request.roomId}</p>
                      {(request as any).roomCategory && (
                        <p><strong>Loại phòng:</strong> {formatRoomType((request as any).roomCategory)}</p>
                      )}
                      {(request as any).senderName && (
                        <p><strong>Người gửi:</strong> {(request as any).senderName}</p>
                      )}
                    </div>
                      <div>
                      <p><strong>Ngày dọn vào:</strong> {formatDate(request.requestedMoveInDate)}</p>
                        <p><strong>Thời hạn:</strong> {request.requestedDuration} tháng</p>
                      </div>
                      <div>
                        <p><strong>Ngày gửi:</strong> {formatDate(request.createdAt)}</p>
                      {((request as any).buildingName || (request as any).address) && (
                        <p><strong>Địa chỉ:</strong> {((request as any).buildingName ? `${(request as any).buildingName} • ` : '') + ((request as any).address || '')}</p>
                      )}
                      {/* Ẩn hiển thị Hợp đồng theo yêu cầu */}
                      </div>
                    </div>

                    {request.message && (
                      <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                        <span className="font-medium text-blue-900">Lời nhắn: </span>
                        <span className="text-blue-800">{request.message}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 ml-4">
                    {request.status === 'pending_landlord_approval' && (
                      <>
                        <button
                          onClick={() => handleRejectSharing(request.requestId)}
                          disabled={processingRequests.has(request.requestId)}
                          className="px-4 py-2 text-sm text-red-600 hover:text-red-700 font-medium border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleApproveSharing(request.requestId)}
                          disabled={processingRequests.has(request.requestId)}
                          className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingRequests.has(request.requestId) ? 'Đang xử lý...' : 'Duyệt'}
                        </button>
                      </>
                    )}
                    {request.status === 'approved' && request.contractId && (
                      <span className="text-sm text-green-600 font-medium">
                        ✅ Đã tạo hợp đồng
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiết yêu cầu #{selectedRequest.requestId}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Status */}
              <div className="mb-6">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRentalRequestStatusColor(selectedRequest.status)}`}>
                  {formatRentalRequestStatus(selectedRequest.status)}
                </span>
              </div>

              {/* Grid Layout */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Thông tin phòng */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin phòng</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Loại phòng:</strong> {selectedRequest.roomInfo?.roomType ? 
                      formatRoomType(selectedRequest.roomInfo.roomType) : 
                      `Phòng ${selectedRequest.roomId}`}</p>
                    <p><strong>Số phòng:</strong> {selectedRequest.roomInfo?.roomNumber || 'N/A'}</p>
                    <p><strong>Tòa nhà:</strong> {selectedRequest.roomInfo?.buildingName || 'N/A'}</p>
                    <p><strong>Địa chỉ:</strong> {selectedRequest.roomInfo?.address || 'N/A'}</p>
                  </div>
                </div>

                {/* Thông tin người thuê */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Thông tin người thuê</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Họ tên:</strong> {selectedRequest.tenantInfo?.fullName || `User ${selectedRequest.tenantId}`}</p>
                    <p><strong>Email:</strong> {selectedRequest.tenantInfo?.email || 'N/A'}</p>
                    <p><strong>SĐT:</strong> {selectedRequest.tenantInfo?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Thông tin yêu cầu */}
              <div className="mt-6 bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Thông tin yêu cầu thuê</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Ngày chuyển vào:</strong> {formatDate(selectedRequest.requestedMoveInDate)}</p>
                    <p><strong>Thời hạn thuê:</strong> {selectedRequest.requestedDuration} tháng</p>
                  </div>
                  <div>
                    <p><strong>Ngày gửi yêu cầu:</strong> {formatDate(selectedRequest.createdAt)}</p>
                    {selectedRequest.respondedAt && (
                      <p><strong>Ngày phản hồi:</strong> {formatDate(selectedRequest.respondedAt)}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Lời nhắn từ người thuê */}
              {selectedRequest.message && (
                <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Lời nhắn từ người thuê</h3>
                  <p className="text-gray-700 text-sm">{selectedRequest.message}</p>
                </div>
              )}

              {/* Phản hồi của chủ nhà */}
              {selectedRequest.landlordResponse && (
                <div className="mt-6 bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Phản hồi của bạn</h3>
                  <p className="text-gray-700 text-sm">{selectedRequest.landlordResponse}</p>
                </div>
              )}

              {/* Actions cho yêu cầu pending */}
              {selectedRequest.status === 'pending' && (
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Xử lý yêu cầu</h3>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phản hồi cho người thuê (Tùy chọn)
                    </label>
                    <textarea
                      value={responseMessages[selectedRequest.requestId] || ''}
                      onChange={(e) => handleResponseChange(selectedRequest.requestId, e.target.value)}
                      placeholder="Ví dụ: Chào mừng bạn đến với căn hộ của tôi! Hoặc: Xin lỗi, phòng đã được thuê rồi."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-y"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        handleApprove(selectedRequest.requestId);
                        setShowDetailModal(false);
                      }}
                      disabled={processingRequests.has(selectedRequest.requestId)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {processingRequests.has(selectedRequest.requestId) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Duyệt yêu cầu
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        handleReject(selectedRequest.requestId);
                        setShowDetailModal(false);
                      }}
                      disabled={processingRequests.has(selectedRequest.requestId)}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {processingRequests.has(selectedRequest.requestId) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          Từ chối
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
