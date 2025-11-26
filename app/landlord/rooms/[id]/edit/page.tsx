"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import RoomForm from "../../../../../components/landlord/RoomForm";
import { getRoomById, updateRoom, getRooms } from "../../../../../services/rooms";
import { getBuildings } from "../../../../../services/buildings";
import { Room, UpdateRoomPayload, RoomListParams } from "../../../../../types/Room";
import { Building } from "../../../../../types/Building";

export default function EditRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = parseInt(params.id as string);
  
  const [room, setRoom] = useState<Room | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [existingRooms, setExistingRooms] = useState<Array<{ roomNumber: string; id?: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra quyền landlord
  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.push("/");
      return;
    }
  }, [user, router]);

  // Load room and buildings data
  useEffect(() => {
    const loadData = async () => {
      if (!user?.userId || !roomId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const [roomData, buildingsResponse] = await Promise.all([
          getRoomById(roomId),
          getBuildings()
        ]);
        
        setRoom(roomData);
        // Extract buildings array from response (could be array or object)
        const buildingsList = Array.isArray(buildingsResponse) 
          ? buildingsResponse 
          : buildingsResponse.buildings;
        setBuildings(buildingsList);
        
        // Load existing rooms in the same building for validation
        if (roomData?.buildingId) {
          const roomsResponse = await getRooms({ buildingId: roomData.buildingId } as RoomListParams);
          const roomsList = Array.isArray(roomsResponse) ? roomsResponse : (roomsResponse.rooms ?? []);
          setExistingRooms(roomsList.map(r => ({ roomNumber: r.roomNumber, id: r.id })));
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin phòng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && user.role === "landlord") {
      loadData();
    }
  }, [user?.userId, user?.role, roomId]);

  const handleSubmit = async (data: UpdateRoomPayload) => {
    try {
      setSubmitting(true);
      setError(null);
      
      await updateRoom(roomId, data);
      // Redirect về trang quản lý dãy chứa phòng này
      if (room?.buildingId) {
        router.push(`/landlord/buildings/${room.buildingId}`);
      } else {
        router.push("/landlord/rooms");
      }
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật phòng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Redirect về trang quản lý dãy chứa phòng này
    if (room?.buildingId) {
      router.push(`/landlord/buildings/${room.buildingId}`);
    } else {
      router.push("/landlord/rooms");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (user.role !== "landlord") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không có quyền truy cập</h1>
          <p className="text-gray-600">Bạn cần có quyền landlord để truy cập trang này.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin phòng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Lỗi</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push("/landlord/rooms")}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy phòng</h1>
          <p className="text-gray-600 mb-4">Phòng bạn đang tìm kiếm không tồn tại.</p>
          <button
            onClick={() => router.push("/landlord/rooms")}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa phòng</h1>
          <p className="text-gray-600">Cập nhật thông tin phòng {room.roomNumber}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <RoomForm
          buildings={buildings}
          initialData={room}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
          existingRooms={existingRooms}
        />
      </div>
    </div>
  );
}
