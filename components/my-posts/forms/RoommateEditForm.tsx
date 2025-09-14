import { useState, useEffect } from 'react';
import MediaPickerPanel, { LocalMediaItem } from '@/components/common/MediaPickerLocal';
import AddressSelector from '@/components/common/AddressSelector';
import { Address, addressService } from '@/services/address';
import { AgeUtils } from '@/utils/ageUtils';

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


interface RoommateEditFormProps {
  formData: any;
  onInputChange: (field: string, value: any) => void;
  onNumberChange: (field: string, value: number) => void;
}

export default function RoommateEditForm({ formData, onInputChange, onNumberChange }: RoommateEditFormProps) {
  const [addrOpen, setAddrOpen] = useState(false);
  const hobbies = ['Đọc sách', 'Xem phim', 'Chơi game', 'Thể thao', 'Du lịch', 'Nấu ăn', 'Âm nhạc', 'Nghệ thuật'];
  const habits = ['Dậy sớm', 'Tập thể dục', 'Ngủ sớm', 'Đọc sách', 'Xem TV', 'Chơi game', 'Nấu ăn', 'Dọn dẹp'];
  const traits = ['Hòa đồng', 'Yên tĩnh', 'Năng động', 'Trách nhiệm', 'Sạch sẽ', 'Tôn trọng', 'Thân thiện', 'Độc lập'];

  return (
    <div className="space-y-6">
      {/* Hình ảnh và video */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh và video</h3>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload hình ảnh */}
          <MediaPickerPanel
            pillText="Hình ảnh giới thiệu bản thân"
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
              "Tối đa 12 ảnh",
              "Ảnh rõ nét",
              "Không dùng ảnh có bản quyền",
              "Ảnh bìa ưu tiên hiển thị đầu"
            ]}
          />

          {/* Upload video */}
          <MediaPickerPanel
            pillText="Video giới thiệu bản thân"
            helper={`Kéo-thả hoặc bấm để chọn video (còn lại ${(1 - (formData.existingVideos?.length || 0))} video)`}
            accept="video/*"
            max={Math.max(0, 1 - (formData.existingVideos?.length || 0))}
            value={formData.videos || []}
            onChange={(items) => onInputChange('videos', items)}
            guideTitle="Hướng dẫn đăng video"
            guideItems={[
              "Tối đa 1 video",
              "Video rõ nét, âm thanh rõ ràng",
              "Nội dung phù hợp",
              "Độ dài khuyến nghị: 30-120 giây"
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

      {/* Tiêu đề và mô tả */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tiêu đề và mô tả</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tiêu đề *</label>
            <input type="text" value={formData.title || ''} onChange={(e) => onInputChange('title', e.target.value)} placeholder="Tiêu đề *" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
            <textarea value={formData.description || ''} onChange={(e) => onInputChange('description', e.target.value)} rows={5} maxLength={500} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Mô tả về bản thân và mong muốn ở ghép" />
          </div>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
            <input type="text" value={formData.fullName || ''} onChange={(e) => onInputChange('fullName', e.target.value)} placeholder="Họ và tên" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày sinh *</label>
            <input 
              type="date" 
              value={formData.dateOfBirth || ''} 
              onChange={(e) => onInputChange('dateOfBirth', e.target.value)} 
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            />
            {formData.dateOfBirth && (
              <div className="text-xs mt-1">
                <span className="text-gray-500">
                  {AgeUtils.getAgeInfo(formData.dateOfBirth).ageText}
                </span>
                {!AgeUtils.isAdult(formData.dateOfBirth) && (
                  <span className="text-red-500 ml-2">
                    ⚠️ Phải đủ 18 tuổi
                  </span>
                )}
              </div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              * Bạn phải đủ 18 tuổi để sử dụng dịch vụ này
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính *</label>
            <select value={formData.gender || ''} onChange={(e) => onInputChange('gender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Chọn giới tính</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nghề nghiệp *</label>
            <input type="text" value={formData.occupation || ''} onChange={(e) => onInputChange('occupation', e.target.value)} placeholder="Nghề nghiệp" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Thông tin phòng hiện tại */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin phòng hiện tại</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Địa chỉ phòng *</label>
            <button
              type="button"
              onClick={() => setAddrOpen(true)}
              className="w-full h-11 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-between"
            >
              <span className={formData.roomAddress?.city && formData.roomAddress?.ward ? "text-gray-900" : "text-gray-500"}>
                {formData.roomAddress?.city && formData.roomAddress?.ward 
                  ? addressService.formatAddressForDisplay(formData.roomAddress)
                  : "Chọn địa chỉ phòng"}
              </span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giá thuê phòng *</label>
              <input type="number" value={formData.roomPrice || ''} onChange={(e) => onInputChange('roomPrice', parseInt(e.target.value) || 0)} placeholder="Giá thuê phòng (VNĐ/tháng)" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Diện tích phòng *</label>
              <input type="number" value={formData.roomArea || ''} onChange={(e) => onInputChange('roomArea', parseInt(e.target.value) || 0)} placeholder="Diện tích phòng (m²)" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loại phòng</label>
              <select value={formData.roomType || ''} onChange={(e) => onInputChange('roomType', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Chọn loại phòng</option>
                <option value="single">Phòng đơn</option>
                <option value="double">Phòng đôi</option>
                <option value="shared">Phòng 3-4 người</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả phòng *</label>
            <textarea value={formData.roomDescription || ''} onChange={(e) => onInputChange('roomDescription', e.target.value)} rows={3} placeholder="Mô tả phòng hiện tại" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Số người hiện tại</label>
              <input type="number" value={formData.currentOccupants || ''} onChange={(e) => onInputChange('currentOccupants', parseInt(e.target.value) || 0)} placeholder="Số người hiện tại" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian ở còn lại</label>
              <select value={formData.remainingDuration || ''} onChange={(e) => onInputChange('remainingDuration', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Chọn thời gian</option>
                <option value="1-3 months">1-3 tháng</option>
                <option value="3-6 months">3-6 tháng</option>
                <option value="6-12 months">6-12 tháng</option>
                <option value="over_1_year">Trên 1 năm</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Chi phí & Dịch vụ */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chi phí & Dịch vụ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cách chia tiền điện nước</label>
            <select
              value={formData.shareMethod || ''}
              onChange={(e) => onInputChange('shareMethod', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn --</option>
              <option value="split_evenly">Chia đều</option>
              <option value="by_usage">Theo sử dụng</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ước tính chi phí điện nước/tháng (đ)</label>
            <input
              type="number"
              value={formData.estimatedMonthlyUtilities || ''}
              onChange={(e) => onInputChange('estimatedMonthlyUtilities', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức bao gồm trong tiền phòng (đ)</label>
            <input
              type="number"
              value={formData.capIncludedAmount || ''}
              onChange={(e) => onInputChange('capIncludedAmount', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá điện (đ/kWh)</label>
            <input
              type="number"
              value={formData.electricityPricePerKwh || ''}
              onChange={(e) => onInputChange('electricityPricePerKwh', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá nước</label>
            <input
              type="number"
              value={formData.waterPrice || ''}
              onChange={(e) => onInputChange('waterPrice', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cách tính nước</label>
            <select
              value={formData.waterBillingType || ''}
              onChange={(e) => onInputChange('waterBillingType', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Chọn --</option>
              <option value="per_m3">Theo m³</option>
              <option value="per_person">Theo đầu người</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Internet (đ/tháng)</label>
            <input
              type="number"
              value={formData.internetFee || ''}
              onChange={(e) => onInputChange('internetFee', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phí rác (đ/tháng)</label>
            <input
              type="number"
              value={formData.garbageFee || ''}
              onChange={(e) => onInputChange('garbageFee', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phí vệ sinh (đ/tháng)</label>
            <input
              type="number"
              value={formData.cleaningFee || ''}
              onChange={(e) => onInputChange('cleaningFee', parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Sở thích và thói quen */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sở thích và thói quen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {hobbies.map((hobby) => (
                <button key={hobby} type="button" onClick={() => {
                  const current = formData.selectedHobbies || [];
                  const next = current.includes(hobby) ? current.filter((h: string) => h !== hobby) : [...current, hobby];
                  onInputChange('selectedHobbies', next);
                }} className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  (formData.selectedHobbies || []).includes(hobby) 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}>
                  {hobby}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Thói quen</label>
            <div className="flex flex-wrap gap-2">
              {habits.map((habit) => (
                <button key={habit} type="button" onClick={() => {
                  const current = formData.selectedHabits || [];
                  const next = current.includes(habit) ? current.filter((h: string) => h !== habit) : [...current, habit];
                  onInputChange('selectedHabits', next);
                }} className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  (formData.selectedHabits || []).includes(habit) 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}>
                  {habit}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Thói quen sinh hoạt</label>
              <select value={formData.lifestyle || ''} onChange={(e) => onInputChange('lifestyle', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Chọn thói quen</option>
                <option value="early">Dậy sớm (5-7h)</option>
                <option value="normal">Bình thường (7-9h)</option>
                <option value="late">Dậy muộn (9h+)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ sạch sẽ</label>
              <select value={formData.cleanliness || ''} onChange={(e) => onInputChange('cleanliness', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Chọn mức độ</option>
                <option value="very_clean">Rất sạch sẽ</option>
                <option value="clean">Sạch sẽ</option>
                <option value="normal">Bình thường</option>
                <option value="flexible">Không quá khắt khe</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Yêu cầu về người ở ghép */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Yêu cầu về người ở ghép</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Giới tính mong muốn</label>
              <select value={formData.preferredGender || ''} onChange={(e) => onInputChange('preferredGender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                <option value="">Chọn giới tính</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="any">Không quan trọng</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Khoảng tuổi mong muốn</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={formData.ageRangeMin || ''} onChange={(e) => onInputChange('ageRangeMin', parseInt(e.target.value) || 0)} placeholder="Tuổi tối thiểu" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
                <input type="number" value={formData.ageRangeMax || ''} onChange={(e) => onInputChange('ageRangeMax', parseInt(e.target.value) || 0)} placeholder="Tuổi tối đa" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tính cách mong muốn</label>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait) => (
                <button key={trait} type="button" onClick={() => {
                  const current = formData.selectedTraits || [];
                  const next = current.includes(trait) ? current.filter((t: string) => t !== trait) : [...current, trait];
                  onInputChange('selectedTraits', next);
                }} className={`px-3 py-2 rounded-full text-sm border transition-colors ${
                  (formData.selectedTraits || []).includes(trait) 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:border-blue-500'
                }`}>
                  {trait}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Giá tối đa sẵn sàng chi trả</label>
            <input type="number" value={formData.maxPrice || ''} onChange={(e) => onInputChange('maxPrice', parseInt(e.target.value) || 0)} placeholder="Giá tối đa sẵn sàng chi trả (VNĐ/tháng)" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Thông tin liên hệ */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
            <input type="tel" value={formData.phone || ''} onChange={(e) => onInputChange('phone', e.target.value)} placeholder="Số điện thoại" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input type="email" value={formData.email || ''} onChange={(e) => onInputChange('email', e.target.value)} placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
        </div>
      </div>

      {/* Modal địa chỉ */}
      <AddressModal
        open={addrOpen}
        onClose={() => setAddrOpen(false)}
        onSave={(a) => onInputChange('roomAddress', a || {
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
        initial={formData.roomAddress}
      />
    </div>
  );
}