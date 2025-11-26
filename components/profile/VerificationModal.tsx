"use client";

import { useState } from 'react';
import { submitVerification } from "../../services/verification";
import { VerificationData, FaceMatchResult } from "../../types/User";
import { compareFaces, getStatusMessage, validateFaceMatchResult, createFaceMatchResult } from "../../services/faceMatch";
import { processOCRWithFPT } from "../../services/ocr";
import { VERIFICATION_CONSTANTS } from "../../utils/verificationConstants";
import NotificationToast from "../common/NotificationToast";
import { FiAlertTriangle } from 'react-icons/fi';
import { FaCheckCircle, FaInfoCircle, FaCamera, FaCloudUploadAlt } from 'react-icons/fa';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: VerificationData) => void;
  skipAutoSubmit?: boolean; // Nếu true, chỉ gọi onVerify mà không submit thực sự
}



export default function VerificationModal({ isOpen, onClose, onVerify, skipAutoSubmit = false }: VerificationModalProps) {
  const [step, setStep] = useState<'upload' | 'face' | 'review' | 'success'>('upload');
  const [formData, setFormData] = useState<Partial<VerificationData>>({});
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [faceImage, setFaceImage] = useState<string>('');
  const [faceMatchResult, setFaceMatchResult] = useState<FaceMatchResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFaceMatching, setIsFaceMatching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Notification state
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    title: string;
    message: string;
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  });

  const showNotification = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    setNotification({ isOpen: true, type, title, message });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back' | 'face') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = URL.createObjectURL(file);
    
    switch (type) {
      case 'front':
        setFrontImage(imageUrl);
        break;
      case 'back':
        setBackImage(imageUrl);
        break;
      case 'face':
        setFaceImage(imageUrl);
        break;
    }
  };

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFaceMatch = async () => {
    if (!frontImage || !faceImage) {
      showNotification('warning', 'Thiếu ảnh', 'Vui lòng tải lên đầy đủ ảnh CCCD và ảnh khuôn mặt');
      return;
    }

    setIsFaceMatching(true);
    try {
      const result = await compareFaces(frontImage, faceImage);
      setFaceMatchResult(result);
      
      const statusMessage = getStatusMessage(result);
      const message = result.similarity >= 50 
        ? `${statusMessage}\n\nBạn sẽ được tự động xác thực!`
        : `${statusMessage}\n\nHồ sơ của bạn sẽ được admin xem xét.`;
      
      showNotification(
        result.similarity >= 50 ? 'success' : 'warning',
        result.similarity >= 50 ? 'So sánh thành công' : 'Cần xem xét',
        message
      );
      setStep('review');
    } catch (error: any) {
      showNotification('error', 'Lỗi so sánh khuôn mặt', error.message || 'Không thể so sánh khuôn mặt. Vui lòng thử lại.');
    } finally {
      setIsFaceMatching(false);
    }
  };

  const handleSubmit = async () => {
    const normalized: VerificationData | null = await (async (): Promise<VerificationData | null> => {
      const idNumber = (formData.idNumber || '').trim();
      const fullName = (formData.fullName || '').trim();
      const dateOfBirth = (formData.dateOfBirth || '').trim();
      const issueDate = (formData.issueDate || '').trim();
      const issuePlace = (formData.issuePlace || 'Cục cảnh sát quản lý hành chính về trật tự xã hội').trim();
      const gender = formData.gender as 'male' | 'female' | undefined;
      
      if (!idNumber || !fullName || !dateOfBirth || !issueDate || !issuePlace || !gender) {
        return null;
      }
      
      // Tạo faceMatchResult theo API mới - chỉ gửi match và similarity (Backend tự động tính confidence)
      let faceMatchForSubmission: FaceMatchResult | undefined;
      if (faceMatchResult) {
        faceMatchForSubmission = {
          match: faceMatchResult.match,
          similarity: faceMatchResult.similarity
          // confidence sẽ được Backend tự động tính dựa trên similarity
        };
      }
      
      // Compress image theo API guide - tối ưu cho S3 storage
      const compressImage = async (imageUrl: string): Promise<string | undefined> => {
        if (!imageUrl?.startsWith('blob:')) return undefined;
        
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          
          return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
              // Tối ưu theo API guide: maxWidth = 800, quality = 0.8
              const maxWidth = 800;
              const quality = 0.8;
              const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
              
              canvas.width = img.width * ratio;
              canvas.height = img.height * ratio;
              ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
              
              resolve(canvas.toDataURL('image/jpeg', quality));
            };
            
            img.src = imageUrl;
          });
        } catch {
          return undefined;
        }
      };
      
      // Compress images to base64 cho S3 upload
      const [frontBase64, backBase64, faceBase64] = await Promise.all([
        compressImage(frontImage),
        compressImage(backImage),
        compressImage(faceImage)
      ]);
      
      // Validate total size - giới hạn cho S3
      const totalSize = (frontBase64?.length || 0) + (backBase64?.length || 0) + (faceBase64?.length || 0);
      
      if (totalSize > VERIFICATION_CONSTANTS.MAX_TOTAL_SIZE) {
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        showNotification('warning', 'Ảnh quá lớn', `${VERIFICATION_CONSTANTS.MESSAGES.IMAGE_TOO_LARGE} (${sizeInMB}MB)`);
        return null;
      }
      
      return { 
        idNumber, 
        fullName, 
        dateOfBirth, 
        issueDate, 
        issuePlace, 
        gender,
        faceMatchResult: faceMatchForSubmission,
        images: {
          frontImage: frontBase64,
          backImage: backBase64,
          faceImage: faceBase64
        }
      };
    })();

    if (!normalized) {
      showNotification('warning', 'Thiếu thông tin', VERIFICATION_CONSTANTS.MESSAGES.REQUIRED_FIELDS);
      return;
    }

    setIsSubmitting(true);
    try {
      // Nếu skipAutoSubmit = true, chỉ gọi onVerify mà không submit thực sự
      if (skipAutoSubmit) {
        onVerify(normalized);
        setStep('success');
        // Không tự đóng modal, để parent điều khiển
        return;
      }

      // Normal flow: submit verification
      const response = await submitVerification(normalized);
      
      // Hiển thị thông báo theo status từ backend - theo API guide mới
      const message = response.verification.status === 'approved'
        ? `Hồ sơ đã được xác thực thành công!\n\nBạn đã được tự động xác thực nhờ AI so sánh khuôn mặt.\nĐộ tương đồng: ${response.verification.faceMatchResult?.similarity || 0}%\nConfidence: ${response.verification.faceMatchResult?.confidence || 'high'}`
        : `${VERIFICATION_CONSTANTS.MESSAGES.SUBMIT_SUCCESS}\n\nHồ sơ của bạn đang chờ admin xem xét.\nĐộ tương đồng: ${response.verification.faceMatchResult?.similarity || 0}%\nConfidence: ${response.verification.faceMatchResult?.confidence || 'low'}`;
      
      showNotification(
        response.verification.status === 'approved' ? 'success' : 'info',
        response.verification.status === 'approved' ? 'Xác thực thành công' : 'Đã gửi hồ sơ',
        message
      );
      onVerify(normalized);
      
      setStep('success');
      setTimeout(() => {
        onClose();
        setStep('upload');
        setFormData({});
        setFrontImage('');
        setBackImage('');
        setFaceImage('');
        setFaceMatchResult(null);
      }, 2000);
      
    } catch (error: any) {
      // Fallback: thử gửi không có ảnh nếu bị lỗi kích thước (S3 limit)
      if (error.message?.includes('request entity too large') || error.message?.includes('413')) {
        try {
          await submitVerification({ ...normalized, images: undefined });
          showNotification(
            'success',
            'Đã gửi hồ sơ',
            `${VERIFICATION_CONSTANTS.MESSAGES.SUBMIT_SUCCESS_WITHOUT_IMAGES}\n\nHồ sơ của bạn đang chờ admin xem xét.\nẢnh sẽ được admin xem xét riêng.`
          );
          onVerify(normalized);
          setStep('success');
          setTimeout(() => {
            onClose();
            setStep('upload');
            setFormData({});
            setFrontImage('');
            setBackImage('');
            setFaceImage('');
            setFaceMatchResult(null);
          }, 2000);
          return;
        } catch (retryError: any) {
          showNotification(
            'error',
            'Lỗi gửi hồ sơ',
            `${VERIFICATION_CONSTANTS.MESSAGES.SUBMIT_ERROR} ${retryError.message || 'Vui lòng thử lại'}`
          );
        }
      } else {
        showNotification(
          'error',
          'Lỗi gửi hồ sơ',
          `${VERIFICATION_CONSTANTS.MESSAGES.SUBMIT_ERROR} ${error.message || 'Vui lòng thử lại'}`
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Xác thực danh tính</h2>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <span className="text-lg">×</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCloudUploadAlt className="text-teal-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tải lên ảnh CCCD/CMND
                </h3>
                <p className="text-gray-600 mb-2">
                  Vui lòng tải lên ảnh mặt trước và mặt sau của CCCD/CMND để xác thực danh tính
                </p>
                {!frontImage || !backImage ? (
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <FiAlertTriangle className="text-amber-600" />
                    <span className="text-sm text-amber-700 font-medium">
                      Cần tải cả 2 mặt để bắt đầu xử lý
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Đã tải đủ 2 mặt, đang xử lý...
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Front Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mặt trước CCCD/CMND
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                    {frontImage ? (
                      <div className="space-y-2">
                        <img
                          src={frontImage}
                          alt="Mặt trước CCCD"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="flex items-center justify-between relative z-10">
                          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <FaCheckCircle className="h-4 w-4" />
                            Đã tải lên
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setFrontImage('');
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FaCloudUploadAlt className="text-gray-400 text-2xl mx-auto" />
                        <p className="text-sm text-gray-600">Tải lên ảnh mặt trước</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'front')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Back Image */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mặt sau CCCD/CMND
                  </label>
                  <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
                    {backImage ? (
                      <div className="space-y-2">
                        <img
                          src={backImage}
                          alt="Mặt sau CCCD"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <div className="flex items-center justify-between relative z-10">
                          <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                            <FaCheckCircle className="h-4 w-4" />
                            Đã tải lên
                          </p>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setBackImage('');
                            }}
                            className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <FaCloudUploadAlt className="text-gray-400 text-2xl mx-auto" />
                        <p className="text-sm text-gray-600">Tải lên ảnh mặt sau</p>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, 'back')}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {isProcessing && (
                <div className="text-center py-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center space-x-2 text-teal-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-600"></div>
                      <span>Đang xử lý và đọc thông tin...</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Đang gửi ảnh đến FPT.AI OCR API</p>
                      <p>• Đang phân tích ảnh mặt trước CCCD/CMND</p>
                      <p>• Đang phân tích ảnh mặt sau CCCD/CMND</p>
                      <p>• Đang trích xuất thông tin cá nhân</p>
                      <p>• Đang xác thực tính hợp lệ của thông tin</p>
                    </div>
                  </div>
                </div>
              )}

              {frontImage && backImage && !isProcessing && (
                <div className="text-center">
                  <button
                    onClick={async () => {
                      setIsProcessing(true);
                      try {
                        // Real OCR processing with FPT.AI
                        const ocrData = await processOCRWithFPT(frontImage, backImage);
                        
                        setFormData(prev => ({
                          ...prev,
                          ...ocrData,
                          frontImage: frontImage,
                          backImage: backImage
                        }));
                        setStep('face'); // Chuyển sang step upload ảnh khuôn mặt
                      } catch (error) {
                        // OCR processing failed
                        // Show error message to user
                        showNotification('error', 'Lỗi xử lý ảnh', 'Không thể xử lý ảnh CCCD/CMND. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
                      } finally {
                        setIsProcessing(false);
                      }
                    }}
                    className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                  >
                    Xử lý thông tin
                  </button>
                </div>
              )}
            </div>
          )}

          {step === 'face' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCamera className="text-blue-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tải lên ảnh khuôn mặt
                </h3>
                <p className="text-gray-600 mb-4">
                  Vui lòng tải lên ảnh khuôn mặt của bạn để so sánh với ảnh trên CCCD/CMND
                </p>
                
                <div className="space-y-3 mb-4">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                    <FaInfoCircle className="text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      Ảnh khuôn mặt sẽ được AI so sánh để xác thực danh tính
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p className="font-medium flex items-center gap-2">
                      <FaCamera className="text-blue-500" />
                      Hướng dẫn chụp ảnh tốt nhất:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-xs text-gray-500 ml-2">
                      <li>Chụp thẳng mặt, nhìn vào camera</li>
                      <li>Đảm bảo ánh sáng đủ, rõ nét</li>
                      <li>Không đeo kính râm, khẩu trang</li>
                      <li>Khuôn mặt chiếm 70-80% khung hình</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="max-w-lg mx-auto">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ảnh khuôn mặt của bạn
                </label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
                  {faceImage ? (
                    <div className="space-y-2">
                      <div className="relative w-full h-64 bg-gray-50 rounded-lg overflow-hidden">
                        <img
                          src={faceImage}
                          alt="Ảnh khuôn mặt"
                          className="w-full h-full object-contain rounded-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between relative z-10">
                        <p className="text-sm text-green-600 font-medium flex items-center gap-2">
                          <FaCheckCircle className="h-4 w-4" />
                          Đã tải lên
                        </p>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFaceImage('');
                          }}
                          className="text-red-500 hover:text-red-700 text-sm font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <FaCamera className="text-gray-400 text-2xl mx-auto" />
                      <p className="text-sm text-gray-600">Tải lên ảnh khuôn mặt</p>
                      <p className="text-xs text-gray-500">Chụp ảnh selfie hoặc tải từ thư viện</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    capture="user" // Cho phép chụp ảnh trực tiếp
                    onChange={(e) => handleImageUpload(e, 'face')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
              </div>

              {isFaceMatching && (
                <div className="text-center py-4">
                  <div className="space-y-3">
                    <div className="inline-flex items-center space-x-2 text-blue-600">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                      <span>Đang so sánh khuôn mặt...</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>• Đang gửi ảnh đến FPT.AI FaceMatch API</p>
                      <p>• Đang phân tích khuôn mặt trên CCCD</p>
                      <p>• Đang so sánh với ảnh khuôn mặt của bạn</p>
                      <p>• Đang tính toán độ tương đồng</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleFaceMatch}
                  disabled={!faceImage || isFaceMatching}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isFaceMatching ? 'Đang xử lý...' : 'So sánh khuôn mặt'}
                </button>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheckCircle className="text-green-600 text-2xl" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kiểm tra thông tin
                </h3>
                <p className="text-gray-600 mb-4">
                  Vui lòng kiểm tra và chỉnh sửa thông tin được đọc từ CCCD/CMND
                </p>
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <FaCheckCircle className="text-green-600" />
                    <span className="text-sm text-green-700 font-medium">
                      Đã đọc thành công thông tin từ ảnh CCCD/CMND
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Được xử lý bởi FPT.AI OCR API • Độ chính xác cao • Thời gian xử lý nhanh
                  </div>
                </div>

                {/* FaceMatch Result */}
                {faceMatchResult && (
                  <div className="mt-4">
                    <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                      faceMatchResult.similarity >= 50 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <span className={faceMatchResult.similarity >= 50 ? 'text-green-600' : 'text-amber-600'}>
                        {faceMatchResult.similarity >= 50 ? (
                          <FaCheckCircle className="h-4 w-4" />
                        ) : (
                          <FiAlertTriangle className="h-4 w-4" />
                        )}
                      </span>
                      <span className={`text-sm font-medium ${
                        faceMatchResult.similarity >= 50 ? 'text-green-700' : 'text-amber-700'
                      }`}>
                        {getStatusMessage(faceMatchResult)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Được xử lý bởi FPT.AI FaceMatch API • AI sẽ tự động quyết định xác thực
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <FiAlertTriangle className="text-amber-600 text-lg mt-1" />
                  <div>
                    <h4 className="font-medium text-amber-800 mb-1">Lưu ý quan trọng</h4>
                    <p className="text-sm text-amber-700">
                      Thông tin được đọc tự động từ ảnh CCCD/CMND. Vui lòng kiểm tra kỹ và chỉnh sửa nếu cần thiết. 
                      Thông tin sai có thể ảnh hưởng đến quá trình xác thực.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Số căn cước
                  </label>
                  <input
                    type="text"
                    value={formData.idNumber || ''}
                    onChange={(e) => handleInputChange('idNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nhập số căn cước"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Họ và tên
                  </label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nhập họ và tên"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ngày cấp
                  </label>
                  <input
                    type="date"
                    value={formData.issueDate || ''}
                    onChange={(e) => handleInputChange('issueDate', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nơi cấp
                  </label>
                  <input
                    type="text"
                    value={formData.issuePlace || 'Cục cảnh sát quản lý hành chính về trật tự xã hội'}
                    onChange={(e) => handleInputChange('issuePlace', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Nơi cấp CCCD/CMND"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Giới tính
                  </label>
                  <select
                    value={formData.gender || ''}
                    onChange={(e) => handleInputChange('gender', e.target.value as 'male' | 'female')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Chọn giới tính</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setStep('upload')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Quay lại
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Xác thực'}
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheckCircle className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Xác thực thành công!
              </h3>
              <p className="text-gray-600">
                Thông tin của bạn đã được xác thực. Bây giờ bạn có thể đăng tin cho thuê.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      <NotificationToast
        isOpen={notification.isOpen}
        onClose={() => setNotification({ ...notification, isOpen: false })}
        type={notification.type}
        title={notification.title}
        message={notification.message}
      />
    </div>
  );
}
