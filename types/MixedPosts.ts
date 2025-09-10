import { RentPostApi } from "./RentPostApi";
import type { Address } from "./RentPost";
import { addressService } from "../services/address";
import { RoommatePost } from "../services/roommatePosts";

// Unified type cho hiển thị cả rent posts và roommate posts
export interface UnifiedPost {
  id: number;
  type: 'rent' | 'roommate';
  title: string;
  description: string;
  images: string[];
  price: number;
  area: number;
  location: string; // short display: ward + city
  address?: Address; // full address object for components cần chi tiết
  category?: string; // chỉ có cho rent posts
  photoCount: number;
  bedrooms?: number;
  bathrooms?: number;
  isVerified?: boolean;
  createdAt: string;
  
  // Original data để có thể truy cập thêm thông tin nếu cần
  originalData: RentPostApi | RoommatePost;
}

// Helper functions để convert
export function rentPostToUnified(post: RentPostApi): UnifiedPost {
  return {
    id: post.rentPostId,
    type: 'rent',
    title: post.title,
    description: post.description,
    images: post.images || ["/home/room1.png"],
    price: post.basicInfo.price,
    area: post.basicInfo.area,
    location: addressService.formatWardCity(post.address),
    address: post.address,
    category: post.category,
    photoCount: (post.images?.length || 0) + (post.videos?.length || 0),
    bedrooms: post.basicInfo.bedrooms,
    bathrooms: post.basicInfo.bathrooms,
    isVerified: post.isVerified,
    createdAt: post.createdAt,
    originalData: post
  };
}

export function roommatePostToUnified(post: RoommatePost): UnifiedPost {
  return {
    id: (post as any).roommatePostId || post.postId,
    type: 'roommate',
    title: post.title,
    description: post.description,
    images: post.images || ["/home/room1.png"],
    price: post.currentRoom.price,
    area: post.currentRoom.area,
    location: addressService.formatWardCity(post.currentRoom.address),
    address: post.currentRoom.address,
    category: 'roommate',
    photoCount: post.images?.length || 0,
    isVerified: false, // Roommate posts không có verification
    createdAt: post.createdAt,
    originalData: post
  };
}

// Helper để shuffle array với Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

