"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Footer from "../../../components/common/Footer";
import BuildingsContent from "../../../components/landlord/BuildingsContent";
import BuildingForm from "../../../components/landlord/BuildingForm";
import { getBuildings, createBuilding } from "../../../services/buildings";
import { Building } from "../../../types/Building";

export default function BuildingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // Kiểm tra quyền landlord
  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.push("/");
      return;
    }
  }, [user, router]);

  // Load danh sách dãy
  const loadBuildings = async (page: number = 1, search?: string) => {
    if (!user?.userId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const res = await getBuildings();
      // Hỗ trợ cả 2 format trả về từ service
      if (Array.isArray(res)) {
        setBuildings(res);
        setTotalPages(1);
      } else {
        setBuildings(res.buildings || []);
        setTotalPages(Math.max(1, Math.ceil((res.total ?? 0) / 10)));
      }
      setCurrentPage(page);
    } catch (err: any) {
      setError('Không thể tải danh sách dãy. Vui lòng thử lại.');
      console.error('Error loading buildings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.userId && user.role === "landlord") {
      loadBuildings(1, searchQuery);
    }
  }, [user?.userId, user?.role, searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadBuildings(1, query);
  };

  const handlePageChange = (page: number) => {
    loadBuildings(page, searchQuery);
  };

  const handleCreateBuilding = () => {
    setShowCreate(true);
  };

  const handleEditBuilding = (id: number) => {
    router.push(`/landlord/buildings/${id}/edit`);
  };

  const handleViewBuilding = (id: number) => {
    router.push(`/landlord/buildings/${id}`);
  };

  const handleDeleteBuilding = async (id: number) => {
    if (confirm("Bạn có chắc chắn muốn xóa dãy này?")) {
      try {
        // TODO: Implement delete building
        console.log("Delete building:", id);
        // Refresh list after delete
        loadBuildings(currentPage, searchQuery);
      } catch (error) {
        console.error("Error deleting building:", error);
      }
    }
  };

  const handleRefresh = () => {
    loadBuildings(currentPage, searchQuery);
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
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý dãy</h1>
              <p className="text-gray-600">Quản lý các dãy nhà của bạn</p>
            </div>
            <button
              onClick={handleCreateBuilding}
              className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
            >
              <span className="text-lg">+</span>
              Thêm dãy mới
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải danh sách dãy...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button 
              onClick={() => loadBuildings(currentPage, searchQuery)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <BuildingsContent
            buildings={buildings}
            currentPage={currentPage}
            totalPages={totalPages}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onCreate={handleCreateBuilding}
            onEdit={handleEditBuilding}
            onView={handleViewBuilding}
            onDelete={handleDeleteBuilding}
            onRefresh={handleRefresh}
          />
        )}
      </div>

      {/* Create Modal inline: hiển thị trực tiếp form, không khung bao ngoài */}
      {showCreate && (
        <div className="fixed inset-0 z-[100]">
          <div className="absolute inset-0 bg-black/40 z-0" onClick={() => setShowCreate(false)} />
          <button
            onClick={() => setShowCreate(false)}
            aria-label="Đóng"
            className="absolute top-4 right-4 h-9 w-9 grid place-items-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white z-10"
            title="Đóng"
          >
            ×
          </button>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            {/* Render form trực tiếp, bản thân form đã có khung/tiêu đề riêng */}
            <div className="max-w-5xl w-full max-h-[92vh] overflow-auto relative z-10">
              <BuildingForm
                onSubmit={async (data) => {
                  try {
                    setLoading(true);
                    await createBuilding(data as any);
                    setShowCreate(false);
                    await loadBuildings(currentPage, searchQuery);
                  } catch (err) {
                    console.error(err);
                    setError("Không thể tạo dãy. Vui lòng thử lại.");
                  } finally {
                    setLoading(false);
                  }
                }}
                onCancel={() => setShowCreate(false)}
                loading={loading}
              />
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
