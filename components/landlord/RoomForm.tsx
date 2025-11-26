"use client";

import { CreateRoomPayload, UpdateRoomPayload } from "../../types/Room";
import { Building } from "../../types/Building";
import ChungCuForm from "./forms/ChungCuForm";
import PhongTroForm from "./forms/PhongTroForm";
import NhaNguyenCanForm from "./forms/NhaNguyenCanForm";

interface RoomFormProps {
  buildings: Building[];
  initialData?: Partial<CreateRoomPayload>;
  onSubmit: (data: CreateRoomPayload | UpdateRoomPayload) => void;
  onCancel: () => void;
  loading?: boolean;
  existingRooms?: Array<{ roomNumber: string; id?: number }>; // Để kiểm tra trùng
}

export default function RoomForm({ 
  buildings,
  initialData, 
  onSubmit, 
  onCancel, 
  loading = false,
  existingRooms = []
}: RoomFormProps) {
  // Tìm building được chọn
  const selectedBuilding = buildings.find(b => b.buildingId === initialData?.buildingId) || buildings[0];
  
  if (!selectedBuilding) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-6">
        <p className="text-red-500">Không tìm thấy dãy nhà phù hợp</p>
        <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
          Đóng
        </button>
      </div>
    );
  }

  // Render form phù hợp dựa trên buildingType
  if (selectedBuilding.buildingType === "chung-cu") {
    return (
      <ChungCuForm
        building={selectedBuilding}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        loading={loading}
        existingRooms={existingRooms}
      />
    );
  }

  if (selectedBuilding.buildingType === "phong-tro") {
    return (
      <PhongTroForm
        building={selectedBuilding}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        loading={loading}
        existingRooms={existingRooms}
      />
    );
  }

  if (selectedBuilding.buildingType === "nha-nguyen-can") {
    return (
      <NhaNguyenCanForm
        building={selectedBuilding}
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onCancel}
        loading={loading}
        existingRooms={existingRooms}
      />
    );
  }

  // Fallback cho trường hợp không xác định
  return (
    <div className="bg-white rounded-lg shadow-lg max-w-4xl mx-auto p-6">
      <p className="text-red-500">Loại dãy nhà không được hỗ trợ: {selectedBuilding.buildingType}</p>
      <button onClick={onCancel} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
        Đóng
            </button>
    </div>
  );
}