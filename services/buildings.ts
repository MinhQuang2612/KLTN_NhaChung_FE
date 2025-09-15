import { apiGet, apiPost, apiPut, apiDel } from "@/utils/api";
import { 
  Building, 
  CreateBuildingPayload, 
  UpdateBuildingPayload, 
  BuildingListResponse 
} from "@/types/Building";

// Lấy danh sách dãy của landlord
export async function getBuildings(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<BuildingListResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  
  if (search) {
    params.append('search', search);
  }
  
  return apiGet(`landlord/buildings?${params.toString()}`);
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
