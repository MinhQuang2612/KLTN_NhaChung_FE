"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Footer from "../../../components/common/Footer";
import RoomsContent from "../../../components/landlord/RoomsContent";
import { getRooms } from "../../../services/rooms";
import { getBuildings } from "../../../services/buildings";
import { Room, RoomListParams } from "../../../types/Room";
import { Building } from "../../../types/Building";

export default function RoomsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState<number | undefined>();

  // Kiểm tra quyền landlord
  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.push("/");
      return;
    }
  }, [user, router]);

  // Load danh sách dãy để filter
  const loadBuildings = async () => {
    if (!user?.userId) return;
    
    try {
      const response = await getBuildings(1, 100); // Load tất cả dãy
      setBuildings(response.buildings);
    } catch (err) {
      console.error('Error loading buildings:', err);
    }
  };

  // Load danh sách phòng
  const loadRooms = async (page: number = 1, search?: string, buildingId?: number) => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const params: RoomListParams = {
        page,
        limit: 10,
        search,
        buildingId
      };
      
      const response = await getRooms(params);
      setRooms(response.rooms);
      setTotalPages(Math.ceil(response.total / 10));
      setCurrentPage(page);
    } catch (err: any) {
      setError('Không thể tải danh sách phòng. Vui lòng thử lại.');
      console.error('Error loading rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId && user.role === "landlord") {
      loadBuildings();
      loadRooms(1, searchQuery, selectedBuildingId);
    }
  }, [user?.userId, user?.role]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadRooms(1, query, selectedBuildingId);
  };

  const handleBuildingFilter = (buildingId: number | undefined) => {
    setSelectedBuildingId(buildingId);
    loadRooms(1, searchQuery, buildingId);
  };

  const handlePageChange = (page: number) => {
    loadRooms(page, searchQuery, selectedBuildingId);
  };

  const handleCreateRoom = () => {
    router.push("/landlord/rooms/create");
  };

  const handleEditRoom = (id: number) => {
    router.push(`/landlord/rooms/${id}/edit`);
  };

  const handleViewRoom = (id: number) => {
    router.push(`/landlord/rooms/${id}`);
  };

  const handleDeleteRoom = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa phòng này?")) {
      try {
        // TODO: Implement delete room
        console.log("Delete room:", id);
        // Refresh list after delete
        loadRooms(currentPage, searchQuery, selectedBuildingId);
      } catch (error) {
        console.error("Error deleting room:", error);
      }
    }
  };

  const handleRefresh = () => {
    loadRooms(currentPage, searchQuery, selectedBuildingId);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý phòng</h1>
              <p className="text-gray-600">Quản lý các phòng trong dãy của bạn</p>
            </div>
            <button
              onClick={handleCreateRoom}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Thêm phòng mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách phòng...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => loadRooms(currentPage, searchQuery, selectedBuildingId)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <RoomsContent
            rooms={rooms}
            buildings={buildings}
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            selectedBuildingId={selectedBuildingId}
            onSearch={handleSearch}
            onBuildingFilter={handleBuildingFilter}
            onPageChange={handlePageChange}
            onCreate={handleCreateRoom}
            onEdit={handleEditRoom}
            onView={handleViewRoom}
            onDelete={handleDeleteRoom}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
