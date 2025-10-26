"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';
import VerificationModal from '../../../components/profile/VerificationModal';
import { VerificationData } from '../../../types/User';

export default function LandlordVerificationPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [showModal, setShowModal] = useState(true);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [licensePreview, setLicensePreview] = useState<string>('');
  const [showLicenseUpload, setShowLicenseUpload] = useState(false);

  const [verificationData, setVerificationData] = useState<VerificationData | null>(null);

  const handleVerificationSuccess = async (data: VerificationData) => {
    // Chặn modal submit - chỉ lưu data để submit sau khi có license
    setVerificationData(data);
    // Đóng modal ngay và hiển thị license upload screen
    setShowModal(false);
    setTimeout(() => {
      setShowLicenseUpload(true);
    }, 300);
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

  const handleSubmitLicense = async () => {
    if (!licenseFile || !licensePreview) {
      alert('Vui lòng chọn file giấy phép kinh doanh');
      return;
    }

    if (!verificationData) {
      alert('Thiếu thông tin xác thực. Vui lòng thử lại.');
      return;
    }

    try {
      // Note: Verification đã được submit trong modal rồi
      // Giờ chỉ cần submit thêm businessLicense (dùng API update hoặc submit lại với license)
      const { submitVerification } = await import('../../../services/verification');
      const response = await submitVerification({
        ...verificationData,
        businessLicense: licensePreview
      });

      // Xóa registration data nếu đang trong registration flow
      const isRegistrationFlow = typeof window !== "undefined" && localStorage.getItem("isRegistrationFlow") === "true";
      if (isRegistrationFlow && typeof window !== "undefined") {
        localStorage.removeItem("isRegistrationFlow");
        localStorage.removeItem("registrationData");
      }
      
      alert('✅ Đã hoàn tất đăng ký chủ nhà! Vui lòng đăng nhập.');
      router.push('/login');
    } catch (error) {
      console.error('Error submitting verification with license:', error);
      alert('❌ Có lỗi xảy ra khi lưu giấy phép kinh doanh. Vui lòng thử lại.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Verification Modal */}
      <VerificationModal
        isOpen={showModal}
        skipAutoSubmit={true} // Không tự submit, để submit sau khi có license
        onClose={() => {
          // Không redirect, chỉ đóng modal
          setShowModal(false);
        }}
        onVerify={handleVerificationSuccess}
      />

      {/* License Upload Screen */}
      {showLicenseUpload && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Tải lên giấy phép kinh doanh
              </h1>
              <p className="text-gray-600">
                Vui lòng tải lên giấy phép kinh doanh để hoàn tất đăng ký
              </p>
            </div>

            <div className="space-y-6">
              <div className="max-w-lg mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giấy phép kinh doanh (PDF/DOC/DOCX)
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors">
                  {licensePreview ? (
                    <div className="space-y-2">
                      <p className="text-sm text-green-600 font-medium">✓ Đã tải lên</p>
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
                      <span className="text-gray-400 text-2xl">📄</span>
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

              <div className="flex space-x-3">
                <button
                  onClick={() => router.push('/landlord')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Bỏ qua
                </button>
                <button
                  onClick={handleSubmitLicense}
                  disabled={!licenseFile}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hoàn tất
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
