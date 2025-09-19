"use client";

import { useState, useEffect } from "react";
import { CreateRoomPayload, UpdateRoomPayload, FurnitureType, DirectionType, LegalStatusType } from "../../types/Room";
import { Building } from "../../types/Building";
import { Address } from "../../types/RentPost";
import { addressService } from "../../services/address";
import { uploadFiles } from "../../utils/upload";
import MediaPickerPanel, { LocalMediaItem } from "../common/MediaPickerLocal";

interface RoomFormProps {
  buildings: Building[];
  initialData?: Partial<CreateRoomPayload>;
  onSubmit: (data: CreateRoomPayload | UpdateRoomPayload) => void;
  onCancel: () => void;
  loading?: boolean;
}

const FURNITURE_OPTIONS: { id: FurnitureType; label: string }[] = [
  { id: "full", label: "Đầy đủ" },
  { id: "co-ban", label: "Cơ bản" },
  { id: "trong", label: "Trống" },
];

const DIRECTION_OPTIONS: { id: DirectionType; label: string }[] = [
  { id: "dong", label: "Đông" },
  { id: "tay", label: "Tây" },
  { id: "nam", label: "Nam" },
  { id: "bac", label: "Bắc" },
  { id: "dong-bac", label: "Đông Bắc" },
  { id: "dong-nam", label: "Đông Nam" },
  { id: "tay-bac", label: "Tây Bắc" },
  { id: "tay-nam", label: "Tây Nam" },
];

const LEGAL_STATUS_OPTIONS: { id: LegalStatusType; label: string }[] = [
  { id: "co-so-hong", label: "Có sổ hồng" },
  { id: "dang-ky", label: "Đang đăng ký" },
  { id: "chua-dang-ky", label: "Chưa đăng ký" },
];

