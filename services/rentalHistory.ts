import { apiGet, apiPut } from "@/utils/api";

// ==================== TYPES ====================

export interface RentalHistoryItem {
  contractId: number;
  roomId: number;
  roomNumber: string;
  buildingName: string;
  buildingId: number;
  address?: string;
  activePostId?: number | null; // 🆕 ID của bài đăng active (để link thuê lại)
  contractStatus: 'expired' | 'terminated';
  startDate: string;
  endDate: string;
  actualEndDate: string;
  monthlyRent: number;
  deposit: number;
  area: number;
  images?: string[];
  landlordInfo: {
    landlordId: number;
    name: string;
    phone: string;
    email: string;
  };
  terminationReason?: string;
  terminatedAt?: string;
  totalMonthsRented?: number;
  totalAmountPaid?: number;
}

export interface RentalHistoryResponse {
  history: RentalHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TerminateContractPayload {
  reason?: string;
  terminationDate?: string;
}

export interface TerminateContractResponse {
  message: string;
  contract: {
    contractId: number;
    status: string;
    terminatedAt: string;
    terminationReason?: string;
  };
  affectedPosts?: {
    count: number;
    message: string;
  };
}

// ==================== API FUNCTIONS ====================

/**
 * Hủy hợp đồng
 */
export async function terminateContract(
  contractId: number,
  payload?: TerminateContractPayload
): Promise<TerminateContractResponse> {
  return apiPut(`users/me/contracts/${contractId}/terminate`, payload || {});
}

/**
 * Lấy lịch sử thuê của user
 */
export async function getRentalHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<RentalHistoryResponse> {
  const searchParams = new URLSearchParams();
  
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.limit) searchParams.append('limit', params.limit.toString());
  if (params?.status) searchParams.append('status', params.status);
  if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
  if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
  
  const queryString = searchParams.toString();
  return apiGet(`users/me/rental-history${queryString ? `?${queryString}` : ''}`);
}

/**
 * Lấy chi tiết lịch sử thuê
 */
export async function getRentalHistoryDetail(contractId: number): Promise<RentalHistoryItem & {
  invoices?: Array<{
    invoiceId: number;
    month: string;
    amount: number;
    status: string;
    paidAt?: string;
  }>;
}> {
  return apiGet(`users/me/rental-history/${contractId}`);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format trạng thái hợp đồng trong lịch sử
 */
export function formatHistoryStatus(status: string): string {
  const statusMap = {
    'expired': 'Đã hết hạn',
    'terminated': 'Đã hủy'
  };
  return statusMap[status as keyof typeof statusMap] || status;
}

/**
 * Tính tổng số tháng đã thuê
 */
export function calculateMonthsRented(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  return Math.max(1, months);
}

/**
 * Format số tiền
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
}

