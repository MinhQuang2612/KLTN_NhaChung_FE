"use client";

import { useState } from "react";
import ManualInvoiceForm from "@/components/landlord/ManualInvoiceForm";
import MaintenanceFeePaymentModal from "@/components/landlord/MaintenanceFeePaymentModal";
import Footer from "@/components/common/Footer";

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

        <ManualInvoiceForm onOpenMaintenanceModal={() => setShowMaintenanceModal(true)} />
      </div>

      <MaintenanceFeePaymentModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />

      <Footer />
    </div>
  );
}
