"use client";

import { useState, useEffect } from "react";
import { getRentalHistory, RentalHistoryItem, formatHistoryStatus, formatCurrency } from "@/services/rentalHistory";
import { useToast } from "@/contexts/ToastContext";
import { extractApiErrorMessage } from "@/utils/api";
import { FaBuilding, FaDoorOpen, FaCalendarAlt, FaMoneyBillWave, FaInfoCircle } from "react-icons/fa";
import Link from "next/link";

interface RentalHistoryProps {
  onCountChange?: (count: number) => void;
}

export default function RentalHistory({ onCountChange }: RentalHistoryProps) {
  const [history, setHistory] = useState<RentalHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { showError } = useToast();

  useEffect(() => {
    loadHistory();
  }, [page]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getRentalHistory({ page, limit: 10 });
      setHistory(response.history || []);
      setTotalPages(response.pagination?.totalPages || 1);
      const total = response.pagination?.total || 0;
      setTotalCount(total);
      
      // Notify parent component về số lượng
      if (onCountChange) {
        onCountChange(total);
      }
    } catch (error: any) {
      // Nếu lỗi 400 "User not found" - có thể do API chưa implement
      // Chỉ set history = [] và không show error toast để tránh làm phiền user
      if (error?.status === 400 || error?.body?.statusCode === 400) {
        console.warn('Rental history API chưa implement hoặc có lỗi:', error);
        setHistory([]);
        setTotalCount(0);
        if (onCountChange) {
          onCountChange(0);
        }
      } else {
        const message = extractApiErrorMessage(error);
        showError("Không thể tải lịch sử thuê", message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Đang tải lịch sử...</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaInfoCircle className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có lịch sử thuê</h3>
          <p className="text-gray-600">
            Bạn chưa có lịch sử thuê phòng nào. Các hợp đồng đã hủy hoặc hết hạn sẽ hiển thị ở đây.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Lịch sử thuê phòng</h2>
        </div>
      </div>

      {/* History List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {history.map((item) => (
          <div 
            key={item.contractId} 
            className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Image */}
            {item.images && item.images.length > 0 && (
              <div className="relative h-48 bg-gray-200">
                <img 
                  src={item.images[0]} 
                  alt={`Phòng ${item.roomNumber}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    item.contractStatus === 'expired' 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {formatHistoryStatus(item.contractStatus)}
                  </span>
                </div>
              </div>
            )}

            {/* Content */}
            <div className="p-5">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  Phòng {item.roomNumber}
                </h3>
                <div className="flex items-center text-sm text-gray-600">
                  <FaBuilding className="mr-2 text-gray-400" />
                  <span>{item.buildingName}</span>
                </div>
                {item.address && (
                  <p className="text-xs text-gray-500 mt-1">{item.address}</p>
                )}
              </div>

              {/* Info Grid */}
              <div className="space-y-2.5 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 flex items-center">
                    <FaCalendarAlt className="mr-2 text-gray-400 w-4" />
                    Thời gian thuê:
                  </span>
                  <span className="font-medium text-gray-900">
                    {item.totalMonthsRented || 0} tháng
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Bắt đầu:</span>
                  <span className="text-gray-900">
                    {new Date(item.startDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Kết thúc:</span>
                  <span className="text-gray-900">
                    {new Date(item.actualEndDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                  <span className="text-gray-600 flex items-center">
                    <FaMoneyBillWave className="mr-2 text-gray-400 w-4" />
                    Tiền thuê/tháng:
                  </span>
                  <span className="font-semibold text-green-600">
                    {item.monthlyRent.toLocaleString()} đ
                  </span>
                </div>

                {item.totalAmountPaid && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tổng đã trả:</span>
                    <span className="font-semibold text-gray-900">
                      {item.totalAmountPaid.toLocaleString()} đ
                    </span>
                  </div>
                )}
              </div>

              {/* Termination Reason */}
              {item.terminationReason && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <p className="text-xs font-medium text-gray-700 mb-1">Lý do hủy:</p>
                  <p className="text-sm text-gray-600">{item.terminationReason}</p>
                </div>
              )}

              {/* Landlord Info */}
              <div className="border-t border-gray-100 pt-3 mb-3">
                <p className="text-xs font-medium text-gray-700 mb-2">Chủ trọ</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.landlordInfo.name}</span>
                  <a 
                    href={`tel:${item.landlordInfo.phone}`}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    {item.landlordInfo.phone}
                  </a>
                </div>
              </div>

              {/* Action Button - Thuê lại */}
              {item.activePostId ? (
                <Link 
                  href={`/room_details/${item.activePostId}`}
                  className="block w-full text-center bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-2.5 px-4 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Thuê lại phòng này
                </Link>
              ) : (
                <Link 
                  href="/find_share"
                  className="block w-full text-center bg-gray-400 hover:bg-gray-500 text-white py-2.5 px-4 rounded-lg transition-all duration-300 font-medium shadow-md hover:shadow-lg"
                >
                  Tìm phòng khác
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="text-sm text-gray-600">
            Trang {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}

