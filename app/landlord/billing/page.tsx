"use client";

import { useState } from "react";
import ManualInvoiceForm from "@/components/landlord/ManualInvoiceForm";
import MaintenanceFeePaymentModal from "@/components/landlord/MaintenanceFeePaymentModal";
import Footer from "@/components/common/Footer";

export default function BillingPage() {
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-700">
      <div className="max-w-5xl mx-auto p-6 md:p-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-2">Tính tiền</h1>
            <p className="text-gray-600">Tạo hoá đơn thủ công theo hợp đồng, theo hướng dẫn tích hợp.</p>
          </div>
          <button
            onClick={() => setShowMaintenanceModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Thanh toán phí duy trì
          </button>
        </div>
        <ManualInvoiceForm />
      </div>

      <MaintenanceFeePaymentModal
        isOpen={showMaintenanceModal}
        onClose={() => setShowMaintenanceModal(false)}
      />

      <Footer />
    </div>
  );
}


