"use client";

import { useEffect, useState } from "react";
import { getLandlordInvoices, LandlordInvoice } from "@/services/landlordInvoices";
import { getUserById } from "@/services/user";
import { getRoomById } from "@/services/rooms";
import { useToast } from "@/contexts/ToastContext";
import { extractApiErrorMessage } from "@/utils/api";
import { FaCheckCircle, FaClock, FaExclamationTriangle, FaTimesCircle, FaFileAlt, FaPhone, FaEnvelope } from "react-icons/fa";

export default function InvoiceHistory() {
  const { showError } = useToast();
  const [invoices, setInvoices] = useState<LandlordInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const data = await getLandlordInvoices();
      // Sắp xếp theo ngày tạo mới nhất
      const sorted = Array.isArray(data) 
        ? data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        : [];
      
      // Lấy thông tin khách hàng và phòng cho các invoice
      const invoicesWithInfo = await Promise.all(
        sorted.map(async (invoice) => {
          let updatedInvoice = { ...invoice };
          
          // Lấy thông tin khách hàng nếu có tenantId nhưng chưa có tenantPhone/tenantEmail
          if (invoice.tenantId && (!invoice.tenantPhone || !invoice.tenantEmail)) {
            try {
              const tenant = await getUserById(invoice.tenantId);
              updatedInvoice = {
                ...updatedInvoice,
                tenantPhone: (tenant as any)?.phone || (tenant as any)?.phoneNumber || invoice.tenantPhone,
                tenantEmail: (tenant as any)?.email || invoice.tenantEmail,
                tenantName: invoice.tenantName || (tenant as any)?.name || (tenant as any)?.fullName || invoice.tenantName,
              };
            } catch (err) {
              // Nếu không lấy được thông tin, giữ nguyên
            }
          }
          
          // Lấy mã phòng nếu có roomId nhưng chưa có roomNumber
          if (invoice.roomId && !invoice.roomNumber) {
            try {
              const room = await getRoomById(invoice.roomId);
              updatedInvoice = {
                ...updatedInvoice,
                roomNumber: (room as any)?.roomNumber || invoice.roomNumber,
                buildingName: invoice.buildingName || (room as any)?.building?.name || invoice.buildingName,
              };
            } catch (err) {
              // Nếu không lấy được thông tin, giữ nguyên
            }
          }
          
          return updatedInvoice;
        })
      );
      
      setInvoices(invoicesWithInfo);
    } catch (e: any) {
      showError("Không thể tải lịch sử hóa đơn", extractApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <FaClock className="h-4 w-4 text-yellow-600" />;
      case 'overdue':
        return <FaExclamationTriangle className="h-4 w-4 text-red-600" />;
      case 'cancelled':
        return <FaTimesCircle className="h-4 w-4 text-gray-600" />;
      case 'draft':
        return <FaFileAlt className="h-4 w-4 text-blue-600" />;
      default:
        return <FaClock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'draft':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        <span className="ml-2 text-slate-600">Đang tải lịch sử...</span>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <FaFileAlt className="h-12 w-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có hóa đơn nào</h3>
        <p className="text-gray-500">Các hóa đơn bạn tạo sẽ hiển thị tại đây.</p>
      </div>
    );
  }

  return (
    <div>
      {invoices.map((invoice, index) => (
        <div
          key={invoice.invoiceId}
          className={`py-5 px-6 ${index !== invoices.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50/50 transition-colors`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  Hóa đơn #{invoice.invoiceId}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                    invoice.status
                  )}`}
                >
                  {translateInvoiceStatus(invoice.status)}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Số tiền:</span>
                  <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)} đ</span>
                </div>
                {invoice.dueDate && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Hạn thanh toán:</span>
                      <span className="font-medium text-gray-900">{formatDate(invoice.dueDate)}</span>
                    </div>
                  </>
                )}
                {invoice.roomNumber && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Mã phòng:</span>
                      <span className="font-medium text-gray-900">{invoice.roomNumber}</span>
                    </div>
                  </>
                )}
                {invoice.buildingName && (
                  <>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Tòa nhà:</span>
                      <span className="font-medium text-gray-900">{invoice.buildingName}</span>
                    </div>
                  </>
                )}
              </div>

              {(invoice.tenantName || invoice.tenantPhone || invoice.tenantEmail) && (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-3">
                  {invoice.tenantName && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Khách thuê:</span>
                      <span className="font-medium text-gray-900">{invoice.tenantName}</span>
                    </div>
                  )}
                  {invoice.tenantPhone && (
                    <>
                      {invoice.tenantName && <span className="text-gray-300">|</span>}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">SĐT:</span>
                        <span className="font-medium text-gray-900">{invoice.tenantPhone}</span>
                      </div>
                    </>
                  )}
                  {invoice.tenantEmail && (
                    <>
                      {(invoice.tenantName || invoice.tenantPhone) && <span className="text-gray-300">|</span>}
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium text-gray-900">{invoice.tenantEmail}</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {invoice.description && (
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <span className="font-bold text-blue-900 text-sm">Mô tả: </span>
                  <span className="text-blue-800 text-sm">{invoice.description}</span>
                </div>
              )}

              {invoice.items && invoice.items.length > 0 && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Chi tiết các khoản:</p>
                  <ul className="space-y-1">
                    {invoice.items.map((item, i) => (
                      <li key={i} className="flex justify-between text-sm text-gray-700">
                        <span>{item.description}</span>
                        <span className="font-medium">{formatCurrency(item.amount)} đ</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            <span className="text-sm text-gray-500">
              {invoice.status === 'paid' && invoice.paidDate
                ? `Đã thanh toán: ${formatDate(invoice.paidDate)}`
                : invoice.createdAt
                  ? `Tạo lúc: ${formatDate(invoice.createdAt)}`
                  : ''}
            </span>
            {invoice.paymentMethod && invoice.status === 'paid' && (
              <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                Phương thức: {invoice.paymentMethod}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function translateInvoiceStatus(status: string): string {
  const map: Record<string, string> = {
    pending: "Chờ thanh toán",
    paid: "Đã thanh toán",
    overdue: "Quá hạn",
    cancelled: "Đã hủy",
    draft: "Nháp",
  };
  return map[status] || status;
}

