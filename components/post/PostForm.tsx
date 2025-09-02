"use client";

import { useState } from 'react';

export default function PostForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      {/* Hình ảnh và video sản phẩm */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Hình ảnh và video sản phẩm</h2>
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
              <p className="text-gray-600 font-medium">Thêm từ 3-10 hình ảnh về căn nhà của bạn</p>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Hình ảnh hợp lệ</span>
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
              <p className="text-gray-600 font-medium">Thêm video sẽ giúp khách hàng nhìn rõ hơn về chỗ ở</p>
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-1 text-green-600 text-sm">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Video hợp lệ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Danh mục đăng tin */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Danh mục đăng tin:
        </label>
        <input
          type="text"
          placeholder="Phòng trọ"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Địa chỉ cho thuê */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Địa chỉ cho thuê</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Khu vực, Thành phố, Tỉnh..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Tên phường, xã..."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Số nhà, tên đường,.."
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <textarea
            placeholder="Mô tả thêm về địa chỉ của bạn để người khác dễ tìm kiếm hơn... (cạnh siêu thị, cạnh trường học,...)"
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Diện tích & chi phí */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Diện tích & chi phí</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Diện tích"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <input
            type="text"
            placeholder="Giá cho thuê"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <select className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <option>Tiền cọc</option>
            <option>1 tháng</option>
            <option>2 tháng</option>
            <option>3 tháng</option>
          </select>
        </div>
      </div>

      {/* Tình trạng nội thất */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tình trạng nội thất</h3>
        <input
          type="text"
          placeholder="Nội thất đầy đủ, Nội thất cơ bản, Nhà trống"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Tiêu đề bài đăng và mô tả chi tiết */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tiêu đề bài đăng và mô tả chi tiết</h3>
        <div className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Tiêu đề"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {title.length}/50 kí tự
            </div>
          </div>
          <div>
            <textarea
              placeholder="Mô tả: tình trạng, số phòng, tiện ích, nội thất,..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="text-right text-sm text-gray-500 mt-1">
              {description.length}/300 kí tự
            </div>
          </div>
        </div>
      </div>

      {/* Xác thực tin đăng */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Xác thực tin đăng để đảm bảo tính minh bạch và tăng hiệu quả tin đăng
        </h3>
        <p className="text-gray-600 mb-6">Đăng tin với nhãn xác thực bằng cách</p>
        
        <div className="grid md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Đăng bằng tài khoản xác thực</span>
          </div>
          
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Đăng bài có video rõ ràng</span>
          </div>
          
          <div className="flex items-center gap-3 p-4 border border-gray-200 rounded-xl hover:border-blue-300 transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Đăng bài với những thông tin chính xác</span>
          </div>
        </div>
      </div>

      {/* Nút đăng tin */}
      <div className="flex justify-center pt-6">
        <button className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
          Đăng tin
        </button>
      </div>
    </div>
  );
}
