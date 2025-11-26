import { apiGet, apiPost, apiPut } from '@/utils/api';
import {
  RoommatePreference,
  CreateRoommatePreferenceDto,
  FindRoommateDto,
  FindRoommateResponse,
  MatchingRequest,
  CreateMatchingRequestDto,
  MatchingRequestsResponse,
  SeekerPreferenceResponse,
} from '@/types/RoommatePreference';
import { Post } from '@/types/Post';

/**
 * Lấy preference của phòng
 */
export async function getRoommatePreference(roomId: number): Promise<RoommatePreference> {
  try {
    return await apiGet<RoommatePreference>(`users/rooms/${roomId}/roommate-preference`);
  } catch (error: any) {
    // Nếu không tìm thấy (404), trả về preference mặc định
    if (error?.status === 404) {
      return {
        enabled: false,
        postId: null,
        postStatus: null,
        requirements: null,
      };
    }
    throw error;
  }
}

/**
 * Tạo/cập nhật preference
 */
export async function updateRoommatePreference(
  roomId: number,
  data: CreateRoommatePreferenceDto
): Promise<{ preference: RoommatePreference; post?: Post }> {
  return apiPut(`users/rooms/${roomId}/roommate-preference`, data);
}

/**
 * Lấy bài đăng từ roomId
 */
export async function getPostByRoomId(roomId: number): Promise<Post | null> {
  try {
    return await apiGet<Post>(`users/rooms/${roomId}/post`);
  } catch (error: any) {
    // Nếu không tìm thấy (404), trả về null
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Lấy preferences đã lưu của Seeker (User B)
 */
export async function getSeekerPreference(): Promise<SeekerPreferenceResponse> {
  try {
    return await apiGet<SeekerPreferenceResponse>('users/me/seeker-preference');
  } catch (error: any) {
    // Handle cả 400 và 404 - đều có nghĩa là chưa có preferences
    if (error?.status === 404 || error?.status === 400) {
      return {
        hasPreferences: false,
        requirements: null,
        seekerTraits: null,
      };
    }
    // Nếu là lỗi khác, throw error để caller xử lý
    throw error;
  }
}

/**
 * Tự động match với preferences đã lưu (GET)
 */
export async function findRoommateAuto(): Promise<FindRoommateResponse> {
  try {
    return await apiGet<FindRoommateResponse>('posts/roommate/find');
  } catch (error: any) {
    // Handle 400 và 404 - chưa có preferences hoặc không có matches
    if (error?.status === 404 || error?.status === 400) {
      return {
        matches: [],
        totalMatches: 0,
        message: error?.message || 'Bạn chưa có preferences. Vui lòng điền form tìm phòng.',
      };
    }
    // Nếu là lỗi 500 hoặc lỗi khác, throw error để caller xử lý
    throw error;
  }
}

/**
 * Tìm phòng ở ghép với form (POST)
 * Backend tự động lưu/update preferences khi gọi API này
 */
export async function findRoommate(data: FindRoommateDto): Promise<FindRoommateResponse> {
  return apiPost<FindRoommateResponse>('posts/roommate/find', data);
}

/**
 * Tạo matching request
 */
export async function createMatchingRequest(
  data: CreateMatchingRequestDto
): Promise<MatchingRequest> {
  return apiPost<MatchingRequest>('users/matching-requests', data);
}

/**
 * Lấy danh sách matching requests
 */
export async function getMatchingRequests(
  type?: 'received' | 'sent',
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<MatchingRequestsResponse> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (status) params.append('status', status);

  const queryString = params.toString();
  return apiGet<MatchingRequestsResponse>(
    `users/matching-requests${queryString ? `?${queryString}` : ''}`
  );
}

/**
 * Lấy matching requests của phòng
 */
export async function getRoomMatchingRequests(
  roomId: number,
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<MatchingRequestsResponse> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const queryString = params.toString();
  return apiGet<MatchingRequestsResponse>(
    `users/rooms/${roomId}/matching-requests${queryString ? `?${queryString}` : ''}`
  );
}

/**
 * Xử lý matching request (chấp nhận/từ chối)
 */
export async function handleMatchingRequest(
  requestId: number,
  action: 'accept' | 'reject'
): Promise<MatchingRequest> {
  return apiPut<MatchingRequest>(`users/matching-requests/${requestId}`, { action });
}

/**
 * Lấy thông tin matching request
 */
export async function getMatchingRequest(requestId: number): Promise<MatchingRequest> {
  return apiGet<MatchingRequest>(`users/matching-requests/${requestId}`);
}

