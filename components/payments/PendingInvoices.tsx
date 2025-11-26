"use client";

import { useState, useEffect } from "react";
import { 
  getPendingInvoices,
  getPaidInvoices,
  formatInvoiceType, 
  formatPaymentStatus, 
  formatCurrency,
  isInvoiceOverdue,
  calculateOverdueDays,
  Invoice,
  PaidInvoice
} from "@/services/payments";
import { getRoomById } from "@/services/rooms";
import PaymentQR from "./PaymentQR";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";
import { useAuth } from "@/contexts/AuthContext";
import { FaExclamationTriangle } from "react-icons/fa";

// Extended invoice type để bao gồm cả pending và paid
type ExtendedInvoice = (Invoice | (PaidInvoice & { status: 'paid'; dueDate?: string; isQrGenerated?: boolean; canPay?: boolean })) & {
  status?: 'pending' | 'paid' | 'overdue';
  paidDate?: string;
  paymentMethod?: string;
};

export default function PendingInvoices() {
  const [invoices, setInvoices] = useState<ExtendedInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<ExtendedInvoice | null>(null);
  const { showError, showSuccess } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Chỉ gọi API khi user đã có và component đã mount
    if (user?.userId) {
      loadInvoices();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      
      // Gọi cả pending và paid invoices
      const [pendingData, paidData] = await Promise.all([
        getPendingInvoices(),
        getPaidInvoices()
      ]);
      
      // Merge và normalize dữ liệu
      const allInvoices: ExtendedInvoice[] = [];
      
      // Thêm pending invoices
      if (Array.isArray(pendingData) && pendingData.length > 0) {
        pendingData.forEach((inv: any) => {
          allInvoices.push({
            ...inv,
            status: isInvoiceOverdue(inv.dueDate) ? 'overdue' : 'pending',
          });
        });
      }
      
      // Thêm paid invoices
      if (Array.isArray(paidData) && paidData.length > 0) {
        paidData.forEach((inv: any) => {
          allInvoices.push({
            invoiceId: inv.invoiceId,
            amount: inv.amount,
            invoiceType: inv.invoiceType,
            roomNumber: inv.roomNumber,
            roomId: (inv as any).roomId,
            contractId: (inv as any).contractId,
            description: inv.description,
            createdAt: inv.paidDate || (inv as any).createdAt,
            dueDate: (inv as any).dueDate,
            paidDate: inv.paidDate,
            paymentMethod: inv.paymentMethod,
            status: 'paid',
            isQrGenerated: false,
            canPay: false,
            items: inv.items || [],
          });
        });
      }
      
      if (allInvoices.length === 0) {
        setInvoices([]);
        setLoading(false);
        return;
      }
      
      // Bổ sung thông tin phòng/tòa/loại phòng từ roomId
      const roomIdToInfo: Record<number, { roomNumber?: string; buildingName?: string; category?: string }> = {};
      const contractIdToRoomId: Record<number, number> = {};
      
      // Tập hợp tất cả roomIds từ invoice
      const allRoomIds = new Set<number>();
      const contractIdsToFetch = new Set<number>();
      
      allInvoices.forEach((inv: any) => {
        if (inv.roomId) {
          allRoomIds.add(inv.roomId);
        } else if (inv.contractId && !inv.roomId) {
          // Nếu không có roomId nhưng có contractId, fetch contract để lấy roomId
          contractIdsToFetch.add(inv.contractId);
        }
      });
      
      // Fetch roomId từ contractId nếu cần
      if (contractIdsToFetch.size > 0) {
        const { getUserContract } = await import('@/services/rentalRequests');
        await Promise.all(Array.from(contractIdsToFetch).map(async (contractId) => {
          try {
            const contract = await getUserContract(Number(contractId));
            if (contract?.roomId) {
              contractIdToRoomId[Number(contractId)] = contract.roomId;
              allRoomIds.add(contract.roomId);
            }
          } catch (err) {
            // Silently fail if contract fetch fails
          }
        }));
      }
      
      // Fetch thông tin phòng
      if (allRoomIds.size > 0) {
        await Promise.all(Array.from(allRoomIds).map(async (roomId) => {
          try {
            const room = await getRoomById(Number(roomId));
            roomIdToInfo[Number(roomId)] = {
              roomNumber: room?.roomNumber,
              buildingName: (room as any)?.building?.name,
              category: (room as any)?.category
            };
          } catch (err) {
            // Silently fail if room fetch fails
          }
        }));
      }

      // Augment invoice với thông tin phòng
      const augmented = allInvoices.map((inv: any) => {
        // Lấy roomId từ invoice hoặc từ contractId mapping
        const finalRoomId = inv.roomId || (inv.contractId ? contractIdToRoomId[inv.contractId] : null);
        const roomInfo = finalRoomId ? roomIdToInfo[finalRoomId] : null;
        
        return {
          ...inv,
          roomId: finalRoomId || inv.roomId, // Đảm bảo có roomId
          roomNumber: inv.roomNumber && inv.roomNumber !== 'N/A' ? inv.roomNumber : (roomInfo?.roomNumber || inv.roomNumber),
          buildingName: roomInfo?.buildingName,
          roomCategory: roomInfo?.category,
        };
      });
      
      // Sắp xếp: pending/overdue trước, paid sau, và theo ngày tạo mới nhất
      augmented.sort((a, b) => {
        // Pending/overdue trước paid
        if (a.status === 'paid' && b.status !== 'paid') return 1;
        if (a.status !== 'paid' && b.status === 'paid') return -1;
        // Sắp xếp theo ngày tạo (mới nhất trước)
        const dateA = new Date(a.createdAt || a.paidDate || 0).getTime();
        const dateB = new Date(b.createdAt || b.paidDate || 0).getTime();
        return dateB - dateA;
      });
      
      setInvoices(augmented);
    } catch (error: any) {
      const message = ToastMessages.error.load('Danh sách hóa đơn');
      showError(message.title, error?.message || error?.body?.message || message.message);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedInvoice(null);
    loadInvoices(); // Reload invoices after successful payment
    const message = ToastMessages.success.process('Hóa đơn');
    showSuccess(message.title, message.message);
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

  const getInvoiceStatusColor = (invoice: ExtendedInvoice) => {
    if (invoice.status === 'paid') {
      return 'bg-green-100 text-green-800 border-green-200';
    }
    if (invoice.status === 'overdue' || (invoice.dueDate && isInvoiceOverdue(invoice as Invoice))) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getInvoiceStatusText = (invoice: ExtendedInvoice) => {
    if (invoice.status === 'paid') {
      return 'Đã thanh toán';
    }
    if (invoice.status === 'overdue' || (invoice.dueDate && isInvoiceOverdue(invoice as Invoice))) {
      const overdueDays = invoice.dueDate ? calculateOverdueDays(invoice as Invoice) : 0;
      return `Quá hạn ${overdueDays} ngày`;
    }
    return 'Chờ thanh toán';
  };

  const formatRoomCategory = (category?: string) => {
    if (!category) return undefined;
    const map: Record<string, string> = {
      'phong-tro': 'Phòng trọ',
      'chung-cu': 'Chung cư',
      'nha-nguyen-can': 'Nhà nguyên căn',
    };
    return map[category] || category
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-24 h-24 mx-auto mb-4 text-gray-300">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Không có hóa đơn nào</h3>
        <p className="text-gray-500">Bạn chưa có hóa đơn nào cần thanh toán</p>
      </div>
    );
  }

  return (
    <div>
      {invoices.map((invoice, index) => (
        <div 
          key={invoice.invoiceId} 
          className={`py-5 px-4 ${index !== invoices.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50/50 transition-colors`}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Hóa đơn #{invoice.invoiceId}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getInvoiceStatusColor(invoice)}`}>
                      {getInvoiceStatusText(invoice)}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Loại:</span>
                      <span className="font-medium text-gray-900">{formatInvoiceType(invoice.invoiceType as any)}</span>
                    </div>
                    <span className="text-gray-300">|</span>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(invoice.amount)}</span>
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
                  </div>
                  {(invoice.roomNumber && invoice.roomNumber !== 'N/A') || (invoice as any).roomCategory ? (
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm mb-3">
                      {invoice.roomNumber && invoice.roomNumber !== 'N/A' && (
                        <>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Phòng:</span>
                            <span className="font-medium text-gray-900">{invoice.roomNumber}</span>
                          </div>
                          {(invoice as any).roomCategory && <span className="text-gray-300">|</span>}
                        </>
                      )}
                      {(invoice as any).roomCategory && (
                        <div className="flex items-center gap-2">
                          <span className="text-gray-600">Loại phòng:</span>
                          <span className="font-medium text-gray-900">{formatRoomCategory((invoice as any).roomCategory)}</span>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {invoice.description && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <span className="font-bold text-blue-900 text-sm">Mô tả: </span>
                      <span className="text-blue-800 text-sm">{invoice.description}</span>
                    </div>
                  )}

                  {invoice.status !== 'paid' && invoice.dueDate && isInvoiceOverdue(invoice as Invoice) && (
                    <div className="mb-3 p-3 bg-red-50 rounded-lg border border-red-200 text-sm">
                      <span className="font-medium text-red-900 inline-flex items-center gap-2">
                        <FaExclamationTriangle className="h-4 w-4" />
                        Quá hạn thanh toán:
                      </span>
                      <span className="text-red-800">
                        Hóa đơn này đã quá hạn {calculateOverdueDays(invoice as Invoice)} ngày. 
                        Vui lòng thanh toán sớm để tránh phí phạt.
                      </span>
                    </div>
                  )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
                <span className="text-sm text-gray-500">
                  {invoice.status === 'paid' && invoice.paidDate 
                    ? `Đã thanh toán: ${formatDate(invoice.paidDate)}`
                    : (invoice as any).createdAt 
                      ? `Tạo lúc: ${formatDate((invoice as any).createdAt)}`
                      : invoice.paidDate 
                        ? `Đã thanh toán: ${formatDate(invoice.paidDate)}`
                        : ''
                  }
                </span>
                {invoice.status !== 'paid' && invoice.canPay && (
                  <button
                    onClick={() => setSelectedInvoice(invoice)}
                    className="px-4 py-2 text-sm text-white bg-teal-600 hover:bg-teal-700 font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Thanh toán
                  </button>
                )}
                {invoice.status === 'paid' && invoice.paymentMethod && (
                  <span className="px-4 py-2 text-sm text-gray-500 bg-gray-100 rounded-lg">
                    Không thể thanh toán
                  </span>
                )}
          </div>
        </div>
      ))}

      {/* Payment QR Modal */}
      {selectedInvoice && (
        <PaymentQR
          invoiceId={selectedInvoice.invoiceId}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => setSelectedInvoice(null)}
        />
      )}
    </div>
  );
}