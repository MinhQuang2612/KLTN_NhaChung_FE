"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import MyRentalRequests from "@/components/rental/MyRentalRequests";
import PendingInvoices from "@/components/payments/PendingInvoices";
import MySharingRequests from "@/components/room_sharing/MySharingRequests";
import UserASharingRequests from "@/components/room_sharing/UserASharingRequests";

function MyRentalsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const [activeTab, setActiveTab] = useState<'requests' | 'invoices' | 'my-sharing' | 'pending-sharing'>('requests');
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (tabParam === 'invoices') {
      setActiveTab('invoices');
    }
  }, [tabParam]);

  // Hiển thị loading khi AuthContext đang khởi tạo
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Chỉ hiển thị "Vui lòng đăng nhập" khi AuthContext đã load xong và user thực sự null
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Vui lòng đăng nhập</h1>
          <a 
            href="/login" 
            className="inline-block px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 transition-colors"
          >
            Đăng nhập ngay
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quản lý thuê phòng</h1>
          <p className="text-gray-600">Xem và quản lý các yêu cầu thuê phòng, hóa đơn thanh toán và yêu cầu ở ghép</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Đăng ký thuê
              </button>
              <button
                onClick={() => setActiveTab('invoices')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'invoices'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Hóa đơn thanh toán
              </button>
              <button
                onClick={() => setActiveTab('my-sharing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'my-sharing'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Yêu cầu ở ghép của tôi
              </button>
              <button
                onClick={() => setActiveTab('pending-sharing')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'pending-sharing'
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Yêu cầu chờ tôi duyệt
              </button>
            </nav>
          </div>

          <div className={`${activeTab === 'requests' || activeTab === 'my-sharing' || activeTab === 'invoices' || activeTab === 'pending-sharing' ? 'px-4 pb-6 pt-0' : 'p-6'}`}>
            {activeTab === 'requests' && <MyRentalRequests key="requests" />}
            {activeTab === 'invoices' && <PendingInvoices key="invoices" />}
            {activeTab === 'my-sharing' && <MySharingRequests key="my-sharing" />}
            {activeTab === 'pending-sharing' && <UserASharingRequests key="pending-sharing" />}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MyRentalsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải...</p>
        </div>
      </div>
    }>
      <MyRentalsContent />
    </Suspense>
  );
}