export default function RoomForm({ 
  buildings,
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false 
}: RoomFormProps) {
  const [formData, setFormData] = useState<CreateRoomPayload>({
    buildingId: buildings[0]?.buildingId || 0,
    roomNumber: "",
    floor: 1,
    area: 0,
    price: 0,
    deposit: 0,
    furniture: "co-ban",
    bedrooms: 1,
    bathrooms: 1,
    direction: "dong",
    legalStatus: "co-so-hong",
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
    maxOccupancy: 1,
    canShare: false,
    sharePrice: 0,
    chungCuInfo: undefined,
    nhaNguyenCanInfo: undefined,
    utilities: undefined,
    images: [],
    description: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);

  // Hiển thị giá trị number dạng chuỗi để cho phép xoá trống tạm thời
  const [numInputs, setNumInputs] = useState<Record<string, string>>({
    floor: String(formData.floor ?? 1),
    area: String(formData.area ?? 0),
    price: String(formData.price ?? 0),
    deposit: String(formData.deposit ?? 0),
    bedrooms: String(formData.bedrooms ?? 1),
    bathrooms: String(formData.bathrooms ?? 1),
    maxOccupancy: String(formData.maxOccupancy ?? 1),
    sharePrice: formData.sharePrice ? String(formData.sharePrice) : "",
  });

  // mediaItems chỉ chứa file local mới chọn; ảnh đã có sẽ hiển thị riêng qua extraTop

  // Update building info when building changes
  useEffect(() => {
    const selectedBuilding = buildings.find(b => b.buildingId === formData.buildingId);
    if (selectedBuilding) {
      setFormData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          city: selectedBuilding.address.city,
          ward: selectedBuilding.address.ward,
          provinceCode: selectedBuilding.address.provinceCode,
          provinceName: selectedBuilding.address.provinceName,
          wardCode: selectedBuilding.address.wardCode,
          wardName: selectedBuilding.address.wardName,
        },
      }));
    }
  }, [formData.buildingId, buildings]);

  const setNumberDisplay = (field: keyof typeof numInputs, value: string) => {
    setNumInputs((p) => ({ ...p, [field]: value }));
  };

  const commitNumber = (field: keyof typeof numInputs, parse: (s: string) => number, min?: number) => {
    const raw = numInputs[field];
    if (raw === "" || raw === null || raw === undefined) return; // giữ trống, user sẽ nhập tiếp
    let v = parse(raw);
    if (Number.isNaN(v)) return; // bỏ qua nếu không hợp lệ
    if (typeof min === "number" && v < min) v = min;
    handleInputChange(field as string, v);
  };

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

    if (!formData.buildingId) {
      newErrors.buildingId = "Vui lòng chọn dãy";
    }

    if (!formData.roomNumber.trim()) {
      newErrors.roomNumber = "Số phòng là bắt buộc";
    }

    if (formData.area <= 0) {
      newErrors.area = "Diện tích phải lớn hơn 0";
    }

    if (formData.price <= 0) {
      newErrors.price = "Giá thuê phải lớn hơn 0";
    }

    if (formData.bedrooms < 1) {
      newErrors.bedrooms = "Số phòng ngủ phải ít nhất 1";
    }

    if (formData.bathrooms < 1) {
      newErrors.bathrooms = "Số phòng tắm phải ít nhất 1";
    }

    if (formData.maxOccupancy < 1) {
      newErrors.maxOccupancy = "Số người tối đa phải ít nhất 1";
    }

    if (formData.canShare && (!formData.sharePrice || formData.sharePrice <= 0)) {
      newErrors.sharePrice = "Giá ở ghép phải lớn hơn 0 khi cho phép ở ghép";
    }

    const existingCount = Array.isArray(formData.images) ? formData.images.length : 0;
    const totalImages = existingCount + mediaItems.length;
    if (totalImages < 1) {
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
      
      // Upload toàn bộ ảnh local mới chọn
      const filesToUpload = mediaItems.map(item => item.file);
      const uploadedUrls: string[] = filesToUpload.length > 0 ? await uploadFiles(filesToUpload) : [];

      // Gộp với ảnh đã có trong form (nếu có)
      const existingImages = Array.isArray(formData.images) ? formData.images : [];
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
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trái: Ảnh/Video */}
          <div className="lg:col-span-1 p-6 border-r border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Hình ảnh</h2>
            <MediaPickerPanel
              mediaItems={mediaItems}
              onMediaChange={handleMediaChange}
              maxImages={10}
              maxVideos={0}
              extraTop={
                Array.isArray(formData.images) && formData.images.length > 0 ? (
                  <div className="mb-4">
                    <div className="grid grid-cols-3 gap-3">
                      {formData.images.map((imgUrl, idx) => (
                        <div key={`existing-${idx}`} className="relative rounded-2xl overflow-hidden border bg-white">
                          <div className="relative pb-[133%]">
                            <img src={imgUrl} className="absolute inset-0 w-full h-full object-cover" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null
              }
            />
            {errors.images && <p className="mt-2 text-sm text-red-600">{errors.images}</p>}
          </div>

          {/* Phải: Các trường thông tin */}
          <div className="lg:col-span-2 p-6 space-y-8">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin phòng</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Building Selection */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dãy nhà <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.buildingId}
                onChange={(e) => handleInputChange("buildingId", parseInt(e.target.value))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.buildingId ? "border-red-300" : "border-gray-300"
                }`}
                disabled={!!initialData?.buildingId}
              >
                <option value={0}>Chọn dãy nhà</option>
                {buildings.map(building => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.name} - {building.buildingType}
                  </option>
                ))}
              </select>
              {errors.buildingId && <p className="mt-1 text-sm text-red-600">{errors.buildingId}</p>}
            </div>

            {/* Room Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số phòng <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.roomNumber}
                onChange={(e) => handleInputChange("roomNumber", e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.roomNumber ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="VD: A101, 201, P001"
              />
              {errors.roomNumber && <p className="mt-1 text-sm text-red-600">{errors.roomNumber}</p>}
            </div>

            {/* Floor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tầng
              </label>
              <input
                type="number"
                min="1"
                value={numInputs.floor}
                onChange={(e) => setNumberDisplay("floor", e.target.value)}
                onBlur={() => commitNumber("floor", (s) => parseInt(s, 10), 1)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Diện tích (m²) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.1"
                value={numInputs.area}
                onChange={(e) => setNumberDisplay("area", e.target.value)}
                onBlur={() => commitNumber("area", (s) => parseFloat(s), 1)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.area ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.area && <p className="mt-1 text-sm text-red-600">{errors.area}</p>}
            </div>

            {/* Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Giá thuê (đ/tháng) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={numInputs.price}
                onChange={(e) => setNumberDisplay("price", e.target.value)}
                onBlur={() => commitNumber("price", (s) => parseInt(s, 10), 0)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                  errors.price ? "border-red-300" : "border-gray-300"
                }`}
              />
              {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
            </div>

            {/* Deposit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiền cọc (đ)
              </label>
              <input
                type="number"
                min="0"
                value={numInputs.deposit}
                onChange={(e) => setNumberDisplay("deposit", e.target.value)}
                onBlur={() => commitNumber("deposit", (s) => parseInt(s, 10), 0)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        
        {/* Room Details */}
        <div className="border-t border-gray-100 pt-6 space-y-6">
          <h2 className="text-lg font-semibold text-gray-900">Chi tiết phòng</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" />
        </div>

        {/* Sharing Options */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Tùy chọn ở ghép</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="canShare"
                checked={formData.canShare}
                onChange={(e) => handleInputChange("canShare", e.target.checked)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="canShare" className="ml-2 block text-sm text-gray-900">
                Cho phép ở ghép
              </label>
            </div>

            {formData.canShare && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Giá ở ghép (đ/tháng) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={numInputs.sharePrice}
                  onChange={(e) => setNumberDisplay("sharePrice", e.target.value)}
                  onBlur={() => commitNumber("sharePrice", (s) => parseInt(s, 10), 0)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                    errors.sharePrice ? "border-red-300" : "border-gray-300"
                  }`}
                />
                {errors.sharePrice && <p className="mt-1 text-sm text-red-600">{errors.sharePrice}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="border-t border-gray-100 pt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Thông tin địa chỉ</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                disabled
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
                disabled
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
                disabled
              />
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="border-t border-gray-100 pt-6 px-6 pb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Mô tả</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mô tả phòng
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              placeholder="Mô tả chi tiết về phòng, tiện ích, vị trí..."
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
              {loading || uploading ? "Đang xử lý..." : "Lưu phòng"}
            </button>
          </div>
        </div>
        {/* Đóng panel phải và grid tổng */}
        </div>
        </div>
      </form>
    </div>
  );
}
