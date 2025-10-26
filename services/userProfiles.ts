import { apiGet, apiPatch, apiPost } from "@/utils/api";

// Cho phép điền từng ô (min/max) theo thời gian, validate đầy đủ trước khi submit ở BE
export interface BudgetRange { min?: number; max?: number }

export interface UserProfile {
  profileId?: number;
  userId?: number;
  
  // Chỉ còn 6 trường theo yêu cầu
  preferredCity?: string;
  preferredWards?: string[];
  roomType?: string[];
  contactMethod?: string[];
  occupation?: string;
  pets?: boolean;
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


