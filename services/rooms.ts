import { apiGet, apiPost, apiPut, apiDel } from "@/utils/api";
import { 
  Room, 
  CreateRoomPayload, 
  UpdateRoomPayload, 
  RoomListResponse,
  RoomListParams 
} from "@/types/Room";

// Lấy danh sách phòng của landlord
export async function getRooms(params: RoomListParams = {}): Promise<RoomListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.buildingId) searchParams.append('buildingId', params.buildingId.toString());
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  // Include thông tin building
  searchParams.append('include', 'building');
  
  const queryString = searchParams.toString();
  return apiGet(`landlord/rooms${queryString ? `?${queryString}` : ''}`);
}

// Lấy chi tiết phòng
export async function getRoomById(id: number): Promise<Room> {
  return apiGet(`landlord/rooms/${id}?include=building`);
}

// Tạo phòng mới
export async function createRoom(payload: CreateRoomPayload): Promise<Room> {
  return apiPost("landlord/rooms", payload);
}

// Cập nhật phòng
export async function updateRoom(id: number, payload: UpdateRoomPayload): Promise<Room> {
  return apiPut(`landlord/rooms/${id}`, payload);
}

// Xóa phòng (soft delete)
export async function deleteRoom(id: number): Promise<{ message: string }> {
  return apiDel(`landlord/rooms/${id}`);
}

// Upload hình ảnh phòng
export async function uploadRoomImages(images: File[]): Promise<string[]> {
  const formData = new FormData();
  images.forEach((image, index) => {
    formData.append(`images`, image);
  });
  
  return apiPost("upload/room-images", formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

// Lấy danh sách phòng theo dãy
export async function getRoomsByBuilding(
  buildingId: number,
  page: number = 1,
  limit: number = 10
): Promise<RoomListResponse> {
  return getRooms({ buildingId, page, limit });
}
