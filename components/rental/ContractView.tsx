"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserContract, downloadContractPDF, formatContractStatus, calculateContractDaysLeft } from "@/services/rentalRequests";
import { formatCurrency, getContractPaymentStatus, RoomPaymentStatus } from "@/services/payments";
import { useToast } from "@/contexts/ToastContext";
import { ToastMessages } from "@/utils/toastMessages";
import PaymentQR from "@/components/payments/PaymentQR";
import { getRoomById } from "@/services/rooms";
import { getUserById } from "@/services/user";
import { getUserVerification } from "@/services/verification";
import { FaMoneyBillWave, FaCheckCircle } from "react-icons/fa";

interface ContractViewProps {
  contractId: number;
}

export default function ContractView({ contractId }: ContractViewProps) {
  const [contract, setContract] = useState<any>(null);
  const [roomCategory, setRoomCategory] = useState<string | undefined>(undefined);
  const [roomData, setRoomData] = useState<any>(null);
  const [tenantInfo, setTenantInfo] = useState<{ fullName?: string; phone?: string; email?: string; cccd?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [contractPaymentStatus, setContractPaymentStatus] = useState<RoomPaymentStatus | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { showError, showSuccess } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

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
          const data = await getUserContract(contractId);
          setContract(data);
          
          // Fetch room category và utilities từ roomId
          if (data.roomId) {
            try {
              const room = await getRoomById(data.roomId);
              setRoomCategory((room as any)?.category);
              setRoomData(room);
              // Lưu ý: API rooms/{id}?include=building hiện tại không trả về building data cho phòng trọ
              // Đã tạo file api_requirements/room-building-api.md để yêu cầu BE cập nhật
            } catch (err) {
              // Silently fail nếu không fetch được room info
            }
          }
          
          // Fetch tenant info từ tenantId
          if (data.tenants && data.tenants.length > 0) {
            try {
              const tenant = await getUserById(data.tenants[0].tenantId);
              let cccd: string | undefined = undefined;
              
              // Fetch verification để lấy số CCCD
              try {
                const verificationResponse = await getUserVerification(data.tenants[0].tenantId);
                const verification = verificationResponse?.verification || verificationResponse?.data || verificationResponse;
                cccd = (verification as any)?.idNumber || (verificationResponse as any)?.idNumber;
              } catch (verificationErr) {
                // Silently fail nếu không fetch được verification
              }
              
              setTenantInfo({
                fullName: (tenant as any)?.fullName || (tenant as any)?.name || 'N/A',
                phone: (tenant as any)?.phone || (tenant as any)?.phoneNumber || 'N/A',
                email: (tenant as any)?.email || 'N/A',
                cccd: cccd || 'N/A'
              });
            } catch (err) {
              // Silently fail nếu không fetch được tenant info
            }
          }
        } catch (error: any) {
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRoomCategory = (category?: string) => {
    if (!category) return 'N/A';
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

  const calculateContractMonths = (startDate: string, endDate: string): number => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return months;
  };

  const formatDirection = (dir?: string) => {
    if (!dir) return undefined;
    const map: Record<string, string> = {
      'dong': 'Đông',
      'tay': 'Tây',
      'nam': 'Nam',
      'bac': 'Bắc',
      'dong-nam': 'Đông Nam',
      'dong-bac': 'Đông Bắc',
      'tay-nam': 'Tây Nam',
      'tay-bac': 'Tây Bắc',
    };
    return map[dir] || dir;
  };

  const formatLegalStatus = (status?: string) => {
    if (!status) return undefined;
    const map: Record<string, string> = {
      'co-so-hong': 'Có sổ hồng',
      'dang-ky': 'Đang đăng ký',
      'chua-dang-ky': 'Chưa đăng ký',
    };
    return map[status] || status;
  };

  const formatPropertyType = (type?: string) => {
    if (!type) return undefined;
    const map: Record<string, string> = {
      'chung-cu': 'Chung cư',
      'can-ho-dv': 'Căn hộ dịch vụ',
      'officetel': 'Officetel',
      'studio': 'Studio',
      'nha-pho': 'Nhà phố',
      'biet-thu': 'Biệt thự',
      'nha-hem': 'Nhà hẻm',
      'nha-cap4': 'Nhà cấp 4',
    };
    return map[type] || type;
  };

  const formatFurniture = (furniture?: string) => {
    if (!furniture) return 'N/A';
    const map: Record<string, string> = {
      'full': 'Nội thất đầy đủ',
      'co-ban': 'Nội thất cơ bản',
      'trong': 'Nhà trống',
    };
    return map[furniture] || furniture;
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
                {/* 1. Thông tin định danh */}
                {roomData?.chungCuInfo?.unitCode && (
                  <p><strong>Mã căn hộ:</strong> {roomData.chungCuInfo.unitCode}</p>
                )}
                {roomData?.nhaNguyenCanInfo?.unitCode && (
                  <p><strong>Mã nhà:</strong> {roomData.nhaNguyenCanInfo.unitCode}</p>
                )}
                {roomCategory === 'phong-tro' && (
                  <p><strong>Mã phòng:</strong> {contract.roomInfo.roomNumber}</p>
                )}
                {!(roomData?.chungCuInfo?.unitCode || roomData?.nhaNguyenCanInfo?.unitCode) && roomCategory !== 'phong-tro' && (
                <p><strong>Phòng:</strong> {contract.roomInfo.roomNumber}</p>
                )}
                
                {/* 2. Loại */}
                {roomCategory === 'chung-cu' && roomData?.chungCuInfo?.propertyType && (
                  <p><strong>Loại căn hộ:</strong> {formatPropertyType(roomData.chungCuInfo.propertyType)}</p>
                )}
                {roomCategory === 'nha-nguyen-can' && roomData?.nhaNguyenCanInfo?.propertyType && (
                  <p><strong>Loại nhà:</strong> {formatPropertyType(roomData.nhaNguyenCanInfo.propertyType)}</p>
                )}
                {roomCategory === 'phong-tro' && (
                  <p><strong>Loại phòng:</strong> {formatRoomCategory(roomCategory)}</p>
                )}
                
                {/* 3. Vị trí */}
                {roomCategory === 'chung-cu' && roomData?.chungCuInfo && (
                  <>
                    {roomData.chungCuInfo.buildingName && (
                      <p><strong>Tòa nhà:</strong> {roomData.chungCuInfo.buildingName}</p>
                    )}
                    {roomData.chungCuInfo.blockOrTower && (
                      <p><strong>Block/Tower:</strong> {roomData.chungCuInfo.blockOrTower}</p>
                    )}
                    {roomData.chungCuInfo.floorNumber && (
                      <p><strong>Tầng:</strong> {roomData.chungCuInfo.floorNumber}</p>
                    )}
                  </>
                )}
                {roomCategory === 'nha-nguyen-can' && (
                  <>
                    {roomData?.building?.name && (
                      <p><strong>Tòa nhà:</strong> {roomData.building.name}</p>
                    )}
                    {roomData?.nhaNguyenCanInfo?.khuLo && (
                      <p><strong>Khu/Lô:</strong> {roomData.nhaNguyenCanInfo.khuLo}</p>
                    )}
                  </>
                )}
                {roomCategory === 'phong-tro' && (
                  <>
                    {roomData?.building?.name && (
                      <p><strong>Tòa nhà:</strong> {roomData.building.name}</p>
                    )}
                    {roomData?.floor && (
                      <p><strong>Tầng:</strong> {roomData.floor}</p>
                    )}
                  </>
                )}
                
                {/* 4. Diện tích */}
                <p><strong>Diện tích:</strong> {contract.roomInfo.area}m²</p>
                {roomCategory === 'nha-nguyen-can' && roomData?.nhaNguyenCanInfo && (
                  <>
                    {roomData.nhaNguyenCanInfo.usableArea !== undefined && roomData.nhaNguyenCanInfo.usableArea !== null && roomData.nhaNguyenCanInfo.usableArea > 0 && (
                      <p><strong>Diện tích sử dụng:</strong> {roomData.nhaNguyenCanInfo.usableArea}m²</p>
                    )}
                  </>
                )}
                
                {/* 5. Cấu trúc */}
                {(roomData?.bedrooms || roomData?.chungCuInfo?.bedrooms || roomData?.nhaNguyenCanInfo?.bedrooms) && (
                  <p><strong>Phòng ngủ:</strong> {roomData.bedrooms || roomData.chungCuInfo?.bedrooms || roomData.nhaNguyenCanInfo?.bedrooms}</p>
                )}
                {(roomData?.bathrooms || roomData?.chungCuInfo?.bathrooms || roomData?.nhaNguyenCanInfo?.bathrooms) && (
                  <p><strong>Phòng tắm:</strong> {roomData.bathrooms || roomData.chungCuInfo?.bathrooms || roomData.nhaNguyenCanInfo?.bathrooms}</p>
                )}
                {roomCategory === 'nha-nguyen-can' && roomData?.nhaNguyenCanInfo?.totalFloors && (
                  <p><strong>Số tầng:</strong> {roomData.nhaNguyenCanInfo.totalFloors}</p>
                )}
                
                {/* 6. Đặc điểm */}
                {roomData?.furniture && (
                  <p><strong>Nội thất:</strong> {formatFurniture(roomData.furniture)}</p>
                )}
                {roomCategory === 'nha-nguyen-can' && roomData?.nhaNguyenCanInfo?.legalStatus && (
                  <p><strong>Tình trạng pháp lý:</strong> {formatLegalStatus(roomData.nhaNguyenCanInfo.legalStatus)}</p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Thông tin tài chính</h3>
              <div className="space-y-2 text-sm">
                <p><strong>Tiền thuê/tháng:</strong> {formatCurrency(contract.monthlyRent)}</p>
                <p><strong>Tiền cọc:</strong> {formatCurrency(contract.deposit)}</p>
                
                {roomData?.utilities && (
                  <>
                    {roomData.utilities.electricityPricePerKwh !== undefined && roomData.utilities.electricityPricePerKwh !== null && roomData.utilities.electricityPricePerKwh > 0 && (
                      <p>
                        <strong>Giá điện:</strong> {formatCurrency(roomData.utilities.electricityPricePerKwh)}/kWh
                        {roomData.utilities.includedInRent?.electricity && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.waterPrice !== undefined && roomData.utilities.waterPrice !== null && roomData.utilities.waterPrice > 0 && (
                      <p>
                        <strong>Giá nước:</strong> {formatCurrency(roomData.utilities.waterPrice)}
                        {roomData.utilities.waterBillingType === 'per_m3' ? '/khối' : roomData.utilities.waterBillingType === 'per_person' ? '/người' : '/khối'}
                        {roomData.utilities.includedInRent?.water && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.internetFee !== undefined && roomData.utilities.internetFee !== null && roomData.utilities.internetFee > 0 && (
                      <p>
                        <strong>Phí Internet:</strong> {formatCurrency(roomData.utilities.internetFee)}/tháng
                        {roomData.utilities.includedInRent?.internet && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.garbageFee !== undefined && roomData.utilities.garbageFee !== null && roomData.utilities.garbageFee > 0 && (
                      <p>
                        <strong>Phí rác:</strong> {formatCurrency(roomData.utilities.garbageFee)}/tháng
                        {roomData.utilities.includedInRent?.garbage && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.cleaningFee !== undefined && roomData.utilities.cleaningFee !== null && roomData.utilities.cleaningFee > 0 && (
                      <p>
                        <strong>Phí dọn dẹp:</strong> {formatCurrency(roomData.utilities.cleaningFee)}/tháng
                        {roomData.utilities.includedInRent?.cleaning && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.managementFee !== undefined && roomData.utilities.managementFee !== null && roomData.utilities.managementFee > 0 && (
                      <p>
                        <strong>Phí quản lý:</strong> {formatCurrency(roomData.utilities.managementFee)}
                        {roomData.utilities.managementFeeUnit === 'per_m2_per_month' ? '/m²/tháng' : '/tháng'}
                        {roomData.utilities.includedInRent?.managementFee && <span className="text-green-600 ml-2">(Đã bao trong tiền thuê)</span>}
                      </p>
                    )}
                    {roomData.utilities.parkingMotorbikeFee !== undefined && roomData.utilities.parkingMotorbikeFee !== null && roomData.utilities.parkingMotorbikeFee > 0 && (
                      <p><strong>Phí gửi xe máy:</strong> {formatCurrency(roomData.utilities.parkingMotorbikeFee)}/tháng</p>
                    )}
                    {roomData.utilities.parkingCarFee !== undefined && roomData.utilities.parkingCarFee !== null && roomData.utilities.parkingCarFee > 0 && (
                      <p><strong>Phí gửi xe ô tô:</strong> {formatCurrency(roomData.utilities.parkingCarFee)}/tháng</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Thông tin hợp đồng */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              Thông tin hợp đồng ({calculateContractMonths(contract.startDate, contract.endDate)} tháng)
            </h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <p><strong>Loại hợp đồng:</strong> {contract.contractType === 'single' ? 'Đơn lẻ' : 'Chung'}</p>
                <p><strong>Ngày bắt đầu:</strong> {formatDate(contract.startDate)}</p>
                <p><strong>Ngày kết thúc:</strong> {formatDate(contract.endDate)}</p>
              </div>
              <div className="space-y-2">
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
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p><strong>Họ tên:</strong> {tenantInfo?.fullName || 'N/A'}</p>
                  <p><strong>Số điện thoại:</strong> {tenantInfo?.phone || 'N/A'}</p>
                  <p><strong>Số CCCD:</strong> {tenantInfo?.cccd || 'N/A'}</p>
                </div>
                <div className="space-y-2">
                  <p><strong>Email:</strong> {tenantInfo?.email || 'N/A'}</p>
                <p><strong>Trạng thái:</strong> {contract.tenants[0].status === 'active' ? 'Đang hoạt động' : 'Không hoạt động'}</p>
                </div>
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
            <div className="space-y-3 text-sm">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 text-xs">
                  <strong>Lưu ý:</strong> Nếu bạn hủy hợp đồng trước thời hạn thì sẽ không được nhận lại tiền cọc.
                </p>
              </div>
              <div className="flex justify-end">
                <p><strong>Ngày tạo:</strong> {formatDateTime(contract.createdAt)}</p>
              </div>
            </div>
          </div>

          {/* Trạng thái thanh toán đơn giản */}
          {contractPaymentStatus && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FaMoneyBillWave className="text-teal-600" />
                Trạng thái thanh toán
              </h3>
              
              {contractPaymentStatus.paymentStatus === 'fully_paid' ? (
                <div className="text-center py-4">
                  <div className="text-green-600 text-lg font-medium mb-2 flex items-center justify-center gap-2">
                    <FaCheckCircle className="text-green-600" />
                    Đã thanh toán đầy đủ
                  </div>
                  <p className="text-gray-600 text-sm">
                    Tất cả hóa đơn đã được thanh toán. Hợp đồng hoạt động bình thường.
                  </p>
                  <a href="/my-rentals?tab=invoices" className="text-blue-600 hover:text-blue-800 text-sm underline mt-2 inline-block">
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
            
            <button
              onClick={() => {
                const returnUrl = searchParams.get('returnUrl');
                if (returnUrl) {
                  router.push(returnUrl);
                } else {
                  router.back();
                }
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Quay lại danh sách
            </button>
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
