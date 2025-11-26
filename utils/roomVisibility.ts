import { getRoomById } from '@/services/rooms';

export interface RoomVisibilityResult {
  shouldShow: boolean;
  reason?: string;
}

/**
 * Kiểm tra xem bài đăng có nên hiển thị trên web hay không
 * dựa trên luồng logic kinh doanh mới
 */
export async function checkRoomVisibility(
  post: any, 
  roomData?: any
): Promise<RoomVisibilityResult> {
  try {
    // Nếu không có roomData, thử lấy từ API
    if (!roomData && post.roomId) {
      roomData = await getRoomById(post.roomId);
    }

    if (!roomData) {
      return { shouldShow: true, reason: 'No room data available' };
    }

    const currentOccupancy = roomData.currentOccupants || roomData.currentOccupancy || 0;
    const maxOccupancy = roomData.maxOccupancy || 1;
    const postType = post.postType || post.type;
    
    // Map postType từ backend format
    const mappedPostType = postType === 'cho-thue' ? 'rent' : 
                           postType === 'tim-o-ghep' ? 'roommate' : postType;

    // Logic theo luồng mới:
    
  // 1. Phòng trống hoàn toàn (currentOccupancy = 0)
  if (currentOccupancy === 0) {
    // Chỉ hiển thị bài đăng thuê (rent)
    if (mappedPostType === 'rent') {
      return { shouldShow: true, reason: 'Empty room - rent post' };
    } else if (mappedPostType === 'roommate') {
      // Logic mới: cho phép hiển thị roommate post ngay cả khi phòng trống (FE đã thay đổi để user chỉ cần có phòng)
      return { shouldShow: true, reason: 'Empty room - roommate post allowed per new logic' };
    }
  }

    // 2. Phòng đã có người thuê (currentOccupancy > 0)
    if (currentOccupancy > 0) {
      // Ẩn bài đăng thuê (rent) vì phòng đã được thuê
      if (mappedPostType === 'rent') {
        return { shouldShow: false, reason: 'Room occupied - rent post should not show' };
      }
      
      // Với bài đăng ở ghép (roommate)
      if (mappedPostType === 'roommate') {
        // Nếu phòng đã đầy (currentOccupancy >= maxOccupancy)
        if (currentOccupancy >= maxOccupancy) {
          return { shouldShow: false, reason: 'Room full - roommate post should not show' };
        }
        
        // Nếu phòng chưa đầy, hiển thị bài đăng ở ghép
        return { shouldShow: true, reason: 'Room has space - roommate post can show' };
      }
    }

    // Default: hiển thị
    return { shouldShow: true, reason: 'Default - show post' };

  } catch (error) {
    // Nếu có lỗi, hiển thị bài đăng để tránh ẩn nhầm
    return { shouldShow: true, reason: 'Error checking visibility - default to show' };
  }
}

/**
 * Filter một danh sách posts dựa trên room visibility
 */
export async function filterVisiblePosts(posts: any[]): Promise<any[]> {
  const visibilityChecks = await Promise.all(
    posts.map(async (post) => {
      const result = await checkRoomVisibility(post);
      return { post, shouldShow: result.shouldShow };
    })
  );

  return visibilityChecks
    .filter(item => item.shouldShow)
    .map(item => item.post);
}

/**
 * Check visibility cho multiple posts với room data đã có
 */
export function checkMultiplePostsVisibility(
  posts: any[], 
  roomDataMap: Record<string, any>
): { post: any; shouldShow: boolean; reason: string }[] {
  return posts.map(post => {
    const roomData = roomDataMap[post.roomId];
    const result = checkRoomVisibilitySync(post, roomData);
    return {
      post,
      shouldShow: result.shouldShow,
      reason: result.reason || 'Unknown'
    };
  });
}

/**
 * Synchronous version of checkRoomVisibility (requires roomData)
 */
export function checkRoomVisibilitySync(
  post: any, 
  roomData?: any
): RoomVisibilityResult {
  if (!roomData) {
    return { shouldShow: true, reason: 'No room data available' };
  }

  const currentOccupancy = roomData.currentOccupants || roomData.currentOccupancy || 0;
  const maxOccupancy = roomData.maxOccupancy || 1;
  const postType = post.postType || post.type;
  
  // Map postType từ backend format
  const mappedPostType = postType === 'cho-thue' ? 'rent' : 
                         postType === 'tim-o-ghep' ? 'roommate' : postType;

  // Logic theo luồng mới:
  
  // 1. Phòng trống hoàn toàn (currentOccupancy = 0)
  if (currentOccupancy === 0) {
    // Chỉ hiển thị bài đăng thuê (rent)
    if (mappedPostType === 'rent') {
      return { shouldShow: true, reason: 'Empty room - rent post' };
    } else if (mappedPostType === 'roommate') {
      // Logic mới: cho phép hiển thị roommate post ngay cả khi phòng trống (FE đã thay đổi để user chỉ cần có phòng)
      return { shouldShow: true, reason: 'Empty room - roommate post allowed per new logic' };
    }
  }

  // 2. Phòng đã có người thuê (currentOccupancy > 0)
  if (currentOccupancy > 0) {
    // Ẩn bài đăng thuê (rent) vì phòng đã được thuê
    if (mappedPostType === 'rent') {
      return { shouldShow: false, reason: 'Room occupied - rent post should not show' };
    }
    
    // Với bài đăng ở ghép (roommate)
    if (mappedPostType === 'roommate') {
      // Nếu phòng đã đầy (currentOccupancy >= maxOccupancy)
      if (currentOccupancy >= maxOccupancy) {
        return { shouldShow: false, reason: 'Room full - roommate post should not show' };
      }
      
      // Nếu phòng chưa đầy, hiển thị bài đăng ở ghép
      return { shouldShow: true, reason: 'Room has space - roommate post can show' };
    }
  }

  // Default: hiển thị
  return { shouldShow: true, reason: 'Default - show post' };
}
