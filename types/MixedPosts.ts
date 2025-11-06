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
  // Chỉ lấy bedrooms/bathrooms cho chung cư và nhà nguyên căn, không lấy cho phòng trọ
  const isPhongTro = post.category === 'phong-tro';
  const bedrooms = isPhongTro ? undefined : post.basicInfo.bedrooms;
  const bathrooms = isPhongTro ? undefined : post.basicInfo.bathrooms;
  
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
    bedrooms,
    bathrooms,
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
    price: (post as any).currentRoom?.price,
    area: (post as any).currentRoom?.area,
    location: addressService.formatWardCity((post as any).currentRoom?.address),
    address: (post as any).currentRoom?.address,
    category: 'roommate',
    photoCount: post.images?.length || 0,
    isVerified: false, // Roommate posts không có verification
    createdAt: post.createdAt,
    originalData: post
  };
}

// Convert từ Post (API mới: services/posts.searchPosts hoặc getPosts) sang UnifiedPost
// Hỗ trợ trường hợp post liên kết roomId và cần roomData để lấy area/price/address/images
export function searchPostToUnified(post: any, roomData?: any): UnifiedPost {
  const mappedPostType = post.postType === 'cho-thue' ? 'rent' : 
                         post.postType === 'tim-o-ghep' ? 'roommate' : post.postType;

  const images = roomData?.images?.length > 0 ? roomData.images : (post.images || ["/home/room1.png"]);
  const price = roomData?.price ?? post.roomInfo?.basicInfo?.price ?? 0;
  const area = roomData?.area ?? post.roomInfo?.basicInfo?.area ?? 0;
  const address = roomData?.address ?? post.roomInfo?.address;
  const location = address ? addressService.formatWardCity(address) : 'Chưa xác định';
  
  // Chỉ lấy bedrooms/bathrooms cho chung cư và nhà nguyên căn, không lấy cho phòng trọ
  const roomType = roomData?.roomType || post.category || '';
  const category = post.category || mappedPostType;
  const isPhongTro = roomType === 'phong-tro' || category === 'phong-tro';
  
  let bedrooms: number | undefined = undefined;
  let bathrooms: number | undefined = undefined;
  if (!isPhongTro) {
    bedrooms = roomData?.chungCuInfo?.bedrooms || roomData?.nhaNguyenCanInfo?.bedrooms || post.roomInfo?.basicInfo?.bedrooms;
    bathrooms = roomData?.chungCuInfo?.bathrooms || roomData?.nhaNguyenCanInfo?.bathrooms || post.roomInfo?.basicInfo?.bathrooms;
  }

  return {
    id: post.postId,
    type: mappedPostType,
    title: post.title || 'Không có tiêu đề',
    description: post.description || '',
    images,
    price,
    area,
    location,
    address,
    category: category,
    photoCount: images.length + (post.videos?.length || 0),
    bedrooms,
    bathrooms,
    isVerified: false,
    createdAt: post.createdAt,
    originalData: post,
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

