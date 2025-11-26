export type Address = {
  street?: string; // Optional theo API guide
  ward: string;
  city: string;
  specificAddress?: string; // Thay thế houseNumber
  showSpecificAddress?: boolean; // Thay thế showHouseNumber
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  additionalInfo?: string;
};

// Utilities common
export type UtilitiesBase = {
  electricityPricePerKwh?: number; // đ/kWh
  waterBillingType?: "per_m3" | "per_person"; // kiểu tính nước
  waterPrice?: number; // đ/m³ hoặc đ/người
  internetFee?: number; // đ/tháng
  garbageFee?: number; // đ/tháng
  cleaningFee?: number; // đ/tháng
  includedInRent?: {
    electricity?: boolean;
    water?: boolean;
    internet?: boolean;
    garbage?: boolean;
    cleaning?: boolean;
    management?: boolean; // cho CC/NNC
  };
};

export type CondoHouseExtraUtilities = {
  managementFee?: number; // phí QL
  managementFeeUnit?: "per_month" | "per_m2_per_month";
  parkingCarFee?: number;
};

export type HouseOnlyUtilities = {
  gardeningFee?: number;
};

export type PhongTroUtilities = UtilitiesBase;
export type ChungCuUtilities = UtilitiesBase & CondoHouseExtraUtilities;
export type NhaNguyenCanUtilities = UtilitiesBase & CondoHouseExtraUtilities & HouseOnlyUtilities;

export type PhongTroData = {
  addr: Address | null;
  furniture: "" | "full" | "co-ban" | "trong";
  area: number;
  price: number;
  deposit: number;
  title: string;
  desc: string;
  utilities?: PhongTroUtilities;
};

export type ChungCuData = {
  buildingName: string;
  addr: Address | null;
  blockOrTower: string;
  floorNumber: number;
  unitCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  furniture: string;
  legalStatus: string;
  area: number;
  price: number;
  deposit: number;
  title: string;
  desc: string;
  utilities?: ChungCuUtilities;
};

export type NhaNguyenCanData = {
  addr: Address | null;
  khuLo: string;
  unitCode: string;
  propertyType: string;
  bedrooms: number;
  bathrooms: number;
  direction: string;
  totalFloors: number;
  furniture: string;
  legalStatus: string;
  landArea: number;
  usableArea: number;
  width: number;
  length: number;
  price: number;
  deposit: number;
  title: string;
  desc: string;
  features: string[];
  utilities?: NhaNguyenCanUtilities;
};
