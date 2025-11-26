/**
 * Utility functions để mapping các lỗi API thành thông báo thân thiện với người dùng
 */

export class ErrorMessageMapper {
  /**
   * Mapping các lỗi đăng ký phổ biến
   */
  static mapRegistrationError(errorMessage: string): string {
    if (errorMessage.includes("email") && errorMessage.includes("already exists")) {
      return "Email này đã được sử dụng. Vui lòng chọn email khác hoặc đăng nhập.";
    }
    if (errorMessage.includes("email") && errorMessage.includes("invalid")) {
      return "Email không hợp lệ. Vui lòng kiểm tra lại.";
    }
    if (errorMessage.includes("password") && errorMessage.includes("weak")) {
      return "Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.";
    }
    if (errorMessage.includes("phone") && errorMessage.includes("invalid")) {
      return "Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.";
    }
    if (errorMessage.includes("name") && errorMessage.includes("required")) {
      return "Vui lòng nhập họ tên.";
    }
    if (errorMessage.includes("role") && errorMessage.includes("required")) {
      return "Vui lòng chọn vai trò.";
    }
    
    return this.mapCommonError(errorMessage);
  }

  /**
   * Mapping các lỗi OTP phổ biến
   */
  static mapOtpError(errorMessage: string): string {
    if (errorMessage.includes("OTP") && errorMessage.includes("invalid")) {
      return "Mã OTP không đúng. Vui lòng kiểm tra lại.";
    }
    if (errorMessage.includes("OTP") && errorMessage.includes("expired")) {
      return "Mã OTP đã hết hạn. Vui lòng gửi lại mã mới.";
    }
    if (errorMessage.includes("OTP") && errorMessage.includes("not found")) {
      return "Không tìm thấy mã OTP. Vui lòng gửi lại mã.";
    }
    if (errorMessage.includes("OTP") && errorMessage.includes("already sent")) {
      return "Mã OTP đã được gửi gần đây. Vui lòng đợi vài phút trước khi gửi lại.";
    }
    if (errorMessage.includes("email") && errorMessage.includes("not found")) {
      return "Email không tồn tại trong hệ thống. Vui lòng đăng ký lại.";
    }
    if (errorMessage.includes("verification") && errorMessage.includes("failed")) {
      return "Xác thực thất bại. Vui lòng thử lại.";
    }
    
    return this.mapCommonError(errorMessage);
  }

  /**
   * Mapping các lỗi đăng nhập phổ biến
   */
  static mapLoginError(errorMessage: string): string {
    if (errorMessage.includes("email") && errorMessage.includes("not found")) {
      return "Email không tồn tại trong hệ thống. Vui lòng đăng ký.";
    }
    if (errorMessage.includes("password") && errorMessage.includes("incorrect")) {
      return "Mật khẩu không đúng. Vui lòng kiểm tra lại.";
    }
    if (errorMessage.includes("account") && errorMessage.includes("locked")) {
      return "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.";
    }
    if (errorMessage.includes("account") && errorMessage.includes("disabled")) {
      return "Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ hỗ trợ.";
    }
    if (errorMessage.includes("email") && errorMessage.includes("not verified")) {
      return "Email chưa được xác thực. Vui lòng kiểm tra email và xác thực.";
    }
    
    return this.mapCommonError(errorMessage);
  }

  /**
   * Mapping các lỗi chung (network, server, etc.)
   */
  static mapCommonError(errorMessage: string): string {
    if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
      return "Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.";
    }
    if (errorMessage.includes("timeout")) {
      return "Kết nối quá chậm. Vui lòng thử lại sau.";
    }
    if (errorMessage.includes("server") || errorMessage.includes("500")) {
      return "Máy chủ đang gặp sự cố. Vui lòng thử lại sau vài phút.";
    }
    if (errorMessage.includes("400")) {
      return "Thông tin không hợp lệ. Vui lòng kiểm tra lại các trường đã nhập.";
    }
    if (errorMessage.includes("401")) {
      return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
    }
    if (errorMessage.includes("403")) {
      return "Bạn không có quyền thực hiện hành động này.";
    }
    if (errorMessage.includes("404")) {
      return "Không tìm thấy tài nguyên yêu cầu.";
    }
    if (errorMessage.includes("429")) {
      return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi vài phút rồi thử lại.";
    }
    if (errorMessage.includes("rate limit") || errorMessage.includes("too many")) {
      return "Bạn đã gửi quá nhiều yêu cầu. Vui lòng đợi vài phút rồi thử lại.";
    }
    
    return errorMessage; // Trả về message gốc nếu không match
  }

  /**
   * Mapping lỗi cho survey/profile
   */
  static mapProfileError(errorMessage: string): string {
    if (errorMessage.includes("age") && errorMessage.includes("18")) {
      return "Bạn phải đủ 18 tuổi để sử dụng dịch vụ này.";
    }
    if (errorMessage.includes("dateOfBirth") && errorMessage.includes("invalid")) {
      return "Ngày sinh không hợp lệ. Vui lòng kiểm tra lại.";
    }
    if (errorMessage.includes("location") && errorMessage.includes("required")) {
      return "Vui lòng chọn khu vực đang ở.";
    }
    if (errorMessage.includes("preferredDistricts") && errorMessage.includes("required")) {
      return "Vui lòng chọn ít nhất 1 phường ưu tiên.";
    }
    if (errorMessage.includes("gender") && errorMessage.includes("required")) {
      return "Vui lòng chọn giới tính.";
    }
    if (errorMessage.includes("occupation") && errorMessage.includes("required")) {
      return "Vui lòng nhập nghề nghiệp.";
    }
    
    return this.mapCommonError(errorMessage);
  }
}

/**
 * Helper function để validate email format
 */
export function validateEmailFormat(email: string): { isValid: boolean; message?: string } {
  if (!email.trim()) {
    return { isValid: false, message: "Vui lòng nhập email" };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Email không đúng định dạng (ví dụ: user@example.com)" };
  }
  
  return { isValid: true };
}

/**
 * Helper function để validate password
 */
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password.trim()) {
    return { isValid: false, message: "Vui lòng nhập mật khẩu" };
  }
  if (password.length < 6) {
    return { isValid: false, message: "Mật khẩu phải có ít nhất 6 ký tự" };
  }
  if (password.length > 50) {
    return { isValid: false, message: "Mật khẩu không được vượt quá 50 ký tự" };
  }
  
  return { isValid: true };
}

/**
 * Helper function để validate phone number
 */
export function validatePhone(phone: string): { isValid: boolean; message?: string } {
  if (!phone.trim()) {
    return { isValid: true }; // Phone là optional
  }
  
  const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
  if (!phoneRegex.test(phone.trim())) {
    return { isValid: false, message: "Số điện thoại không đúng định dạng (10-15 chữ số)" };
  }
  
  return { isValid: true };
}

/**
 * Helper function để validate name
 */
export function validateName(name: string): { isValid: boolean; message?: string } {
  if (!name.trim()) {
    return { isValid: false, message: "Vui lòng nhập họ tên" };
  }
  if (name.trim().length < 2) {
    return { isValid: false, message: "Họ tên phải có ít nhất 2 ký tự" };
  }
  if (name.trim().length > 100) {
    return { isValid: false, message: "Họ tên không được vượt quá 100 ký tự" };
  }
  
  return { isValid: true };
}
