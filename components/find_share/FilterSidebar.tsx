"use client";
import { useState } from "react";

export default function FilterSidebar() {
  const [selectedPrice, setSelectedPrice] = useState<string>("");
  const [selectedArea, setSelectedArea] = useState<string>("");

  const popularSearches = [
    "Phòng Trọ Hồ Chí Minh",
    "Phòng Trọ Hà Nội", 
    "Phòng Trọ Đà Nẵng",
    "Phòng Trọ Hạnh Thông",
    "Phòng Trọ Quận 1",
    "Phòng Trọ Quận 7",
    "Phòng Trọ Gần Đại Học",
    "Phòng Trọ Giá Rẻ"
  ];

  const priceRanges = [
    "Dưới 1 triệu",
    "Từ 1-2 triệu", 
    "Từ 2-3 triệu",
    "Từ 3-5 triệu",
    "Từ 5-7 triệu",
    "Từ 7-10 triệu",
    "Từ 10-15 triệu",
    "Từ 15-20 triệu",
    "Trên 20 triệu",
    "Thỏa Thuận"
  ];

  const areaRanges = [
    "Dưới 20 m²",
    "Từ 20-30 m²",
    "Từ 30-50 m²", 
    "Từ 50-60 m²",
    "Từ 60-70 m²",
    "Từ 70-80 m²",
    "Từ 80-90 m²",
    "Từ 90-100 m²",
    "Trên 100 m²",
    "Không Xác Định"
  ];

  return (
    <div className="space-y-6">
      {/* Tìm Nhà Thuê */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Tìm Nhà Thuê</h3>
        
        <div className="space-y-3">
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-500 text-white">
            <option>---Tỉnh/Thành Phố---</option>
            <option>TP. Hồ Chí Minh</option>
            <option>Hà Nội</option>
            <option>Đà Nẵng</option>
          </select>
          
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-500 text-white">
            <option>---Phường/Xã---</option>
            <option>Phường 1</option>
            <option>Phường 2</option>
            <option>Phường 3</option>
          </select>
          
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-teal-500 text-white">
            <option>---Đường/Phố---</option>
            <option>Đường ABC</option>
            <option>Đường XYZ</option>
            <option>Đường 123</option>
          </select>
          
          <button className="w-full px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors font-medium">
            Tìm Kiếm
          </button>
        </div>
      </div>

      {/* Tìm Nhiều Nhất */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Tìm Nhiều Nhất</h3>
        
        <div className="space-y-2">
          {popularSearches.map((search, index) => (
            <a
              key={index}
              href="#"
              className="block text-teal-600 hover:text-teal-700 hover:underline text-sm"
            >
              {search}
            </a>
          ))}
        </div>
      </div>

      {/* Xem Theo Giá */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Xem Theo Giá</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {priceRanges.map((price, index) => (
            <button
              key={index}
              onClick={() => setSelectedPrice(price)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedPrice === price
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {price}
            </button>
          ))}
        </div>
      </div>

      {/* Xem Theo Diện Tích */}
      <div className="bg-white rounded-lg shadow-md p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-3">Xem Theo Diện Tích</h3>
        
        <div className="grid grid-cols-2 gap-2">
          {areaRanges.map((area, index) => (
            <button
              key={index}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                selectedArea === area
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
