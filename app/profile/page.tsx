"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { updateUserProfile, updateUserAvatar } from "../../services/user";
import Footer from "../../components/common/Footer";
import ProfileHeader from "../../components/profile/ProfileHeader";
import ProfileForm from "../../components/profile/ProfileForm";
import AccountSettings from "../../components/profile/AccountSettings";
import { VerificationData } from "../../types/User";
import { useToast } from "../../contexts/ToastContext";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isVerified, setIsVerified] = useState(false); // Trạng thái xác thực
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    avatar: user?.avatar || "",
  });
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Lưu file để upload sau
      setSelectedAvatarFile(file);
      // Tạo URL tạm thời để preview
      const imageUrl = URL.createObjectURL(file);
      setAvatarPreview(imageUrl);
    }
  };

  const handleSave = async () => {
    try {
      // 1. Upload avatar nếu có
      if (selectedAvatarFile) {
        try {
          await updateUserAvatar(selectedAvatarFile);
          setSelectedAvatarFile(null);
          setAvatarPreview("");
        } catch (avatarError: any) {
          // Hiển thị thông báo CORS và tiếp tục
          if (avatarError.message?.includes('CORS')) {
            showWarning(
              'Upload avatar thất bại - CORS Error',
              "Cần yêu cầu Backend config S3 CORS policy:\n" +
              "• Thêm origin: http://localhost:3000\n" +
              "• Allow methods: GET, PUT, POST\n" +
              "• Allow headers: *\n\n" +
              "Thông tin khác sẽ được lưu bình thường."
            );
          } else {
            showWarning(
              'Upload avatar thất bại',
              avatarError.message + "\n\nThông tin khác sẽ được lưu bình thường."
            );
          }
          setAvatarPreview("");
          setSelectedAvatarFile(null);
        }
      }
      
      // 2. Update thông tin khác
      const { avatar, ...otherData } = formData;
      if (Object.keys(otherData).some(key => otherData[key as keyof typeof otherData] !== "")) {
        await updateUserProfile(otherData);
      }
      
      // 3. Refresh và thông báo
      if (refreshUser) {
        await refreshUser();
      }
      
      setIsEditing(false);
      showSuccess('Cập nhật thành công', 'Thông tin cá nhân đã được cập nhật thành công!');
    } catch (error: any) {
      showError('Cập nhật thất bại', error?.message || 'Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      avatar: user?.avatar || "",
    });
    setAvatarPreview(""); // Clear preview
    setSelectedAvatarFile(null); // Clear selected file
    setIsEditing(false);
  };

  const handleVerificationComplete = async (data: VerificationData) => {
    // Xử lý xác thực hoàn tất - refresh user data
    if (refreshUser) {
      await refreshUser();
    }
    
    // Cập nhật trạng thái isVerified ngay lập tức
    setIsVerified(true);
  };

  // Refresh user data khi component mount để đảm bảo có dữ liệu mới nhất
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        avatar: user.avatar || "",
      });
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Thông tin cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin tài khoản của bạn</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <ProfileHeader 
            user={{...formData, isVerified: user?.isVerified}}
            isEditing={isEditing}
            onEditClick={() => setIsEditing(true)}
          />
          
          <ProfileForm
            formData={formData}
            isEditing={isEditing}
            onInputChange={handleInputChange}
            onAvatarChange={handleAvatarChange}
            avatarPreview={avatarPreview}
            onSave={handleSave}
            onCancel={handleCancel}
            onEditClick={() => setIsEditing(true)}
          />
          
          <AccountSettings 
            isVerified={user?.isVerified || false}
            onVerificationComplete={handleVerificationComplete}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
}
