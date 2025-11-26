"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { CreateBuildingPayload, UpdateBuildingPayload, BuildingType } from "../../types/Building";
import { uploadFiles } from "../../utils/upload";
import { useAuth } from "../../contexts/AuthContext";
import MediaPickerPanel, { LocalMediaItem } from "../common/MediaPickerLocal";
import AddressSelector from "../common/AddressSelector";
import { addressService } from "../../services/address";
import type { Address } from "../../services/address";
import { FaMapMarkerAlt } from "react-icons/fa";

function Modal({ open, onClose, onSave, children, title }: { open: boolean; onClose: () => void; onSave: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl border border-gray-100 ring-1 ring-black/5">
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-t-2xl">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/15">
                <FaMapMarkerAlt className="text-white" />
              </span>
              <div className="font-semibold">{title || "Chọn địa chỉ"}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 grid place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"
              title="Đóng"
            >
              ×
            </button>
          </div>
          <div className="p-6">{children}</div>
          <div className="px-6 pb-5 flex justify-end gap-3">
            <button onClick={onClose} className="h-10 px-4 rounded-lg border border-gray-300 hover:bg-gray-50">Hủy</button>
            <button onClick={onSave} className="h-10 px-5 rounded-lg bg-teal-600 text-white hover:bg-teal-700">Lưu</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Modal cảnh báo đơn giản, có nút X đóng ở góc phải, không có footer
function AlertModal({ open, onClose, children, title }: { open: boolean; onClose: () => void; children: React.ReactNode; title?: string }) {
  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100]">
      <div className="fixed inset-0 bg-black/5" onClick={onClose} />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl max-h-[85vh] overflow-auto bg-white rounded-2xl shadow-2xl border border-gray-100 ring-1 ring-black/5">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">!</span>
              <div className="text-lg font-semibold text-gray-900">{title || "Thông báo"}</div>
            </div>
            <button
              onClick={onClose}
              aria-label="Đóng"
              className="h-8 w-8 grid place-items-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Đóng"
            >
              ×
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  );
}

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
  const { user } = useAuth();
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
    totalRooms: 0,
    buildingType: "chung-cu",
    images: [],
    description: "",
    ...initialData,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaItems, setMediaItems] = useState<LocalMediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [openAddressModal, setOpenAddressModal] = useState(false);
  const [addressDraft, setAddressDraft] = useState<Address | null>(null);
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnList, setWarnList] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [addressModalKey, setAddressModalKey] = useState(0);

  // Đồng bộ ảnh đã có (khi chỉnh sửa)
  useEffect(() => {
    if (Array.isArray(formData.images)) {
      setExistingImages(formData.images);
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

  const commitAddress = () => {
    if (addressDraft) {
      setFormData(prev => ({ ...prev, address: addressDraft }));
      if (errors.city || errors.ward) setErrors(prev => ({ ...prev, city: "", ward: "" }));
    }
    setOpenAddressModal(false);
  };

  const handleMediaChange = (items: LocalMediaItem[]) => {
    setMediaItems(items);
  };

  const handleRemoveExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    const warnings: string[] = [];

    if (!formData.name.trim()) {
      newErrors.name = "Tên dãy là bắt buộc";
      warnings.push("Vui lòng nhập Tên dãy");
    }

    if (!formData.address.city) {
      newErrors.city = "Thành phố là bắt buộc";
      warnings.push("Vui lòng chọn Thành phố (địa chỉ)");
    }

    if (!formData.address.ward) {
      newErrors.ward = "Phường/xã là bắt buộc";
      warnings.push("Vui lòng chọn Phường/Xã (địa chỉ)");
    }

    const total = existingImages.length + mediaItems.length;
    if (total < 1) {
      newErrors.images = "Cần ít nhất 1 ảnh";
      warnings.push("Vui lòng chọn ít nhất 1 ảnh");
    }

    setErrors(newErrors);
    if (warnings.length) {
      setWarnList(warnings);
      setWarnOpen(true);
    }
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setUploading(true);
      if (!user?.userId || user.userId <= 0) {
        setErrors({ images: "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại." });
        return;
      }
      
      // Upload ảnh local mới
      const files = mediaItems.filter(item => item.file).map((item) => item.file!);
      const uploadedUrls: string[] = files.length ? await uploadFiles(files, user.userId, "images") : [];

      const submitData = {
        ...formData,
        images: [...existingImages, ...uploadedUrls],
      };

      onSubmit(submitData);
    } catch (error) {
      setErrors({ images: "Có lỗi khi tải ảnh lên. Vui lòng thử lại." });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
        <h1 className="text-2xl font-semibold">Thông tin dãy</h1>
        <p className="text-white/90 text-sm mt-1">Điền các thông tin dưới đây để tạo dãy mới</p>
      </div>
      <form onSubmit={handleSubmit} className="px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Cột trái: Hình ảnh */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Hình ảnh</h2>
            <p className="text-sm text-gray-500 mb-4">Tải lên tối thiểu 1 ảnh rõ nét, ưu tiên 3:4</p>
            <MediaPickerPanel
              mediaItems={mediaItems}
              onMediaChange={handleMediaChange}
              maxImages={10}
              maxVideos={0}
              extraTop={existingImages.length ? (
                <div className="mb-4">
                  <div className="grid grid-cols-3 gap-3">
                    {existingImages.map((url, idx) => (
                      <div key={`exist-${idx}`} className="relative rounded-2xl overflow-hidden border bg-white">
                        <div className="relative pb-[133%]">
                          <img src={url} className="absolute inset-0 w-full h-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center text-[14px] font-bold shadow hover:bg-red-600"
                          title="Xóa ảnh"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            />
          </div>

          {/* Cột phải: Trường nhập */}
          <div className="space-y-5">
            <h2 className="text-xl font-semibold text-gray-900">Thông tin</h2>

            {/* Tên dãy - floating label */}
            <div className="relative">
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder=" "
                className={`peer w-full rounded-2xl border-2 px-4 pt-6 pb-3 outline-none transition-colors focus:border-teal-500 ${
                  errors.name ? "border-red-300" : "border-gray-300"
                }`}
              />
              <label className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 bg-white px-1 text-gray-500 transition-all peer-focus:top-3.5 peer-focus:text-xs peer-focus:text-teal-600 peer-[&:not(:placeholder-shown)]:top-3.5 peer-[&:not(:placeholder-shown)]:text-xs">
                Tên dãy <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Loại dãy */}
            <div className="relative">
              <select
                value={formData.buildingType}
                onChange={(e) => handleInputChange("buildingType", e.target.value as BuildingType)}
                className="peer w-full rounded-2xl border-2 border-gray-300 bg-white px-4 pt-6 pb-3 outline-none transition-colors focus:border-teal-500"
              >
                {BUILDING_TYPES.map(type => (
                  <option key={type.id} value={type.id}>{type.label}</option>
                ))}
              </select>
              <label className="pointer-events-none absolute left-4 top-2 bg-white px-1 text-xs text-gray-500">
                Loại dãy <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Địa chỉ (mở modal chọn) */}
            <div
              className="relative rounded-2xl border-2 border-gray-300 bg-white px-4 pt-6 pb-3 cursor-pointer transition-colors hover:border-teal-500"
              onClick={() => { 
                const address = formData.address as Address;
                setAddressDraft(address); 
                setAddressModalKey(prev => prev + 1); 
                setOpenAddressModal(true);
              }}
              aria-label="Địa chỉ"
            >
              <div className="pointer-events-none absolute left-4 top-2 text-xs text-gray-500 bg-white px-1">Địa chỉ <span className="text-red-500">*</span></div>
              <div className="text-gray-800 min-h-[24px]">
                {formData.address.city && formData.address.ward
                  ? addressService.formatAddressForDisplay(formData.address as any)
                  : ''}
              </div>
            </div>

            {/* Mô tả */}
            <div className="relative">
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                placeholder=" "
                className="peer w-full px-4 pt-6 pb-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
              <label className="pointer-events-none absolute left-3 top-2 bg-white px-1 text-xs text-gray-500">Mô tả</label>
            </div>
          </div>
        </div>

        {/* Modals */}
        <Modal
          open={openAddressModal}
          onClose={() => setOpenAddressModal(false)}
          onSave={commitAddress}
          title="Chọn địa chỉ dãy"
        >
          {openAddressModal && (
            <AddressSelector 
              value={addressDraft} 
              onChange={(newAddress) => {
                setAddressDraft(newAddress);
              }} 
            />
          )}
        </Modal>

        {/* Warning Modal */}
        <AlertModal
          open={warnOpen}
          onClose={() => setWarnOpen(false)}
          title="Thiếu thông tin bắt buộc"
        >
          <div className="text-[15px] text-gray-700">
            <ul className="space-y-2">
              {warnList.map((w, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1 inline-block h-2 w-2 rounded-full bg-teal-500" />
                  <span>{w}</span>
                </li>
              ))}
            </ul>
          </div>
        </AlertModal>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Hủy
          </button>
          <button
            type="submit"
            disabled={loading || uploading}
            className="px-6 py-2 bg-gradient-to-r from-teal-600 to-teal-500 text-white rounded-lg hover:from-teal-700 hover:to-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || uploading ? "Đang xử lý..." : "Lưu dãy"}
          </button>
        </div>
      </form>
    </div>
  );
}
