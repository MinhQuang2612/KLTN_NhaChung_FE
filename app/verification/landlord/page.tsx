"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import VerificationModal from '../../../components/profile/VerificationModal';
import { VerificationData } from '../../../types/User';
import { FaCheckCircle, FaRegFileAlt } from 'react-icons/fa';

export default function LandlordVerificationPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(true);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string>('');
  const [showLicenseUpload, setShowLicenseUpload] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);

  // 🔥 Kiểm tra verification đã tồn tại chưa khi component mount
  useEffect(() => {
    const checkExistingVerification = async () => {
      const token = ensureToken();
      if (!token) return;

      setIsCheckingVerification(true);
      try {
        const { getMyVerification } = await import('../../../services/verification');
        const result = await getMyVerification();
        
        if (result.verification) {
          // Đã có verification, chỉ cần hiển thị màn hình upload license
          setShowModal(false);
          setShowLicenseUpload(true);
          
          // Nếu đã có businessLicense, có thể hiển thị thông báo
          if (result.verification.businessLicense) {
            // User đã upload license rồi, có thể redirect hoặc hiển thị thông báo
            console.log("Đã có business license");
          }
        }
      } catch (error: any) {
        // Nếu lỗi 404 = chưa có verification, tiếp tục flow bình thường
        if (error?.status !== 404) {
          console.error("Lỗi khi kiểm tra verification:", error);
        }
      } finally {
        setIsCheckingVerification(false);
      }
    };

    checkExistingVerification();
  }, [router]);

  // 🔥 Helper function: Refresh token nếu mất hoặc hết hạn
  const handleTokenRefresh = async (): Promise<string | null> => {
    try {
      const email = typeof window !== "undefined" ? localStorage.getItem("user_email") : null;
      if (!email) {
        console.error("⚠️ Không tìm thấy email để refresh token");
        return null;
      }

      const { refreshRegistrationToken } = await import('../../../services/auth');
      const data = await refreshRegistrationToken(email);
      
      // Lưu token mới
      if (typeof window !== "undefined") {
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("token_issued_at", String(Date.now()));
        if (data.user) {
          localStorage.setItem("user", JSON.stringify(data.user));
        }
      }
      
      return data.access_token;
    } catch (error) {
      console.error("Lỗi khi refresh token:", error);
      return null;
    }
  };

  // 🔥 Đảm bảo token luôn có sẵn khi component mount
  useEffect(() => {
    if (showLicenseUpload) {
      // Kiểm tra token khi hiển thị màn hình upload license
      const token = ensureToken();
      if (!token) {
        // Thử refresh token
        handleTokenRefresh().then((newToken) => {
          if (!newToken) {
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            router.push('/login');
          }
        });
      }
    }
  }, [showLicenseUpload, router]);

  const handleVerificationSuccess = async (data: VerificationData) => {
    // Submit verification ngay (không có businessLicense)
    // Sau đó mới hiển thị màn hình upload license
    setIsSubmitting(true);
    try {
      // Kiểm tra token trước
      let token = ensureToken();
      if (!token) {
        // Thử refresh token
        token = await handleTokenRefresh();
        if (!token) {
          alert('Lỗi: Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
          router.push('/login');
          return;
        }
      }

      // Submit verification (không bao gồm businessLicense)
      const { submitVerification } = await import('../../../services/verification');
      await submitVerification({
        ...data,
        // Không gửi businessLicense ở đây
      });

      // Lưu verification data để có thể dùng sau
      setVerificationData(data);
      
      // Đóng modal và hiển thị license upload screen
      setShowModal(false);
      setTimeout(() => {
        setShowLicenseUpload(true);
      }, 300);
    } catch (error: any) {
      // Xử lý lỗi 401 - thử refresh token và retry
      if (error?.status === 401) {
        const newToken = await handleTokenRefresh();
        if (newToken) {
          // Retry submit verification
          return handleVerificationSuccess(data);
        }
      }
      const errorMessage = error?.message || error?.body?.message || 'Có lỗi xảy ra khi submit verification. Vui lòng thử lại.';
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      alert('Vui lòng chọn file PDF hoặc DOC/DOCX');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File không được vượt quá 5MB');
      return;
    }

    setLicenseFile(file);

    // Convert to base64 for upload
    const reader = new FileReader();
    reader.onload = () => {
      setLicensePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // 🔥 Helper function: Đảm bảo token luôn có sẵn
  const ensureToken = (): string | null => {
    if (typeof window === "undefined") return null;
    
    // Lấy token từ localStorage
    let token = localStorage.getItem("token");
    
    // Kiểm tra token có hết hạn không (24h)
    if (token) {
      const tokenIssuedAt = localStorage.getItem("token_issued_at");
      if (tokenIssuedAt) {
        const issuedAtMs = Number(tokenIssuedAt);
        const isExpired = Number.isFinite(issuedAtMs) && Date.now() - issuedAtMs > 24 * 60 * 60 * 1000;
        if (isExpired) {
          console.warn("⚠️ Token đã hết hạn");
          localStorage.removeItem("token");
          localStorage.removeItem("token_issued_at");
          return null;
        }
      }
    }
    
    return token;
  };

  const handleSubmitLicense = async () => {
    if (!licenseFile || !licensePreview) {
      alert('Vui lòng chọn file giấy phép kinh doanh');
      return;
    }

    // 🔥 KIỂM TRA TOKEN trước khi gọi API - với retry mechanism
    let token = ensureToken();
    
    if (!token) {
      // Thử refresh token
      token = await handleTokenRefresh();
      if (!token) {
        alert('Lỗi: Không tìm thấy token xác thực. Vui lòng đăng nhập lại.');
        router.push('/login');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      // 🔥 SỬ DỤNG ENDPOINT MỚI: Update business license (không cần submit lại verification)
      const { updateBusinessLicense } = await import('../../../services/verification');
      const response = await updateBusinessLicense(licensePreview);

      // Xóa registration data nếu đang trong registration flow
      const isRegistrationFlow = typeof window !== "undefined" && localStorage.getItem("isRegistrationFlow") === "true";
      if (isRegistrationFlow && typeof window !== "undefined") {
        localStorage.removeItem("isRegistrationFlow");
        localStorage.removeItem("registrationData");
        localStorage.removeItem("user_email");
      }
      
      alert('Đã hoàn tất đăng ký chủ nhà! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error: any) {
      // Xử lý lỗi 401 - thử refresh token và retry
      if (error?.status === 401) {
        const newToken = await handleTokenRefresh();
        if (newToken) {
          // Retry upload business license
          return handleSubmitLicense();
        }
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        // Xóa token và redirect
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("token_issued_at");
          localStorage.removeItem("user");
        }
        router.push('/login');
      } else if (error?.status === 404) {
        // Chưa có verification - cần submit verification trước
        alert('Chưa có hồ sơ xác thực. Vui lòng hoàn tất xác thực trước.');
        // Có thể redirect về modal verification
        setShowLicenseUpload(false);
        setShowModal(true);
      } else {
        const errorMessage = error?.message || error?.body?.message || 'Có lỗi xảy ra khi lưu giấy phép kinh doanh. Vui lòng thử lại.';
        alert(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hiển thị loading khi đang kiểm tra verification
  if (isCheckingVerification) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang kiểm tra...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Verification Modal - BẮT BUỘC phải hoàn thành */}
      <VerificationModal
        isOpen={showModal}
        skipAutoSubmit={true} // Không tự submit trong modal, sẽ submit trong handleVerificationSuccess
        allowClose={false} // Không cho phép đóng modal - bắt buộc phải hoàn thành
        onClose={() => {
          // Không cho phép đóng trong luồng đăng ký chủ nhà
          // Chỉ để thỏa mãn type, nhưng không thực sự đóng
        }}
        onVerify={handleVerificationSuccess}
      />

      {/* License Upload Modal - BẮT BUỘC phải hoàn thành */}
      {showLicenseUpload && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">Tải lên giấy phép kinh doanh</h2>
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Bắt buộc phải hoàn thành
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="text-center mb-6">
                <p className="text-gray-600 mb-4">
                  Vui lòng tải lên giấy phép kinh doanh để hoàn tất đăng ký
                </p>
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-red-700">
                    Bước này là bắt buộc - Bạn không thể bỏ qua
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div className="max-w-lg mx-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giấy phép kinh doanh (PDF/DOC/DOCX)
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                    {licensePreview ? (
                      <div className="space-y-2">
                        <p className="text-sm text-green-600 font-medium flex items-center justify-center gap-2">
                          <FaCheckCircle className="h-4 w-4" />
                          Đã tải lên
                        </p>
                        <p className="text-xs text-gray-500">{licenseFile?.name}</p>
                        <button
                          onClick={() => {
                            setLicenseFile(null);
                            setLicensePreview('');
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FaRegFileAlt className="mx-auto text-gray-400 text-2xl" />
                        <p className="text-sm text-gray-600">Tải lên file PDF hoặc DOC</p>
                        <p className="text-xs text-gray-500">Tối đa 5MB</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleLicenseUpload}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <button
                    onClick={handleSubmitLicense}
                    disabled={!licenseFile || isSubmitting}
                    className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {isSubmitting ? 'Đang xử lý...' : 'Hoàn tất đăng ký'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
