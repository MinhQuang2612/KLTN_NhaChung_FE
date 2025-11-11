// utils/jwt.ts
// Helper để decode JWT token và lấy thông tin user

/**
 * Decode JWT token (không verify signature)
 * Chỉ để lấy payload, không dùng để verify token
 */
export function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
}

/**
 * Lấy userId từ JWT token
 */
export function getUserIdFromToken(token: string | null): number | null {
  if (!token) return null;
  
  const payload = decodeJWT(token);
  if (!payload) return null;
  
  // Thử các field name phổ biến cho userId
  const userId = payload.userId || payload.sub || payload.id || payload.user_id || null;
  
  // Đảm bảo trả về number
  if (userId !== null) {
    const numUserId = Number(userId);
    return Number.isFinite(numUserId) && numUserId > 0 ? numUserId : null;
  }
  
  return null;
}

