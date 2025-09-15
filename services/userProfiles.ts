import { apiGet, apiPatch, apiPost } from "@/utils/api";

// Cho phép điền từng ô (min/max) theo thời gian, validate đầy đủ trước khi submit ở BE
export interface BudgetRange { min?: number; max?: number }

export interface UserProfile {
  profileId?: number;
  userId?: number;
  dateOfBirth?: string; // Format: YYYY-MM-DD
  gender?: string; // Raw value from FE, no enum constraint
  occupation?: string;
  income?: number;
  currentLocation?: string;
  preferredDistricts?: string[];
  preferredWards?: string[];
  preferredWardCodes?: string[];
  budgetRange?: BudgetRange;
  roomType?: string[];
  amenities?: string[];
  lifestyle?: string; // Raw value from FE, no enum constraint
  smoking?: boolean;
  pets?: boolean;
  cleanliness?: number;
  socialLevel?: number;
  // landlord specific
  businessType?: string; // Raw value from FE, no enum constraint
  experience?: string; // Raw value from FE, no enum constraint
  propertyTypes?: string[];
  targetDistricts?: string[];
  targetWards?: string[];
  targetWardCodes?: string[];
  targetCityCode?: string;
  targetCityName?: string;
  priceRange?: BudgetRange;
  targetTenants?: string[];
  managementStyle?: string; // Raw value from FE, no enum constraint
  responseTime?: string; // Raw value from FE, no enum constraint
  additionalServices?: string[];
  businessLicense?: string;
  taxCode?: string;
  bankAccount?: { bankName: string; accountNumber: string; accountHolder: string };
  contactMethod?: string[];
  availableTime?: { weekdays?: string; weekends?: string };
}

export function createProfile(data: UserProfile) {
  return apiPost<UserProfile>("user-profiles/me", data);
}

// Tạo profile không cần token (cho registration flow)
export function createProfilePublic(data: UserProfile) {
  // Chỉ gửi profile data với userId thật
  return apiPost<UserProfile>("user-profiles", data, { skipAuth: true });
}

// Fallback: Tạo profile với API khác nếu cần
export function createProfilePublicFallback(data: UserProfile & { email: string }) {
  // Gọi API trực tiếp không qua wrapper
  const API_BASE = process.env.NEXT_PUBLIC_API_URL!;
  const url = `${API_BASE}/user-profiles`;
  
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Không có Authorization header
    },
    body: JSON.stringify(data),
  }).then(async (res) => {
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP ${res.status}: ${errorText}`);
    }
    return res.json();
  });
}

export function getMyProfile() {
  return apiGet<UserProfile>("user-profiles/me");
}

export function updateMyProfile(data: Partial<UserProfile>) {
  return apiPatch<UserProfile>("user-profiles/me", data as any);
}


