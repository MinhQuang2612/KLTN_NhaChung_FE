import { apiGet, apiPost } from "@/utils/api";
import { VerificationData, VerificationResponse, VerificationStatus } from "@/types/User";

/**
 * Submit verification request
 * Backend sẽ tự động:
 * - Upload ảnh lên S3
 * - Tính confidence dựa trên similarity
 * - Auto-approve nếu similarity >= 50%
 */
export async function submitVerification(verificationData: VerificationData): Promise<VerificationResponse> {
  return apiPost('verifications', verificationData);
}

/**
 * Get current user's verification status
 * Trả về trạng thái xác thực hiện tại của user
 */
export async function getMyVerificationStatus(): Promise<VerificationStatus> {
  return apiGet('users/me/verification');
}
