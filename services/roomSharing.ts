import { apiGet, apiPost, apiPut } from '@/utils/api';

// Interfaces
export interface CreateRoomSharingRequestData {
  message: string;
  requestedMoveInDate: string;
  requestedDuration: number;
}

export interface RoomSharingRequest {
  requestId: number;
  tenantId: number;
  landlordId: number;
  roomId: number;
  posterId: number;
  requestType: 'room_sharing';
  status: 'pending_user_approval' | 'pending_landlord_approval' | 'approved' | 'rejected';
  message: string;
  requestedMoveInDate: string;
  requestedDuration: number;
  contractId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSharingContract {
  contractId: number;
  roomId: number;
  landlordId: number;
  contractType: 'shared';
  status: 'active' | 'expired' | 'cancelled';
  isPrimaryTenant: false;
  monthlyRent: 0;
  deposit: 0;
  tenants: Array<{
    tenantId: number;
    moveInDate: string;
    monthlyRent: 0;
    deposit: 0;
    status: 'active' | 'inactive';
    isPrimaryTenant: false;
  }>;
  roomInfo: {
    roomNumber: string;
    area: number;
    maxOccupancy: number;
    currentOccupancy: number;
  };
  startDate: string;
  endDate: string;
  createdAt: string;
}

// API Functions
export async function createRoomSharingRequest(
  roomId: number, 
  requestData: CreateRoomSharingRequestData & { postId: number }
): Promise<RoomSharingRequest> {
  return apiPost(`rooms/${roomId}/sharing-request`, requestData);
}

export async function getSharingRequestsToApprove(): Promise<RoomSharingRequest[]> {
  return apiGet('users/me/sharing-requests-to-approve');
}

export async function getSharingRequestsHistory(): Promise<RoomSharingRequest[]> {
  return apiGet('users/me/sharing-requests-history');
}

export async function approveSharingRequestByUser(requestId: number): Promise<RoomSharingRequest> {
  return apiPut(`users/rental-requests/${requestId}/approve-by-user`);
}

export async function rejectSharingRequestByUser(requestId: number): Promise<RoomSharingRequest> {
  return apiPut(`users/rental-requests/${requestId}/reject-by-user`);
}

export async function getLandlordSharingRequests(): Promise<RoomSharingRequest[]> {
  return apiGet('landlord/room-sharing-requests');
}

export async function approveSharingRequestByLandlord(requestId: number): Promise<{ request: RoomSharingRequest; contract: RoomSharingContract }> {
  return apiPut(`landlord/room-sharing-requests/${requestId}/approve`);
}

export async function rejectSharingRequestByLandlord(requestId: number): Promise<RoomSharingRequest> {
  return apiPut(`landlord/room-sharing-requests/${requestId}/reject`);
}

export async function getMySharingRequests(): Promise<RoomSharingRequest[]> {
  return apiGet('users/me/room-sharing-requests');
}

export async function getRoomSharingContract(contractId: number): Promise<RoomSharingContract> {
  return apiGet(`users/me/contracts/${contractId}`);
}
