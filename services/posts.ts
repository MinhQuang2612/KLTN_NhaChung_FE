import { apiGet, apiPost, apiPut, apiDel } from "@/utils/api";
import { 
  Post, 
  CreatePostPayload, 
  UpdatePostPayload,
  PostListParams,
  PostSearchParams,
  PostListResponse,
  RoomForPost
} from "@/types/Post";

// Base URL cho Posts API
const BASE_URL = 'posts';

// ==================== PUBLIC ENDPOINTS ====================

/**
 * Lấy danh sách bài đăng
 */
export async function getPosts(params: PostListParams = {}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.postType) searchParams.append('postType', params.postType);
  if (params.userId) searchParams.append('userId', params.userId.toString());
  if (params.landlordId) searchParams.append('landlordId', params.landlordId.toString());
  if (params.roomId) searchParams.append('roomId', params.roomId.toString());
  if (params.isManaged !== undefined) searchParams.append('isManaged', params.isManaged.toString());
  if (params.source) searchParams.append('source', params.source);
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.search) searchParams.append('search', params.search);
  
  const queryString = searchParams.toString();
  return apiGet(`${BASE_URL}${queryString ? `?${queryString}` : ''}`);
}

/**
 * Tìm kiếm bài đăng
 */
export async function searchPosts(params: PostSearchParams = {}): Promise<PostListResponse> {
  const searchParams = new URLSearchParams();
  
  if (params.postType) searchParams.append('postType', params.postType);
  if (params.keyword) searchParams.append('keyword', params.keyword);
  if (params.minPrice) searchParams.append('minPrice', params.minPrice.toString());
  if (params.maxPrice) searchParams.append('maxPrice', params.maxPrice.toString());
  if (params.gender) searchParams.append('gender', params.gender);
  if (params.ageRange) searchParams.append('ageRange', params.ageRange.join(','));
  if (params.location) searchParams.append('location', params.location);
  if (params.status) searchParams.append('status', params.status);
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  
  const queryString = searchParams.toString();
  return apiGet(`${BASE_URL}/search${queryString ? `?${queryString}` : ''}`);
}

/**
 * Lấy chi tiết bài đăng
 */
export async function getPostById(id: number): Promise<Post> {
  return apiGet(`${BASE_URL}/${id}`);
}

/**
 * Lấy bài đăng với thông tin phòng đầy đủ (cho managed posts)
 */
export async function getPostWithRoomInfo(id: number): Promise<Post> {
  return apiGet(`${BASE_URL}/${id}/with-room`);
}

/**
 * Lấy thông tin phòng từ bài đăng
 */
export async function getPostRoomInfo(id: number): Promise<any> {
  return apiGet(`${BASE_URL}/${id}/room-info`);
}

// ==================== PROTECTED ENDPOINTS ====================

/**
 * Lấy danh sách phòng của user để tạo post
 */
export async function getUserRooms(postType?: 'cho-thue' | 'tim-o-ghep'): Promise<RoomForPost[]> {
  const searchParams = new URLSearchParams();
  if (postType) searchParams.append('postType', postType);
  
  const queryString = searchParams.toString();
  return apiGet(`${BASE_URL}/user/rooms${queryString ? `?${queryString}` : ''}`);
}

/**
 * Lấy danh sách bài đăng của user
 */
export async function getUserPosts(): Promise<Post[]> {
  return apiGet(`${BASE_URL}/user/my-posts`);
}

/**
 * Tạo bài đăng mới
 */
export async function createPost(payload: CreatePostPayload): Promise<Post> {
  return apiPost(BASE_URL, payload);
}

/**
 * Lấy bài đăng của user hiện tại
 */
export async function getMyPosts(): Promise<Post[]> {
  return apiGet(`${BASE_URL}/user/my-posts`);
}


/**
 * Cập nhật bài đăng
 */
export async function updatePost(id: number, payload: UpdatePostPayload): Promise<Post> {
  return apiPut(`${BASE_URL}/${id}`, payload);
}

/**
 * Xóa bài đăng (chuyển status thành 'inactive')
 */
export async function deletePost(id: number): Promise<{ message: string; postId: number }> {
  return apiDel(`${BASE_URL}/${id}`);
}

// Kích hoạt lại bài đăng đã ẩn (status -> active)
export async function activatePost(id: number): Promise<Post> {
  return apiPut(`${BASE_URL}/${id}`, { status: 'active' } as any);
}

// ==================== LANDLORD ENDPOINTS ====================

/**
 * Lấy bài đăng của landlord
 */
export async function getLandlordPosts(): Promise<Post[]> {
  return apiGet('/api/landlord/posts');
}

/**
 * Lấy bài đăng theo phòng
 */
export async function getPostsByRoom(roomId: number): Promise<Post[]> {
  return apiGet(`landlord/posts/room/${roomId}`);
}

// ==================== ADMIN ENDPOINTS ====================

/**
 * Lấy tất cả bài đăng (Admin)
 */
export async function getAllPosts(): Promise<PostListResponse> {
  return apiGet('/api/admin/posts');
}

/**
 * Lấy bài đăng chờ duyệt (Admin)
 */
export async function getPendingPosts(): Promise<Post[]> {
  return apiGet('/api/admin/posts/pending');
}

/**
 * Duyệt bài đăng (Admin)
 */
export async function approvePost(id: number): Promise<Post> {
  return apiPut(`/api/admin/posts/${id}/approve`);
}

/**
 * Từ chối bài đăng (Admin)
 */
export async function rejectPost(id: number): Promise<Post> {
  return apiPut(`/api/admin/posts/${id}/reject`);
}

/**
 * Xóa bài đăng (Admin)
 */
export async function adminDeletePost(id: number): Promise<{ message: string; postId: number }> {
  return apiDel(`/api/admin/posts/${id}`);
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Lấy phòng cho thuê (chỉ phòng trống)
 */
export async function getRoomsForRent(): Promise<RoomForPost[]> {
  return getUserRooms('cho-thue');
}

/**
 * Lấy tất cả phòng available
 */
export async function getAllAvailableRooms(): Promise<RoomForPost[]> {
  return getUserRooms();
}

/**
 * Validate phòng có phù hợp với loại post không
 */
export function validateRoomForPostType(room: RoomForPost, postType: 'rent' | 'roommate'): boolean {
  if (postType === 'rent') {
    // Cho thuê: phòng phải trống hoàn toàn
    return room.currentOccupants === 0 && room.status === 'available';
  } else if (postType === 'roommate') {
    // Tìm ở ghép: phòng phải có chỗ trống và cho phép ở ghép
    return room.availableSpots > 0 && room.canShare && room.status === 'available';
  }
  return false;
}

/**
 * Format phòng để hiển thị
 */
export function formatRoomForDisplay(room: RoomForPost): string {
  const building = room.buildingName || `Dãy ${room.buildingId}`;
  const address = room.address ? 
    `${room.address.street}, ${room.address.ward}, ${room.address.city}` : 
    'Địa chỉ không xác định';
  
  return `${room.roomNumber} - ${building} (${address})`;
}

/**
 * Format giá phòng
 */
export function formatRoomPrice(room: RoomForPost, postType: 'rent' | 'roommate'): string {
  if (postType === 'rent') {
    return `${room.price.toLocaleString('vi-VN')}đ/tháng`;
  } else {
    return room.sharePrice ? 
      `${room.sharePrice.toLocaleString('vi-VN')}đ/tháng` : 
      `${room.price.toLocaleString('vi-VN')}đ/tháng`;
  }
}
