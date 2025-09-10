"use client";

import { useState, useMemo } from "react";
import { addressService } from "../../services/address";
import Pagination from "../common/Pagination";

interface Favorite {
  id: number;
  title: string;
  category: string;
  price: number;
  area: number;
  address: string | {
    street?: string;
    ward: string;
    city: string;
    specificAddress?: string;
    showSpecificAddress?: boolean;
  };
  owner: string;
  phone: string;
  addedAt: string;
  images: string[];
  description: string;
  postType?: string;
}

interface FavoritesContentProps {
  favorites: Favorite[];
  onContact: (id: number) => void;
  onView: (id: number) => void;
  onRemove: (id: number) => void;
}

export default function FavoritesContent({ favorites, onContact, onView, onRemove }: FavoritesContentProps) {
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredFavorites = useMemo(() => {
    return favorites.filter(fav => 
      filterCategory === "all" || fav.category === filterCategory
    );
  }, [favorites, filterCategory]);

  const sortedFavorites = useMemo(() => {
    return [...filteredFavorites].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case "oldest":
          return new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        default:
          return 0;
      }
    });
  }, [filteredFavorites, sortBy]);

  const paginatedFavorites = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedFavorites.slice(startIndex, endIndex);
  }, [sortedFavorites, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedFavorites.length / itemsPerPage);

  const categories = [
    { id: "all", label: "Tất cả", count: favorites.length },
    { id: "phong-tro", label: "Phòng trọ", count: favorites.filter(f => f.category === "phong-tro").length },
    { id: "chung-cu", label: "Chung cư", count: favorites.filter(f => f.category === "chung-cu").length },
    { id: "nha-nguyen-can", label: "Nhà nguyên căn", count: favorites.filter(f => f.category === "nha-nguyen-can").length },
    { id: "roommate", label: "Ở ghép", count: favorites.filter(f => f.category === "roommate").length },
  ];

  const scrollToTop = () => {
    try {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      window.scrollTo(0, 0);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(scrollToTop, 80);
  };

  const handleFilterChange = (category: string) => {
    setFilterCategory(category);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header & Filters */}
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Lọc theo loại:</span>
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => handleFilterChange(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      filterCategory === category.id
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {category.label} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Sắp xếp:</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm bg-white"
              >
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="price-low">Giá thấp → cao</option>
                <option value="price-high">Giá cao → thấp</option>
              </select>
            </div>
          </div>
        </div>

        {/* Favorites Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedFavorites.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-gray-400 text-2xl">❤️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có yêu thích nào</h3>
            <p className="text-gray-500">Bắt đầu lưu các phòng trọ bạn quan tâm</p>
          </div>
        ) : (
          paginatedFavorites.map((favorite, index) => (
            <div key={`${favorite.postType || 'rent'}-${favorite.id}-${index}`} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Image */}
              <div className="relative">
                <img
                  src={favorite.images[0] || '/home/room1.png'}
                  alt={favorite.title}
                  className="w-full h-48 object-cover"
                />
                <button
                  onClick={() => onRemove(favorite.id)}
                  className="absolute top-3 right-3 p-2 bg-white/90 hover:bg-white rounded-full shadow-sm transition-colors"
                >
                  <span className="text-red-500 text-lg">❤️</span>
                </button>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                  {favorite.title}
                </h3>
                
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <span>
                      📍 {typeof favorite.address === 'string'
                        ? favorite.address
                        : addressService.formatWardCity(favorite.address)}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span>📐 {favorite.area}m²</span>
                    <span>💰 {formatPrice(favorite.price)}đ/tháng</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>👤 {favorite.owner}</span>
                    <span>📞 {favorite.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>📅 Lưu ngày: {formatDate(favorite.addedAt)}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {favorite.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onContact(favorite.id)}
                    className="flex-1 px-3 py-2 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 transition-colors"
                  >
                    Liên hệ
                  </button>
                  <button
                    onClick={() => onView(favorite.id)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              itemsPerPage={itemsPerPage}
              totalItems={sortedFavorites.length}
            />
          </div>
        )}
      </div>
  );
}
