import { apiGet } from "@/utils/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:3001/api';
const BASE_URL = 'posts/user/rooms';

/**
 * Lấy danh sách phòng của user để tạo post
 * @param postType - 'rent' | 'roommate' | undefined
 */
export async function getLandlordRooms(postType?: 'rent' | 'roommate'): Promise<any[]> {
  // Tạo query string
  const queryParams = new URLSearchParams();
  if (postType) {
    queryParams.append('postType', postType);
  }
  const queryString = queryParams.toString();
  const url = `${BASE_URL}${queryString ? `?${queryString}` : ''}`;
  
  const rooms = await apiGet(url);
  return rooms;
}

/**
 * Lấy thông tin phòng theo ID
 */
export async function getLandlordRoomById(roomId: number): Promise<any> {
  return apiGet(`${BASE_URL}/${roomId}`);
}
