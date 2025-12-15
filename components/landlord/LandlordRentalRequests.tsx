"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { FaCalendarAlt, FaCheckCircle, FaDoorOpen, FaEnvelope, FaMoneyBillWave, FaPhone, FaFileContract, FaMapMarkerAlt } from "react-icons/fa";
import StatsHeader from "./requests/StatsHeader";
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
import { getLandlordRentalHistory, LandlordRentalHistoryItem } from "@/services/landlordRentalHistory";
import { formatHistoryStatus, calculateMonthsRented, formatCurrency } from "@/services/rentalHistory";
import { getLandlordContracts, getLandlordContractDetail, LandlordContractDetail, LandlordContractSummary, formatContractStatus, downloadLandlordContractPDF, getLandlordTerminationRequests, approveTerminationRequest, rejectTerminationRequest, LandlordTerminationRequest, formatTerminationStatus } from "@/services/rentalRequests";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { ToastMessages } from "@/utils/toastMessages";
import { getRoomById } from "@/services/rooms";
import { addressService } from "@/services/address";
import { getUserById } from "@/services/user";
import { extractApiErrorMessage } from "@/utils/api";
import { getPostById } from "@/services/posts";

export default function LandlordRentalRequests() {
  const [activeTab, setActiveTab] = useState<'rental' | 'sharing' | 'history' | 'contracts' | 'terminations'>('rental');
  
  // Rental requests state
  const [requests, setRequests] = useState<LandlordRentalRequest[]>([]);
  const [rentalLoading, setRentalLoading] = useState(true);
  
  // Room sharing requests state
  const [sharingRequests, setSharingRequests] = useState<RoomSharingRequest[]>([]);
  const [sharingLoading, setSharingLoading] = useState(true);

  // Rental history state
  const [rentalHistory, setRentalHistory] = useState<LandlordRentalHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotalPages, setHistoryTotalPages] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPostTypes, setHistoryPostTypes] = useState<Record<number, 'rent' | 'roommate' | null>>({});

  // Contracts state
  const [contracts, setContracts] = useState<LandlordContractSummary[]>([]);
  const [contractsLoading, setContractsLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<LandlordContractDetail | null>(null);
  const [contractDetailLoading, setContractDetailLoading] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Termination requests state
  const [terminationRequests, setTerminationRequests] = useState<LandlordTerminationRequest[]>([]);
  const [terminationsLoading, setTerminationsLoading] = useState(true);
  const [processingTermination, setProcessingTermination] = useState<number | null>(null);
  const [terminationResponses, setTerminationResponses] = useState<Record<number, string>>({});
  
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

  useEffect(() => {
    loadRentalHistory(historyPage);
  }, [historyPage]);

  useEffect(() => {
    loadContracts();
  }, []);

  useEffect(() => {
    loadTerminationRequests();
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

  const loadRentalHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const response = await getLandlordRentalHistory({
        page,
        limit: 10,
        sortBy: "actualEndDate",
        sortOrder: "desc",
      });

      const items = response?.history || [];
      setRentalHistory(items);
      setHistoryTotalPages(response?.pagination?.totalPages || 1);
      setHistoryTotal(response?.pagination?.total || items.length);

      await checkHistoryPostTypes(items);
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể tải lịch sử thuê", message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Kiểm tra postType của bài đăng active để build link đúng
  const checkHistoryPostTypes = async (historyItems: LandlordRentalHistoryItem[]) => {
    const postTypeMap: Record<number, "rent" | "roommate" | null> = {};

    const uniquePostIds = Array.from(
      new Set(
        historyItems
          .filter((item) => item.activePostId)
          .map((item) => item.activePostId!) as number[]
      )
    );

    const postIdsToCheck = uniquePostIds.filter(
      (postId) => !(postId in historyPostTypes)
    );

    if (postIdsToCheck.length === 0) return;

    await Promise.all(
      postIdsToCheck.map((postId) =>
        getPostById(postId)
          .then((post) => {
            const rawType = String((post as any)?.postType || "cho-thue");
            const mapped = rawType === "cho-thue" ? "rent" : rawType === "tim-o-ghep" ? "roommate" : "rent";
            postTypeMap[postId] = mapped;
          })
          .catch(() => {
            postTypeMap[postId] = null;
          })
      )
    );

    setHistoryPostTypes((prev) => ({ ...prev, ...postTypeMap }));
  };

  const loadContracts = async () => {
    try {
      setContractsLoading(true);
      const data = await getLandlordContracts();
      setContracts(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể tải danh sách hợp đồng", message);
    } finally {
      setContractsLoading(false);
    }
  };

  const loadContractDetail = async (contractId: number) => {
    try {
      setContractDetailLoading(true);
      const detail = await getLandlordContractDetail(contractId);
      setSelectedContract(detail);
      setShowContractModal(true);
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể tải chi tiết hợp đồng", message);
    } finally {
      setContractDetailLoading(false);
    }
  };

  const handleDownloadPdf = async (contractId: number) => {
    try {
      setDownloadingPdf(true);
      const blob = await downloadLandlordContractPDF(contractId);
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `hop-dong-${contractId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      
      showSuccess("Tải thành công", "Đã tải file hợp đồng PDF");
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể tải PDF", message);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const loadTerminationRequests = async () => {
    try {
      setTerminationsLoading(true);
      const data = await getLandlordTerminationRequests();
      setTerminationRequests(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể tải yêu cầu huỷ hợp đồng", message);
    } finally {
      setTerminationsLoading(false);
    }
  };

  const handleApproveTermination = async (requestId: number) => {
    const response = terminationResponses[requestId] || '';
    try {
      setProcessingTermination(requestId);
      const result = await approveTerminationRequest(requestId, response || undefined);
      showSuccess("Thành công", result.message);
      loadTerminationRequests();
      loadContracts(); // Reload contracts vì status đã thay đổi
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể duyệt yêu cầu", message);
    } finally {
      setProcessingTermination(null);
    }
  };

  const handleRejectTermination = async (requestId: number) => {
    const response = terminationResponses[requestId] || '';
    try {
      setProcessingTermination(requestId);
      const result = await rejectTerminationRequest(requestId, response || undefined);
      showSuccess("Thành công", result.message);
      loadTerminationRequests();
    } catch (error: any) {
      const message = extractApiErrorMessage(error);
      showError("Không thể từ chối yêu cầu", message);
    } finally {
      setProcessingTermination(null);
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

  const formatDateOnly = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const getRoomStatusColor = (status?: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800";
      case "occupied":
        return "bg-yellow-100 text-yellow-800";
      case "unknown":
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getRoomStatusText = (status?: string) => {
    switch (status) {
      case "available":
        return "Đang trống";
      case "occupied":
        return "Đang có người thuê";
      default:
        return "Không xác định";
    }
  };

  const isLoading = activeTab === 'rental'
    ? rentalLoading
    : activeTab === 'sharing'
      ? sharingLoading
      : activeTab === 'history'
        ? historyLoading
        : activeTab === 'contracts'
          ? contractsLoading
          : terminationsLoading;

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

  const historyStats = {
    total: historyTotal,
    terminated: rentalHistory.filter((h) => h.contractStatus === "terminated").length,
    expired: rentalHistory.filter((h) => h.contractStatus === "expired").length,
  };

  const contractStats = {
    total: contracts.length,
    active: contracts.filter((c) => c.status === "active").length,
    expired: contracts.filter((c) => c.status === "expired").length,
    terminated: contracts.filter((c) => c.status === "terminated" || c.status === "cancelled").length,
  };

  const terminationStats = {
    total: terminationRequests.length,
    pending: terminationRequests.filter(t => t.status === 'pending').length,
    approved: terminationRequests.filter(t => t.status === 'approved').length,
    rejected: terminationRequests.filter(t => t.status === 'rejected').length,
  };

  const currentStats = activeTab === 'rental'
    ? rentalStats
    : activeTab === 'sharing'
      ? sharingStats
      : activeTab === 'history'
        ? historyStats
        : contractStats;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <StatsHeader
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        rentalStats={rentalStats}
        sharingStats={sharingStats}
        historyStats={historyStats}
        contractStats={contractStats}
        terminationStats={terminationStats}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      ) : activeTab === 'rental' ? (
        requests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu thuê nào</h3>
            <p className="text-gray-500">Khi người thuê gửi yêu cầu, thông tin sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {requests.map((request, index) => (
              <div
                key={request.requestId}
                className={`px-6 py-5 ${index !== requests.length - 1 ? "border-b border-gray-200" : ""} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.roomInfo?.roomNumber ? `Phòng ${request.roomInfo.roomNumber}` : `Phòng ${request.roomId}`}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRentalRequestStatusColor(request.status)}`}>
                        {formatRentalRequestStatus(request.status)}
                      </span>
                    </div>
                    {(request.roomInfo?.buildingName || request.roomInfo?.address) && (
                      <p className="text-sm text-gray-600">
                        {request.roomInfo?.buildingName && <span className="font-medium">{request.roomInfo.buildingName}</span>}
                        {request.roomInfo?.buildingName && request.roomInfo?.address && <span> • </span>}
                        {request.roomInfo?.address}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Người thuê:</span>
                        <span className="font-medium text-gray-900">{request.tenantInfo?.fullName || `User ${request.tenantId}`}</span>
                      </div>
                      <div className="hidden sm:block h-4 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Ngày chuyển vào:</span>
                        <span className="font-medium text-gray-900">{formatDate(request.requestedMoveInDate)}</span>
                      </div>
                      <div className="hidden sm:block h-4 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Thời hạn thuê:</span>
                        <span className="font-medium text-gray-900">{request.requestedDuration} tháng</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleViewDetail(request)}
                    className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>

                {request.message && (
                  <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                    <span className="font-semibold text-blue-900">Lời nhắn:</span> {request.message}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4 text-sm text-gray-500">
                  <span>Gửi lúc: {formatDate(request.createdAt)}</span>
                  {request.respondedAt && <span>Phản hồi: {formatDate(request.respondedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'sharing' ? (
        sharingRequests.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu cầu ở ghép nào</h3>
          <p className="text-gray-500">Khi có người dùng xin ở ghép, yêu cầu sẽ được hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {sharingRequests.map((request, index) => (
            <div
              key={request.requestId}
              className={`px-6 py-5 ${index !== sharingRequests.length - 1 ? "border-b border-gray-200" : ""} hover:bg-gray-50 transition-colors`}
            >
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-lg font-semibold text-gray-900">Yêu cầu ở ghép</h3>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getSharingStatusColor(request.status)}`}>
                    {getSharingStatusText(request.status)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Phòng:</span>
                    <span className="font-medium text-gray-900">{(request as any).roomNumber || request.roomId}</span>
                  </div>
                  {(request as any).roomCategory && (
                    <>
                      <div className="hidden sm:block h-4 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Loại phòng:</span>
                        <span className="font-medium text-gray-900">{formatRoomType((request as any).roomCategory)}</span>
                      </div>
                    </>
                  )}
                  {(request as any).senderName && (
                    <>
                      <div className="hidden sm:block h-4 w-px bg-gray-200" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Người gửi:</span>
                        <span className="font-medium text-gray-900">{(request as any).senderName}</span>
                      </div>
                    </>
                  )}
                  <div className="hidden sm:block h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Ngày dọn vào:</span>
                    <span className="font-medium text-gray-900">{formatDate(request.requestedMoveInDate)}</span>
                  </div>
                  <div className="hidden sm:block h-4 w-px bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Thời hạn:</span>
                    <span className="font-medium text-gray-900">{request.requestedDuration} tháng</span>
                  </div>
                </div>

                {((request as any).buildingName || (request as any).address) && (
                  <p className="text-sm text-gray-600">
                    {(request as any).buildingName && <span className="font-medium">{(request as any).buildingName}</span>}
                    {(request as any).buildingName && (request as any).address && <span> • </span>}
                    {(request as any).address}
                  </p>
                )}

                {request.message && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-blue-800">
                    <span className="font-semibold text-blue-900">Lời nhắn:</span> {request.message}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
                <div className="text-sm text-gray-500">Gửi lúc: {formatDate(request.createdAt)}</div>
                <div className="flex flex-wrap items-center gap-3">
                  {request.status === "approved" && request.contractId ? (
                    <span className="flex items-center gap-2 text-sm font-medium text-green-600">
                      <FaCheckCircle className="h-4 w-4" />
                      Hợp đồng đã được tạo
                    </span>
                  ) : null}
                  {request.status === "pending_landlord_approval" && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleRejectSharing(request.requestId)}
                        disabled={processingRequests.has(request.requestId)}
                        className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Từ chối
                      </button>
                      <button
                        onClick={() => handleApproveSharing(request.requestId)}
                        disabled={processingRequests.has(request.requestId)}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {processingRequests.has(request.requestId) ? "Đang xử lý..." : "Duyệt"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        )
      ) : activeTab === 'history' ? (
        rentalHistory.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử thuê</h3>
            <p className="text-gray-500">Các hợp đồng đã kết thúc sẽ xuất hiện tại đây.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {rentalHistory.map((item, index) => {
              const postType = item.activePostId ? historyPostTypes[item.activePostId] || "rent" : null;
              const totalMonths =
                item.totalMonthsRented ??
                calculateMonthsRented(item.startDate, item.actualEndDate || item.endDate);
              const isLast = index === rentalHistory.length - 1;
              return (
                <div
                  key={item.contractId}
                  className={`p-6 ${!isLast ? "border-b border-gray-200" : ""} hover:bg-gray-50 transition-colors`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">Phòng {item.roomNumber || item.roomId}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${item.contractStatus === "expired" ? "bg-orange-100 text-orange-800" : "bg-gray-100 text-gray-800"}`}>
                          {formatHistoryStatus(item.contractStatus)}
                        </span>
                        {item.roomStatus && (
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoomStatusColor(item.roomStatus)}`}>
                            {getRoomStatusText(item.roomStatus)}
                          </span>
                        )}
                        {item.canRentAgain && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800 flex items-center gap-1">
                            <FaDoorOpen className="w-3 h-3" /> Có thể cho thuê lại
                          </span>
                        )}
                      </div>
                      {(item.buildingName || item.address) && (
                        <p className="text-sm text-gray-600">
                          {item.buildingName && <span className="font-medium">{item.buildingName}</span>}
                          {item.buildingName && item.address && <span> • </span>}
                          {item.address}
                        </p>
                      )}
                    </div>

                    {item.activePostId && (
                      <Link
                        href={`/room_details/${postType}-${item.activePostId}`}
                        className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
                      >
                        Xem bài đăng
                      </Link>
                    )}
                  </div>

                  <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>Thời gian thuê</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Bắt đầu</span>
                        <span className="font-medium text-gray-900">{formatDateOnly(item.startDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Kết thúc</span>
                        <span className="font-medium text-gray-900">{formatDateOnly(item.actualEndDate || item.endDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tổng thời gian</span>
                        <span className="font-medium text-gray-900">{totalMonths} tháng</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <FaMoneyBillWave className="w-4 h-4" />
                        <span>Giá trị hợp đồng</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Tiền thuê/tháng</span>
                        <span className="font-semibold text-green-700">{formatCurrency(item.monthlyRent)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Đặt cọc</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.deposit)}</span>
                      </div>
                      {item.totalAmountPaid !== undefined && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Tổng đã thu</span>
                          <span className="font-medium text-gray-900">{formatCurrency(item.totalAmountPaid)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-gray-600 font-medium">
                        <FaPhone className="w-4 h-4" />
                        <span>Người thuê</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Họ tên</span>
                        <span className="font-medium text-gray-900">{item.tenantInfo?.name || `Tenant #${item.tenantInfo?.tenantId || item.roomId}`}</span>
                      </div>
                      {item.tenantInfo?.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">SĐT</span>
                          <a href={`tel:${item.tenantInfo.phone}`} className="font-medium text-teal-700 hover:text-teal-800">
                            {item.tenantInfo.phone}
                          </a>
                        </div>
                      )}
                      {item.tenantInfo?.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Email</span>
                          <a href={`mailto:${item.tenantInfo.email}`} className="font-medium text-teal-700 hover:text-teal-800 inline-flex items-center gap-1">
                            <FaEnvelope className="w-4 h-4" />
                            {item.tenantInfo.email}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {(item.terminationReason || item.terminatedAt) && (
                    <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700">
                      <p className="font-semibold text-gray-900 mb-1">Kết thúc hợp đồng</p>
                      {item.terminationReason && <p className="text-gray-700">Lý do: {item.terminationReason}</p>}
                      {item.terminatedAt && <p className="text-gray-500 text-xs mt-1">Thời gian hủy: {formatDateOnly(item.terminatedAt)}</p>}
                    </div>
                  )}

                  {!item.activePostId && item.roomStatus === "available" && (
                    <div className="mt-4 text-sm text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg p-3">
                      Phòng đang trống nhưng chưa có bài đăng active. Hãy đăng bài để cho thuê lại.
                    </div>
                  )}
                </div>
              );
            })}

            {historyTotalPages > 1 && (
              <div className="flex items-center justify-center gap-2 py-4 bg-gray-50">
                <button
                  onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                  disabled={historyPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="text-sm text-gray-600">
                  Trang {historyPage} / {historyTotalPages}
                </span>
                <button
                  onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                  disabled={historyPage === historyTotalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </div>
        )
      ) : activeTab === 'contracts' ? (
        contracts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hợp đồng</h3>
            <p className="text-gray-500">Các hợp đồng bạn sở hữu sẽ hiển thị tại đây.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {contracts.map((contract, index) => {
            const isLast = index === contracts.length - 1;
            return (
              <div
                key={contract.contractId}
                className={`p-6 ${!isLast ? "border-b border-gray-200" : ""} hover:bg-gray-50 transition-colors`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <FaFileContract className="w-4 h-4 text-teal-600" />
                      <h3 className="text-lg font-semibold text-gray-900">Hợp đồng #{contract.contractId}</h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {formatContractStatus(contract.status)}
                      </span>
                    </div>
                    {contract.roomInfo?.roomNumber && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaDoorOpen className="w-4 h-4 text-gray-400" />
                        <span>Phòng {contract.roomInfo.roomNumber}</span>
                        {contract.roomInfo.buildingName && (
                          <>
                            <span>•</span>
                            <span>{contract.roomInfo.buildingName}</span>
                          </>
                        )}
                      </div>
                    )}
                    {contract.tenants && contract.tenants.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Người thuê: <span className="font-medium">{contract.tenantName || `${contract.tenants.length} người`}</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => loadContractDetail(contract.contractId)}
                    className="px-4 py-2 text-sm font-medium text-teal-600 border border-teal-200 rounded-lg hover:bg-teal-50 transition-colors"
                  >
                    {contractDetailLoading && selectedContract?.contractId === contract.contractId ? "Đang tải..." : "Xem chi tiết"}
                  </button>
                </div>

                <div className="mt-4 grid md:grid-cols-3 gap-4 text-sm text-gray-700">
                  <div className="space-y-2">
                    <div className="text-gray-500">Thời gian</div>
                    <div className="flex items-center justify-between">
                      <span>Bắt đầu</span>
                      <span className="font-medium text-gray-900">{formatDateOnly(contract.startDate)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kết thúc</span>
                      <span className="font-medium text-gray-900">{formatDateOnly(contract.endDate)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-500">Giá trị</div>
                    <div className="flex items-center justify-between">
                      <span>Tiền thuê/tháng</span>
                      <span className="font-semibold text-green-700">{formatCurrency(contract.monthlyRent)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Đặt cọc</span>
                      <span className="font-medium text-gray-900">{formatCurrency(contract.deposit)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-gray-500">Loại</div>
                    <div className="font-medium text-gray-900 uppercase">{contract.contractType || "single"}</div>
                    {contract.roomInfo?.currentOccupancy != null && (
                      <div className="text-gray-600 text-sm">
                        Số người: {contract.roomInfo.currentOccupancy}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        )
      ) : activeTab === 'terminations' ? (
        terminationRequests.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không có yêu cầu huỷ</h3>
            <p className="text-gray-500">Chưa có người thuê nào gửi yêu cầu huỷ hợp đồng.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {terminationRequests.map((request, index) => {
              const isLast = index === terminationRequests.length - 1;
              const isPending = request.status === 'pending';
              
              return (
                <div
                  key={request.requestId}
                  className={`p-6 ${!isLast ? "border-b border-gray-200" : ""} hover:bg-gray-50 transition-colors`}
                >
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Yêu cầu huỷ HĐ #{request.contractId}
                        </h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {formatTerminationStatus(request.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Phòng: <span className="font-medium">{request.room.roomNumber}</span>
                      </p>
                    </div>
                    
                    {request.willLoseDeposit && (
                      <div className="px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">
                          Mất tiền cọc: {formatCurrency(request.depositAmount)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Info Grid */}
                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                    {/* Thông tin người thuê */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-gray-500 mb-2">Người thuê</div>
                      <p className="font-medium text-gray-900">{request.tenant.name}</p>
                      <p className="text-gray-600">{request.tenant.phone}</p>
                      <p className="text-gray-600 text-xs">{request.tenant.email}</p>
                    </div>

                    {/* Thông tin hợp đồng */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-gray-500 mb-2">Hợp đồng</div>
                      <p className="text-gray-700">
                        {formatDateOnly(request.contract.startDate)} - {formatDateOnly(request.contract.endDate)}
                      </p>
                      <p className="text-gray-700">Thuê: {formatCurrency(request.contract.monthlyRent)}/tháng</p>
                      <p className="text-gray-700">Cọc: {formatCurrency(request.contract.deposit)}</p>
                    </div>

                    {/* Thông tin yêu cầu */}
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <div className="text-gray-500 mb-2">Yêu cầu huỷ</div>
                      <p className="text-gray-700">Ngày muốn kết thúc: {formatDateOnly(request.requestedTerminationDate)}</p>
                      <p className="text-gray-700">Còn {request.daysBeforeEnd} ngày so với hợp đồng</p>
                      <p className="text-gray-700 text-xs">Gửi lúc: {formatDate(request.createdAt)}</p>
                    </div>
                  </div>

                  {/* Lý do huỷ */}
                  {request.reason && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <strong>Lý do:</strong> {request.reason}
                      </p>
                    </div>
                  )}

                  {/* Actions cho pending */}
                  {isPending && (
                    <div className="border-t border-gray-200 pt-4 flex flex-wrap items-end justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phản hồi (tuỳ chọn)
                        </label>
                        <textarea
                          value={terminationResponses[request.requestId] || ''}
                          onChange={(e) => setTerminationResponses(prev => ({
                            ...prev,
                            [request.requestId]: e.target.value
                          }))}
                          placeholder="Nhập phản hồi cho người thuê..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                        />
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleRejectTermination(request.requestId)}
                          disabled={processingTermination === request.requestId}
                          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                        >
                          {processingTermination === request.requestId ? "Đang xử lý..." : "Từ chối"}
                        </button>
                        <button
                          onClick={() => handleApproveTermination(request.requestId)}
                          disabled={processingTermination === request.requestId}
                          className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {processingTermination === request.requestId ? "Đang xử lý..." : "Duyệt"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : null}

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

      {/* Contract Detail Modal */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Hợp đồng #{selectedContract.contractId}</h2>
                <p className="text-gray-600 mt-1">{formatContractStatus(selectedContract.status)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadPdf(selectedContract.contractId)}
                  disabled={downloadingPdf}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {downloadingPdf ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang tải...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Tải PDF
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowContractModal(false)}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaDoorOpen className="w-4 h-4" /> Thông tin phòng
                  </h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Số phòng:</strong> {selectedContract.room?.roomNumber || selectedContract.roomId}</p>
                    <p><strong>Trạng thái phòng:</strong> {getRoomStatusText(selectedContract.room?.status)}</p>
                    <p><strong>Diện tích:</strong> {selectedContract.room?.area ? `${selectedContract.room.area} m²` : "N/A"}</p>
                    {selectedContract.room?.category && (
                      <p><strong>Loại phòng:</strong> {formatRoomType(selectedContract.room.category)}</p>
                    )}
                    {selectedContract.room?.floor && (
                      <p><strong>Tầng:</strong> {selectedContract.room.floor}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Thời gian & giá trị</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>Bắt đầu:</strong> {formatDateOnly(selectedContract.startDate)}</p>
                    <p><strong>Kết thúc:</strong> {formatDateOnly(selectedContract.endDate)}</p>
                    {selectedContract.totalMonths && (
                      <p><strong>Thời hạn:</strong> {selectedContract.totalMonths} tháng</p>
                    )}
                    <p><strong>Tiền thuê/tháng:</strong> {formatCurrency(selectedContract.monthlyRent)}</p>
                    <p><strong>Đặt cọc:</strong> {formatCurrency(selectedContract.deposit)}</p>
                  </div>
                </div>
              </div>

              {selectedContract.room?.building && (
                <div className="bg-white border border-gray-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FaMapMarkerAlt className="w-4 h-4" /> Tòa nhà
                  </h3>
                  <p className="text-sm text-gray-800">{selectedContract.room.building.name}</p>
                  {selectedContract.room.building.buildingType && (
                    <p className="text-sm text-gray-600">Loại: {selectedContract.room.building.buildingType}</p>
                  )}
                  <p className="text-sm text-gray-600">
                    {selectedContract.room.building.address?.street || ""}{" "}
                    {selectedContract.room.building.address?.wardName ? `, ${selectedContract.room.building.address.wardName}` : ""}{" "}
                    {selectedContract.room.building.address?.provinceName ? `, ${selectedContract.room.building.address.provinceName}` : ""}
                  </p>
                </div>
              )}

              {(Array.isArray(selectedContract.room?.furniture) && selectedContract.room.furniture.length > 0) || (Array.isArray(selectedContract.room?.utilities) && selectedContract.room.utilities.length > 0) ? (
                <div className="grid md:grid-cols-2 gap-6">
                  {Array.isArray(selectedContract.room?.furniture) && selectedContract.room.furniture.length > 0 && (
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Nội thất</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContract.room.furniture.map((f, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {Array.isArray(selectedContract.room?.utilities) && selectedContract.room.utilities.length > 0 && (
                    <div className="bg-white border border-gray-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-2">Tiện ích</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedContract.room.utilities.map((u, i) => (
                          <span key={i} className="px-2 py-1 bg-teal-50 text-teal-700 text-xs rounded">{u}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="bg-white border border-gray-200 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Người thuê</h3>
                <div className="space-y-3">
                  {Array.isArray(selectedContract.tenantDetails) && selectedContract.tenantDetails.length > 0 ? (
                    selectedContract.tenantDetails.map((t) => (
                      <div key={t.tenantId} className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="font-medium text-gray-900">{t.fullName || `Tenant #${t.tenantId}`}</p>
                          <p className="text-sm text-gray-600">Vào ở: {formatDateOnly(t.moveInDate)}</p>
                          <p className="text-sm text-gray-600">Trạng thái: {t.status}</p>
                          {t.cccd && <p className="text-sm text-gray-600">CCCD: {t.cccd}</p>}
                        </div>
                        <div className="text-right text-sm">
                          {t.phone && (
                            <p className="text-teal-700">
                              <a href={`tel:${t.phone}`} className="hover:underline">{t.phone}</a>
                            </p>
                          )}
                          {t.email && (
                            <p className="text-teal-700">
                              <a href={`mailto:${t.email}`} className="hover:underline">{t.email}</a>
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">Chưa có thông tin người thuê</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
