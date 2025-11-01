"use client";

import { useEffect, useState } from "react";
import { getMaintenanceFeeInvoices, MaintenanceFeeInvoice } from "@/services/landlordInvoices";
import { generateZaloPayQR, checkPaymentStatus, formatCurrency } from "@/services/payments";
import { useToast } from "@/contexts/ToastContext";
import { extractApiErrorMessage } from "@/utils/api";
import PaymentQR from "@/components/payments/PaymentQR";

interface MaintenanceFeePaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MaintenanceFeePaymentModal({ isOpen, onClose }: MaintenanceFeePaymentModalProps) {
  const { showSuccess, showError } = useToast();
  const [invoices, setInvoices] = useState<MaintenanceFeeInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInvoices();
    }
  }, [isOpen]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getMaintenanceFeeInvoices();
      // Đảm bảo chỉ lấy hóa đơn phí duy trì
      const maintenanceOnly = Array.isArray(data) 
        ? data.filter((inv: any) => inv.invoiceType === 'maintenance_fee')
        : [];
      setInvoices(maintenanceOnly);
    } catch (e: any) {
      showError("Không thể tải danh sách hóa đơn", extractApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handlePay = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
    setShowQR(true);
  };

  const handlePaymentSuccess = () => {
    setShowQR(false);
    setSelectedInvoiceId(null);
    loadInvoices();
    showSuccess("Thanh toán thành công", "Hóa đơn phí duy trì đã được thanh toán");
  };

  const pendingInvoices = invoices.filter((inv) => inv.status === 'pending' && inv.invoiceType === 'maintenance_fee');
  const paidInvoices = invoices.filter((inv) => inv.status === 'paid' && inv.invoiceType === 'maintenance_fee').slice(0, 5);

  if (!isOpen) return null;

  if (showQR && selectedInvoiceId) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          <PaymentQR
            invoiceId={selectedInvoiceId}
            onPaymentSuccess={handlePaymentSuccess}
            onClose={() => {
              setShowQR(false);
              setSelectedInvoiceId(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Thanh toán phí duy trì</h2>
            <p className="text-sm text-gray-500 mt-1">Hóa đơn phí duy trì hệ thống hàng tháng</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Đóng"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Đang tải...</p>
            </div>
          ) : (
            <>
              {/* Pending Invoices */}
              {pendingInvoices.length > 0 ? (
                <section>
                  <h3 className="font-medium text-gray-900 mb-3">Hóa đơn chờ thanh toán</h3>
                  <div className="space-y-3">
                    {pendingInvoices.map((inv) => (
                      <div key={inv.invoiceId} className="border rounded-lg p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{inv.description}</span>
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Chờ thanh toán</span>
                          </div>
                          <div className="text-sm text-gray-600 space-y-0.5">
                            <p>Hạn thanh toán: {new Date(inv.dueDate).toLocaleDateString('vi-VN')}</p>
                            <p>Tạo lúc: {new Date(inv.createdAt).toLocaleDateString('vi-VN')}</p>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <div className="text-xl font-semibold text-gray-900 mb-2">
                            {formatCurrency(inv.amount)}
                          </div>
                          <button
                            onClick={() => handlePay(inv.invoiceId)}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors text-sm"
                          >
                            Thanh toán ngay
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-600">Không có hóa đơn chờ thanh toán</p>
                </div>
              )}

              {/* Paid Invoices History */}
              {paidInvoices.length > 0 && (
                <section>
                  <h3 className="font-medium text-gray-900 mb-3">Lịch sử thanh toán</h3>
                  <div className="space-y-2">
                    {paidInvoices.map((inv) => (
                      <div key={inv.invoiceId} className="border rounded-lg p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-700">{inv.description}</span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs font-medium">Đã thanh toán</span>
                          </div>
                          {inv.paidDate && (
                            <p className="text-xs text-gray-500">Thanh toán: {new Date(inv.paidDate).toLocaleDateString('vi-VN')}</p>
                          )}
                        </div>
                        <div className="text-right ml-4">
                          <span className="font-medium text-gray-900">{formatCurrency(inv.amount)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

