"use client";

export default function PropertyDetails() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Thông Tin Chính */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Thông Tin Chính</h3>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Địa Chỉ:</span>
            <span className="text-gray-900">268 Đ. Tô Hiến Thành, Phường Diên Hồng, TP. Hồ Chí Minh</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Giá Cho Thuê:</span>
            <span className="text-gray-900 font-semibold text-red-600">3,5 triệu / tháng</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Diện tích:</span>
            <span className="text-gray-900">20 m²</span>
          </div>
        </div>
      </div>

      {/* Thông Tin Chi Tiết */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Thông Tin Chi Tiết</h3>
        <div className="border-t border-gray-200 pt-3 space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Số Phòng Ngủ:</span>
            <span className="text-gray-900">1 phòng</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Nhà Vệ Sinh:</span>
            <span className="text-gray-900">1 WC</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Tầng/Lầu:</span>
            <span className="text-gray-900">Tầng trệt</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Ngày Đăng:</span>
            <span className="text-gray-900">Hôm nay</span>
          </div>
        </div>
      </div>

      {/* Thông Tin Thêm */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Thông Tin Thêm</h3>
        <div className="border-t border-gray-200 pt-3">
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Thích hợp ở gia đình, nhóm sinh viên, công nhân viên,....</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Nấu ăn - Bồn rửa chén</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Wifi, cáp</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Không giới hạn số người ở</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Chổ để xe rộng, bảo vệ an ninh</span>
            </li>
            <li className="flex items-start">
              <span className="text-gray-400 mr-2">•</span>
              <span>Có hệ thống camera, PCCC đầy đủ</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200">
        <button className="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          Liên hệ: 0782926 ***
        </button>
        <button className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.293l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
          </svg>
          Đăng ký thuê ngay
        </button>
      </div>
    </div>
  );
}
