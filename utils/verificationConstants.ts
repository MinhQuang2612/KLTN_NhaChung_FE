// Verification constants - Cập nhật theo API guide mới
export const VERIFICATION_CONSTANTS = {
  // Image compression - Tối ưu cho S3 storage
  MAX_IMAGE_WIDTH: 800, // Theo API guide: maxWidth = 800
  IMAGE_QUALITY: 0.8,   // Theo API guide: quality = 0.8
  MAX_TOTAL_SIZE: 5 * 1024 * 1024, // 5MB - Tăng giới hạn cho S3
  
  // Face matching - Theo API guide
  SIMILARITY_THRESHOLD: 50, // >= 50% = Auto-approved, < 50% = Pending
  
  // File formats
  SUPPORTED_IMAGE_TYPES: ['image/jpeg', 'image/png'],
  
  // Error messages
  MESSAGES: {
    IMAGE_TOO_LARGE: 'Kích thước ảnh quá lớn. Vui lòng chọn ảnh nhỏ hơn.',
    REQUIRED_FIELDS: 'Vui lòng điền đầy đủ thông tin bắt buộc',
    SUBMIT_SUCCESS: 'Gửi yêu cầu xác thực thành công!',
    SUBMIT_SUCCESS_WITHOUT_IMAGES: 'Gửi yêu cầu xác thực thành công (không có ảnh)!',
    SUBMIT_ERROR: 'Gửi yêu cầu xác thực thất bại:',
    FACE_MATCH_ERROR: 'Lỗi khi so sánh khuôn mặt:',
    UPLOAD_IMAGES_REQUIRED: 'Vui lòng tải lên đầy đủ ảnh CCCD và ảnh khuôn mặt',
    OTP_INVALID: 'OTP gồm 6 chữ số',
    AUTO_APPROVED: 'Tự động xác thực thành công nhờ AI!',
    PENDING_REVIEW: 'Hồ sơ đang chờ admin xem xét.'
  }
} as const;
