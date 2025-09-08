import {
  Address,
  PhongTroData,
  NhaNguyenCanData,
  ChungCuData,
} from "./RentPost";
/** init - CẬP NHẬT VỚI KIỂU DỮ LIỆU MỚI */
export const initPhongTro: PhongTroData = {
  addr: null,
  furniture: "",
  area: 0, // ✅ Đổi từ "" sang 0
  price: 0, // ✅ Đổi từ "" sang 0
  deposit: 0, // ✅ Đổi từ "" sang 0
  title: "",
  desc: "",
};

export const initChungCu: ChungCuData = {
  buildingName: "",
  addr: null,
  blockOrTower: "",
  floorNumber: 0, // ✅ Đổi từ "" sang 0
  unitCode: "",
  propertyType: "", // ✅ Đổi từ loaiHinh
  bedrooms: 0, // ✅ Đổi từ soPhongNgu
  bathrooms: 0, // ✅ Đổi từ soVeSinh
  direction: "", // ✅ Đổi từ huong
  furniture: "", // ✅ Đổi từ noiThat
  legalStatus: "", // ✅ Đổi từ tinhTrangSo
  area: 0, // ✅ Đổi từ "" sang 0
  price: 0, // ✅ Đổi từ "" sang 0
  deposit: 0, // ✅ Đổi từ "" sang 0
  title: "",
  desc: "",
};

export const initNNC: NhaNguyenCanData = {
  addr: null,
  khuLo: "",
  unitCode: "",
  propertyType: "", // ✅ Đổi từ loaiHinh
  bedrooms: 0, // ✅ Đổi từ soPhongNgu
  bathrooms: 0, // ✅ Đổi từ soVeSinh
  direction: "", // ✅ Đổi từ huong
  totalFloors: 0, // ✅ Đổi từ tongSoTang
  furniture: "", // ✅ Đổi từ noiThat
  legalStatus: "", // ✅ Đổi từ tinhTrangSo
  landArea: 0, // ✅ Đổi từ dtDat
  usableArea: 0, // ✅ Đổi từ dtSuDung
  width: 0, // ✅ Đổi từ ngang
  length: 0, // ✅ Đổi từ dai
  price: 0, // ✅ Đổi từ "" sang 0
  deposit: 0, // ✅ Đổi từ "" sang 0
  title: "",
  desc: "",
  features: [], // ✅ Đổi từ featureSet
};
