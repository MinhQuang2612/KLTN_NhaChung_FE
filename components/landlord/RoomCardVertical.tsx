"use client";

import { Room } from "@/types/Room";

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
  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden" onClick={() => onClick(room.id)}>
      <div className="flex">
        {/* Ảnh bên trái - chiếm 1/3 */}
        <div className="relative w-1/3">
          <img src={cover} alt={`Phòng ${room.roomNumber}`} className="w-full h-32 object-cover" />
          {room.roomNumber && (
            <span className="absolute top-2 right-2 rounded-lg bg-black/70 text-white text-xs px-2 py-1">
              {room.roomNumber}
            </span>
          )}
        </div>
        
        {/* Thông tin bên phải - chiếm 2/3 */}
        <div className="flex-1 p-4">
          {/* Tên building - lớn và nổi bật */}
          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {room.building?.name || 'Chưa có tên dãy'}
          </h3>
          
          {/* Giá và trạng thái */}
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-900 text-lg">
              {new Intl.NumberFormat('vi-VN').format(room.price)}đ/tháng
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${room.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
              {room.isActive ? 'Hoạt động' : 'Tạm dừng'}
            </span>
          </div>
          
          {/* Thông tin phòng */}
          <div className="text-sm text-gray-600 flex flex-wrap gap-3 mb-2">
            <span>📐 {room.area}m²</span>
            <span>🛏️ {room.bedrooms} phòng ngủ</span>
            <span>🚿 {room.bathrooms} phòng tắm</span>
            {room.canShare && <span className="text-blue-600">👥 Ở ghép</span>}
          </div>
          
          {/* Mô tả */}
          {room.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-3">{room.description}</p>
          )}
          
          {/* Nút hành động */}
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <button className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" onClick={() => onEdit(room.id)}>Chỉnh sửa</button>
            <button className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-lg hover:bg-red-100" onClick={() => onDelete(room.id)}>Xóa</button>
          </div>
        </div>
      </div>
    </div>
  );
}


