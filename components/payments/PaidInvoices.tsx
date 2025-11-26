"use client";

import { useState, useEffect } from "react";
import { getPaidInvoices, PaidInvoice, formatCurrency } from "@/services/payments";
import { FaCheckCircle } from "react-icons/fa";

export default function PaidInvoices() {
  const [invoices, setInvoices] = useState<PaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPaidInvoices();
  }, []);

  const loadPaidInvoices = async () => {
    try {
      setLoading(true);
      const paidInvoices = await getPaidInvoices();
      setInvoices(paidInvoices);
    } catch (error: any) {
      setError(error.message || "Không thể tải danh sách hóa đơn đã thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getInvoiceTypeText = (type: string) => {
    switch (type) {
      case 'initial_payment':
        return 'Thanh toán đầu tiên';
      case 'monthly_rent':
        return 'Tiền thuê hàng tháng';
      case 'deposit':
        return 'Tiền cọc';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-gray-600">Đang tải hóa đơn...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={loadPaidInvoices}
              className="mt-2 text-sm text-red-600 hover:text-red-500 underline"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có hóa đơn đã thanh toán</h3>
        <p className="mt-1 text-sm text-gray-500">Bạn chưa có hóa đơn nào đã được thanh toán.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{invoices.length}</div>
            <div className="text-sm text-gray-500">Tổng hóa đơn đã thanh toán</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(invoices.reduce((sum, invoice) => sum + invoice.amount, 0))}
            </div>
            <div className="text-sm text-gray-500">Tổng số tiền đã thanh toán</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {invoices.filter(invoice => invoice.invoiceType === 'monthly_rent').length}
            </div>
            <div className="text-sm text-gray-500">Hóa đơn tiền thuê</div>
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {invoices.map((invoice) => (
          <div key={invoice.invoiceId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Hóa đơn #{invoice.invoiceId}
                    </h3>
                    <span className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <FaCheckCircle className="h-3.5 w-3.5" />
                      Đã thanh toán
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Loại hóa đơn</p>
                      <p className="font-medium text-gray-900">{getInvoiceTypeText(invoice.invoiceType)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Số tiền</p>
                      <p className="font-bold text-green-600 text-lg">{formatCurrency(invoice.amount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phòng</p>
                      <p className="font-medium text-gray-900">{invoice.roomNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phương thức thanh toán</p>
                      <p className="font-medium text-gray-900 capitalize">{invoice.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ngày thanh toán</p>
                      <p className="font-medium text-gray-900">{formatDate(invoice.paidDate)}</p>
                    </div>
                  </div>

                  {invoice.description && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Mô tả</p>
                      <p className="text-gray-900">{invoice.description}</p>
                    </div>
                  )}

                  {/* Invoice Items */}
                  {invoice.items && invoice.items.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Chi tiết hóa đơn</p>
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="space-y-2">
                          {invoice.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-700">{item.description}</span>
                              <span className="text-sm font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-900">Tổng cộng</span>
                            <span className="font-bold text-lg text-green-600">{formatCurrency(invoice.amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
