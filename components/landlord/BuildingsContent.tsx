"use client";

import { useState, useMemo } from "react";
import Pagination from "../common/Pagination";
import { Building } from "../../types/Building";
import { addressService } from "../../services/address";

interface BuildingsContentProps {
  buildings: Building[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  onSearch: (query: string) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function BuildingsContent({
  buildings,
  currentPage,
  totalPages,
  searchQuery,
  onSearch,
  onPageChange,
  onCreate,
  onEdit,
  onView,
  onDelete,
  onRefresh
}: BuildingsContentProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    onSearch("");
  };

  const getBuildingTypeText = (type: string) => {
    switch (type) {
      case "chung-cu": return "Chung cư";
      case "nha-nguyen-can": return "Nhà nguyên căn";
      case "phong-tro": return "Phòng trọ";
      default: return type;
    }
  };

  const getBuildingTypeColor = (type: string) => {
    switch (type) {
      case "chung-cu": return "bg-blue-100 text-blue-800";
      case "nha-nguyen-can": return "bg-green-100 text-green-800";
      case "phong-tro": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatAddress = (address: any) => {
    return addressService.formatAddressForDisplay(address);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Tổng dãy</p>
              <p className="text-3xl font-bold text-blue-700">{buildings.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏢</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Dãy hoạt động</p>
              <p className="text-3xl font-bold text-green-700">
                {buildings.filter(b => b.isActive).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Tổng phòng</p>
              <p className="text-3xl font-bold text-amber-700">
                {buildings.reduce((sum, b) => sum + b.totalRooms, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏠</span>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Tổng tầng</p>
              <p className="text-3xl font-bold text-purple-700">
                {buildings.reduce((sum, b) => sum + b.totalFloors, 0)}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🏗️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search Bar */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <form onSubmit={handleSearchSubmit} className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm dãy theo tên hoặc địa chỉ..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            >
              Tìm kiếm
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={handleSearchClear}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Xóa
              </button>
            )}
          </form>
        </div>

        {/* Buildings List */}
        <div className="divide-y divide-gray-100">
          {buildings.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-gray-400 text-2xl">🏢</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? "Không tìm thấy dãy nào" : "Chưa có dãy nào"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery 
                  ? "Thử tìm kiếm với từ khóa khác" 
                  : "Bắt đầu tạo dãy đầu tiên của bạn"
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={onCreate}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Tạo dãy đầu tiên
                </button>
              )}
            </div>
          ) : (
            buildings.map((building) => (
              <div key={building.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={building.images[0] || '/home/room1.png'}
                      alt={building.name}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            {building.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBuildingTypeColor(building.buildingType)}`}>
                            {getBuildingTypeText(building.buildingType)}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            building.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {building.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            📍 {formatAddress(building.address)}
                          </span>
                          <span className="flex items-center gap-1">
                            🏠 {building.totalRooms} phòng
                          </span>
                          <span className="flex items-center gap-1">
                            🏗️ {building.totalFloors} tầng
                          </span>
                        </div>

                        {building.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {building.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span>📅 Tạo ngày: {formatDate(building.createdAt)}</span>
                          <span>🔄 Cập nhật: {formatDate(building.updatedAt)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onView(building.id)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => onEdit(building.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => onDelete(building.id)}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={onPageChange}
              itemsPerPage={10}
              totalItems={buildings.length}
            />
          </div>
        )}
      </div>
    </div>
  );
}
