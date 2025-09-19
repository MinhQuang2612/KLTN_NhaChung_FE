"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext";
import Footer from "../../../../components/common/Footer";
import BuildingForm from "../../../../components/landlord/BuildingForm";
import { createBuilding } from "../../../../services/buildings";
import { CreateBuildingPayload } from "../../../../types/Building";

export default function CreateBuildingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Kiểm tra quyền landlord
  useEffect(() => {
    if (user && user.role !== "landlord") {
      router.push("/");
      return;
    }
  }, [user, router]);

  const handleSubmit = async (data: CreateBuildingPayload) => {
    try {
      setLoading(true);
      setError(null);
      
      await createBuilding(data);
      router.push("/landlord/buildings");
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi tạo dãy. Vui lòng thử lại.");
    } finally {
      setLoading(false);
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo dãy mới</h1>
          <p className="text-gray-600">Thêm dãy nhà mới vào hệ thống quản lý</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        <BuildingForm
          onSubmit={(data) => {
            handleSubmit(data as CreateBuildingPayload);
          }}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>

      <Footer />
    </div>
  );
}
