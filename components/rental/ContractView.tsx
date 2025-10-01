"use client";

import { useState, useEffect } from "react";
import { getUserContract, downloadContractPDF, formatContractStatus, calculateContractDaysLeft } from "@/services/rentalRequests";
import { formatCurrency, getContractPaymentStatus, RoomPaymentStatus } from "@/services/payments";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";
import PaymentQR from "@/components/payments/PaymentQR";

interface ContractViewProps {
  contractId: number;
}

export default function ContractView({ contractId }: ContractViewProps) {
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [contractPaymentStatus, setContractPaymentStatus] = useState<RoomPaymentStatus | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { showError, showSuccess } = useToast();

  useEffect(() => {
    loadContract();
  }, [contractId]);

  useEffect(() => {
    // Load contract payment status sau khi contract đã load xong
    if (contract) {
      loadContractPaymentStatus();
    }
  }, [contract]);

      const loadContract = async () => {
        try {
          setLoading(true);
          console.log('🔍 [DEBUG] Loading contract with ID:', contractId);
          const data = await getUserContract(contractId);
          setContract(data);
        } catch (error: any) {
          console.log('🔍 [DEBUG] Error loading contract:', error);
          let errorMessage = error.message || 'Không thể tải hợp đồng';
      
      // Xử lý các loại lỗi cụ thể
      if (error.status === 400) {
        if (error.body?.message?.includes('not authorized')) {
          errorMessage = 'Bạn không có quyền xem hợp đồng này. Vui lòng kiểm tra lại Contract ID hoặc liên hệ hỗ trợ.';
        } else {
          errorMessage = 'Hợp đồng không hợp lệ hoặc không tồn tại';
        }
      } else if (error.status === 404) {
        errorMessage = 'Không tìm thấy hợp đồng';
      } else if (error.status === 401) {
        errorMessage = 'Bạn không có quyền xem hợp đồng này';
      } else if (error.status === 403) {
        errorMessage = 'Bạn không có quyền truy cập hợp đồng này';
      }
      
      const message = ToastMessages.error.load('Hợp đồng');
      showError(message.title, errorMessage);
    } finally {
      setLoading(false);
        }
      };

      const loadContractPaymentStatus = async () => {
        try {
          const status = await getContractPaymentStatus(contractId);
          setContractPaymentStatus(status);
        } catch (error: any) {
          // Không hiển thị lỗi nếu không load được payment status
        }
      };


      const handlePayment = (invoice: any) => {
        setSelectedInvoice(invoice);
        setShowPaymentModal(true);
      };

      const handlePaymentSuccess = () => {
        setShowPaymentModal(false);
        setSelectedInvoice(null);
        loadContractPaymentStatus(); // Reload contract payment status after payment
        showSuccess('Thanh toán thành công!', 'Hóa đơn đã được thanh toán thành công');
      };


      const handleDownloadContract = async () => {
        try {
          setDownloading(true);
          const blob = await downloadContractPDF(contractId);
          
          // Tạo URL tạm thời để tải xuống
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `hop-dong-thue-${contractId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          const message = ToastMessages.success.download('Hợp đồng');
          showSuccess(message.title, message.message);
        } catch (error: any) {
          const message = ToastMessages.error.download('Hợp đồng');
          showError(message.title, error.message || message.message);
        } finally {
          setDownloading(false);
        }
      };


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không tìm thấy hợp đồng</p>
      </div>
    );
  }

  const daysLeft = calculateContractDaysLeft(contract.endDate);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Hợp đồng thuê phòng</h1>
              <p className="text-teal-100">Mã hợp đồng: {contract.contractId}</p>
            </div>
            <div className="text-right">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                contract.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {formatContractStatus(contract.status)}
              </span>
              {contract.status === 'active' && (
                <p className="text-teal-100 text-sm mt-1">
                  Còn {daysLeft} ngày
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Thông tin phòng */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin phòng</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Phòng:</strong> {contract.roomInfo.roomNumber}</p>
                <p><strong>Diện tích:</strong> {contract.roomInfo.area}m²</p>
                <p><strong>Sức chứa:</strong> {contract.roomInfo.currentOccupancy}/{contract.roomInfo.maxOccupancy} người</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin tài chính</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Tiền thuê/tháng:</strong> {formatCurrency(contract.monthlyRent)}</p>
                <p><strong>Tiền cọc:</strong> {formatCurrency(contract.deposit)}</p>
                <p><strong>Loại hợp đồng:</strong> {contract.contractType === 'single' ? 'Đơn lẻ' : 'Chung'}</p>
              </div>
            </div>
          </div>

          {/* Thời gian hợp đồng */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Thời gian hợp đồng</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Ngày bắt đầu:</strong> {formatDate(contract.startDate)}</p>
                <p><strong>Ngày kết thúc:</strong> {formatDate(contract.endDate)}</p>
              </div>
              <div>
                {contract.tenants.length > 0 && (
                  <>
                    <p><strong>Ngày chuyển vào:</strong> {formatDate(contract.tenants[0].moveInDate)}</p>
                    <p><strong>Trạng thái:</strong> {contract.tenants[0].status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin người thuê */}
          {contract.tenants.length > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin người thuê</h3>
              <div className="space-y-2 text-sm">
                <p><strong>ID người thuê:</strong> {contract.tenants[0].tenantId}</p>
                <p><strong>Tiền thuê cá nhân:</strong> {formatCurrency(contract.tenants[0].monthlyRent)}</p>
                <p><strong>Tiền cọc cá nhân:</strong> {formatCurrency(contract.tenants[0].deposit)}</p>
                <p><strong>Trạng thái:</strong> {contract.tenants[0].status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</p>
              </div>
            </div>
          )}

          {/* File hợp đồng */}
          {contract.contractFile && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">File hợp đồng</h3>
              <p className="text-sm text-gray-700">
                <strong>Tên file:</strong> {contract.contractFile}
              </p>
            </div>
          )}

          {/* Thông tin khác */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Thông tin khác</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <p><strong>Ngày tạo:</strong> {formatDate(contract.createdAt)}</p>
              <p><strong>ID hợp đồng:</strong> {contract.contractId}</p>
            </div>
          </div>

          {/* Trạng thái thanh toán đơn giản */}
          {contractPaymentStatus && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">💰 Trạng thái thanh toán</h3>
              
              {contractPaymentStatus.paymentStatus === 'fully_paid' ? (
                <div className="text-center py-4">
                  <div className="text-green-600 text-lg font-medium mb-2">✅ Đã thanh toán đầy đủ</div>
                  <p className="text-gray-600 text-sm">
                    Tất cả hóa đơn đã được thanh toán. Hợp đồng hoạt động bình thường.
                  </p>
                  <a href="/payments" className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block">
                    Xem lịch sử thanh toán
                  </a>
                </div>
              ) : contractPaymentStatus.latestInvoice ? (
                <div className="bg-white p-4 rounded-lg border">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium text-gray-900">Hóa đơn #{contractPaymentStatus.latestInvoice.invoiceId}</h4>
                      <p className="text-sm text-gray-600">
                        {contractPaymentStatus.latestInvoice.invoiceType} • {formatCurrency(contractPaymentStatus.latestInvoice.amount)}
                      </p>
                    </div>
                    <button
                      onClick={() => handlePayment(contractPaymentStatus.latestInvoice)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Thanh toán
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    Hạn thanh toán: {formatDate(contractPaymentStatus.latestInvoice.dueDate)}
                  </p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="text-gray-600 text-sm">Chưa có hóa đơn thanh toán</div>
                  <p className="text-xs text-gray-500 mt-1">Liên hệ chủ nhà để được tạo hóa đơn</p>
                </div>
              )}
            </div>
          )}


          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-200">
            {contract.status === 'active' && (
              <button
                onClick={handleDownloadContract}
                disabled={downloading}
                className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {downloading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang tải...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Tải hợp đồng PDF
                  </>
                )}
              </button>
            )}
            
            <a
              href="/my-rentals"
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại danh sách
            </a>
          </div>
        </div>

      </div>

      {/* Payment QR Modal */}
      {showPaymentModal && selectedInvoice && (
        <PaymentQR
          invoiceId={selectedInvoice.invoiceId}
          onPaymentSuccess={handlePaymentSuccess}
          onClose={() => {
            setShowPaymentModal(false);
            setSelectedInvoice(null);
          }}
        />
      )}
    </div>
  );
}
