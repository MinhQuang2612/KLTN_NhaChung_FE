export interface User {
  userId: number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  avatar?: string;
  isVerified?: boolean; // Trạng thái xác thực
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  // Lưu ý: Email KHÔNG được phép update theo API specification
  // Nếu cần thay đổi email, phải tạo tài khoản mới hoặc liên hệ admin
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// === VERIFICATION TYPES ===
export interface VerificationData {
  idNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  issueDate: string;
  issuePlace: string;
}

export interface VerificationResponse {
  message: string;
  verification: {
    verificationId: number;
    userId: number;
    status: "pending" | "approved" | "rejected";
    submittedAt: string;
    idNumber: string;
    fullName: string;
  };
}

export interface VerificationStatus {
  isVerified: boolean;
  verification: {
    verificationId: number;
    status: "pending" | "approved" | "rejected";
    submittedAt: string;
    reviewedAt?: string;
    adminNote?: string;
  } | null;
}
