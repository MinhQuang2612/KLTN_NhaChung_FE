import { apiGet, apiPost } from "@/utils/api";
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