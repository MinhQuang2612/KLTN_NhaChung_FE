import { apiGet } from "@/utils/api";

export interface DashboardSummaryResponse {
  contracts: {
    total: number;
    active: number;
    expired: number;
    expiringSoon: number;
    terminated?: number;
  };
  revenue: {
    totalPaid: number;
    byMonth: Array<{ year: number; month: number; amount: number }>;
  };
  rooms: {
    total: number;
    available: number;
    occupied: number;
  };
  posts: {
    total: number;
    byStatus: Record<string, number>;
  };
}

export async function getLandlordDashboardSummary(params?: { from?: string; to?: string }): Promise<DashboardSummaryResponse> {
  const search = new URLSearchParams();
  if (params?.from) search.append("from", params.from);
  if (params?.to) search.append("to", params.to);
  const qs = search.toString();
  return apiGet(`landlord/dashboard/summary${qs ? `?${qs}` : ""}`);
}


