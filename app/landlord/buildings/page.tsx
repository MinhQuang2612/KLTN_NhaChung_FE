"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import Footer from "../../../components/common/Footer";
import BuildingsContent from "../../../components/landlord/BuildingsContent";
import { getBuildings } from "../../../services/buildings";
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
      
      const response = await getBuildings(page, 10, search);
      setBuildings(response.buildings);
      setTotalPages(Math.ceil(response.total / 10));
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
  }, [user?.userId, user?.role]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    loadBuildings(1, query);
  };

  const handlePageChange = (page: number) => {
    loadBuildings(page, searchQuery);
  };

  const handleCreateBuilding = () => {
    router.push("/landlord/buildings/create");
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

      <Footer />
    </div>
  );
}
