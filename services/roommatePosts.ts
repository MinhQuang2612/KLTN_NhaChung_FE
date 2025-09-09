import { apiGet, apiPost } from "@/utils/api";

// Types cho Roommate Posts
export interface RoommatePost {
  postId?: number; // Backward compatibility
  roommatePostId?: number; // Actual backend field
  userId: number;
  title: string;
  description: string;
  images: string[];
  currentRoom: {
    address: string;
    price: number;
    area: number;
    description: string;
  };
  personalInfo: {
    age: number;
    gender: 'male' | 'female' | 'other';
    occupation: string;
    hobbies: string[];
    habits: string[];
  };
  requirements: {
    ageRange: [number, number];
    gender: 'male' | 'female' | 'any';
    traits: string[];
    maxPrice: number;
  };
  status: 'searching' | 'found' | 'inactive';
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
