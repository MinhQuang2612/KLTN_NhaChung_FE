"use client";

import { Building } from "@/types/Building";
import { addressService } from "@/services/address";

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("vi-VN");
}

function getBuildingTypeText(type: string) {
  switch (type) {
    case "chung-cu":
      return "Chung cư";
    case "nha-nguyen-can":
      return "Nhà nguyên căn";
    case "phong-tro":
      return "Phòng trọ";
    default:
      return type;
  }
}

function getBuildingTypeColor(type: string) {
  switch (type) {
    case "chung-cu":
      return "bg-blue-100 text-blue-800";
    case "nha-nguyen-can":
      return "bg-green-100 text-green-800";
    case "phong-tro":
      return "bg-purple-100 text-purple-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

export default function BuildingCard({
  building,
  onClick,
  onEdit,
  onDelete,
}: {
  building: Building;
  onClick: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div
      className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={() => onClick(building.buildingId)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(building.buildingId);
      }}
    >
      <div className="flex items-start gap-4">
        {/* Image */}
        <div className="flex-shrink-0">
          <img
            src={building.images[0] || "/home/room1.png"}
            alt={building.name}
            className="w-24 h-24 object-cover rounded-lg border border-gray-200"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-xl font-semibold text-gray-900">{building.name}</h3>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getBuildingTypeColor(
                    building.buildingType
                  )}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {getBuildingTypeText(building.buildingType)}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    building.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {building.isActive ? "Hoạt động" : "Tạm dừng"}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  📍 {addressService.formatAddressForDisplay(building.address as any)}
                </span>
                <span className="flex items-center gap-6">
                  <span className="flex items-center gap-1">
                    🏠 {building.totalRooms} {building.buildingType === 'nha-nguyen-can' ? 'căn' : 'phòng'}
                  </span>
                </span>
              </div>

              {building.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{building.description}</p>
              )}

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>📅 Tạo ngày: {formatDate(building.createdAt)}</span>
                <span>🔄 Cập nhật: {formatDate(building.updatedAt)}</span>
              </div>
            </div>

            {/* Actions (stop propagation) */}
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(building.buildingId)}
                  className="px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Chỉnh sửa
                </button>
                <button
                  onClick={() => onDelete(building.buildingId)}
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
  );
}


