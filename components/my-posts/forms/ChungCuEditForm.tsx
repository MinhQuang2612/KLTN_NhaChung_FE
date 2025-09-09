"use client";

import MediaPickerLocal from "../../common/MediaPickerLocal";

interface Props {
  formData: any;
  onInputChange: (name: string, value: any) => void;
  onNumberChange: (name: string, value: string) => void;
}

export default function ChungCuEditForm({ formData, onInputChange, onNumberChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh và video</h3>
        <div className="grid md:grid-cols-2 gap-6">
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
                      <button type="button" onClick={() => {
                        const next = (formData.existingImages || []).filter((u: string) => u !== url);
                        onInputChange('existingImages', next);
                        if (formData.coverImageUrl === url) onInputChange('coverImageUrl', next[0] || '');
                      }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center leading-none text-[14px] font-bold shadow hover:bg-red-600" aria-label="Xóa" title="Xóa">×</button>
                      {formData.coverImageUrl !== url && (
                        <button type="button" onClick={() => onInputChange('coverImageUrl', url)} className="absolute bottom-1 right-1 h-6 px-2 rounded-full bg-black/70 text-white text-[11px]" title="Đặt làm ảnh bìa">Đặt làm bìa</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            coverLocalId={formData.coverLocalId}
            onSetCoverLocal={(localId) => onInputChange('coverLocalId', localId)}
            guideTitle="Hướng dẫn đăng ảnh"
            guideItems={["Bắt buộc ≥ 3 ảnh, tối đa 12 ảnh","Tỷ lệ 3:4 hoặc 4:3","Không dùng ảnh có bản quyền","Ảnh bìa sẽ hiển thị đầu tiên"]}
          />
          <MediaPickerLocal
            pillText="Video hợp lệ"
            helper={`Kéo-thả hoặc bấm để chọn video (còn lại ${(2 - (formData.existingVideos?.length || 0))} media)`}
            accept="video/*"
            max={Math.max(0, 2 - (formData.existingVideos?.length || 0))}
            value={formData.videos || []}
            onChange={(items) => onInputChange('videos', items)}
            guideTitle="Hướng dẫn đăng video"
            guideItems={["Tối đa 2 video","≤ 60s","mp4/mov/webm","≤ 100MB"]}
            extraTop={Array.isArray(formData.existingVideos) && formData.existingVideos.length > 0 ? (
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-3">
                  {formData.existingVideos.map((url: string, idx: number) => (
                    <div key={idx} className="relative rounded-2xl overflow-hidden border bg-white">
                      <div className="relative pb-[133%]">
                        <video src={url} className="absolute inset-0 w-full h-full object-cover" controls muted />
                      </div>
                      <button type="button" onClick={() => {
                        const next = (formData.existingVideos || []).filter((u: string) => u !== url);
                        onInputChange('existingVideos', next);
                      }} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500 text-white grid place-items-center leading-none text-[14px] font-bold shadow hover:bg-red-600" aria-label="Xóa" title="Xóa">×</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin chung cư</h3>
        <div className="space-y-4">
          {/* Địa chỉ */}
          <div>
            <h4 className="text-sm font-medium text-gray-800 mb-2">Địa chỉ</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thành phố</label>
                <input type="text" value={formData.address?.city || ''} onChange={(e) => onInputChange('address', { ...(formData.address || {}), city: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quận/Huyện</label>
                <input type="text" value={formData.address?.district || ''} onChange={(e) => onInputChange('address', { ...(formData.address || {}), district: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phường/Xã</label>
                <input type="text" value={formData.address?.ward || ''} onChange={(e) => onInputChange('address', { ...(formData.address || {}), ward: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường</label>
                <input type="text" value={formData.address?.street || ''} onChange={(e) => onInputChange('address', { ...(formData.address || {}), street: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số nhà (tuỳ chọn)</label>
                <input type="text" value={formData.address?.houseNumber || ''} onChange={(e) => onInputChange('address', { ...(formData.address || {}), houseNumber: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
              </div>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700 mt-6">
                <input type="checkbox" checked={!!formData.address?.showHouseNumber} onChange={(e) => onInputChange('address', { ...(formData.address || {}), showHouseNumber: e.target.checked })} />
                Hiển thị số nhà trên bài đăng
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
            <input type="text" value={formData.title || ''} onChange={(e) => onInputChange('title', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea value={formData.description || ''} onChange={(e) => onInputChange('description', e.target.value)} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tên toà nhà</label>
              <input type="text" value={formData.buildingName || ''} onChange={(e) => onInputChange('buildingName', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Block/Tháp</label>
              <input type="text" value={formData.blockOrTower || ''} onChange={(e) => onInputChange('blockOrTower', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tầng số</label>
              <input type="number" value={formData.floorNumber || ''} onChange={(e) => onNumberChange('floorNumber', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mã căn</label>
              <input type="text" value={formData.unitCode || ''} onChange={(e) => onInputChange('unitCode', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Loại hình</label>
              <select value={formData.propertyType || ''} onChange={(e) => onInputChange('propertyType', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                <option value="">Chọn loại hình</option>
                <option value="chung-cu">Chung cư</option>
                <option value="can-ho-dv">Căn hộ dịch vụ</option>
                <option value="officetel">Officetel</option>
                <option value="studio">Studio</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng ngủ</label>
              <input type="number" value={formData.bedrooms || ''} onChange={(e) => onNumberChange('bedrooms', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số phòng tắm</label>
              <input type="number" value={formData.bathrooms || ''} onChange={(e) => onNumberChange('bathrooms', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hướng</label>
              <input type="text" value={formData.direction || ''} onChange={(e) => onInputChange('direction', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nội thất</label>
              <input type="text" value={formData.furniture || ''} onChange={(e) => onInputChange('furniture', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tình trạng sổ</label>
              <input type="text" value={formData.legalStatus || ''} onChange={(e) => onInputChange('legalStatus', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Diện tích (m²)</label>
              <input type="number" value={formData.area || ''} onChange={(e) => onNumberChange('area', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Giá thuê</label>
              <input type="number" value={formData.price || ''} onChange={(e) => onNumberChange('price', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền cọc</label>
              <input type="number" value={formData.deposit || ''} onChange={(e) => onNumberChange('deposit', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


