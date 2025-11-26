"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import RoomForm from "../../../../components/landlord/RoomForm";
import { createRoom } from "../../../../services/rooms";
import { getBuildings } from "../../../../services/buildings";
import { CreateRoomPayload } from "../../../../types/Room";
import { Building } from "../../../../types/Building";

export default function CreateRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra quyền landlord
  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.push("/");
      return;
    }
  }, [user, router]);

  // Load danh sách dãy
  useEffect(() => {
    const loadBuildings = async () => {
      if (!user?.userId) return;
      
      try {
        setLoadingBuildings(true);
        const res = await getBuildings();
        const list = Array.isArray(res) ? res : (res.buildings ?? []);
        setBuildings(list);
      } catch (err) {
        setError('Không thể tải danh sách dãy. Vui lòng thử lại.');
      } finally {
        setLoadingBuildings(false);
      }
    };

    if (user?.userId && user.role === "landlord") {
      loadBuildings();
    }
  }, [user?.userId, user?.role]);

  const handleSubmit = (data: CreateRoomPayload | Partial<CreateRoomPayload>) => {
    const payload = data as CreateRoomPayload;
    if (!payload?.buildingId) {
      setError("Vui lòng chọn dãy nhà hợp lệ.");
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setError(null);
        await createRoom(payload);
        // Redirect về trang quản lý dãy chứa phòng vừa tạo
        router.push(`/landlord/buildings/${payload.buildingId}`);
      } catch (err: any) {
        setError(err.message || "Có lỗi xảy ra khi tạo phòng. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    })();
  };

  const handleCancel = () => {
    // Redirect về trang quản lý dãy nếu có buildingId trong state
    // Hoặc về trang rooms nếu không có
    router.push("/landlord/rooms");
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

  if (loadingBuildings) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải danh sách dãy...</p>
        </div>
      </div>
    );
  }

  if (buildings.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Chưa có dãy nào</h1>
          <p className="text-gray-600 mb-4">Bạn cần tạo dãy trước khi thêm phòng.</p>
          <button
            onClick={() => router.push("/landlord/buildings/create")}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Tạo dãy đầu tiên
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo phòng mới</h1>
          <p className="text-gray-600">Thêm phòng mới vào dãy nhà</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <RoomForm
          buildings={buildings}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
}
