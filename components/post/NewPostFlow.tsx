"use client";

import { useState, useEffect } from "react";
import { PostType } from "@/types/Post";
import { RoomForPost } from "@/types/Post";
import RoomSelector from "./RoomSelector";
import PostFormUnified from "./PostFormUnified";
import { useAuth } from "@/contexts/AuthContext";
import NotificationModal from "../common/NotificationModal";

// Sử dụng RoomForPost type từ types/Post.ts

type FlowStep = 'select-room' | 'fill-form' | 'success';

interface NewPostFlowProps {
  onClose: () => void;
  onSuccess?: () => void;
}

export default function NewPostFlow({ onClose, onSuccess }: NewPostFlowProps) {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<FlowStep>('select-room');
  const [selectedType, setSelectedType] = useState<PostType | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<RoomForPost | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Tự động xác định loại bài đăng theo role
  useEffect(() => {
    if (user?.role === 'landlord') {
      setSelectedType('rent');
    } else {
      setSelectedType('roommate');
    }
  }, [user?.role]);

  // Debug: Log khi showSuccessModal thay đổi
  useEffect(() => {
    console.log('showSuccessModal changed to:', showSuccessModal);
  }, [showSuccessModal]);

  const handleSelectRoom = (room: RoomForPost | null) => {
    setSelectedRoom(room);
  };

  const handleNextFromRoom = () => {
    if (selectedRoom) {
      setCurrentStep('fill-form');
    }
  };

  const handleBack = () => {
    switch (currentStep) {
      case 'fill-form':
        setCurrentStep('select-room');
        setSelectedRoom(null);
        break;
      default:
        break;
    }
  };

  const handleSuccess = () => {
    console.log('handleSuccess called - showing notification modal');
    // Hiển thị modal thông báo ngay lập tức, không chuyển sang step success
    setShowSuccessModal(true);
    console.log('showSuccessModal set to true immediately');
    // Gọi onSuccess sau một chút để đảm bảo modal đã render
    if (onSuccess) {
      setTimeout(() => {
        onSuccess();
      }, 100);
    }
  };

  const handleClose = () => {
    // Reset state
    setCurrentStep('select-room');
    setSelectedRoom(null);
    setShowSuccessModal(false);
    onClose();
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Sau khi đóng NotificationModal, đóng form đăng tin
    setTimeout(() => {
      handleClose();
    }, 300); // Delay nhỏ để animation mượt hơn
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'select-room':
        return 'Chọn phòng';
      case 'fill-form':
        return 'Thông tin bài đăng';
      case 'success':
        return 'Tạo bài đăng thành công';
      default:
        return 'Tạo bài đăng mới';
    }
  };

  const getStepNumber = () => {
    switch (currentStep) {
      case 'select-room':
        return 1;
      case 'fill-form':
        return 2;
      case 'success':
        return 3;
      default:
        return 1;
    }
  };

  const renderStepContent = () => {
    // Yêu cầu tài khoản đã xác thực mới được đăng bài
    if (!user?.isVerified) {
      return (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86A2.07 2.07 0 0021 16.93V7.07A2.07 2.07 0 0018.93 5H5.07A2.07 2.07 0 003 7.07v9.86A2.07 2.07 0 005.07 19z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Cần xác thực tài khoản</h3>
          <p className="text-gray-600 mb-4">Vui lòng xác thực danh tính trước khi đăng bài để bảo vệ cộng đồng.</p>
          <a
            href="/profile"
            className="inline-flex items-center px-5 py-2 rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
          >
            Xác thực ngay
          </a>
        </div>
      );
    }

    switch (currentStep) {
      case 'select-room':
        return (
          <RoomSelector
            postType={selectedType!}
            selectedRoom={selectedRoom}
            onSelectRoom={handleSelectRoom}
            onBack={handleBack}
            onNext={handleNextFromRoom}
          />
        );

      case 'fill-form':
        return (
          <PostFormUnified
            postType={selectedType!}
            selectedRoom={selectedRoom!}
            onBack={handleBack}
            onSuccess={handleSuccess}
          />
        );

      case 'success':
        return (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tạo bài đăng thành công!
            </h3>
            <p className="text-gray-600 mb-6">
              Bài đăng của bạn đã được tạo và sẽ hiển thị ngay lập tức.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={() => {
                  setCurrentStep('select-room');
                  setSelectedRoom(null);
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Tạo bài đăng khác
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {!showSuccessModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-teal-600 font-semibold text-sm">
                    {getStepNumber()}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  {user?.role === 'landlord' ? 'Đăng tin cho thuê' : 'Đăng tin tìm ở ghép'}
                </h2>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Bar */}
          {currentStep !== 'success' && (
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Bước {getStepNumber()} / 3
                </span>
                <span className="text-sm text-gray-500">
                  {Math.round((getStepNumber() / 3) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(getStepNumber() / 3) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {renderStepContent()}
          </div>
        </div>
      </div>
      )}

      {/* Success Notification Modal - Render outside to ensure proper z-index */}
      {console.log('Rendering NotificationModal, showSuccessModal:', showSuccessModal)}
      <NotificationModal
        isOpen={showSuccessModal}
        onClose={handleSuccessModalClose}
        type="info"
        title="Đăng bài thành công"
        message="Bài đăng của bạn sẽ được duyệt sớm nhất có thể, cảm ơn đã tin tưởng chúng tôi"
        duration={5000}
      />
    </>
  );
}