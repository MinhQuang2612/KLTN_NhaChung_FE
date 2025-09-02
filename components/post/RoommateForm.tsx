"use client";

import { useState } from 'react';

export default function RoommateForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [duration, setDuration] = useState('');
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  const handleHobbyClick = (hobby: string) => {
    setSelectedHobbies(prev => 
      prev.includes(hobby) 
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    );
  };

  const handleTraitClick = (trait: string) => {
    setSelectedTraits(prev => 
      prev.includes(trait) 
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Hình ảnh và video */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hình ảnh và video</h2>
          <a href="#" className="text-blue-600 hover:text-blue-700 text-sm">
            Xem thêm về quy định đăng tin
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Upload hình ảnh */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Thêm ảnh của bạn và phòng</p>
            </div>
          </div>

          {/* Upload video */}
          <div className="border-2 border-dashed border-orange-300 bg-orange-50 rounded-xl p-8 text-center hover:border-orange-400 transition-colors cursor-pointer">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 font-medium">Video giới thiệu bản thân</p>
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin cá nhân */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin cá nhân</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Họ và tên"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="number"
            placeholder="Tuổi"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Giới tính</option>
            <option>Nam</option>
            <option>Nữ</option>
            <option>Khác</option>
          </select>
          <input
            type="text"
            placeholder="Nghề nghiệp"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Thông tin phòng hiện tại */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin phòng hiện tại</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Địa chỉ phòng hiện tại"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <input
              type="text"
              placeholder="Giá thuê phòng (VNĐ/tháng)"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Loại phòng</option>
              <option>Phòng đơn</option>
              <option>Phòng đôi</option>
              <option>Phòng 3-4 người</option>
            </select>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Số người hiện tại</option>
              <option>1 người (tìm thêm 1 người)</option>
              <option>2 người (tìm thêm 1 người)</option>
              <option>3 người (tìm thêm 1 người)</option>
            </select>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Thời gian ở còn lại</option>
              <option>1-3 tháng</option>
              <option>3-6 tháng</option>
              <option>6-12 tháng</option>
              <option>Trên 1 năm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sở thích và thói quen */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sở thích và thói quen</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Sở thích</label>
            <div className="flex flex-wrap gap-2">
              {['Đọc sách', 'Xem phim', 'Chơi game', 'Thể thao', 'Du lịch', 'Nấu ăn', 'Âm nhạc', 'Nghệ thuật'].map((hobby) => (
                <button
                  key={hobby}
                  onClick={() => handleHobbyClick(hobby)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedHobbies.includes(hobby)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                >
                  {hobby}
                </button>
              ))}
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Thói quen sinh hoạt</option>
              <option>Dậy sớm (5-7h)</option>
              <option>Bình thường (7-9h)</option>
              <option>Dậy muộn (9h+)</option>
            </select>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Mức độ sạch sẽ</option>
              <option>Rất sạch sẽ</option>
              <option>Sạch sẽ</option>
              <option>Bình thường</option>
              <option>Không quá khắt khe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Yêu cầu về người ở ghép */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Yêu cầu về người ở ghép</h3>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Giới tính mong muốn</option>
              <option>Nam</option>
              <option>Nữ</option>
              <option>Không quan trọng</option>
            </select>
            <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Độ tuổi mong muốn</option>
              <option>18-25 tuổi</option>
              <option>25-35 tuổi</option>
              <option>35+ tuổi</option>
              <option>Không quan trọng</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tính cách mong muốn</label>
            <div className="flex flex-wrap gap-2">
              {['Hòa đồng', 'Yên tĩnh', 'Năng động', 'Trách nhiệm', 'Sạch sẽ', 'Tôn trọng', 'Thân thiện', 'Độc lập'].map((trait) => (
                <button
                  key={trait}
                  onClick={() => handleTraitClick(trait)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedTraits.includes(trait)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700'
                  }`}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tiêu đề và mô tả */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiêu đề và mô tả</h3>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tiêu đề bài đăng"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {title.length}/60 kí tự
            </div>
          </div>
          <div>
            <textarea
              placeholder="Mô tả về bản thân, sở thích, thói quen và mong muốn tìm người ở ghép như thế nào..."
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {description.length}/500 kí tự
            </div>
          </div>
        </div>
      </div>

      {/* Thông tin liên hệ */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="tel"
            placeholder="Số điện thoại"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" className="rounded" />
            <span className="text-sm text-gray-600">Tôi đồng ý với điều khoản sử dụng và chính sách bảo mật</span>
          </label>
        </div>
      </div>

      {/* Nút đăng tin */}
      <div className="flex justify-center pt-6">
        <button className="px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          Đăng tin tìm người ở ghép
        </button>
      </div>
    </div>
  );
}
