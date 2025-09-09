"use client";

import MediaPickerLocal from "../../common/MediaPickerLocal";

interface Props {
  formData: any;
  onInputChange: (name: string, value: any) => void;
  onNumberChange: (name: string, value: string) => void;
}

export default function RoommateEditForm({ formData, onInputChange, onNumberChange }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Hình ảnh</h3>
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
          guideItems={["Tối đa 12 ảnh tổng cộng (ảnh cũ + ảnh mới)","Ảnh rõ nét","Không dùng ảnh có bản quyền","Ảnh bìa ưu tiên hiển thị đầu"]}
        />
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tiêu đề và mô tả</h3>
        <div className="space-y-4">
          <input type="text" value={formData.title || ''} onChange={(e) => onInputChange('title', e.target.value)} placeholder="Tiêu đề *" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <textarea value={formData.description || ''} onChange={(e) => onInputChange('description', e.target.value)} rows={5} maxLength={500} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Mô tả về bản thân và mong muốn ở ghép" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" value={formData.fullName || ''} onChange={(e) => onInputChange('fullName', e.target.value)} placeholder="Họ và tên" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <input type="number" value={formData.age || ''} onChange={(e) => onInputChange('age', parseInt(e.target.value) || 0)} placeholder="Tuổi" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <select value={formData.gender || ''} onChange={(e) => onInputChange('gender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option value="">Giới tính</option>
            <option value="Nam">Nam</option>
            <option value="Nữ">Nữ</option>
            <option value="Khác">Khác</option>
          </select>
          <input type="text" value={formData.occupation || ''} onChange={(e) => onInputChange('occupation', e.target.value)} placeholder="Nghề nghiệp" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin phòng hiện tại</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" value={formData.currentAddress || ''} onChange={(e) => onInputChange('currentAddress', e.target.value)} placeholder="Địa chỉ phòng hiện tại" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
            <input type="text" value={formData.budget || ''} onChange={(e) => onInputChange('budget', e.target.value)} placeholder="Giá thuê phòng (VNĐ/tháng)" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            <select value={formData.roomType || ''} onChange={(e) => onInputChange('roomType', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Loại phòng</option>
              <option value="Phòng đơn">Phòng đơn</option>
              <option value="Phòng đôi">Phòng đôi</option>
              <option value="Phòng 3-4 người">Phòng 3-4 người</option>
            </select>
            <select value={formData.currentOccupants || ''} onChange={(e) => onInputChange('currentOccupants', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Số người hiện tại</option>
              <option value="1 người (tìm thêm 1 người)">1 người (tìm thêm 1 người)</option>
              <option value="2 người (tìm thêm 1 người)">2 người (tìm thêm 1 người)</option>
              <option value="3 người (tìm thêm 1 người)">3 người (tìm thêm 1 người)</option>
            </select>
            <select value={formData.duration || ''} onChange={(e) => onInputChange('duration', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Thời gian ở còn lại</option>
              <option value="1-3 tháng">1-3 tháng</option>
              <option value="3-6 tháng">3-6 tháng</option>
              <option value="6-12 tháng">6-12 tháng</option>
              <option value="Trên 1 năm">Trên 1 năm</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sở thích và thói quen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {['Đọc sách','Xem phim','Chơi game','Thể thao','Du lịch','Nấu ăn','Âm nhạc','Nghệ thuật'].map((hobby) => (
                <button key={hobby} type="button" onClick={() => {
                  const selectedHobbies = formData.selectedHobbies || [];
                  const newHobbies = selectedHobbies.includes(hobby) ? selectedHobbies.filter((h: string) => h !== hobby) : [...selectedHobbies, hobby];
                  onInputChange('selectedHobbies', newHobbies);
                }} className={`px-3 py-1 rounded-full text-sm transition-colors ${ (formData.selectedHobbies || []).includes(hobby) ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700' }`}>
                  {hobby}
                </button>
              ))}
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <select value={formData.livingHabits || ''} onChange={(e) => onInputChange('livingHabits', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Thói quen sinh hoạt</option>
              <option value="Dậy sớm (5-7h)">Dậy sớm (5-7h)</option>
              <option value="Bình thường (7-9h)">Bình thường (7-9h)</option>
              <option value="Dậy muộn (9h+)">Dậy muộn (9h+)</option>
            </select>
            <select value={formData.cleanliness || ''} onChange={(e) => onInputChange('cleanliness', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Mức độ sạch sẽ</option>
              <option value="Rất sạch sẽ">Rất sạch sẽ</option>
              <option value="Sạch sẽ">Sạch sẽ</option>
              <option value="Bình thường">Bình thường</option>
              <option value="Không quá khắt khe">Không quá khắt khe</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Yêu cầu về người ở ghép</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <select value={formData.preferredGender || ''} onChange={(e) => onInputChange('preferredGender', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Giới tính mong muốn</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Không quan trọng">Không quan trọng</option>
            </select>
            <select value={formData.preferredAge || ''} onChange={(e) => onInputChange('preferredAge', e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">Độ tuổi mong muốn</option>
              <option value="18-25 tuổi">18-25 tuổi</option>
              <option value="25-35 tuổi">25-35 tuổi</option>
              <option value="35+ tuổi">35+ tuổi</option>
              <option value="Không quan trọng">Không quan trọng</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tính cách mong muốn</label>
            <div className="flex flex-wrap gap-2">
              {['Hòa đồng','Yên tĩnh','Năng động','Trách nhiệm','Sạch sẽ','Tôn trọng','Thân thiện','Độc lập'].map((trait) => (
                <button key={trait} type="button" onClick={() => {
                  const selectedTraits = formData.selectedTraits || [];
                  const newTraits = selectedTraits.includes(trait) ? selectedTraits.filter((t: string) => t !== trait) : [...selectedTraits, trait];
                  onInputChange('selectedTraits', newTraits);
                }} className={`px-3 py-1 rounded-full text-sm transition-colors ${ (formData.selectedTraits || []).includes(trait) ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700' }`}>
                  {trait}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input type="tel" value={formData.phoneNumber || ''} onChange={(e) => onInputChange('phoneNumber', e.target.value)} placeholder="Số điện thoại" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
          <input type="email" value={formData.email || ''} onChange={(e) => onInputChange('email', e.target.value)} placeholder="Email" className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
    </div>
  );
}


