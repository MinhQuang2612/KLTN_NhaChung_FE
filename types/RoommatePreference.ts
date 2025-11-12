import { Requirements } from './Post';

export interface RoommatePreference {
  enabled: boolean;
  postId: number | null;
  postStatus: 'pending' | 'active' | 'inactive' | null;
  requirements: Requirements | null;
}

export interface CreateRoommatePreferenceDto {
  enabled: boolean;
  requirements?: Requirements;
  posterTraits?: string[]; // ⭐ Traits của chính Poster (User A)
}

export interface SeekerPreferenceResponse {
  hasPreferences: boolean;
  requirements: {
    ageRange: [number, number];
    gender: 'male' | 'female' | 'any';
    traits: string[];
    maxPrice: number;
  } | null;
  seekerTraits: string[] | null;
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
  personalInfo?: {
    fullName?: string;
    age?: number;
    gender?: 'male' | 'female' | 'other';
    occupation?: string;
    hobbies?: string[];
    // ⚠️ Bỏ habits - không dùng nữa, dùng traits ở root level
    lifestyle?: 'early' | 'normal' | 'late';
    cleanliness?: 'very_clean' | 'clean' | 'normal' | 'flexible';
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

