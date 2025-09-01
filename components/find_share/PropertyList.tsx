"use client";
import { useState } from "react";
import PropertyCard from "./PropertyCard";

// Mock data - sau này sẽ lấy từ API
const mockProperties = [
  {
    id: "1",
    title: "Phòng Tầng Trệt Có Nội Thất",
    description: "Phòng trọ mới xây, có nội thất đầy đủ, gần trường học, bệnh viện",
    area: "20 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 10, Hồ Chí Minh",
    price: "3,5 triệu / tháng",
    photoCount: 6,
    isVerified: true,
    imageUrl: "/home/room1.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "2", 
    title: "Phòng Trọ Mới Xây - Ở Ghép",
    description: "Phòng trọ cao cấp, view đẹp, an ninh 24/7, có thang máy, tìm bạn ở ghép",
    area: "25 m²",
    bedrooms: "01 PN", 
    bathrooms: "01 WC",
    location: "Quận 7, Hồ Chí Minh",
    price: "2,1 triệu / tháng",
    photoCount: 8,
    isVerified: false,
    imageUrl: "/home/room2.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "3",
    title: "Phòng Trọ Giá Rẻ",
    description: "Phòng trọ giá tốt, phù hợp sinh viên, gần chợ, xe buýt",
    area: "18 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC", 
    location: "Quận 3, Hồ Chí Minh",
    price: "2,8 triệu / tháng",
    photoCount: 4,
    isVerified: true,
    imageUrl: "/home/room3.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "4",
    title: "Chung Cư Mini Cao Cấp - Ở Ghép",
    description: "Chung cư mini mới xây, nội thất cao cấp, có ban công, tìm bạn ở ghép",
    area: "30 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 1, Hồ Chí Minh", 
    price: "2,8 triệu / tháng",
    photoCount: 10,
    isVerified: true,
    imageUrl: "/home/room4.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "5",
    title: "Phòng Trọ Gần Đại Học",
    description: "Phòng trọ gần các trường đại học, thuận tiện đi lại",
    area: "22 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 5, Hồ Chí Minh",
    price: "3,2 triệu / tháng", 
    photoCount: 5,
    isVerified: false,
    imageUrl: "/home/room1.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "6",
    title: "Nhà Trọ Có Gác - Ở Ghép",
    description: "Nhà trọ có gác lửng, không gian rộng rãi, thoáng mát, tìm bạn ở ghép",
    area: "35 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 8, Hồ Chí Minh",
    price: "2,4 triệu / tháng",
    photoCount: 7,
    isVerified: true,
    imageUrl: "/home/room2.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "7",
    title: "Phòng Trọ Cao Cấp Quận 2",
    description: "Phòng trọ cao cấp tại quận 2, view sông, an ninh 24/7",
    area: "28 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 2, Hồ Chí Minh",
    price: "6,5 triệu / tháng",
    photoCount: 12,
    isVerified: true,
    imageUrl: "/home/room3.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "8",
    title: "Studio Apartment Quận 4 - Ở Ghép",
    description: "Studio apartment hiện đại, thiết kế tối ưu không gian, tìm bạn ở ghép",
    area: "32 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 4, Hồ Chí Minh",
    price: "2,9 triệu / tháng",
    photoCount: 9,
    isVerified: false,
    imageUrl: "/home/room4.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "9",
    title: "Phòng Trọ Sinh Viên Quận 6",
    description: "Phòng trọ dành cho sinh viên, giá rẻ, gần trường học",
    area: "16 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 6, Hồ Chí Minh",
    price: "2,5 triệu / tháng",
    photoCount: 3,
    isVerified: true,
    imageUrl: "/home/room1.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "10",
    title: "Chung Cư Mini Quận 9 - Ở Ghép",
    description: "Chung cư mini mới xây, có ban công, view đẹp, tìm bạn ở ghép",
    area: "40 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 9, Hồ Chí Minh",
    price: "3,6 triệu / tháng",
    photoCount: 15,
    isVerified: true,
    imageUrl: "/home/room2.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "11",
    title: "Phòng Trọ Gần Metro Quận 11",
    description: "Phòng trọ gần trạm metro, thuận tiện di chuyển",
    area: "24 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 11, Hồ Chí Minh",
    price: "3,8 triệu / tháng",
    photoCount: 6,
    isVerified: false,
    imageUrl: "/home/room3.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "12",
    title: "Nhà Trọ Có Vườn Quận 12 - Ở Ghép",
    description: "Nhà trọ có vườn cây, không gian xanh, thoáng mát, tìm bạn ở ghép",
    area: "38 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận 12, Hồ Chí Minh",
    price: "2,3 triệu / tháng",
    photoCount: 8,
    isVerified: true,
    imageUrl: "/home/room4.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "13",
    title: "Phòng Trọ Gần Chợ Bình Tân",
    description: "Phòng trọ gần chợ, thuận tiện mua sắm, giá rẻ",
    area: "20 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Bình Tân, Hồ Chí Minh",
    price: "2,9 triệu / tháng",
    photoCount: 4,
    isVerified: true,
    imageUrl: "/home/room1.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "14",
    title: "Studio Cao Cấp Quận Tân Bình - Ở Ghép",
    description: "Studio cao cấp, nội thất hiện đại, có gym, tìm bạn ở ghép",
    area: "35 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Tân Bình, Hồ Chí Minh",
    price: "3,4 triệu / tháng",
    photoCount: 11,
    isVerified: true,
    imageUrl: "/home/room2.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "15",
    title: "Phòng Trọ Gần Sân Bay Quận Tân Phú",
    description: "Phòng trọ gần sân bay, thuận tiện cho nhân viên hàng không",
    area: "26 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Tân Phú, Hồ Chí Minh",
    price: "4,1 triệu / tháng",
    photoCount: 7,
    isVerified: false,
    imageUrl: "/home/room3.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "16",
    title: "Chung Cư Mini Quận Phú Nhuận - Ở Ghép",
    description: "Chung cư mini tại quận Phú Nhuận, gần trung tâm, tìm bạn ở ghép",
    area: "42 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Phú Nhuận, Hồ Chí Minh",
    price: "3,8 triệu / tháng",
    photoCount: 13,
    isVerified: true,
    imageUrl: "/home/room4.png",
    propertyType: "o-ghep" // Trọ ở ghép
  },
  {
    id: "17",
    title: "Phòng Trọ Sinh Viên Quận Gò Vấp",
    description: "Phòng trọ dành cho sinh viên, gần các trường đại học",
    area: "18 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Gò Vấp, Hồ Chí Minh",
    price: "2,7 triệu / tháng",
    photoCount: 5,
    isVerified: true,
    imageUrl: "/home/room1.png",
    propertyType: "cho-thue" // Trọ cho thuê
  },
  {
    id: "18",
    title: "Nhà Trọ Có Ban Công Quận Thủ Đức - Ở Ghép",
    description: "Nhà trọ có ban công, view đẹp, không gian thoáng, tìm bạn ở ghép",
    area: "30 m²",
    bedrooms: "01 PN",
    bathrooms: "01 WC",
    location: "Quận Thủ Đức, Hồ Chí Minh",
    price: "2,2 triệu / tháng",
    photoCount: 9,
    isVerified: false,
    imageUrl: "/home/room2.png",
    propertyType: "o-ghep" // Trọ ở ghép
  }
];

