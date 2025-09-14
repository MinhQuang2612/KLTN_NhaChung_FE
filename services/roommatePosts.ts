import { apiGet, apiPost, apiPut } from "@/utils/api";
import { Address } from "./address";

// Types cho Roommate Posts - Updated theo API Guide
export interface RoommatePost {
  postId?: number; // Backward compatibility
  roommatePostId?: number; // Actual backend field
  userId: number;
  title: string;
  description: string;
  images: string[];
  video?: string; // Video giới thiệu bản thân
  currentRoom: {
    address: Address;
    price: number; // bắt buộc theo API Guide
    area: number;
    description: string;
    roomType?: 'single' | 'double' | 'shared';
    currentOccupants?: number;
    remainingDuration?: '1-3 months' | '3-6 months' | '6-12 months' | 'over_1_year';
    // Utilities for roommate posts (optional)
    shareMethod?: 'split_evenly' | 'by_usage';
    estimatedMonthlyUtilities?: number;
    capIncludedAmount?: number;
    electricityPricePerKwh?: number;
    waterPrice?: number;
    waterBillingType?: 'per_m3' | 'per_person';
    internetFee?: number;
    garbageFee?: number;
    cleaningFee?: number;
  };
  personalInfo: {
    fullName: string;
    dateOfBirth: string; // Format: YYYY-MM-DD
    gender: 'male' | 'female' | 'other';
    occupation: string;
    hobbies: string[];
    habits: string[];
    lifestyle?: 'early' | 'normal' | 'late';
    cleanliness?: 'very_clean' | 'clean' | 'normal' | 'flexible';
  };
  requirements: {
    ageRange: [number, number]; // Vẫn giữ ageRange cho requirements
    gender: 'male' | 'female' | 'any';
    traits: string[];
    maxPrice: number;
  };
  phone?: string;
  email?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

/**
 * Get all roommate posts
 */
export async function listRoommatePosts(params: Record<string, any> = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.append(k, String(v));
  });
  const url = `roommate-posts${qs.toString() ? `?${qs.toString()}` : ""}`;
  return apiGet<RoommatePost[]>(url);
}

/**
 * Get roommate post by ID
 */
export async function getRoommatePostById(id: number) {
  return apiGet<RoommatePost>(`roommate-posts/${id}`);
}

/**
 * Create roommate post
 */
export async function createRoommatePost(data: Partial<RoommatePost>) {
  return apiPost<RoommatePost>('roommate-posts', data);
}

/**
 * Update roommate post
 */
export async function updateRoommatePost(id: number, data: Partial<RoommatePost>) {
  return apiPut<RoommatePost>(`roommate-posts/${id}`, data);
}
