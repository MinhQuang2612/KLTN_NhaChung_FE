"use client";

import { Room } from "@/types/Room";
import { FaRulerCombined, FaBed, FaShower, FaUsers } from "react-icons/fa";

export default function RoomCardVertical({
  room,
  onClick,
  onEdit,
  onDelete,
}: {
  room: Room;
  onClick: (id: number) => void;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const cover = room.images?.[0] || "/home/room1.png";
  const roomId = (room as any).roomId || room.id;
  
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => onClick(roomId)}>
      <div className="relative aspect-video">
        <img src={cover} alt={`Phòng ${room.roomNumber}`} className="w-full h-full object-cover" />
        {room.status === 'occupied' && (
          <span className="absolute top-2 left-2 rounded-lg bg-rose-600 text-white text-xs px-2 py-1">
            Đã thuê
          </span>
        )}
        {room.roomNumber && (
          <span className="absolute top-2 right-2 rounded-lg bg-black/70 text-white text-xs px-2 py-1">
            {room.roomNumber}
          </span>
        )}
      </div>
      <div className="p-4">
        {/* Tên building - hiển thị ở trên cùng */}
        {room.building?.name && (
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {room.building.name}
          </h3>
        )}
        
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold text-gray-900 truncate">{new Intl.NumberFormat('vi-VN').format(room.price)}đ/tháng</div>
          <span className={`text-xs px-2 py-1 rounded-full ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>{room.isActive ? 'Hoạt động' : 'Tạm dừng'}</span>
        </div>
        <div className="text-sm text-gray-600 flex flex-wrap gap-3 mb-3">
          <span className="flex items-center gap-1">
            <FaRulerCombined className="text-gray-500" />
            {room.area || 'N/A'}m²
          </span>
          {/* Chỉ hiển thị phòng ngủ/phòng tắm cho chung cư và nhà nguyên căn */}
          {room.category !== 'phong-tro' && (
            <>
              <span className="flex items-center gap-1">
                <FaBed className="text-gray-500" />
                {room.bedrooms ?? room.chungCuInfo?.bedrooms ?? room.nhaNguyenCanInfo?.bedrooms ?? 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <FaShower className="text-gray-500" />
                {room.bathrooms ?? room.chungCuInfo?.bathrooms ?? room.nhaNguyenCanInfo?.bathrooms ?? 'N/A'}
              </span>
            </>
          )}
          {room.canShare && (
            <span className="text-blue-600 flex items-center gap-1">
              <FaUsers className="text-blue-500" />
              Ở ghép
            </span>
          )}
        </div>
        {room.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{room.description}</p>
        )}
        <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" onClick={() => onEdit(roomId)}>Chỉnh sửa</button>
          <button className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100" onClick={() => onDelete(roomId)}>Xóa</button>
        </div>
      </div>
    </div>
  );
}


