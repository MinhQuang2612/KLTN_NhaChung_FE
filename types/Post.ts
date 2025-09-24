// Post Types theo API guide mới
export type PostType = 'rent' | 'roommate';

export type PostStatus = 'pending' | 'active' | 'inactive' | 'rejected';

export type PostSource = 'room_management' | 'manual_post' | 'user_post';

export interface PersonalInfo {
  fullName: string;
  age: number;
  dateOfBirth: string; // ISO 8601 date string
  gender: 'male' | 'female' | 'other';
  occupation: string;
  hobbies: string[];
  habits: string[];
  lifestyle: 'early' | 'normal' | 'late';
  cleanliness: 'very_clean' | 'clean' | 'normal' | 'flexible';
}

export interface Requirements {
  ageRange: [number, number];
  gender: 'male' | 'female' | 'any';
  traits: string[];
  maxPrice: number;
}

export interface RoomInfo {
  address: {
    street: string;
    ward: string;
    city: string;
    provinceCode: string;
    provinceName: string;
    wardCode?: string;
    wardName?: string;
  };
  basicInfo: {
    area: number;
    price: number;
    deposit: number;
    furniture: string;
    bedrooms: number;
    bathrooms: number;
    direction: string;
    legalStatus: string;
  };
  chungCuInfo?: {
    buildingName: string;
    blockOrTower: string;
    floorNumber: number;
    unitCode: string;
    propertyType: string;
  };
  nhaNguyenCanInfo?: {
    khuLo: string;
    unitCode: string;
    propertyType: string;
    totalFloors: number;
    landArea: number;
    usableArea: number;
    width: number;
    length: number;
    features: string[];
  };
  utilities: {
    electricityPricePerKwh?: number;
    waterPrice?: number;
    internetFee?: number;
    garbageFee?: number;
    [key: string]: any;
  };
}

export interface Post {
  postId: number;
  userId: number;
  postType: PostType;
  
  // Thông tin bài đăng
  title: string;
  description: string;
  images: string[];
  videos: string[];
  
  // Liên kết với room
  roomId?: number;
  buildingId?: number;
  landlordId?: number;
  isManaged: boolean;
  source: PostSource;
  
  // Thông tin phòng (chỉ khi không có roomId)
  roomInfo?: RoomInfo;
  
  // Thông tin riêng cho roommate posts
  personalInfo?: PersonalInfo;
  requirements?: Requirements;
  
  // Liên hệ
  phone: string;
  email: string;
  
  // Trạng thái
  status: PostStatus;
  
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostPayload {
  postType: PostType;
  title: string;
  description: string;
  images?: string[];
  videos?: string[];
  roomId: number; // Required - chọn từ danh sách phòng
  phone: string;
  email: string;
  personalInfo?: PersonalInfo; // Chỉ cho roommate posts
  requirements?: Requirements; // Chỉ cho roommate posts
}

export interface UpdatePostPayload {
  title?: string;
  description?: string;
  images?: string[];
  videos?: string[];
  phone?: string;
  email?: string;
  personalInfo?: PersonalInfo;
  requirements?: Requirements;
}

export interface PostListParams {
  postType?: PostType;
  userId?: number;
  landlordId?: number;
  roomId?: number;
  isManaged?: boolean;
  source?: string;
  status?: PostStatus;
  page?: number;
  limit?: number;
  search?: string;
}

export interface PostSearchParams {
  postType?: PostType;
  keyword?: string;
  minPrice?: number;
  maxPrice?: number;
  gender?: string;
  ageRange?: [number, number];
  location?: string;
  page?: number;
  limit?: number;
}

export interface PostListResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface RoomForPost {
  roomId: number;
  landlordId: number;
  buildingId: number;
  roomNumber: string;
  floor: number;
  category: 'phong-tro' | 'chung-cu' | 'nha-nguyen-can';
  area: number;
  price: number;
  deposit: number;
  furniture: string;
  maxOccupancy: number;
  canShare: boolean;
  sharePrice?: number;
  currentOccupants: number;
  availableSpots: number;
  status: 'available' | 'occupied' | 'maintenance';
  images: string[];
  videos: string[];
  description: string;
  buildingName?: string;
  address?: {
    street: string;
    ward: string;
    city: string;
    provinceCode: string;
    provinceName: string;
    wardCode: string;
    wardName: string;
  };
}
