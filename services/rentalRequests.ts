import { apiGet, apiPost, apiPut } from "@/utils/api";

// Types cho Rental Requests
export interface RentalRequest {
  requestId: number;
  tenantId: number;
  landlordId: number;
  roomId: number;
  postId: number;
  requestType?: 'rental' | 'room_sharing';
  status: 'pending' | 'approved' | 'rejected' | 'cancelled' | 'pending_user_approval' | 'pending_landlord_approval';
  message?: string;
  requestedMoveInDate: string;
  requestedDuration: number;
  createdAt: string;
  updatedAt?: string;
  // Thông tin bổ sung từ post/room
  roomNumber?: string;
  buildingName?: string;
  address?: string;
  contractId?: number;
}

export interface CreateRentalRequestPayload {
  postId: number;
  requestedMoveInDate: string;
  requestedDuration: number;
  message?: string;
}

export interface RentalRequestsResponse {
  requests: RentalRequest[];
  total: number;
  page: number;
  limit: number;
}

// ==================== RENTAL REQUESTS API ====================

/**
 * Lấy danh sách đăng ký thuê của user
 */
export async function getUserRentalRequests(): Promise<RentalRequest[]> {
  return apiGet("users/me/rental-requests");
}

/**
 * Tạo đăng ký thuê mới
 */
export async function createRentalRequest(payload: CreateRentalRequestPayload): Promise<RentalRequest> {
  return apiPost("users/rental-requests", payload);
}

/**
 * Hủy đăng ký thuê
 */
export async function cancelRentalRequest(requestId: number): Promise<{ message: string }> {
  return apiPut(`users/rental-requests/${requestId}/cancel`);
}

// ==================== CONTRACTS API ====================

/**
 * Lấy danh sách tất cả contracts của user
 */
export async function getUserContracts(): Promise<any[]> {
  return apiGet("users/contracts");
}

/**
 * Lấy danh sách hợp đồng của CHỦ NHÀ (landlord)
 */
export interface LandlordContractSummary {
  contractId: number;
  landlordId: number;
  roomId: number;
  contractType?: 'single' | 'shared';
  status: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  tenantName?: string;
  tenants?: Array<{ tenantId: number; status: string; monthlyRent?: number }>;
  roomInfo?: { roomNumber?: string; currentOccupancy?: number; buildingName?: string };
}

export async function getLandlordContracts(): Promise<LandlordContractSummary[]> {
  return apiGet("landlord/contracts");
}

export async function getLandlordContractById(id: number): Promise<LandlordContractSummary> {
  return apiGet(`landlord/contracts/${id}`);
}

/**
 * Lấy chi tiết hợp đồng
 */
export async function getUserContract(contractId: number): Promise<{
  contractId: number;
  roomId: number;
  landlordId: number;
  contractType: 'single' | 'shared';
  status: 'draft' | 'active' | 'expired' | 'terminated';
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  contractFile?: string;
  tenants: Array<{
    tenantId: number;
    moveInDate: string;
    monthlyRent: number;
    deposit: number;
    status: 'active' | 'inactive';
  }>;
  roomInfo: {
    roomNumber: string;
    area: number;
    maxOccupancy: number;
    currentOccupancy: number;
  };
  createdAt: string;
}> {
  return apiGet(`users/contracts/${contractId}`);
}

/**
 * Tải hợp đồng PDF
 */
export async function downloadContractPDF(contractId: number): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/contracts/${contractId}/download-pdf`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Không thể tải hợp đồng: ${response.status} ${response.statusText}`);
  }
  
  const blob = await response.blob();
  return blob;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format trạng thái đăng ký thuê
 */
export function formatRentalStatus(status: string): string {
  const statusMap = {
    'pending': 'Chờ duyệt',
    'approved': 'Đã duyệt',
    'rejected': 'Từ chối',
    'cancelled': 'Đã hủy',
    'pending_user_approval': 'Chờ người ở duyệt',
    'pending_landlord_approval': 'Chờ chủ nhà duyệt'
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

/**
 * Format trạng thái hợp đồng
 */
export function formatContractStatus(status: string): string {
  const statusMap = {
    'draft': 'Bản nháp',
    'active': 'Có hiệu lực',
    'expired': 'Hết hạn',
    'terminated': 'Chấm dứt'
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

/**
 * Tính số ngày còn lại của hợp đồng
 */
export function calculateContractDaysLeft(endDate: string): number {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
