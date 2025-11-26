"use client";

import { useState, useEffect } from "react";
import MediaPickerLocal from "../../common/MediaPickerLocal";
import AddressSelector from "../../common/AddressSelector";
import { Address, addressService } from "../../../services/address";

// Address Modal Component
function AddressModal({
  open,
  onClose,
  onSave,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (a: Address | null) => void;
  initial?: Partial<Address>;
}) {
  const [address, setAddress] = useState<Address | null>(initial as Address || null);
  
  // Sync address when modal opens or initial changes
  useEffect(() => {
    if (open) {
      setAddress((initial as Address) || null);
    }
  }, [open, initial]);
  
  if (!open) return null;

  const handleSave = () => {
    onSave(address);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="px-4 py-3 border-b text-center font-semibold">
            Địa chỉ
          </div>
          <div className="p-4">
            <AddressSelector
              value={address}
              onChange={setAddress}
            />
          </div>
          <div className="px-4 py-3 border-t flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 h-10 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              className="flex-1 h-10 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface Props {
  formData: any;
  onInputChange: (name: string, value: any) => void;
  onNumberChange: (name: string, value: string) => void;
}

export default function PhongTroEditForm({ formData, onInputChange, onNumberChange }: Props) {
  const [addrOpen, setAddrOpen] = useState(false);

  const addrText = formData.address
    ? addressService.formatAddressForDisplay(formData.address)
    : "";

  // Helper cập nhật utilities
  const patchUtilities = (partial: any) => {
    const next = { ...(formData.utilities || {}), ...partial };
    onInputChange('utilities', next);
  };

  return (
    <div className="space-y-6">
      {/* Hình ảnh và video */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh và video</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload hình ảnh */}
          <MediaPickerLocal
            pillText="Hình ảnh hợp lệ"
            helper={`Kéo-thả hoặc bấm để chọn ảnh (còn lại ${(12 - (formData.existingImages?.length || 0))} ảnh)`}
            accept="image/*"
            max={Math.max(0, 12 - (formData.existingImages?.length || 0))}
            value={formData.images || []}
            onChange={(items) => onInputChange('images', items)}
            extraTop={Array.isArray(formData.existingImages) && formData.existingImages.length > 0 ? (
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-3">
                  {formData.existingImages.map((url: string, idx: number) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border bg-white">
                      <div className="relative pb-[133%]">
                        <img src={url} className="absolute inset-0 w-full h-full object-cover" />
                      </div>
                      {formData.coverImageUrl === url && (
                        <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[11px] px-1.5 py-0.5 rounded">Ảnh bìa</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const next = (formData.existingImages || []).filter((u: string) => u !== url);
                          onInputChange('existingImages', next);
                          if (formData.coverImageUrl === url) onInputChange('coverImageUrl', next[0] || '');
                        }}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center leading-none text-[14px] font-bold shadow hover:bg-red-600"
                        aria-label="Xóa"
                        title="Xóa"
                      >
                        ×
                      </button>
                      {formData.coverImageUrl !== url && (
                        <button
                          type="button"
                          onClick={() => onInputChange('coverImageUrl', url)}
                          className="absolute bottom-1 right-1 h-6 px-2 rounded-full bg-black/70 text-white text-[11px]"
                          title="Đặt làm ảnh bìa"
                        >
                          Đặt làm bìa
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            coverLocalId={formData.coverLocalId}
            onSetCoverLocal={(localId) => onInputChange('coverLocalId', localId)}
            guideTitle="Hướng dẫn đăng ảnh"
            guideItems={[
              "Bắt buộc ≥ 3 ảnh, tối đa 12 ảnh",
              "Tỷ lệ 3:4 hoặc 4:3, ảnh rõ nét",
              "Không sử dụng ảnh có bản quyền",
              "Ảnh bìa sẽ hiển thị đầu tiên"
            ]}
          />

          {/* Upload video */}
          <MediaPickerLocal
            pillText="Video hợp lệ"
            helper={`Kéo-thả hoặc bấm để chọn video (còn lại ${(2 - (formData.existingVideos?.length || 0))} media)`}
            accept="video/*"
            max={Math.max(0, 2 - (formData.existingVideos?.length || 0))}
            value={formData.videos || []}
            onChange={(items) => onInputChange('videos', items)}
            guideTitle="Hướng dẫn đăng video"
            guideItems={[
              "Tối đa 2 video, thời lượng ≤ 60s",
              "Định dạng: mp4, mov, webm",
              "Dung lượng ≤ 100MB mỗi video",
              "Quay rõ, không nội dung nhạy cảm"
            ]}
            extraTop={Array.isArray(formData.existingVideos) && formData.existingVideos.length > 0 ? (
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-3">
                  {formData.existingVideos.map((url: string, idx: number) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border bg-white">
                      <div className="relative pb-[133%]">
                        <video src={url} className="absolute inset-0 w-full h-full object-cover" controls muted />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = (formData.existingVideos || []).filter((u: string) => u !== url);
                          onInputChange('existingVideos', next);
                        }}
                        className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center leading-none text-[14px] font-bold shadow hover:bg-red-600"
                        aria-label="Xóa"
                        title="Xóa"
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
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cơ bản</h3>
        
        <div className="space-y-4">
          {/* Địa chỉ */}
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">Địa chỉ</h4>
            <button
              type="button"
              onClick={() => setAddrOpen(true)}
              className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
            >
              <span className={addrText ? "text-gray-900" : "text-gray-400"}>
                {addrText ? (
                  addrText
                ) : (
                  <>
                    Chọn địa chỉ <span className="text-red-500">*</span>
                  </>
                )}
              </span>
              <span className="opacity-60">▾</span>
            </button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tiêu đề <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => onInputChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Nhập tiêu đề bài đăng"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => onInputChange('description', e.target.value)}
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
                value={formData.area || ''}
                onChange={(e) => onNumberChange('area', e.target.value)}
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
                value={formData.price || ''}
                onChange={(e) => onNumberChange('price', e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tiền cọc (VNĐ)</label>
              <input
                type="number"
                value={formData.deposit || ''}
                onChange={(e) => onNumberChange('deposit', e.target.value)}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nội thất</label>
              <select
                value={formData.furniture || ''}
                onChange={(e) => onInputChange('furniture', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Chọn tình trạng nội thất</option>
                <option value="trong">Trống</option>
                <option value="co-ban">Cơ bản</option>
                <option value="full">Đầy đủ</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chi phí & Dịch vụ */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chi phí & Dịch vụ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Điện & Internet */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Giá điện (đ/kWh)</label>
            <input
              type="number"
              min="0"
              value={formData.utilities?.electricityPricePerKwh || ''}
              onChange={(e)=>patchUtilities({ electricityPricePerKwh: Number(e.target.value)||0 })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Internet (đ/tháng)</label>
            <input
              type="number"
              min="0"
              value={formData.utilities?.internetFee || ''}
              onChange={(e)=>patchUtilities({ internetFee: Number(e.target.value)||0 })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>

          {/* Nước: giá & cách tính */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Giá nước</label>
            <input
              type="number"
              min="0"
              value={formData.utilities?.waterPrice || ''}
              onChange={(e)=>patchUtilities({ waterPrice: Number(e.target.value)||0 })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Cách tính nước</label>
            <select
              value={formData.utilities?.waterBillingType || ''}
              onChange={(e)=>patchUtilities({ waterBillingType: e.target.value })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">-- Chọn --</option>
              <option value="per_m3">Theo m³</option>
              <option value="per_person">Theo đầu người</option>
            </select>
          </div>

          {/* Rác & Vệ sinh */}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Rác (đ/tháng)</label>
            <input
              type="number"
              min="0"
              value={formData.utilities?.garbageFee || ''}
              onChange={(e)=>patchUtilities({ garbageFee: Number(e.target.value)||0 })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Vệ sinh (đ/tháng)</label>
            <input
              type="number"
              min="0"
              value={formData.utilities?.cleaningFee || ''}
              onChange={(e)=>patchUtilities({ cleaningFee: Number(e.target.value)||0 })}
              className="w-full h-10 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Modal địa chỉ */}
      <AddressModal
        open={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={(a) => onInputChange('address', a || {
          street: '',
          ward: '',
          city: '',
          specificAddress: '',
          showSpecificAddress: false,
          provinceCode: '',
          provinceName: '',
          wardCode: '',
          wardName: '',
          additionalInfo: ''
        })}
        initial={formData.address}
      />
    </div>
  );
}


