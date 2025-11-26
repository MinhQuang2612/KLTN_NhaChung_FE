import { apiGet, apiPost, apiPut, apiDel } from "@/utils/api";
import { 
  Building, 
  CreateBuildingPayload, 
  UpdateBuildingPayload, 
  BuildingsArrayResponse 
} from "@/types/Building";

// Lấy danh sách dãy của landlord
export async function getBuildings(page?: number, limit?: number, search?: string): Promise<BuildingsArrayResponse | { buildings: Building[]; total: number; page: number; limit: number }> {
  // Hỗ trợ cả 2 format: [] hoặc { buildings, total, page, limit }
  const params = new URLSearchParams();
  if (page) params.append("page", String(page));
  if (limit) params.append("limit", String(limit));
  if (search) params.append("search", search);
  const qs = params.toString();
  const path = qs ? `landlord/buildings?${qs}` : `landlord/buildings`;
  const res = await apiGet<any>(path, { cache: 'no-store' });
  if (Array.isArray(res)) return res as BuildingsArrayResponse;
  if (res && Array.isArray(res.buildings)) return res.buildings as BuildingsArrayResponse;
  return [];
}

// Lấy chi tiết dãy
export async function getBuildingById(id: number): Promise<Building> {
  return apiGet(`landlord/buildings/${id}`);
}

// Tạo dãy mới
export async function createBuilding(payload: CreateBuildingPayload): Promise<Building> {
  return apiPost("landlord/buildings", payload);
}

// Cập nhật dãy
export async function updateBuilding(id: number, payload: UpdateBuildingPayload): Promise<Building> {
  return apiPut(`landlord/buildings/${id}`, payload);
}

// Xóa dãy (soft delete)
export async function deleteBuilding(id: number): Promise<{ message: string }> {
  return apiDel(`landlord/buildings/${id}`);
}

// Upload hình ảnh dãy
export async function uploadBuildingImages(images: File[]): Promise<string[]> {
  const formData = new FormData();
  images.forEach((image, index) => {
    formData.append(`images`, image);
  });
  
  return apiPost("upload/building-images", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}
