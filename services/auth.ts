import { apiPost } from "@/utils/api";
import { User } from "@/types/User";

export async function loginService(
  email: string,
  password: string
): Promise<{ access_token: string; user: User }> {
  return apiPost("users/login", { email, password });
}

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string; // Chỉ dùng cho validation frontend
  phone?: string;
  avatar?: string;
  role?: "user" | "landlord";
};

export async function registerService(payload: RegisterPayload): Promise<{ message: string; email: string; expiresIn?: number }> {
  // Loại bỏ confirmPassword trước khi gửi lên backend
  const { confirmPassword, ...backendPayload } = payload;
  // Theo registration-system.md: dùng /auth/register để gửi OTP (public)
  return apiPost("auth/register", backendPayload as any);
}

export async function logoutService() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem("token");
    localStorage.removeItem("token_issued_at");
    localStorage.removeItem("user");
  }
}

// --- Registration OTP flow ---
export async function verifyRegistration(email: string, otp: string) {
  return apiPost<{ message: string; user?: User; access_token?: string }>("auth/verify-registration", { email, otp });
}

export async function resendRegistrationOtp(email: string) {
  return apiPost<{ message: string; email: string; expiresIn: number }>("auth/resend-otp", { email });
}

/**
 * Refresh registration token
 * Lấy lại token nếu bị mất trong quá trình đăng ký (sau khi đã verify OTP)
 */
export async function refreshRegistrationToken(email: string): Promise<{
  access_token: string;
  expires_in: number;
  user?: User;
}> {
  return apiPost("auth/refresh-registration-token", { email }, { skipAuth: true });
}