import { Address } from "./RentPost";

export type FurnitureType = "full" | "co-ban" | "trong";
export type DirectionType = "dong" | "tay" | "nam" | "bac" | "dong-bac" | "dong-nam" | "tay-bac" | "tay-nam";
export type LegalStatusType = "co-so-hong" | "dang-ky" | "chua-dang-ky";

export type ChungCuInfo = {
  buildingName: string;
  blockOrTower: string;
  floorNumber: number;
  unitCode: string;
  propertyType: string;
  bedrooms?: number;
  bathrooms?: number;
};

export type NhaNguyenCanInfo = {
  khuLo: string;
  unitCode: string;
  propertyType: string;
  totalFloors: number;
  landArea: number;
  usableArea: number;
  width: number;
  length: number;
  features: string[];
  bedrooms?: number;
  bathrooms?: number;
  direction?: DirectionType;
  legalStatus?: LegalStatusType;
};

export type Utilities = {
  electricityPricePerKwh?: number;
  waterBillingType?: "per_m3" | "per_person";
  waterPrice?: number;
  internetFee?: number;
  garbageFee?: number;
  cleaningFee?: number;
  parkingMotorbikeFee?: number;
  parkingCarFee?: number;
  managementFee?: number;
  managementFeeUnit?: "per_month" | "per_m2_per_month";
  gardeningFee?: number;
  cookingGasFee?: number;
  includedInRent?: {
    electricity?: boolean;
    water?: boolean;
    internet?: boolean;
    garbage?: boolean;
    cleaning?: boolean;
    parkingMotorbike?: boolean;
    parkingCar?: boolean;
    managementFee?: boolean;
  };
};

export type Room = {
  id?: number;
  roomId?: number; // Backend trả về roomId
  buildingId: number;
  roomNumber: string;
  category: "phong-tro" | "chung-cu" | "nha-nguyen-can";
  floor?: number;
  area: number;
  price: number;
  deposit: number;
  furniture: FurnitureType;
  bedrooms?: number;
  bathrooms?: number;
  direction?: DirectionType;
  legalStatus?: LegalStatusType;
  address: Address;
  maxOccupancy: number;
  canShare: boolean;
  sharePrice?: number;
  currentOccupants: number;
  availableSpots: number;
  status: 'available' | 'occupied' | 'maintenance';
  chungCuInfo?: ChungCuInfo;
  nhaNguyenCanInfo?: NhaNguyenCanInfo;
  utilities?: Utilities;
  images: string[];
  videos?: string[];
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  landlordId: number;
  building?: {
    id: number;
    name: string;
    buildingType: string;
  };
};

export type CreateRoomPayload = {
  buildingId: number;
  roomNumber: string;
  category?: "phong-tro" | "chung-cu" | "nha-nguyen-can";
  floor?: number;
  area: number;
  price: number;
  deposit: number;
  furniture: FurnitureType;
  bedrooms?: number;
  bathrooms?: number;
  direction?: DirectionType;
  legalStatus?: LegalStatusType;
  address: Address;
  maxOccupancy: number;
  canShare: boolean;
  sharePrice?: number;
  chungCuInfo?: ChungCuInfo;
  nhaNguyenCanInfo?: NhaNguyenCanInfo;
  utilities?: Utilities;
  images: string[];
  videos?: string[];
  description: string;
};

export type UpdateRoomPayload = Partial<CreateRoomPayload> & {
  status?: 'available' | 'occupied' | 'maintenance';
};

export type SoftDeletePayload = {
  isActive: boolean;
};

export type RoomListResponse = {
  rooms: Room[];
  total: number;
  page: number;
  limit: number;
};

export type RoomListParams = {
  buildingId?: number;
  page?: number;
  limit?: number;
  search?: string;
};
