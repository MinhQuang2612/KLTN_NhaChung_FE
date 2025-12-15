import { apiGet } from "@/utils/api";

export interface LandlordRentalHistoryItem {
  contractId: number;
  roomId: number;
  roomNumber: string;
  buildingName: string;
  buildingId: number;
  address?: string;
  activePostId?: number | null;
  roomStatus?: "available" | "occupied" | "unknown";
  canRentAgain?: boolean;
  contractStatus: "expired" | "terminated";
  startDate: string;
  endDate: string;
  actualEndDate: string;
  monthlyRent: number;
  deposit: number;
  area: number;
  images?: string[];
  tenantInfo?: {
    tenantId: number;
    name: string;
    phone: string;
    email: string;
  };
  terminationReason?: string;
  terminatedAt?: string;
  totalMonthsRented?: number;
  totalAmountPaid?: number;
}

export interface LandlordRentalHistoryResponse {
  history: LandlordRentalHistoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export async function getLandlordRentalHistory(params?: {
  page?: number;
  limit?: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<LandlordRentalHistoryResponse> {
  const searchParams = new URLSearchParams();

  if (params?.page) searchParams.append("page", params.page.toString());
  if (params?.limit) searchParams.append("limit", params.limit.toString());
  if (params?.status) searchParams.append("status", params.status);
  if (params?.sortBy) searchParams.append("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.append("sortOrder", params.sortOrder);

  const queryString = searchParams.toString();
  return apiGet(
    `landlord/rental-history${queryString ? `?${queryString}` : ""}`
  );
}

