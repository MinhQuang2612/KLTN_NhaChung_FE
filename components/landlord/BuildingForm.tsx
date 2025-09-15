"use client";

import { useState, useEffect } from "react";
import { CreateBuildingPayload, UpdateBuildingPayload, BuildingType } from "../../types/Building";
import { Address } from "../../types/RentPost";
import { addressService } from "../../services/address";
import { uploadFiles } from "../../utils/upload";
import MediaPickerPanel, { LocalMediaItem } from "../common/MediaPickerLocal";

interface BuildingFormProps {
  initialData?: Partial<CreateBuildingPayload>;
  onSubmit: (data: CreateBuildingPayload | UpdateBuildingPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}

const BUILDING_TYPES: { id: BuildingType; label: string; description: string }[] = [
  { id: "chung-cu", label: "Chung cư", description: "Tòa nhà chung cư cao tầng" },
  { id: "nha-nguyen-can", label: "Nhà nguyên căn", description: "Nhà phố, biệt thự" },
  { id: "phong-tro", label: "Phòng trọ", description: "Nhà trọ, ký túc xá" },
];

export default function BuildingForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false 
}: BuildingFormProps) {
  const [formData, setFormData] = useState<CreateBuildingPayload>({
    name: "",
    address: {
      street: "",
      ward: "",
      city: "",
      provinceCode: "",
      provinceName: "",
      wardCode: "",
      wardName: "",
      specificAddress: "",
      showSpecificAddress: false,
      additionalInfo: "",
    },
    totalFloors: 1,
    totalRooms: 1,
    buildingType: "chung-cu",
    images: [],
    description: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Initialize media items from existing images
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      const items: LocalMediaItem[] = formData.images.map((url, index) => ({
        id: `existing-${index}`,
        type: "image",
        url,
        file: null,
        isUploaded: true,
      }));
      setMediaItems(items);
    }
  }, [formData.images]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAddressChange = (field: keyof Address, value: any) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value,
      },
    }));
  };

  const handleMediaChange = (items: LocalMediaItem[]) => {
    setMediaItems(items);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Tên dãy là bắt buộc";
    }

    if (!formData.address.city) {
      newErrors.city = "Thành phố là bắt buộc";
    }

    if (!formData.address.ward) {
      newErrors.ward = "Phường/xã là bắt buộc";
    }

    if (formData.totalFloors < 1) {
      newErrors.totalFloors = "Số tầng phải lớn hơn 0";
    }

    if (formData.totalRooms < 1) {
      newErrors.totalRooms = "Số phòng phải lớn hơn 0";
    }

    if (mediaItems.length < 1) {
      newErrors.images = "Cần ít nhất 1 ảnh";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);
      
      // Upload new images
      const newImages = mediaItems
        .filter(item => !item.isUploaded && item.file)
        .map(item => item.file!);
      
      let uploadedUrls: string[] = [];
      if (newImages.length > 0) {
        uploadedUrls = await uploadFiles(newImages);
      }

      // Combine existing and new images
      const existingImages = mediaItems
        .filter(item => item.isUploaded)
        .map(item => item.url);
      
      const allImages = [...existingImages, ...uploadedUrls];

      const submitData = {
        ...formData,
        images: allImages,
      };

      onSubmit(submitData);
    } catch (error) {
      console.error("Error uploading images:", error);
      setErrors({ images: "Có lỗi khi tải ảnh lên. Vui lòng thử lại." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="px-6 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin cơ bản</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Building Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên dãy <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập tên dãy nhà"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            {/* Building Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại dãy <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.buildingType}
                onChange={(e) => handleInputChange("buildingType", e.target.value as BuildingType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                {BUILDING_TYPES.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Total Floors */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số tầng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalFloors}
                onChange={(e) => handleInputChange("totalFloors", parseInt(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.totalFloors ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.totalFloors && <p className="mt-1 text-sm text-red-600">{errors.totalFloors}</p>}
            </div>

            {/* Total Rooms */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số phòng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.totalRooms}
                onChange={(e) => handleInputChange("totalRooms", parseInt(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.totalRooms ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.totalRooms && <p className="mt-1 text-sm text-red-600">{errors.totalRooms}</p>}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className="px-6 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin địa chỉ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thành phố <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.city ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập thành phố"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>

            {/* Ward */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phường/Xã <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address.ward}
                onChange={(e) => handleAddressChange("ward", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.ward ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Nhập phường/xã"
              />
              {errors.ward && <p className="mt-1 text-sm text-red-600">{errors.ward}</p>}
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đường
              </label>
              <input
                type="text"
                value={formData.address.street || ""}
                onChange={(e) => handleAddressChange("street", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Nhập tên đường"
              />
            </div>

            {/* Specific Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ cụ thể
              </label>
              <input
                type="text"
                value={formData.address.specificAddress || ""}
                onChange={(e) => handleAddressChange("specificAddress", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Số nhà, tên đường..."
              />
            </div>

            {/* Additional Info */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thông tin bổ sung
              </label>
              <textarea
                value={formData.address.additionalInfo || ""}
                onChange={(e) => handleAddressChange("additionalInfo", e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Hướng dẫn đường đi, địa điểm nổi bật gần đó..."
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="px-6 py-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Hình ảnh</h2>
          
          <MediaPickerPanel
            mediaItems={mediaItems}
            onMediaChange={handleMediaChange}
            maxImages={10}
            maxVideos={0}
          />
          {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
        </div>

        {/* Description */}
        <div className="px-6 py-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mô tả</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả dãy nhà
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về dãy nhà, tiện ích, vị trí..."
            />
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-6 bg-gray-50 border-t border-gray-100">
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading || uploading}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading || uploading ? "Đang xử lý..." : "Lưu dãy"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
