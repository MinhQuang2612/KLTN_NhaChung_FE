import { apiGet, apiPut } from "@/utils/api";

export interface LandlordRentalRequest {
  requestId: number;
  tenantId: number;
  landlordId: number;
  roomId: number;
  postId: number;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  message?: string;
  requestedMoveInDate: string;
  requestedDuration: number;
  landlordResponse?: string;
  respondedAt?: string;
  createdAt: string;
  updatedAt?: string;
  // Thông tin thêm từ join
  tenantInfo?: {
    fullName: string;
    email: string;
    phone: string;
  };
  roomInfo?: {
    roomNumber: string;
    roomType: string; // Thể loại phòng: "Phòng trọ", "Chung cư", "Nhà nguyên căn"
    buildingName: string;
    address: string;
  };
}

export interface ApproveRentalRequestPayload {
  landlordResponse?: string;
}

export interface RejectRentalRequestPayload {
  landlordResponse?: string;
}

export async function getLandlordRentalRequests(): Promise<LandlordRentalRequest[]> {
  return apiGet("landlord/rental-requests");
}

export async function approveRentalRequest(
  requestId: number, 
  payload: ApproveRentalRequestPayload
): Promise<LandlordRentalRequest> {
  return apiPut(`landlord/rental-requests/${requestId}/approve`, payload);
}

export async function rejectRentalRequest(
  requestId: number, 
  payload: RejectRentalRequestPayload
): Promise<LandlordRentalRequest> {
  return apiPut(`landlord/rental-requests/${requestId}/reject`, payload);
}

export function formatRentalRequestStatus(status: LandlordRentalRequest['status']): string {
  switch (status) {
    case 'pending': return 'Chờ duyệt';
    case 'approved': return 'Đã duyệt';
    case 'rejected': return 'Đã từ chối';
    case 'cancelled': return 'Đã hủy';
    default: return status;
  }
}

export function getRentalRequestStatusColor(status: LandlordRentalRequest['status']): string {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'approved': return 'bg-green-100 text-green-800';
    case 'rejected': return 'bg-red-100 text-red-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
