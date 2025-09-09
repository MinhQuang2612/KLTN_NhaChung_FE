"use client";

// import { CheckCircle, AlertTriangle } from 'lucide-react';
import { useState, useEffect } from 'react';
import VerificationModal from './VerificationModal';
import ChangePasswordModal from './ChangePasswordModal';
import { VerificationData } from "../../types/User";
import { getMyVerificationStatus } from "../../services/verification";

interface AccountSettingsProps {
  isVerified?: boolean;
  onVerificationComplete?: (data: VerificationData) => void;
}

export default function AccountSettings({ isVerified = false, onVerificationComplete }: AccountSettingsProps) {
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // Load verification status on mount
  useEffect(() => {
    const loadVerificationStatus = async () => {
      try {
        const status = await getMyVerificationStatus();
        setVerificationStatus(status);
      } catch (error) {
        // Failed to load verification status
      }
    };

    loadVerificationStatus();
  }, []);

  const handleVerificationComplete = (data: VerificationData) => {
    // Debug: verification data
    onVerificationComplete?.(data);
    setIsVerificationModalOpen(false);
    
    // Reload verification status
    const loadVerificationStatus = async () => {
      try {
        const status = await getMyVerificationStatus();
        setVerificationStatus(status);
      } catch (error) {
        // Failed to reload verification status
      }
    };
    loadVerificationStatus();
  };

  const handleChangePasswordSuccess = (message: string) => {
    alert(message);
  };

  return (
    <>
      <div className="border-t border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Cài đặt tài khoản</h3>
        <div className="space-y-4">
          {/* Verification Status từ API */}
          {verificationStatus?.isVerified ? (
            <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-lg">✓</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Đã xác thực danh tính</h4>
                  <p className="text-sm text-gray-600">Tài khoản đã được xác thực, có thể đăng tin cho thuê</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-medium">
                Đã xác thực
              </div>
            </div>
          ) : verificationStatus?.verification?.status === 'pending' ? (
            <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-lg">⏳</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Đang chờ duyệt</h4>
                  <p className="text-sm text-gray-600">Hồ sơ xác thực đang được xem xét</p>
                  <p className="text-xs text-gray-500">Gửi lúc: {new Date(verificationStatus.verification.submittedAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium">
                Chờ duyệt
              </div>
            </div>
          ) : verificationStatus?.verification?.status === 'rejected' ? (
            <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <span className="text-red-600 text-lg">✗</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Xác thực bị từ chối</h4>
                  <p className="text-sm text-gray-600">{verificationStatus.verification.adminNote || 'Vui lòng nộp lại hồ sơ'}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
              >
                Nộp lại
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <span className="text-amber-600 text-lg">⚠</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Chưa xác thực danh tính</h4>
                  <p className="text-sm text-gray-600">Xác thực để có thể đăng tin cho thuê</p>
                </div>
              </div>
              <button 
                onClick={() => setIsVerificationModalOpen(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
              >
                Xác thực ngay
              </button>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Đổi mật khẩu</h4>
              <p className="text-sm text-gray-600">Cập nhật mật khẩu mới</p>
            </div>
            <button 
              onClick={() => setIsChangePasswordModalOpen(true)}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
            >
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>

      <VerificationModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        onVerify={handleVerificationComplete}
      />

      <ChangePasswordModal
        isOpen={isChangePasswordModalOpen}
        onClose={() => setIsChangePasswordModalOpen(false)}
        onSuccess={handleChangePasswordSuccess}
      />
    </>
  );
}
