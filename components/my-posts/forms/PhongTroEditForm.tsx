"use client";

import MediaPickerLocal from "../../common/MediaPickerLocal";

interface Props {
  formData: any;
  onInputChange: (name: string, value: any) => void;
  onNumberChange: (name: string, value: string) => void;
}

export default function PhongTroEditForm({ formData, onInputChange, onNumberChange }: Props) {
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
            <div className="grid md:grid-cols-2 gap-4">
              <input
                type="text"
                value={formData.address?.city || ''}
                onChange={(e) => onInputChange('address', { ...(formData.address || {}), city: e.target.value })}
                placeholder="Thành phố"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <input
                type="text"
                value={formData.address?.district || ''}
                onChange={(e) => onInputChange('address', { ...(formData.address || {}), district: e.target.value })}
                placeholder="Quận/Huyện"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <input
                type="text"
                value={formData.address?.ward || ''}
                onChange={(e) => onInputChange('address', { ...(formData.address || {}), ward: e.target.value })}
                placeholder="Phường/Xã"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <input
                type="text"
                value={formData.address?.street || ''}
                onChange={(e) => onInputChange('address', { ...(formData.address || {}), street: e.target.value })}
                placeholder="Đường"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <input
                type="text"
                value={formData.address?.houseNumber || ''}
                onChange={(e) => onInputChange('address', { ...(formData.address || {}), houseNumber: e.target.value })}
                placeholder="Số nhà (tuỳ chọn)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={!!formData.address?.showHouseNumber}
                  onChange={(e) => onInputChange('address', { ...(formData.address || {}), showHouseNumber: e.target.checked })}
                />
                Hiển thị số nhà trên bài đăng
              </label>
            </div>
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
    </div>
  );
}


