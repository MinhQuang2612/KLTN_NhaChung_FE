"use client";

import { useState, useEffect } from "react";
import { updateRentPost } from "../../services/rentPosts";

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onSuccess: () => void;
}

export default function EditPostModal({ isOpen, onClose, post, onSuccess }: EditPostModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    basicInfo: {
      area: 0,
      price: 0,
      deposit: 0,
      furniture: '',
      bedrooms: 0,
      bathrooms: 0,
      direction: '',
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form data when post changes
  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        description: post.description || '',
        basicInfo: {
          area: post.basicInfo?.area || 0,
          price: post.basicInfo?.price || 0,
          deposit: post.basicInfo?.deposit || 0,
          furniture: post.basicInfo?.furniture || '',
          bedrooms: post.basicInfo?.bedrooms || 0,
          bathrooms: post.basicInfo?.bathrooms || 0,
          direction: post.basicInfo?.direction || '',
        }
      });
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post?.rentPostId) return;

    try {
      setLoading(true);
      setError(null);

      await updateRentPost(post.rentPostId, formData);
      
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update post:', err);
      setError('Không thể cập nhật bài đăng. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('basicInfo.')) {
      const field = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        basicInfo: {
          ...prev.basicInfo,
          [field]: field === 'area' || field === 'price' || field === 'deposit' || field === 'bedrooms' || field === 'bathrooms' 
            ? parseInt(value) || 0 
            : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <div 
  className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
  onClick={onClose}
>
  <div 
    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
    onClick={(e) => e.stopPropagation()}
  >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa bài đăng</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Thông tin cơ bản</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Nhập tiêu đề bài đăng"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mô tả
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="Mô tả chi tiết về phòng trọ"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Diện tích (m²) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="basicInfo.area"
                  value={formData.basicInfo.area}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá thuê (VNĐ/tháng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="basicInfo.price"
                  value={formData.basicInfo.price}
                  onChange={handleInputChange}
                  required
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tiền cọc (VNĐ)
                </label>
                <input
                  type="number"
                  name="basicInfo.deposit"
                  value={formData.basicInfo.deposit}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nội thất
                </label>
                <select
                  name="basicInfo.furniture"
                  value={formData.basicInfo.furniture}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Chọn tình trạng nội thất</option>
                  <option value="trong">Trống</option>
                  <option value="co-ban">Cơ bản</option>
                  <option value="full">Đầy đủ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số phòng ngủ
                </label>
                <input
                  type="number"
                  name="basicInfo.bedrooms"
                  value={formData.basicInfo.bedrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Số phòng tắm
                </label>
                <input
                  type="number"
                  name="basicInfo.bathrooms"
                  value={formData.basicInfo.bathrooms}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hướng nhà
                </label>
                <select
                  name="basicInfo.direction"
                  value={formData.basicInfo.direction}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                >
                  <option value="">Chọn hướng nhà</option>
                  <option value="dong">Đông</option>
                  <option value="tay">Tây</option>
                  <option value="nam">Nam</option>
                  <option value="bac">Bắc</option>
                  <option value="dong-nam">Đông Nam</option>
                  <option value="dong-bac">Đông Bắc</option>
                  <option value="tay-nam">Tây Nam</option>
                  <option value="tay-bac">Tây Bắc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Đang lưu...
                </div>
              ) : (
                'Lưu thay đổi'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
