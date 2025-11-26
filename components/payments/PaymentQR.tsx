"use client";

import { useState } from "react";
import { generateZaloPayQR, checkPaymentStatus, formatCurrency } from "@/services/payments";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";

interface PaymentQRProps {
  invoiceId: number;
  onPaymentSuccess?: () => void;
  onClose: () => void;
}

export default function PaymentQR({ 
  invoiceId, 
  onPaymentSuccess,
  onClose 
}: PaymentQRProps) {
  const [qrData, setQrData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const { showSuccess, showError, showInfo } = useToast();

  const handleGenerateQR = async () => {
    setLoading(true);
    
    try {
      const result = await generateZaloPayQR(invoiceId);
      
      // Theo hướng dẫn mới - response trực tiếp, không có wrapper
      if (result.orderId && result.qrCodeUrl) {
        setQrData(result);
        const message = ToastMessages.success.create('Mã QR');
        showSuccess(message.title, message.message + '. Quét mã QR để thanh toán qua ZaloPay');
      } else {
        const message = ToastMessages.error.create('Mã QR');
        showError(message.title, message.message);
      }
    } catch (error: any) {
      const message = ToastMessages.error.network();
      showError(message.title, error.message || message.message);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatusHandler = async () => {
    if (!qrData?.orderId) return;

    setCheckingStatus(true);
    
    try {
      const result = await checkPaymentStatus(qrData.orderId);
      
      if (result.status === 'paid') {
        const message = ToastMessages.success.process('Thanh toán');
        showSuccess(message.title, message.message + ', cảm ơn bạn!');
        onPaymentSuccess?.();
      } else if (result.status === 'failed') {
        showError('Thanh toán thất bại!', result.errorMessage || 'Giao dịch không thành công, vui lòng thử lại');
      } else {
        const message = ToastMessages.info.pending('Thanh toán');
        showInfo(message.title, message.message + '. Vui lòng quét mã QR để hoàn tất');
      }
    } catch (error: any) {
      const message = ToastMessages.error.network();
      showError('Kiểm tra thanh toán thất bại!', error.message || message.message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Thanh toán qua ZaloPay</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Thông tin thanh toán */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Thông tin thanh toán</h3>
            <div className="space-y-1 text-sm">
              <p><strong>Hóa đơn #:</strong> {invoiceId}</p>
              {qrData && (
                <>
                  <p><strong>Số tiền:</strong> <span className="text-lg font-bold text-green-600">{formatCurrency(qrData.amount)}</span></p>
                  <p><strong>Mã đơn hàng:</strong> {qrData.orderId}</p>
                </>
              )}
            </div>
          </div>

          {!qrData ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 text-teal-600">
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tạo mã QR thanh toán</h3>
              <p className="text-gray-600 mb-6">Nhấn nút bên dưới để tạo mã QR thanh toán qua ZaloPay</p>
              
              <button
                onClick={handleGenerateQR}
                disabled={loading}
                className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Đang tạo...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    Tạo mã QR thanh toán
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quét mã QR để thanh toán</h3>
                <div className="inline-block p-4 bg-white border-2 border-gray-200 rounded-lg">
                  <img 
                    src={qrData.qrCodeUrl}
                    alt="Payment QR Code" 
                    className="w-64 h-64 mx-auto"
                  />
                </div>
              </div>

              {/* Thông tin giao dịch */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Thông tin giao dịch</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã giao dịch:</span>
                    <span className="font-mono text-gray-900">{qrData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className="font-bold text-green-600">Chờ thanh toán</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Số tiền:</span>
                    <span className="text-blue-600 font-semibold">{formatCurrency(qrData.amount)}</span>
                  </div>
                </div>
              </div>

              {/* Hướng dẫn thanh toán */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">📱 Hướng dẫn thanh toán</h4>
                <ol className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                    <span>Mở ứng dụng ZaloPay</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                    <span>Quét mã QR bên trên</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                    <span>Xác nhận thông tin thanh toán</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">4</span>
                    <span>Nhập mật khẩu để hoàn tất</span>
                  </li>
                </ol>
                <p className="text-xs text-gray-600 mt-3">
                  💡 Nếu ZaloPay không quét được, vui lòng chuyển khoản thủ công theo thông tin trong QR code.
                </p>
                
                {/* Link mở ZaloPay trực tiếp */}
                <div className="text-center mt-4">
                  <a
                    href={qrData.qrCodeData}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Mở ZaloPay App
                  </a>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={checkPaymentStatusHandler}
                  disabled={checkingStatus}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {checkingStatus ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Đang kiểm tra...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Kiểm tra trạng thái
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}