export default function PropertyList() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;
  const totalPages = Math.ceil(mockProperties.length / itemsPerPage);
  
  // Tính toán phòng trọ hiển thị cho trang hiện tại
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProperties = mockProperties.slice(startIndex, endIndex);

  const scrollToTop = () => {
    // Thử nhiều cách scroll khác nhau
    try {
      // Cách 1: Scroll đến đầu trang
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Cách 2: Scroll đến SearchDetails component
      const searchDetailsElement = document.querySelector('[data-search-details]');
      if (searchDetailsElement) {
        searchDetailsElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      
      // Cách 3: Scroll đến header của PropertyList
      const headerElement = document.querySelector('h2');
      if (headerElement) {
        headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      
      // Cách 4: Scroll đến body
      document.body.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
    } catch (error) {
      // Fallback: scroll ngay lập tức
      window.scrollTo(0, 0);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top khi chuyển trang (cho tất cả nút pagination)
    setTimeout(() => {
      scrollToTop();
    }, 100);
  };

  const handlePreviousPage = () => {
    setCurrentPage(currentPage - 1);
    setTimeout(() => {
      scrollToTop();
    }, 100);
  };

  const handleNextPage = () => {
    setCurrentPage(currentPage + 1);
    setTimeout(() => {
      scrollToTop();
    }, 100);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">
          Danh sách phòng trọ ({mockProperties.length})
        </h2>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Sắp xếp theo:</span>
          <select className="border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500">
            <option>Mới nhất</option>
            <option>Giá tăng dần</option>
            <option>Giá giảm dần</option>
            <option>Diện tích</option>
          </select>
        </div>
      </div>

      {/* Property Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentProperties.map((property) => (
          <PropertyCard
            key={property.id}
            {...property}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          {/* Previous Button */}
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg border transition-colors ${
                currentPage === page
                  ? "bg-teal-500 text-white border-teal-500"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Page Info */}
      <div className="text-center text-sm text-gray-600">
        Hiển thị {startIndex + 1}-{Math.min(endIndex, mockProperties.length)} trong tổng số {mockProperties.length} phòng trọ
      </div>
    </div>
  );
}
