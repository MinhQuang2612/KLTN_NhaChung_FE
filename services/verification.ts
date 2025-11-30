import { apiGet, apiPost, apiPatch } from "@/utils/api";
import { VerificationData, VerificationResponse, VerificationStatus } from "@/types/User";

/**
 * Submit verification request
 * Backend sẽ tự động:
 * - Upload ảnh lên S3
 * - Tính confidence dựa trên similarity
 * - Auto-approve nếu similarity >= 50%
 */
export async function submitVerification(verificationData: VerificationData, skipAuth = false): Promise<VerificationResponse> {
  return apiPost('verifications', verificationData, { skipAuth });
}

/**
 * Get current user's verification status
 * Trả về trạng thái xác thực hiện tại của user
 */
export async function getMyVerificationStatus(): Promise<VerificationStatus> {
  return apiGet('users/me/verification');
}

/**
 * Get verification data of a specific user by userId
 * Trả về thông tin verification (bao gồm dateOfBirth và gender) của user
 */
export async function getUserVerification(userId: string | number): Promise<any> {
  return apiGet(`users/${userId}/verification`);
}

/**
 * Get current user's verification (full data)
 * Trả về thông tin verification đầy đủ của user hiện tại
 */
export async function getMyVerification(): Promise<{ verification: any | null; message?: string }> {
  return apiGet('verifications/me');
}

/**
 * Update business license for current user's verification
 * Cập nhật giấy phép kinh doanh cho verification đã tồn tại
 */
export async function updateBusinessLicense(businessLicense: string): Promise<{
  success: boolean;
  message: string;
  verification: {
    verificationId: number;
    userId: number;
    status: string;
    businessLicense: string;
    updatedAt: string;
  };
}> {
  return apiPatch('verifications/me/business-license', { businessLicense });
}