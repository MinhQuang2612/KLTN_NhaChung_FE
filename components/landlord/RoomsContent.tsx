"use client";

import { useState, useMemo } from "react";
import Pagination from "../common/Pagination";
import { Room } from "../../types/Room";
import { Building } from "../../types/Building";
import { addressService } from "../../services/address";
import {
  FaHome,
  FaCheckCircle,
  FaUsers,
  FaMoneyBillWave,
  FaCompass,
  FaFileAlt,
  FaCalendarAlt,
  FaSync,
  FaMapMarkerAlt,
  FaRulerCombined,
  FaBed,
  FaShower,
  FaCouch,
  FaBuilding
} from "react-icons/fa";

interface RoomsContentProps {
  rooms: Room[];
  buildings: Building[];
  currentPage: number;
  totalPages: number;
  searchQuery: string;
  selectedBuildingId?: number;
  onSearch: (query: string) => void;
  onBuildingFilter: (buildingId: number | undefined) => void;
  onPageChange: (page: number) => void;
  onCreate: () => void;
  onEdit: (id: number) => void;
  onView: (id: number) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export default function RoomsContent({
  rooms,
  buildings,
  currentPage,
  totalPages,
  searchQuery,
  selectedBuildingId,
  onSearch,
  onBuildingFilter,
  onPageChange,
  onCreate,
  onEdit,
  onView,
  onDelete,
  onRefresh
}: RoomsContentProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchInput);
  };

  const handleSearchClear = () => {
    setSearchInput("");
    onSearch("");
  };

  const handleBuildingFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const buildingId = e.target.value ? parseInt(e.target.value) : undefined;
    onBuildingFilter(buildingId);
  };

  const getFurnitureText = (furniture: string) => {
    switch (furniture) {
      case "full": return "Đầy đủ";
      case "co-ban": return "Cơ bản";
      case "trong": return "Trống";
      default: return furniture;
    }
  };

  const getDirectionText = (direction: string) => {
    switch (direction) {
      case "dong": return "Đông";
      case "tay": return "Tây";
      case "nam": return "Nam";
      case "bac": return "Bắc";
      case "dong-bac": return "Đông Bắc";
      case "dong-nam": return "Đông Nam";
      case "tay-bac": return "Tây Bắc";
      case "tay-nam": return "Tây Nam";
      default: return direction;
    }
  };

  const getLegalStatusText = (status: string) => {
    switch (status) {
      case "co-so-hong": return "Có sổ hồng";
      case "dang-ky": return "Đang đăng ký";
      case "chua-dang-ky": return "Chưa đăng ký";
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const formatAddress = (address: any) => {
    return addressService.formatAddressForDisplay(address);
  };

  const getBuildingName = (buildingId: number) => {
    const building = buildings.find(b => b.buildingId === buildingId);
    return building ? building.name : `Dãy ${buildingId}`;
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Tổng phòng</p>
              <p className="text-3xl font-bold text-blue-700">{rooms?.length || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
              <FaHome className="text-2xl text-blue-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Phòng hoạt động</p>
              <p className="text-3xl font-bold text-green-700">
                {rooms?.filter(r => r.isActive).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
              <FaCheckCircle className="text-2xl text-green-700" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 text-sm font-medium">Có thể ở ghép</p>
              <p className="text-3xl font-bold text-amber-700">
                {rooms?.filter(r => r.canShare).length || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-200 rounded-lg flex items-center justify-center">
              <FaUsers className="text-2xl text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-600 text-sm font-medium">Giá trung bình</p>
              <p className="text-3xl font-bold text-purple-700">
                {rooms?.length > 0 
                  ? formatPrice(Math.round(rooms.reduce((sum, r) => sum + r.price, 0) / rooms.length))
                  : 0
                }đ
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
              <FaMoneyBillWave className="text-2xl text-purple-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filters Row */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Search */}
            <form onSubmit={handleSearchSubmit} className="flex-1">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Tìm kiếm phòng theo số phòng, giá, địa chỉ..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </form>

            {/* Building Filter */}
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Dãy:</span>
              <select
                value={selectedBuildingId || ""}
                onChange={handleBuildingFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">Tất cả dãy</option>
                {buildings.map(building => (
                  <option key={building.buildingId} value={building.buildingId}>
                    {building.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                type="submit"
                onClick={handleSearchSubmit}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
              >
                Tìm kiếm
              </button>
              <button
                type="button"
                onClick={onRefresh}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FaSync className="h-4 w-4" />
                Làm mới
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
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <div className="divide-y divide-gray-100">
          {rooms?.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaHome className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedBuildingId ? "Không tìm thấy phòng nào" : "Chưa có phòng nào"}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchQuery || selectedBuildingId 
                  ? "Thử tìm kiếm với từ khóa khác hoặc chọn dãy khác" 
                  : "Bắt đầu tạo phòng đầu tiên của bạn"
                }
              </p>
              {!searchQuery && !selectedBuildingId && (
                <button
                  onClick={onCreate}
                  className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium"
                >
                  Tạo phòng đầu tiên
                </button>
              )}
            </div>
          ) : (
            rooms?.map((room) => (
              <div key={room.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={room.images[0] || '/home/room1.png'}
                      alt={`Phòng ${room.roomNumber}`}
                      className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-gray-900">
                            Phòng {room.roomNumber}
                          </h3>
                          <span className="text-sm text-gray-600">
                            Tầng {room.floor}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                            room.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {room.isActive ? 'Hoạt động' : 'Tạm dừng'}
                          </span>
                          {room.canShare && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Có thể ở ghép
                            </span>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <FaBuilding className="text-gray-500" />
                            {getBuildingName(room.buildingId)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-gray-500" />
                            {formatAddress(room.address)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaRulerCombined className="text-gray-500" />
                            {room.area}m²
                          </span>
                          <span className="flex items-center gap-1">
                            <FaMoneyBillWave className="text-gray-500" />
                            {formatPrice(room.price)}đ/tháng
                          </span>
                          <span className="flex items-center gap-1">
                            <FaBed className="text-gray-500" />
                            {room.bedrooms} phòng ngủ
                          </span>
                          <span className="flex items-center gap-1">
                            <FaShower className="text-gray-500" />
                            {room.bathrooms} phòng tắm
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <FaCouch className="text-gray-500" />
                            {getFurnitureText(room.furniture)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaCompass className="text-gray-500" />
                            {getDirectionText(room.direction || '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaFileAlt className="text-gray-500" />
                            {getLegalStatusText(room.legalStatus || '')}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaUsers className="text-gray-500" />
                            Tối đa {room.maxOccupancy} người
                          </span>
                        </div>

                        {room.description && (
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {room.description}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FaCalendarAlt className="text-gray-500" />
                            Tạo ngày: {formatDate(room.createdAt)}
                          </span>
                          <span className="flex items-center gap-1">
                            <FaSync className="text-gray-500" />
                            Cập nhật: {formatDate(room.updatedAt)}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex-shrink-0">
                        <div className="flex gap-2">
                          <button
                            onClick={() => room.id && onView(room.id)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => room.id && onEdit(room.id)}
                            className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            Chỉnh sửa
                          </button>
                          <button
                            onClick={() => room.id && onDelete(room.id)}
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
              totalItems={rooms?.length || 0}
            />
          </div>
        )}
      </div>
    </div>
  );
}
