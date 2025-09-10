"use client";

import { useState } from 'react';
import { submitVerification } from "../../services/verification";
import { VerificationData } from "../../types/User";
// import { X, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerify: (data: VerificationData) => void;
}

// Remove local interface since we import from types/User.ts

// Real OCR processing using FPT.AI Reader API
const processOCRWithFPT = async (frontImage: string, backImage: string) => {
  try {
    // Convert image URLs to base64
    const frontBase64 = await convertImageToBase64(frontImage);
    const backBase64 = await convertImageToBase64(backImage);
    
    // Call FPT.AI Reader API for front image
    const frontFormData = new FormData();
    frontFormData.append('image', await base64ToBlob(frontBase64), 'front.jpg');
    
    const frontResponse = await fetch('https://api.fpt.ai/vision/idr/vnm', {
      method: 'POST',
      headers: {
        'api-key': process.env.NEXT_PUBLIC_FPT_AI_API_KEY || 'FpwWCzDI8aMcEoLLAuZVeqwvLguAeNCB',
      },
      body: frontFormData
    });
    
    const frontData = await frontResponse.json();
    
    // Call FPT.AI Reader API for back image
    const backFormData = new FormData();
    backFormData.append('image', await base64ToBlob(backBase64), 'back.jpg');
    
    const backResponse = await fetch('https://api.fpt.ai/vision/idr/vnm', {
      method: 'POST',
      headers: {
        'api-key': process.env.NEXT_PUBLIC_FPT_AI_API_KEY || 'FpwWCzDI8aMcEoLLAuZVeqwvLguAeNCB',
      },
      body: backFormData
    });
    
    const backData = await backResponse.json();
    
    // Extract and combine data from both images
    return extractDataFromFPTResponse(frontData, backData);
    
  } catch (error) {
    // OCR processing failed
    throw error; // Re-throw error instead of using mock data
  }
};

// Convert image URL to base64
const convertImageToBase64 = async (imageUrl: string): Promise<string> => {
  const response = await fetch(imageUrl);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove data:image/jpeg;base64, prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Convert base64 to Blob for FormData
const base64ToBlob = async (base64: string): Promise<Blob> => {
  const response = await fetch(`data:image/jpeg;base64,${base64}`);
  return response.blob();
};

// Extract data from FPT.AI response
const extractDataFromFPTResponse = (frontData: any, backData: any) => {
  // Preview OCR data in UI if needed
  
  // FPT.AI response structure based on the API documentation
  const frontInfo = frontData.data?.[0] || {};
  const backInfo = backData.data?.[0] || {};
  
  return {
    idNumber: frontInfo.Số || frontInfo.id || '',
    fullName: frontInfo.Tên || frontInfo.name || '',
    dateOfBirth: formatDate(frontInfo['Ngày sinh'] || frontInfo.dob) || '',
    issueDate: formatDate(backInfo['Ngày cấp'] || backInfo.issue_date) || '',
    issuePlace: backInfo['Nơi cấp'] || backInfo.issue_place || '',
    gender: (frontInfo['Giới tính'] === 'Nam' || frontInfo.sex === 'Nam' ? 'male' : 'female') as 'male' | 'female'
  };
};

// Format date from various formats to YYYY-MM-DD
const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  
  // Handle Vietnamese date format: DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
  }
  
  // Handle other date formats
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
};


export default function VerificationModal({ isOpen, onClose, onVerify }: VerificationModalProps) {
  const [step, setStep] = useState<'upload' | 'review' | 'success'>('upload');
  const [formData, setFormData] = useState<Partial<VerificationData>>({});
  const [frontImage, setFrontImage] = useState<string>('');
  const [backImage, setBackImage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'front' | 'back') => {
    const file = e.target.files?.[0];
    // Uploading file
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      if (type === 'front') {
        setFrontImage(imageUrl);
        // Set front image
      } else {
        setBackImage(imageUrl);
        // Set back image
      }
    }
  };

  const handleInputChange = (field: keyof VerificationData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    // Chuẩn hóa dữ liệu và gán giá trị mặc định cho nơi cấp nếu chưa nhập
    const normalized: VerificationData | null = (() => {
      const idNumber = (formData.idNumber || '').trim();
      const fullName = (formData.fullName || '').trim();
      const dateOfBirth = (formData.dateOfBirth || '').trim();
      const issueDate = (formData.issueDate || '').trim();
      const issuePlace = (formData.issuePlace || 'Cục cảnh sát quản lý hành chính về trật tự xã hội').trim();
      const gender = formData.gender as 'male' | 'female' | undefined;
      if (!idNumber || !fullName || !dateOfBirth || !issueDate || !issuePlace || !gender) return null;
      return { idNumber, fullName, dateOfBirth, issueDate, issuePlace, gender };
    })();

    if (normalized) {
      
      try {
        // Gọi API thật từ Backend
        const response = await submitVerification(normalized as VerificationData);
        // Success
        
        // Thông báo cho parent component
        onVerify(normalized as VerificationData);
        
        setStep('success');
        setTimeout(() => {
          onClose();
          setStep('upload');
          setFormData({});
          setFrontImage('');
          setBackImage('');
        }, 2000);
        
      } catch (error: any) {
        // Failed to submit verification
        alert('❌ Gửi yêu cầu xác thực thất bại: ' + (error.message || 'Vui lòng thử lại'));
      }
    } else {
      alert('⚠️ Vui lòng điền đầy đủ thông tin bắt buộc');
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
                  <span className="text-teal-600 text-2xl">📤</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tải lên ảnh CCCD/CMND
                </h3>
                <p className="text-gray-600 mb-2">
                  Vui lòng tải lên ảnh mặt trước và mặt sau của CCCD/CMND để xác thực danh tính
                </p>
                {!frontImage || !backImage ? (
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-600">⚠</span>
                    <span className="text-sm text-amber-700 font-medium">
                      Cần tải cả 2 mặt để bắt đầu xử lý
                    </span>
                  </div>
                ) : (
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600">✓</span>
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
                          <p className="text-sm text-green-600 font-medium">✓ Đã tải lên</p>
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
                        <span className="text-gray-400 text-2xl">📤</span>
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
                          <p className="text-sm text-green-600 font-medium">✓ Đã tải lên</p>
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
                        <span className="text-gray-400 text-2xl">📤</span>
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
                        setStep('review');
                      } catch (error) {
                        // OCR processing failed
                        // Show error message to user
                        alert('Không thể xử lý ảnh CCCD/CMND. Vui lòng thử lại hoặc kiểm tra kết nối mạng.');
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

          {step === 'review' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 text-2xl">✓</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Kiểm tra thông tin
                </h3>
                <p className="text-gray-600 mb-4">
                  Vui lòng kiểm tra và chỉnh sửa thông tin được đọc từ CCCD/CMND
                </p>
                <div className="space-y-2">
                  <div className="inline-flex items-center space-x-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-green-700 font-medium">
                      Đã đọc thành công thông tin từ ảnh CCCD/CMND
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Được xử lý bởi FPT.AI OCR API • Độ chính xác cao • Thời gian xử lý nhanh
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <span className="text-amber-600 text-lg">⚠</span>
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
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Xác thực
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-green-600 text-2xl">✓</span>
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
    </div>
  );
}
