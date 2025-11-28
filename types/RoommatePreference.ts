import { Requirements } from './Post';

export interface RoommatePreference {
  enabled: boolean;
  postId: number | null;
  postStatus: 'pending' | 'active' | 'inactive' | null;
  requirements: Requirements | null;
  posterAge?: number; // ⭐ Tuổi của Poster từ verification (read-only)
  posterGender?: string; // ⭐ Giới tính của Poster từ verification (read-only)
  posterTraits?: string[]; // ⭐ Traits của Poster
  posterSmoking?: 'smoker' | 'non_smoker' | null;  // ⭐ Mới
  posterPets?: 'has_pets' | 'no_pets' | null;      // ⭐ Mới
}

export interface CreateRoommatePreferenceDto {
  enabled: boolean;
  requirements?: Requirements;
  posterTraits?: string[]; // ⭐ Traits của chính Poster (User A)
  posterSmoking?: 'smoker' | 'non_smoker';  // ⭐ Mới - Thông tin của Poster
  posterPets?: 'has_pets' | 'no_pets';      // ⭐ Mới - Thông tin của Poster
}

export interface SeekerPreferenceResponse {
  hasPreferences: boolean;
  requirements: {
    ageRange: [number, number];
    gender: 'male' | 'female' | 'any';
    traits: string[];
    maxPrice: number;
    smokingPreference?: 'smoker' | 'non_smoker' | 'any';  // ⭐ Mới
    petsPreference?: 'has_pets' | 'no_pets' | 'any';      // ⭐ Mới
  } | null;
  seekerTraits: string[] | null;
  seekerAge?: number; // ⭐ Tuổi đã lưu từ verification
  seekerGender?: string; // ⭐ Giới tính đã lưu từ verification ('male' | 'female' | 'other')
  seekerSmoking?: 'smoker' | 'non_smoker';  // ⭐ Mới
  seekerPets?: 'has_pets' | 'no_pets';      // ⭐ Mới
  updatedAt?: string;
}

export interface RoomMatch {
  postId: number;
  roomId: number;
  posterId: number;
  posterName: string;
  posterAge: number;
  posterGender: string;
  posterOccupation: string;
  roomNumber: string;
  buildingName: string;
  address: string;
  price: number;
  area: number;
  traits: string[];
  matchScore: number;
  images: string[];
}

export interface FindRoommateDto {
  ageRange: [number, number];
  gender: 'male' | 'female' | 'any';
  traits?: string[]; // ⭐ Traits của User B (Seeker)
  maxPrice: number;
  smokingPreference?: 'smoker' | 'non_smoker' | 'any';  // ⭐ Mới - Yêu cầu về Poster
  petsPreference?: 'has_pets' | 'no_pets' | 'any';      // ⭐ Mới - Yêu cầu về Poster
  personalInfo?: {
    fullName?: string;
    // ❌ KHÔNG GỬI age và gender NỮA - Backend tự động lấy từ verification
    occupation?: string;
    hobbies?: string[];
    // ⚠️ Bỏ habits - không dùng nữa, dùng traits ở root level
    lifestyle?: 'early' | 'normal' | 'late';
    cleanliness?: 'very_clean' | 'clean' | 'normal' | 'flexible';
    smoking?: 'smoker' | 'non_smoker';    // ⭐ Mới - Thông tin của Seeker
    pets?: 'has_pets' | 'no_pets';        // ⭐ Mới - Thông tin của Seeker
  };
}

export interface FindRoommateResponse {
  matches: RoomMatch[];
  totalMatches: number;
  message?: string; // ⭐ Message khi chưa có preferences
}

export interface MatchingRequest {
  requestId: number;
  seekerId: number;
  postId: number;
  roomId: number;
  posterId: number;
  status: 'pending' | 'accepted' | 'rejected';
  matchScore: number;
  seekerAccepted?: boolean;
  posterAccepted?: boolean;
  createdAt: string;
  updatedAt: string;
  seeker?: {
    userId: number;
    name: string;
    age?: number;
    gender?: string;
    occupation?: string;
    traits?: string[];
  };
  post?: {
    postId: number;
    title: string;
    status: string;
  };
  room?: {
    roomId: number;
    roomNumber: string;
    buildingName?: string;
    address?: string;
  };
}

export interface CreateMatchingRequestDto {
  postId: number;
  roomId: number;
  posterId: number;
  requirements: Requirements;
}

export interface MatchingRequestsResponse {
  requests: MatchingRequest[];
  total: number;
}

