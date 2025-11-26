"use client";

import { useState } from "react";
import { checkPaymentStatus, formatPaymentStatus } from "@/services/payments";
import { PaymentStatus as PaymentStatusType } from "@/services/payments";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";
import {
  FaCheckCircle,
  FaHourglassHalf,
  FaTimesCircle,
  FaBan,
  FaQuestionCircle,
  FaExclamationTriangle,
} from "react-icons/fa";

interface PaymentStatusProps {
  orderId: string;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export default function PaymentStatus({ 
  orderId, 
  onClose, 
  onPaymentSuccess 
}: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatusType | null>(null);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleCheckStatus = async () => {
    setLoading(true);
    
    try {
      const result = await checkPaymentStatus(orderId);
      setStatus(result);
      
      if (result.status === 'paid') {
        const message = ToastMessages.success.process('Thanh toán');
        showSuccess(message.title, 'Thanh toán thành công! Bạn đã được thêm vào phòng.');
        onPaymentSuccess?.();
      } else if (result.status === 'failed') {
        showError('Thanh toán thất bại!', result.errorMessage || 'Giao dịch không thành công, vui lòng thử lại');
      }
    } catch (error: any) {
      const message = ToastMessages.error.network();
      showError('Kiểm tra thanh toán thất bại!', error.message || message.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PaymentStatusType['status']) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: PaymentStatusType['status']) => {
    switch (status) {
      case 'paid':
        return <FaCheckCircle className="text-lg" />;
      case 'pending':
        return <FaHourglassHalf className="text-lg" />;
      case 'failed':
        return <FaTimesCircle className="text-lg" />;
      case 'cancelled':
        return <FaBan className="text-lg" />;
      default:
        return <FaQuestionCircle className="text-lg" />;
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

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Trạng thái thanh toán</h2>
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
          {/* Order ID */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Mã đơn hàng</h3>
            <p className="font-mono text-sm text-gray-600 break-all">{orderId}</p>
          </div>

          {/* Check Status Button */}
          <div className="text-center mb-6">
            <button
              onClick={handleCheckStatus}
              disabled={loading}
              className="px-6 py-3 bg-teal-600 text-white font-semibold rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 mx-auto"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Kiểm tra trạng thái
                </>
              )}
            </button>
          </div>

          {/* Status Display */}
          {status && (
            <div className="space-y-4">
              {/* Status Badge */}
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(status.status)}`}>
                  {getStatusIcon(status.status)}
                  <span className="font-semibold">{formatPaymentStatus(status.status)}</span>
                </div>
              </div>

              {/* Status Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Chi tiết giao dịch</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Mã đơn hàng:</span>
                    <span className="font-mono text-gray-900">{status.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Trạng thái:</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status.status)}`}>
                      {formatPaymentStatus(status.status)}
                    </span>
                  </div>
                  {status.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Thời gian thanh toán:</span>
                      <span className="text-gray-900">{formatDate(status.paidAt)}</span>
                    </div>
                  )}
                  {status.paymentMethod && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="text-gray-900 capitalize">{status.paymentMethod}</span>
                    </div>
                  )}
                  {status.errorMessage && (
                    <div className="mt-3 p-2 bg-red-50 rounded text-sm border border-red-200">
                      <span className="font-medium text-red-900">Lỗi: </span>
                      <span className="text-red-800">{status.errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Success Message */}
              {status.status === 'paid' && (
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaCheckCircle className="text-green-600" />
                    <h4 className="font-semibold text-green-900">Thanh toán thành công!</h4>
                  </div>
                  <p className="text-sm text-green-800">
                    Cảm ơn bạn đã thanh toán. Bạn đã được tự động thêm vào phòng và có thể bắt đầu sử dụng dịch vụ.
                  </p>
                </div>
              )}

              {/* Failed Message */}
              {status.status === 'failed' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaExclamationTriangle className="text-red-600" />
                    <h4 className="font-semibold text-red-900">Thanh toán thất bại</h4>
                  </div>
                  <p className="text-sm text-red-800">
                    Giao dịch không thành công. Vui lòng kiểm tra lại thông tin và thử lại.
                  </p>
                </div>
              )}

              {/* Pending Message */}
              {status.status === 'pending' && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <FaHourglassHalf className="text-yellow-600" />
                    <h4 className="font-semibold text-yellow-900">Đang chờ thanh toán</h4>
                  </div>
                  <p className="text-sm text-yellow-800">
                    Giao dịch đang được xử lý. Vui lòng hoàn tất thanh toán trên ứng dụng ZaloPay.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-6 border-t border-gray-200 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Đóng
            </button>
            {status?.status === 'paid' && onPaymentSuccess && (
              <button
                onClick={() => {
                  onPaymentSuccess();
                  onClose();
                }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Hoàn tất
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
