import { Address } from "./RentPost";

export type BuildingType = "chung-cu" | "nha-nguyen-can" | "phong-tro";

export type Building = {
  buildingId: number;
  name: string;
  address: Address;
  totalRooms: number;
  buildingType: BuildingType;
  images: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  landlordId: number;
};

export type CreateBuildingPayload = {
  name: string;
  address: Address;
  totalRooms: number;
  buildingType: BuildingType;
  images: string[];
  description: string;
};

export type UpdateBuildingPayload = Partial<CreateBuildingPayload>;

// Nếu BE trả mảng đơn giản cho danh sách, bỏ type phân trang cũ
export type BuildingsArrayResponse = Building[];
