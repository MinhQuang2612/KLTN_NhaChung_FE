export type Address = {
  city: string;
  district: string;
  ward: string;
  street?: string;
  houseNumber?: string;
  showHouseNumber?: boolean;
};
export type PhongTroData = {
  addr: Address | null;
  furniture: "" | "full" | "co-ban" | "trong";
  area: number;
  price: number;
  deposit: number;
  title: string;
  desc: string;
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
};
