"use client";

import { Suspense, useState } from "react";
import ManualInvoiceForm from "@/components/landlord/ManualInvoiceForm";
import MaintenanceFeePaymentModal from "@/components/landlord/MaintenanceFeePaymentModal";

export default function BillingPage() {
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Tính tiền</h1>
          <p className="text-gray-600 mt-2">Tạo hóa đơn và xem lịch sử tính tiền</p>
        </div>

        <Suspense fallback={<div className="text-center py-8">Đang tải...</div>}>
          <ManualInvoiceForm onOpenMaintenanceModal={() => setShowMaintenanceModal(true)} />
        </Suspense>
      </div>

      <MaintenanceFeePaymentModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />
    </div>
  );
}
