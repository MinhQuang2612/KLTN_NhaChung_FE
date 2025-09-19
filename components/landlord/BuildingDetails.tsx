"use client";

import { Building } from "@/types/Building";
import { addressService } from "@/services/address";

export default function BuildingDetails({ building }: { building: Building }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-5 bg-gradient-to-r from-teal-600 to-teal-500 text-white">
        <h1 className="text-2xl font-semibold">{building.name}</h1>
        <p className="text-white/90 text-sm mt-1">Thông tin chi tiết dãy</p>
      </div>

      <div className="p-6 space-y-5">
        {/* Ảnh bìa trên cùng, 90% chiều ngang */}
        <div>
          <img
            src={building.images[0] || "/home/room1.png"}
            className="mx-auto w-[90%] h-64 object-cover rounded-xl border"
            alt={building.name}
          />
        </div>
        {/* Thông tin dưới */}
        <div className="text-gray-700 space-y-2">
          <div>📍 {addressService.formatAddressForDisplay(building.address as any)}</div>
          <div className="flex gap-6 text-sm">
            <span>🏠 {building.totalRooms} {building.buildingType === 'nha-nguyen-can' ? 'căn' : 'phòng'}</span>
          </div>
        </div>

        {building.description && (
          <div>
            <h3 className="font-semibold mb-2">Mô tả</h3>
            <p className="text-gray-700 whitespace-pre-line">{building.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}


