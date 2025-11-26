"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../../contexts/AuthContext";
import Footer from "../../../../../components/common/Footer";
import BuildingForm from "../../../../../components/landlord/BuildingForm";
import { getBuildingById, updateBuilding } from "../../../../../services/buildings";
import { Building, UpdateBuildingPayload } from "../../../../../types/Building";

export default function EditBuildingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const buildingId = parseInt(params.id as string);
  
  const [building, setBuilding] = useState<Building | null>(null);
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

  // Load building data
  useEffect(() => {
    const loadBuilding = async () => {
      if (!user?.userId || !buildingId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const data = await getBuildingById(buildingId);
        setBuilding(data);
      } catch (err: any) {
        setError(err.message || "Không thể tải thông tin dãy. Vui lòng thử lại.");
      } finally {
        setLoading(false);
      }
    };

    if (user?.userId && user.role === "landlord") {
      loadBuilding();
    }
  }, [user?.userId, user?.role, buildingId]);

  const handleSubmit = async (data: UpdateBuildingPayload) => {
    try {
      setSubmitting(true);
      setError(null);
      
      await updateBuilding(buildingId, data);
      router.push("/landlord/buildings");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi cập nhật dãy. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/landlord/buildings");
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
          <p className="text-gray-600">Đang tải thông tin dãy...</p>
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
            onClick={() => router.push("/landlord/buildings")}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }

  if (!building) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Không tìm thấy dãy</h1>
          <p className="text-gray-600 mb-4">Dãy bạn đang tìm kiếm không tồn tại.</p>
          <button
            onClick={() => router.push("/landlord/buildings")}
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Chỉnh sửa dãy</h1>
          <p className="text-gray-600">Cập nhật thông tin dãy {building.name}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <BuildingForm
          initialData={building}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={submitting}
        />
      </div>

      <Footer />
    </div>
  );
}
