import { Address } from "./RentPost";

export type Category = "phong-tro" | "chung-cu" | "nha-nguyen-can";
export type CategoryId = Category;

export type BasicInfo = {
  area: number;
  price: number;
  deposit?: number;
  furniture?: string;
  bedrooms?: number;
  bathrooms?: number;
  direction?: string;
  legalStatus?: string;
};

export type ChungCuInfo = {
  buildingName?: string;
  blockOrTower?: string;
  floorNumber?: number;
  unitCode?: string;
  propertyType?: string;
};

export type NhaNguyenCanInfo = {
  khuLo?: string;
  unitCode?: string;
  propertyType?: string;
  totalFloors?: number;
  landArea?: number;
  usableArea?: number;
  width?: number;
  length?: number;
};

export type RentPostApi = {
  _id: string;
  rentPostId: number;
  userId: number;
  title: string;
  description: string;
  images: string[];
  videos: string[];
  address: Address;
  category: Category;
  basicInfo: BasicInfo;
  chungCuInfo?: ChungCuInfo;
  nhaNguyenCanInfo?: NhaNguyenCanInfo;
  status: "active" | "inactive" | "pending";
  createdAt: string;
  updatedAt: string;
  __v?: number;
  isVerified?: boolean;
};

// Cho RoomCard
export type RoomCardData = {
  rentPostId: number;
  category: Category;
  title: string;
  cover: string;
  photoCount: number;
  area?: number;
  bedrooms?: number;
  bathrooms?: number;
  district?: string;
  city?: string;
  price?: number;
  isVerified?: boolean;
};
