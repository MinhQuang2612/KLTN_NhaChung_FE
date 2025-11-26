import { apiGet, apiPut, apiPost } from "@/utils/api";
import { User, UpdateUserRequest, ChangePasswordRequest, ChangePasswordResponse } from "@/types/User";
import { uploadFiles } from "@/utils/upload";

/**
 * Lấy thông tin profile của user hiện tại
 */
export async function getUserProfile(): Promise<User> {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return apiGet(`users/${user.userId}`);
  }
  throw new Error("Không tìm thấy thông tin user");
}

/**
 * Lấy thông tin user theo ID
 */
export async function getUserById(userId: string | number): Promise<User> {
  return apiGet(`users/${userId}`);
}

/**
 * Cập nhật thông tin user theo ID
 */
export async function updateUser(userId: string | number, userData: UpdateUserRequest): Promise<User> {
  return apiPut(`users/${userId}`, userData);
}

/**
 * Cập nhật thông tin profile của user hiện tại
 */
export async function updateUserProfile(userData: UpdateUserRequest): Promise<User> {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    const updatedUser = await updateUser(user.userId, userData);
    
    // Cập nhật localStorage với dữ liệu mới
    localStorage.setItem("user", JSON.stringify(updatedUser));
    
    return updatedUser;
  }
  throw new Error("Không tìm thấy thông tin user");
}


/**
 * Đổi mật khẩu cho user hiện tại
 */
export async function changePassword(passwordData: ChangePasswordRequest): Promise<ChangePasswordResponse> {
  const storedUser = localStorage.getItem("user");
  if (storedUser) {
    const user = JSON.parse(storedUser);
    return apiPost(`users/${user.userId}/change-password`, passwordData);
  }
  throw new Error("Không tìm thấy thông tin user");
}

/**
 * Upload avatar lên S3 sử dụng presigned URL theo API Guide
 */
export async function uploadUserAvatar(file: File): Promise<string> {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) {
    throw new Error("Không tìm thấy thông tin user");
  }
  
  const user = JSON.parse(storedUser);
  
  try {
    // Upload theo quy trình API Guide: Presigned URL
    // Đảm bảo userId là number hợp lệ khi truyền sang uploadFiles
    const numericUserId = typeof user.userId === "string" ? Number(user.userId) : user.userId;
    const uploadedUrls = await uploadFiles([file], numericUserId, "images");
    
    if (uploadedUrls.length === 0) {
      throw new Error("Upload avatar thất bại - không nhận được URL");
    }
    
    return uploadedUrls[0];
  } catch (error: any) {
    // Handle upload error
    if (error.message?.includes('CORS') || error.message?.includes('blocked')) {
      throw new Error(
        "CORS Error: S3 bucket chưa được config CORS.\n" +
        "Yêu cầu BE thêm origin 'http://localhost:3000' vào S3 CORS policy.\n" +
        "Chi tiết: " + error.message
      );
    }
    
    if (error.message?.includes('Failed to fetch')) {
      throw new Error(
        "Network Error: Không thể kết nối tới S3.\n" +
        "Kiểm tra: presigned URL, network connection, hoặc S3 CORS config.\n" +
        "Chi tiết: " + error.message
      );
    }
    
    throw new Error(`Upload avatar thất bại: ${error.message}`);
  }
}

/**
 * Update avatar user (upload + save to DB)
 */
export async function updateUserAvatar(file: File): Promise<User> {
  // 1. Upload lên S3
  const avatarUrl = await uploadUserAvatar(file);
  
  // 2. Update vào DB
  const updatedUser = await updateUserProfile({ avatar: avatarUrl });
  
  return updatedUser;
}

/**
 * Lấy danh sách tất cả users (admin only)
 */
export async function getAllUsers(): Promise<User[]> {
  return apiGet("users");
}
