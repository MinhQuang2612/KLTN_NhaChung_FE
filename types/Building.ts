import { Address } from "./RentPost";

export type BuildingType = "chung-cu" | "nha-nguyen-can" | "phong-tro";

export type Building = {
  id: number;
  name: string;
  address: Address;
  totalFloors: number;
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
  totalFloors: number;
  totalRooms: number;
  buildingType: BuildingType;
  images: string[];
  description: string;
};

export type UpdateBuildingPayload = Partial<CreateBuildingPayload>;

export type BuildingListResponse = {
  buildings: Building[];
  total: number;
  page: number;
  limit: number;
};
